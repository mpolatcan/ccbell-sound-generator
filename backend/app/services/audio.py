"""Audio generation service using Stable Audio Open."""

import asyncio
import contextlib
import uuid
from collections.abc import Awaitable, Callable
from pathlib import Path

from loguru import logger

from app.core.config import settings
from app.core.models import GenerateRequest, GenerationSettings
from app.services.model_loader import model_loader


class AudioGenerationJob:
    """Represents an audio generation job."""

    def __init__(self, job_id: str, request: GenerateRequest):
        self.job_id = job_id
        self.request = request
        self.status = "queued"
        self.progress = 0.0
        self.stage = "queued"
        self.audio_path: Path | None = None
        self.error: str | None = None

    def __repr__(self) -> str:
        return f"AudioGenerationJob(id={self.job_id}, status={self.status}, model={self.request.model})"


class AudioService:
    """Service for generating audio using Stable Audio Open models."""

    def __init__(self):
        self._jobs: dict[str, AudioGenerationJob] = {}
        self._progress_callbacks: dict[
            str, list[Callable[[float, str, str | None], Awaitable[None]]]
        ] = {}
        logger.debug("AudioService initialized")

    def create_job(self, request: GenerateRequest) -> str:
        """Create a new generation job and return its ID."""
        job_id = str(uuid.uuid4())
        job = AudioGenerationJob(job_id, request)
        self._jobs[job_id] = job
        logger.info(f"Created job {job_id}: model={request.model}, hook={request.hook_type}")
        logger.debug(f"Job details: prompt='{request.prompt[:50]}...' duration={request.duration}s")
        return job_id

    def get_job(self, job_id: str) -> AudioGenerationJob | None:
        """Get a job by its ID."""
        return self._jobs.get(job_id)

    def register_progress_callback(
        self, job_id: str, callback: Callable[[float, str, str | None], Awaitable[None]]
    ):
        """Register a callback for progress updates."""
        if job_id not in self._progress_callbacks:
            self._progress_callbacks[job_id] = []
        self._progress_callbacks[job_id].append(callback)
        logger.debug(f"Registered progress callback for job {job_id}")

    def unregister_progress_callback(
        self, job_id: str, callback: Callable[[float, str, str | None], Awaitable[None]]
    ):
        """Unregister a progress callback."""
        if job_id in self._progress_callbacks:
            with contextlib.suppress(ValueError):
                self._progress_callbacks[job_id].remove(callback)
                logger.debug(f"Unregistered progress callback for job {job_id}")

    async def _notify_progress(
        self, job_id: str, progress: float, stage: str, audio_url: str | None = None
    ):
        """Notify all registered callbacks of progress."""
        job = self._jobs.get(job_id)
        if job:
            job.progress = progress
            job.stage = stage
            logger.debug(f"Job {job_id}: progress={progress * 100:.0f}%, stage={stage}")

        if job_id in self._progress_callbacks:
            for callback in self._progress_callbacks[job_id]:
                try:
                    await callback(progress, stage, audio_url)
                except Exception as e:
                    logger.error(f"Error in progress callback for job {job_id}: {e}")
                    logger.opt(exception=True).debug("Progress callback error traceback:")

    async def generate_audio(self, job_id: str) -> Path:
        """
        Generate audio for a job.

        Returns:
            Path to the generated audio file.
        """
        logger.info(f"Starting audio generation for job {job_id}")

        # Lazy import torch and related modules
        try:
            import torch
            import torchaudio
        except ImportError as e:
            error_msg = f"PyTorch/torchaudio not installed: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e

        job = self._jobs.get(job_id)
        if not job:
            error_msg = f"Job not found: {job_id}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        try:
            job.status = "processing"
            logger.info(f"Job {job_id}: loading model {job.request.model}")
            await self._notify_progress(job_id, 0.05, "loading_model")

            # Load the model
            model, model_config = await model_loader.load_model(job.request.model)
            await self._notify_progress(job_id, 0.2, "preparing")

            # Get generation parameters
            gen_settings = job.request.settings or GenerationSettings()

            # Set defaults based on model
            if job.request.model == "small":
                steps = gen_settings.steps or settings.default_steps_small
                cfg_scale = (
                    gen_settings.cfg_scale
                    if gen_settings.cfg_scale is not None
                    else settings.default_cfg_scale
                )
                sampler = gen_settings.sampler or settings.default_sampler_small
            else:
                steps = gen_settings.steps or settings.default_steps_large
                cfg_scale = (
                    gen_settings.cfg_scale
                    if gen_settings.cfg_scale is not None
                    else settings.default_cfg_scale
                )
                sampler = gen_settings.sampler or settings.default_sampler_large

            # Validate duration
            max_duration = (
                settings.max_duration_small
                if job.request.model == "small"
                else settings.max_duration_large
            )
            duration = min(job.request.duration, max_duration)
            if job.request.duration > max_duration:
                logger.warning(
                    f"Job {job_id}: requested duration {job.request.duration}s "
                    f"exceeds max {max_duration}s, using {duration}s"
                )

            # Set seed if provided
            if gen_settings.seed is not None:
                torch.manual_seed(gen_settings.seed)
                logger.debug(f"Job {job_id}: using seed {gen_settings.seed}")

            # Log generation parameters
            logger.info(
                f"Job {job_id}: generation params - steps={steps}, cfg={cfg_scale}, sampler={sampler}"
            )
            logger.debug(f"Job {job_id}: prompt='{job.request.prompt[:100]}...'")

            await self._notify_progress(job_id, 0.3, "generating")

            # Import generation function
            from stable_audio_tools.inference.generation import generate_diffusion_cond

            # Set up conditioning
            conditioning = [
                {"prompt": job.request.prompt, "seconds_start": 0, "seconds_total": duration}
            ]

            # Generate audio
            # Run generation in executor to not block event loop
            loop = asyncio.get_running_loop()

            def do_generate():
                logger.debug(f"Job {job_id}: starting diffusion generation")
                with torch.no_grad():
                    output = generate_diffusion_cond(
                        model,
                        steps=steps,
                        cfg_scale=cfg_scale,
                        conditioning=conditioning,
                        sample_size=int(duration * model_config["sample_rate"]),
                        sigma_min=0.3,
                        sigma_max=500,
                        sampler_type=sampler,
                        device=model_loader.device,
                    )
                logger.debug(f"Job {job_id}: diffusion generation complete")
                return output

            output = await loop.run_in_executor(None, do_generate)

            await self._notify_progress(job_id, 0.8, "processing_audio")

            # Process output
            output = output.squeeze(0).cpu()
            logger.debug(f"Job {job_id}: audio tensor shape={output.shape}")

            # Ensure stereo (2 channels)
            if output.dim() == 1:
                output = output.unsqueeze(0).repeat(2, 1)
                logger.debug(f"Job {job_id}: converted mono to stereo")
            elif output.shape[0] == 1:
                output = output.repeat(2, 1)
                logger.debug(f"Job {job_id}: duplicated single channel to stereo")
            elif output.shape[0] > 2:
                output = output[:2, :]
                logger.debug(f"Job {job_id}: trimmed to 2 channels")

            await self._notify_progress(job_id, 0.9, "saving")

            # Save to file
            output_path = settings.temp_audio_dir / f"{job_id}.wav"
            logger.debug(f"Job {job_id}: saving audio to {output_path}")

            # Normalize audio
            max_val = output.abs().max()
            if max_val > 0:
                output = output / max_val * 0.95
                logger.debug(f"Job {job_id}: normalized audio (max_val={max_val:.4f})")

            # Save using torchaudio
            sample_rate = model_config["sample_rate"]
            torchaudio.save(str(output_path), output, sample_rate)

            job.audio_path = output_path
            job.status = "complete"
            logger.info(f"Job {job_id}: audio generated successfully")
            logger.info(f"Job {job_id}: saved to {output_path} ({sample_rate} Hz)")

            audio_url = f"/api/audio/{job_id}"
            await self._notify_progress(job_id, 1.0, "complete", audio_url)

            return output_path

        except Exception as e:
            logger.error(f"Job {job_id}: error generating audio: {e}")
            logger.opt(exception=True).debug("Audio generation error traceback:")
            job.status = "error"
            job.error = str(e)
            await self._notify_progress(job_id, 0.0, "error")
            raise

    def get_audio_path(self, job_id: str) -> Path | None:
        """Get the path to the generated audio file."""
        job = self._jobs.get(job_id)
        if job and job.audio_path and job.audio_path.exists():
            return job.audio_path
        return None

    def cleanup_job(self, job_id: str):
        """Clean up a job and its associated files."""
        job = self._jobs.get(job_id)
        if job:
            if job.audio_path and job.audio_path.exists():
                try:
                    job.audio_path.unlink()
                    logger.info(f"Deleted audio file: {job.audio_path}")
                except Exception as e:
                    logger.error(f"Error deleting audio file {job.audio_path}: {e}")
            del self._jobs[job_id]
            if job_id in self._progress_callbacks:
                del self._progress_callbacks[job_id]
            logger.info(f"Cleaned up job {job_id}")
        else:
            logger.warning(f"Job {job_id} not found for cleanup")


# Global audio service instance
audio_service = AudioService()

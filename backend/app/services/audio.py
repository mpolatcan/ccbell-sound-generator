"""Audio generation service using Stable Audio Open."""

import asyncio
import logging
import uuid
from pathlib import Path
from typing import Optional, Callable, Awaitable, Any

from app.core.config import settings
from app.core.models import GenerateRequest, GenerationSettings
from app.services.model_loader import model_loader

logger = logging.getLogger(__name__)


class AudioGenerationJob:
    """Represents an audio generation job."""

    def __init__(self, job_id: str, request: GenerateRequest):
        self.job_id = job_id
        self.request = request
        self.status = "queued"
        self.progress = 0.0
        self.stage = "queued"
        self.audio_path: Optional[Path] = None
        self.error: Optional[str] = None


class AudioService:
    """Service for generating audio using Stable Audio Open models."""

    def __init__(self):
        self._jobs: dict[str, AudioGenerationJob] = {}
        self._progress_callbacks: dict[str, list[Callable[[float, str], Awaitable[None]]]] = {}

    def create_job(self, request: GenerateRequest) -> str:
        """Create a new generation job and return its ID."""
        job_id = str(uuid.uuid4())
        job = AudioGenerationJob(job_id, request)
        self._jobs[job_id] = job
        return job_id

    def get_job(self, job_id: str) -> Optional[AudioGenerationJob]:
        """Get a job by its ID."""
        return self._jobs.get(job_id)

    def register_progress_callback(
        self, job_id: str, callback: Callable[[float, str, Optional[str]], Awaitable[None]]
    ):
        """Register a callback for progress updates."""
        if job_id not in self._progress_callbacks:
            self._progress_callbacks[job_id] = []
        self._progress_callbacks[job_id].append(callback)

    def unregister_progress_callback(
        self, job_id: str, callback: Callable[[float, str, Optional[str]], Awaitable[None]]
    ):
        """Unregister a progress callback."""
        if job_id in self._progress_callbacks:
            try:
                self._progress_callbacks[job_id].remove(callback)
            except ValueError:
                pass

    async def _notify_progress(
        self, job_id: str, progress: float, stage: str, audio_url: Optional[str] = None
    ):
        """Notify all registered callbacks of progress."""
        job = self._jobs.get(job_id)
        if job:
            job.progress = progress
            job.stage = stage

        if job_id in self._progress_callbacks:
            for callback in self._progress_callbacks[job_id]:
                try:
                    await callback(progress, stage, audio_url)
                except Exception as e:
                    logger.error(f"Error in progress callback: {e}")

    async def generate_audio(self, job_id: str) -> Path:
        """
        Generate audio for a job.

        Returns:
            Path to the generated audio file.
        """
        # Lazy import torch and related modules
        try:
            import torch
            import torchaudio
        except ImportError as e:
            raise RuntimeError(f"PyTorch/torchaudio not installed: {e}")

        job = self._jobs.get(job_id)
        if not job:
            raise ValueError(f"Job not found: {job_id}")

        try:
            job.status = "processing"
            await self._notify_progress(job_id, 0.05, "loading_model")

            # Load the model
            model, model_config = await model_loader.load_model(job.request.model)
            await self._notify_progress(job_id, 0.2, "preparing")

            # Get generation parameters
            gen_settings = job.request.settings or GenerationSettings()

            # Set defaults based on model
            if job.request.model == "small":
                steps = gen_settings.steps or settings.default_steps_small
                cfg_scale = gen_settings.cfg_scale if gen_settings.cfg_scale is not None else settings.default_cfg_scale
                sampler = gen_settings.sampler or settings.default_sampler_small
            else:
                steps = gen_settings.steps or settings.default_steps_large
                cfg_scale = gen_settings.cfg_scale if gen_settings.cfg_scale is not None else settings.default_cfg_scale
                sampler = gen_settings.sampler or settings.default_sampler_large

            # Validate duration
            max_duration = (
                settings.max_duration_small
                if job.request.model == "small"
                else settings.max_duration_large
            )
            duration = min(job.request.duration, max_duration)

            # Set seed if provided
            if gen_settings.seed is not None:
                torch.manual_seed(gen_settings.seed)

            await self._notify_progress(job_id, 0.3, "generating")

            # Import generation function
            from stable_audio_tools.inference.generation import generate_diffusion_cond

            # Set up conditioning
            conditioning = [{
                "prompt": job.request.prompt,
                "seconds_start": 0,
                "seconds_total": duration
            }]

            # Generate audio
            # Run generation in executor to not block event loop
            loop = asyncio.get_event_loop()

            def do_generate():
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
                        device=model_loader.device
                    )
                return output

            output = await loop.run_in_executor(None, do_generate)

            await self._notify_progress(job_id, 0.8, "processing_audio")

            # Process output
            output = output.squeeze(0).cpu()

            # Ensure stereo (2 channels)
            if output.dim() == 1:
                output = output.unsqueeze(0).repeat(2, 1)
            elif output.shape[0] == 1:
                output = output.repeat(2, 1)
            elif output.shape[0] > 2:
                output = output[:2, :]

            await self._notify_progress(job_id, 0.9, "saving")

            # Save to file
            output_path = settings.temp_audio_dir / f"{job_id}.wav"

            # Normalize audio
            max_val = output.abs().max()
            if max_val > 0:
                output = output / max_val * 0.95

            # Save using torchaudio
            torchaudio.save(
                str(output_path),
                output,
                model_config["sample_rate"]
            )

            job.audio_path = output_path
            job.status = "complete"

            audio_url = f"/api/audio/{job_id}"
            await self._notify_progress(job_id, 1.0, "complete", audio_url)

            logger.info(f"Audio generated successfully for job {job_id}")
            return output_path

        except Exception as e:
            logger.error(f"Error generating audio for job {job_id}: {e}")
            job.status = "error"
            job.error = str(e)
            await self._notify_progress(job_id, 0.0, "error")
            raise

    def get_audio_path(self, job_id: str) -> Optional[Path]:
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
                except Exception as e:
                    logger.error(f"Error deleting audio file: {e}")
            del self._jobs[job_id]
            if job_id in self._progress_callbacks:
                del self._progress_callbacks[job_id]


# Global audio service instance
audio_service = AudioService()

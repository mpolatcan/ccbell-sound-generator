"""ML model management with lazy loading.

On HuggingFace Spaces: downloads from HF Hub (primary), GitHub Releases (fallback).
Elsewhere (desktop/local): downloads from GitHub Releases (primary), HF Hub (fallback).
"""

import asyncio
import concurrent.futures
import gc
import importlib.util
import json
import os
import shutil
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Literal

from loguru import logger

from app.core.config import is_hf_spaces, settings

if TYPE_CHECKING:
    from app.core.models import ModelInfo, ModelLoadingStatus

# Lazy import flag
_torch_available: bool | None = None


def _check_torch() -> bool:
    """Check if torch is available."""
    global _torch_available
    if _torch_available is None:
        _torch_available = importlib.util.find_spec("torch") is not None
        if not _torch_available:
            logger.warning("PyTorch not available. Audio generation will not work.")
        else:
            logger.debug("PyTorch is available")
    return _torch_available


def _get_device() -> str:
    """Get the compute device (CUDA > CPU).

    MPS (Apple Metal) is excluded from auto-detection because
    stable-audio-open-small produces unreliable results on MPS
    (NaN output, hangs, prompt drift). MPS remains available as
    an explicit choice via the device selector in the UI.
    """
    if _check_torch():
        import torch

        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            logger.info(f"Using CUDA GPU: {device_name}")
            return "cuda"
        logger.info("Using CPU for inference")
        return "cpu"
    return "cpu"


# Files needed for each model (GitHub Releases naming)
MODEL_FILES = {
    "stable-audio-open-small": {
        "config": "stable-audio-open-small-model_config.json",
        "weights": "stable-audio-open-small-model.safetensors",
    },
}

# Original filenames in HuggingFace repos
HF_MODEL_FILES = {
    "stable-audio-open-small": {
        "config": "model_config.json",
        "weights": "model.safetensors",
    },
}


def _get_model_cache_dir(model_id: str) -> Path:
    """Get the local cache directory for a model."""
    return settings.models_cache_dir / model_id


def _download_file(url: str, dest: Path, progress_callback: Any = None) -> None:
    """Download a file from URL with optional progress reporting.

    Downloads to a .tmp file first, then renames on success to avoid
    partial files from interrupted downloads.
    """
    logger.info(f"Downloading {url} -> {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)

    tmp_path = dest.with_suffix(dest.suffix + ".tmp")

    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as response:
        total_size = int(response.headers.get("Content-Length", 0))
        downloaded = 0

        with open(tmp_path, "wb") as f:
            while True:
                chunk = response.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if progress_callback and total_size > 0:
                    progress_callback(downloaded / total_size)

    # Rename to final path on success
    tmp_path.rename(dest)
    logger.info(f"Downloaded {dest.name} ({downloaded / 1024 / 1024:.1f} MB)")


def _download_from_github(
    model_id: str,
    files: dict[str, str],
    config_path: Path,
    weights_path: Path,
    progress_callback: Any = None,
) -> bool:
    """Try downloading model files from GitHub Releases. Returns True on success."""
    base_url = settings.model_download_base_url
    ok = True

    if not config_path.exists():
        url = f"{base_url}/{files['config']}"
        try:
            _download_file(url, config_path)
        except Exception as e:
            logger.warning(f"GitHub download failed for {files['config']}: {e}")
            ok = False

    if ok and not weights_path.exists():
        url = f"{base_url}/{files['weights']}"
        try:
            _download_file(url, weights_path, progress_callback=progress_callback)
        except Exception as e:
            logger.warning(f"GitHub download failed for {files['weights']}: {e}")
            ok = False
            # Clean up config if weights failed
            if config_path.exists():
                config_path.unlink()

    return config_path.exists() and weights_path.exists()


def _download_from_huggingface(
    model_id: str,
    config_path: Path,
    weights_path: Path,
    cache_dir: Path,
) -> bool:
    """Try downloading model files from HuggingFace Hub. Returns True on success."""
    hf_token = os.environ.get("CCBELL_HF_TOKEN") or os.environ.get("HF_TOKEN")
    if not hf_token:
        logger.debug("No HF token available, skipping HuggingFace download")
        return False

    if model_id not in HF_MODEL_FILES:
        logger.error(f"No HF file mapping for model: {model_id}")
        return False

    hf_files = HF_MODEL_FILES[model_id]

    logger.info("Downloading from HuggingFace Hub...")
    try:
        from huggingface_hub import hf_hub_download, login

        login(token=hf_token, add_to_git_credential=False)

        repo_id = ModelLoader.MODEL_REPOS[model_id]

        if not config_path.exists():
            hf_path = hf_hub_download(repo_id, filename=hf_files["config"], repo_type="model")
            cache_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(hf_path, config_path)

        if not weights_path.exists():
            hf_path = hf_hub_download(repo_id, filename=hf_files["weights"], repo_type="model")
            cache_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(hf_path, weights_path)

        return config_path.exists() and weights_path.exists()
    except Exception as e:
        logger.error(f"HuggingFace download failed: {e}")
        return False


def _ensure_model_files(model_id: str, progress_callback: Any = None) -> tuple[Path, Path]:
    """Ensure model files are available locally, downloading if needed.

    On HuggingFace Spaces: downloads from HF Hub (primary), GitHub Releases (fallback).
    Elsewhere (desktop/local): downloads from GitHub Releases (primary), HF Hub (fallback).

    Returns:
        Tuple of (config_path, weights_path)
    """
    if model_id not in MODEL_FILES:
        raise ValueError(f"Unknown model: {model_id}")

    files = MODEL_FILES[model_id]
    cache_dir = _get_model_cache_dir(model_id)
    config_path = cache_dir / files["config"]
    weights_path = cache_dir / files["weights"]

    # Check if already cached
    if config_path.exists() and weights_path.exists():
        logger.info(f"Model {model_id} found in cache at {cache_dir}")
        return config_path, weights_path

    # Clean up any partial downloads
    for f in cache_dir.glob("*.tmp"):
        f.unlink()
        logger.debug(f"Cleaned up partial download: {f}")

    on_hf_spaces = is_hf_spaces()

    if on_hf_spaces:
        # HF Spaces: try HuggingFace Hub first (same infrastructure, faster)
        logger.info("Running on HuggingFace Spaces, using HF Hub as primary source")
        if _download_from_huggingface(model_id, config_path, weights_path, cache_dir):
            return config_path, weights_path
        logger.warning("HF Hub download failed, falling back to GitHub Releases")
        if _download_from_github(model_id, files, config_path, weights_path, progress_callback):
            return config_path, weights_path
    else:
        # Desktop/local: try GitHub Releases first (no HF account needed)
        if _download_from_github(model_id, files, config_path, weights_path, progress_callback):
            return config_path, weights_path
        logger.warning("GitHub download failed, falling back to HuggingFace Hub")
        if _download_from_huggingface(model_id, config_path, weights_path, cache_dir):
            return config_path, weights_path

    raise RuntimeError(
        f"Failed to download model {model_id}. Check your internet connection and try again."
    )


@dataclass
class LoadingState:
    """Tracks the loading state of a model."""

    status: Literal["idle", "loading", "ready", "error"] = "idle"
    progress: float = 0.0
    stage: str | None = None
    error: str | None = None


class ModelLoader:
    """Manages Stable Audio Open models with lazy loading."""

    # Model HuggingFace repository IDs (used as fallback)
    MODEL_REPOS = {
        "stable-audio-open-small": "stabilityai/stable-audio-open-small",
    }

    def __init__(self):
        self._models: dict[str, Any] = {}
        self._model_configs: dict[str, Any] = {}
        self._current_model: str | None = None
        self._device: str | None = None
        self._loading_states: dict[str, LoadingState] = {
            "stable-audio-open-small": LoadingState(),
        }
        self._loading_lock = asyncio.Lock()
        logger.debug("ModelLoader initialized")

    @property
    def device(self) -> str:
        """Get the compute device."""
        if self._device is None:
            self._device = _get_device()
            logger.debug(f"ModelLoader device set to: {self._device}")
        return self._device

    @property
    def loaded_models(self) -> list[str]:
        """Return list of currently loaded model IDs."""
        return list(self._models.keys())

    @property
    def current_model(self) -> str | None:
        """Return the currently loaded model ID."""
        return self._current_model

    def is_loaded(self, model_id: str) -> bool:
        """Check if a model is currently loaded."""
        return model_id in self._models

    def is_loading(self, model_id: str) -> bool:
        """Check if a model is currently being loaded."""
        return self._loading_states.get(model_id, LoadingState()).status == "loading"

    def is_ready(self, model_id: str) -> bool:
        """Check if a model is ready to use."""
        return self._loading_states.get(model_id, LoadingState()).status == "ready"

    def get_loading_status(self, model_id: str) -> "ModelLoadingStatus":
        """Get the loading status for a specific model."""
        from app.core.models import ModelLoadingStatus

        state = self._loading_states.get(model_id, LoadingState())
        return ModelLoadingStatus(
            model_id=model_id,
            status=state.status,
            progress=state.progress,
            stage=state.stage,
            error=state.error,
        )

    def get_all_loading_status(self) -> dict[str, "ModelLoadingStatus"]:
        """Get loading status for all models."""
        return {model_id: self.get_loading_status(model_id) for model_id in self.MODEL_REPOS}

    def _update_loading_state(
        self,
        model_id: str,
        status: Literal["idle", "loading", "ready", "error"],
        progress: float = 0.0,
        stage: str | None = None,
        error: str | None = None,
    ):
        """Update the loading state for a model."""
        if model_id in self._loading_states:
            self._loading_states[model_id] = LoadingState(
                status=status, progress=progress, stage=stage, error=error
            )
            logger.debug(
                f"Model {model_id} state updated: {status} ({progress * 100:.0f}%) - {stage}"
            )

    async def load_model_background(self, model_id: str) -> None:
        """
        Load a model in the background with progress tracking.
        """
        logger.info(f"Starting background load of model: {model_id}")

        # Prevent concurrent loading
        async with self._loading_lock:
            # If already loading or ready, skip
            if self.is_loading(model_id) or self.is_ready(model_id):
                logger.info(f"Model {model_id} is already loading or ready, skipping")
                return

            # Run the actual loading in a thread pool to avoid blocking
            loop = asyncio.get_running_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                await loop.run_in_executor(executor, self._load_model_sync, model_id)

    def _load_model_sync(self, model_id: str) -> None:
        """Synchronous model loading with progress updates."""
        logger.debug(f"Starting sync load of model: {model_id}")

        if not _check_torch():
            error_msg = "PyTorch is not installed. Cannot load models."
            logger.error(error_msg)
            self._update_loading_state(model_id, "error", error=error_msg)
            return

        if model_id not in self.MODEL_REPOS:
            error_msg = f"Unknown model ID: {model_id}"
            logger.error(error_msg)
            self._update_loading_state(model_id, "error", error=error_msg)
            return

        # If model is already loaded, mark as ready
        if model_id in self._models:
            logger.info(f"Model {model_id} already loaded, using cached version")
            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            return

        logger.info(f"Loading model {model_id}: {self.MODEL_REPOS[model_id]}")
        self._update_loading_state(model_id, "loading", progress=0.1, stage="initializing")

        try:
            # Unload other models to save memory
            self._unload_all_models_sync()
            self._update_loading_state(model_id, "loading", progress=0.15, stage="downloading")

            # Download model files (source depends on environment)
            def download_progress(pct: float):
                # Map download progress to 0.15-0.7 range
                p = 0.15 + pct * 0.55
                self._update_loading_state(model_id, "loading", progress=p, stage="downloading")

            config_path, weights_path = _ensure_model_files(
                model_id, progress_callback=download_progress
            )

            self._update_loading_state(model_id, "loading", progress=0.7, stage="loading_weights")

            # Load model from local files (same as stable_audio_tools.get_pretrained_model)
            from stable_audio_tools.models.factory import create_model_from_config
            from stable_audio_tools.models.utils import load_ckpt_state_dict

            with open(config_path) as f:
                model_config = json.load(f)

            model = create_model_from_config(model_config)
            model.load_state_dict(load_ckpt_state_dict(str(weights_path)))
            logger.info(f"Model weights loaded for {model_id}")

            self._update_loading_state(model_id, "loading", progress=0.8, stage="moving_to_device")

            # Convert to float32 for CPU/MPS inference
            # float16 is extremely slow on CPU, and MPS has incomplete float16 op support
            if self.device in ("cpu", "mps"):
                import torch

                model.pretransform.model_half = False
                model = model.to(torch.float32)
                logger.info(f"Converted model {model_id} to float32 for {self.device} inference")

            # Move to device
            model = model.to(self.device)
            logger.debug(f"Model {model_id} moved to device: {self.device}")

            # Store references
            self._models[model_id] = model
            self._model_configs[model_id] = model_config
            self._current_model = model_id

            # Log model info
            sample_rate = model_config.get("sample_rate", "unknown")
            logger.info(f"Model {model_id} loaded successfully")
            logger.info(f"  - Sample rate: {sample_rate} Hz")
            logger.info(f"  - Device: {self.device}")

            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            logger.info(f"Model {model_id} is ready for use")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to load model {model_id}: {error_msg}")
            logger.opt(exception=True).debug("Model loading traceback:")
            self._update_loading_state(model_id, "error", error=error_msg)

    async def load_model(self, model_id: str) -> tuple[Any, Any]:
        """
        Load a model, unloading others if necessary to manage memory.

        Returns:
            Tuple of (model, model_config)
        """
        logger.info(f"Loading model: {model_id}")

        if not _check_torch():
            error_msg = "PyTorch is not installed. Cannot load models."
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        if model_id not in self.MODEL_REPOS:
            error_msg = f"Unknown model ID: {model_id}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        async with self._loading_lock:
            # If model is already loaded, return it
            if model_id in self._models:
                logger.info(f"Model {model_id} already loaded, returning cached version")
                self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
                return self._models[model_id], self._model_configs[model_id]

            # Run the heavy sync loading in a thread pool
            loop = asyncio.get_running_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                await loop.run_in_executor(executor, self._load_model_sync, model_id)

            # Check if loading succeeded
            if model_id not in self._models:
                state = self._loading_states.get(model_id, LoadingState())
                error_msg = state.error or f"Failed to load model {model_id}"
                raise RuntimeError(error_msg)

            return self._models[model_id], self._model_configs[model_id]

    async def _unload_all_models(self):
        """Unload all models to free memory."""
        for model_id in list(self._models.keys()):
            await self._unload_model(model_id)

    def _unload_all_models_sync(self):
        """Synchronously unload all models to free memory."""
        for model_id in list(self._models.keys()):
            self._unload_model_sync(model_id)

    async def _unload_model(self, model_id: str):
        """Unload a specific model."""
        self._unload_model_sync(model_id)

    def _unload_model_sync(self, model_id: str):
        """Synchronously unload a specific model."""
        if model_id not in self._models:
            logger.debug(f"Model {model_id} not loaded, nothing to unload")
            return

        logger.info(f"Unloading model: {model_id}")

        # Delete model references
        del self._models[model_id]
        del self._model_configs[model_id]

        if self._current_model == model_id:
            self._current_model = None

        # Reset loading state
        self._update_loading_state(model_id, "idle")

        # Force garbage collection
        gc.collect()
        if _check_torch():
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.debug(f"CUDA cache cleared after unloading {model_id}")

        logger.info(f"Model {model_id} unloaded and memory freed")

    def get_model_info(self, model_id: str) -> "ModelInfo":
        """Get information about a model."""
        from app.core.models import ModelInfo

        if model_id == "stable-audio-open-small":
            return ModelInfo(
                id="stable-audio-open-small",
                name="Stable Audio Open Small",
                description="Fast model optimized for short notification sounds on CPU.",
                max_duration=settings.max_duration,
                default_steps=settings.default_steps,
                default_sampler=settings.default_sampler,
                parameters="341 million",
            )
        else:
            raise ValueError(f"Unknown model ID: {model_id}")

    def get_all_models_info(self) -> "list[ModelInfo]":
        """Get information about all available models."""
        return [self.get_model_info(model_id) for model_id in self.MODEL_REPOS]


# Global model loader instance
model_loader = ModelLoader()

"""ML model management with lazy loading."""

import asyncio
import gc
import logging
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

from app.core.config import settings

if TYPE_CHECKING:
    from app.core.models import ModelInfo, ModelLoadingStatus

logger = logging.getLogger(__name__)

# Lazy import flag
_torch_available: bool | None = None
_hf_logged_in: bool = False


def _get_hf_token() -> str | None:
    """Get HuggingFace token from environment or config.

    Checks in order:
    1. HF_TOKEN env var (standard, auto-injected by HuggingFace Spaces)
    2. CCBELL_HF_TOKEN env var (app-specific config)
    3. settings.hf_token (from .env file)
    """
    return os.environ.get("HF_TOKEN") or os.environ.get("CCBELL_HF_TOKEN") or settings.hf_token


def _ensure_hf_login() -> None:
    """Ensure HuggingFace login for gated model access."""
    global _hf_logged_in
    if _hf_logged_in:
        return

    token = _get_hf_token()
    if token:
        try:
            from huggingface_hub import login

            login(token=token, add_to_git_credential=False)
            logger.info("Successfully logged in to HuggingFace")
            _hf_logged_in = True
        except Exception as e:
            logger.warning(f"Failed to login to HuggingFace: {e}")
    else:
        logger.warning(
            "No HuggingFace token configured. "
            "Set HF_TOKEN or CCBELL_HF_TOKEN env var to access gated models."
        )


def _check_torch() -> bool:
    """Check if torch is available."""
    global _torch_available
    if _torch_available is None:
        import importlib.util

        _torch_available = importlib.util.find_spec("torch") is not None
        if not _torch_available:
            logger.warning("PyTorch not available. Audio generation will not work.")
    return _torch_available


def _get_device() -> str:
    """Get the compute device."""
    if _check_torch():
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    return "cpu"


@dataclass
class LoadingState:
    """Tracks the loading state of a model."""

    status: Literal["idle", "loading", "ready", "error"] = "idle"
    progress: float = 0.0
    stage: str | None = None
    error: str | None = None


class ModelLoader:
    """Manages Stable Audio Open models with lazy loading."""

    # Model HuggingFace repository IDs
    MODEL_REPOS = {
        "small": "stabilityai/stable-audio-open-small",
        "1.0": "stabilityai/stable-audio-open-1.0",
    }

    def __init__(self):
        self._models: dict[str, Any] = {}
        self._model_configs: dict[str, Any] = {}
        self._current_model: str | None = None
        self._device: str | None = None
        self._loading_states: dict[str, LoadingState] = {
            "small": LoadingState(),
            "1.0": LoadingState(),
        }
        self._loading_lock = asyncio.Lock()

    @property
    def device(self) -> str:
        if self._device is None:
            self._device = _get_device()
            logger.info(f"ModelLoader using device: {self._device}")
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

    async def load_model_background(self, model_id: Literal["small", "1.0"]) -> None:
        """
        Load a model in the background with progress tracking.
        """
        # Prevent concurrent loading
        async with self._loading_lock:
            # If already loading or ready, skip
            if self.is_loading(model_id) or self.is_ready(model_id):
                logger.info(f"Model {model_id} is already loading or ready")
                return

            # Run the actual loading in a thread pool to avoid blocking
            import concurrent.futures

            loop = asyncio.get_running_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                await loop.run_in_executor(executor, self._load_model_sync, model_id)

    def _load_model_sync(self, model_id: str) -> None:
        """Synchronous model loading with progress updates."""
        if not _check_torch():
            self._update_loading_state(
                model_id, "error", error="PyTorch is not installed. Cannot load models."
            )
            return

        if model_id not in self.MODEL_REPOS:
            self._update_loading_state(model_id, "error", error=f"Unknown model ID: {model_id}")
            return

        # If model is already loaded, mark as ready
        if model_id in self._models:
            logger.info(f"Model {model_id} already loaded")
            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            return

        logger.info(f"Starting background load of model: {model_id}")
        self._update_loading_state(model_id, "loading", progress=0.1, stage="initializing")

        try:
            # Ensure HuggingFace login for gated models
            _ensure_hf_login()

            # Unload other models to save memory
            self._unload_all_models_sync()
            self._update_loading_state(model_id, "loading", progress=0.2, stage="downloading")

            # Import stable_audio_tools here to avoid loading at startup
            from stable_audio_tools import get_pretrained_model

            self._update_loading_state(model_id, "loading", progress=0.3, stage="loading_weights")

            # Load the model
            model, model_config = get_pretrained_model(self.MODEL_REPOS[model_id])

            self._update_loading_state(model_id, "loading", progress=0.8, stage="moving_to_device")

            # Move to device
            model = model.to(self.device)

            # Store references
            self._models[model_id] = model
            self._model_configs[model_id] = model_config
            self._current_model = model_id

            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            logger.info(f"Model {model_id} loaded successfully in background")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to load model {model_id}: {error_msg}")
            self._update_loading_state(model_id, "error", error=error_msg)

    async def load_model(self, model_id: Literal["small", "1.0"]) -> tuple[Any, Any]:
        """
        Load a model, unloading others if necessary to manage memory.

        Returns:
            Tuple of (model, model_config)
        """
        if not _check_torch():
            raise RuntimeError("PyTorch is not installed. Cannot load models.")

        if model_id not in self.MODEL_REPOS:
            raise ValueError(f"Unknown model ID: {model_id}")

        # If model is already loaded, return it
        if model_id in self._models:
            logger.info(f"Model {model_id} already loaded, returning cached version")
            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            return self._models[model_id], self._model_configs[model_id]

        # Unload other models to save memory (only keep one model loaded)
        await self._unload_all_models()

        logger.info(f"Loading model: {model_id}")
        self._update_loading_state(model_id, "loading", progress=0.1, stage="initializing")

        try:
            # Ensure HuggingFace login for gated models
            _ensure_hf_login()

            # Import stable_audio_tools here to avoid loading at startup
            from stable_audio_tools import get_pretrained_model

            self._update_loading_state(model_id, "loading", progress=0.3, stage="loading_weights")

            # Load the model
            model, model_config = get_pretrained_model(self.MODEL_REPOS[model_id])

            self._update_loading_state(model_id, "loading", progress=0.8, stage="moving_to_device")

            # Move to device
            model = model.to(self.device)

            # Store references
            self._models[model_id] = model
            self._model_configs[model_id] = model_config
            self._current_model = model_id

            self._update_loading_state(model_id, "ready", progress=1.0, stage="complete")
            logger.info(f"Model {model_id} loaded successfully")
            return model, model_config

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to load model {model_id}: {error_msg}")
            self._update_loading_state(model_id, "error", error=error_msg)
            raise

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

        logger.info(f"Model {model_id} unloaded")

    def get_model_info(self, model_id: str) -> "ModelInfo":
        """Get information about a model."""
        from app.core.models import ModelInfo

        if model_id == "small":
            return ModelInfo(
                id="small",
                name="Stable Audio Open Small",
                description="Fast model optimized for CPUs. Best for quick iteration.",
                max_duration=settings.max_duration_small,
                default_steps=settings.default_steps_small,
                default_sampler=settings.default_sampler_small,
                parameters="341 million",
            )
        elif model_id == "1.0":
            return ModelInfo(
                id="1.0",
                name="Stable Audio Open 1.0",
                description="Higher quality model. Longer generation times.",
                max_duration=settings.max_duration_large,
                default_steps=settings.default_steps_large,
                default_sampler=settings.default_sampler_large,
                parameters="1.1 billion",
            )
        else:
            raise ValueError(f"Unknown model ID: {model_id}")

    def get_all_models_info(self) -> "list[ModelInfo]":
        """Get information about all available models."""
        return [self.get_model_info("small"), self.get_model_info("1.0")]


# Global model loader instance
model_loader = ModelLoader()

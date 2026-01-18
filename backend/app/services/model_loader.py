"""ML model management with lazy loading."""

import gc
import logging
from typing import Optional, Literal, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy import flag
_torch_available: Optional[bool] = None


def _check_torch() -> bool:
    """Check if torch is available."""
    global _torch_available
    if _torch_available is None:
        try:
            import torch
            _torch_available = True
        except ImportError:
            _torch_available = False
            logger.warning("PyTorch not available. Audio generation will not work.")
    return _torch_available


def _get_device() -> str:
    """Get the compute device."""
    if _check_torch():
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    return "cpu"


class ModelLoader:
    """Manages Stable Audio Open models with lazy loading."""

    # Model HuggingFace repository IDs
    MODEL_REPOS = {
        "small": "stabilityai/stable-audio-open-small",
        "1.0": "stabilityai/stable-audio-open-1.0"
    }

    def __init__(self):
        self._models: dict[str, Any] = {}
        self._model_configs: dict[str, Any] = {}
        self._current_model: Optional[str] = None
        self._device: Optional[str] = None

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

    def is_loaded(self, model_id: str) -> bool:
        """Check if a model is currently loaded."""
        return model_id in self._models

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
            return self._models[model_id], self._model_configs[model_id]

        # Unload other models to save memory (only keep one model loaded)
        await self._unload_all_models()

        logger.info(f"Loading model: {model_id}")

        try:
            # Import stable_audio_tools here to avoid loading at startup
            from stable_audio_tools import get_pretrained_model

            # Load the model
            model, model_config = get_pretrained_model(self.MODEL_REPOS[model_id])

            # Move to device
            model = model.to(self.device)

            # Store references
            self._models[model_id] = model
            self._model_configs[model_id] = model_config
            self._current_model = model_id

            logger.info(f"Model {model_id} loaded successfully")
            return model, model_config

        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {e}")
            raise

    async def _unload_all_models(self):
        """Unload all models to free memory."""
        for model_id in list(self._models.keys()):
            await self._unload_model(model_id)

    async def _unload_model(self, model_id: str):
        """Unload a specific model."""
        if model_id not in self._models:
            return

        logger.info(f"Unloading model: {model_id}")

        # Delete model references
        del self._models[model_id]
        del self._model_configs[model_id]

        if self._current_model == model_id:
            self._current_model = None

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
                parameters="341 million"
            )
        elif model_id == "1.0":
            return ModelInfo(
                id="1.0",
                name="Stable Audio Open 1.0",
                description="Higher quality model. Longer generation times.",
                max_duration=settings.max_duration_large,
                default_steps=settings.default_steps_large,
                default_sampler=settings.default_sampler_large,
                parameters="1.1 billion"
            )
        else:
            raise ValueError(f"Unknown model ID: {model_id}")

    def get_all_models_info(self) -> list:
        """Get information about all available models."""
        return [
            self.get_model_info("small"),
            self.get_model_info("1.0")
        ]


# Global model loader instance
model_loader = ModelLoader()

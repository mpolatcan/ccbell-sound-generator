"""Configuration settings for the CCBell Sound Generator."""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App settings
    app_name: str = "CCBell Sound Generator"
    debug: bool = False

    # Server settings
    host: str = "0.0.0.0"
    port: int = 7860

    # Model settings
    default_model: Literal["small", "1.0"] = "small"
    models_cache_dir: Path = Path.home() / ".cache" / "ccbell-models"

    # Audio settings
    sample_rate: int = 44100
    default_duration: float = 2.0
    max_duration_small: float = 11.0
    max_duration_large: float = 47.0

    # Generation settings
    default_steps_small: int = 8
    default_steps_large: int = 100
    default_cfg_scale: float = 1.0
    default_sampler_small: str = "pingpong"
    default_sampler_large: str = "dpmpp-3m-sde"

    # Storage settings
    temp_audio_dir: Path = Path("/tmp/ccbell-audio")
    max_audio_files: int = 100

    # GitHub settings
    github_token: str | None = None

    model_config = {"env_prefix": "CCBELL_", "env_file": ".env", "extra": "ignore"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        self.temp_audio_dir.mkdir(parents=True, exist_ok=True)
        self.models_cache_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()

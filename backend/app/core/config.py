"""Configuration settings for the CCBell Sound Generator."""

import os
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App settings
    app_name: str = "CCBell Sound Generator"
    app_version: str = "1.1.0"
    debug: bool = False

    # Server settings
    host: str = "0.0.0.0"
    port: int = 7860

    # Model settings
    default_model: str = "small"
    models_cache_dir: Path = Path.home() / ".cache" / "ccbell-models"

    # Audio settings
    sample_rate: int = 44100
    default_duration: float = 1.0
    max_duration_small: float = 5.0

    # Generation settings (optimized for short notification sounds on CPU)
    default_steps_small: int = 8
    default_cfg_scale_small: float = 1.0  # 1.0 = no CFG, single pass per step (2x faster)
    default_sampler_small: str = "pingpong"
    # Noise level parameters
    default_sigma_min: float = 0.3
    default_sigma_max: float = 500.0

    # Storage settings
    temp_audio_dir: Path = Path("/tmp/ccbell-audio")
    max_audio_files: int = 100

    # Concurrency settings
    max_concurrent_generations: int = 2
    generation_thread_pool_workers: int = 2

    # WebSocket settings
    ws_idle_timeout: int = 60  # seconds before sending keepalive ping
    ws_max_missed_pings: int = 2  # consecutive missed pings before close

    # Job lifetime settings
    job_max_lifetime_seconds: int = 1800  # 30 min max for any job regardless of status

    # GitHub settings (supports CCBELL_GH_TOKEN or CCBELL_GITHUB_TOKEN)
    gh_token: str | None = None

    model_config = {"env_prefix": "CCBELL_", "env_file": ".env", "extra": "ignore"}

    @property
    def github_token(self) -> str | None:
        """Resolve GitHub token from CCBELL_GH_TOKEN or CCBELL_GITHUB_TOKEN."""
        return self.gh_token or os.environ.get("CCBELL_GITHUB_TOKEN")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        self.temp_audio_dir.mkdir(parents=True, exist_ok=True)
        self.models_cache_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()

"""Pydantic models for API requests and responses."""

from typing import Literal

from pydantic import BaseModel, Field

# Valid Claude Code hook types
HookTypeId = Literal[
    "Stop",
    "SubagentStop",
    "PermissionPrompt",
    "IdlePrompt",
    "SessionStart",
    "SessionEnd",
    "PreToolUse",
    "PostToolUse",
    "SubagentStart",
    "UserPromptSubmit",
]

# Valid sampler types supported by stable-audio-tools
SamplerType = Literal[
    "pingpong",  # Small model
]


class GenerationSettings(BaseModel):
    """Advanced generation settings."""

    steps: int | None = Field(None, ge=1, le=200, description="Number of diffusion steps")
    cfg_scale: float | None = Field(
        None, ge=0.0, le=15.0, description="Classifier-free guidance scale"
    )
    sampler: SamplerType | None = Field(None, description="Sampler type")
    seed: int | None = Field(None, description="Random seed for reproducibility")
    sigma_min: float | None = Field(
        None, ge=0.0, le=10.0, description="Minimum noise level for diffusion"
    )
    sigma_max: float | None = Field(
        None, ge=1.0, le=1000.0, description="Maximum noise level for diffusion"
    )


class GenerateRequest(BaseModel):
    """Request model for audio generation."""

    model: str = Field("small", description="Model to use for generation")
    prompt: str = Field(
        ..., min_length=1, max_length=1500, description="Text prompt for audio generation"
    )
    hook_type: HookTypeId = Field(..., description="Claude Code hook type")
    duration: float = Field(2.0, ge=0.5, le=5.0, description="Duration in seconds")
    settings: GenerationSettings | None = Field(None, description="Advanced generation settings")


class GenerateResponse(BaseModel):
    """Response model for audio generation."""

    job_id: str = Field(..., description="Unique job identifier")
    status: Literal["queued", "processing", "completed", "error"] = Field(
        ..., description="Job status"
    )


class AudioStatusResponse(BaseModel):
    """Response model for audio status check."""

    job_id: str
    status: Literal["queued", "processing", "completed", "error"]
    progress: float = Field(0.0, ge=0.0, le=1.0)
    stage: str | None = None
    audio_url: str | None = None
    error: str | None = None


class ProgressUpdate(BaseModel):
    """WebSocket progress update message."""

    progress: float = Field(..., ge=0.0, le=1.0)
    stage: str
    audio_url: str | None = None
    error: str | None = None


class ModelInfo(BaseModel):
    """Information about an available model."""

    id: str
    name: str
    description: str
    max_duration: float
    default_steps: int
    default_sampler: str
    parameters: str


class SubTheme(BaseModel):
    """A correlated sub-theme within a theme preset."""

    id: str
    name: str
    prompts: dict[str, str] = Field(default_factory=dict)


class ThemePreset(BaseModel):
    """Theme preset for sound generation."""

    id: str
    name: str
    description: str
    icon: str
    sub_themes: list[SubTheme] = Field(default_factory=list)


class HookType(BaseModel):
    """Claude Code hook type definition."""

    id: str
    name: str
    description: str


class PublishRequest(BaseModel):
    """Request model for publishing to GitHub."""

    pack_id: str = Field(..., min_length=1, description="Pack slug, e.g. 'sci-fi-ambient'")
    pack_name: str = Field(..., min_length=1, description="Display name, e.g. 'Sci-Fi Ambient'")
    pack_description: str = Field("", description="Pack description")
    pack_author: str = Field("ccbell-sound-generator", description="Pack author")
    pack_version: str = Field("1.0.0", description="Pack version")
    sound_files: list[str] = Field(..., min_length=1, description="List of job IDs to include")
    description: str | None = Field(None, description="Release description")


class PublishResponse(BaseModel):
    """Response model for GitHub publishing."""

    success: bool
    release_url: str | None = None
    error: str | None = None


class DownloadPackRequest(BaseModel):
    """Request model for creating a downloadable pack ZIP."""

    pack_name: str = Field(..., min_length=1, description="Display name, e.g. 'Sci-Fi Ambient'")
    pack_description: str = Field(
        "AI-generated notification sounds for Claude Code", description="Pack description"
    )
    sound_files: list[str] = Field(..., min_length=1, description="List of job IDs to include")


class DownloadPackResponse(BaseModel):
    """Response model for pack creation."""

    success: bool
    pack_id: str | None = None
    download_url: str | None = None
    install_command: str | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str = "1.1.0"
    models_loaded: list[str] = []
    publish_enabled: bool = False


class ModelLoadingStatus(BaseModel):
    """Model loading status response."""

    model_id: str
    status: Literal["idle", "loading", "ready", "error"]
    progress: float = Field(0.0, ge=0.0, le=1.0)
    stage: str | None = None
    error: str | None = None


class ModelsStatusResponse(BaseModel):
    """Response for all models status."""

    models: dict[str, ModelLoadingStatus]
    current_model: str | None = None

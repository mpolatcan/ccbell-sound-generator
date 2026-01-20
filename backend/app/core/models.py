"""Pydantic models for API requests and responses."""

from typing import Literal

from pydantic import BaseModel, Field

# Valid Claude Code hook types
HookTypeId = Literal[
    "PreToolUse",
    "PostToolUse",
    "Notification",
    "Stop",
    "SubagentStop",
    "Bash",
    "Read",
    "Write",
    "Edit",
    "Task",
    "Error",
    "Success",
    "Warning",
    "Progress",
]

# Valid sampler types supported by stable-audio-tools
# Small model: only "pingpong"
# 1.0 model: only "dpmpp-3m-sde" and "dpmpp-2m-sde"
SamplerType = Literal[
    "pingpong",  # Small model only
    "dpmpp-3m-sde",  # 1.0 model only
    "dpmpp-2m-sde",  # 1.0 model only
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

    model: Literal["small", "1.0"] = Field("small", description="Model to use for generation")
    prompt: str = Field(
        ..., min_length=1, max_length=500, description="Text prompt for audio generation"
    )
    hook_type: HookTypeId = Field(..., description="Claude Code hook type")
    duration: float = Field(2.0, ge=0.5, le=47.0, description="Duration in seconds")
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


class ThemePreset(BaseModel):
    """Theme preset for sound generation."""

    id: str
    name: str
    description: str
    prompt_template: str
    icon: str


class HookType(BaseModel):
    """Claude Code hook type definition."""

    id: str
    name: str
    description: str
    sound_character: str
    suggested_duration: float


class PublishRequest(BaseModel):
    """Request model for publishing to GitHub."""

    github_token: str | None = Field(None, description="GitHub personal access token")
    repo_owner: str = Field(..., min_length=1, description="Repository owner")
    repo_name: str = Field(..., min_length=1, description="Repository name")
    release_tag: str = Field(..., min_length=1, description="Release tag")
    release_name: str = Field(..., min_length=1, description="Release name")
    sound_files: list[str] = Field(..., min_length=1, description="List of job IDs to include")
    description: str | None = Field(None, description="Release description")


class PublishResponse(BaseModel):
    """Response model for GitHub publishing."""

    success: bool
    release_url: str | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str = "1.0.19"
    models_loaded: list[str] = []


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

"""REST API endpoints."""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.models import (
    AudioStatusResponse,
    GenerateRequest,
    GenerateResponse,
    HealthResponse,
    HookType,
    ModelInfo,
    ModelLoadingStatus,
    ModelsStatusResponse,
    PublishRequest,
    PublishResponse,
    ThemePreset,
)
from app.data.hooks import get_all_hooks
from app.data.themes import get_all_themes
from app.services.audio import audio_service
from app.services.github import github_service
from app.services.model_loader import model_loader

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy", version=settings.app_version, models_loaded=model_loader.loaded_models
    )


@router.get("/models", response_model=list[ModelInfo])
async def get_models():
    """Get list of available models."""
    return model_loader.get_all_models_info()


@router.get("/models/status", response_model=ModelsStatusResponse)
async def get_models_status():
    """Get loading status for all models."""
    return ModelsStatusResponse(
        models=model_loader.get_all_loading_status(),
        current_model=model_loader.current_model,
    )


@router.get("/models/{model_id}/status", response_model=ModelLoadingStatus)
async def get_model_status(model_id: str):
    """Get loading status for a specific model."""
    if model_id not in ["small", "1.0"]:
        raise HTTPException(status_code=404, detail="Model not found")
    return model_loader.get_loading_status(model_id)


@router.post("/models/{model_id}/load")
async def load_model(model_id: str, background_tasks: BackgroundTasks):
    """Trigger background loading of a model."""
    if model_id not in ["small", "1.0"]:
        raise HTTPException(status_code=404, detail="Model not found")

    # Check if already loading or ready
    status = model_loader.get_loading_status(model_id)
    if status.status == "loading":
        return {"status": "already_loading", "model_id": model_id}
    if status.status == "ready":
        return {"status": "already_ready", "model_id": model_id}

    # Start background loading
    background_tasks.add_task(model_loader.load_model_background, model_id)

    return {"status": "loading_started", "model_id": model_id}


@router.get("/themes", response_model=list[ThemePreset])
async def get_themes():
    """Get list of theme presets."""
    return get_all_themes()


@router.get("/hooks", response_model=list[HookType])
async def get_hooks():
    """Get list of hook types with metadata."""
    return get_all_hooks()


@router.post("/generate", response_model=GenerateResponse)
async def generate_audio(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Start audio generation.

    Returns a job ID that can be used to track progress via WebSocket
    and download the result.
    """
    logger.info(f"Starting generation: model={request.model}, hook={request.hook_type}")

    # Create job
    job_id = audio_service.create_job(request)

    # Start generation in background
    background_tasks.add_task(audio_service.generate_audio, job_id)

    return GenerateResponse(job_id=job_id, status="queued")


@router.get("/audio/{job_id}/status", response_model=AudioStatusResponse)
async def get_audio_status(job_id: str):
    """Get the status of an audio generation job."""
    job = audio_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    audio_url = f"/api/audio/{job_id}" if job.status == "complete" else None

    return AudioStatusResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        stage=job.stage,
        audio_url=audio_url,
        error=job.error,
    )


@router.get("/audio/{job_id}")
async def get_audio(job_id: str):
    """Download the generated audio file."""
    audio_path = audio_service.get_audio_path(job_id)
    if not audio_path:
        job = audio_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.status == "processing":
            raise HTTPException(status_code=202, detail="Audio still processing")
        if job.status == "error":
            raise HTTPException(status_code=500, detail=job.error or "Generation failed")
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Get hook type for filename
    job = audio_service.get_job(job_id)
    filename = f"{job.request.hook_type.lower()}.wav" if job else f"{job_id}.wav"

    return FileResponse(path=audio_path, media_type="audio/wav", filename=filename)


@router.post("/publish", response_model=PublishResponse)
async def publish_release(request: PublishRequest):
    """Publish sound pack to GitHub release."""
    logger.info(
        f"Publishing release: {request.release_tag} to {request.repo_owner}/{request.repo_name}"
    )
    return await github_service.publish_release(request)


@router.delete("/audio/{job_id}")
async def delete_audio(job_id: str):
    """Delete a generated audio file and its job."""
    job = audio_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    audio_service.cleanup_job(job_id)
    return {"status": "deleted", "job_id": job_id}

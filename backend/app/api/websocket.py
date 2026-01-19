"""WebSocket handler for real-time progress updates."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.services.audio import audio_service

router = APIRouter()


@router.websocket("/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time progress updates.

    Clients connect to /api/ws/{job_id} to receive progress updates
    for their audio generation job.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for job: {job_id}")

    # Check if job exists
    job = audio_service.get_job(job_id)
    if not job:
        logger.warning(f"WebSocket connection for unknown job: {job_id}")
        await websocket.send_json({"error": "Job not found", "progress": 0, "stage": "error"})
        await websocket.close()
        return

    # If job is already complete, send final status
    if job.status == "completed":
        logger.info(f"WebSocket: job {job_id} already complete, sending final status")
        await websocket.send_json(
            {"progress": 1.0, "stage": "completed", "audio_url": f"/api/audio/{job_id}"}
        )
        await websocket.close()
        return

    if job.status == "error":
        logger.warning(f"WebSocket: job {job_id} failed, sending error status")
        await websocket.send_json({"progress": 0, "stage": "error", "error": job.error})
        await websocket.close()
        return

    # Define progress callback
    async def on_progress(progress: float, stage: str, audio_url: str | None = None):
        try:
            message = {"progress": progress, "stage": stage}
            if audio_url:
                message["audio_url"] = audio_url
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message for job {job_id}: {e}")

    # Register callback
    audio_service.register_progress_callback(job_id, on_progress)

    try:
        # Send current status
        await websocket.send_json({"progress": job.progress, "stage": job.stage})
        logger.debug(f"WebSocket: sent initial status for job {job_id} ({job.progress * 100:.0f}%)")

        # Keep connection open until job completes or client disconnects
        while True:
            try:
                # Wait for any message from client (ping/pong or close)
                data = await websocket.receive_text()
                # Echo pings back as pongs
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for job: {job_id}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for job: {job_id}")
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
        logger.opt(exception=True).debug("WebSocket error traceback:")
    finally:
        # Unregister callback
        audio_service.unregister_progress_callback(job_id, on_progress)
        logger.debug(f"WebSocket: unregistered callback for job {job_id}")

"""WebSocket handler for real-time progress updates."""

import asyncio
import base64
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.core.config import settings
from app.services.audio import audio_service

router = APIRouter()


@router.websocket("/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time progress updates.

    Clients connect to /api/ws/{job_id} to receive progress updates
    for their audio generation job.

    Includes idle timeout with keepalive pings and automatic
    close when the job completes or errors.
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

    # Event signaled when the job reaches a terminal state
    job_done = asyncio.Event()

    # Define progress callback
    async def on_progress(
        progress: float, stage: str, audio_url: str | None = None, error: str | None = None
    ):
        try:
            message: dict[str, object] = {"progress": progress, "stage": stage}
            if audio_url:
                message["audio_url"] = audio_url
                # Embed audio data as base64 so the frontend doesn't need a
                # separate HTTP fetch. This bypasses WKWebView cross-origin
                # restrictions that break audio loading in Tauri .dmg builds.
                audio_path = audio_service.get_audio_path(job_id)
                if audio_path:
                    audio_bytes = audio_path.read_bytes()
                    message["audio_data"] = base64.b64encode(audio_bytes).decode("ascii")
                    logger.debug(
                        f"WebSocket: embedded {len(audio_bytes)} bytes of audio for job {job_id}"
                    )
            if error:
                message["error"] = error
            await websocket.send_json(message)

            # Signal completion so the receive loop exits cleanly
            if stage in ("completed", "error"):
                job_done.set()
        except Exception as e:
            logger.error(f"Error sending WebSocket message for job {job_id}: {e}")

    # Register callback
    audio_service.register_progress_callback(job_id, on_progress)

    try:
        # Send current status
        await websocket.send_json({"progress": job.progress, "stage": job.stage})
        logger.debug(f"WebSocket: sent initial status for job {job_id} ({job.progress * 100:.0f}%)")

        idle_timeout = settings.ws_idle_timeout
        missed_pings = 0
        max_missed = settings.ws_max_missed_pings

        # Keep connection open until job completes or client disconnects
        while not job_done.is_set():
            try:
                # Wait for client message with timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=idle_timeout)
                missed_pings = 0  # Reset on any received message

                # Handle pings in both plain text and JSON format
                if data == "ping":
                    await websocket.send_text("pong")
                else:
                    try:
                        msg = json.loads(data)
                        if isinstance(msg, dict) and msg.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except (json.JSONDecodeError, TypeError):
                        pass

            except TimeoutError:
                # No message received within timeout, send a keepalive ping
                missed_pings += 1
                if missed_pings > max_missed:
                    logger.warning(
                        f"WebSocket: closing dead connection for job {job_id} "
                        f"({missed_pings} missed pings)"
                    )
                    break
                try:
                    await websocket.send_json({"type": "ping"})
                    logger.debug(
                        f"WebSocket: sent keepalive ping for job {job_id} (missed={missed_pings})"
                    )
                except Exception:
                    logger.warning(f"WebSocket: failed to send ping for job {job_id}, closing")
                    break

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for job: {job_id}")
                return

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for job: {job_id}")
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
        logger.opt(exception=True).debug("WebSocket error traceback:")
    finally:
        # Unregister callback
        audio_service.unregister_progress_callback(job_id, on_progress)
        logger.debug(f"WebSocket: unregistered callback for job {job_id}")

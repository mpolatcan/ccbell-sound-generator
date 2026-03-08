"""Pack creation service for downloadable ccbell-compatible ZIP packs."""

import asyncio
import contextlib
import json
import os
import re
import time
import uuid
import zipfile
from pathlib import Path
from typing import Any

from loguru import logger

from app.core.models import DownloadPackRequest, DownloadPackResponse
from app.data.hooks import HOOK_TO_EVENT_MAP
from app.services.audio import audio_service

# Temporary storage directory for generated packs
PACKS_DIR = Path("/tmp/ccbell-packs")

# Pack expiration: 30 minutes on HF Spaces, no expiration locally
_ON_HF_SPACES = bool(os.environ.get("SPACE_ID"))
PACK_EXPIRATION_SECONDS = 30 * 60 if _ON_HF_SPACES else 0

# Cleanup interval: 5 minutes
CLEANUP_INTERVAL_SECONDS = 5 * 60


def _slugify(name: str) -> str:
    """Convert a display name to a URL-safe slug.

    "Sci-Fi Ambient" -> "sci-fi-ambient"
    """
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "pack"


class PackService:
    """Service for creating downloadable ccbell-compatible sound packs."""

    def __init__(self) -> None:
        self._cleanup_task: asyncio.Task[None] | None = None
        # Track pack creation times for expiration: pack_id -> created_at
        self._pack_times: dict[str, float] = {}

    async def create_pack(self, request: DownloadPackRequest) -> DownloadPackResponse:
        """Create a ccbell-compatible ZIP pack from generated sounds.

        Args:
            request: Pack creation request with name and job IDs.

        Returns:
            DownloadPackResponse with pack_id and download_url placeholder.
        """
        slug = _slugify(request.pack_name)
        short_uuid = uuid.uuid4().hex[:8]
        pack_id = f"{slug}-{short_uuid}"

        logger.info(f"Creating pack '{pack_id}' from {len(request.sound_files)} jobs")

        # Collect job data
        events: dict[str, str] = {}
        prompts: dict[str, str] = {}
        sound_paths: list[tuple[str, Path]] = []
        model_name: str | None = None

        for job_id in request.sound_files:
            job = audio_service.get_job(job_id)
            if not job:
                logger.warning(f"Job not found: {job_id}")
                continue

            audio_path = audio_service.get_audio_path(job_id)
            if not audio_path:
                logger.warning(f"Audio file not found for job: {job_id}")
                continue

            hook_type = job.request.hook_type
            event_name = HOOK_TO_EVENT_MAP.get(hook_type, hook_type.lower())
            sound_filename = f"{event_name}.wav"

            events[event_name] = sound_filename
            prompts[event_name] = job.request.prompt
            if model_name is None:
                model_name = job.request.model
            sound_paths.append((event_name, audio_path))

        if not sound_paths:
            logger.warning("No valid audio files found for pack creation")
            return DownloadPackResponse(
                success=False,
                error="No valid audio files found for the specified job IDs",
            )

        # Build pack.json
        pack_json: dict[str, Any] = {
            "id": slug,
            "name": request.pack_name,
            "description": request.pack_description,
            "author": "ccbell-sound-generator",
            "version": "1.0.0",
            "events": events,
            "prompts": prompts,
            "source": {
                "provider": "ccbell-sound-generator",
                "model": model_name or "stable-audio-open-small",
                "license": "stabilityai/stable-audio-open-small",
            },
        }

        # Create ZIP
        PACKS_DIR.mkdir(parents=True, exist_ok=True)
        zip_path = PACKS_DIR / f"{pack_id}.zip"

        try:
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                # Add pack.json
                zf.writestr("pack.json", json.dumps(pack_json, indent=2))
                # Add WAV files with event names
                for event_name, audio_path in sound_paths:
                    zf.write(audio_path, f"{event_name}.wav")

            self._pack_times[pack_id] = time.time()
            logger.info(f"Pack '{pack_id}' created: {zip_path} ({zip_path.stat().st_size} bytes)")

            # download_url uses {base_url} placeholder - frontend resolves with window.location.origin
            download_url = f"{{base_url}}/api/packs/{pack_id}"
            install_command = f"/ccbell:packs install --url {{base_url}}/api/packs/{pack_id}"

            return DownloadPackResponse(
                success=True,
                pack_id=pack_id,
                download_url=download_url,
                install_command=install_command,
                expires_in_seconds=PACK_EXPIRATION_SECONDS,
            )

        except Exception as e:
            logger.error(f"Failed to create pack ZIP: {e}")
            logger.opt(exception=True).debug("Pack creation error traceback:")
            # Clean up on failure
            zip_path.unlink(missing_ok=True)
            return DownloadPackResponse(success=False, error=str(e))

    def get_pack_path(self, pack_id: str) -> Path | None:
        """Get the path to a pack ZIP file if it exists.

        Args:
            pack_id: Pack identifier.

        Returns:
            Path to the ZIP file, or None if not found or expired.
        """
        zip_path = PACKS_DIR / f"{pack_id}.zip"
        if not zip_path.exists():
            return None

        # Check expiration (disabled locally, only active on HF Spaces)
        if PACK_EXPIRATION_SECONDS > 0:
            created_at = self._pack_times.get(pack_id)
            if created_at and (time.time() - created_at) > PACK_EXPIRATION_SECONDS:
                logger.info(f"Pack '{pack_id}' has expired, removing")
                zip_path.unlink(missing_ok=True)
                self._pack_times.pop(pack_id, None)
                return None

        return zip_path

    async def start_cleanup_task(self) -> None:
        """Start the background pack cleanup task."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("Pack cleanup task started")

    async def stop_cleanup_task(self) -> None:
        """Stop the background pack cleanup task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._cleanup_task
            self._cleanup_task = None
            logger.info("Pack cleanup task stopped")

    async def _cleanup_loop(self) -> None:
        """Periodically clean up expired pack ZIPs."""
        while True:
            try:
                await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
                self._perform_cleanup()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Pack cleanup error: {e}")

    def _perform_cleanup(self) -> None:
        """Remove expired pack ZIPs from disk."""
        now = time.time()
        expired = [
            pack_id
            for pack_id, created_at in self._pack_times.items()
            if (now - created_at) > PACK_EXPIRATION_SECONDS
        ]

        for pack_id in expired:
            zip_path = PACKS_DIR / f"{pack_id}.zip"
            zip_path.unlink(missing_ok=True)
            self._pack_times.pop(pack_id, None)
            logger.debug(f"Cleaned up expired pack: {pack_id}")

        if expired:
            logger.info(f"Pack cleanup: removed {len(expired)} expired pack(s)")

        # Also clean up orphaned files (no tracking entry)
        if PACKS_DIR.exists():
            for zip_file in PACKS_DIR.glob("*.zip"):
                stem = zip_file.stem
                if stem not in self._pack_times:
                    age = now - zip_file.stat().st_mtime
                    if age > PACK_EXPIRATION_SECONDS:
                        zip_file.unlink(missing_ok=True)
                        logger.debug(f"Cleaned up orphaned pack file: {stem}")


# Global pack service instance
pack_service = PackService()

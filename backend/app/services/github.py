"""GitHub release service for publishing sound packs."""

import json
import os
from typing import Any

from github import Github, GithubException
from loguru import logger

from app.core.config import settings
from app.core.models import PublishRequest, PublishResponse
from app.data.hooks import HOOK_TO_EVENT_MAP
from app.services.audio import audio_service

# Target repository for sound pack releases.
PACK_REPO_OWNER = "mpolatcan"
PACK_REPO_NAME = "ccbell-sound-packs"


class GitHubService:
    """Service for publishing sound packs to GitHub releases."""

    async def publish_release(self, request: PublishRequest) -> PublishResponse:
        """
        Create a GitHub release with pack.json and individual WAV assets.

        Args:
            request: Publishing request with pack metadata and job IDs.

        Returns:
            PublishResponse with success status and release URL.
        """
        logger.info(f"Publishing pack '{request.pack_id}' v{request.pack_version}")

        try:
            # Validate token
            token = settings.github_token
            if not token:
                logger.error("CCBELL_GITHUB_TOKEN not set")
                return PublishResponse(
                    success=False,
                    error="Server-side CCBELL_GITHUB_TOKEN is not configured.",
                )

            gh = Github(token)

            # Get repository
            repo_full = f"{PACK_REPO_OWNER}/{PACK_REPO_NAME}"
            try:
                repo = gh.get_repo(repo_full)
                logger.debug(f"Repository found: {repo.full_name}")
            except GithubException as e:
                if e.status == 404:
                    logger.error(f"Repository not found: {repo_full}")
                    return PublishResponse(
                        success=False,
                        error=f"Repository not found: {repo_full}",
                    )
                raise

            # Build release tag
            release_tag = f"{request.pack_id}-v{request.pack_version}"

            # Check if tag already exists
            try:
                existing = repo.get_release(release_tag)
                logger.warning(f"Release '{release_tag}' already exists: {existing.html_url}")
                return PublishResponse(
                    success=False,
                    error=f"Release with tag '{release_tag}' already exists",
                )
            except GithubException as e:
                if e.status != 404:
                    raise

            # Collect job metadata and build pack.json
            events: dict[str, str] = {}
            prompts: dict[str, str] = {}
            model_name: str | None = None
            sound_paths: list[tuple[str, str]] = []  # (event_name, file_path)

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
                sound_paths.append((event_name, str(audio_path)))

            if not sound_paths:
                logger.warning("No valid audio files found for the specified job IDs")
                return PublishResponse(
                    success=False,
                    error="No valid audio files found for the specified job IDs",
                )

            # Build pack.json content
            pack_json: dict[str, Any] = {
                "id": request.pack_id,
                "name": request.pack_name,
                "description": request.pack_description,
                "author": request.pack_author,
                "version": request.pack_version,
                "events": events,
                "prompts": prompts,
                "source": {
                    "provider": "ccbell-sound-generator",
                    "model": f"stable-audio-open-{model_name or 'small'}",
                    "license": "stabilityai/stable-audio-open-1.0",
                },
            }

            # Create release
            release_body = request.description or self._generate_release_description(
                request, events
            )
            logger.info(f"Creating release '{request.pack_name}' with tag '{release_tag}'")
            release = repo.create_git_release(
                tag=release_tag,
                name=request.pack_name,
                message=release_body,
                draft=False,
                prerelease=False,
            )
            logger.debug(f"Release created: {release.html_url}")

            # Upload pack.json as release asset
            pack_json_bytes = json.dumps(pack_json, indent=2).encode()
            release.upload_asset_from_memory(
                file_like=_bytes_io(pack_json_bytes),
                file_size=len(pack_json_bytes),
                name="pack.json",
                content_type="application/json",
                label="Pack manifest",
            )
            logger.debug("Uploaded pack.json asset")

            # Upload each sound file as a release asset
            for event_name, file_path in sound_paths:
                filename = f"{event_name}.wav"
                release.upload_asset(
                    path=file_path,
                    name=filename,
                    content_type="audio/wav",
                    label=f"Sound: {event_name}",
                )
                logger.debug(f"Uploaded {filename} ({os.path.getsize(file_path)} bytes)")

            logger.info(f"Successfully published release: {release.html_url}")
            return PublishResponse(success=True, release_url=release.html_url)

        except GithubException as e:
            logger.error(f"GitHub API error: {e}")
            logger.opt(exception=True).debug("GitHub API error traceback:")
            return PublishResponse(
                success=False, error=f"GitHub API error: {e.data.get('message', str(e))}"
            )
        except Exception as e:
            logger.error(f"Error publishing release: {e}")
            logger.opt(exception=True).debug("Publish release error traceback:")
            return PublishResponse(success=False, error=str(e))

    def _generate_release_description(self, request: PublishRequest, events: dict[str, str]) -> str:
        """Generate a default release description."""
        event_list = "\n".join(f"- `{name}` → {filename}" for name, filename in events.items())
        return f"""# {request.pack_name}

{request.pack_description or "AI-generated notification sounds for Claude Code."}

## Sounds Included

{event_list}

## Installation

```bash
ccbell packs install {request.pack_id}
ccbell packs use {request.pack_id}
```

## Generated With

[CCBell Sound Generator](https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator)
"""


def _bytes_io(data: bytes):
    """Create a BytesIO wrapper for upload_asset_from_memory."""
    import io

    return io.BytesIO(data)


# Global GitHub service instance
github_service = GitHubService()

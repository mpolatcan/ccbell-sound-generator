"""GitHub release service for publishing sound packs."""

import io
import json
import logging
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from github import Github, GithubException

from app.core.models import PublishRequest, PublishResponse
from app.services.audio import audio_service

logger = logging.getLogger(__name__)


class GitHubService:
    """Service for publishing sound packs to GitHub releases."""

    async def publish_release(self, request: PublishRequest) -> PublishResponse:
        """
        Create a GitHub release with the specified sound files.

        Args:
            request: Publishing request with GitHub details and sound files.

        Returns:
            PublishResponse with success status and release URL.
        """
        try:
            # Initialize GitHub client
            gh = Github(request.github_token)

            # Get repository
            try:
                repo = gh.get_repo(f"{request.repo_owner}/{request.repo_name}")
            except GithubException as e:
                if e.status == 404:
                    return PublishResponse(
                        success=False,
                        error=f"Repository not found: {request.repo_owner}/{request.repo_name}"
                    )
                raise

            # Check if tag already exists
            try:
                repo.get_release(request.release_tag)
                return PublishResponse(
                    success=False,
                    error=f"Release with tag '{request.release_tag}' already exists"
                )
            except GithubException as e:
                if e.status != 404:
                    raise

            # Create ZIP file with all sounds
            zip_buffer = await self._create_sound_pack_zip(request.sound_files)

            if zip_buffer is None:
                return PublishResponse(
                    success=False,
                    error="No valid audio files found for the specified job IDs"
                )

            # Create release
            release_body = request.description or self._generate_release_description(request)

            release = repo.create_git_release(
                tag=request.release_tag,
                name=request.release_name,
                message=release_body,
                draft=False,
                prerelease=False
            )

            # Upload ZIP as release asset
            zip_filename = f"ccbell-sounds-{request.release_tag}.zip"
            release.upload_asset(
                path="",
                label=zip_filename,
                content_type="application/zip",
                name=zip_filename,
                data=zip_buffer.getvalue()
            )

            logger.info(f"Successfully published release: {release.html_url}")

            return PublishResponse(
                success=True,
                release_url=release.html_url
            )

        except GithubException as e:
            logger.error(f"GitHub API error: {e}")
            return PublishResponse(
                success=False,
                error=f"GitHub API error: {e.data.get('message', str(e))}"
            )
        except Exception as e:
            logger.error(f"Error publishing release: {e}")
            return PublishResponse(
                success=False,
                error=str(e)
            )

    async def _create_sound_pack_zip(self, job_ids: list[str]) -> Optional[io.BytesIO]:
        """
        Create a ZIP file containing all sound files.

        Args:
            job_ids: List of job IDs to include.

        Returns:
            BytesIO buffer containing the ZIP file, or None if no valid files.
        """
        zip_buffer = io.BytesIO()
        files_added = 0
        manifest = {
            "version": "1.0",
            "created_at": datetime.utcnow().isoformat(),
            "sounds": []
        }

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for job_id in job_ids:
                job = audio_service.get_job(job_id)
                if not job:
                    logger.warning(f"Job not found: {job_id}")
                    continue

                audio_path = audio_service.get_audio_path(job_id)
                if not audio_path:
                    logger.warning(f"Audio file not found for job: {job_id}")
                    continue

                # Determine filename based on hook type
                hook_type = job.request.hook_type
                filename = f"{hook_type.lower()}.wav"

                # Add to ZIP
                zf.write(audio_path, filename)
                files_added += 1

                # Add to manifest
                manifest["sounds"].append({
                    "filename": filename,
                    "hook_type": hook_type,
                    "prompt": job.request.prompt,
                    "model": job.request.model,
                    "duration": job.request.duration
                })

            if files_added == 0:
                return None

            # Add manifest to ZIP
            zf.writestr("manifest.json", json.dumps(manifest, indent=2))

        zip_buffer.seek(0)
        return zip_buffer

    def _generate_release_description(self, request: PublishRequest) -> str:
        """Generate a default release description."""
        return f"""# CCBell Sound Pack

Generated with CCBell Sound Generator.

## Sounds Included

{len(request.sound_files)} notification sounds for Claude Code hooks.

## Installation

1. Download the ZIP file
2. Extract to your Claude Code hooks configuration directory
3. Configure your hooks to use these sound files

## Generated With

[CCBell Sound Generator](https://huggingface.co/spaces/ccbell-sound-generator)
"""


# Global GitHub service instance
github_service = GitHubService()

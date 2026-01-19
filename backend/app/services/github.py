"""GitHub release service for publishing sound packs."""

import io
import json
import zipfile
from datetime import UTC, datetime
from typing import TypedDict

from github import Github, GithubException
from loguru import logger

from app.core.config import settings
from app.core.models import PublishRequest, PublishResponse
from app.services.audio import audio_service


class SoundInfo(TypedDict):
    """Type for sound info in manifest."""

    filename: str
    hook_type: str
    prompt: str
    model: str
    duration: float


class Manifest(TypedDict):
    """Type for sound pack manifest."""

    version: str
    created_at: str
    sounds: list[SoundInfo]


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
        logger.info(
            f"Publishing release: {request.release_tag} to {request.repo_owner}/{request.repo_name}"
        )
        logger.debug(
            f"Release details: {len(request.sound_files)} sound files, description provided: {bool(request.description)}"
        )

        try:
            # Initialize GitHub client
            token = request.github_token or settings.github_token
            if not token:
                logger.error("GitHub token not provided and CCBELL_GITHUB_TOKEN not set")
                return PublishResponse(
                    success=False,
                    error="GitHub token not provided. Please set CCBELL_GITHUB_TOKEN or provide it in the request.",
                )

            gh = Github(token)

            # Get repository
            try:
                repo = gh.get_repo(f"{request.repo_owner}/{request.repo_name}")
                logger.debug(f"Repository found: {repo.full_name}")
            except GithubException as e:
                if e.status == 404:
                    logger.error(f"Repository not found: {request.repo_owner}/{request.repo_name}")
                    return PublishResponse(
                        success=False,
                        error=f"Repository not found: {request.repo_owner}/{request.repo_name}",
                    )
                raise

            # Check if tag already exists
            try:
                existing_release = repo.get_release(request.release_tag)
                logger.warning(
                    f"Release with tag '{request.release_tag}' already exists: {existing_release.html_url}"
                )
                return PublishResponse(
                    success=False, error=f"Release with tag '{request.release_tag}' already exists"
                )
            except GithubException as e:
                if e.status != 404:
                    raise

            # Create ZIP file with all sounds
            zip_buffer = await self._create_sound_pack_zip(request.sound_files)

            if zip_buffer is None:
                logger.warning("No valid audio files found for the specified job IDs")
                return PublishResponse(
                    success=False, error="No valid audio files found for the specified job IDs"
                )

            # Create release
            release_body = request.description or self._generate_release_description(request)

            logger.info(
                f"Creating release '{request.release_name}' with tag '{request.release_tag}'"
            )
            release = repo.create_git_release(
                tag=request.release_tag,
                name=request.release_name,
                message=release_body,
                draft=False,
                prerelease=False,
            )
            logger.debug(f"Release created: {release.html_url}")

            # Upload ZIP as release asset
            zip_filename = f"ccbell-sounds-{request.release_tag}.zip"
            zip_data = zip_buffer.getvalue()
            zip_buffer.seek(0)
            logger.info(f"Uploading asset: {zip_filename} ({len(zip_data)} bytes)")
            release.upload_asset_from_memory(
                file_like=zip_buffer,
                file_size=len(zip_data),
                name=zip_filename,
                content_type="application/zip",
                label=zip_filename,
            )

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

    async def _create_sound_pack_zip(self, job_ids: list[str]) -> io.BytesIO | None:
        """
        Create a ZIP file containing all sound files.

        Args:
            job_ids: List of job IDs to include.

        Returns:
            BytesIO buffer containing the ZIP file, or None if no valid files.
        """
        zip_buffer = io.BytesIO()
        files_added = 0
        manifest: Manifest = {
            "version": "1.0",
            "created_at": datetime.now(UTC).isoformat(),
            "sounds": [],
        }

        logger.info(f"Creating sound pack ZIP with {len(job_ids)} job IDs")

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
                logger.debug(f"Added {filename} to ZIP (job: {job_id})")

                # Add to manifest
                manifest["sounds"].append(
                    {
                        "filename": filename,
                        "hook_type": hook_type,
                        "prompt": job.request.prompt,
                        "model": job.request.model,
                        "duration": job.request.duration,
                    }
                )

            if files_added == 0:
                logger.warning("No valid files found for ZIP creation")
                return None

            # Add manifest to ZIP
            zf.writestr("manifest.json", json.dumps(manifest, indent=2))
            logger.debug("Added manifest.json to ZIP")

        zip_buffer.seek(0)
        logger.info(f"Created sound pack ZIP with {files_added} files")
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

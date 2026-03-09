"""Centralized logging configuration using loguru."""

import contextlib
import sys

from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """Configure loguru logging based on debug setting."""
    # Remove default handler
    logger.remove()

    # Determine log level
    log_level = "DEBUG" if settings.debug else "INFO"

    # Custom sink that suppresses BrokenPipeError.
    # When running as a Tauri sidecar, stderr is piped to the parent process.
    # If the pipe breaks, writes raise BrokenPipeError — suppress it to avoid
    # cascading failures in progress callbacks and audio generation.
    def _safe_stderr(message: str) -> None:
        with contextlib.suppress(BrokenPipeError, OSError):
            sys.stderr.write(message)

    logger.add(
        _safe_stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>",
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    logger.info(f"Logging initialized at level: {log_level}")

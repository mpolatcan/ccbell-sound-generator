"""Centralized logging configuration using loguru."""

import sys

from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """Configure loguru logging based on debug setting."""
    # Remove default handler
    logger.remove()

    # Determine log level
    log_level = "DEBUG" if settings.debug else "INFO"

    # Configure console output with colored output
    # Note: No file logging - HF Spaces provides logs via API
    logger.add(
        sys.stderr,
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

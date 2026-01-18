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

    # Log to file for debugging (especially useful in production)
    log_dir = settings.temp_audio_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    logger.add(
        log_dir / "app.log",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="10 files",
        compression="gz",
        encoding="utf-8",
    )

    logger.info(f"Logging initialized at level: {log_level}")
    logger.info(f"Log files will be stored in: {log_dir}")

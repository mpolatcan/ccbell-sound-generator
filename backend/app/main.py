"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.api import routes, websocket
from app.core.config import settings
from app.core.logging import setup_logging
from app.services.audio import audio_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Configure logging first
    setup_logging()

    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Host: {settings.host}, Port: {settings.port}")
    logger.info(f"Temp audio directory: {settings.temp_audio_dir}")
    logger.info(f"Models cache directory: {settings.models_cache_dir}")
    logger.info(f"Default model: {settings.default_model}")

    # Start background cleanup task
    await audio_service.start_cleanup_task()

    yield

    # Shutdown
    logger.info("Shutting down...")
    await audio_service.stop_cleanup_task()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered notification sound generator for Claude Code",
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api", tags=["api"])
app.include_router(websocket.router, prefix="/api", tags=["websocket"])

# Static files directory
STATIC_DIR = Path(__file__).parent.parent / "static"


# Serve static files if directory exists (production)
if STATIC_DIR.exists():
    # Mount static files
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_index():
        """Serve the React app index.html."""
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React app for all other routes (SPA fallback)."""
        # Check if it's an API route
        if full_path.startswith("api/"):
            return {"error": "Not found"}

        # Check if file exists in static directory
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # Fallback to index.html for SPA routing
        return FileResponse(STATIC_DIR / "index.html")
else:

    @app.get("/")
    async def root():
        """Root endpoint when no static files are present."""
        return {
            "message": f"Welcome to {settings.app_name}",
            "docs": "/api/docs",
            "health": "/api/health",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)

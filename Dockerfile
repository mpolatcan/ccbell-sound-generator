# Frontend build stage
# In CI: frontend/dist is pre-built and included in artifacts
# Locally: build frontend from source
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Check if pre-built dist exists (CI flow) or build from source (local flow)
COPY frontend/ ./
RUN if [ -d "dist" ] && [ -f "dist/index.html" ]; then \
      echo "Using pre-built frontend dist"; \
    else \
      echo "Building frontend from source" && \
      npm ci && \
      npm run build; \
    fi

# CPU-only build for HuggingFace Spaces free tier
FROM python:3.11.11-slim-bookworm AS builder

# Force CPU-only mode
ENV CUDA_VISIBLE_DEVICES="" \
    FORCE_CUDA=0 \
    UV_SYSTEM_PYTHON=1 \
    UV_COMPILE_BYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv

WORKDIR /home/user/app

# Copy dependency files (pyproject.toml and uv.lock)
# The lockfile ensures reproducible, deterministic builds
COPY backend/pyproject.toml backend/uv.lock .

# Install dependencies using the lockfile
# --locked: Fail if lockfile is out of sync (ensures reproducibility)
# --no-dev: Skip development dependencies
# --no-install-project: Don't install the project itself yet
RUN uv sync --locked --no-dev --no-install-project

# Copy application code and install the project
COPY backend/app ./app
RUN uv sync --locked --no-dev

# Final stage - runtime only
FROM python:3.11.11-slim-bookworm AS runtime

# Force CPU-only mode
ENV CUDA_VISIBLE_DEVICES="" \
    FORCE_CUDA=0

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /home/user/app

# Copy the virtual environment from builder
COPY --from=builder /home/user/app/.venv /home/user/app/.venv

# Copy application code
COPY backend/app ./app
# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./static

# Set ownership and create directories with correct permissions
RUN chown -R user:user /home/user/app && \
    mkdir -p /tmp/ccbell-audio && \
    chown -R user:user /tmp/ccbell-audio && \
    mkdir -p /home/user/.cache/huggingface && \
    chown -R user:user /home/user/.cache

USER user

ENV HOME=/home/user \
    PATH="/home/user/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
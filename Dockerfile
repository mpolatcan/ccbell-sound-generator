# CPU-only build for HuggingFace Spaces free tier
FROM python:3.11.11-slim-bookworm AS builder

# Force CPU-only mode
ENV CUDA_VISIBLE_DEVICES="" \
    FORCE_CUDA=0 \
    UV_SYSTEM_PYTHON=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.18 /uv /usr/local/bin/uv

WORKDIR /home/user/app

# Copy only dependency files first for better caching
COPY backend/pyproject.toml ./

# Install all dependencies in a single layer (better caching)
# PyTorch CPU, then all other deps from pyproject.toml including stable-audio-tools
RUN uv pip install --system \
    torch==2.5.1 \
    torchaudio==2.5.1 \
    --extra-index-url https://download.pytorch.org/whl/cpu && \
    uv pip install --system --no-deps stable-audio-tools==0.0.19 && \
    uv pip install --system .

# Final stage - runtime only
FROM python:3.11.11-slim-bookworm AS runtime

# Force CPU-only mode
ENV CUDA_VISIBLE_DEVICES="" \
    FORCE_CUDA=0 \
    UV_SYSTEM_PYTHON=1

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /home/user/app

# Copy installed Python packages from builder (system site-packages)
COPY --from=builder /usr/local /usr/local

# Copy application code
COPY backend/ ./
COPY frontend/dist ./static

# Set ownership
RUN chown -R user:user /home/user/app && mkdir -p /tmp/ccbell-audio

USER user

ENV HOME=/home/user \
    PATH=/usr/local/bin:$PATH \
    PYTHONUNBUFFERED=1

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

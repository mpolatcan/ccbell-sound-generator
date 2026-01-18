# CPU-only build for HuggingFace Spaces free tier
FROM python:3.11.11-slim-bookworm

# Force CPU-only mode
ENV CUDA_VISIBLE_DEVICES="" \
    FORCE_CUDA=0 \
    UV_SYSTEM_PYTHON=1 \
    UV_NO_CACHE=1

# Install system dependencies
# - libsndfile1: audio file I/O
# - ffmpeg: audio processing
# - git: required for some pip packages (model downloads)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.18 /uv /usr/local/bin/uv

WORKDIR /home/user/app

# Copy pyproject.toml for dependency resolution
COPY backend/pyproject.toml ./

# Install PyTorch CPU-only version first (use extra-index-url for better resolution)
RUN uv pip install --system \
    torch==2.5.1 \
    torchaudio==2.5.1 \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Install dependencies from pyproject.toml
RUN uv pip install --system -e . \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Install stable-audio-tools without deps to skip flash-attn (CUDA-only)
RUN uv pip install --system --no-deps stable-audio-tools==0.1.0

# Copy backend code and pre-built frontend
COPY backend/ ./
COPY frontend/dist ./static

# Set ownership and switch to user
RUN chown -R user:user /home/user/app && mkdir -p /tmp/ccbell-audio
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

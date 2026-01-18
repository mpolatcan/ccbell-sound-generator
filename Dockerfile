# CPU-only build for HuggingFace Spaces free tier
FROM python:3.11-slim

# Force CPU-only mode - disable all CUDA compilation
ENV CUDA_VISIBLE_DEVICES=""
ENV USE_CUDA=0
ENV FORCE_CUDA=0
ENV TORCH_CUDA_ARCH_LIST=""
ENV CUDA_HOME=""

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /home/user/app

# Copy requirements first for caching
COPY backend/requirements.txt ./

# Install PyTorch CPU-only version first
RUN pip install --no-cache-dir \
    torch==2.5.1+cpu \
    torchaudio==2.5.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install CPU-compatible requirements
RUN pip install --no-cache-dir -r requirements.txt

# Install stable-audio-tools without deps to skip flash-attn (CUDA-only)
RUN pip install --no-cache-dir --no-deps stable-audio-tools

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

# Optimized single-stage build for HuggingFace Spaces free tier
FROM python:3.11-slim

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /home/user/app

# Copy requirements first for caching
COPY backend/requirements.txt ./

# Install PyTorch CPU-only and all requirements in single pip command
# Using --prefer-binary to avoid compilation and speed up install
RUN pip install --no-cache-dir --prefer-binary \
    torch==2.5.1+cpu \
    torchaudio==2.5.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir --prefer-binary -r requirements.txt

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

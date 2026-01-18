# Simple slim build for HuggingFace Spaces
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /home/user/app

# Copy requirements first for caching
COPY backend/requirements.txt ./

# Install PyTorch CPU with specific wheel and other requirements
RUN pip install --no-cache-dir \
    https://download.pytorch.org/whl/cpu/torch-2.5.1%2Bcpu-cp311-cp311-linux_x86_64.whl \
    https://download.pytorch.org/whl/cpu/torchaudio-2.5.1%2Bcpu-cp311-cp311-linux_x86_64.whl \
    && pip install --no-cache-dir -r requirements.txt

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

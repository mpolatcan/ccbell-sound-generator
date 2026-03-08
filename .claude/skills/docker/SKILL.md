---
name: docker
description: Build and run the production Docker image locally. Use when building Docker images, testing containers locally, or simulating the HuggingFace Spaces environment.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Docker

Build and run the production Docker image locally. The Docker image simulates the HuggingFace Spaces environment.

## Build

```bash
docker build -t ccbell-sound-generator .
```

With version tag:
```bash
docker build -t ccbell-sound-generator:v1.0.0 .
```

### What the Build Does
1. Uses uv to sync dependencies from lockfile
2. Installs CPU-only PyTorch automatically
3. Copies the frontend build from `frontend/dist/`
4. Creates a lean runtime image
5. Runs as non-root user (uid 1000)

**Prerequisite**: Ensure `frontend/dist/` exists (run `/build` first if needed).

## Run

### Basic Run
```bash
docker run -p 7860:7860 ccbell-sound-generator
```

### With Debug Mode
```bash
docker run -p 7860:7860 -e CCBELL_DEBUG=true ccbell-sound-generator
```

### With Persistent Model Cache
```bash
docker run -p 7860:7860 \
  -v ~/.cache/ccbell-models:/home/user/.cache/ccbell-models \
  ccbell-sound-generator
```

### With All Options
```bash
docker run -p 7860:7860 \
  -e CCBELL_DEBUG=true \
  -v ~/.cache/ccbell-models:/home/user/.cache/ccbell-models \
  ccbell-sound-generator
```

## Build + Run + Health Check (Full Test)

```bash
docker build -t ccbell-sound-generator .
docker run -d -p 7860:7860 --name ccbell-test ccbell-sound-generator
sleep 10
curl http://localhost:7860/api/health
docker stop ccbell-test && docker rm ccbell-test
```

## Access Points
- **Application**: http://localhost:7860
- **Health Check**: http://localhost:7860/api/health
- **API Docs**: http://localhost:7860/docs

## Important Notes
- Port 7860 matches HuggingFace Spaces
- Image is optimized for HuggingFace Spaces free CPU tier
- Build uses uv lockfile for reproducible dependencies
- `.dockerignore` excludes source files, reducing context size
- Health check runs every 30s on `/api/health`
- Models are downloaded on first use (can take several minutes)
- Use volume mount to persist models between runs
- Container runs as non-root user

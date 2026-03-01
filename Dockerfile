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

# Production stage - uses pre-built base image with all Python deps
FROM ghcr.io/mpolatcan/ccbell-sound-generator-base:latest

# Copy application code
COPY --chown=user:user backend/app ./app
# Copy built frontend assets
COPY --chown=user:user --from=frontend-builder /app/dist ./static

USER user

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

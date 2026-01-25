---
description: Run complete pre-deployment verification checklist
allowed-tools: Bash, Read
---

# Verify

Run the complete pre-deployment verification checklist.

## Current State
- Git status: !`git status --short`
- Current branch: !`git branch --show-current`
- Latest commit: !`git log -1 --oneline`

## Instructions

This command runs all checks required before deployment. Execute these in order:

### 1. Backend Linting
```bash
cd backend && source venv/bin/activate && ruff check . && ruff format --check .
```

### 2. Backend Type Checking
```bash
cd backend && source venv/bin/activate && ty check .
```

### 3. Frontend Linting
```bash
cd frontend && npm run lint
```

### 4. Frontend Build
```bash
cd frontend && npm run build
```

### 5. Docker Build
```bash
docker build -t ccbell-sound-generator .
```

### 6. Docker Run and Health Check
```bash
# Start container in background
docker run -d -p 7860:7860 --name ccbell-test ccbell-sound-generator

# Wait for startup and check health
sleep 10
curl http://localhost:7860/api/health

# Stop and remove container
docker stop ccbell-test && docker rm ccbell-test
```

## Checklist Summary
Report the status of each step:
- [ ] Backend lint passes
- [ ] Backend format check passes
- [ ] Backend type check passes
- [ ] Frontend lint passes
- [ ] Frontend build succeeds
- [ ] Docker build succeeds
- [ ] Health check passes

## Important Notes
- All steps must pass before creating a release
- This matches the CI pipeline checks
- Docker build is the most time-consuming step
- If any step fails, fix the issues before proceeding

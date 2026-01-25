---
description: First-time project setup for local development
allowed-tools: Bash, Read
---

# Setup

First-time project setup for local development.

## Instructions

### 1. Install Prerequisites
```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or with Homebrew: brew install uv

# Ensure Node.js 22+ is installed
node --version
```

### 2. Backend Setup
```bash
cd backend
uv venv venv  # Create venv directory
uv sync --group dev  # Install all dependencies into venv
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Verify Setup
```bash
# Backend - check venv and tools
cd backend
source venv/bin/activate
python --version
ruff --version
ty --version

# Frontend - check build
cd frontend
npm run build
```

## Quick Start After Setup

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

Access the app at http://localhost:5173

## Environment Variables (Optional)

Copy the example secrets file if you need HuggingFace or GitHub tokens:
```bash
cp secrets.env.example secrets.env
# Edit secrets.env with your tokens
```

## Important Notes
- uv automatically handles PyTorch CPU-only installation
- The lockfile (`uv.lock`) ensures reproducible dependencies
- Development tools (ruff, ty) are included with `--group dev`
- Frontend proxies API calls to backend on port 8000

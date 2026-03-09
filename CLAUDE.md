# CCBell Sound Generator

AI-powered notification sound generator for the Claude Code plugin "ccbell". Available as a web app (HuggingFace Spaces) and a native desktop app (Tauri v2).

## Project Overview

This is a full-stack application with two deployment targets:
- **Backend**: FastAPI (Python 3.11-3.12) - serves API and static files
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS + shadcn/ui
- **Desktop App**: Tauri v2 with Python sidecar (auto-installs Python via `uv`)
- **AI Model**: Stable Audio Open Small (341M) — single model, ID: `stable-audio-open-small`
- **Deployment**: HuggingFace Spaces (web), GHCR Docker image (local), GitHub Releases (desktop installers)
- **Tooling**: uv (package manager), ruff (linter/formatter), ty>=0.0.1a5 (type checker)

## Quick Start

```bash
# Backend
cd backend && uv venv venv && uv sync --group dev && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Codemap

Detailed file-level codemap with all exports, classes, functions, and types is in `.claude/rules/codemap.md` (auto-loaded every session).

**CRITICAL: ALWAYS run `/codemap-updater` after ANY code changes (new files, renamed files, added/removed functions, changed exports, structural refactors). This is mandatory — never skip it.**

## Key Commands

### Prerequisites

Install required tools:

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or with Homebrew: brew install uv
```

### Backend Development

**IMPORTANT**: Always activate the venv before running Python commands (`ruff`, `uvicorn`): `source backend/venv/bin/activate`

```bash
# First-time setup (from backend directory):
cd backend
uv venv venv  # Create venv directory
uv sync --group dev  # Install all deps from lockfile into venv
source venv/bin/activate

# Run development server (from backend directory)
uvicorn app.main:app --reload --port 8000  # Local dev uses port 8000

# After changing pyproject.toml
uv lock && uv sync --group dev
```

### Frontend Development

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint only
```

### Desktop App (Tauri) Development

```bash
cd frontend
npm run tauri dev        # Run desktop app in dev mode (auto-starts backend sidecar)
npm run tauri build      # Build production installer
```

**First launch behavior**: The desktop app auto-installs Python 3.12 via `uv` and all dependencies on first run. Subsequent launches start instantly using cached venv.

## Architecture

### Web App (HuggingFace Spaces)
- FastAPI serves React static files at root and API at `/api/*`
- **Static Files**: Frontend build artifacts (`frontend/dist`) are served from `backend/static` in production
- WebSocket at `/api/ws/{job_id}` for real-time progress during generation
- Models lazy-loaded to manage memory on free CPU tier
- Single container exposes port 7860 for HuggingFace Spaces

### Desktop App (Tauri v2)
- Tauri wraps the React frontend as a native app
- Python FastAPI backend runs as a sidecar process on port 7860
- **Auto-install flow** (`lib.rs`): find/install `uv` -> install Python 3.12 -> create venv -> install deps from `requirements.txt` -> start uvicorn
- `AtomicBool` setup guard prevents race conditions from React StrictMode double-invoke
- `.setup-complete` marker file tracks successful setup (not individual binary checks)
- Settings persisted to app data dir (`~/Library/Application Support/com.ccbell.soundgenerator/` on macOS)
- `CARGO_MANIFEST_DIR` compile-time constant used for reliable path resolution in dev mode

### Model Loading
- **HF Spaces**: Downloads from HuggingFace Hub directly (detected via `SPACE_ID` env var). Files: `model_config.json`, `model.safetensors`
- **Desktop/Docker**: Downloads from GitHub Releases (prefixed names: `stable-audio-open-small-model_config.json`, `stable-audio-open-small-model.safetensors`). Fallback to HF Hub if GitHub fails AND `HF_TOKEN` is set
- Files cached at `~/.cache/ccbell-models/stable-audio-open-small/`
- Uses `create_model_from_config` + `load_ckpt_state_dict` from `stable_audio_tools` (not `get_pretrained_model`)
- Atomic downloads via `.tmp` file rename pattern
- Device detection: CUDA > MPS (Apple Silicon) > CPU. MPS requires float32 (no float16). Docker cannot access MPS — always CPU

## Domain Concepts

- **Sound Packs**: Named, collapsible groups of generated sounds with download/publish/delete. State managed with Zustand (`useSoundLibrary` hook). Core types in `frontend/src/types/`.
- **Themes**: 7 presets (Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical, Ambient, Jazz) + Custom (user-written prompts, no preset config). Per-theme prompt configs in `backend/app/data/hook_styles/`.
- **Hook Events**: 10 types aligned with Claude Code hooks. Defined in `backend/app/data/hooks.py`.

## API Endpoints

All endpoints under `/api/*`. See `backend/app/api/routes.py` for full definitions.

Key routes: `GET /health`, `POST /models/{id}/load`, `POST /generate`, `GET /audio/{job_id}`, `WS /ws/{job_id}` (real-time progress).

## Testing

No automated test suite yet. Manual verification via the pre-deployment checklist below. For API testing: start the backend, load a model (`POST /api/models/stable-audio-open-small/load`), generate audio (`POST /api/generate`), verify output.

## Code Quality Requirements

**CRITICAL: ALWAYS run `/code-quality` before every commit. There is no CI pipeline — local quality checks are the only gate. Never skip this.**

### Local Checks (REQUIRED before every commit)

```bash
# Backend (from backend directory, venv must be active)
cd backend
ruff check .              # Linting
ruff format --check .     # Format verification (use 'ruff format .' to auto-fix)
uv run ty check .         # Type checking (ty must be run via uv, not directly)

# Frontend (from frontend directory)
cd frontend
npm run lint              # ESLint
npx tsc --noEmit          # TypeScript type checking
```

### Quick Fix Commands

```bash
# Auto-fix backend formatting issues
cd backend && ruff format .

# Auto-fix frontend linting issues (where possible)
cd frontend && npm run lint -- --fix
```

**Tip**: Use the `/verify` slash command to run the full pre-deployment checklist including all quality checks.

## Versioning

Versions are managed independently per stack: backend (`pyproject.toml`), frontend (`package.json`), and desktop (`tauri.conf.json`). They are **not** kept in sync. Git tags (`v*`) trigger CI/CD pipelines for all targets simultaneously.

## Implementation Notes

- Single model architecture: `stable-audio-open-small` is the only model ID used everywhere (backend config, frontend constants, API paths)
- Config settings have no model suffix: `max_duration`, `default_steps`, `default_cfg_scale`, `default_sampler` (not `_small`)
- Lazy load ML models to stay under 16GB memory limit
- All audio files are 44.1kHz stereo WAV
- Max 2 concurrent generations; excess jobs queue with `waiting_in_queue` status
- Jobs auto-expire after 30 minutes regardless of status
- Pack link expiration: 30 min on HF Spaces (detected via `SPACE_ID`), no expiration locally/desktop
- Tauri v2 webview origin on macOS is `http://tauri.localhost` — must be in CORS allowed origins
- `ty` must be run via `uv run ty check .` (not directly from venv)

## Dependencies

- **Backend** (Python 3.11-3.12): `backend/pyproject.toml`. Key: FastAPI, torch (CPU-only index, but supports CUDA/MPS at runtime), stable-audio-tools, loguru. Dev: ruff, ty>=0.0.1a5.
- **Frontend** (Node.js 22): `frontend/package.json`. Key: React 19, Vite 6, Tailwind CSS, zustand, @tanstack/react-query, wavesurfer.js.
- **Desktop** (Rust): `frontend/src-tauri/Cargo.toml`. Key: tauri 2, tauri-plugin-shell 2, reqwest, tokio.

Managed via `uv` lockfile (`pyproject.toml` + `uv.lock`). Key gotchas: numpy/scipy pinned via `constraint-dependencies`, PyTorch uses CPU-only index (`pytorch-cpu`), `gradio` excluded.

## Environment Variables

All settings use the `CCBELL_` prefix. See `backend/app/core/config.py` for the full list with defaults.

**Key variables to know:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CCBELL_PORT` | `7860` | Server port (use 8000 for local dev via `uvicorn --reload`) |
| `CCBELL_DEBUG` | `false` | Enable debug mode |
| `CCBELL_MODEL_DOWNLOAD_BASE_URL` | GitHub Releases URL | Base URL for model weight downloads |
| `CCBELL_GH_TOKEN` | `null` | GitHub token for publishing (also supports `CCBELL_GITHUB_TOKEN`) |
| `HF_TOKEN` | `null` | HuggingFace token - only needed as fallback if GitHub Releases is unreachable |
| `CCBELL_MAX_CONCURRENT_GENERATIONS` | `2` | Max parallel audio generations |
| `CCBELL_JOB_MAX_LIFETIME_SECONDS` | `1800` | Job expiry timeout (30 min) |

This table covers key variables only. See `backend/app/core/config.py` for all 24 configurable settings (model defaults, audio params, WebSocket timeouts, etc.).

## Pre-Deployment Checklist

Before creating a release tag, all checks must pass:

- [ ] Code quality passes (see [Code Quality Requirements](#code-quality-requirements))
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Docker builds and runs: `docker build -t ccbell-sound-generator . && docker run -p 7860:7860 ccbell-sound-generator`
- [ ] Health check: `curl http://localhost:7860/api/health`
- [ ] End-to-end audio generation works via UI or API
- [ ] UI visually verified with `agent-browser` skill

### Running Locally via Docker

Users can run the published Docker image without any installation:

```bash
docker run -p 7860:7860 -v ~/.cache/ccbell-models:/home/user/.cache/ccbell-models ghcr.io/mpolatcan/ccbell-sound-generator:latest
```

Access at http://localhost:7860. Models are cached on the host for fast restarts.

### Docker Testing

Docker testing is required before deployment — it simulates the HuggingFace Spaces environment:

```bash
docker-compose up --build              # Quick start
# Or: docker build -t ccbell-sound-generator . && docker run -p 7860:7860 -e CCBELL_DEBUG=true -v ~/.cache/ccbell-models:/home/user/.cache/ccbell-models ccbell-sound-generator
```

Access at http://localhost:7860. Test: load model -> generate -> download audio.

## CI/CD Pipelines

| Pipeline | File | Trigger | Purpose |
|----------|------|---------|---------|
| Deploy | `deploy-huggingface.yml` | Version tags (`v*.*.*`), manual | Build + push to HuggingFace Spaces |
| Docker Image | `publish-docker-image.yml` | Version tags (`v*.*.*`), manual | Build + push app image to GHCR for local use |
| Build Desktop | `build-desktop-tauri.yml` | Version tags (`v*.*.*`), manual | macOS universal + Linux x64 Tauri installers via GitHub Release |
| Base Image | `build-base-image.yml` | Push to `master` (path-filtered), manual | Build `Dockerfile.base` with system deps |
| Upload Model | `upload-model-weights.yml` | Manual | Download weights from HF, upload to GitHub Release (`models-v1.0`) |

Model assets prefixed with model name: `stable-audio-open-small-model.safetensors`, `stable-audio-open-small-model_config.json`.

### Creating a Release

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Or with annotation
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Checking Deployment

**ALWAYS use the provided script to check HF Space logs:**

```bash
# Setup (first time only)
cp secrets.env.example secrets.env
# Edit secrets.env and add your HF_TOKEN

# Check logs - ALWAYS use this script
./scripts/check-hf-space-logs.sh
```

**Steps after deployment:**
1. Check deployment status: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy-huggingface.yml
2. Verify Space is running: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
3. Check Space logs using the script above

**CRITICAL: Never read secrets.env from the repository. This file contains sensitive tokens and is gitignored. Always create your local copy from secrets.env.example.**

### Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token with write access (for CI/CD deployment) |
| `HF_USERNAME` | HuggingFace username/organization |


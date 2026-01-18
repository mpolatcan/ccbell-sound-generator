# CCBell Sound Generator

AI-powered notification sound generator for the Claude Code plugin "ccbell", deployed on HuggingFace Spaces.

## Project Overview

This is a full-stack web application with:
- **Backend**: FastAPI (Python 3.11) - serves API and static files
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS + shadcn/ui
- **AI Models**: Stable Audio Open (Small & 1.0) for audio generation
- **Deployment**: HuggingFace Spaces Docker SDK on free CPU tier
- **Tooling**: uv (package manager), ruff (linter/formatter), ty (type checker)

## Directory Structure

```
ccbell-sound-generator/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/
│   │   │   ├── routes.py     # REST API endpoints
│   │   │   └── websocket.py  # WebSocket for progress
│   │   ├── core/
│   │   │   ├── config.py     # Settings
│   │   │   └── models.py     # Pydantic models
│   │   ├── services/
│   │   │   ├── audio.py      # Audio generation
│   │   │   ├── github.py     # GitHub releases
│   │   │   └── model_loader.py
│   │   └── data/
│   │       ├── themes.py     # Theme presets
│   │       └── hooks.py      # Hook definitions
│   └── pyproject.toml        # Dependencies and tool config
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities, API client
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── Dockerfile                # Production build with uv
├── docker-compose.yml        # Local development
└── README.md                 # HuggingFace Space config
```

## Key Commands

### Prerequisites

Install required tools:

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or with Homebrew: brew install uv
```

### Virtual Environment (REQUIRED)

**IMPORTANT**: Always activate the virtual environment before running ANY Python-related commands, including `ruff` and `ty` which are installed in the venv.

```bash
# From project root - activate venv FIRST
source venv/bin/activate

# Verify activation (should show venv path)
which python

# ruff and ty are available after activation
which ruff  # Should show venv/bin/ruff
which ty    # Should show venv/bin/ty
```

### Backend Development

```bash
# ALWAYS activate venv first (from project root)!
source venv/bin/activate

# First-time setup (from project root):
cd backend
uv venv ../venv  # Creates venv at project root
source ../venv/bin/activate
uv pip install -e ".[dev]"
pip install ruff ty
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install --no-deps stable-audio-tools

# Run development server (from backend directory, venv must be active)
cd backend
uvicorn app.main:app --reload --port 8000

# Lint and format (from backend directory, venv must be active)
ruff check .
ruff format .

# Type checking with ty (from backend directory, venv must be active)
ty check .
```

### Frontend Development

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Docker Development

```bash
# Full stack with Docker
docker-compose up --build

# Build production image
docker build -t ccbell-sound-generator .
```

### shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add button card input label select slider tabs accordion dialog dropdown-menu toast progress badge separator scroll-area skeleton textarea tooltip
```

## Architecture

- FastAPI serves React static files at root and API at `/api/*`
- WebSocket at `/api/ws/{job_id}` for real-time progress during generation
- Models lazy-loaded to manage memory on free CPU tier
- Single container exposes port 7860 for HuggingFace Spaces

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/models` | List available models |
| GET | `/api/themes` | Get theme presets |
| GET | `/api/hooks` | Get hook types with metadata |
| POST | `/api/generate` | Start audio generation (returns job_id) |
| GET | `/api/audio/{job_id}/status` | Get job status and progress |
| GET | `/api/audio/{job_id}` | Download generated audio |
| DELETE | `/api/audio/{job_id}` | Delete job and audio file |
| POST | `/api/publish` | Publish to GitHub release |
| WS | `/api/ws/{job_id}` | Real-time progress updates |

## Models

| Model | Parameters | Max Duration | Best For |
|-------|-----------|--------------|----------|
| Stable Audio Open Small | 341M | 11 sec | Fast iteration, CPU |
| Stable Audio Open 1.0 | 1.1B | 47 sec | Higher quality |

## Claude Code Hook Types

The app generates sounds for these Claude Code events:

**Core Events:**
- **PreToolUse** - Before tool execution
- **PostToolUse** - After tool completion
- **Notification** - General notifications
- **Stop** - Main agent completion
- **SubagentStop** - Subagent completion

**Tool-specific:**
- **Bash** - Terminal/shell command execution
- **Read** - File read operation
- **Write** - File write/create operation
- **Edit** - File edit operation
- **Task** - New agent or task spawned

**Status Events:**
- **Error** - Error or failure occurred
- **Success** - Operation completed successfully
- **Warning** - Warning or caution indicator
- **Progress** - Task progress milestone

## Theme Presets

- Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical
- Custom prompts also supported

## Dependencies

### Backend (Python 3.11)
- **Runtime**: FastAPI 0.115.6, uvicorn 0.34.0, pydantic-settings 2.7.1
- **ML**: torch 2.5.1 (CPU), torchaudio 2.5.1, stable-audio-tools 0.0.19
- **Audio**: numpy 1.23.5, scipy 1.11.4
- **Integrations**: PyGithub 2.5.0
- **Dev Tools**: ruff 0.9+, ty (type checker)

### Frontend (Node.js 22)
- React 19, TypeScript 5.7
- Vite 6, Tailwind CSS 3.4
- @tanstack/react-query 5.62, zustand 5
- wavesurfer.js 7.8, lucide-react, jszip 3.10

## Implementation Notes

- Use async/await consistently in FastAPI routes
- Handle WebSocket disconnections gracefully
- Lazy load ML models to stay under 16GB memory limit
- Frontend state managed with Zustand for sound library
- Use React Query for API calls with proper caching
- All audio files are 44.1kHz stereo WAV
- Before committing, run: `ruff check .`, `ruff format .`, and `ty check .`

## Environment Variables

All settings can be overridden via environment variables with the `CCBELL_` prefix:

| Variable | Default | Description |
|----------|---------|-------------|
| `CCBELL_DEBUG` | `false` | Enable debug mode |
| `CCBELL_HOST` | `0.0.0.0` | Server host |
| `CCBELL_PORT` | `7860` | Server port |
| `CCBELL_DEFAULT_MODEL` | `small` | Default model (`small` or `1.0`) |
| `CCBELL_MODELS_CACHE_DIR` | `~/.cache/ccbell-models` | Model cache directory |
| `CCBELL_SAMPLE_RATE` | `44100` | Audio sample rate |
| `CCBELL_DEFAULT_DURATION` | `2.0` | Default audio duration (seconds) |
| `CCBELL_MAX_DURATION_SMALL` | `11.0` | Max duration for small model |
| `CCBELL_MAX_DURATION_LARGE` | `47.0` | Max duration for 1.0 model |
| `CCBELL_DEFAULT_STEPS_SMALL` | `8` | Diffusion steps for small model |
| `CCBELL_DEFAULT_STEPS_LARGE` | `100` | Diffusion steps for 1.0 model |
| `CCBELL_DEFAULT_CFG_SCALE` | `1.0` | Classifier-free guidance scale |
| `CCBELL_TEMP_AUDIO_DIR` | `/tmp/ccbell-audio` | Temporary audio directory |
| `CCBELL_MAX_AUDIO_FILES` | `100` | Max stored audio files |
| `CCBELL_GITHUB_TOKEN` | `null` | GitHub token for publishing |

## CI/CD Pipelines

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main`/`master` and pull requests:

1. **Lint Frontend** - ESLint and TypeScript type checking
2. **Lint Backend** - Ruff check and format verification
3. **Build Frontend** - Produces build artifacts
4. **Build Docker** - Validates Docker image builds correctly

### Deploy Pipeline (`.github/workflows/deploy.yml`)

Triggered by version tags (e.g., `v1.0.0`) or manual workflow dispatch:

1. **Validate** - Extracts and validates semver version from tag
2. **Build** - Builds frontend and updates version in config
3. **Test Docker** - Verifies Docker image builds
4. **Deploy** - Pushes to HuggingFace Spaces

### Creating a Release

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Or with annotation
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token with write access |
| `HF_USERNAME` | HuggingFace username/organization |

### Environment

The deploy workflow uses a `production` environment for deployment approvals (optional).

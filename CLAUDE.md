# CCBell Sound Generator

AI-powered notification sound generator for the Claude Code plugin "ccbell", deployed on HuggingFace Spaces.

## Project Overview

This is a full-stack web application with:
- **Backend**: FastAPI (Python 3.11) - serves API and static files
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS + shadcn/ui
- **AI Models**: Stable Audio Open (Small & 1.0) for audio generation
- **Deployment**: HuggingFace Spaces Docker SDK on free CPU tier
- **Tooling**: uv (package manager), ruff (linter/formatter)

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

Install [uv](https://docs.astral.sh/uv/) for Python package management:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with Homebrew
brew install uv
```

### Backend Development

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Install PyTorch CPU (for local development without CUDA)
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install stable-audio-tools (skip flash-attn which requires CUDA)
uv pip install --no-deps stable-audio-tools

# Run development server
uvicorn app.main:app --reload --port 8000

# Lint and format
ruff check .
ruff format .
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
npx shadcn-ui@latest add button card input label select slider tabs accordion dialog dropdown-menu toast progress badge separator scroll-area
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
| GET | `/api/audio/{job_id}` | Download generated audio |
| POST | `/api/publish` | Publish to GitHub release |
| WS | `/api/ws/{job_id}` | Real-time progress updates |

## Models

| Model | Parameters | Max Duration | Best For |
|-------|-----------|--------------|----------|
| Stable Audio Open Small | 341M | 11 sec | Fast iteration, CPU |
| Stable Audio Open 1.0 | 1.1B | 47 sec | Higher quality |

## Claude Code Hook Types

The app generates sounds for these Claude Code events:
- **PreToolUse** - Before tool execution
- **PostToolUse** - After tool completion
- **Notification** - General notifications
- **Stop** - Main agent completion
- **SubagentStop** - Subagent completion
- Tool-specific: Bash, Read, Write, Edit, Task

## Theme Presets

- Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical
- Custom prompts also supported

## Dependencies

### Backend (Python 3.11)
- **Runtime**: FastAPI 0.115.6, uvicorn 0.34.0, pydantic-settings 2.7.1
- **ML**: torch 2.5.1 (CPU), torchaudio 2.5.1, stable-audio-tools 0.0.19
- **Audio**: numpy 1.23.5, scipy 1.11.4
- **Integrations**: PyGithub 2.5.0
- **Dev Tools**: ruff 0.9+

### Frontend (Node.js 22)
- React 19, TypeScript 5.7
- Vite 6, Tailwind CSS 3.4
- @tanstack/react-query 5.62, zustand 5
- wavesurfer.js 7.8, lucide-react

## Implementation Notes

- Use async/await consistently in FastAPI routes
- Handle WebSocket disconnections gracefully
- Lazy load ML models to stay under 16GB memory limit
- Frontend state managed with Zustand for sound library
- Use React Query for API calls with proper caching
- All audio files are 44.1kHz stereo WAV
- Run `ruff check .` and `ruff format .` before committing

## Deployment

GitHub Actions auto-syncs to HuggingFace Spaces on push to main.
Requires `HF_TOKEN` and `HF_USERNAME` secrets configured.

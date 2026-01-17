# CCBell Sound Generator

AI-powered notification sound generator for the Claude Code plugin "ccbell", deployed on HuggingFace Spaces.

## Project Overview

This is a full-stack web application with:
- **Backend**: FastAPI (Python 3.13) - serves API and static files
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS + shadcn/ui
- **AI Models**: Stable Audio Open (Small & 1.0) for audio generation
- **Deployment**: HuggingFace Spaces Docker SDK on free CPU tier

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
│   └── requirements.txt
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
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Local development
└── README.md                 # HuggingFace Space config
```

## Key Commands

### Local Development

```bash
# Full stack with Docker
docker-compose up --build

# Backend only
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend only
cd frontend && npm install && npm run dev
```

### Frontend

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Run linter
```

### shadcn/ui Components

```bash
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

### Backend (Python 3.13)
- FastAPI 0.115+, uvicorn 0.32+
- torch 2.5+, torchaudio 2.5+, stable-audio-tools
- PyGithub 2.5+, soundfile, pydub

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

## Deployment

GitHub Actions auto-syncs to HuggingFace Spaces on push to main.
Requires `HF_TOKEN` and `HF_USERNAME` secrets configured.

# CCBell Sound Generator - Implementation Plan

## Overview
A polished web application deployed on HuggingFace Spaces (Docker SDK, free CPU tier) that generates AI-powered notification sounds for the Claude Code plugin "ccbell" using Stability AI's Stable Audio Open models.

## Tech Stack
| Layer | Technology | Justification |
|-------|------------|---------------|
| Platform | **HuggingFace Spaces (Docker)** | Free hosting, full control, public access |
| Backend | **FastAPI** | Modern async Python API, great ML integration |
| Frontend | **React 19 + TypeScript** | Component-based UI, rich ecosystem |
| Styling | **Tailwind CSS + shadcn/ui** | Polished, accessible components |
| Build | **Vite** | Fast builds, HMR, optimized production |
| AI Models | **Stable Audio Open Small & 1.0** | User-selectable models for different needs |
| Audio | **torchaudio** | WAV file creation and processing |
| GitHub | **PyGithub** | Publish sound packs to GitHub releases |
| CI/CD | **GitHub Actions** | Auto-sync repo to HuggingFace Spaces |

## Key Features
1. **Polished UI**: Modern React interface with shadcn/ui components
2. **Model Selection**: Choose between Stable Audio Open Small (fast) or 1.0 (higher quality)
3. **Advanced Settings**: Fine-tune generation parameters with model-specific defaults
4. **Theme System**: Preset themes (sci-fi, retro-8bit, nature, minimal, mechanical) + custom prompts
5. **Hook Types**: Generate sounds for all Claude Code events
6. **Waveform Visualization**: Visual audio preview with waveform display
7. **Sound Library**: Session-based collection of generated sounds
8. **Batch Download**: Download all sounds as ZIP
9. **GitHub Release**: Publish sound packs directly to GitHub releases
10. **Real-time Progress**: WebSocket-based progress updates during generation
11. **Responsive Design**: Works on desktop and mobile

## File Structure
```text
ccbell-sound-generator/
├── .github/
│   └── workflows/
│       └── sync-to-hf.yml        # GitHub Actions: sync to HuggingFace Spaces
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI application entry
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py         # API endpoints
│   │   │   └── websocket.py      # WebSocket for progress updates
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Configuration settings
│   │   │   └── models.py         # Pydantic models
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── audio.py          # Audio generation service
│   │   │   ├── github.py         # GitHub release service
│   │   │   └── model_loader.py   # ML model management
│   │   └── data/
│   │       ├── themes.py         # Theme presets
│   │       └── hooks.py          # Hook type definitions
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── AudioPlayer.tsx   # Custom audio player with waveform
│   │   │   ├── GeneratorForm.tsx # Main generation form
│   │   │   ├── SoundLibrary.tsx  # Generated sounds list
│   │   │   ├── ThemeSelector.tsx # Theme preset buttons
│   │   │   ├── HookSelector.tsx  # Hook type dropdown
│   │   │   ├── AdvancedSettings.tsx
│   │   │   └── PublishDialog.tsx # GitHub release dialog
│   │   ├── hooks/
│   │   │   ├── useAudioGeneration.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useSoundLibrary.ts
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css             # Tailwind imports
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── components.json          # shadcn/ui config
├── Dockerfile                    # Multi-stage Docker build
├── README.md                     # HuggingFace Space configuration + docs
└── docker-compose.yml            # Local development
```

## Implementation Phases

### Phase 1: Project Setup
- [x] Initialize backend with FastAPI
- [x] Initialize frontend with Vite + React + TypeScript
- [x] Set up Tailwind CSS and shadcn/ui
- [x] Create Dockerfile (multi-stage build)
- [x] Set up docker-compose for local development

### Phase 2: Backend API
- [x] Model loader service with lazy loading
- [x] Audio generation endpoint
- [x] WebSocket for progress updates
- [x] Theme and hook type data endpoints
- [x] Health check endpoint

### Phase 3: Frontend UI
- [x] Layout and navigation
- [x] Generator form with all inputs
- [x] Theme preset selector (card-based)
- [x] Hook type selector with descriptions
- [x] Advanced settings accordion
- [x] Loading states and progress bar

### Phase 4: Audio Features
- [x] Audio player component with waveform
- [x] Sound library with session storage
- [x] Individual sound download
- [x] Batch download as ZIP
- [x] Audio preview on hover

### Phase 5: GitHub Integration
- [x] GitHub token configuration
- [x] Publish dialog UI
- [x] ZIP creation with manifest
- [x] Release publishing API
- [x] Release status feedback

### Phase 6: Polish & Testing
- [x] Error handling and toast notifications
- [x] Responsive design adjustments
- [x] Keyboard shortcuts
- [x] Loading skeletons
- [ ] Browser compatibility testing
- [x] Performance optimization

---

## AI Models: Stable Audio Open

### Model Comparison

| Specification | **Stable Audio Open Small** | **Stable Audio Open 1.0** |
|---------------|------------------------------|---------------------------|
| **Parameters** | 341 million | 1.1 billion |
| **Max Duration** | Up to 11 seconds | Up to 47 seconds |
| **Sample Rate** | 44.1 kHz stereo | 44.1 kHz stereo |
| **Architecture** | VAE + T5-base + DiT | VAE + T5-large + DiT |
| **License** | Stability AI Community | Stability AI Community |
| **HuggingFace Repo** | `stabilityai/stable-audio-open-small` | `stabilityai/stable-audio-open-1.0` |
| **Optimized For** | Edge devices, CPUs | GPUs, higher quality |
| **Default Steps** | 8 (pingpong sampler) | 100 (dpmpp-3m-sde) |

### Memory Requirements

| Model | CPU (FP32) | CPU (Int8) | GPU (FP16) |
|-------|-----------|------------|------------|
| **Small** | ~6.5 GB | ~3.6 GB | ~2 GB |
| **1.0** | ~12 GB | ~7.6 GB | ~4.5 GB |

### Generation Time on HuggingFace Spaces (Free CPU Tier)

| Model | 2 sec audio | 5 sec audio |
|-------|-------------|-------------|
| **Small** | ~6-8 seconds | ~12-18 seconds |
| **1.0** | ~30-45 seconds | ~60-90 seconds |

---

## Claude Code Hook Types

Based on the [official Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks), the app supports generating sounds for all Claude Code events.

### Official Hook Events

| Hook Event | When It Triggers | Sound Character |
|------------|------------------|-----------------|
| **PreToolUse** | Before a tool call | Soft activation click |
| **PostToolUse** | After a tool completes | Quick confirmation beep |
| **Notification** | General notifications | Gentle chime |
| **Stop** | Main agent finishes | Completion tone |
| **SubagentStop** | Subagent finishes | Descending tone |

### Tool-Specific Sounds

| Tool | Sound Character |
|------|-----------------|
| `Bash` | Terminal beep |
| `Read` | Page flip |
| `Write` | Save sound |
| `Edit` | Typing click |
| `Task` | Agent launch |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                  HuggingFace Spaces (Docker, Free CPU Tier)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Docker Container                            │    │
│  │                                                                     │    │
│  │  ┌─────────────────────┐      ┌─────────────────────────────────┐   │    │
│  │  │   React Frontend    │      │        FastAPI Backend          │   │    │
│  │  │   (Static Files)    │      │                                 │   │    │
│  │  │                     │      │  ┌───────────────────────────┐  │   │    │
│  │  │  • shadcn/ui        │ HTTP │  │   Stable Audio Open       │  │   │    │
│  │  │  • Tailwind CSS     │◄────►│  │   Small / 1.0             │  │   │    │
│  │  │  • Waveform viz     │  WS  │  │   (Lazy loaded)           │  │   │    │
│  │  │  • Sound library    │      │  └───────────────────────────┘  │   │    │
│  │  │                     │      │                                 │   │    │
│  │  └─────────────────────┘      │  • Audio generation API        │   │    │
│  │         Port 80               │  • WebSocket progress          │   │    │
│  │                               │  • GitHub release API          │   │    │
│  │                               └─────────────────────────────────┘   │    │
│  │                                        Port 8000                    │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    Nginx (Reverse Proxy)                    │    │    │
│  │  │         /api/* → Backend:8000  |  /* → Frontend:80          │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                              Port 7860                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Public URL: https://{username}-ccbell-sound-generator.hf.space             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/models` | List available models |
| `GET` | `/api/themes` | Get theme presets |
| `GET` | `/api/hooks` | Get hook types with metadata |
| `POST` | `/api/generate` | Generate audio (returns job ID) |
| `GET` | `/api/audio/{job_id}` | Get generated audio file |
| `POST` | `/api/publish` | Publish to GitHub release |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `WS /api/ws/{job_id}` | Real-time progress updates |

### Request/Response Examples

**Generate Audio:**
```json
// POST /api/generate
{
  "model": "small",
  "prompt": "Short futuristic digital beep",
  "hook_type": "UserPromptSubmit",
  "duration": 2.0,
  "settings": {
    "steps": 8,
    "cfg_scale": 1.0,
    "sampler": "pingpong"
  }
}

// Response
{
  "job_id": "abc123",
  "status": "processing"
}
```

**WebSocket Progress:**
```json
// WS /api/ws/abc123
{"progress": 0.1, "stage": "loading_model"}
{"progress": 0.3, "stage": "generating"}
{"progress": 0.9, "stage": "processing"}
{"progress": 1.0, "stage": "complete", "audio_url": "/api/audio/abc123"}
```

---

## Dockerfile

```dockerfile
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.13-slim

# Create non-root user
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Install Python dependencies
COPY --chown=user backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY --chown=user backend/ ./

# Copy frontend build
COPY --from=frontend-builder --chown=user /app/frontend/dist ./static

# Expose port
EXPOSE 7860

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## Space Configuration (README.md)

```yaml
---
title: CCBell Sound Generator
emoji: 🔔
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
suggested_hardware: cpu-basic
---

# CCBell Sound Generator

Generate AI-powered notification sounds for Claude Code.

## Features
- 🎨 Polished React UI with shadcn/ui components
- 🎵 Waveform visualization and audio preview
- 🎭 Theme presets (Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical)
- 🔔 All Claude Code hook types supported
- 📦 Download individual sounds or batch ZIP
- 🚀 Publish directly to GitHub releases

## Models
- **Stable Audio Open Small** - Fast (~10-20s), good for iteration
- **Stable Audio Open 1.0** - Higher quality (~30-90s)

## Usage
1. Select a theme preset or write a custom prompt
2. Choose hook type and duration
3. Click "Generate Sound"
4. Preview with waveform, download, or add to library
5. Publish your sound pack to GitHub
```

---

## Dependencies

### Backend (pyproject.toml)
```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic-settings==2.7.1
numpy==1.23.5
scipy==1.11.4
PyGithub==2.5.0
# Plus stable-audio-tools inference dependencies
torch==2.5.1 (CPU)
torchaudio==2.5.1
stable-audio-tools==0.0.19
```

### Frontend (package.json dependencies)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.0",
    "zustand": "^5.0.0",
    "wavesurfer.js": "^7.8.0",
    "lucide-react": "^0.469.0",
    "jszip": "^3.10.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

---

## UI Components (shadcn/ui)

Required components to install:
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label select slider tabs accordion dialog dropdown-menu toast progress badge separator scroll-area skeleton textarea tooltip
```

---

## GitHub Actions: Auto-Deploy

```yaml
name: Sync to HuggingFace Spaces

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          lfs: true

      - name: Push to HuggingFace Spaces
        env:
          HF_TOKEN: ${{ secrets.HF_TOKEN }}
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git remote add hf https://oauth2:${HF_TOKEN}@huggingface.co/spaces/${{ secrets.HF_USERNAME }}/ccbell-sound-generator
          git push hf main --force
```

---

## Local Development

### Python Virtual Environment

**IMPORTANT**: Always use a virtual environment named `venv` for backend development.

```bash
# Create virtual environment (first time only)
python3 -m venv venv

# ALWAYS activate before running any backend commands
source venv/bin/activate
```

### Running the Application

```bash
# Start with docker-compose
docker-compose up --build

# Or run separately:

# Backend (activate venv first!)
source venv/bin/activate
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

---

## Verification Plan

### Backend Tests
- [ ] Health check endpoint responds
- [ ] Model list returns both models
- [ ] Theme presets load correctly
- [ ] Hook types return with metadata
- [ ] Audio generation works with Small model
- [ ] Audio generation works with 1.0 model
- [ ] WebSocket progress updates work
- [ ] Generated audio file is valid WAV
- [ ] GitHub release creation works

### Frontend Tests
- [ ] App loads without errors
- [ ] Theme presets selectable
- [ ] Hook type dropdown works
- [ ] Advanced settings toggle works
- [ ] Generate button triggers API call
- [ ] Progress bar updates via WebSocket
- [ ] Audio player plays generated sound
- [ ] Waveform renders correctly
- [ ] Download button works
- [ ] Sound library persists in session
- [ ] Publish dialog opens and submits

### Integration Tests
- [ ] Full generation flow end-to-end
- [ ] Multiple sounds in library
- [ ] Batch download creates valid ZIP
- [ ] GitHub publish creates release

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Performance
- [ ] Frontend bundle size < 500KB
- [ ] Initial load < 3 seconds
- [ ] Model lazy loading works
- [ ] Memory stays under 16GB limit

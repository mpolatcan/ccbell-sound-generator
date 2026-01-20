# CCBell Sound Generator

AI-powered notification sound generator for the Claude Code plugin "ccbell", deployed on HuggingFace Spaces.

## Project Overview

This is a full-stack web application with:
- **Backend**: FastAPI (Python 3.11-3.12) - serves API and static files
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS + shadcn/ui
- **AI Models**: Stable Audio Open (Small & 1.0) for audio generation
- **Deployment**: HuggingFace Spaces Docker SDK on free CPU tier
- **Tooling**: uv (package manager), ruff (linter/formatter), ty>=0.0.1a5 (type checker)

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
│   │   │   ├── logging.py    # Loguru logging configuration
│   │   │   └── models.py     # Pydantic models
│   │   ├── services/
│   │   │   ├── audio.py      # Audio generation
│   │   │   ├── github.py     # GitHub releases
│   │   │   └── model_loader.py
│   │   └── data/
│   │       ├── themes.py     # Theme presets
│   │       └── hooks.py      # Hook definitions
│   ├── pyproject.toml        # Dependencies and tool config
│   └── uv.lock               # Lockfile for reproducible builds
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
├── .claude/
│   ├── commands/             # Slash commands (14 commands)
│   └── skills/               # Auto-triggered skills (4 skills)
├── Dockerfile                # Production build with uv
├── docker-compose.yml        # Local development
└── README.md                 # HuggingFace Space config
```

## Claude Code Integration

### Auto-Triggered Skills

Skills are automatically invoked by Claude when relevant based on context:

| Skill | Triggers When |
|-------|---------------|
| `agent-browser` | Testing UI in browser, visual verification, form interactions, screenshots |
| `code-quality` | Fixing lint errors, formatting code, type checking |
| `project-architecture` | Explaining codebase, understanding structure |
| `deployment-workflow` | Deploying, releasing, checking deployment status |

Skills are located in `.claude/skills/` and use auto-discovery.

### Slash Commands

Manual commands for common tasks:

| Command | Description |
|---------|-------------|
| `/setup` | First-time project setup for local development |
| `/dev` | Start development servers (backend + frontend) |
| `/lint` | Run linting for both backend and frontend |
| `/format` | Format Python code using ruff |
| `/typecheck` | Run type checking (Python ty + TypeScript) |
| `/build` | Build the frontend application with Vite |
| `/verify` | Run complete pre-deployment verification checklist |
| `/release <version>` | Create version release tag and trigger deployment |
| `/docker-build` | Build production Docker image |
| `/docker-run` | Run Docker container locally for testing |
| `/sync-deps` | Update and sync Python dependencies using uv |
| `/check-hf-logs` | Check HuggingFace Space deployment logs |
| `/status` | Show project status (git, deps, environment) |
| `/clean` | Clean build artifacts, caches, and temp files |

Commands are located in `.claude/commands/`.

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
# From backend directory - activate venv
cd backend
source .venv/bin/activate

# Or from project root (if venv exists at backend/.venv)
source backend/.venv/bin/activate

# Verify activation (should show .venv path)
which python

# ruff and ty are available after activation
which ruff  # Should show .venv/bin/ruff
which ty    # Should show .venv/bin/ty
```

### Backend Development

```bash
# First-time setup (from backend directory):
cd backend
uv sync --group dev  # Creates .venv and installs all deps from lockfile

# Activate the virtual environment
source .venv/bin/activate

# Run development server (from backend directory)
uvicorn app.main:app --reload --port 8000  # Local dev uses port 8000

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
npx shadcn@latest add button card input label select slider accordion dialog toast progress badge separator scroll-area skeleton textarea collapsible
```

## Architecture

- FastAPI serves React static files at root and API at `/api/*`
- **Static Files**: Frontend build artifacts (`frontend/dist`) are served from `backend/static` in production
- WebSocket at `/api/ws/{job_id}` for real-time progress during generation
- Models lazy-loaded to manage memory on free CPU tier
- Single container exposes port 7860 for HuggingFace Spaces

## UI Components

### Sound Packs

Generated sounds are organized into **Sound Packs** - named, collapsible groups of sounds:

- **Pack Selection**: Users can create a new pack or add sounds to an existing pack via dropdown
- **Pack Name Input**: When creating new packs, users can name their pack or use auto-generated name (theme + timestamp)
- **Add to Existing**: Select an existing pack from the dropdown to add more sounds (shows sound count)
- **Real-time Progress**: Sounds appear in library immediately when generation starts with progress bar
- **Pack Actions**: Rename, download as ZIP, publish to GitHub, delete
- **Collapsible UI**: Each pack can be expanded/collapsed independently
- **Persistence**: Packs stored in session storage (cleared on page refresh)

### Key Frontend Types

```typescript
interface SoundPack {
  id: string
  name: string
  theme: string
  model: 'small' | '1.0'
  created_at: Date
}

interface GeneratedSound {
  id: string
  job_id: string
  pack_id: string           // Links sound to pack
  hook_type: HookTypeId
  prompt: string
  model: 'small' | '1.0'
  duration: number
  audio_url: string
  status: 'generating' | 'completed' | 'error'
  progress?: number         // 0-1 during generation
  stage?: string            // Current generation stage
  error?: string
  created_at: Date
}
```

### State Management

Sound library state is managed with Zustand (`useSoundLibrary` hook):
- `packs`: Array of SoundPack objects
- `sounds`: Array of GeneratedSound objects
- Pack operations: `addPack`, `removePack`, `renamePack`
- Sound operations: `addSound`, `updateSound`, `removeSound`
- Bulk: `clearAll`, `getSoundsByPack`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/models` | List available models |
| GET | `/api/models/status` | Get loading status for all models |
| GET | `/api/models/{model_id}/status` | Get loading status for a specific model |
| POST | `/api/models/{model_id}/load` | Trigger background loading of a model |
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

### Backend (Python 3.11-3.12)
- **Runtime**: FastAPI 0.115.6, uvicorn 0.34.0, pydantic-settings 2.7.1
- **Logging**: loguru 0.7.2
- **ML**: torch 2.5.1 (CPU), torchaudio 2.5.1, torchvision 0.20.1, stable-audio-tools 0.0.19
- **Audio**: numpy 1.23.5, scipy 1.11.4
- **Integrations**: PyGithub 2.5.0
- **Dev Tools**: ruff 0.9+, ty>=0.0.1a5 (type checker)

### Frontend (Node.js 22)
- React 19, TypeScript 5.7
- Vite 6, Tailwind CSS 3.4
- @tanstack/react-query 5.62, zustand 5
- lucide-react, jszip 3.10, wavesurfer.js 7.8

## Code Quality Requirements

**CRITICAL: Linting and type checking must ALWAYS pass both locally AND in GitHub Actions CI pipeline before any code is merged or deployed.**

### Local Checks (REQUIRED before every commit)

```bash
# Backend (from backend directory, venv must be active)
cd backend
source .venv/bin/activate
ruff check .              # Linting
ruff format --check .     # Format verification (use 'ruff format .' to auto-fix)
ty check .                # Type checking

# Frontend (from frontend directory)
cd frontend
npm run lint              # ESLint + TypeScript type checking
```

### CI Pipeline Verification

The CI pipeline (`.github/workflows/ci.yml`) runs the same checks automatically on every push and PR. **Your code must pass CI before merging.**

After pushing, always verify CI status:
1. Check GitHub Actions: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/ci.yml
2. Fix any failures locally and push again
3. Never merge or deploy if CI is failing

### Quick Fix Commands

```bash
# Auto-fix backend formatting issues
cd backend && ruff format .

# Auto-fix frontend linting issues (where possible)
cd frontend && npm run lint -- --fix
```

## Implementation Notes

- Use async/await consistently in FastAPI routes
- Handle WebSocket disconnections gracefully
- Lazy load ML models to stay under 16GB memory limit
- Frontend state managed with Zustand for sound library
- Use React Query for API calls with proper caching
- All audio files are 44.1kHz stereo WAV
- **After every code change, review and update CLAUDE.md to reflect changes** (new files, dependencies, environment variables, etc.)
- **Before committing, ALWAYS run linting locally**: `ruff check .`, `ruff format .`, `ty check .`, and `npm run lint`
- **ALWAYS use `agent-browser` skill to visually verify UI changes** during local development - take screenshots, interact with elements, and confirm everything renders correctly

## Dependency Management

Dependencies are managed using **uv lockfile** for reproducible builds:

- **pyproject.toml**: Declares dependencies and version constraints
- **uv.lock**: Generated lockfile with exact resolved versions (committed to git)
- **uv sync**: Installs dependencies from lockfile (used in Docker and local dev)

### Key Configuration (pyproject.toml)

```toml
[tool.uv]
# Pin critical dependencies
constraint-dependencies = ["numpy==1.23.5", "scipy==1.11.4"]

# Exclude unused transitive dependencies
exclude-dependencies = ["gradio"]

# PyTorch CPU-only index
[tool.uv.sources]
torch = [{ index = "pytorch-cpu" }]
torchaudio = [{ index = "pytorch-cpu" }]
torchvision = [{ index = "pytorch-cpu" }]

[[tool.uv.index]]
name = "pytorch-cpu"
url = "https://download.pytorch.org/whl/cpu"
explicit = true
```

### Updating Dependencies

```bash
cd backend

# Update lockfile after changing pyproject.toml
uv lock

# Sync environment with lockfile
uv sync --group dev
```

## Environment Variables

All settings can be overridden via environment variables with the `CCBELL_` prefix:

| Variable | Default | Description |
|----------|---------|-------------|
| `CCBELL_DEBUG` | `false` | Enable debug mode |
| `CCBELL_HOST` | `0.0.0.0` | Server host |
| `CCBELL_PORT` | `7860` | Server port (use 8000 for local dev via uvicorn --reload) |
| `CCBELL_APP_VERSION` | `1.0.0` | Application version |
| `CCBELL_DEFAULT_MODEL` | `small` | Default model (`small` or `1.0`) |
| `CCBELL_MODELS_CACHE_DIR` | `~/.cache/ccbell-models` | Model cache directory |
| `CCBELL_SAMPLE_RATE` | `44100` | Audio sample rate |
| `CCBELL_DEFAULT_DURATION` | `2.0` | Default audio duration (seconds) |
| `CCBELL_MAX_DURATION_SMALL` | `11.0` | Max duration for small model |
| `CCBELL_MAX_DURATION_LARGE` | `47.0` | Max duration for 1.0 model |
| `CCBELL_DEFAULT_STEPS_SMALL` | `8` | Diffusion steps for small model |
| `CCBELL_DEFAULT_STEPS_LARGE` | `100` | Diffusion steps for 1.0 model |
| `CCBELL_DEFAULT_CFG_SCALE` | `1.0` | Classifier-free guidance scale |
| `CCBELL_DEFAULT_SAMPLER_SMALL` | `pingpong` | Sampler for small model |
| `CCBELL_DEFAULT_SAMPLER_LARGE` | `dpmpp-3m-sde` | Sampler for 1.0 model |
| `CCBELL_TEMP_AUDIO_DIR` | `/tmp/ccbell-audio` | Temporary audio directory |
| `CCBELL_MAX_AUDIO_FILES` | `100` | Max stored audio files |
| `CCBELL_GITHUB_TOKEN` | `null` | GitHub token for publishing (fallback) |
| `CCBELL_HF_TOKEN` | `null` | HuggingFace token for gated model access |

## Local Testing Before Deployment

**CRITICAL: Always test locally before deploying to HuggingFace Spaces via GitHub Actions.** This prevents wasted CI/CD cycles and ensures the application works correctly in a production-like environment.

### Pre-Deployment Checklist

Before creating a release tag, complete ALL of the following:

**Code Quality (see [Code Quality Requirements](#code-quality-requirements) for details):**
- [ ] Backend linting passes: `cd backend && ruff check . && ruff format --check .`
- [ ] Backend type checking passes: `cd backend && ty check .`
- [ ] Frontend linting passes: `cd frontend && npm run lint`
- [ ] **CI pipeline passes**: Check https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/ci.yml

**Build & Runtime (MANDATORY Docker Testing):**
- [ ] Frontend builds successfully: `cd frontend && npm run build`
- [ ] Docker image builds: `docker build -t ccbell-sound-generator .`
- [ ] Docker container runs: `docker run -p 7860:7860 -e HF_TOKEN="$HF_TOKEN" ccbell-sound-generator`
- [ ] Health check passes: `curl http://localhost:7860/api/health`
- [ ] Audio generation works end-to-end in Docker (see [Docker-Based Local Testing](#docker-based-local-testing-mandatory))

**UI Visual Verification (MANDATORY):**
- [ ] Use `agent-browser` to visually verify UI (see [UI-Based Testing](#ui-based-testing-with-agent-browser-mandatory))
- [ ] Take screenshots to confirm UI renders correctly
- [ ] Verify all interactive elements are present and functional

### Docker-Based Local Testing (MANDATORY)

**CRITICAL: Docker-based testing is MANDATORY before any deployment.** This is NOT optional or just recommended - you MUST test with Docker before creating a release tag. This simulates the exact HuggingFace Spaces environment and catches issues that won't appear in development server testing:

```bash
# Build the production Docker image
docker build -t ccbell-sound-generator .

# Run the container (matches HF Spaces port)
docker run -p 7860:7860 ccbell-sound-generator

# Or with environment variables for debugging
docker run -p 7860:7860 -e CCBELL_DEBUG=true ccbell-sound-generator

# Or mount a local cache directory to persist models between runs
docker run -p 7860:7860 \
  -v ~/.cache/ccbell-models:/home/user/.cache/ccbell-models \
  ccbell-sound-generator
```

Access the application at http://localhost:7860

### Audio Generation Testing

Test the complete audio generation flow:

```bash
# 1. Start the application (Docker or local dev server)
docker run -p 7860:7860 ccbell-sound-generator

# 2. Verify API is healthy
curl http://localhost:7860/api/health

# 3. Check available models
curl http://localhost:7860/api/models

# 4. Load a model (first time takes a while to download)
curl -X POST http://localhost:7860/api/models/small/load

# 5. Check model loading status (wait until "loaded")
curl http://localhost:7860/api/models/small/status

# 6. Generate audio (hook_type is required)
curl -X POST http://localhost:7860/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "short notification chime, bright and clear",
    "model": "small",
    "hook_type": "Notification",
    "duration": 2.0
  }'
# Returns: {"job_id": "xxx-xxx-xxx"}

# 7. Check job status (wait until "completed")
curl http://localhost:7860/api/audio/{job_id}/status

# 8. Download the generated audio
curl http://localhost:7860/api/audio/{job_id} --output test.wav

# 9. Play the audio to verify
afplay test.wav  # macOS
# or: aplay test.wav  # Linux
```

### UI-Based Testing with agent-browser (MANDATORY)

**CRITICAL: ALWAYS use the `agent-browser` skill to visually verify the UI during local development.** This ensures you can see exactly what's happening in the browser and catch visual issues before deployment.

The `agent-browser` skill provides automated browser control for testing. Use it to:
- Navigate to the application
- Take screenshots to verify UI state
- Interact with forms and buttons
- Verify visual elements are rendering correctly

#### Standard UI Testing Workflow

```bash
# 1. Start the dev server first (Docker or local)
docker run -p 7860:7860 ccbell-sound-generator
# Or: npm run dev (frontend) + uvicorn (backend)

# 2. Open the application in browser
agent-browser open http://localhost:7860

# 3. Take a snapshot to see interactive elements
agent-browser snapshot -i

# 4. Take a screenshot to visually verify the UI
agent-browser screenshot ui-check.png

# 5. Test theme selection (use refs from snapshot)
agent-browser click @e1  # Click theme dropdown
agent-browser snapshot -i
agent-browser click @e2  # Select a theme option

# 6. Test hook type selection
agent-browser click @e3  # Click hook type dropdown
agent-browser snapshot -i
agent-browser click @e4  # Select a hook type

# 7. Test audio generation
agent-browser click @e5  # Click Generate button
agent-browser wait 5000  # Wait for generation
agent-browser screenshot generation-result.png

# 8. Verify progress bar animation
agent-browser snapshot -i  # Check for progress element

# 9. Test audio playback controls
agent-browser click @e6  # Click play button

# 10. Close browser when done
agent-browser close
```

#### Quick Visual Verification Checklist

```bash
# Minimum verification before any PR or deployment:
agent-browser open http://localhost:7860
agent-browser wait --load networkidle
agent-browser screenshot full-page.png --full
agent-browser snapshot -i  # Verify all interactive elements exist
agent-browser close
```

#### Record UI Testing Sessions

For debugging or documentation:

```bash
agent-browser open http://localhost:7860
agent-browser record start ./ui-test.webm
# Perform all testing steps...
agent-browser record stop
```

#### Manual Verification (Alternative)

If agent-browser is unavailable, manually verify:

1. Open http://localhost:7860 in browser
2. Select a theme (e.g., "Sci-Fi")
3. Select a hook type (e.g., "Notification")
4. Click "Generate" and wait for completion
5. Play the generated audio
6. Verify WebSocket progress updates work (progress bar should animate)
7. Test downloading the audio file
8. Test multiple generations in sequence

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Model download fails | Check HF_TOKEN is set for gated models |
| Out of memory | Use the `small` model for local testing |
| Audio generation hangs | Ensure torch is using CPU correctly |
| WebSocket not connecting | Check browser console for CORS issues |
| Container exits immediately | Check logs with `docker logs <container_id>` |

### Development Server Testing (For Fast Iteration Only)

**NOTE: This is NOT a replacement for Docker testing.** Use development servers only for fast iteration while coding. You MUST still run Docker-based testing before any deployment or release.

For faster iteration during active development:

```bash
# Terminal 1: Backend
source venv/bin/activate
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend (with API proxy to backend)
cd frontend
npm run dev
```

Access frontend at http://localhost:5173 (proxies API calls to port 8000)

**Remember:** Always follow up with Docker testing before committing or deploying.

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
1. Check deployment status: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy.yml
2. Verify Space is running: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
3. Check Space logs using the script above

**CRITICAL: Never read secrets.env from the repository. This file contains sensitive tokens and is gitignored. Always create your local copy from secrets.env.example.**

### Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token with write access (for CI/CD deployment) |
| `HF_USERNAME` | HuggingFace username/organization |

### Environment

The deploy workflow uses a `production` environment for deployment approvals (optional).

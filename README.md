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

<!-- deploy-version: will be updated by CI -->

# CCBell Sound Generator

Generate AI-powered notification sounds for the [Claude Code](https://github.com/anthropics/claude-code) plugin [ccbell](https://github.com/anthropics/ccbell).

## Features

- 🎨 **Polished UI** - Modern React interface with shadcn/ui components
- 🎵 **Waveform Visualization** - Visual audio preview with waveform display
- 🎭 **Theme Presets** - Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical
- 🔔 **All Hook Types** - Generate sounds for all Claude Code events
- 📦 **Sound Packs** - Organize generated sounds in named, collapsible packs
- ⏱️ **Custom Duration** - Generate sounds from 0.5s to 11s (or 47s with 1.0 model)
- 🔄 **Real-time Progress** - Watch generation progress in the Sound Library
- 💾 **Download** - Individual sounds or batch ZIP (organized by pack)
- 🚀 **GitHub Release** - Publish sound packs directly to GitHub

## Models

| Model | Parameters | Max Duration | Best For |
|-------|-----------|--------------|----------|
| **Stable Audio Open Small** | 341M | 11 sec | Fast iteration, CPU |
| **Stable Audio Open 1.0** | 1.1B | 47 sec | Higher quality |

## Usage

1. **Name your pack** - Enter a custom name or use the auto-generated one
2. **Select a theme** - Choose from preset themes or write a custom prompt
3. **Choose hook types** - Select one or more Claude Code events
4. **Adjust duration** - Set how long the sound should be (0.5s to 11s)
5. **Generate** - Click "Generate Sound" and watch progress in the Sound Library
6. **Preview** - Listen to generated sounds with waveform visualization
7. **Download or Publish** - Save pack as ZIP or publish to GitHub

## Claude Code Hook Types

The app generates sounds for these Claude Code events:

| Hook Event | Description |
|------------|-------------|
| **PreToolUse** | Before a tool call executes |
| **PostToolUse** | After a tool completes |
| **Notification** | General notifications |
| **Stop** | Main agent finishes |
| **SubagentStop** | Subagent finishes |
| **Bash** | Terminal command execution |
| **Read** | File read operation |
| **Write** | File write/create operation |
| **Edit** | File edit operation |
| **Task** | New agent/task spawned |
| **Error** | Error or failure occurred |
| **Success** | Operation completed successfully |
| **Warning** | Warning or caution indicator |
| **Progress** | Task progress milestone |

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 22+
- Docker (optional)

### Quick Start with Docker

```bash
docker-compose up --build
```

Visit http://localhost:7860

### Manual Setup

**Prerequisites:**

```bash
# Install uv (fast Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install ruff (linter/formatter) and ty (type checker)
uv tool install ruff
uv tool install ty
```

**Backend:**

```bash
# Create venv at project root (first time only)
cd backend
uv venv ../venv

# ALWAYS activate venv before running Python commands
source ../venv/bin/activate  # or: source venv/bin/activate from project root

# Install dependencies
uv pip install -e ".[dev]"
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install --no-deps stable-audio-tools

# Run server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 (frontend) or http://localhost:8000 (API)

## Tech Stack

- **Backend**: FastAPI, Python 3.11, Stable Audio Tools
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, shadcn/ui
- **AI Models**: Stable Audio Open (Small & 1.0)
- **Deployment**: HuggingFace Spaces (Docker SDK)

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/models` | List available models |
| GET | `/api/models/status` | Get loading status for all models |
| GET | `/api/models/{model_id}/status` | Get loading status for a specific model |
| POST | `/api/models/{model_id}/load` | Trigger background loading of a model |
| GET | `/api/themes` | Get theme presets |
| GET | `/api/hooks` | Get hook types |
| POST | `/api/generate` | Start audio generation |
| GET | `/api/audio/{job_id}/status` | Get job status and progress |
| GET | `/api/audio/{job_id}` | Download generated audio |
| DELETE | `/api/audio/{job_id}` | Delete job and audio file |
| WS | `/api/ws/{job_id}` | Real-time progress updates |
| POST | `/api/publish` | Publish to GitHub release |

## Deployment

This app auto-deploys to HuggingFace Spaces via GitHub Actions.

Required secrets (GitHub repo):
- `HF_TOKEN` - HuggingFace access token (for CI/CD deployment)
- `HF_USERNAME` - HuggingFace username

For the Space to load gated models, add this secret in HuggingFace Space settings:
- `CCBELL_HF_TOKEN` - HuggingFace access token (for gated model access)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

- [Stable Audio Open](https://huggingface.co/stabilityai/stable-audio-open-small) by Stability AI
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic
- [shadcn/ui](https://ui.shadcn.com/) for UI components

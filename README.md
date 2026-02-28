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
short_description: Generate sound packs for Claude Code ccbell plugin
---

<!-- deploy-version: will be updated by CI -->

# CCBell Sound Generator

Generate AI-powered notification sounds for the [Claude Code](https://github.com/anthropics/claude-code) plugin [ccbell](https://github.com/anthropics/ccbell).

## Features

- 🎨 **Polished UI** - Modern React interface with shadcn/ui components
- 🎵 **Waveform Visualization** - Visual audio preview with waveform display
- 🎭 **Theme Presets** - Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical, Ambient, Jazz, Custom
- 🔔 **All Hook Types** - Generate sounds for all Claude Code events
- 📦 **Sound Packs** - Organize sounds in named packs; add to existing packs or create new ones
- ⏱️ **Custom Duration** - Generate sounds from 0.5s to 11s (or 47s with 1.0 model)
- 🔄 **Real-time Progress** - Watch generation progress in the Sound Library
- 💾 **Download** - Individual sounds or batch ZIP (organized by pack)
- 🚀 **GitHub Release** - Publish sound packs directly to GitHub (admin space only)

## Models

| Model | Parameters | Max Duration | Best For |
|-------|-----------|--------------|----------|
| **Stable Audio Open Small** | 341M | 11 sec | Fast iteration, CPU |
| **Stable Audio Open 1.0** | 1.1B | 47 sec | Higher quality |

## Usage

1. **Select or create a pack** - Choose an existing pack to add sounds, or create a new one
2. **Select a theme** - Choose from preset themes or write a custom prompt
3. **Choose hook types** - Select one or more Claude Code events
4. **Adjust duration** - Set how long the sound should be (0.5s to 11s)
5. **Generate** - Click "Generate Sound" and watch progress in the Sound Library
6. **Preview** - Listen to generated sounds with waveform visualization
7. **Download or Publish** - Save pack as ZIP or publish to GitHub

## Claude Code Hook Types

The app generates sounds for these Claude Code hook events:

| Hook Event | Description |
|------------|-------------|
| **Stop** | Main agent has finished its task |
| **SubagentStop** | A subagent has finished its task |
| **PermissionPrompt** | Tool needs user permission to proceed |
| **IdlePrompt** | Agent is idle and waiting for user input |
| **SessionStart** | A new Claude Code session has started |
| **SessionEnd** | Claude Code session has ended |
| **PreToolUse** | Triggered before a tool call executes |
| **PostToolUse** | Triggered after a tool completes execution |
| **SubagentStart** | A new subagent has been spawned |
| **UserPromptSubmit** | User has submitted a new prompt |

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
# Or with Homebrew: brew install uv
```

**Backend:**

```bash
cd backend

# Create venv and install dependencies (first time only)
uv venv venv
uv sync --group dev  # Installs all deps including ruff and ty

# ALWAYS activate venv before running Python commands
source venv/bin/activate

# Verify tools are available
which ruff  # Should show venv/bin/ruff
which ty    # Should show venv/bin/ty

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
| GET | `/api/health` | Health check (includes `publish_enabled` flag) |
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
| POST | `/api/publish` | Publish to GitHub release (requires `CCBELL_GITHUB_TOKEN`) |

## Deployment

This app auto-deploys to two HuggingFace Spaces via GitHub Actions using a matrix strategy:

| Space | Purpose | Publish Feature |
|-------|---------|-----------------|
| `ccbell-sound-generator` | Public — anyone can generate sounds | Hidden |
| `ccbell-sound-generator-admin` | Admin — includes GitHub publish | Visible |

Deployment is triggered by version tags (`v*.*.*`) or manual workflow dispatch.

### GitHub Repository Secrets

| Secret | Purpose |
|--------|---------|
| `HF_TOKEN` | HuggingFace access token (used for CI/CD push to both spaces) |
| `HF_USERNAME` | HuggingFace username |

### HuggingFace Space Secrets

Set these in each Space's settings:

| Secret | Space | Purpose |
|--------|-------|---------|
| `CCBELL_HF_TOKEN` | Both | Access to gated Stable Audio models |
| `CCBELL_GITHUB_TOKEN` | Admin only | Enables GitHub publish feature |

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

- [Stable Audio Open](https://huggingface.co/stabilityai/stable-audio-open-small) by Stability AI
- [Claude Code](https://github.com/anthropics/claude-code) by Anthropic
- [shadcn/ui](https://ui.shadcn.com/) for UI components

# CCBell Sound Generator - Implementation Plan

## Overview
A Gradio web application deployed on HuggingFace Spaces (free CPU tier) that generates AI-powered notification sounds for the Claude Code plugin "ccbell" using Stability AI's Stable Audio Open Small model.

## Tech Stack
| Layer | Technology | Justification |
|-------|------------|---------------|
| Platform | **HuggingFace Spaces** | Free hosting, no maintenance, public access |
| Framework | **Gradio 5.0** | Simple UI, built-in audio player, HF Spaces native |
| AI Models | **Stable Audio Open Small & 1.0** | User-selectable models for different needs |
| Audio | **soundfile** | WAV file creation for export |
| GitHub | **PyGithub** | Publish sound packs to GitHub releases |
| CI/CD | **GitHub Actions** | Auto-sync repo to HuggingFace Spaces |

## Key Features
1. **Model Selection**: Choose between Stable Audio Open Small (fast) or 1.0 (higher quality)
2. **Advanced Settings**: Fine-tune generation parameters (steps, CFG scale, sampler, sigma) with model-specific defaults
3. **Theme System**: Preset themes (sci-fi, retro-8bit, nature, minimal, mechanical) + custom prompts
4. **Hook Types**: Generate sounds for different Claude Code events (prompt_submit, task_complete, etc.)
5. **Audio Preview**: In-browser playback with Gradio's built-in player
6. **Download**: Direct download of generated sounds
7. **GitHub Release**: Publish sound packs to GitHub releases for ccbell plugin
8. **Free & Public**: Anyone can use the Space to generate sounds
9. **Auto-Deploy**: GitHub Actions syncs repository to HuggingFace Spaces

## File Structure
```
ccbell-sound-generator/
├── .github/
│   └── workflows/
│       └── sync-to-hf.yml    # GitHub Actions: sync to HuggingFace Spaces
├── app.py                     # Main Gradio application
├── requirements.txt           # Python dependencies
└── README.md                  # HuggingFace Space configuration + docs
```

## Implementation Phases

### Phase 1: Core Gradio App
- [ ] Create HuggingFace account and Space
- [ ] Basic Gradio interface with prompt input
- [ ] Stable Audio Open Small model integration
- [ ] Audio generation and playback
- [ ] Theme preset buttons

### Phase 2: Hook Type System
- [ ] Hook type dropdown (prompt_submit, task_complete, etc.)
- [ ] Session state for storing generated sounds per user
- [ ] Display list of generated sounds in session
- [ ] Download individual sounds

### Phase 3: GitHub Release Integration
- [ ] Add GitHub token as Space secret
- [ ] ZIP creation with manifest.json
- [ ] GitHub release publishing
- [ ] Release status feedback

### Phase 4: Polish & Testing
- [ ] Error handling and user feedback
- [ ] Loading states and progress indicators
- [ ] Documentation and usage tips
- [ ] Test on various browsers

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

### Generation Parameters

**Stable Audio Open Small:**
```python
steps = 8              # Only 8 inference steps (optimized for speed)
cfg_scale = 1.0        # Classifier-free guidance scale
sampler_type = "pingpong"  # Optimized sampler for small model
```

**Stable Audio Open 1.0:**
```python
steps = 100            # More steps for higher quality
cfg_scale = 7.0        # Higher guidance for better prompt adherence
sampler_type = "dpmpp-3m-sde"  # Standard diffusion sampler
```

### When to Use Each Model

| Use Case | Recommended Model |
|----------|-------------------|
| Quick iteration / testing | Small |
| Final production sounds | 1.0 |
| Short notifications (<3s) | Small |
| Longer audio / complex prompts | 1.0 |
| Batch generation | Small |
| Highest quality single sounds | 1.0 |

### Why Both Models for CCBell
1. **Small Model**: Fast iteration (6-18s), good enough for most notifications
2. **1.0 Model**: Higher quality when you need the best sound
3. **Flexibility**: Users can choose speed vs quality tradeoff
4. **Memory**: Both fit in 16GB RAM (HF Spaces free tier)

---

## Claude Code Hook Types

Based on the [official Claude Code hooks documentation](https://code.claude.com/docs/en/hooks), the app supports generating sounds for all Claude Code events.

### Official Hook Events

| Hook Event | When It Triggers | Use Case |
|------------|------------------|----------|
| **PreToolUse** | Before a tool call is processed | Alert that a tool is about to run |
| **PostToolUse** | After a tool completes successfully | Confirm tool execution finished |
| **PermissionRequest** | When permission dialog is shown | Alert user attention needed |
| **Notification** | When Claude Code sends notifications | General notifications |
| **UserPromptSubmit** | When user submits a prompt | Confirm input received |
| **Stop** | When main agent finishes responding | Task completion signal |
| **SubagentStop** | When a subagent (Task) finishes | Subagent completion signal |
| **PreCompact** | Before context compaction | Warning about compaction |
| **SessionStart** | When session starts or resumes | Session beginning |
| **SessionEnd** | When session ends | Session ending |

### Hook Reference with Sound Characteristics

| Hook | Emoji | Sound Character | Recommended Duration |
|------|-------|-----------------|---------------------|
| `PreToolUse` | 🔧 | Soft mechanical click, tool activating | 0.3-0.5s |
| `PostToolUse` | ✅ | Quick confirmation beep, tool finished | 0.3-0.5s |
| `PermissionRequest` | 🔐 | Attention-grabbing alert, user action needed | 1.0-1.5s |
| `Notification` | 🔔 | Gentle notification chime, new alert | 0.5-1.0s |
| `UserPromptSubmit` | 📝 | Subtle confirmation beep, message sent | 0.3-0.5s |
| `Stop` | 🏁 | Resolving completion tone, task finished | 0.5-1.0s |
| `SubagentStop` | 🤖 | Descending tone, subagent completed | 0.5-1.0s |
| `PreCompact` | 📦 | Warning tone, context compacting | 0.5-1.0s |
| `SessionStart` | ▶️ | Welcoming startup sound, session beginning | 0.5-1.0s |
| `SessionEnd` | ⏹️ | Closing sound, session ending | 0.5-1.0s |

### Tool-Specific Sounds (PreToolUse/PostToolUse Matchers)

You can also generate sounds for specific tools:

| Tool | Description | Sound Character |
|------|-------------|-----------------|
| `Bash` | Shell command execution | Terminal beep, command executing |
| `Read` | File reading | Soft page flip sound |
| `Write` | File writing | Save/write sound |
| `Edit` | File editing | Typing click sound |
| `Glob` | File pattern matching | Search swoosh sound |
| `Grep` | Content searching | Search ping sound |
| `WebFetch` | Web content fetching | Network connection sound |
| `WebSearch` | Web searching | Search activation sound |
| `Task` | Subagent spawning | Agent launch sound |

### Notification Type Matchers

| Notification Type | Description | Sound Character |
|-------------------|-------------|-----------------|
| `permission_prompt` | Permission dialog shown | Alert requiring attention |
| `idle_prompt` | System is idle | Gentle reminder tone |
| `auth_success` | Authentication successful | Positive confirmation |
| `elicitation_dialog` | Dialog requesting input | Attention-grabbing prompt |

### Sound Design Guidelines

| Event Type | Characteristics | Duration |
|------------|-----------------|----------|
| **Pre-events** | Subtle, non-intrusive activation | 0.3-0.5s |
| **Post-events** | Quick confirmation, resolution | 0.3-0.5s |
| **Notifications** | Clear, attention-grabbing | 0.5-1.0s |
| **Permission requests** | Prominent, requires attention | 1.0-1.5s |
| **Session events** | Distinctive, memorable | 0.5-1.0s |

---

## HuggingFace Spaces Deployment

### Free CPU Tier Specs
| Spec | Value |
|------|-------|
| **Hardware** | 2 vCPU, 16GB RAM |
| **Cost** | $0 (completely free) |
| **Quotas** | None (fair use policy) |
| **Sleep** | After 48h inactivity (wakes on request) |

### Expected Performance
| Duration | Generation Time |
|----------|-----------------|
| 2 seconds | ~6-8 seconds |
| 5 seconds | ~12-18 seconds |

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│           HuggingFace Spaces (Free CPU Tier)                │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Gradio Application                    │ │
│  │  ┌────────────────────┐  ┌──────────────────────────┐  │ │
│  │  │ Stable Audio Open  │  │ Stable Audio Open 1.0    │  │ │
│  │  │ Small (~3.6GB)     │  │ (~7.6GB) - Higher quality│  │ │
│  │  └────────────────────┘  └──────────────────────────┘  │ │
│  │         ↑ Model Selection Dropdown (lazy loading) ↑    │ │
│  │                                                        │ │
│  │  Tab 1: Generate Sounds                                │ │
│  │  Tab 2: Publish to GitHub                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Public URL: https://{username}-ccbell-sound-generator.hf.space
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               GitHub Actions CI/CD Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│  Push to main → Sync to HuggingFace Spaces automatically    │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Implementation

### Space Configuration (`README.md`)
```yaml
---
title: CCBell Sound Generator
emoji: 🔔
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: 5.0.0
app_file: app.py
pinned: false
license: mit
suggested_hardware: cpu-basic
---

# CCBell Sound Generator

Generate AI-powered notification sounds for Claude Code.

## Features
- Theme presets (Sci-Fi, Retro 8-bit, Nature, Minimal, Mechanical)
- Hook type sounds (prompt_submit, task_complete, tool_error, etc.)
- Direct download or publish to GitHub releases
- Powered by Stable Audio Open Small (341M params)

## Usage
1. Select a theme preset or write a custom prompt
2. Choose hook type and duration
3. Click "Generate Sound"
4. Preview and download, or publish to GitHub
```

### Dependencies (`requirements.txt`)
```
torch>=2.1.0
torchaudio>=2.1.0
stable-audio-tools
einops
gradio>=5.0.0
numpy
PyGithub>=2.1.1
soundfile>=0.12.0
```

### Main Application (`app.py`)
```python
import gradio as gr
import torch
import numpy as np
import os
import io
import zipfile
import json
import hashlib
from datetime import datetime
from github import Github
from stable_audio_tools import get_pretrained_model
from stable_audio_tools.inference.generation import generate_diffusion_cond
import soundfile as sf

# =============================================================================
# Model Configuration
# =============================================================================
MODEL_CONFIGS = {
    "small": {
        "name": "Stable Audio Open Small (Fast)",
        "repo": "stabilityai/stable-audio-open-small",
        "default_steps": 8,
        "default_cfg_scale": 1.0,
        "default_sampler": "pingpong",
        "default_sigma_min": 0.3,
        "default_sigma_max": 500,
        "description": "341M params, ~6-18s generation, optimized for CPU",
    },
    "1.0": {
        "name": "Stable Audio Open 1.0 (Quality)",
        "repo": "stabilityai/stable-audio-open-1.0",
        "default_steps": 50,  # Reduced from 100 for faster CPU generation
        "default_cfg_scale": 7.0,
        "default_sampler": "dpmpp-3m-sde",
        "default_sigma_min": 0.3,
        "default_sigma_max": 500,
        "description": "1.1B params, ~30-90s generation, higher quality",
    },
}

SAMPLER_TYPES = [
    "pingpong",
    "dpmpp-3m-sde",
    "dpmpp-2m-sde",
    "k-heun",
    "k-lms",
    "k-dpmpp-2s-ancestral",
    "k-dpm-2",
    "k-dpm-fast",
]

# =============================================================================
# Lazy Model Loading (load on first use)
# =============================================================================
loaded_models = {}
SAMPLE_RATE = 44100  # Default, will be updated on model load

def get_model(model_key: str):
    """Lazy load model on first use to save memory."""
    global SAMPLE_RATE

    if model_key not in loaded_models:
        config = MODEL_CONFIGS[model_key]
        print(f"Loading {config['name']}...")

        # Unload other models to free memory
        for key in list(loaded_models.keys()):
            if key != model_key:
                print(f"Unloading {MODEL_CONFIGS[key]['name']} to free memory...")
                del loaded_models[key]
                torch.cuda.empty_cache() if torch.cuda.is_available() else None

        model, model_config = get_pretrained_model(config["repo"])
        model = model.to("cpu")
        model.eval()
        loaded_models[model_key] = (model, model_config)
        SAMPLE_RATE = model_config["sample_rate"]
        print(f"Model loaded. Sample rate: {SAMPLE_RATE}")

    return loaded_models[model_key]

# =============================================================================
# Configuration
# =============================================================================
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "username/ccbell-sounds")

THEME_PRESETS = {
    "Sci-Fi": "Short futuristic digital beep, clean electronic notification sound",
    "Retro 8-bit": "Retro 8-bit chiptune notification, classic video game sound effect",
    "Nature": "Gentle wind chime, soft natural notification bell",
    "Minimal": "Simple clean click, minimal UI notification sound",
    "Mechanical": "Mechanical typewriter click, satisfying tactile keyboard sound",
}

# =============================================================================
# Claude Code Hook Types (Official)
# Based on: https://code.claude.com/docs/en/hooks
# =============================================================================

# Main Hook Events
HOOK_EVENTS = [
    "PreToolUse",
    "PostToolUse",
    "PermissionRequest",
    "Notification",
    "UserPromptSubmit",
    "Stop",
    "SubagentStop",
    "PreCompact",
    "SessionStart",
    "SessionEnd",
]

# Tool-specific hooks (for PreToolUse/PostToolUse matchers)
TOOL_HOOKS = [
    "Bash",
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "WebFetch",
    "WebSearch",
    "Task",
]

# Notification type matchers
NOTIFICATION_TYPES = [
    "permission_prompt",
    "idle_prompt",
    "auth_success",
    "elicitation_dialog",
]

# Combined list for dropdown (organized by category)
HOOK_TYPES = HOOK_EVENTS + TOOL_HOOKS + NOTIFICATION_TYPES

# Sound modifiers for each hook type
HOOK_MODIFIERS = {
    # Main Hook Events
    "PreToolUse": "soft mechanical click, tool activating, process about to start",
    "PostToolUse": "quick confirmation beep, tool finished, operation completed",
    "PermissionRequest": "attention-grabbing alert, user action needed, permission required",
    "Notification": "gentle notification chime, new alert, attention grab",
    "UserPromptSubmit": "subtle confirmation beep, message sent, input received",
    "Stop": "resolving completion tone, task finished, agent stopped",
    "SubagentStop": "descending resolution tone, subagent completed, subprocess finished",
    "PreCompact": "warning tone, context compacting, memory cleanup",
    "SessionStart": "welcoming startup sound, session beginning, initialization",
    "SessionEnd": "closing farewell sound, session ending, shutdown",

    # Tool-specific sounds
    "Bash": "terminal beep, shell command executing, command line",
    "Read": "soft page flip sound, reading file, loading content",
    "Write": "gentle save sound, writing file, saving content",
    "Edit": "typing click sound, file editing, code modification",
    "Glob": "search swoosh sound, file pattern matching, finding files",
    "Grep": "search ping sound, content searching, text finding",
    "WebFetch": "network connection sound, web content fetching, downloading",
    "WebSearch": "search activation sound, web searching, internet query",
    "Task": "agent launch sound, subagent spawning, subprocess starting",

    # Notification types
    "permission_prompt": "prominent alert sound, permission dialog, user attention required",
    "idle_prompt": "gentle reminder tone, system idle, waiting for input",
    "auth_success": "positive confirmation chime, authentication successful, login complete",
    "elicitation_dialog": "attention prompt sound, dialog requesting input, question asked",
}

# =============================================================================
# Sound Generation
# =============================================================================
def generate_sound(model_key: str, prompt: str, hook_type: str, duration: float,
                   steps: int, cfg_scale: float, sampler_type: str,
                   sigma_min: float, sigma_max: float,
                   session_sounds: dict, progress=gr.Progress()):
    """Generate a notification sound and store in session."""
    if not prompt.strip():
        return None, "❌ Please enter a sound description", session_sounds, format_session_sounds(session_sounds)

    model_config = MODEL_CONFIGS[model_key]
    progress(0.1, desc=f"Loading {model_config['name']}...")

    # Get model (lazy loaded)
    model, config = get_model(model_key)
    sample_rate = config["sample_rate"]

    # Add hook modifier to prompt
    modifier = HOOK_MODIFIERS.get(hook_type, "")
    full_prompt = f"{prompt}, {modifier}" if modifier else prompt

    conditioning = [{
        "prompt": full_prompt,
        "seconds_start": 0,
        "seconds_total": duration,
    }]

    time_estimate = "~10-20s" if model_key == "small" else "~30-90s"
    progress(0.2, desc=f"Generating audio ({time_estimate})...")

    with torch.no_grad():
        output = generate_diffusion_cond(
            model,
            conditioning=conditioning,
            steps=steps,
            cfg_scale=cfg_scale,
            sample_size=int(duration * sample_rate),
            sigma_min=sigma_min,
            sigma_max=sigma_max,
            sampler_type=sampler_type,
            device="cpu",
        )

    progress(0.9, desc="Processing...")

    # Process output
    output = output.squeeze().cpu().numpy()
    if np.abs(output).max() > 0:
        output = output / np.abs(output).max() * 0.9

    # Store in session
    if session_sounds is None:
        session_sounds = {}

    session_sounds[hook_type] = {
        "audio": output.tolist(),  # Convert to list for JSON serialization
        "prompt": prompt,
        "duration": duration,
        "model": model_key,
        "sample_rate": sample_rate,
        "params": {
            "steps": steps,
            "cfg_scale": cfg_scale,
            "sampler": sampler_type,
        },
    }

    progress(1.0, desc="Done!")

    return (
        (sample_rate, output),
        f"✅ Generated: {hook_type} (using {model_config['name']})",
        session_sounds,
        format_session_sounds(session_sounds)
    )

def get_model_defaults(model_key: str):
    """Get all default parameters for a model."""
    config = MODEL_CONFIGS[model_key]
    return (
        config["default_steps"],
        config["default_cfg_scale"],
        config["default_sampler"],
        config["default_sigma_min"],
        config["default_sigma_max"],
    )

def format_session_sounds(session_sounds: dict) -> str:
    """Format session sounds for display."""
    if not session_sounds:
        return "No sounds generated yet."

    lines = ["**Generated Sounds:**"]
    for hook, data in session_sounds.items():
        model_name = "Small" if data.get("model") == "small" else "1.0"
        lines.append(f"- ✅ {hook} ({data['duration']}s, {model_name})")
    return "\n".join(lines)

def apply_theme(theme_name: str) -> str:
    """Apply a theme preset."""
    return THEME_PRESETS.get(theme_name, "")

# =============================================================================
# GitHub Release
# =============================================================================
def create_release(theme_name: str, version: str, session_sounds: dict, progress=gr.Progress()):
    """Create a GitHub release with all session sounds."""
    if not GITHUB_TOKEN:
        return "❌ GITHUB_TOKEN not configured. Add it in Space Settings → Repository secrets."

    if not session_sounds:
        return "❌ No sounds generated. Generate some sounds first!"

    if not theme_name.strip() or not version.strip():
        return "❌ Please enter theme name and version."

    progress(0.1, desc="Creating ZIP archive...")

    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    manifest = {
        "name": theme_name,
        "version": version,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "generator": "ccbell-sound-generator",
        "sample_rate": SAMPLE_RATE,
        "hooks": {},
    }

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for hook_type, data in session_sounds.items():
            # Convert back to numpy array
            audio = np.array(data["audio"], dtype=np.float32)

            # Get sample rate from sound data or use default
            sample_rate = data.get("sample_rate", 44100)

            # Create WAV in memory
            wav_buffer = io.BytesIO()
            sf.write(wav_buffer, audio, sample_rate, format='WAV')
            wav_bytes = wav_buffer.getvalue()

            # Add to ZIP
            zf.writestr(f"sounds/{hook_type}.wav", wav_bytes)

            # Add to manifest
            manifest["hooks"][hook_type] = {
                "filename": f"{hook_type}.wav",
                "duration_sec": data["duration"],
                "prompt": data["prompt"],
                "model": data.get("model", "small"),
                "sha256": hashlib.sha256(wav_bytes).hexdigest(),
            }

        # Add manifest
        zf.writestr("manifest.json", json.dumps(manifest, indent=2))

        # Add ccbell config
        ccbell_config = {
            "sounds": {hook: f"sounds/{hook}.wav" for hook in session_sounds.keys()}
        }
        zf.writestr("ccbell-config.json", json.dumps(ccbell_config, indent=2))

    progress(0.5, desc="Uploading to GitHub...")

    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(GITHUB_REPO)

        tag_name = f"v{version}"
        release_name = f"{theme_name} Sound Pack v{version}"
        hooks_list = "\n".join(f"- {hook}" for hook in session_sounds.keys())
        release_body = f"""## {theme_name} Sound Pack

Generated with [CCBell Sound Generator](https://huggingface.co/spaces/username/ccbell-sound-generator).

### Included Hooks
{hooks_list}

### Installation
1. Download the ZIP file
2. Extract to your ccbell sounds directory
3. Update your ccbell configuration
"""

        # Create release
        release = repo.create_git_release(
            tag=tag_name,
            name=release_name,
            message=release_body,
            draft=False,
            prerelease=False,
        )

        # Upload ZIP
        zip_buffer.seek(0)
        asset_name = f"ccbell-sounds-{theme_name.lower().replace(' ', '-')}-v{version}.zip"
        release.upload_asset_from_memory(
            zip_buffer.read(),
            len(zip_buffer.getvalue()),
            asset_name,
            content_type="application/zip"
        )

        progress(1.0, desc="Done!")
        return f"✅ Released successfully!\n\n🔗 {release.html_url}"

    except Exception as e:
        return f"❌ Error: {str(e)}"

# =============================================================================
# Gradio Interface
# =============================================================================
with gr.Blocks(title="CCBell Sound Generator", theme=gr.themes.Soft()) as demo:
    # Session state (per-user)
    session_sounds = gr.State({})

    gr.Markdown("# 🔔 CCBell Sound Generator")
    gr.Markdown("Generate AI-powered notification sounds for Claude Code")
    gr.Markdown("*Free CPU tier - Small: ~10-20s, 1.0: ~30-90s per sound*")

    with gr.Tabs():
        # =================================================================
        # Tab 1: Generate Sounds
        # =================================================================
        with gr.TabItem("🎵 Generate Sounds"):
            with gr.Row():
                with gr.Column(scale=2):
                    # Model Selection
                    model_select = gr.Dropdown(
                        choices=[
                            ("Stable Audio Open Small (Fast) - 341M params", "small"),
                            ("Stable Audio Open 1.0 (Quality) - 1.1B params", "1.0"),
                        ],
                        value="small",
                        label="🤖 Model",
                        info="Small: faster (~10-20s), 1.0: better quality (~30-90s)"
                    )

                    prompt = gr.Textbox(
                        label="Sound Description",
                        placeholder="Short futuristic beep notification",
                        lines=2,
                    )

                    gr.Markdown("#### Theme Presets")
                    with gr.Row():
                        for theme_name in THEME_PRESETS.keys():
                            gr.Button(theme_name, size="sm").click(
                                fn=lambda t=theme_name: THEME_PRESETS[t],
                                outputs=prompt
                            )

                    with gr.Row():
                        hook_type = gr.Dropdown(
                            choices=[
                                # Main Hook Events
                                ("🔧 PreToolUse - Before tool runs", "PreToolUse"),
                                ("✅ PostToolUse - After tool completes", "PostToolUse"),
                                ("🔐 PermissionRequest - Permission dialog", "PermissionRequest"),
                                ("🔔 Notification - General notification", "Notification"),
                                ("📝 UserPromptSubmit - User sends prompt", "UserPromptSubmit"),
                                ("🏁 Stop - Agent finishes", "Stop"),
                                ("🤖 SubagentStop - Subagent finishes", "SubagentStop"),
                                ("📦 PreCompact - Before compaction", "PreCompact"),
                                ("▶️ SessionStart - Session begins", "SessionStart"),
                                ("⏹️ SessionEnd - Session ends", "SessionEnd"),
                                # Tool-specific (for PreToolUse/PostToolUse)
                                ("💻 Bash - Shell command", "Bash"),
                                ("📖 Read - File reading", "Read"),
                                ("💾 Write - File writing", "Write"),
                                ("✏️ Edit - File editing", "Edit"),
                                ("🔍 Glob - File search", "Glob"),
                                ("🔎 Grep - Content search", "Grep"),
                                ("🌐 WebFetch - Web fetch", "WebFetch"),
                                ("🔍 WebSearch - Web search", "WebSearch"),
                                ("🤖 Task - Subagent spawn", "Task"),
                                # Notification types
                                ("🔐 permission_prompt", "permission_prompt"),
                                ("💤 idle_prompt", "idle_prompt"),
                                ("✅ auth_success", "auth_success"),
                                ("❓ elicitation_dialog", "elicitation_dialog"),
                            ],
                            value="UserPromptSubmit",
                            label="Hook Type",
                            info="Select the Claude Code event to generate sound for"
                        )
                        duration = gr.Slider(
                            minimum=0.5, maximum=5.0, value=2.0, step=0.5,
                            label="Duration (seconds)"
                        )

                    # Advanced Settings (collapsed by default)
                    with gr.Accordion("⚙️ Advanced Settings", open=False):
                        gr.Markdown("*Customize model parameters. Defaults are optimized for each model.*")

                        with gr.Row():
                            steps = gr.Slider(
                                minimum=4, maximum=150, value=8, step=1,
                                label="Inference Steps",
                                info="More steps = better quality, slower generation"
                            )
                            cfg_scale = gr.Slider(
                                minimum=0.0, maximum=15.0, value=1.0, step=0.5,
                                label="CFG Scale (Guidance)",
                                info="Higher = more prompt adherence"
                            )

                        with gr.Row():
                            sampler_type = gr.Dropdown(
                                choices=SAMPLER_TYPES,
                                value="pingpong",
                                label="Sampler Type",
                                info="pingpong for Small, dpmpp-3m-sde for 1.0"
                            )

                        with gr.Row():
                            sigma_min = gr.Slider(
                                minimum=0.01, maximum=1.0, value=0.3, step=0.01,
                                label="Sigma Min",
                                info="Noise schedule minimum"
                            )
                            sigma_max = gr.Slider(
                                minimum=100, maximum=1000, value=500, step=10,
                                label="Sigma Max",
                                info="Noise schedule maximum"
                            )

                        reset_defaults_btn = gr.Button("🔄 Reset to Model Defaults", size="sm")

                    generate_btn = gr.Button("🎵 Generate Sound", variant="primary", size="lg")

                with gr.Column(scale=1):
                    audio_output = gr.Audio(label="Generated Sound", type="numpy")
                    status_output = gr.Textbox(label="Status", interactive=False)
                    session_display = gr.Markdown("No sounds generated yet.")

            # Update all advanced settings when model changes
            model_select.change(
                fn=get_model_defaults,
                inputs=[model_select],
                outputs=[steps, cfg_scale, sampler_type, sigma_min, sigma_max]
            )

            # Reset to defaults button
            reset_defaults_btn.click(
                fn=get_model_defaults,
                inputs=[model_select],
                outputs=[steps, cfg_scale, sampler_type, sigma_min, sigma_max]
            )

            generate_btn.click(
                fn=generate_sound,
                inputs=[
                    model_select, prompt, hook_type, duration,
                    steps, cfg_scale, sampler_type, sigma_min, sigma_max,
                    session_sounds
                ],
                outputs=[audio_output, status_output, session_sounds, session_display],
            )

        # =================================================================
        # Tab 2: Publish Release
        # =================================================================
        with gr.TabItem("🚀 Publish Release"):
            gr.Markdown("### Publish to GitHub Release")
            gr.Markdown("Generate sounds in the first tab, then publish them here as a GitHub release.")

            session_display_release = gr.Markdown("No sounds generated yet.")

            with gr.Row():
                theme_name_input = gr.Textbox(
                    label="Theme Name",
                    placeholder="Sci-Fi",
                    value="Sci-Fi"
                )
                version_input = gr.Textbox(
                    label="Version",
                    placeholder="1.0.0",
                    value="1.0.0"
                )

            release_btn = gr.Button("🚀 Publish to GitHub", variant="primary", size="lg")
            release_output = gr.Textbox(label="Release Status", interactive=False, lines=4)

            # Update session display when tab is selected
            demo.load(
                fn=format_session_sounds,
                inputs=[session_sounds],
                outputs=[session_display_release]
            )

            release_btn.click(
                fn=create_release,
                inputs=[theme_name_input, version_input, session_sounds],
                outputs=release_output,
            )

        # =================================================================
        # Tab 3: Help & Guide
        # =================================================================
        with gr.TabItem("📚 Help & Guide"):
            gr.Markdown("### CCBell Sound Pack Guide")
            gr.Markdown("Generate notification sounds for Claude Code hooks.")

            with gr.Accordion("📦 Sound Pack Structure", open=True):
                gr.Markdown("""
Generated sound packs contain WAV audio files for each hook:

```
ccbell-sounds-{theme}-v{version}.zip
├── sounds/
│   ├── PreToolUse.wav        # Before tool execution
│   ├── PostToolUse.wav       # After tool completion
│   ├── UserPromptSubmit.wav  # User sends prompt
│   ├── Stop.wav              # Agent finishes
│   ├── Notification.wav      # General notifications
│   ├── PermissionRequest.wav # Permission dialog
│   ├── SessionStart.wav      # Session begins
│   ├── SessionEnd.wav        # Session ends
│   └── ...                   # Other hook sounds
└── manifest.json             # Pack metadata
```

*Note: Configuration format for ccbell plugin will be provided separately.*
                """)

            with gr.Accordion("🎯 Recommended Hooks", open=True):
                gr.Markdown("""
| Priority | Hook | Description |
|----------|------|-------------|
| **Essential** | `UserPromptSubmit` | Confirms your message was sent |
| **Essential** | `Stop` | Alerts you when task completes |
| **Essential** | `PermissionRequest` | Gets attention for permission dialogs |
| **Recommended** | `Notification` | General notifications |
| **Recommended** | `SessionStart` | Confirms session started |
| **Recommended** | `SessionEnd` | Confirms session ended |
| **Optional** | `PreToolUse` | Tool starting (can be noisy) |
| **Optional** | `PostToolUse` | Tool finished (can be noisy) |
                """)

            with gr.Accordion("📋 Claude Code Hook Events", open=True):
                gr.Markdown("""
**Main Events:**
- `PreToolUse` - Runs before each tool execution
- `PostToolUse` - Runs after each tool completes
- `PermissionRequest` - When Claude asks for permission
- `Notification` - General notifications
- `UserPromptSubmit` - When user sends a message
- `Stop` - When agent finishes its response
- `SubagentStop` - When a subagent completes
- `PreCompact` - Before context compaction
- `SessionStart` - When session begins
- `SessionEnd` - When session ends

**Tool-Specific Hooks (for PreToolUse/PostToolUse):**
- `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Task`

**Notification Types:**
- `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`

For full documentation, see: [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
                """)

    gr.Markdown("---")
    gr.Markdown("""
    ### Tips
    - **Model Choice**: Use Small for quick iteration, 1.0 for final production sounds
    - **Theme + Hook**: Combine a theme preset with a hook type for best results
    - **Duration**: 1-3 seconds works best for notifications
    - **Advanced Settings**: Expand to fine-tune generation parameters
    - **Reset Defaults**: Click "Reset to Model Defaults" after switching models

    ### Default Parameters by Model
    | Parameter | Small | 1.0 |
    |-----------|-------|-----|
    | Steps | 8 | 50 |
    | CFG Scale | 1.0 | 7.0 |
    | Sampler | pingpong | dpmpp-3m-sde |

    ### About
    Powered by [Stable Audio Open](https://huggingface.co/stabilityai) models:
    - **Small** (341M params): Fast, CPU-optimized
    - **1.0** (1.1B params): Higher quality, longer generation
    """)

if __name__ == "__main__":
    demo.launch()
```

---

## Deployment Steps

### 1. Create HuggingFace Account
Go to https://huggingface.co/join

### 2. Create New Space
```bash
# Install HuggingFace CLI
pip install huggingface_hub

# Login
huggingface-cli login

# Create Space
huggingface-cli repo create ccbell-sound-generator --type space --space-sdk gradio
```

### 3. Clone and Add Files
```bash
git clone https://huggingface.co/spaces/{username}/ccbell-sound-generator
cd ccbell-sound-generator

# Create files: app.py, requirements.txt, README.md
# (copy from above)

git add .
git commit -m "Initial commit"
git push
```

### 4. Configure Secrets (for GitHub Release)
1. Go to Space Settings → Repository secrets
2. Add: `GITHUB_TOKEN` (with `repo` scope)
3. Add: `GITHUB_REPO` (e.g., `username/ccbell-sounds`)

### 5. Wait for Build
- First build takes ~5-10 minutes (model download)
- Subsequent updates are faster

### 6. Access Your Space
```
https://{username}-ccbell-sound-generator.hf.space
```

---

## GitHub Actions: Auto-Deploy to HuggingFace Spaces

### Why Use GitHub Actions?
- **Single Source of Truth**: Keep code in GitHub, auto-deploy to HuggingFace
- **Version Control**: Full git history, branches, PRs
- **CI/CD Pipeline**: Test before deploy, automatic releases
- **Collaboration**: Team can review code before it goes live

### Workflow File (`.github/workflows/sync-to-hf.yml`)
```yaml
name: Sync to HuggingFace Spaces

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Manual trigger

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
          # Configure git
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

          # Add HuggingFace remote
          git remote add hf https://oauth2:${HF_TOKEN}@huggingface.co/spaces/${{ secrets.HF_USERNAME }}/ccbell-sound-generator

          # Push to HuggingFace
          git push hf main --force
```

### Setup Instructions

#### Step 1: Create HuggingFace Access Token
1. Go to https://huggingface.co/settings/tokens
2. Create new token with **Write** permissions
3. Copy the token (starts with `hf_...`)

#### Step 2: Add GitHub Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `HF_TOKEN` | `hf_xxxxx...` | HuggingFace write access token |
| `HF_USERNAME` | `your-username` | Your HuggingFace username |

#### Step 3: Create the Workflow File
Create `.github/workflows/sync-to-hf.yml` with the content above.

#### Step 4: Push to GitHub
```bash
git add .
git commit -m "Add HuggingFace Spaces sync workflow"
git push origin main
```

The workflow will automatically run and deploy to HuggingFace Spaces.

### Workflow Triggers
| Trigger | When |
|---------|------|
| Push to `main` | Automatically deploys on every push |
| Manual dispatch | Click "Run workflow" in GitHub Actions tab |

### Monitoring Deployments
1. Go to GitHub repo → Actions tab
2. Click on latest workflow run
3. Check logs for success/failure
4. HuggingFace Space updates within ~2-5 minutes after push

---

## CCBell Sound Pack Structure

### What is a CCBell Sound Pack?

A sound pack is a ZIP archive containing WAV audio files for each Claude Code hook event.

*Note: Configuration format for ccbell plugin will be provided separately.*

### Sound Pack Directory Structure

```
ccbell-sounds-{theme}-v{version}.zip
├── sounds/                    # Audio files directory
│   ├── PreToolUse.wav        # Before tool execution
│   ├── PostToolUse.wav       # After tool completion
│   ├── UserPromptSubmit.wav  # User sends prompt
│   ├── Stop.wav              # Agent finishes
│   ├── Notification.wav      # General notifications
│   ├── PermissionRequest.wav # Permission dialog
│   ├── SessionStart.wav      # Session begins
│   ├── SessionEnd.wav        # Session ends
│   └── ...                   # Other hook sounds
└── manifest.json             # Pack metadata
```

### Recommended Hooks

To create a complete sound pack, generate sounds for these recommended hooks:

| Priority | Hook | Why |
|----------|------|-----|
| **Essential** | `UserPromptSubmit` | Confirms your message was sent |
| **Essential** | `Stop` | Alerts you when task completes |
| **Essential** | `PermissionRequest` | Gets attention for permission dialogs |
| **Recommended** | `Notification` | General notifications |
| **Recommended** | `SessionStart` | Confirms session started |
| **Recommended** | `SessionEnd` | Confirms session ended |
| **Optional** | `PreToolUse` | Tool starting (can be noisy) |
| **Optional** | `PostToolUse` | Tool finished (can be noisy) |
| **Optional** | Tool-specific | Per-tool sounds |

---

## GitHub Release Structure

When you publish sounds from the Gradio app, they're automatically packaged and uploaded to GitHub as a release asset.

**Example release:**
```
Repository: username/ccbell-sounds
Tag: v1.0.0
Release: Sci-Fi Sound Pack v1.0.0
Asset: ccbell-sounds-sci-fi-v1.0.0.zip
```

---

## API Access (Programmatic)

### Python
```python
from gradio_client import Client

client = Client("username/ccbell-sound-generator")

# Generate a sound with default parameters
result = client.predict(
    model_key="small",       # or "1.0" for higher quality
    prompt="Short futuristic beep",
    hook_type="prompt_submit",
    duration=2.0,
    steps=8,                 # Advanced: inference steps
    cfg_scale=1.0,           # Advanced: guidance scale
    sampler_type="pingpong", # Advanced: sampler type
    sigma_min=0.3,           # Advanced: noise schedule min
    sigma_max=500,           # Advanced: noise schedule max
    session_sounds={},
    api_name="/generate_sound"
)

audio_tuple, status, session, display = result
sample_rate, audio_data = audio_tuple

# Example with 1.0 model (higher quality)
result = client.predict(
    model_key="1.0",
    prompt="Short futuristic beep",
    hook_type="prompt_submit",
    duration=2.0,
    steps=50,                    # More steps for 1.0
    cfg_scale=7.0,               # Higher guidance for 1.0
    sampler_type="dpmpp-3m-sde", # Different sampler for 1.0
    sigma_min=0.3,
    sigma_max=500,
    session_sounds={},
    api_name="/generate_sound"
)
```

### JavaScript
```javascript
import { Client } from "@gradio/client";

const client = await Client.connect("username/ccbell-sound-generator");

// Generate with Small model (fast)
const result = await client.predict("/generate_sound", {
    model_key: "small",
    prompt: "Short futuristic beep",
    hook_type: "prompt_submit",
    duration: 2.0,
    steps: 8,
    cfg_scale: 1.0,
    sampler_type: "pingpong",
    sigma_min: 0.3,
    sigma_max: 500,
    session_sounds: {},
});

// Generate with 1.0 model (quality)
const resultHQ = await client.predict("/generate_sound", {
    model_key: "1.0",
    prompt: "Short futuristic beep",
    hook_type: "prompt_submit",
    duration: 2.0,
    steps: 50,
    cfg_scale: 7.0,
    sampler_type: "dpmpp-3m-sde",
    sigma_min: 0.3,
    sigma_max: 500,
    session_sounds: {},
});
```

---

## Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Generation time varies | Small: ~10-20s, 1.0: ~30-90s | Use Small for iteration, 1.0 for final |
| Sleep after 48h | ~30s cold start | First request wakes it |
| No persistent storage | Files cleared on restart | Download immediately |
| Gradio UI only | No custom React UI | Gradio is sufficient |
| Fair use policy | Unlimited normal use | Not an issue for CCBell |
| Model switching | Unloads previous model (~30s) | Stick to one model per session |
| Memory constraint | 16GB shared | Only one model loaded at a time |

---

## Verification Plan

### Functional Tests
- [ ] Generate sound with each theme preset
- [ ] Generate sound for each hook type
- [ ] Verify audio playback in browser
- [ ] Download generated sound
- [ ] Session state persists across generations

### Model Tests
- [ ] Generate sound with Small model (default)
- [ ] Generate sound with 1.0 model
- [ ] Verify all parameters update when switching models
- [ ] Verify model switching unloads previous model
- [ ] Test lazy loading on first generation

### Advanced Settings Tests
- [ ] Expand Advanced Settings accordion
- [ ] Modify steps and verify generation uses new value
- [ ] Modify CFG scale and verify effect on output
- [ ] Change sampler type and verify it works
- [ ] Adjust sigma_min/sigma_max and verify generation
- [ ] Click "Reset to Model Defaults" and verify all values reset
- [ ] Switch model and verify all advanced params update to new defaults

### GitHub Release Tests
- [ ] Publish release with single sound
- [ ] Publish release with multiple sounds
- [ ] Verify ZIP structure and manifest (includes model field)
- [ ] Download and extract release
- [ ] Verify audio file integrity (checksums)

### GitHub Actions Tests
- [ ] Push to main triggers workflow
- [ ] Workflow successfully deploys to HuggingFace
- [ ] Manual workflow dispatch works
- [ ] Secrets (HF_TOKEN, HF_USERNAME) are properly configured

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Performance Tests
- [ ] Small model: 2-second sound (~6-8s generation)
- [ ] Small model: 5-second sound (~12-18s generation)
- [ ] 1.0 model: 2-second sound (~30-45s generation)
- [ ] Cold start time after sleep
- [ ] Memory usage stays under 16GB

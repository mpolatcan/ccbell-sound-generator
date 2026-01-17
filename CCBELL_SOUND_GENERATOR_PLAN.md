# CCBell Sound Generator - Implementation Plan

## Overview
A Python web application that generates AI-powered notification sounds for the Claude Code plugin "ccbell" using Stability AI's Stable Audio Open Small model.

## Tech Stack
| Layer | Technology | Justification |
|-------|------------|---------------|
| Backend | **FastAPI + Python 3.11+** | Async-first, perfect for long-running audio generation |
| AI Model | **Stable Audio Open Small** | 341M params, ~1-2 sec/5s audio on Apple Silicon MPS, stereo 44.1kHz, Apache 2.0 |
| Task Queue | **AsyncMQ (Redis-based)** | Modern async-native queue (ARQ is in maintenance mode) |
| Cache/Queue | **Redis** | Job queue backend, result storage, session cache |
| Frontend | **React 18 + Vite + TypeScript** | Modern SPA, great ecosystem, type-safe |
| Styling | **Tailwind CSS** | Rapid UI development |
| Waveform | **WaveSurfer.js React** | Waveform visualization with React bindings |
| Audio | **pydub + FFmpeg** | WAV/MP3 conversion, normalization |

## Key Features
1. **Theme System**: Preset themes (sci-fi, retro-8bit, nature, minimal, mechanical) + custom text prompts
2. **Configurable Hook Types**: User-definable hooks (prompt_submit, task_complete, tool_error, etc.)
3. **Unified Model**: Stable Audio Open Small handles both SFX and short music
4. **Short Generation**: 0.5s - 5.0s notification sounds (optimized for Claude Code hooks)
5. **Audio Preview**: In-browser playback with Web Audio API
6. **Batch Generation**: Generate all hooks at once with progress tracking
7. **Export**: Download as ZIP with ccbell configuration file
8. **Auto-Shutdown**: Model unloads from memory after configurable idle timeout (default: 5 min)
9. **GitHub Release**: Publish sound packs to GitHub releases for ccbell plugin to download

## File Structure
```
ccbell-sound-generator/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Configuration (pydantic-settings)
│   ├── api/routes/
│   │   ├── generate.py         # Sound generation endpoints
│   │   ├── themes.py           # Theme endpoints
│   │   ├── hooks.py            # Hook type endpoints
│   │   ├── queue.py            # Queue status & SSE events
│   │   ├── export.py           # Export endpoints
│   │   ├── release.py          # GitHub release endpoints
│   │   └── audio.py            # Audio streaming
│   ├── core/
│   │   ├── stable_audio_wrapper.py # Stable Audio Open Small wrapper
│   │   ├── model_lifecycle.py      # Model loading/unloading with idle timeout
│   │   ├── audio_converter.py      # WAV to MP3 conversion
│   │   └── prompt_builder.py       # Theme + hook → prompt
│   ├── services/
│   │   ├── sound_generator.py  # Generation orchestration
│   │   ├── theme_service.py    # Theme management
│   │   ├── export_service.py   # ZIP/config export
│   │   └── github_release.py   # GitHub release publishing
│   ├── worker/
│   │   ├── __init__.py
│   │   ├── tasks.py            # AsyncMQ task definitions
│   │   └── settings.py         # AsyncMQ worker settings
│   ├── models/schemas.py       # Pydantic models
│   ├── data/
│   │   ├── themes.json         # Preset themes
│   │   └── hook_types.json     # Default hooks
│   └── static/                 # Served by FastAPI (built React app)
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts       # API client (fetch/axios)
│   │   ├── components/
│   │   │   ├── ThemeSelector.tsx
│   │   │   ├── HookConfigurator.tsx
│   │   │   ├── SoundCard.tsx        # Waveform + player
│   │   │   ├── WaveformPlayer.tsx   # WaveSurfer.js wrapper
│   │   │   ├── GenerationQueue.tsx  # Queue status display
│   │   │   ├── BatchGenerator.tsx   # Batch generation UI
│   │   │   ├── ProgressPanel.tsx
│   │   │   └── ReleaseManager.tsx
│   │   ├── hooks/
│   │   │   ├── useAudioPlayer.ts
│   │   │   ├── useGeneration.ts
│   │   │   └── useQueueSubscription.ts  # SSE subscription
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   └── styles/
│   │       └── index.css       # Tailwind imports
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── tests/
├── docker/
│   ├── Dockerfile.api          # API container
│   ├── Dockerfile.worker       # Worker container (with torch)
│   └── nginx.conf              # Reverse proxy config
├── docker-compose.yml          # Full stack orchestration
├── docker-compose.dev.yml      # Development overrides
├── requirements.txt
├── requirements-worker.txt     # Worker-specific (torch, audiocraft)
└── README.md
```

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Project setup with dependencies
- [ ] Configuration management (pydantic-settings)
- [ ] Stable Audio Open Small wrapper (singleton, Int8 quantized)
- [ ] Audio format converter (WAV ↔ MP3)
- [ ] Basic FastAPI app with health check

### Phase 2: Task Queue System (for batch generation)
- [ ] Redis connection setup (optional, for batch)
- [ ] AsyncMQ worker configuration
- [ ] Task definitions for batch audio generation
- [ ] Job status tracking in Redis
- [ ] API integration with queue for batch mode

### Phase 3: Generation Pipeline
- [ ] Prompt builder with theme system
- [ ] Theme and hook type data loading
- [ ] Generation API endpoints (`POST /api/generate`, status polling)
- [ ] Batch generation support

### Phase 4: Frontend (React + Vite)
- [ ] Vite + React + TypeScript project setup
- [ ] Tailwind CSS configuration
- [ ] API client with TanStack Query
- [ ] ThemeSelector component (presets + custom prompt)
- [ ] HookConfigurator component (add/remove hooks)
- [ ] ProgressPanel component (generation status)

### Phase 5: Audio Preview & Waveform
- [ ] Audio streaming endpoint
- [ ] Web Audio API player component
- [ ] Waveform visualization using WaveSurfer.js
- [ ] Play/pause/seek controls
- [ ] Volume control
- [ ] Regenerate functionality per sound
- [ ] Comparison mode (A/B testing two sounds)

### Phase 6: Export & GitHub Release
- [ ] ZIP archive export with manifest.json
- [ ] CCBell config file generation
- [ ] GitHub API integration for release publishing
- [ ] Release listing and management UI
- [ ] Error handling and validation
- [ ] Cleanup of temp files (scheduled task)

### Phase 7: Deployment (Mac M4 Mini + Tailscale)
- [ ] Docker images for ARM64/Apple Silicon (or native deployment for MPS)
- [ ] Docker Compose configuration
- [ ] Model lifecycle manager (auto-shutdown on idle)
- [ ] Tailscale access configuration
- [ ] Health checks and monitoring
- [ ] Startup scripts (launchd for native, or Docker restart policy)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate single sound |
| POST | `/api/generate/batch` | Generate multiple sounds |
| GET | `/api/generate/{job_id}/status` | Check generation status |
| GET | `/api/audio/{audio_id}` | Stream/download audio |
| GET | `/api/themes` | List preset themes |
| GET | `/api/hooks` | List hook types |
| POST | `/api/export/zip` | Export as ZIP |
| POST | `/api/release/github` | Publish sound pack to GitHub release |
| GET | `/api/release/list` | List published releases |
| GET | `/api/queue` | Get current generation queue status |
| GET | `/api/queue/events` | SSE stream for real-time updates |
| DELETE | `/api/queue/{job_id}` | Cancel a queued job |

## Key Considerations

### Performance with Stable Audio Open Small
| Scenario | 5-sec Audio Generation Time |
|----------|----------------------------|
| **Apple Silicon MPS (M4)** | **~1-2 seconds** |
| **Apple Silicon CPU** | ~3-5 seconds |
| **x86 CPU (optimized Int8)** | ~2-4 seconds |
| **NVIDIA GPU (RTX 4070)** | ~1-2 seconds |

**Why Stable Audio Open Small?**
- 341M parameters (vs AudioGen's 1.5B = 4.4x smaller)
- Optimized for ARM/x86 CPU deployment
- Native MPS (Metal Performance Shaders) support for Apple Silicon
- Stereo 44.1kHz output (CD quality)
- Apache 2.0 license

### Model Download & Setup

**Model Info**:
- **Hugging Face Repo**: `stabilityai/stable-audio-open-1.0`
- **Model Size**: ~2.8GB (FP32) or ~1.4GB (FP16)
- **Components**: VAE, T5 text encoder, DiT transformer

**Option 1: Automatic Download (Recommended)**
The model downloads automatically on first use via `stable-audio-tools`:
```python
from stable_audio_tools import get_pretrained_model

# Downloads to ~/.cache/huggingface/hub/models--stabilityai--stable-audio-open-1.0
model, model_config = get_pretrained_model("stabilityai/stable-audio-open-1.0")
```

**Option 2: Manual Download with huggingface-cli**
```bash
# Install Hugging Face CLI
pip install huggingface_hub[cli]

# Login (required for gated models, optional for public models)
huggingface-cli login

# Download model to specific directory
huggingface-cli download stabilityai/stable-audio-open-1.0 \
  --local-dir ./models/stable-audio-open \
  --local-dir-use-symlinks False

# Or download specific files only
huggingface-cli download stabilityai/stable-audio-open-1.0 \
  model.safetensors model_config.json \
  --local-dir ./models/stable-audio-open
```

**Option 3: Python Script**
```python
from huggingface_hub import snapshot_download

# Download entire model
model_path = snapshot_download(
    repo_id="stabilityai/stable-audio-open-1.0",
    local_dir="./models/stable-audio-open",
    local_dir_use_symlinks=False,
)
print(f"Model downloaded to: {model_path}")
```

**Directory Structure After Download**:
```
./models/stable-audio-open/
├── model.safetensors       # Main model weights (~2.8GB)
├── model_config.json       # Model configuration
├── vae.safetensors         # VAE encoder/decoder
└── README.md
```

**Environment Variables for Custom Cache**:
```env
# Custom cache directory (instead of ~/.cache/huggingface)
HF_HOME=/path/to/custom/cache
HUGGINGFACE_HUB_CACHE=/path/to/custom/cache

# Or in Docker
MODEL_CACHE_PATH=/app/models
```

**Docker: Pre-download Model**
To avoid downloading on first request, pre-download in Dockerfile:
```dockerfile
# Download model during build (increases image size but faster startup)
RUN python -c "from stable_audio_tools import get_pretrained_model; \
               get_pretrained_model('stabilityai/stable-audio-open-1.0')"

# Or mount volume and download separately
# docker run -v ./models:/root/.cache/huggingface ...
```

**Verify Download**:
```python
from stable_audio_tools import get_pretrained_model
import torch

model, model_config = get_pretrained_model("stabilityai/stable-audio-open-1.0")
device = "mps" if torch.backends.mps.is_available() else "cpu"
model = model.to(device)
print(f"Model loaded on {device}")
print(f"Model params: {sum(p.numel() for p in model.parameters()):,}")
```

**Chosen Approach**: Mac M4 Mini with MPS acceleration
- 5-second audio generates in ~1-2 seconds
- Fast enough for synchronous generation
- Model auto-unloads after idle timeout to free memory
- Still use queue for batch generation (multiple sounds)

### Generation Architecture

**Single Sound (Synchronous)**:
- Generation takes ~2-4 seconds → fast enough for direct API response
- No queue needed for individual sound generation
- Model loaded as singleton on API startup

**Batch Generation (AsyncMQ Queue)**:
```
┌─────────────┐     ┌─────────────┐     ┌───────────────────┐
│   FastAPI   │────▶│    Redis    │◀────│  AsyncMQ Worker   │
│   (API)     │     │   (Queue)   │     │ (Stable Audio)    │
└─────────────┘     └─────────────┘     └───────────────────┘
```

Used only for batch generation (5+ sounds at once):
1. API receives batch request (e.g., all hooks for a theme)
2. Jobs queued in Redis
3. AsyncMQ worker processes sequentially
4. Results stored, user downloads ZIP when complete

### Model Lifecycle Management
**Lazy Loading with Auto-Shutdown**:
- Model loads on first generation request (not on API startup)
- Model unloads from memory after configurable idle timeout
- Default idle timeout: 5 minutes (configurable via `MODEL_IDLE_TIMEOUT_SEC`)
- Memory freed via `gc.collect()` + `torch.mps.empty_cache()` on Apple Silicon

**Memory Footprint**:
| State | Memory Usage |
|-------|--------------|
| Model loaded (MPS) | ~4-5 GB |
| Model unloaded | ~200 MB (API only) |
| During generation | ~5-6 GB peak |

**Implementation**:
```python
class ModelLifecycle:
    def __init__(self, idle_timeout: int = 300):
        self.model = None
        self.last_used = None
        self.idle_timeout = idle_timeout  # seconds
        self._shutdown_task = None

    async def get_model(self):
        if self.model is None:
            self.model = load_stable_audio_model()
        self.last_used = time.time()
        self._schedule_shutdown()
        return self.model

    async def _shutdown_if_idle(self):
        await asyncio.sleep(self.idle_timeout)
        if time.time() - self.last_used >= self.idle_timeout:
            self._unload_model()

    def _unload_model(self):
        del self.model
        self.model = None
        gc.collect()
        torch.mps.empty_cache()  # Apple Silicon
```

### Audio Quality
- **Duration range: 0.5s - 5.0s** (notification sounds only)
- Minimum 0.5s (model needs some length for quality)
- Maximum 5.0s (sufficient for any notification type)
- Apply loudness normalization
- Fade in/out for clean playback

### Frontend: React + Vite + WaveSurfer.js

**Tech Stack**:
- **React 18** + **TypeScript**: Type-safe component-based UI
- **Vite**: Fast dev server and build tool
- **WaveSurfer.js** + **@wavesurfer/react**: Waveform visualization
- **Tailwind CSS**: Utility-first styling
- **TanStack Query**: Server state management

**WaveformPlayer Component**:
```tsx
// components/WaveformPlayer.tsx
import { useRef, useEffect, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformPlayerProps {
  audioUrl: string
  onRegenerate: () => void
}

export function WaveformPlayer({ audioUrl, onRegenerate }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4F46E5',
      progressColor: '#818CF8',
      cursorColor: '#1E1B4B',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
    })

    ws.load(audioUrl)
    ws.on('ready', () => setDuration(ws.getDuration()))
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()))
    ws.on('finish', () => setIsPlaying(false))

    wavesurferRef.current = ws
    return () => ws.destroy()
  }, [audioUrl])

  const toggle = () => {
    wavesurferRef.current?.playPause()
    setIsPlaying(!isPlaying)
  }

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

  return (
    <div className="sound-card bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="w-10 h-10 bg-indigo-600 rounded-full">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div ref={containerRef} className="flex-1" />
        <span className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => {
            setVolume(Number(e.target.value))
            wavesurferRef.current?.setVolume(Number(e.target.value))
          }}
          className="w-24"
        />
        <button
          onClick={onRegenerate}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  )
}
```

**SoundCard Component**:
```tsx
// components/SoundCard.tsx
import { WaveformPlayer } from './WaveformPlayer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateSound } from '../api/client'

interface SoundCardProps {
  hookType: string
  audioUrl: string | null
  theme: string
}

export function SoundCard({ hookType, audioUrl, theme }: SoundCardProps) {
  const queryClient = useQueryClient()

  const regenerate = useMutation({
    mutationFn: () => generateSound({ hookType, theme }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sounds'] }),
  })

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-2">{hookType}</h3>
      {audioUrl ? (
        <WaveformPlayer
          audioUrl={audioUrl}
          onRegenerate={() => regenerate.mutate()}
        />
      ) : (
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          className="w-full py-2 bg-indigo-600 rounded"
        >
          {regenerate.isPending ? 'Generating...' : 'Generate Sound'}
        </button>
      )}
    </div>
  )
}
```

**Preview Workflow**:
1. Select theme → configure hook types
2. Click "Generate" → API call with loading state
3. Sound ready → waveform renders automatically
4. Click play → audio plays with progress indicator
5. Click waveform → seek to position
6. Regenerate → mutation triggers, new sound replaces old
7. Export → downloads ZIP or publishes to GitHub

### Generation Queue UI

**Queue States**:
| State | Icon | Description |
|-------|------|-------------|
| `queued` | ⏳ | Waiting in queue |
| `processing` | 🔄 | Currently generating |
| `completed` | ✅ | Ready to preview |
| `failed` | ❌ | Generation failed |

**GenerationQueue Component**:
```tsx
// components/GenerationQueue.tsx
import { useQuery } from '@tanstack/react-query'
import { getQueueStatus } from '../api/client'

interface QueueItem {
  id: string
  hookType: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number  // 0-100 for processing
  error?: string
  audioUrl?: string
}

export function GenerationQueue() {
  const { data: queue } = useQuery({
    queryKey: ['queue'],
    queryFn: getQueueStatus,
    refetchInterval: 1000,  // Poll every second during generation
  })

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Generation Queue</h3>
      <div className="space-y-2">
        {queue?.items.map((item: QueueItem) => (
          <QueueItemRow key={item.id} item={item} />
        ))}
      </div>

      {queue?.items.length === 0 && (
        <p className="text-gray-500 text-center py-4">No sounds in queue</p>
      )}
    </div>
  )
}

function QueueItemRow({ item }: { item: QueueItem }) {
  const statusIcon = {
    queued: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌',
  }[item.status]

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded">
      <span className="text-xl">{statusIcon}</span>
      <div className="flex-1">
        <p className="font-medium">{item.hookType}</p>
        {item.status === 'processing' && (
          <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${item.progress || 0}%` }}
            />
          </div>
        )}
        {item.status === 'failed' && (
          <p className="text-red-400 text-sm">{item.error}</p>
        )}
      </div>
      {item.status === 'completed' && item.audioUrl && (
        <button className="text-indigo-400 hover:text-indigo-300">
          Preview
        </button>
      )}
    </div>
  )
}
```

**Batch Generation UI**:
```tsx
// components/BatchGenerator.tsx
import { useMutation } from '@tanstack/react-query'
import { generateBatch } from '../api/client'

interface BatchGeneratorProps {
  theme: string
  hookTypes: string[]
}

export function BatchGenerator({ theme, hookTypes }: BatchGeneratorProps) {
  const batch = useMutation({
    mutationFn: () => generateBatch({ theme, hookTypes }),
  })

  const completedCount = batch.data?.completed || 0
  const totalCount = hookTypes.length

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Batch Generation</h3>
        <span className="text-sm text-gray-400">
          {completedCount} / {totalCount} sounds
        </span>
      </div>

      {/* Overall progress */}
      <div className="w-full bg-gray-600 rounded-full h-3 mb-4">
        <div
          className="bg-indigo-500 h-3 rounded-full transition-all"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Generate All button */}
      <button
        onClick={() => batch.mutate()}
        disabled={batch.isPending}
        className="w-full py-3 bg-indigo-600 rounded-lg font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {batch.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">🔄</span>
            Generating {completedCount + 1} of {totalCount}...
          </span>
        ) : (
          `Generate All ${totalCount} Sounds`
        )}
      </button>
    </div>
  )
}
```

**Real-time Updates (WebSocket or Polling)**:
```tsx
// hooks/useQueueSubscription.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useQueueSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Option 1: Server-Sent Events (simpler)
    const eventSource = new EventSource('/api/queue/events')

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data)
      queryClient.invalidateQueries({ queryKey: ['queue'] })

      // If a sound completed, refresh the sounds list
      if (update.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['sounds'] })
      }
    }

    return () => eventSource.close()
  }, [queryClient])
}

// Alternative: Polling (simpler, already shown above with refetchInterval)
```

**Queue API Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue` | Get current queue status |
| GET | `/api/queue/events` | SSE stream for real-time updates |
| DELETE | `/api/queue/{job_id}` | Cancel a queued job |

### GitHub Release Integration
**Purpose**: Publish generated sound packs to GitHub releases for ccbell plugin to download.

**Release Structure**:
```
ccbell-sounds-{theme}-v{version}.zip
├── sounds/
│   ├── prompt_submit.mp3
│   ├── task_complete.mp3
│   ├── tool_error.mp3
│   └── ...
├── manifest.json         # Metadata (theme, version, hooks, checksums)
└── ccbell-config.json    # Ready-to-use ccbell configuration
```

**manifest.json**:
```json
{
  "name": "sci-fi",
  "version": "1.0.0",
  "description": "Futuristic sci-fi notification sounds",
  "hooks": ["prompt_submit", "task_complete", "tool_error"],
  "files": {
    "prompt_submit": {
      "filename": "prompt_submit.mp3",
      "duration_sec": 1.5,
      "sha256": "abc123..."
    }
  },
  "created_at": "2024-01-15T10:00:00Z",
  "generator_version": "1.0.0"
}
```

**GitHub Release Workflow**:
1. Generate sounds for a theme (via web UI or batch API)
2. Click "Publish to GitHub" button
3. App creates ZIP with manifest
4. App uses GitHub API to create release with ZIP asset
5. ccbell plugin fetches latest release manifest and downloads sounds

**ccbell Plugin Integration**:
- ccbell fetches: `https://api.github.com/repos/{owner}/{repo}/releases/latest`
- Downloads ZIP from release assets
- Extracts sounds to ccbell config directory
- Updates ccbell configuration automatically

## Dependencies

### Backend (Python)
```
# Core
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
torch>=2.1.0
stable-audio-tools  # Stability AI's Stable Audio Open
einops
pydub>=0.25.1
python-dotenv>=1.0.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
aiofiles>=23.2.1

# Task Queue (for batch generation only)
asyncmq>=0.2.0
redis>=5.0.0

# GitHub Release
PyGithub>=2.1.1

# System: FFmpeg, Redis (optional for batch)
```

### Frontend (npm)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "wavesurfer.js": "^7.7.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

## Deployment Strategy

### Architecture (Mac M4 Mini + Tailscale)
```
┌─────────────────────────────────────────────────────────────┐
│                      Mac M4 Mini                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        FastAPI + Model Lifecycle Manager                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Stable Audio Open Small (loads on demand)        │  │ │
│  │  │ Unloads after 5 min idle → frees ~4GB RAM        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                   ┌──────┴──────┐                            │
│                   │    Redis    │ (batch only, optional)     │
│                   └─────────────┘                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Shared Volume (audio files)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Memory: ~200MB idle │ ~5GB active │ ~6GB peak generation   │
└─────────────────────────────────────────────────────────────┘
         │
         │ Tailscale VPN (encrypted, no port forwarding needed)
         ▼
    Access via: http://mac-mini:8000 or http://100.x.x.x:8000
```

### Container Specs (ARM64/Apple Silicon)
| Service | Image | Resources |
|---------|-------|-----------|
| **api** | `python:3.11-slim` + torch | 8GB RAM limit (model lifecycle managed) |
| **redis** | `redis:7-alpine` | 256MB RAM (optional, for batch) |

*Note: With auto-shutdown, the API container idles at ~200MB when model is unloaded, and uses ~5-6GB during active generation. No reverse proxy needed with Tailscale.*

### Resource Management
- **Idle Mode**: Model unloads after timeout → ~200MB RAM
- **Active Mode**: Model loaded → ~5GB RAM, ~6GB peak during generation
- **Mac M4 Mini (16GB)**: Comfortable for single-user with other apps running
- **Mac M4 Pro (24GB)**: Can handle concurrent requests without unloading

### Mac M4 Mini Home Server Deployment

**Why Mac M4 Mini?**
- Native MPS (Metal Performance Shaders) acceleration for PyTorch
- ~1-2 sec generation time (faster than most cloud CPUs)
- 16-24GB unified memory handles model + generation easily
- No recurring cloud costs
- Low power consumption (~10-30W)

**Hardware Requirements:**
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Mac Mini | M4 (16GB) | M4 Pro (24GB) |
| Storage | 20GB free | 50GB free |
| Network | Stable internet | Static IP / DDNS |

**Docker on Apple Silicon:**
- Use Docker Desktop for Mac (ARM64 native)
- PyTorch with MPS support requires specific base images
- Mount `/dev` for MPS device access in containers

**Docker Compose** (`docker-compose.yml`):
```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    platform: linux/arm64
    environment:
      - MODEL_DEVICE=cpu  # MPS not available in Docker, use native for MPS
      - MODEL_IDLE_TIMEOUT_SEC=300
      - REDIS_URL=redis://redis:6379
      - AUDIO_OUTPUT_DIR=/app/audio
    volumes:
      # Host path for generated sounds (persists across container restarts)
      - ${AUDIO_HOST_PATH:-./audio}:/app/audio
      # HuggingFace model cache (persists model downloads)
      - ${MODEL_CACHE_PATH:-./model-cache}:/root/.cache/huggingface
    ports:
      - "8000:8000"
    deploy:
      resources:
        limits:
          memory: 8G

  redis:
    image: redis:7-alpine
    platform: linux/arm64
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Sound Storage on Host System**:
Configure via environment variables in `.env`:
```env
# Host paths for Docker volume mounts
AUDIO_HOST_PATH=/Users/yourname/ccbell-sounds/audio
MODEL_CACHE_PATH=/Users/yourname/ccbell-sounds/models
```

**Directory Structure on Host**:
```
/Users/yourname/ccbell-sounds/
├── audio/
│   ├── generated/          # Raw generated sounds
│   │   ├── {session_id}/
│   │   │   ├── prompt_submit.wav
│   │   │   ├── prompt_submit.mp3
│   │   │   └── ...
│   ├── releases/           # Packaged releases ready for GitHub
│   │   └── ccbell-sounds-sci-fi-v1.0.0.zip
│   └── temp/               # Temporary files (auto-cleaned)
├── models/
│   └── stabilityai/
│       └── stable-audio-open-small/
└── .env
```

**Benefits of Host Path Volumes**:
- Sounds persist even if container is destroyed
- Easy backup and access from host system
- Can point to external drive for larger storage
- Model cache persists (no re-download on container rebuild)

**MPS-Enabled Dockerfile** (`docker/Dockerfile.api`):
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

# Install PyTorch with MPS support
RUN pip install --no-cache-dir torch torchvision torchaudio
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Note on MPS in Docker:**
MPS (Metal) is NOT directly accessible inside Docker containers on macOS. The container must run with CPU mode, but still benefits from Apple Silicon's fast ARM64 CPU. For true MPS acceleration, run the app natively (not in Docker).

**Alternative: Native Deployment (Recommended for MPS)**
For full MPS acceleration, run directly on macOS:
```bash
# Install dependencies
brew install ffmpeg redis
pip install -r requirements.txt

# Start services
brew services start redis
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Use launchd for auto-start on boot
```

**Access via Tailscale:**
- No port forwarding or SSL needed (Tailscale encrypts traffic)
- Access via Tailscale IP: `http://100.x.x.x:8000`
- Or via MagicDNS: `http://mac-mini:8000` (if enabled in Tailscale admin)
- Ensure Tailscale is installed and running on Mac Mini

### Environment Variables
```env
# API
API_HOST=0.0.0.0
API_PORT=8000
REDIS_URL=redis://redis:6379

# Model Lifecycle
MODEL_DEVICE=mps              # mps (Apple Silicon), cpu, or cuda
MODEL_IDLE_TIMEOUT_SEC=300    # Unload model after 5 min idle (saves ~4GB RAM)
MODEL_CACHE_DIR=/app/models   # HuggingFace model cache

# Worker (for batch generation)
WORKER_CONCURRENCY=1          # 1 job at a time (memory bound)
AUDIO_OUTPUT_DIR=/app/audio

# GitHub Release
GITHUB_TOKEN=ghp_xxx          # GitHub PAT with repo scope
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=ccbell-sounds

# Storage
AUDIO_RETENTION_HOURS=24
```

## Verification Plan
1. **Unit Tests**: Test Stable Audio wrapper, prompt builder, converter, model lifecycle
2. **API Tests**: Test all endpoints with httpx/pytest-asyncio
3. **Performance Test**: Verify 5-sec audio generates in <3 seconds on MPS
4. **Model Lifecycle Test**:
   - Verify model loads on first request
   - Verify model unloads after idle timeout
   - Verify memory is freed (check via `psutil` or Activity Monitor)
   - Verify model reloads correctly after unload
5. **GitHub Release Test**:
   - Create test release with sound pack
   - Verify manifest.json is correct
   - Download release and verify checksums
   - Test ccbell plugin integration
6. **Manual Testing**:
   - Generate sound for each theme
   - Preview in browser (Chrome, Firefox, Safari)
   - Export ZIP and verify contents
   - Publish to GitHub release
   - Install sounds in ccbell from GitHub release
   - Wait for idle timeout and verify RAM is freed

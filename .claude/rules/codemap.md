# Codemap — Last updated: 2026-03-08

## Backend — Python (FastAPI)

### backend/app/main.py — App entry point
- `app` FastAPI instance, `lifespan()` startup/shutdown
- Mounts: API routes at `/api`, WebSocket at `/api`, static at `/assets`
- CORS: localhost:5173, localhost:3000, Tauri origins
- `serve_index()` GET `/` — SPA index, `serve_spa()` GET `/{path}` — SPA fallback

### backend/app/api/routes.py — REST API (14 endpoints)
- `health_check()` GET `/api/health`
- `get_models()` GET `/api/models`, `get_models_status()` GET `/api/models/status`
- `get_model_status()` GET `/api/models/{model_id}/status`
- `load_model()` POST `/api/models/{model_id}/load`
- `get_themes()` GET `/api/themes`, `get_hooks()` GET `/api/hooks`
- `generate_audio()` POST `/api/generate` → creates async job
- `get_audio_status()` GET `/api/audio/{job_id}/status`
- `get_audio()` GET `/api/audio/{job_id}` → WAV file
- `delete_audio()` DELETE `/api/audio/{job_id}`
- `publish_release()` POST `/api/publish` → GitHub release
- `create_pack()` POST `/api/packs` → ZIP, `download_pack()` GET `/api/packs/{pack_id}`

### backend/app/api/websocket.py — Real-time progress
- `websocket_progress()` WS `/api/ws/{job_id}` — keepalive pings, 60s idle timeout

### backend/app/core/config.py — Settings
- `Settings` class (env_prefix `CCBELL_`), `settings` singleton
- Key: port(7860), default_model("small"), sample_rate(44100), max_concurrent_generations(2), job_max_lifetime(1800s), gh_token

### backend/app/core/models.py — Pydantic schemas
- Requests: `GenerateRequest`, `PublishRequest`, `DownloadPackRequest`
- Responses: `GenerateResponse`, `AudioStatusResponse`, `HealthResponse`, `PublishResponse`, `DownloadPackResponse`, `ModelLoadingStatus`, `ModelsStatusResponse`
- Data: `ModelInfo`, `ThemePreset`, `SubTheme`, `HookType`, `ProgressUpdate`, `GenerationSettings`
- Types: `HookTypeId` (10 literal values), `SamplerType`

### backend/app/core/logging.py — Loguru config
- `setup_logging()` — colored console output

### backend/app/services/audio.py — Audio generation
- `AudioGenerationJob` — job state (id, status, progress, stage, audio_path, error)
- `AudioService` — `create_job()`, `generate_audio()`, `get_audio_path()`, `cleanup_job()`, `register_progress_callback()`
- `audio_service` singleton
- Details: thread pool executor, silence trimming, 5ms fade, stereo conversion, float32 WAV

### backend/app/services/model_loader.py — ML model management
- `ModelLoader` — `load_model()`, `load_model_background()`, `is_loaded()`, `is_ready()`, `get_model_info()`, `get_all_models_info()`
- `model_loader` singleton
- `_ensure_model_files()` — downloads from GitHub Releases (primary) or HuggingFace Hub (fallback)
- `_download_file()` — atomic .tmp rename pattern
- Cache: `~/.cache/ccbell-models/stable-audio-open-{model_id}/`

### backend/app/services/pack.py — Sound pack ZIP creation
- `PackService` — `create_pack()`, `get_pack_path()`
- `pack_service` singleton
- ZIP contains: `pack.json` manifest + per-event `.wav` files

### backend/app/services/github.py — GitHub release publishing
- `GitHubService` — `publish_release()` → publishes to `mpolatcan/ccbell-sound-packs`
- `github_service` singleton

### backend/app/data/themes.py — Theme presets
- `THEME_PRESETS` — 8 themes: sci-fi, retro-8bit, nature, minimal, mechanical, ambient, jazz, custom
- `get_all_themes()`, `_load_sub_themes()` — loads from `hook_styles/{theme}/*.json`

### backend/app/data/hooks.py — Hook definitions
- `HOOK_TYPES` — 10 hook types (Stop, SubagentStop, PermissionPrompt, IdlePrompt, SessionStart, SessionEnd, PreToolUse, PostToolUse, SubagentStart, UserPromptSubmit)
- `HOOK_TO_EVENT_MAP` — maps HookTypeId → ccbell event name
- `get_all_hooks()`

### backend/app/data/hook_styles/ — Per-theme prompt configs
- 7 directories (sci-fi, retro-8bit, nature, minimal, mechanical, ambient, jazz) × 10 JSON substyle files each

## Frontend — TypeScript/React

### frontend/src/App.tsx — Main app component
- `<AppContent>` — header, GeneratorForm, ModelSettings, SoundLibrary, dialogs (Publish, Download, Settings, Shortcuts)
- State: selectedModel, advancedSettings, dialog open states

### frontend/src/lib/api.ts — API client
- `ApiClient` class — 14 methods matching backend routes
- `api` singleton (base URL: `127.0.0.1:7860` in Tauri, relative in web)

### frontend/src/lib/constants.ts — Global constants
- `isTauri`, `API_BASE_URL`, `WS_BASE_URL`
- `MODEL_DEFAULTS` — per-model generation params (steps, cfg, sampler, duration, sigma)
- `HOOK_TYPE_COLORS` — Tailwind color classes per hook type
- `getSamplersForModel()`

### frontend/src/types/index.ts — All TypeScript types
- API types: `ModelInfo`, `ThemePreset`, `SubTheme`, `HookType`, `HookTypeId`, `GenerateRequest`, `GenerateResponse`, `AudioStatusResponse`, `HealthResponse`, `GenerationSettings`
- App types: `GeneratedSound`, `SoundPack`, `SoundLibraryState`, `SoundStatus`
- Dialog types: `PublishPackData`, `DownloadPackData`, `PublishRequest/Response`, `DownloadPackRequest/Response`
- `HOOK_TO_EVENT_MAP` — frontend copy of hook→event mapping

### frontend/src/hooks/useGenerationQueue.ts — Generation queue
- `useGenerationQueue()` — `addToQueue()`, `cancelGeneration()`, `cancelByPackId()`, `cancelAll()`
- Zustand store: queue, isProcessing, currentSoundId
- WebSocket progress + polling fallback (2s), blob URL caching

### frontend/src/hooks/useSoundLibrary.ts — Sound/pack storage
- `useSoundLibrary` Zustand store — `addPack()`, `removePack()`, `addSound()`, `updateSound()`, `removeSound()`, `clearAll()`

### frontend/src/hooks/useModelStatus.ts — Model loading status
- `useModelStatus({modelId, autoLoad})` — polls status, auto-loads on mount
- Returns: status, progress, stage, isReady, isLoading, loadModel()

### frontend/src/hooks/useTauriBackend.ts — Desktop backend lifecycle
- `useTauriBackend()` — setup_backend → start_backend → health poll
- Returns: ready, stage, error, isDesktop, retry()

### frontend/src/hooks/useSettings.ts — Desktop settings
- `useSettings()` — get/save `AppSettings` (github_token) via Tauri commands

### frontend/src/hooks/useKeyboardShortcuts.ts — Keyboard shortcuts
- `useKeyboardShortcuts(shortcuts[])` — registers key handlers, skips in input fields

### frontend/src/hooks/useToast.ts — Toast notifications
- `useToast()`, `toast()` — shadcn-style toast system

### frontend/src/components/ — 14 React components
- `GeneratorForm` — theme/hook selection, prompt editing, generate button
- `SoundLibrary` — collapsible sound packs with play/delete
- `AudioPlayer` — wavesurfer.js audio playback
- `ThemeSelector`, `HookSelector`, `HookConfigTabs` — generation config UI
- `ModelSettings`, `ModelLoadingIndicator` — model management
- `SettingsDialog` — desktop settings (GitHub token)
- `PublishDialog`, `DownloadPackDialog` — pack export dialogs
- `DesktopBootScreen` — Tauri boot sequence UI
- `KeyboardShortcutsHelp`, `ElapsedTime` — utility components

## Desktop — Rust (Tauri v2)

### frontend/src-tauri/src/lib.rs — Tauri app with Python sidecar
- Commands: `setup_backend()`, `start_backend()`, `stop_backend()`, `check_backend_health()`, `get_settings()`, `save_settings()`
- `find_or_install_uv()`, `find_python()`, `auto_install_python()` — multi-fallback Python detection
- `SidecarState` — holds running uvicorn process
- `SetupGuard` — AtomicBool to prevent concurrent setup (React StrictMode)
- `.setup-complete` marker file for first-run detection

## CI/CD — GitHub Actions

### .github/workflows/ci.yml — Lint, build, Docker validation (push to master, PRs)
### .github/workflows/deploy-huggingface.yml — HuggingFace Spaces deployment (v* tags, manual)
### .github/workflows/build-desktop-tauri.yml — macOS/Linux Tauri installers (v* tags, manual)
### .github/workflows/build-base-image.yml — Base Docker image (push to master, path-filtered)
### .github/workflows/upload-model-weights.yml — Model weight management (manual)

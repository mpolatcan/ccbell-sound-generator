# Codemap — Last updated: 2026-03-09

## Backend — Python (FastAPI)

### backend/app/main.py — App entry point
- `app` FastAPI instance, `lifespan()`, static/SPA serving, CORS

### backend/app/api/routes.py — REST API (14 endpoints)
- `/api/health`, `/api/models/*`, `/api/themes`, `/api/hooks`
- `/api/generate`, `/api/audio/{job_id}/*`, `/api/publish`, `/api/packs/*`

### backend/app/api/websocket.py — Real-time progress
- `websocket_progress()` WS `/api/ws/{job_id}`

### backend/app/core/config.py — Settings
- `Settings` (env_prefix `CCBELL_`), `settings` singleton
- Config keys: `default_model`, `max_duration`, `default_steps`, `default_cfg_scale`, `default_sampler` (no `_small` suffix)

### backend/app/core/models.py — Pydantic schemas
- All request/response models, data types, `HookTypeId`, `SamplerType`

### backend/app/core/logging.py — Loguru config
- `setup_logging()`

### backend/app/services/audio.py — Audio generation
- `AudioGenerationJob`, `AudioService`, `audio_service` singleton

### backend/app/services/model_loader.py — ML model management
- `ModelLoader`, `model_loader` singleton
- `MODEL_FILES` (GitHub prefixed names), `HF_MODEL_FILES` (HF Hub original names)
- `_is_hf_spaces()`, `_download_from_github()`, `_download_from_huggingface()`, `_get_device()`
- HF Spaces: HF Hub primary, GitHub fallback. Desktop/Docker: GitHub primary, HF Hub fallback
- Device: CUDA > MPS (Apple Silicon, float32 only) > CPU

### backend/app/services/pack.py — Sound pack ZIP creation
- `PackService`, `pack_service` singleton

### backend/app/services/github.py — GitHub release publishing
- `GitHubService`, `github_service` singleton

### backend/app/data/themes.py — Theme presets
- `THEME_PRESETS` (8 themes), `get_all_themes()`

### backend/app/data/hooks.py — Hook definitions
- `HOOK_TYPES` (10 types), `HOOK_TO_EVENT_MAP`, `get_all_hooks()`

### backend/app/data/hook_styles/ — Per-theme prompt configs
- 7 dirs × 10 JSON substyle files each

## Frontend — TypeScript/React

### frontend/src/App.tsx — Main app component
- `<AppContent>` — orchestrates all UI panels and dialogs

### frontend/src/lib/api.ts — API client
- `ApiClient`, `api` singleton

### frontend/src/lib/constants.ts — Global constants
- `isTauri`, `API_BASE_URL`, `WS_BASE_URL`, `MODEL_DEFAULTS`, `HOOK_TYPE_COLORS`

### frontend/src/types/index.ts — All TypeScript types
- API types, app types, dialog types, `HOOK_TO_EVENT_MAP`

### frontend/src/hooks/ — 7 React hooks
- `useGenerationQueue` — generation queue + WebSocket progress (Zustand)
- `useSoundLibrary` — sound/pack CRUD (Zustand)
- `useModelStatus` — model loading status polling
- `useTauriBackend` — desktop backend lifecycle
- `useSettings` — desktop settings persistence
- `useKeyboardShortcuts` — keyboard shortcut registration
- `useToast` — toast notifications

### frontend/src/components/ — 14 React components
- `GeneratorForm`, `SoundLibrary`, `AudioPlayer`
- `ThemeSelector`, `HookSelector`, `HookConfigTabs`
- `ModelSettings`, `ModelLoadingIndicator`
- `SettingsDialog`, `PublishDialog`, `DownloadPackDialog`
- `DesktopBootScreen`, `KeyboardShortcutsHelp`, `ElapsedTime`

## Desktop — Rust (Tauri v2)

### frontend/src-tauri/src/lib.rs — Tauri app with Python sidecar
- Commands: `setup_backend`, `start_backend`, `stop_backend`, `check_backend_health`, `get_settings`, `save_settings`, `uninstall_cleanup`
- `SidecarState`, `SetupGuard`, Python auto-install flow

## CI/CD — GitHub Actions

### .github/workflows/
- `deploy-huggingface.yml` — HF Spaces deployment (v* tags)
- `publish-docker-image.yml` — app Docker image to GHCR (v* tags)
- `build-desktop-tauri.yml` — macOS/Linux Tauri installers (v* tags)
- `build-base-image.yml` — base Docker image (path-filtered)
- `upload-model-weights.yml` — model weight management (manual)

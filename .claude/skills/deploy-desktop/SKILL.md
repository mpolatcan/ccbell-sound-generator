---
name: deploy-desktop
description: Build and release Tauri v2 desktop app (macOS + Linux installers). Use when building desktop installers, checking desktop release status, or troubleshooting Tauri builds.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Deploy Desktop App (Tauri v2)

Build and release the CCBell Sound Generator desktop app as native installers.

## Deployment Pipeline

```
git tag v1.0.0 → GitHub Actions (build-desktop-tauri.yml) → Build macOS + Linux → GitHub Release (draft)
```

## Build Targets

| Platform | Runner | Output | Notes |
|----------|--------|--------|-------|
| macOS | `macos-latest` | `.dmg` (universal binary) | ARM + x86_64 via `--target universal-apple-darwin` |
| Linux | `ubuntu-22.04` | `.deb`, `.AppImage` | x64 only |

## Triggering a Desktop Release

Desktop builds are triggered automatically by version tags (`v*.*.*`) or manually via workflow dispatch:

```bash
# Create annotated tag (triggers all pipelines including desktop)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or use `/release <version>` to handle the full release flow.

### Manual Trigger (Draft Release)

Trigger manually from GitHub Actions with the `draft` option to create a draft release for testing:
- Go to: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/build-desktop-tauri.yml
- Click "Run workflow" → set `draft: true`

## Local Desktop Development

```bash
cd frontend
npm run tauri dev        # Dev mode (auto-starts Python backend sidecar)
npm run tauri build      # Build production installer locally
```

### Prerequisites for Local Build

- **Rust toolchain**: `rustup` with stable channel
- **Node.js 22+**: For frontend build
- **System deps (Linux)**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
- **macOS**: Xcode command line tools

## Monitoring Desktop Build

- **GitHub Actions**: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/build-desktop-tauri.yml
- **GitHub Releases**: https://github.com/mpolatcan/ccbell-sound-generator/releases

## Architecture

- Tauri v2 wraps the React frontend as a native app
- Python FastAPI backend runs as a sidecar process on port 7860
- **First launch**: Auto-installs Python 3.12 via `uv`, creates venv, installs deps from `requirements.txt`, starts uvicorn
- `AtomicBool` setup guard prevents race conditions from React StrictMode
- `.setup-complete` marker file tracks successful setup
- Settings persisted to app data dir (`~/Library/Application Support/com.ccbell.soundgenerator/` on macOS)

## Required Secrets

| Secret | Description |
|--------|-------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions, used for creating releases and uploading assets |

## Troubleshooting

1. **Rust compile errors**: Ensure Rust stable toolchain is installed (`rustup update stable`)
2. **Linux build fails**: Install system deps (`sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`)
3. **macOS universal build fails**: Ensure both targets are installed (`rustup target add aarch64-apple-darwin x86_64-apple-darwin`)
4. **Sidecar doesn't start**: Check `lib.rs` setup flow, verify `uv` is accessible in PATH
5. **Draft release not visible**: Draft releases are only visible to repo collaborators

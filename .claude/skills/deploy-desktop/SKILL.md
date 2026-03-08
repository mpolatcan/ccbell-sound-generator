---
name: deploy-desktop
description: Build and release Tauri v2 desktop app (macOS + Linux installers). Use when building desktop installers, checking desktop release status, or troubleshooting Tauri builds.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Deploy Desktop App (Tauri v2)

## Pipeline

```
git tag v1.0.0 → GitHub Actions (build-desktop-tauri.yml) → macOS .dmg + Linux .deb/.AppImage → GitHub Release (draft)
```

## Build Targets

| Platform | Output | Notes |
|----------|--------|-------|
| macOS | `.dmg` (universal) | ARM + x86_64 |
| Linux | `.deb`, `.AppImage` | x64, ubuntu-22.04 |

## Triggering

Triggered automatically by version tags or manually via workflow dispatch:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or use `/release <version>`. Manual draft releases via GitHub Actions UI:
https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/build-desktop-tauri.yml

## Local Build

```bash
cd frontend
npm run tauri dev        # Dev mode
npm run tauri build      # Production installer
```

**Prerequisites**: Rust toolchain, Node.js 22+. Linux: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## Monitoring

- **Actions**: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/build-desktop-tauri.yml
- **Releases**: https://github.com/mpolatcan/ccbell-sound-generator/releases

## Troubleshooting

1. **Rust errors**: `rustup update stable`
2. **Linux deps**: `sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
3. **macOS universal**: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`

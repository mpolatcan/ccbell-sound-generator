---
name: release
description: Create a new version release — triggers deployment to all targets (HuggingFace Spaces, desktop app, model weights). Use when releasing a new version.
allowed-tools: Bash, Read
argument-hint: <version>
disable-model-invocation: true
---

# Release

Create a new version release that deploys to all targets.

## Arguments
- `$ARGUMENTS` - Version number (e.g., "1.0.0" or "v1.0.0")

## Current State
- Git status: !`git status --short`
- Current branch: !`git branch --show-current`
- Existing tags: !`git tag --sort=-v:refname | head -5`
- Uncommitted changes: !`git diff --stat | tail -3`

## What a Version Tag Triggers

A single `v*.*.*` tag triggers **all deployment pipelines simultaneously**:

| Pipeline | Workflow | Target | Output |
|----------|----------|--------|--------|
| CI | `ci.yml` | — | Lint, build, Docker validation |
| Web Deploy | `deploy-huggingface.yml` | HuggingFace Spaces | 2 Spaces (public + admin) |
| Desktop Build | `build-desktop-tauri.yml` | GitHub Releases | macOS `.dmg` + Linux `.deb`/`.AppImage` |

**Note:** Model weight upload (`upload-model-weights.yml`) is manual-only and not triggered by version tags. Use `/upload-model-weights` for that.

## Instructions

### 1. Validate Version
Ensure the version follows semver format (major.minor.patch). Strip leading "v" if present for validation.

### 2. Run Pre-Release Verification
Run `/verify` to ensure all checks pass (code quality, frontend build, Docker build + health check).

### 3. Create and Push Tag
```bash
# Create annotated tag
git tag -a v$ARGUMENTS -m "Release version $ARGUMENTS"

# Push tag to trigger ALL deployment pipelines
git push origin v$ARGUMENTS
```

### 4. Monitor All Deployments

After pushing the tag, monitor all pipelines:

**Web (HuggingFace Spaces):**
- GitHub Actions: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy-huggingface.yml
- Public Space: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
- Admin Space: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator-admin
- Check logs with `/check-hf-logs`

**Desktop (Tauri):**
- GitHub Actions: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/build-desktop-tauri.yml
- GitHub Releases: https://github.com/mpolatcan/ccbell-sound-generator/releases

**CI:**
- GitHub Actions: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/ci.yml

## Important Notes
- Tags trigger ALL deployment workflows automatically (web + desktop)
- Desktop builds are created as **draft releases** by default — publish manually after verification
- Required GitHub secrets: `HF_TOKEN`, `HF_USERNAME`
- Always run `/verify` before creating a release
- Version is injected into `backend/app/core/config.py` during HF deployment
- Versions are managed independently per stack (backend, frontend, desktop) — the git tag is the unified release identifier

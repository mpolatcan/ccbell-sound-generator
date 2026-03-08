---
name: upload-model-weights
description: Upload ML model weights to GitHub Releases. Use when managing model files, re-uploading weights, or setting up model hosting on GitHub Releases.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Upload Model Weights

Download model weights from HuggingFace and upload to GitHub Releases for distribution.

## Pipeline

```
HuggingFace Hub (gated) → Download → Rename with prefix → GitHub Release (public, tag: models-v1.0)
```

## Why GitHub Releases?

- **No HF account needed**: Users can download model weights without a HuggingFace account
- **Faster downloads**: GitHub CDN is faster and more reliable for most users
- **Fallback**: The app falls back to HuggingFace Hub if GitHub is unreachable (requires `HF_TOKEN`)

## Current Model

| Model | HuggingFace Repo | Release Tag | Files |
|-------|------------------|-------------|-------|
| Stable Audio Open Small (341M) | `stabilityai/stable-audio-open-small` | `models-v1.0` | `stable-audio-open-small-model.safetensors`, `stable-audio-open-small-model_config.json` |

## Triggering Upload

This is a **manual-only** workflow (no automatic triggers):

### Via GitHub Actions UI
1. Go to: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/upload-model-weights.yml
2. Click "Run workflow"
3. Set tag (default: `models-v1.0`) — this is the GitHub Release tag for model assets
4. Click "Run workflow"

### What the Workflow Does
1. Downloads `model.safetensors` and `model_config.json` from HuggingFace Hub (requires `HF_TOKEN` secret)
2. Renames files with model prefix: `stable-audio-open-small-model.safetensors`, `stable-audio-open-small-model_config.json`
3. Creates a GitHub Release tagged `models-v1.0` (if it doesn't exist)
4. Uploads model files to the release (uses `--clobber` to overwrite existing assets)

## Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token with read access to gated models |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions, used for creating releases |

## How the App Downloads Models

The app downloads models at runtime from GitHub Releases:

1. **Primary**: `CCBELL_MODEL_DOWNLOAD_BASE_URL` → GitHub Releases URL (default)
2. **Fallback**: HuggingFace Hub (only if GitHub fails AND `HF_TOKEN` / `CCBELL_HF_TOKEN` is set)
3. **Cache**: `~/.cache/ccbell-models/stable-audio-open-{model_id}/`
4. **Atomic**: Downloads to `.tmp` file, then renames on completion

## Verifying Model Availability

```bash
# Check GitHub Release exists and has model files
gh release view models-v1.0

# List release assets
gh release view models-v1.0 --json assets --jq '.assets[].name'
```

## Adding a New Model

To add a new model in the future:
1. Add model entry to `MODEL_FILES` and `MODEL_REPOS` in `backend/app/services/model_loader.py`
2. Add model defaults to `MODEL_DEFAULTS` in `frontend/src/lib/constants.ts`
3. Update the workflow to download additional files from HuggingFace
4. Run the workflow with a new tag or append to existing release

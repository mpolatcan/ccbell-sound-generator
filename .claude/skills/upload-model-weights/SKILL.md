---
name: upload-model-weights
description: Upload ML model weights to GitHub Releases. Use when managing model files, re-uploading weights, or setting up model hosting on GitHub Releases.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Upload Model Weights

## Pipeline

```
HuggingFace Hub (gated) → Download → Rename with prefix → GitHub Release (tag: models-v1.0)
```

## Current Model

| Model | HF Repo | Release Tag | Files |
|-------|---------|-------------|-------|
| Small (341M) | `stabilityai/stable-audio-open-small` | `models-v1.0` | `stable-audio-open-small-model.safetensors`, `stable-audio-open-small-model_config.json` |

## Triggering (Manual Only)

1. Go to: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/upload-model-weights.yml
2. Click "Run workflow" → set tag (default: `models-v1.0`)

The workflow downloads from HF Hub, renames with model prefix, and uploads to GitHub Release.

## Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace token (read access to gated models) |

## How the App Downloads Models

1. **Primary**: GitHub Releases (`CCBELL_MODEL_DOWNLOAD_BASE_URL`)
2. **Fallback**: HuggingFace Hub (if GitHub fails AND `HF_TOKEN` is set)
3. **Cache**: `~/.cache/ccbell-models/stable-audio-open-{model_id}/`

## Verifying

```bash
gh release view models-v1.0 --json assets --jq '.assets[].name'
```

---
name: deploy-huggingface
description: Deploy web app to HuggingFace Spaces, check deployment status, verify HF Space logs. Use when deploying the web app, checking HF logs, or troubleshooting HuggingFace Spaces.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Deploy to HuggingFace Spaces

## Pipeline

```
git tag v1.0.0 → GitHub Actions (deploy-huggingface.yml) → 2 HF Spaces (public + admin)
```

## Pre-Deployment

Run `/verify` before deploying.

## Triggering

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or use `/release <version>` for full release flow.

## Monitoring

- **Actions**: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy-huggingface.yml
- **Public Space**: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
- **Live App**: https://mpolatcan-ccbell-sound-generator.hf.space

## Checking HF Logs

```bash
./scripts/check-hf-space-logs.sh
```

Requires `secrets.env` with `HF_TOKEN` (copy from `secrets.env.example`).

Manual check:
```bash
curl -H "Authorization: Bearer $HF_TOKEN" \
  https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator
curl https://mpolatcan-ccbell-sound-generator.hf.space/api/health
```

## Required Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token (write access) |
| `HF_USERNAME` | HuggingFace username |

## Rollback

```bash
git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0
# Fix, then recreate tag
```

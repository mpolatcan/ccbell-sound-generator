---
name: deploy-huggingface
description: Deploy web app to HuggingFace Spaces, check deployment status, verify HF Space logs. Use when deploying the web app, checking HF logs, or troubleshooting HuggingFace Spaces.
allowed-tools: Bash, Read
disable-model-invocation: true
---

# Deploy to HuggingFace Spaces

Deploy the CCBell Sound Generator web app to HuggingFace Spaces.

## Deployment Pipeline

```
git tag v1.0.0 → GitHub Actions (deploy-huggingface.yml) → Build + Test → HuggingFace Spaces (2 spaces)
```

## Targets

| Space | Purpose | Publish Feature |
|-------|---------|-----------------|
| `ccbell-sound-generator` | Public — anyone can generate sounds | Hidden |
| `ccbell-sound-generator-admin` | Admin — includes GitHub publish | Visible |

## Pre-Deployment

Run `/verify` before deploying. All checks (code quality, frontend build, Docker build + health check) must pass.

## Triggering Deployment

Deployment is triggered automatically by version tags (`v*.*.*`) or manually via workflow dispatch:

```bash
# Create annotated tag (triggers deploy)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or use `/release <version>` to handle the full release flow (deploys to all targets).

## Monitoring Deployment

- **GitHub Actions**: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy-huggingface.yml
- **HuggingFace Space**: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
- **Live App**: https://mpolatcan-ccbell-sound-generator.hf.space

## Checking HF Logs

### Using the Script
```bash
./scripts/check-hf-space-logs.sh
```

Requires `secrets.env` with `HF_TOKEN` set:
```bash
cp secrets.env.example secrets.env
# Edit and add your HuggingFace token
```

### Manual API Check
```bash
# Check Space info
curl -H "Authorization: Bearer $HF_TOKEN" \
  https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator

# Check if the Space is running
curl https://mpolatcan-ccbell-sound-generator.hf.space/api/health
```

**Note:** Never commit `secrets.env` (it's gitignored). The script streams logs in real-time. Common log issues: model download failures, memory limits, dependency errors.

## Required Secrets (GitHub)

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token with write access |
| `HF_USERNAME` | HuggingFace username/organization |

## HuggingFace Space Secrets

| Secret | Space | Purpose |
|--------|-------|---------|
| `CCBELL_HF_TOKEN` | Both | Fallback model download from HuggingFace |
| `CCBELL_GITHUB_TOKEN` | Admin only | Enables GitHub publish feature |

## Troubleshooting

1. **Model download fails**: Models download from GitHub Releases by default. HF_TOKEN is only needed as fallback.
2. **Out of memory**: Use `small` model, check for memory leaks
3. **Container exits immediately**: Check `docker logs <container_id>`
4. **Health check fails**: Verify port 7860 is exposed

### Rollback

If deployment fails, the previous version remains active. To redeploy:
```bash
git tag -d v1.0.0  # Delete local tag
git push origin :refs/tags/v1.0.0  # Delete remote tag
# Fix issues, then recreate tag
```

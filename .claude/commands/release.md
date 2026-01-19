---
description: Create a new version release tag and push to trigger deployment
allowed-tools: Bash, Read
argument-hint: <version>
---

# Release

Create a new version release.

## Arguments
- `$ARGUMENTS` - Version number (e.g., "1.0.0" or "v1.0.0")

## Current State
- Git status: !`git status --short`
- Current branch: !`git branch --show-current`
- Existing tags: !`git tag --sort=-v:refname | head -5`
- Uncommitted changes: !`git diff --stat | tail -3`

## Instructions

### 1. Validate Version
Ensure the version follows semver format (major.minor.patch). Strip leading "v" if present for validation.

### 2. Run Pre-Release Verification
Before creating a release, ensure all checks pass by running the `/verify` command or these commands:
```bash
cd backend && source .venv/bin/activate && ruff check . && ruff format --check .
cd backend && source .venv/bin/activate && ty check .
cd frontend && npm run lint
cd frontend && npm run build
docker build -t ccbell-sound-generator .
```

### 3. Create and Push Tag
```bash
# Create annotated tag
git tag -a v$ARGUMENTS -m "Release version $ARGUMENTS"

# Push tag to trigger deployment
git push origin v$ARGUMENTS
```

### 4. Monitor Deployment
After pushing the tag:
1. Check GitHub Actions: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy.yml
2. Verify HuggingFace Space: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
3. Check logs with `/check-hf-logs` command

## Important Notes
- Tags trigger the deploy.yml workflow automatically
- The workflow builds, tests, and deploys to HuggingFace Spaces
- Required secrets: HF_TOKEN, HF_USERNAME
- Always run verification before creating a release
- Version is injected into `backend/app/core/config.py` during deployment

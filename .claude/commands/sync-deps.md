---
description: Update and sync Python dependencies using uv lockfile
allowed-tools: Bash, Read
---

# Sync Dependencies

Update and sync Python dependencies using uv lockfile.

## Instructions

### Update Lockfile (after changing pyproject.toml)
```bash
cd backend && uv lock
```

### Sync Environment with Lockfile
```bash
cd backend && uv sync --group dev
```

### Full Update (both lock and sync)
```bash
cd backend && uv lock && uv sync --group dev
```

## When to Use

- **After editing pyproject.toml**: Run `uv lock` to update the lockfile
- **After pulling changes**: Run `uv sync` to ensure your environment matches the lockfile
- **Fresh clone**: Run `uv sync --group dev` to set up the environment

## Important Notes
- The lockfile (`uv.lock`) ensures reproducible builds across all environments
- Always commit `uv.lock` changes to git
- `--group dev` includes development tools (ruff, ty)
- PyTorch is automatically fetched from CPU-only index (configured in pyproject.toml)
- Gradio is excluded from dependencies (not needed for inference)

## Dependency Configuration

Key settings in `pyproject.toml`:
- `constraint-dependencies`: Pins numpy==1.23.5, scipy==1.11.4
- `exclude-dependencies`: Excludes gradio
- `[tool.uv.sources]`: Configures PyTorch CPU-only index

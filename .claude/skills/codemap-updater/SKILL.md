---
name: codemap-updater
description: Scan the codebase and update the codemap in .claude/rules/codemap.md. Use when files are added, removed, renamed, or significantly restructured.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Codemap Updater

Regenerate `.claude/rules/codemap.md` — a fast-lookup index of all source files.

## Design Principles

- **"What's WHERE" not "what's INSIDE"** — file path + 1-line purpose, not implementation details
- **Under 100 lines** — loaded every conversation, every token counts
- **No exhaustive listings** — don't list every type/model name; just say "All request/response models"
- **Group by layer** — Backend → Frontend → Desktop → CI/CD

## Instructions

### 1. Discover Source Files

```bash
# All source files (excludes __init__.py, node_modules, venv, tests)
find backend/app -name "*.py" -not -name "__init__.py" | sort
find frontend/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | sort
find frontend/src-tauri/src -name "*.rs" | sort
ls .github/workflows/
ls backend/app/data/hook_styles/
```

### 2. Extract Key Exports (grep, NOT full file reads)

Use grep to extract exports efficiently — do NOT read entire files:

```bash
# Python: classes, singletons, top-level constants
grep -n "^class \|^def \|^[A-Z_].*=" backend/app/**/*.py

# TypeScript: exported hooks, components, classes, constants
grep -n "^export " frontend/src/**/*.ts frontend/src/**/*.tsx

# Rust: pub functions, structs, Tauri commands
grep -n "^pub \|#\[tauri::command\]" frontend/src-tauri/src/*.rs
```

Only read a file if grep output is insufficient to determine its purpose.

### 3. Write Codemap

Write to `.claude/rules/codemap.md` following this format:

```markdown
# Codemap — Last updated: YYYY-MM-DD

## Backend — Python (FastAPI)

### path/to/file.py — One-line purpose
- Key exports, singletons, constants (1-3 bullets max)

## Frontend — TypeScript/React

### path/to/file.ts — One-line purpose
- Key exports (1-3 bullets max)

## Desktop — Rust (Tauri v2)

### path/to/file.rs — One-line purpose
- Key exports (1-3 bullets max)

## CI/CD — GitHub Actions

### .github/workflows/
- One bullet per workflow file
```

### Format Rules

- **1 line per file** for simple files (e.g., `### backend/app/core/logging.py — Loguru config`)
- **1-3 bullets max** for complex files (key classes, singletons, constants)
- **Never list every type/model/component name** — summarize instead
- **Group related small files** (e.g., all components in one block, all workflows in one block)
- **Include singleton instances** (`audio_service`, `model_loader`, `api`)
- **Skip**: test files, __init__.py, build artifacts, node_modules

### 4. Verify Line Count

```bash
wc -l .claude/rules/codemap.md
```

Must be under 100 lines. If over, cut implementation details first, then consolidate related files.

## Important Notes
- This file is loaded into EVERY conversation — brevity is critical
- Focus on navigation speed: "I need to find X" → scan codemap → go to file
- Update the "Last updated" timestamp
- Do NOT include "Details:" lines with implementation info

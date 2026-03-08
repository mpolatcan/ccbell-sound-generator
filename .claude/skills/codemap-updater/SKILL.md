---
name: codemap-updater
description: Scan the codebase and update the codemap in .claude/rules/codemap.md. Use when files are added, removed, renamed, or significantly restructured.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Codemap Updater

Scan the entire codebase and regenerate `.claude/rules/codemap.md` with an accurate, up-to-date map of all source files, their key exports, and one-line descriptions.

## Instructions

### 1. Scan Source Files

Scan these directories for source files:

**Backend (Python):**
```bash
find backend/app -name "*.py" -not -name "__init__.py" | sort
```

**Frontend (TypeScript):**
```bash
find frontend/src -name "*.ts" -o -name "*.tsx" | sort
```

**Desktop (Rust):**
```bash
find frontend/src-tauri/src -name "*.rs" | sort
```

**Data files:**
```bash
ls backend/app/data/hook_styles/  # Theme directories
```

**CI/CD:**
```bash
ls .github/workflows/
```

### 2. For Each Source File, Extract:
- File path (relative to project root)
- One-line description of its purpose
- Key exports: classes, functions, constants, types, hooks, components
- Only include PUBLIC/EXPORTED items, skip internal helpers
- For Python: list class names, top-level function names, module-level constants/instances
- For TypeScript: list exported types, interfaces, hooks, components, constants
- For Rust: list pub structs, pub fns, Tauri commands

### 3. Write Codemap

Write the result to `.claude/rules/codemap.md` using the exact format shown in the current codemap. Keep it concise:
- One file per section (use `###` heading with path)
- Bullet list of key exports
- Keep under 200 lines total
- Group by layer: Backend → Frontend → Desktop → Config/CI

### 4. Verify
After writing, count lines to ensure it's under 200:
```bash
wc -l .claude/rules/codemap.md
```

## Important Notes
- The codemap is loaded into EVERY conversation, so brevity matters
- Focus on "what's WHERE" not "how it works"
- Include singleton instances (e.g., `audio_service`, `model_loader`, `api`)
- Include data constants (e.g., `THEME_PRESETS`, `HOOK_TYPES`)
- Do NOT include test files, migration scripts, or build artifacts
- Update the "Last updated" timestamp at the top

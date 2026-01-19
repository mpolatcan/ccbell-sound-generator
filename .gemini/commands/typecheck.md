---
description: Run type checking for both backend and frontend
allowed-tools: Bash, Read
---

# Type Check

Run type checking for both backend and frontend.

## Instructions

Run the following type check commands in parallel:

### Backend (Python with ty)
```bash
cd backend && source .venv/bin/activate && ty check .
```

### Frontend (TypeScript)
```bash
cd frontend && npx tsc --noEmit
```

Report any type errors found. If both pass, confirm that type checking completed successfully.

## Important Notes
- The virtual environment is at `backend/.venv` (created by `uv sync`)
- Backend uses `ty` (Astral's type checker, version >= 0.0.1a5)
- Frontend uses TypeScript compiler in strict mode
- Fix any type errors before committing code
- Type checking is part of the CI pipeline

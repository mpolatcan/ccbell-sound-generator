#!/usr/bin/env python3
"""Migrate hook_styles from per-hook directories to flat theme directories.

Old structure: hook_styles/<hook-dir>/<theme>/<subtheme>.json  (210 files)
New structure: hook_styles/<theme>/<subtheme>.json             (21 files)

Each new file has one prompt per hook type (the first prompt variant from
the old file).

Run once from the project root:
    python scripts/migrate_styles.py
"""

import json
import shutil
from pathlib import Path

HOOK_STYLES_DIR = Path(__file__).parent.parent / "backend" / "app" / "data" / "hook_styles"

# Map directory names to hook IDs
DIR_TO_HOOK_ID: dict[str, str] = {
    "stop": "Stop",
    "subagent-stop": "SubagentStop",
    "permission-prompt": "PermissionPrompt",
    "idle-prompt": "IdlePrompt",
    "session-start": "SessionStart",
    "session-end": "SessionEnd",
    "pre-tool-use": "PreToolUse",
    "post-tool-use": "PostToolUse",
    "subagent-start": "SubagentStart",
    "user-prompt-submit": "UserPromptSubmit",
}

THEMES = ["sci-fi", "retro-8bit", "nature", "minimal", "mechanical", "ambient", "jazz"]


def migrate() -> None:
    # Step 1: Collect all data from old structure
    # Key: (theme, subtheme_filename) -> {hook_id: first_prompt_text}
    collected: dict[tuple[str, str], dict[str, str]] = {}
    # Also collect id and name from the files
    meta: dict[tuple[str, str], dict[str, str]] = {}

    for hook_dir in sorted(HOOK_STYLES_DIR.iterdir()):
        if not hook_dir.is_dir():
            continue
        hook_id = DIR_TO_HOOK_ID.get(hook_dir.name)
        if not hook_id:
            continue

        for theme_dir in sorted(hook_dir.iterdir()):
            if not theme_dir.is_dir():
                continue
            theme_id = theme_dir.name
            if theme_id not in THEMES:
                continue

            for preset_file in sorted(theme_dir.glob("*.json")):
                with open(preset_file) as f:
                    data = json.load(f)

                key = (theme_id, preset_file.stem)
                if key not in collected:
                    collected[key] = {}
                    meta[key] = {"id": data["id"], "name": data["name"]}

                # Take first prompt text
                prompts = data.get("prompts", [])
                if prompts:
                    collected[key][hook_id] = prompts[0]["text"]

    # Step 2: Write 21 new files
    written = 0
    for (theme_id, subtheme_slug), prompts_map in sorted(collected.items()):
        out_dir = HOOK_STYLES_DIR / theme_id
        out_dir.mkdir(parents=True, exist_ok=True)

        file_meta = meta[(theme_id, subtheme_slug)]
        new_data = {
            "id": file_meta["id"],
            "name": file_meta["name"],
            "prompts": prompts_map,
        }

        out_file = out_dir / f"{subtheme_slug}.json"
        with open(out_file, "w") as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        written += 1
        print(f"  wrote {out_file.relative_to(HOOK_STYLES_DIR)}")

    # Step 3: Delete old per-hook directories
    deleted = 0
    for hook_dir_name in DIR_TO_HOOK_ID:
        hook_dir = HOOK_STYLES_DIR / hook_dir_name
        if hook_dir.is_dir():
            shutil.rmtree(hook_dir)
            deleted += 1
            print(f"  deleted {hook_dir_name}/")

    print(f"\nMigration complete: {written} files written, {deleted} old directories removed")


if __name__ == "__main__":
    migrate()

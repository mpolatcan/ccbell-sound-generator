#!/usr/bin/env python3
"""Migrate preset JSON files from sound_characters + prompt_components to prompts[].

Each JSON file currently has:
  - sound_characters.detailed: list of 5 character strings
  - prompt_components: {style[], instruments[], mood[], quality[]}

This script converts them to:
  - prompts: [{label, text}, ...]

Algorithm per file:
  1. Read sound_characters.detailed (5 items) and prompt_components
  2. Separate quality into: base ("44.1kHz, stereo, high-quality"),
     aesthetic (e.g. "crisp", "studio-grade"), tail (e.g. "with natural decay")
  3. For each sound character at index i:
     - Pick style[i % len], instruments[i % len], mood[i % len],
       aesthetic[i % len], tail[i % len]
     - Compose: "{char}, {style}, {instrument}, {mood}, 44.1kHz, stereo, high-quality, {aesthetic}, {tail}"
  4. Write back with prompts[] replacing old fields
"""

import json
import sys
from pathlib import Path

QUALITY_BASE = ["44.1kHz", "stereo", "high-quality"]
QUALITY_AESTHETIC = ["crisp", "studio-grade", "pristine", "clean", "warm"]
QUALITY_TAIL = [
    "with natural decay",
    "smooth fade out",
    "sustained resonance",
    "with gentle release",
    "with clean tail",
]


def classify_quality(quality_items: list[str]) -> tuple[list[str], list[str]]:
    """Separate quality items into aesthetic and tail categories."""
    aesthetic = []
    tail = []
    for item in quality_items:
        if item in QUALITY_BASE:
            continue  # Skip base quality items — always included
        elif item.startswith("with ") or "fade" in item or "resonance" in item or "release" in item or "tail" in item or "decay" in item:
            tail.append(item)
        else:
            aesthetic.append(item)
    return aesthetic or QUALITY_AESTHETIC[:1], tail or QUALITY_TAIL[:1]


def migrate_file(filepath: Path) -> bool:
    """Migrate a single preset JSON file. Returns True if modified."""
    with open(filepath) as f:
        data = json.load(f)

    # Skip already migrated files
    if "prompts" in data:
        return False

    sound_chars = data.get("sound_characters", {}).get("detailed", [])
    pc = data.get("prompt_components", {})

    if not sound_chars or not pc:
        print(f"  SKIP (missing data): {filepath}")
        return False

    styles = pc.get("style", [])
    instruments = pc.get("instruments", [])
    moods = pc.get("mood", [])
    quality_items = pc.get("quality", [])

    aesthetic, tail = classify_quality(quality_items)

    prompts = []
    for i, char in enumerate(sound_chars):
        style = styles[i % len(styles)] if styles else ""
        instrument = instruments[i % len(instruments)] if instruments else ""
        mood = moods[i % len(moods)] if moods else ""
        aes = aesthetic[i % len(aesthetic)] if aesthetic else "crisp"
        tl = tail[i % len(tail)] if tail else "with natural decay"

        parts = [char, style, instrument, mood, "44.1kHz, stereo, high-quality", aes, tl]
        text = ", ".join(p for p in parts if p)

        prompts.append({"label": char, "text": text})

    # Build new data without old fields
    new_data = {
        "id": data["id"],
        "name": data["name"],
        "description": data["description"],
        "prompts": prompts,
    }

    with open(filepath, "w") as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return True


def main() -> None:
    base_dir = Path(__file__).parent.parent / "backend" / "app" / "data" / "hook_styles"
    if not base_dir.exists():
        print(f"ERROR: Directory not found: {base_dir}")
        sys.exit(1)

    json_files = sorted(base_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")

    migrated = 0
    skipped = 0
    for filepath in json_files:
        if migrate_file(filepath):
            migrated += 1
        else:
            skipped += 1

    print(f"\nDone: {migrated} migrated, {skipped} skipped")


if __name__ == "__main__":
    main()

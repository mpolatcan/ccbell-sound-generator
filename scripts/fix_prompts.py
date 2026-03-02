#!/usr/bin/env python3
"""Remove 'with natural decay' from all prompts and fix hook-purpose mismatches."""

import json
from pathlib import Path

STYLES_DIR = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "hook_styles"


def find_common_suffix(strings: list[str]) -> str:
    """Find the longest common suffix of a list of strings."""
    if not strings or len(strings) < 2:
        return ""
    reversed_strings = [s[::-1] for s in strings]
    common = []
    for chars in zip(*reversed_strings):
        if len(set(chars)) == 1:
            common.append(chars[0])
        else:
            break
    return "".join(common)[::-1]


# New unique descriptive prefixes for prompts that don't match their hook purpose.
# The script will automatically append the file's common style suffix.
FIXES: dict[str, dict[str, str]] = {
    "sci-fi/plasma-core.json": {
        "PreToolUse": "tiny plasma relay clicking into ready position with brief electromagnetic tick",
        "PostToolUse": "plasma status indicator switching to green with quick confirming chirp",
        "Stop": "plasma core achieving peak resonance with bright crystalline confirmation chime",
    },
    "sci-fi/warp-drive.json": {
        "PreToolUse": "navigation console readiness indicator blipping once with quick soft chirp",
    },
    "jazz/blue-note.json": {
        "PreToolUse": "soft click of saxophone key pressing quietly into position",
        "Stop": "rich blue chord landing perfectly on the resolution with warm satisfying depth",
    },
    "jazz/cool-breeze.json": {
        "PermissionPrompt": "vibraphone striking two clear ascending notes with bright expectant ring",
    },
    "jazz/velvet-lounge.json": {
        "Stop": "velvet piano chord resolving to warm definitive landing with full richness",
    },
    "ambient/cathedral.json": {
        "PreToolUse": "candle flame flickering briefly in faint shift of cathedral air",
        "PostToolUse": "small stone placed precisely into cathedral wall niche with brief tap",
    },
    "ambient/cloud-drift.json": {
        "PreToolUse": "single air particle shifting position in suspended atmospheric field",
        "PostToolUse": "single raindrop landing on still surface with short muted tap",
        "Stop": "harmonic overtones aligning into one bright moment of perfect clarity",
        "PermissionPrompt": "clear bell-like tone cutting through atmosphere with direct questioning ring",
    },
    "ambient/tape-loop.json": {
        "Stop": "tape playback capturing the perfect take with satisfying warm completion click",
    },
    "mechanical/anvil-forge.json": {
        "PostToolUse": "small finished pin clicking into socket with quick satisfying snap",
        "SubagentStop": "small finished rivet sliding into collection tray with quiet clink",
    },
    "mechanical/gear-train.json": {
        "PreToolUse": "small ratchet tooth advancing one quiet position with tiny click",
        "PostToolUse": "small gear tooth meshing into position with precise light click",
        "SubagentStart": "secondary drive belt engaging alongside main with smooth coupling click",
    },
    "nature/forest.json": {
        "PreToolUse": "small twig bending slightly underfoot with faint quiet creak",
    },
    "nature/river.json": {
        "PreToolUse": "tiny fish breaking water surface with small brief dimple sound",
        "Stop": "waterfall pouring over smooth rock ledge into clear bright splash below",
    },
    "minimal/silk-thread.json": {
        "Stop": "final stitch placed with precise satisfying click of clean completion",
        "PermissionPrompt": "two crisp rising tones with clear bright questioning emphasis and presence",
    },
    "retro-8bit/boss-battle.json": {
        "PreToolUse": "battle cursor blinking once at command line with quick 8-bit tick",
        "PostToolUse": "damage number popping up briefly with quick 8-bit confirmation blip",
        "IdlePrompt": "quiet save room ambient loop with calm low peaceful 8-bit hum",
    },
    "retro-8bit/level-complete.json": {
        "PostToolUse": "single coin collected with quick bright 8-bit ding",
        "SubagentStop": "checkpoint reached with brief soft 8-bit acknowledgment tone",
    },
    "retro-8bit/power-up.json": {
        "PreToolUse": "single inventory slot highlighting with brief quiet 8-bit blip",
        "PostToolUse": "item block bumped from below with quick hollow 8-bit knock",
    },
}


def main() -> None:
    fix_count = 0
    decay_count = 0

    for json_file in sorted(STYLES_DIR.rglob("*.json")):
        with open(json_file) as f:
            data = json.load(f)

        # Step 1: Remove ", with natural decay" from all prompts
        for hook_id in data["prompts"]:
            old = data["prompts"][hook_id]
            new = old.replace(", with natural decay", "")
            if old != new:
                data["prompts"][hook_id] = new
                decay_count += 1

        # Step 2: Find common suffix for this file (all prompts share style suffix)
        prompts = list(data["prompts"].values())
        suffix = find_common_suffix(prompts)

        # Step 3: Apply hook-purpose fixes
        rel = str(json_file.relative_to(STYLES_DIR))
        if rel in FIXES:
            for hook_id, new_prefix in FIXES[rel].items():
                if hook_id in data["prompts"]:
                    data["prompts"][hook_id] = new_prefix + suffix
                    fix_count += 1
                    print(f"  Fixed {rel} → {hook_id}")

        with open(json_file, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")

        print(f"Processed: {rel} (suffix: {suffix[:50]}...)")

    print(f"\nDone. Removed 'with natural decay' from {decay_count} prompts.")
    print(f"Fixed {fix_count} hook-purpose mismatches.")


if __name__ == "__main__":
    main()

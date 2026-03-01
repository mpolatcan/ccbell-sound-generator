#!/usr/bin/env python3
"""Generate short aliases for all prompt entries in hook_styles JSON files.

Alias = first 5 words of `label`, trailing stopwords trimmed, title-cased.
Skips prompts that already have a non-empty alias.
"""

import json
from pathlib import Path

STOPWORDS = frozenset(
    "a an the and or of in on at to for with by from up into through".split()
)

HOOK_STYLES_DIR = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "hook_styles"


def make_alias(label: str) -> str:
    words = label.split()[:5]
    while len(words) > 1 and words[-1].lower() in STOPWORDS:
        words.pop()
    return " ".join(w if w.isupper() else w.capitalize() for w in words)


def process_file(path: Path) -> int:
    """Add alias to each prompt in a JSON file. Returns number of aliases added."""
    with open(path) as f:
        data = json.load(f)

    added = 0
    for prompt in data.get("prompts", []):
        if not prompt.get("alias"):
            prompt["alias"] = make_alias(prompt["label"])
            added += 1

    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return added


def main() -> None:
    files = sorted(HOOK_STYLES_DIR.rglob("*.json"))
    total_files = 0
    total_aliases = 0

    for path in files:
        added = process_file(path)
        total_files += 1
        total_aliases += added

    print(f"Processed {total_files} files, added {total_aliases} aliases")


if __name__ == "__main__":
    main()

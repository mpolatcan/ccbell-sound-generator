"""Theme presets for sound generation."""

import json
from pathlib import Path

from app.core.models import SubTheme, ThemePreset

_HOOK_STYLES_DIR = Path(__file__).parent / "hook_styles"


def _load_sub_themes(theme_id: str) -> list[SubTheme]:
    """Load sub-themes from hook_styles/<theme>/*.json files."""
    theme_dir = _HOOK_STYLES_DIR / theme_id
    if not theme_dir.is_dir():
        return []
    sub_themes: list[SubTheme] = []
    for f in sorted(theme_dir.glob("*.json")):
        with open(f) as fh:
            data = json.load(fh)
        sub_themes.append(
            SubTheme(
                id=data["id"],
                name=data["name"],
                description=data.get("description", ""),
                prompts=data["prompts"],
            )
        )
    return sub_themes


THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        icon="rocket",
        sub_themes=_load_sub_themes("sci-fi"),
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        icon="gamepad-2",
        sub_themes=_load_sub_themes("retro-8bit"),
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        icon="leaf",
        sub_themes=_load_sub_themes("nature"),
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        icon="minus",
        sub_themes=_load_sub_themes("minimal"),
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        icon="cog",
        sub_themes=_load_sub_themes("mechanical"),
    ),
    ThemePreset(
        id="ambient",
        name="Ambient",
        description="Warm, atmospheric, and dreamy textures",
        icon="cloud",
        sub_themes=_load_sub_themes("ambient"),
    ),
    ThemePreset(
        id="jazz",
        name="Jazz",
        description="Smooth jazz tones with warm acoustic character",
        icon="music",
        sub_themes=_load_sub_themes("jazz"),
    ),
    ThemePreset(
        id="custom",
        name="Custom",
        description="Write your own prompt",
        icon="pencil",
    ),
]


def get_all_themes() -> list[ThemePreset]:
    """Get all theme presets."""
    return THEME_PRESETS

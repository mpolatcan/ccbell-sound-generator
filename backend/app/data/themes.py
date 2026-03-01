"""Theme presets for sound generation."""

from app.core.models import ThemePreset

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        icon="cog",
    ),
    ThemePreset(
        id="ambient",
        name="Ambient",
        description="Warm, atmospheric, and dreamy textures",
        icon="cloud",
    ),
    ThemePreset(
        id="jazz",
        name="Jazz",
        description="Smooth jazz tones with warm acoustic character",
        icon="music",
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

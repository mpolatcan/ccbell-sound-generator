"""Theme presets for sound generation."""

from app.core.models import ThemePreset

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_template="Futuristic electronic {sound_type}, digital synthesizer sound effect",
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        prompt_template="8-bit chiptune {sound_type}, retro arcade sound effect",
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        prompt_template="Organic acoustic {sound_type}, natural texture sound effect",
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        prompt_template="Clean minimal {sound_type}, subtle notification sound effect",
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        prompt_template="Mechanical metallic {sound_type}, industrial machinery sound effect",
        icon="cog",
    ),
    ThemePreset(
        id="custom",
        name="Custom",
        description="Write your own prompt",
        prompt_template="{custom_prompt}",
        icon="pencil",
    ),
]


def get_theme_by_id(theme_id: str) -> ThemePreset | None:
    """Get a theme preset by its ID."""
    for theme in THEME_PRESETS:
        if theme.id == theme_id:
            return theme
    return None


def get_all_themes() -> list[ThemePreset]:
    """Get all theme presets."""
    return THEME_PRESETS

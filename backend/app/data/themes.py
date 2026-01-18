"""Theme presets for sound generation."""

from app.core.models import ThemePreset

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_template="Futuristic sci-fi {sound_type}, electronic digital texture, clean synthesizer, space age technology sound",
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        prompt_template="8-bit retro video game {sound_type}, chiptune style, classic arcade, pixel sound effect",
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        prompt_template="Natural organic {sound_type}, soft acoustic texture, nature-inspired, gentle earthy tone",
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        prompt_template="Minimal clean {sound_type}, subtle professional notification, soft gentle tone, understated",
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        prompt_template="Mechanical industrial {sound_type}, metallic click, precise machinery sound, technical",
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

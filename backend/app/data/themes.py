"""Theme presets for sound generation."""

from app.core.models import PromptTemplates, ThemePreset

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_templates=PromptTemplates(
            simple="Futuristic electronic {sound_type}, synthesizer sound effect",
            detailed="Futuristic electronic {sound_type}, digital synthesizer, crisp space age sound effect",
            more_detailed="Short futuristic sci-fi {sound_type}, high quality electronic digital synthesizer, clean crisp space age technology sound effect",
        ),
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        prompt_templates=PromptTemplates(
            simple="8-bit chiptune {sound_type}, arcade sound effect",
            detailed="8-bit chiptune {sound_type}, retro video game, crisp arcade sound effect",
            more_detailed="Short 8-bit retro video game {sound_type}, high quality chiptune style, crisp classic arcade pixel sound effect",
        ),
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        prompt_templates=PromptTemplates(
            simple="Organic acoustic {sound_type}, natural sound effect",
            detailed="Organic acoustic {sound_type}, soft natural texture, earthy sound effect",
            more_detailed="Short natural organic {sound_type}, high quality soft acoustic texture, crisp nature-inspired gentle earthy tone",
        ),
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        prompt_templates=PromptTemplates(
            simple="Clean minimal {sound_type}, notification sound effect",
            detailed="Clean minimal {sound_type}, subtle professional notification sound effect",
            more_detailed="Short minimal clean {sound_type}, high quality crisp professional notification, subtle gentle tone sound effect",
        ),
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        prompt_templates=PromptTemplates(
            simple="Mechanical metallic {sound_type}, industrial sound effect",
            detailed="Mechanical metallic {sound_type}, crisp industrial machinery sound effect",
            more_detailed="Short mechanical industrial {sound_type}, high quality crisp metallic click, precise machinery sound effect",
        ),
        icon="cog",
    ),
    ThemePreset(
        id="custom",
        name="Custom",
        description="Write your own prompt",
        prompt_templates=PromptTemplates(
            simple="{custom_prompt}",
            detailed="{custom_prompt}",
            more_detailed="{custom_prompt}",
        ),
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

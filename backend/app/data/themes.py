"""Theme presets for sound generation."""

from app.core.models import PromptComponents, ThemePreset

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_components=PromptComponents(
            style="sci-fi, futuristic, space age, digital",
            instruments="digital synthesizer, electronic oscillator, laser resonator",
            mood="technological, clean, precise",
            quality="44.1kHz, stereo, high-quality, crisp",
        ),
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        prompt_components=PromptComponents(
            style="retro 8-bit, chiptune, classic arcade",
            instruments="chiptune synthesizer, square wave, pulse wave, 8-bit drum machine",
            mood="playful, nostalgic, energetic",
            quality="44.1kHz, stereo, crisp, punchy",
        ),
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        prompt_components=PromptComponents(
            style="nature, organic, acoustic, earthy",
            instruments="bamboo wind chime, wooden percussion, acoustic bell, natural resonance",
            mood="warm, gentle, soothing, peaceful",
            quality="44.1kHz, stereo, high-quality, soft",
        ),
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        prompt_components=PromptComponents(
            style="minimal, clean, modern, professional",
            instruments="sine wave tone, clean bell, soft piano note, glass chime",
            mood="subtle, refined, understated, elegant",
            quality="44.1kHz, stereo, high-quality, pristine",
        ),
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        prompt_components=PromptComponents(
            style="mechanical, industrial, metallic, steampunk",
            instruments="metal percussion, gear click, pneumatic valve, steel resonator",
            mood="precise, robust, utilitarian, sharp",
            quality="44.1kHz, stereo, high-quality, crisp",
        ),
        icon="cog",
    ),
    ThemePreset(
        id="custom",
        name="Custom",
        description="Write your own prompt",
        prompt_components=PromptComponents(
            style="",
            instruments="",
            mood="",
            quality="",
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

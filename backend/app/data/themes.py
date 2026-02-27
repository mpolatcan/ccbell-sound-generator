"""Theme presets for sound generation."""

from app.core.models import PromptComponents, ThemePreset, TieredPromptComponents

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["sci-fi", "futuristic"],
                instruments=["digital synthesizer"],
                mood=["technological"],
                quality=["44.1kHz", "stereo"],
            ),
            standard=PromptComponents(
                style=["sci-fi", "futuristic", "space age"],
                instruments=["digital synthesizer", "electronic oscillator"],
                mood=["technological", "clean"],
                quality=["44.1kHz", "stereo", "high-quality"],
            ),
            detailed=PromptComponents(
                style=["sci-fi", "futuristic", "space age", "digital", "cybernetic"],
                instruments=[
                    "digital synthesizer",
                    "electronic oscillator",
                    "frequency modulation pad",
                    "modular synth pad",
                ],
                mood=["technological", "clean", "precise", "immersive"],
                quality=["44.1kHz", "stereo", "high-quality", "crisp", "studio-grade"],
            ),
        ),
        icon="rocket",
    ),
    ThemePreset(
        id="retro-8bit",
        name="Retro 8-bit",
        description="Classic video game style chiptune sounds",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["retro 8-bit", "chiptune"],
                instruments=["chiptune synthesizer"],
                mood=["playful"],
                quality=["44.1kHz", "stereo"],
            ),
            standard=PromptComponents(
                style=["retro 8-bit", "chiptune", "classic arcade"],
                instruments=["chiptune synthesizer", "square wave", "pulse wave"],
                mood=["playful", "nostalgic"],
                quality=["44.1kHz", "stereo", "crisp"],
            ),
            detailed=PromptComponents(
                style=["retro 8-bit", "chiptune", "classic arcade", "pixel game", "lo-fi digital"],
                instruments=[
                    "chiptune synthesizer",
                    "square wave",
                    "pulse wave",
                    "8-bit drum machine",
                    "triangle wave",
                ],
                mood=["playful", "nostalgic", "energetic", "fun", "bouncy"],
                quality=["44.1kHz", "stereo", "crisp", "punchy", "bright"],
            ),
        ),
        icon="gamepad-2",
    ),
    ThemePreset(
        id="nature",
        name="Nature",
        description="Organic sounds inspired by natural elements",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["nature", "organic"],
                instruments=["bamboo wind chime"],
                mood=["warm"],
                quality=["44.1kHz", "stereo"],
            ),
            standard=PromptComponents(
                style=["nature", "organic", "acoustic"],
                instruments=["bamboo wind chime", "wooden percussion", "acoustic bell"],
                mood=["warm", "gentle", "soothing"],
                quality=["44.1kHz", "stereo", "high-quality"],
            ),
            detailed=PromptComponents(
                style=["nature", "organic", "acoustic", "earthy", "ambient"],
                instruments=[
                    "bamboo wind chime",
                    "wooden percussion",
                    "acoustic bell",
                    "natural resonance",
                    "rain stick",
                ],
                mood=["warm", "gentle", "soothing", "peaceful", "meditative"],
                quality=["44.1kHz", "stereo", "high-quality", "soft", "airy"],
            ),
        ),
        icon="leaf",
    ),
    ThemePreset(
        id="minimal",
        name="Minimal",
        description="Clean, subtle, professional notification sounds",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["minimal", "clean"],
                instruments=["pure melodic tone"],
                mood=["subtle"],
                quality=["44.1kHz", "stereo"],
            ),
            standard=PromptComponents(
                style=["minimal", "clean", "modern"],
                instruments=["pure melodic tone", "clean bell", "soft piano note"],
                mood=["subtle", "refined", "understated"],
                quality=["44.1kHz", "stereo", "high-quality"],
            ),
            detailed=PromptComponents(
                style=["minimal", "clean", "modern", "professional", "elegant"],
                instruments=[
                    "pure melodic tone",
                    "clean bell",
                    "soft piano note",
                    "glass chime",
                    "pure tone",
                ],
                mood=["subtle", "refined", "understated", "elegant", "calm"],
                quality=["44.1kHz", "stereo", "high-quality", "pristine", "transparent"],
            ),
        ),
        icon="minus",
    ),
    ThemePreset(
        id="mechanical",
        name="Mechanical",
        description="Industrial and mechanical textures",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["mechanical", "industrial"],
                instruments=["metal percussion"],
                mood=["precise"],
                quality=["44.1kHz", "stereo"],
            ),
            standard=PromptComponents(
                style=["mechanical", "industrial", "metallic"],
                instruments=["metal percussion", "anvil strike", "metal clink"],
                mood=["precise", "robust", "utilitarian"],
                quality=["44.1kHz", "stereo", "high-quality"],
            ),
            detailed=PromptComponents(
                style=[
                    "mechanical",
                    "industrial",
                    "metallic",
                    "steampunk",
                    "raw",
                ],
                instruments=[
                    "metal percussion",
                    "anvil strike",
                    "metal clink",
                    "steel resonator",
                    "spring resonance",
                ],
                mood=["precise", "robust", "utilitarian", "sharp", "powerful"],
                quality=["44.1kHz", "stereo", "high-quality", "crisp", "impactful"],
            ),
        ),
        icon="cog",
    ),
    ThemePreset(
        id="custom",
        name="Custom",
        description="Write your own prompt",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=[],
                instruments=[],
                mood=[],
                quality=[],
            ),
            standard=PromptComponents(
                style=[],
                instruments=[],
                mood=[],
                quality=[],
            ),
            detailed=PromptComponents(
                style=[],
                instruments=[],
                mood=[],
                quality=[],
            ),
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

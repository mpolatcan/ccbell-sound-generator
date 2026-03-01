"""Theme presets for sound generation."""

from app.core.models import PromptComponents, ThemePreset, TieredPromptComponents

THEME_PRESETS: list[ThemePreset] = [
    ThemePreset(
        id="sci-fi",
        name="Sci-Fi",
        description="Futuristic digital sounds with electronic textures",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["futuristic spacecraft interface", "cyberpunk neon-lit"],
                instruments=["crystalline FM synthesis bell"],
                mood=["otherworldly precision"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "futuristic spacecraft interface",
                    "cyberpunk neon-lit",
                    "deep space station",
                ],
                instruments=[
                    "crystalline FM synthesis bell",
                    "voltage-controlled resonant filter sweep",
                ],
                mood=["otherworldly precision", "holographic clarity"],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "futuristic spacecraft interface",
                    "cyberpunk neon-lit",
                    "deep space station",
                    "quantum computer hum",
                    "orbital relay signal",
                ],
                instruments=[
                    "crystalline FM synthesis bell",
                    "voltage-controlled resonant filter sweep",
                    "granular synth texture",
                    "plasma crackle discharge",
                ],
                mood=[
                    "otherworldly precision",
                    "holographic clarity",
                    "cold vacuum stillness",
                    "alien intelligence awakening",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "crisp",
                    "studio-grade",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
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
                style=["NES coin-collect jingle", "pixel game power-up"],
                instruments=["bitcrushed square wave blip"],
                mood=["arcade cabinet excitement"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=["NES coin-collect jingle", "pixel game power-up", "Game Boy startup melody"],
                instruments=[
                    "bitcrushed square wave blip",
                    "pulse wave arpeggio",
                    "triangle wave bass note",
                ],
                mood=["arcade cabinet excitement", "joystick-era nostalgia"],
                quality=["44.1kHz", "stereo", "crisp", "with natural decay", "smooth fade out"],
            ),
            detailed=PromptComponents(
                style=[
                    "NES coin-collect jingle",
                    "pixel game power-up",
                    "Game Boy startup melody",
                    "SID chip tracker groove",
                    "16-bit victory screen",
                ],
                instruments=[
                    "bitcrushed square wave blip",
                    "pulse wave arpeggio",
                    "triangle wave bass note",
                    "noise channel snare hit",
                    "lo-fi sample playback crunch",
                ],
                mood=[
                    "arcade cabinet excitement",
                    "joystick-era nostalgia",
                    "high-score elation",
                    "speed-run intensity",
                    "bonus-stage energy",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "crisp",
                    "punchy",
                    "bright",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
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
                style=["forest clearing at dawn", "moss-covered stone garden"],
                instruments=["wooden mallet on hollow log"],
                mood=["morning dew stillness"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "forest clearing at dawn",
                    "moss-covered stone garden",
                    "bamboo grove in gentle wind",
                ],
                instruments=[
                    "wooden mallet on hollow log",
                    "rain droplet on broad leaf",
                    "smooth river stones clinking",
                ],
                mood=["morning dew stillness", "sun-warmed earth", "birdsong tranquility"],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "forest clearing at dawn",
                    "moss-covered stone garden",
                    "bamboo grove in gentle wind",
                    "creek bed after summer rain",
                    "meadow with distant thunder",
                ],
                instruments=[
                    "wooden mallet on hollow log",
                    "rain droplet on broad leaf",
                    "smooth river stones clinking",
                    "fingertip-plucked kalimba tine",
                    "ceramic wind chime in breeze",
                ],
                mood=[
                    "morning dew stillness",
                    "sun-warmed earth",
                    "birdsong tranquility",
                    "deep forest solitude",
                    "waterfall mist on skin",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "soft",
                    "airy",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
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
                style=["ultra-clean UI interaction", "Swiss design precision"],
                instruments=["pure sine tone at concert pitch"],
                mood=["whisper-quiet elegance"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "ultra-clean UI interaction",
                    "Swiss design precision",
                    "white gallery silence",
                ],
                instruments=[
                    "pure sine tone at concert pitch",
                    "tapped crystal glass rim",
                    "single piano key softly pressed",
                ],
                mood=["whisper-quiet elegance", "zen garden calm", "paper-thin delicacy"],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "ultra-clean UI interaction",
                    "Swiss design precision",
                    "white gallery silence",
                    "Scandinavian living room",
                    "frosted glass partition",
                ],
                instruments=[
                    "pure sine tone at concert pitch",
                    "tapped crystal glass rim",
                    "single piano key softly pressed",
                    "porcelain bowl struck with felt tip",
                    "tuning fork resonating on wood",
                ],
                mood=[
                    "whisper-quiet elegance",
                    "zen garden calm",
                    "paper-thin delicacy",
                    "breath-held anticipation",
                    "snow falling on still water",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "pristine",
                    "transparent",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
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
                style=["steam workshop furnace glow", "Victorian clocktower"],
                instruments=["brass gear clank on iron plate"],
                mood=["forge-hot determination"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "steam workshop furnace glow",
                    "Victorian clocktower",
                    "locomotive engine room",
                ],
                instruments=[
                    "brass gear clank on iron plate",
                    "ratchet wrench click",
                    "tempered steel spring release",
                ],
                mood=["forge-hot determination", "oiled-machine rhythm", "riveted iron solidity"],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "steam workshop furnace glow",
                    "Victorian clocktower",
                    "locomotive engine room",
                    "blacksmith anvil yard",
                    "submarine pressure hull",
                ],
                instruments=[
                    "brass gear clank on iron plate",
                    "ratchet wrench click",
                    "tempered steel spring release",
                    "cast iron lever thrown",
                    "copper pipe resonance ping",
                ],
                mood=[
                    "forge-hot determination",
                    "oiled-machine rhythm",
                    "riveted iron solidity",
                    "pneumatic power hiss",
                    "precision clockwork ticking",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "crisp",
                    "impactful",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
            ),
        ),
        icon="cog",
    ),
    ThemePreset(
        id="ambient",
        name="Ambient",
        description="Warm, atmospheric, and dreamy textures",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["cathedral reverb at midnight", "tape-saturated warmth"],
                instruments=["bowed singing bowl overtone"],
                mood=["warm fog dissolving slowly"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "cathedral reverb at midnight",
                    "tape-saturated warmth",
                    "Brian Eno infinite space",
                ],
                instruments=[
                    "bowed singing bowl overtone",
                    "granular piano cloud",
                    "reversed cymbal swell",
                ],
                mood=[
                    "warm fog dissolving slowly",
                    "candlelight flickering softly",
                    "underwater weightlessness",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "cathedral reverb at midnight",
                    "tape-saturated warmth",
                    "Brian Eno infinite space",
                    "abandoned hall echo",
                    "lo-fi cassette hiss and bloom",
                ],
                instruments=[
                    "bowed singing bowl overtone",
                    "granular piano cloud",
                    "reversed cymbal swell",
                    "harmonium drone with tape wobble",
                    "shimmer reverb pad wash",
                ],
                mood=[
                    "warm fog dissolving slowly",
                    "candlelight flickering softly",
                    "underwater weightlessness",
                    "drifting between sleep and waking",
                    "moonlight through frosted glass",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "lush",
                    "wide",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
            ),
        ),
        icon="cloud",
    ),
    ThemePreset(
        id="jazz",
        name="Jazz",
        description="Smooth jazz tones with warm acoustic character",
        prompt_components=TieredPromptComponents(
            simple=PromptComponents(
                style=["late-night jazz club", "Blue Note session warmth"],
                instruments=["harmon-muted trumpet breath"],
                mood=["smoky room intimacy"],
                quality=["44.1kHz", "stereo", "with natural decay"],
            ),
            standard=PromptComponents(
                style=[
                    "late-night jazz club",
                    "Blue Note session warmth",
                    "velvet curtain lounge",
                ],
                instruments=[
                    "harmon-muted trumpet breath",
                    "walking bass string pluck",
                    "vibraphone mallet on metal bar",
                ],
                mood=[
                    "smoky room intimacy",
                    "last-set-of-the-night mellowness",
                    "bourbon warmth on the tongue",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "with natural decay",
                    "smooth fade out",
                ],
            ),
            detailed=PromptComponents(
                style=[
                    "late-night jazz club",
                    "Blue Note session warmth",
                    "velvet curtain lounge",
                    "bossa nova beachside patio",
                    "cool jazz after-hours session",
                ],
                instruments=[
                    "harmon-muted trumpet breath",
                    "walking bass string pluck",
                    "vibraphone mallet on metal bar",
                    "wire brushes swirling on snare head",
                    "Rhodes electric piano with tremolo",
                ],
                mood=[
                    "smoky room intimacy",
                    "last-set-of-the-night mellowness",
                    "bourbon warmth on the tongue",
                    "slow-nod groove",
                    "spotlight-on-the-soloist focus",
                ],
                quality=[
                    "44.1kHz",
                    "stereo",
                    "high-quality",
                    "rich",
                    "analog warmth",
                    "with natural decay",
                    "smooth fade out",
                    "sustained resonance",
                ],
            ),
        ),
        icon="music",
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


def get_all_themes() -> list[ThemePreset]:
    """Get all theme presets."""
    return THEME_PRESETS

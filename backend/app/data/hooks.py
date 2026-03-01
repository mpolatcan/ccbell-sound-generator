"""Claude Code hook type definitions."""

from app.core.models import HookType, HookTypeId, SoundStylePreset, TieredSoundCharacters

# Maps generator hook type IDs to ccbell plugin event names.
HOOK_TO_EVENT_MAP: dict[HookTypeId, str] = {
    "Stop": "stop",
    "SubagentStop": "subagent",
    "PermissionPrompt": "permission_prompt",
    "IdlePrompt": "idle_prompt",
    "SessionStart": "session_start",
    "SessionEnd": "session_end",
    "PreToolUse": "pre_tool_use",
    "PostToolUse": "post_tool_use",
    "SubagentStart": "subagent_start",
    "UserPromptSubmit": "user_prompt_submit",
}

HOOK_TYPES: list[HookType] = [
    # Core events (currently supported in ccbell binary)
    HookType(
        id="Stop",
        name="Stop",
        description="Main agent has finished its task",
        sound_characters=TieredSoundCharacters(
            simple=["bright ascending tone resolving to major chord"],
            standard=[
                "bright ascending tone resolving to major chord",
                "confident ring of a struck glass bell",
                "triumphant landing on a warm final note",
            ],
            detailed=[
                "bright ascending tone resolving to major chord",
                "confident ring of a struck glass bell",
                "triumphant landing on a warm final note",
                "satisfying click of a lock sliding home",
                "clear resonant chime fading into silence",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="glass-cathedral",
                name="Glass Cathedral",
                description="Resonant bell in a vast reverberant space",
                sound_characters=TieredSoundCharacters(
                    simple=["cathedral bell struck with padded mallet"],
                    standard=[
                        "cathedral bell struck with padded mallet",
                        "glass resonance blooming in stone hall",
                        "warm overtones spreading through arched ceiling",
                    ],
                    detailed=[
                        "cathedral bell struck with padded mallet",
                        "glass resonance blooming in stone hall",
                        "warm overtones spreading through arched ceiling",
                        "shimmering harmonic tail dissolving upward",
                        "peaceful major chord ringing into reverent silence",
                    ],
                ),
            ),
            SoundStylePreset(
                id="victory-spark",
                name="Victory Spark",
                description="Short triumphant burst of bright energy",
                sound_characters=TieredSoundCharacters(
                    simple=["quick triumphant brass stab ascending"],
                    standard=[
                        "quick triumphant brass stab ascending",
                        "bright spark of metallic energy",
                        "sharp celebratory horn flourish",
                    ],
                    detailed=[
                        "quick triumphant brass stab ascending",
                        "bright spark of metallic energy",
                        "sharp celebratory horn flourish",
                        "rapid major arpeggio fired upward",
                        "golden confetti burst of harmonics",
                    ],
                ),
            ),
            SoundStylePreset(
                id="zen-bowl",
                name="Zen Bowl",
                description="Meditative singing bowl with long sustain",
                sound_characters=TieredSoundCharacters(
                    simple=["singing bowl rim struck gently"],
                    standard=[
                        "singing bowl rim struck gently",
                        "warm bronze overtone spreading",
                        "peaceful resonance settling like still water",
                    ],
                    detailed=[
                        "singing bowl rim struck gently",
                        "warm bronze overtone spreading",
                        "peaceful resonance settling like still water",
                        "soft harmonic bloom fading to silence",
                        "calm completion tone with slow natural decay",
                    ],
                ),
            ),
            SoundStylePreset(
                id="neon-pulse",
                name="Neon Pulse",
                description="Futuristic digital confirmation flash",
                sound_characters=TieredSoundCharacters(
                    simple=["crisp digital pulse with synthetic shimmer"],
                    standard=[
                        "crisp digital pulse with synthetic shimmer",
                        "neon-bright synth confirmation ping",
                        "clean electronic resolve with filter sweep",
                    ],
                    detailed=[
                        "crisp digital pulse with synthetic shimmer",
                        "neon-bright synth confirmation ping",
                        "clean electronic resolve with filter sweep",
                        "futuristic binary cascade completing",
                        "voltage spike settling into warm hum",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="SubagentStop",
        name="Subagent Stop",
        description="A subagent has finished its task",
        sound_characters=TieredSoundCharacters(
            simple=["gentle tap on porcelain cup"],
            standard=[
                "gentle tap on porcelain cup",
                "distant wind chime touched by breeze",
                "soft fingertip on muted bell",
            ],
            detailed=[
                "gentle tap on porcelain cup",
                "distant wind chime touched by breeze",
                "soft fingertip on muted bell",
                "quiet marble dropped on felt surface",
                "whispered glass ping from far away",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="distant-chime",
                name="Distant Chime",
                description="Far-away bell barely audible",
                sound_characters=TieredSoundCharacters(
                    simple=["distant bell heard through open window"],
                    standard=[
                        "distant bell heard through open window",
                        "faraway chime carried on gentle wind",
                        "muted resonance from another room",
                    ],
                    detailed=[
                        "distant bell heard through open window",
                        "faraway chime carried on gentle wind",
                        "muted resonance from another room",
                        "echo of a tap on thin crystal",
                        "soft shimmer dissolving into ambient hush",
                    ],
                ),
            ),
            SoundStylePreset(
                id="dewdrop",
                name="Dewdrop",
                description="Single water drop on a still surface",
                sound_characters=TieredSoundCharacters(
                    simple=["single water droplet on calm surface"],
                    standard=[
                        "single water droplet on calm surface",
                        "tiny ripple spreading outward",
                        "crystalline plip on smooth stone",
                    ],
                    detailed=[
                        "single water droplet on calm surface",
                        "tiny ripple spreading outward",
                        "crystalline plip on smooth stone",
                        "delicate splash with brief reverb tail",
                        "miniature aquatic ping fading gently",
                    ],
                ),
            ),
            SoundStylePreset(
                id="pixel-wink",
                name="Pixel Wink",
                description="Tiny digital micro-blip",
                sound_characters=TieredSoundCharacters(
                    simple=["ultra-short digital micro-blip"],
                    standard=[
                        "ultra-short digital micro-blip",
                        "tiny pixel click at high pitch",
                        "brief electronic sparkle point",
                    ],
                    detailed=[
                        "ultra-short digital micro-blip",
                        "tiny pixel click at high pitch",
                        "brief electronic sparkle point",
                        "miniature synth pip with instant decay",
                        "crisp binary acknowledgment dot",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="PermissionPrompt",
        name="Permission Prompt",
        description="Tool needs user permission to proceed",
        sound_characters=TieredSoundCharacters(
            simple=["two-note rising question phrase"],
            standard=[
                "two-note rising question phrase",
                "gentle knock asking may I enter",
                "curious ascending pitch bend",
            ],
            detailed=[
                "two-note rising question phrase",
                "gentle knock asking may I enter",
                "curious ascending pitch bend",
                "expectant pause after bright ping",
                "doorbell with polite urgency",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="crystal-question",
                name="Crystal Question",
                description="Clear glass tone rising with curiosity",
                sound_characters=TieredSoundCharacters(
                    simple=["crystal glass tone rising questioningly"],
                    standard=[
                        "crystal glass tone rising questioningly",
                        "bright transparent ping with upward bend",
                        "clear inquiry chime lifting at the end",
                    ],
                    detailed=[
                        "crystal glass tone rising questioningly",
                        "bright transparent ping with upward bend",
                        "clear inquiry chime lifting at the end",
                        "shimmering glass harmonic asking permission",
                        "delicate ascending tone ending on open note",
                    ],
                ),
            ),
            SoundStylePreset(
                id="red-alert-siren",
                name="Red Alert Siren",
                description="Urgent pulsing alarm demanding attention",
                sound_characters=TieredSoundCharacters(
                    simple=["sharp pulsing alert siren two short bursts"],
                    standard=[
                        "sharp pulsing alert siren two short bursts",
                        "rapid warning klaxon with metallic edge",
                        "urgent oscillating tone demanding attention",
                    ],
                    detailed=[
                        "sharp pulsing alert siren two short bursts",
                        "rapid warning klaxon with metallic edge",
                        "urgent oscillating tone demanding attention",
                        "piercing alarm cutting through silence",
                        "emergency horn blast with vibrato",
                    ],
                ),
            ),
            SoundStylePreset(
                id="oak-door-tap",
                name="Oak Door Tap",
                description="Warm wooden knock asking to come in",
                sound_characters=TieredSoundCharacters(
                    simple=["knuckle tapping on thick oak door"],
                    standard=[
                        "knuckle tapping on thick oak door",
                        "warm hollow wooden knock pattern",
                        "polite rap on mahogany surface",
                    ],
                    detailed=[
                        "knuckle tapping on thick oak door",
                        "warm hollow wooden knock pattern",
                        "polite rap on mahogany surface",
                        "three gentle taps on dense hardwood",
                        "courteous knock with woody resonance",
                    ],
                ),
            ),
            SoundStylePreset(
                id="curious-whistle",
                name="Curious Whistle",
                description="Playful upward whistle wondering aloud",
                sound_characters=TieredSoundCharacters(
                    simple=["short whistle sliding upward curiously"],
                    standard=[
                        "short whistle sliding upward curiously",
                        "playful rising pitch like a question mark",
                        "breathy ascending tone with inquisitive lilt",
                    ],
                    detailed=[
                        "short whistle sliding upward curiously",
                        "playful rising pitch like a question mark",
                        "breathy ascending tone with inquisitive lilt",
                        "wondering bird-call inflection upward",
                        "lighthearted inquiry slide with airy tail",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="IdlePrompt",
        name="Idle Prompt",
        description="Agent is idle and waiting for user input",
        sound_characters=TieredSoundCharacters(
            simple=["slow breathing hum pulsing gently"],
            standard=[
                "slow breathing hum pulsing gently",
                "warm sustained tone with subtle vibrato",
                "patient ambient drone at low volume",
            ],
            detailed=[
                "slow breathing hum pulsing gently",
                "warm sustained tone with subtle vibrato",
                "patient ambient drone at low volume",
                "soft oscillating pad like quiet tide",
                "mellow hovering note waiting calmly",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="breathing-glow",
                name="Breathing Glow",
                description="Slowly pulsing warm light in sound",
                sound_characters=TieredSoundCharacters(
                    simple=["soft warm pulse rising and falling like breathing"],
                    standard=[
                        "soft warm pulse rising and falling like breathing",
                        "gentle glowing hum with slow volume swell",
                        "ambient pad inhaling and exhaling",
                    ],
                    detailed=[
                        "soft warm pulse rising and falling like breathing",
                        "gentle glowing hum with slow volume swell",
                        "ambient pad inhaling and exhaling",
                        "candlelight flicker translated to sound",
                        "patient warmth expanding and contracting",
                    ],
                ),
            ),
            SoundStylePreset(
                id="pendulum-tick",
                name="Pendulum Tick",
                description="Steady clock marking patient time",
                sound_characters=TieredSoundCharacters(
                    simple=["grandfather clock pendulum swinging slowly"],
                    standard=[
                        "grandfather clock pendulum swinging slowly",
                        "brass pendulum ticking in quiet room",
                        "steady wooden metronome at rest tempo",
                    ],
                    detailed=[
                        "grandfather clock pendulum swinging slowly",
                        "brass pendulum ticking in quiet room",
                        "steady wooden metronome at rest tempo",
                        "clockwork escapement click with room reverb",
                        "patient timepiece marking seconds softly",
                    ],
                ),
            ),
            SoundStylePreset(
                id="cloud-drift",
                name="Cloud Drift",
                description="Weightless atmospheric texture floating",
                sound_characters=TieredSoundCharacters(
                    simple=["ethereal pad drifting through open sky"],
                    standard=[
                        "ethereal pad drifting through open sky",
                        "weightless ambient cloud passing slowly",
                        "airy sustained shimmer with no edges",
                    ],
                    detailed=[
                        "ethereal pad drifting through open sky",
                        "weightless ambient cloud passing slowly",
                        "airy sustained shimmer with no edges",
                        "spacious reverb wash hovering in place",
                        "translucent tone floating without gravity",
                    ],
                ),
            ),
        ],
    ),
    # Session lifecycle events
    HookType(
        id="SessionStart",
        name="Session Start",
        description="A new Claude Code session has started",
        sound_characters=TieredSoundCharacters(
            simple=["ascending energy blooming to life"],
            standard=[
                "ascending energy blooming to life",
                "system powering up with warm glow",
                "bright dawn-like tone opening upward",
            ],
            detailed=[
                "ascending energy blooming to life",
                "system powering up with warm glow",
                "bright dawn-like tone opening upward",
                "awakening sweep from silence into light",
                "ignition spark expanding into full resonance",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="dawn-bloom",
                name="Dawn Bloom",
                description="Sunrise unfolding in warm ascending tones",
                sound_characters=TieredSoundCharacters(
                    simple=["warm sunrise tone blooming gradually upward"],
                    standard=[
                        "warm sunrise tone blooming gradually upward",
                        "golden morning light translated to melody",
                        "gentle awakening swell from dark to bright",
                    ],
                    detailed=[
                        "warm sunrise tone blooming gradually upward",
                        "golden morning light translated to melody",
                        "gentle awakening swell from dark to bright",
                        "dawn chorus of harmonics opening",
                        "first light filtering through sound curtain",
                    ],
                ),
            ),
            SoundStylePreset(
                id="engine-ignition",
                name="Engine Ignition",
                description="Dramatic power-up with building intensity",
                sound_characters=TieredSoundCharacters(
                    simple=["dramatic engine ignition roaring to life"],
                    standard=[
                        "dramatic engine ignition roaring to life",
                        "turbine spinning up from silence to power",
                        "systems activating in rapid sequence",
                    ],
                    detailed=[
                        "dramatic engine ignition roaring to life",
                        "turbine spinning up from silence to power",
                        "systems activating in rapid sequence",
                        "capacitor charging to full with rising whine",
                        "reactor coming online with deep harmonic build",
                    ],
                ),
            ),
            SoundStylePreset(
                id="soft-wake",
                name="Soft Wake",
                description="Gentle, barely-there system coming alive",
                sound_characters=TieredSoundCharacters(
                    simple=["barely audible hum fading in from silence"],
                    standard=[
                        "barely audible hum fading in from silence",
                        "soft electronic whisper powering on",
                        "delicate activation ping at low volume",
                    ],
                    detailed=[
                        "barely audible hum fading in from silence",
                        "soft electronic whisper powering on",
                        "delicate activation ping at low volume",
                        "quiet breath of warm static becoming tone",
                        "subtle glow of sound emerging from nothing",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="SessionEnd",
        name="Session End",
        description="Claude Code session has ended",
        sound_characters=TieredSoundCharacters(
            simple=["descending warmth fading into quiet"],
            standard=[
                "descending warmth fading into quiet",
                "gentle closure like a book softly shut",
                "last ember of sound cooling to silence",
            ],
            detailed=[
                "descending warmth fading into quiet",
                "gentle closure like a book softly shut",
                "last ember of sound cooling to silence",
                "farewell tone releasing like held breath",
                "sunset colors draining slowly from sound",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="sunset-fade",
                name="Sunset Fade",
                description="Warm colors draining into peaceful dusk",
                sound_characters=TieredSoundCharacters(
                    simple=["warm descending tone like sun setting slowly"],
                    standard=[
                        "warm descending tone like sun setting slowly",
                        "golden hour fading to purple twilight",
                        "gentle melody sinking below the horizon",
                    ],
                    detailed=[
                        "warm descending tone like sun setting slowly",
                        "golden hour fading to purple twilight",
                        "gentle melody sinking below the horizon",
                        "last warm light dissolving into dusk",
                        "evening calm settling over quiet landscape",
                    ],
                ),
            ),
            SoundStylePreset(
                id="gentle-goodbye",
                name="Gentle Goodbye",
                description="Warm parting with lingering affection",
                sound_characters=TieredSoundCharacters(
                    simple=["soft farewell melody with bittersweet warmth"],
                    standard=[
                        "soft farewell melody with bittersweet warmth",
                        "gentle lullaby note trailing off",
                        "peaceful parting chime with long decay",
                    ],
                    detailed=[
                        "soft farewell melody with bittersweet warmth",
                        "gentle lullaby note trailing off",
                        "peaceful parting chime with long decay",
                        "tender goodbye shimmer fading to nothing",
                        "serene closing tone like whispered goodnight",
                    ],
                ),
            ),
            SoundStylePreset(
                id="turbine-down",
                name="Turbine Down",
                description="Machine winding down to standby",
                sound_characters=TieredSoundCharacters(
                    simple=["turbine spinning down from high to low pitch"],
                    standard=[
                        "turbine spinning down from high to low pitch",
                        "mechanical systems powering off in sequence",
                        "motor decelerating with descending whir",
                    ],
                    detailed=[
                        "turbine spinning down from high to low pitch",
                        "mechanical systems powering off in sequence",
                        "motor decelerating with descending whir",
                        "circuit boards clicking off one by one",
                        "final relay disengaging with soft clunk",
                    ],
                ),
            ),
        ],
    ),
    # Tool lifecycle events
    HookType(
        id="PreToolUse",
        name="Pre Tool Use",
        description="Triggered before a tool call executes",
        sound_characters=TieredSoundCharacters(
            simple=["quick readying click like cocking a mechanism"],
            standard=[
                "quick readying click like cocking a mechanism",
                "brief metallic latch engaging",
                "sharp intake before action",
            ],
            detailed=[
                "quick readying click like cocking a mechanism",
                "brief metallic latch engaging",
                "sharp intake before action",
                "taut string plucked once in preparation",
                "crisp toggle switch flipped to armed position",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="lever-prime",
                name="Lever Prime",
                description="Mechanical lever pulled to ready position",
                sound_characters=TieredSoundCharacters(
                    simple=["metal lever pulled into locked position"],
                    standard=[
                        "metal lever pulled into locked position",
                        "mechanical latch clicking into place",
                        "spring-loaded mechanism primed and ready",
                    ],
                    detailed=[
                        "metal lever pulled into locked position",
                        "mechanical latch clicking into place",
                        "spring-loaded mechanism primed and ready",
                        "heavy bolt sliding forward with authority",
                        "precision gear engaging with smooth clunk",
                    ],
                ),
            ),
            SoundStylePreset(
                id="bow-draw",
                name="Bow Draw",
                description="Taut string being pulled back with tension",
                sound_characters=TieredSoundCharacters(
                    simple=["bowstring drawn taut with building tension"],
                    standard=[
                        "bowstring drawn taut with building tension",
                        "elastic energy stored in vibrating string",
                        "creak of bent wood under pressure",
                    ],
                    detailed=[
                        "bowstring drawn taut with building tension",
                        "elastic energy stored in vibrating string",
                        "creak of bent wood under pressure",
                        "tense anticipation of imminent release",
                        "fiber stretching to maximum potential",
                    ],
                ),
            ),
            SoundStylePreset(
                id="circuit-arm",
                name="Circuit Arm",
                description="Electronic system arming with digital click",
                sound_characters=TieredSoundCharacters(
                    simple=["digital circuit arming with crisp electronic click"],
                    standard=[
                        "digital circuit arming with crisp electronic click",
                        "electronic system charging with rising tone",
                        "synthesized activation trigger pulse",
                    ],
                    detailed=[
                        "digital circuit arming with crisp electronic click",
                        "electronic system charging with rising tone",
                        "synthesized activation trigger pulse",
                        "binary countdown blip before execution",
                        "capacitor whine building to ready state",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="PostToolUse",
        name="Post Tool Use",
        description="Triggered after a tool completes execution",
        sound_characters=TieredSoundCharacters(
            simple=["satisfying snap of completed action"],
            standard=[
                "satisfying snap of completed action",
                "crisp release like breaking a clean seal",
                "bright pop confirming task is done",
            ],
            detailed=[
                "satisfying snap of completed action",
                "crisp release like breaking a clean seal",
                "bright pop confirming task is done",
                "quick harmonic tap with clean attack",
                "sharp percussive ping with short decay",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="stamp-press",
                name="Stamp Press",
                description="Heavy stamp pressing down with finality",
                sound_characters=TieredSoundCharacters(
                    simple=["heavy rubber stamp pressing firmly on paper"],
                    standard=[
                        "heavy rubber stamp pressing firmly on paper",
                        "decisive thunk of approval seal",
                        "solid impact of stamp on desktop",
                    ],
                    detailed=[
                        "heavy rubber stamp pressing firmly on paper",
                        "decisive thunk of approval seal",
                        "solid impact of stamp on desktop",
                        "ink pad compression with brief suction release",
                        "authoritative press leaving clean impression",
                    ],
                ),
            ),
            SoundStylePreset(
                id="bubble-pop",
                name="Bubble Pop",
                description="Satisfying bubble bursting cleanly",
                sound_characters=TieredSoundCharacters(
                    simple=["crisp soap bubble popping at close range"],
                    standard=[
                        "crisp soap bubble popping at close range",
                        "bright snappy burst with airy release",
                        "clean percussive pop with micro-shimmer",
                    ],
                    detailed=[
                        "crisp soap bubble popping at close range",
                        "bright snappy burst with airy release",
                        "clean percussive pop with micro-shimmer",
                        "satisfying membrane rupture with sparkle",
                        "tiny implosion of air with pleasant ring",
                    ],
                ),
            ),
            SoundStylePreset(
                id="relay-click",
                name="Relay Click",
                description="Electrical relay contact closing shut",
                sound_characters=TieredSoundCharacters(
                    simple=["electrical relay snapping shut with click"],
                    standard=[
                        "electrical relay snapping shut with click",
                        "circuit breaker engaging with metallic contact",
                        "processor finishing task with sharp chirp",
                    ],
                    detailed=[
                        "electrical relay snapping shut with click",
                        "circuit breaker engaging with metallic contact",
                        "processor finishing task with sharp chirp",
                        "capacitor discharge with brief buzz",
                        "digital handshake completing with confirmation tone",
                    ],
                ),
            ),
        ],
    ),
    # Agent events
    HookType(
        id="SubagentStart",
        name="Subagent Start",
        description="A new subagent has been spawned",
        sound_characters=TieredSoundCharacters(
            simple=["spark flying off from main flame"],
            standard=[
                "spark flying off from main flame",
                "energy splitting into diverging paths",
                "bright fracture launching outward",
            ],
            detailed=[
                "spark flying off from main flame",
                "energy splitting into diverging paths",
                "bright fracture launching outward",
                "mitosis moment of one becoming two",
                "rapid ascending sweep branching at the top",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="spark-launch",
                name="Spark Launch",
                description="Hot spark ejected with crackling energy",
                sound_characters=TieredSoundCharacters(
                    simple=["bright spark ejecting with electrical crackle"],
                    standard=[
                        "bright spark ejecting with electrical crackle",
                        "hot ember launching from fire with sizzle",
                        "rapid ignition point shooting outward",
                    ],
                    detailed=[
                        "bright spark ejecting with electrical crackle",
                        "hot ember launching from fire with sizzle",
                        "rapid ignition point shooting outward",
                        "welding arc flash with rising whistle",
                        "firework fuse catching with upward hiss",
                    ],
                ),
            ),
            SoundStylePreset(
                id="cell-divide",
                name="Cell Divide",
                description="Organic splitting into two distinct parts",
                sound_characters=TieredSoundCharacters(
                    simple=["liquid splitting sound of one becoming two"],
                    standard=[
                        "liquid splitting sound of one becoming two",
                        "organic membrane dividing with soft stretch",
                        "gentle bifurcation with dual tones emerging",
                    ],
                    detailed=[
                        "liquid splitting sound of one becoming two",
                        "organic membrane dividing with soft stretch",
                        "gentle bifurcation with dual tones emerging",
                        "frequency doubling as signal branches",
                        "smooth divergence of parallel tone paths",
                    ],
                ),
            ),
            SoundStylePreset(
                id="portal-open",
                name="Portal Open",
                description="Dimensional gateway tearing open briefly",
                sound_characters=TieredSoundCharacters(
                    simple=["swirling vortex opening with rising energy"],
                    standard=[
                        "swirling vortex opening with rising energy",
                        "dimensional tear crackling with power",
                        "portal spinning up with expanding whoosh",
                    ],
                    detailed=[
                        "swirling vortex opening with rising energy",
                        "dimensional tear crackling with power",
                        "portal spinning up with expanding whoosh",
                        "space-time fabric stretching with harmonic whine",
                        "wormhole activating with radiant surge",
                    ],
                ),
            ),
        ],
    ),
    HookType(
        id="UserPromptSubmit",
        name="User Prompt Submit",
        description="User has submitted a new prompt",
        sound_characters=TieredSoundCharacters(
            simple=["arrow released from bowstring with swift whoosh"],
            standard=[
                "arrow released from bowstring with swift whoosh",
                "message launched with gentle propulsion",
                "paper airplane thrown with graceful sweep",
            ],
            detailed=[
                "arrow released from bowstring with swift whoosh",
                "message launched with gentle propulsion",
                "paper airplane thrown with graceful sweep",
                "carrier pigeon taking flight with wing flutter",
                "signal dispatched with ascending glide",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="arrow-release",
                name="Arrow Release",
                description="Taut string releasing projectile forward",
                sound_characters=TieredSoundCharacters(
                    simple=["bowstring snapping forward releasing arrow"],
                    standard=[
                        "bowstring snapping forward releasing arrow",
                        "swift projectile whoosh cutting through air",
                        "taut release with sharp twang and fade",
                    ],
                    detailed=[
                        "bowstring snapping forward releasing arrow",
                        "swift projectile whoosh cutting through air",
                        "taut release with sharp twang and fade",
                        "feathered shaft whistling as it flies",
                        "elastic tension converting to kinetic swoosh",
                    ],
                ),
            ),
            SoundStylePreset(
                id="key-strike",
                name="Key Strike",
                description="Satisfying mechanical keyboard enter press",
                sound_characters=TieredSoundCharacters(
                    simple=["mechanical keyboard enter key pressed firmly"],
                    standard=[
                        "mechanical keyboard enter key pressed firmly",
                        "satisfying tactile click with spring return",
                        "crisp key bottoming out on solid base",
                    ],
                    detailed=[
                        "mechanical keyboard enter key pressed firmly",
                        "satisfying tactile click with spring return",
                        "crisp key bottoming out on solid base",
                        "cherry switch actuating with clean snap",
                        "typing confirmation with decisive authority",
                    ],
                ),
            ),
            SoundStylePreset(
                id="bird-dispatch",
                name="Bird Dispatch",
                description="Carrier bird taking flight with message",
                sound_characters=TieredSoundCharacters(
                    simple=["bird taking flight with rapid wing flutter"],
                    standard=[
                        "bird taking flight with rapid wing flutter",
                        "feathers cutting air as message departs",
                        "swift ascending launch with organic whoosh",
                    ],
                    detailed=[
                        "bird taking flight with rapid wing flutter",
                        "feathers cutting air as message departs",
                        "swift ascending launch with organic whoosh",
                        "messenger wings beating upward into distance",
                        "graceful departure sweep fading skyward",
                    ],
                ),
            ),
        ],
    ),
]


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

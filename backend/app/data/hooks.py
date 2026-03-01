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
            simple=["completion chime"],
            standard=["completion chime", "resolution tone", "bright closing bell"],
            detailed=[
                "triumphant completion chime",
                "satisfying resolution tone",
                "bright ascending melody",
                "warm major chord finish",
                "clear final bell note",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="classic-chime",
                name="Classic Chime",
                description="Clean, traditional completion sound",
                sound_characters=TieredSoundCharacters(
                    simple=["completion chime"],
                    standard=["completion chime", "resolution tone", "bright closing bell"],
                    detailed=[
                        "triumphant completion chime",
                        "satisfying resolution tone",
                        "bright ascending melody",
                        "warm major chord finish",
                        "clear final bell note",
                    ],
                ),
            ),
            SoundStylePreset(
                id="celebratory-fanfare",
                name="Celebratory Fanfare",
                description="Upbeat, triumphant finish",
                sound_characters=TieredSoundCharacters(
                    simple=["victory fanfare"],
                    standard=["victory fanfare", "celebratory brass hit", "triumphant horn"],
                    detailed=[
                        "triumphant brass fanfare",
                        "celebratory horn stab",
                        "bright victory flourish",
                        "ascending major arpeggio",
                        "warm orchestral resolve",
                    ],
                ),
            ),
            SoundStylePreset(
                id="gentle-resolve",
                name="Gentle Resolve",
                description="Soft, calming completion",
                sound_characters=TieredSoundCharacters(
                    simple=["soft resolve tone"],
                    standard=["soft resolve tone", "gentle harp pluck", "warm pad release"],
                    detailed=[
                        "gentle harp resolution",
                        "soft warm pad release",
                        "delicate bell shimmer",
                        "calm descending melody",
                        "peaceful closing tone",
                    ],
                ),
            ),
            SoundStylePreset(
                id="digital-confirm",
                name="Digital Confirm",
                description="Modern, techy confirmation",
                sound_characters=TieredSoundCharacters(
                    simple=["digital confirm beep"],
                    standard=["digital confirm beep", "synth success tone", "electronic chime"],
                    detailed=[
                        "crisp digital confirmation",
                        "bright synth success tone",
                        "clean electronic chime",
                        "futuristic resolve ping",
                        "sharp binary completion",
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
            simple=["soft confirmation ding"],
            standard=["soft confirmation ding", "subtle completion ping", "quiet acknowledgment"],
            detailed=[
                "soft confirmation ding",
                "subtle completion ping",
                "quiet acknowledgment tone",
                "gentle background chime",
                "muted bell ring",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="soft-ding",
                name="Soft Ding",
                description="Quiet, unobtrusive confirmation",
                sound_characters=TieredSoundCharacters(
                    simple=["soft confirmation ding"],
                    standard=[
                        "soft confirmation ding",
                        "subtle completion ping",
                        "quiet acknowledgment",
                    ],
                    detailed=[
                        "soft confirmation ding",
                        "subtle completion ping",
                        "quiet acknowledgment tone",
                        "gentle background chime",
                        "muted bell ring",
                    ],
                ),
            ),
            SoundStylePreset(
                id="echo-fade",
                name="Echo Fade",
                description="Fading echo that dissolves gently",
                sound_characters=TieredSoundCharacters(
                    simple=["fading echo ping"],
                    standard=["fading echo ping", "reverb tail chime", "dissolving tone"],
                    detailed=[
                        "fading reverb echo",
                        "dissolving bell shimmer",
                        "soft delay trail",
                        "ambient echo decay",
                        "gentle reverb tail",
                    ],
                ),
            ),
            SoundStylePreset(
                id="quick-blip",
                name="Quick Blip",
                description="Fast, minimal acknowledgment",
                sound_characters=TieredSoundCharacters(
                    simple=["quick blip"],
                    standard=["quick blip", "short tick", "brief pop"],
                    detailed=[
                        "rapid micro blip",
                        "short staccato tick",
                        "brief electronic pop",
                        "crisp background tap",
                        "minimal click tone",
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
            simple=["attention alert ping"],
            standard=[
                "attention alert ping",
                "two-tone notification chime",
                "permission request tone",
            ],
            detailed=[
                "attention alert ping",
                "two-tone notification chime",
                "permission request tone",
                "gentle warning bell",
                "questioning ascending arpeggio",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="alert-ping",
                name="Alert Ping",
                description="Clear attention-getting ping",
                sound_characters=TieredSoundCharacters(
                    simple=["attention alert ping"],
                    standard=[
                        "attention alert ping",
                        "two-tone notification chime",
                        "permission request tone",
                    ],
                    detailed=[
                        "attention alert ping",
                        "two-tone notification chime",
                        "permission request tone",
                        "gentle warning bell",
                        "questioning ascending arpeggio",
                    ],
                ),
            ),
            SoundStylePreset(
                id="urgent-klaxon",
                name="Urgent Klaxon",
                description="Strong, urgent alert tone",
                sound_characters=TieredSoundCharacters(
                    simple=["urgent alarm tone"],
                    standard=["urgent alarm tone", "sharp klaxon burst", "warning siren note"],
                    detailed=[
                        "sharp urgent klaxon",
                        "warning siren burst",
                        "intense alert horn",
                        "piercing alarm tone",
                        "rapid pulsing warning",
                    ],
                ),
            ),
            SoundStylePreset(
                id="polite-knock",
                name="Polite Knock",
                description="Gentle, door-knock style prompt",
                sound_characters=TieredSoundCharacters(
                    simple=["polite knock"],
                    standard=["polite knock", "gentle tap sequence", "soft wooden knock"],
                    detailed=[
                        "gentle wooden knock",
                        "polite door tap sequence",
                        "soft rhythmic knocking",
                        "warm hollow tap",
                        "courteous rap pattern",
                    ],
                ),
            ),
            SoundStylePreset(
                id="question-tone",
                name="Question Tone",
                description="Inquisitive, rising question sound",
                sound_characters=TieredSoundCharacters(
                    simple=["questioning tone"],
                    standard=[
                        "questioning tone",
                        "rising inquiry chime",
                        "curious ascending note",
                    ],
                    detailed=[
                        "inquisitive rising tone",
                        "curious ascending chime",
                        "gentle questioning melody",
                        "upward inflection ping",
                        "wondering arpeggio rise",
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
            simple=["gentle waiting tone"],
            standard=["gentle low hum", "warm waiting tone", "soft sustained pad"],
            detailed=[
                "gentle low hum",
                "warm waiting tone",
                "soft sustained pad",
                "slow ambient pulse",
                "mellow drone note",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="gentle-waiting",
                name="Gentle Waiting",
                description="Warm, patient waiting sound",
                sound_characters=TieredSoundCharacters(
                    simple=["gentle waiting tone"],
                    standard=["gentle low hum", "warm waiting tone", "soft sustained pad"],
                    detailed=[
                        "gentle low hum",
                        "warm waiting tone",
                        "soft sustained pad",
                        "slow ambient pulse",
                        "mellow drone note",
                    ],
                ),
            ),
            SoundStylePreset(
                id="ticking-clock",
                name="Ticking Clock",
                description="Rhythmic, clock-like patience signal",
                sound_characters=TieredSoundCharacters(
                    simple=["ticking clock"],
                    standard=["soft ticking clock", "rhythmic pendulum", "gentle metronome"],
                    detailed=[
                        "soft rhythmic ticking",
                        "gentle pendulum swing",
                        "clock metronome pulse",
                        "steady mechanical tick",
                        "patient timepiece rhythm",
                    ],
                ),
            ),
            SoundStylePreset(
                id="ambient-drift",
                name="Ambient Drift",
                description="Floating, atmospheric idle tone",
                sound_characters=TieredSoundCharacters(
                    simple=["ambient drift"],
                    standard=["ambient drift", "floating pad texture", "airy sustained tone"],
                    detailed=[
                        "floating ambient drift",
                        "ethereal pad texture",
                        "airy atmospheric sustain",
                        "spacious reverb wash",
                        "dreamy hovering tone",
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
            simple=["ascending startup chime"],
            standard=["ascending startup chime", "bright rising tone", "warm welcome ding"],
            detailed=[
                "ascending startup chime",
                "bright rising tone",
                "warm welcome ding",
                "major key arpeggio",
                "uplifting fanfare note",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="startup-chime",
                name="Startup Chime",
                description="Classic ascending boot-up sound",
                sound_characters=TieredSoundCharacters(
                    simple=["ascending startup chime"],
                    standard=[
                        "ascending startup chime",
                        "bright rising tone",
                        "warm welcome ding",
                    ],
                    detailed=[
                        "ascending startup chime",
                        "bright rising tone",
                        "warm welcome ding",
                        "major key arpeggio",
                        "uplifting fanfare note",
                    ],
                ),
            ),
            SoundStylePreset(
                id="grand-opening",
                name="Grand Opening",
                description="Dramatic, impressive session start",
                sound_characters=TieredSoundCharacters(
                    simple=["grand opening flourish"],
                    standard=[
                        "grand opening flourish",
                        "dramatic intro swell",
                        "orchestral rise",
                    ],
                    detailed=[
                        "dramatic orchestral flourish",
                        "grand cinematic swell",
                        "majestic brass opening",
                        "sweeping string rise",
                        "powerful timpani roll",
                    ],
                ),
            ),
            SoundStylePreset(
                id="quiet-boot",
                name="Quiet Boot",
                description="Subtle, understated session start",
                sound_characters=TieredSoundCharacters(
                    simple=["quiet boot tone"],
                    standard=["quiet boot tone", "soft power-on hum", "gentle activation ping"],
                    detailed=[
                        "soft power-on hum",
                        "gentle activation ping",
                        "quiet electronic boot",
                        "subtle system wake tone",
                        "delicate startup whisper",
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
            simple=["descending shutdown tone"],
            standard=["descending shutdown tone", "closing fade", "soft minor chord"],
            detailed=[
                "descending shutdown tone",
                "closing fade",
                "soft minor chord",
                "gentle diminishing sweep",
                "final farewell chime",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="shutdown-tone",
                name="Shutdown Tone",
                description="Classic descending power-down",
                sound_characters=TieredSoundCharacters(
                    simple=["descending shutdown tone"],
                    standard=["descending shutdown tone", "closing fade", "soft minor chord"],
                    detailed=[
                        "descending shutdown tone",
                        "closing fade",
                        "soft minor chord",
                        "gentle diminishing sweep",
                        "final farewell chime",
                    ],
                ),
            ),
            SoundStylePreset(
                id="gentle-farewell",
                name="Gentle Farewell",
                description="Warm, pleasant goodbye",
                sound_characters=TieredSoundCharacters(
                    simple=["warm farewell chime"],
                    standard=[
                        "warm farewell chime",
                        "gentle goodbye melody",
                        "soft closing lullaby",
                    ],
                    detailed=[
                        "warm farewell melody",
                        "gentle goodbye chime",
                        "soft closing lullaby note",
                        "peaceful parting tone",
                        "serene ending shimmer",
                    ],
                ),
            ),
            SoundStylePreset(
                id="power-down",
                name="Power Down",
                description="Mechanical, system shutdown feel",
                sound_characters=TieredSoundCharacters(
                    simple=["power down whir"],
                    standard=["power down whir", "mechanical shutdown", "system off beep"],
                    detailed=[
                        "mechanical power-down whir",
                        "system shutdown sequence",
                        "electronic off beep",
                        "motor winding down",
                        "circuit deactivation click",
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
            simple=["soft click"],
            standard=["soft click", "brief activation tick", "light pluck note"],
            detailed=[
                "soft click",
                "brief activation tick",
                "light pluck note",
                "quick metallic tap",
                "crisp staccato ping",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="soft-click",
                name="Soft Click",
                description="Minimal, subtle activation click",
                sound_characters=TieredSoundCharacters(
                    simple=["soft click"],
                    standard=["soft click", "brief activation tick", "light pluck note"],
                    detailed=[
                        "soft click",
                        "brief activation tick",
                        "light pluck note",
                        "quick metallic tap",
                        "crisp staccato ping",
                    ],
                ),
            ),
            SoundStylePreset(
                id="mechanical-engage",
                name="Mechanical Engage",
                description="Gears-engaging, industrial feel",
                sound_characters=TieredSoundCharacters(
                    simple=["mechanical engage click"],
                    standard=[
                        "mechanical engage click",
                        "gear lock clunk",
                        "lever pull sound",
                    ],
                    detailed=[
                        "mechanical gear engagement",
                        "heavy lever click",
                        "industrial lock clunk",
                        "precision mechanism snap",
                        "metallic latch engage",
                    ],
                ),
            ),
            SoundStylePreset(
                id="digital-initiate",
                name="Digital Initiate",
                description="Electronic, digital activation",
                sound_characters=TieredSoundCharacters(
                    simple=["digital initiate beep"],
                    standard=[
                        "digital initiate beep",
                        "electronic arm tone",
                        "synth trigger pulse",
                    ],
                    detailed=[
                        "digital activation beep",
                        "electronic arming tone",
                        "synth trigger pulse",
                        "binary startup chirp",
                        "circuit engage signal",
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
            simple=["short confirmation beep"],
            standard=["crisp pop", "short confirmation beep", "bright staccato note"],
            detailed=[
                "crisp pop",
                "short confirmation beep",
                "bright staccato note",
                "quick resolution ping",
                "clean harmonic tap",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="confirm-beep",
                name="Confirm Beep",
                description="Quick, clean confirmation",
                sound_characters=TieredSoundCharacters(
                    simple=["short confirmation beep"],
                    standard=[
                        "crisp pop",
                        "short confirmation beep",
                        "bright staccato note",
                    ],
                    detailed=[
                        "crisp pop",
                        "short confirmation beep",
                        "bright staccato note",
                        "quick resolution ping",
                        "clean harmonic tap",
                    ],
                ),
            ),
            SoundStylePreset(
                id="crisp-pop",
                name="Crisp Pop",
                description="Satisfying bubble-pop finish",
                sound_characters=TieredSoundCharacters(
                    simple=["crisp pop"],
                    standard=["crisp pop", "bubble burst", "snappy pluck"],
                    detailed=[
                        "satisfying bubble pop",
                        "crisp snappy burst",
                        "bright pluck release",
                        "clean percussive pop",
                        "sharp transient snap",
                    ],
                ),
            ),
            SoundStylePreset(
                id="circuit-complete",
                name="Circuit Complete",
                description="Electronic circuit-closing sound",
                sound_characters=TieredSoundCharacters(
                    simple=["circuit complete buzz"],
                    standard=[
                        "circuit complete buzz",
                        "electronic done signal",
                        "relay close click",
                    ],
                    detailed=[
                        "electronic circuit close",
                        "relay contact click",
                        "digital task complete signal",
                        "processor done chirp",
                        "capacitor discharge tone",
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
            simple=["rising swoosh"],
            standard=["rising swoosh", "quick launch tone", "ascending glissando"],
            detailed=[
                "rising swoosh",
                "quick launch tone",
                "ascending glissando",
                "bright forking arpeggio",
                "rapid upward sweep",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="rising-swoosh",
                name="Rising Swoosh",
                description="Upward sweep, launch feeling",
                sound_characters=TieredSoundCharacters(
                    simple=["rising swoosh"],
                    standard=["rising swoosh", "quick launch tone", "ascending glissando"],
                    detailed=[
                        "rising swoosh",
                        "quick launch tone",
                        "ascending glissando",
                        "bright forking arpeggio",
                        "rapid upward sweep",
                    ],
                ),
            ),
            SoundStylePreset(
                id="fork-signal",
                name="Fork Signal",
                description="Splitting, branching sound",
                sound_characters=TieredSoundCharacters(
                    simple=["fork split tone"],
                    standard=[
                        "fork split tone",
                        "branching diverge sound",
                        "dual path signal",
                    ],
                    detailed=[
                        "process fork split tone",
                        "branching diverge sweep",
                        "dual path signal burst",
                        "splitting frequency rise",
                        "parallel spawn chirp",
                    ],
                ),
            ),
            SoundStylePreset(
                id="spawn-pulse",
                name="Spawn Pulse",
                description="Energy pulse, creation burst",
                sound_characters=TieredSoundCharacters(
                    simple=["spawn energy pulse"],
                    standard=[
                        "spawn energy pulse",
                        "creation burst",
                        "activation wave",
                    ],
                    detailed=[
                        "energetic spawn pulse",
                        "bright creation burst",
                        "expanding activation wave",
                        "radiant power surge",
                        "dynamic ignition flash",
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
            simple=["soft whoosh"],
            standard=["soft whoosh", "gentle keystroke tone", "message dispatch tone"],
            detailed=[
                "soft whoosh",
                "gentle keystroke tone",
                "message dispatch tone",
                "input acknowledgment chime",
                "light ascending glide",
            ],
        ),
        sound_style_presets=[
            SoundStylePreset(
                id="soft-whoosh",
                name="Soft Whoosh",
                description="Gentle send-off whoosh",
                sound_characters=TieredSoundCharacters(
                    simple=["soft whoosh"],
                    standard=[
                        "soft whoosh",
                        "gentle keystroke tone",
                        "message dispatch tone",
                    ],
                    detailed=[
                        "soft whoosh",
                        "gentle keystroke tone",
                        "message dispatch tone",
                        "input acknowledgment chime",
                        "light ascending glide",
                    ],
                ),
            ),
            SoundStylePreset(
                id="keystroke-send",
                name="Keystroke Send",
                description="Keyboard-inspired send sound",
                sound_characters=TieredSoundCharacters(
                    simple=["keystroke send click"],
                    standard=[
                        "keystroke send click",
                        "keyboard enter press",
                        "typing submit tone",
                    ],
                    detailed=[
                        "mechanical keyboard enter",
                        "satisfying keystroke submit",
                        "typing confirmation click",
                        "crisp key press send",
                        "tactile input dispatch",
                    ],
                ),
            ),
            SoundStylePreset(
                id="message-dispatch",
                name="Message Dispatch",
                description="Message-sending, mail-out feel",
                sound_characters=TieredSoundCharacters(
                    simple=["message dispatch swoosh"],
                    standard=[
                        "message dispatch swoosh",
                        "send arrow release",
                        "outgoing mail tone",
                    ],
                    detailed=[
                        "swift message dispatch",
                        "arrow release swoosh",
                        "outgoing transmission tone",
                        "paper airplane launch",
                        "rapid delivery sweep",
                    ],
                ),
            ),
        ],
    ),
]


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

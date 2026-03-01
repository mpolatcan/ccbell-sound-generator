"""Claude Code hook type definitions."""

import json
from pathlib import Path

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

# Map directory names to hook IDs
_DIR_TO_HOOK_ID: dict[str, str] = {
    "stop": "Stop",
    "subagent-stop": "SubagentStop",
    "permission-prompt": "PermissionPrompt",
    "idle-prompt": "IdlePrompt",
    "session-start": "SessionStart",
    "session-end": "SessionEnd",
    "pre-tool-use": "PreToolUse",
    "post-tool-use": "PostToolUse",
    "subagent-start": "SubagentStart",
    "user-prompt-submit": "UserPromptSubmit",
}


def _load_hook_style_presets() -> dict[str, dict[str, list[SoundStylePreset]]]:
    """Load theme-keyed style presets from JSON directory tree.

    Structure: hook_styles/<hook-dir>/<theme-dir>/<preset-name>.json
    Each JSON file is a single SoundStylePreset object.
    Returns: {hook_id: {theme_id: [SoundStylePreset, ...]}}
    """
    base_dir = Path(__file__).parent / "hook_styles"
    result: dict[str, dict[str, list[SoundStylePreset]]] = {}
    for hook_dir in sorted(base_dir.iterdir()):
        if not hook_dir.is_dir():
            continue
        hook_id = _DIR_TO_HOOK_ID.get(hook_dir.name)
        if not hook_id:
            continue
        result[hook_id] = {}
        for theme_dir in sorted(hook_dir.iterdir()):
            if not theme_dir.is_dir():
                continue
            presets: list[SoundStylePreset] = []
            for preset_file in sorted(theme_dir.glob("*.json")):
                with open(preset_file) as f:
                    preset_raw = json.load(f)
                presets.append(SoundStylePreset(**preset_raw))
            if presets:
                result[hook_id][theme_dir.name] = presets
    return result


_HOOK_STYLE_PRESETS = _load_hook_style_presets()

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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("Stop", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("SubagentStop", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("PermissionPrompt", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("IdlePrompt", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("SessionStart", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("SessionEnd", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("PreToolUse", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("PostToolUse", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("SubagentStart", {}),
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
        sound_style_presets=_HOOK_STYLE_PRESETS.get("UserPromptSubmit", {}),
    ),
]


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

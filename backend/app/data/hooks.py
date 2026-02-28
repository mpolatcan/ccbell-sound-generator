"""Claude Code hook type definitions."""

from app.core.models import HookType, HookTypeId, TieredSoundCharacters

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
    ),
]


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

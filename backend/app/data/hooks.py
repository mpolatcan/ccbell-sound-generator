"""Claude Code hook type definitions."""

from app.core.models import HookType, HookTypeId, SoundCharacters

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
        sound_characters=SoundCharacters(
            simple="bright bell chime",
            detailed="bright ascending bell chime, completion tone",
            more_detailed="bright ascending two-note completion chime, clear crisp bell tone, satisfying resolution",
        ),
        suggested_duration=1.5,
    ),
    HookType(
        id="SubagentStop",
        name="Subagent Stop",
        description="A subagent has finished its task",
        sound_characters=SoundCharacters(
            simple="soft muted ding",
            detailed="soft muted single ding, gentle bell",
            more_detailed="short soft single-note confirmation ding, gentle muted bell, subtle completion",
        ),
        suggested_duration=1.0,
    ),
    HookType(
        id="PermissionPrompt",
        name="Permission Prompt",
        description="Tool needs user permission to proceed",
        sound_characters=SoundCharacters(
            simple="two-tone alert ping",
            detailed="two-tone alert ping, bright notification",
            more_detailed="attention-getting two-tone alert chime, clear bright ping, urgent but pleasant notification",
        ),
        suggested_duration=1.0,
    ),
    HookType(
        id="IdlePrompt",
        name="Idle Prompt",
        description="Agent is idle and waiting for user input",
        sound_characters=SoundCharacters(
            simple="gentle low hum",
            detailed="gentle low hum fade, warm tone",
            more_detailed="gentle soft nudge tone, warm low-pitched hum with fade, quiet waiting reminder",
        ),
        suggested_duration=1.0,
    ),
    # Session lifecycle events
    HookType(
        id="SessionStart",
        name="Session Start",
        description="A new Claude Code session has started",
        sound_characters=SoundCharacters(
            simple="rising chime",
            detailed="rising three-note chime, startup tone",
            more_detailed="bright ascending three-note startup chime, welcoming warm boot sound, clear rising tones",
        ),
        suggested_duration=1.0,
    ),
    HookType(
        id="SessionEnd",
        name="Session End",
        description="Claude Code session has ended",
        sound_characters=SoundCharacters(
            simple="descending fade tone",
            detailed="descending soft fade tone, closing sound",
            more_detailed="soft descending two-note shutdown chime, gentle fading goodbye tone, warm closing sound",
        ),
        suggested_duration=1.0,
    ),
    # Tool lifecycle events
    HookType(
        id="PreToolUse",
        name="Pre Tool Use",
        description="Triggered before a tool call executes",
        sound_characters=SoundCharacters(
            simple="soft click",
            detailed="soft short click tick, tap sound",
            more_detailed="brief soft click, short subtle tap sound, quiet activation tick",
        ),
        suggested_duration=0.5,
    ),
    HookType(
        id="PostToolUse",
        name="Post Tool Use",
        description="Triggered after a tool completes execution",
        sound_characters=SoundCharacters(
            simple="crisp pop ping",
            detailed="crisp short pop ping, confirmation beep",
            more_detailed="quick short confirmation beep, brief crisp pop sound, tiny success ping",
        ),
        suggested_duration=0.5,
    ),
    # Agent events
    HookType(
        id="SubagentStart",
        name="Subagent Start",
        description="A new subagent has been spawned",
        sound_characters=SoundCharacters(
            simple="quick swoosh",
            detailed="quick rising swoosh, launch tone",
            more_detailed="short bright ascending whoosh, quick launch swoosh sound, brief rising activation tone",
        ),
        suggested_duration=1.0,
    ),
    HookType(
        id="UserPromptSubmit",
        name="User Prompt Submit",
        description="User has submitted a new prompt",
        sound_characters=SoundCharacters(
            simple="soft whoosh tap",
            detailed="brief soft whoosh tap, send sound",
            more_detailed="brief subtle keystroke click, short soft send whoosh, quick quiet confirmation tap",
        ),
        suggested_duration=0.5,
    ),
]


def get_hook_by_id(hook_id: str) -> HookType | None:
    """Get a hook type by its ID."""
    for hook in HOOK_TYPES:
        if hook.id == hook_id:
            return hook
    return None


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

"""Claude Code hook type definitions."""

from app.core.models import HookType, HookTypeId

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
        sound_character="bright ascending bell chime",
        suggested_duration=1.5,
    ),
    HookType(
        id="SubagentStop",
        name="Subagent Stop",
        description="A subagent has finished its task",
        sound_character="soft muted single ding",
        suggested_duration=1.0,
    ),
    HookType(
        id="PermissionPrompt",
        name="Permission Prompt",
        description="Tool needs user permission to proceed",
        sound_character="two-tone alert ping",
        suggested_duration=1.0,
    ),
    HookType(
        id="IdlePrompt",
        name="Idle Prompt",
        description="Agent is idle and waiting for user input",
        sound_character="gentle low hum fade",
        suggested_duration=1.0,
    ),
    # Session lifecycle events
    HookType(
        id="SessionStart",
        name="Session Start",
        description="A new Claude Code session has started",
        sound_character="rising three-note chime",
        suggested_duration=1.0,
    ),
    HookType(
        id="SessionEnd",
        name="Session End",
        description="Claude Code session has ended",
        sound_character="descending soft fade tone",
        suggested_duration=1.0,
    ),
    # Tool lifecycle events
    HookType(
        id="PreToolUse",
        name="Pre Tool Use",
        description="Triggered before a tool call executes",
        sound_character="soft short click tick",
        suggested_duration=0.5,
    ),
    HookType(
        id="PostToolUse",
        name="Post Tool Use",
        description="Triggered after a tool completes execution",
        sound_character="crisp short pop ping",
        suggested_duration=0.5,
    ),
    # Agent events
    HookType(
        id="SubagentStart",
        name="Subagent Start",
        description="A new subagent has been spawned",
        sound_character="quick rising swoosh",
        suggested_duration=1.0,
    ),
    HookType(
        id="UserPromptSubmit",
        name="User Prompt Submit",
        description="User has submitted a new prompt",
        sound_character="brief soft whoosh tap",
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

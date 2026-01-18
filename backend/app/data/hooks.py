"""Claude Code hook type definitions."""

from app.core.models import HookType

HOOK_TYPES: list[HookType] = [
    # Core hook events
    HookType(
        id="PreToolUse",
        name="Pre Tool Use",
        description="Triggered before a tool call executes",
        sound_character="Soft activation click, anticipatory tone",
        suggested_duration=0.5,
    ),
    HookType(
        id="PostToolUse",
        name="Post Tool Use",
        description="Triggered after a tool completes execution",
        sound_character="Quick confirmation beep, completion indicator",
        suggested_duration=0.5,
    ),
    HookType(
        id="Notification",
        name="Notification",
        description="General notification events",
        sound_character="Gentle chime, attention-getting but non-intrusive",
        suggested_duration=1.0,
    ),
    HookType(
        id="Stop",
        name="Stop",
        description="Main agent has finished its task",
        sound_character="Satisfying completion tone, task done",
        suggested_duration=1.5,
    ),
    HookType(
        id="SubagentStop",
        name="Subagent Stop",
        description="A subagent has finished its task",
        sound_character="Descending tone, subtask complete",
        suggested_duration=1.0,
    ),
    # Tool-specific sounds
    HookType(
        id="Bash",
        name="Bash Command",
        description="Terminal/shell command execution",
        sound_character="Terminal beep, command line aesthetic",
        suggested_duration=0.5,
    ),
    HookType(
        id="Read",
        name="Read File",
        description="File read operation",
        sound_character="Page flip, document opening",
        suggested_duration=0.5,
    ),
    HookType(
        id="Write",
        name="Write File",
        description="File write/create operation",
        sound_character="Save sound, file created confirmation",
        suggested_duration=0.5,
    ),
    HookType(
        id="Edit",
        name="Edit File",
        description="File edit operation",
        sound_character="Typing click, editing indicator",
        suggested_duration=0.5,
    ),
    HookType(
        id="Task",
        name="Task/Agent Launch",
        description="New agent or task spawned",
        sound_character="Launch sound, new process starting",
        suggested_duration=1.0,
    ),
    # Additional useful events
    HookType(
        id="Error",
        name="Error",
        description="Error or failure occurred",
        sound_character="Alert tone, problem indicator, attention needed",
        suggested_duration=1.0,
    ),
    HookType(
        id="Success",
        name="Success",
        description="Operation completed successfully",
        sound_character="Positive confirmation, achievement tone",
        suggested_duration=1.0,
    ),
    HookType(
        id="Warning",
        name="Warning",
        description="Warning or caution indicator",
        sound_character="Cautionary tone, gentle alert",
        suggested_duration=0.75,
    ),
    HookType(
        id="Progress",
        name="Progress Update",
        description="Task progress milestone",
        sound_character="Subtle progress tick, step complete",
        suggested_duration=0.3,
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

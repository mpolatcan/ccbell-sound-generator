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
    ),
    HookType(
        id="SubagentStop",
        name="Subagent Stop",
        description="A subagent has finished its task",
    ),
    HookType(
        id="PermissionPrompt",
        name="Permission Prompt",
        description="Tool needs user permission to proceed",
    ),
    HookType(
        id="IdlePrompt",
        name="Idle Prompt",
        description="Agent is idle and waiting for user input",
    ),
    # Session lifecycle events
    HookType(
        id="SessionStart",
        name="Session Start",
        description="A new Claude Code session has started",
    ),
    HookType(
        id="SessionEnd",
        name="Session End",
        description="Claude Code session has ended",
    ),
    # Tool lifecycle events
    HookType(
        id="PreToolUse",
        name="Pre Tool Use",
        description="Triggered before a tool call executes",
    ),
    HookType(
        id="PostToolUse",
        name="Post Tool Use",
        description="Triggered after a tool completes execution",
    ),
    # Agent events
    HookType(
        id="SubagentStart",
        name="Subagent Start",
        description="A new subagent has been spawned",
    ),
    HookType(
        id="UserPromptSubmit",
        name="User Prompt Submit",
        description="User has submitted a new prompt",
    ),
]


def get_all_hooks() -> list[HookType]:
    """Get all hook types."""
    return HOOK_TYPES

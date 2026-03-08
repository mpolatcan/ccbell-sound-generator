---
name: agent-browser
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.
allowed-tools: Bash(agent-browser:*)
---

# Browser Automation with agent-browser

## Core Workflow

1. `agent-browser open <url>` — navigate
2. `agent-browser snapshot -i` — get interactive elements with refs (`@e1`, `@e2`)
3. Interact using refs from snapshot
4. Re-snapshot after navigation or DOM changes

## Common Commands

```bash
# Navigation
agent-browser open <url>
agent-browser back | forward | reload | close

# Snapshot
agent-browser snapshot -i              # Interactive elements (recommended)
agent-browser snapshot -c              # Compact output
agent-browser snapshot -s "#selector"  # Scope to element

# Interactions (use @refs from snapshot)
agent-browser click @e1
agent-browser fill @e2 "text"
agent-browser type @e2 "text"          # Type without clearing
agent-browser press Enter
agent-browser select @e1 "value"
agent-browser scroll down 500
agent-browser hover @e1
agent-browser check @e1 | uncheck @e1

# Get info
agent-browser get text @e1
agent-browser get value @e1
agent-browser get url | get title

# Screenshots
agent-browser screenshot              # To stdout
agent-browser screenshot path.png     # To file
agent-browser screenshot --full       # Full page

# Wait
agent-browser wait @e1                # Wait for element
agent-browser wait 2000               # Wait ms
agent-browser wait --text "Success"
agent-browser wait --load networkidle

# State checks
agent-browser is visible @e1
agent-browser is enabled @e1

# JavaScript
agent-browser eval "document.title"
```

## Semantic Locators (alternative to refs)

```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
```

## Debugging

```bash
agent-browser open <url> --headed     # Show browser window
agent-browser console                 # View console messages
agent-browser errors                  # View page errors
agent-browser highlight @e1           # Highlight element
```

For full command reference: `agent-browser --help`

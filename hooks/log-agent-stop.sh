#!/bin/bash

# Resolve project-relative paths against the user's project (plugin runs from CLAUDE_PLUGIN_ROOT).
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true
# Claude Code SubagentStop hook: Log agent completion for audit trail
# Tracks when agents finish and their outcome
#
# Input schema (SubagentStop) — per Claude Code hooks reference:
# { "session_id": "...", "agent_id": "agent-abc123", "agent_type": "Explore",
#   "agent_transcript_path": "...", "last_assistant_message": "...", ... }
#
# The agent name is in `agent_type`, NOT `agent_name`. Reading `.agent_name`
# returns null on every invocation, so the fallback "unknown" is always used
# and the audit trail captures nothing useful.

INPUT=$(cat)

# Stay out of repositories that are not gamedev projects: Claude Code enables a
# plugin per scope, so this hook also runs in every unrelated repo the user opens.
# Placed after the stdin read, not before it, so Claude Code's write to this
# hook always completes even when the hook has nothing to do.
# The 2>/dev/null is not decoration: if CLAUDE_PLUGIN_ROOT is ever unset this resolves to
# /bin/gamedev-is-project, and bash's "No such file or directory" would surface to the user
# as hook output. Missing predicate means "do nothing", quietly.
"${CLAUDE_PLUGIN_ROOT}/bin/gamedev-is-project" 2> /dev/null || exit 0

# Parse agent name -- use jq if available, fall back to grep
if command -v jq >/dev/null 2>&1; then
    AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_type // "unknown"' 2>/dev/null)
else
    AGENT_NAME=$(echo "$INPUT" | grep -oE '"agent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"agent_type"[[:space:]]*:[[:space:]]*"//;s/"$//')
    [ -z "$AGENT_NAME" ] && AGENT_NAME="unknown"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SESSION_LOG_DIR="production/session-logs"

mkdir -p "$SESSION_LOG_DIR" 2>/dev/null

echo "$TIMESTAMP | Agent completed: $AGENT_NAME" >> "$SESSION_LOG_DIR/agent-audit.log" 2>/dev/null

exit 0

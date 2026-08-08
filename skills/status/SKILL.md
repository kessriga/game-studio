---
name: status
description: "Print the current production stage and Epic > Feature > Task breadcrumb on demand. Use when the user asks 'what stage are we in', 'where are we', 'show status', or wants a quick project-stage check without a full audit."
user-invocable: true
allowed-tools: Read
model: haiku
context: |
  !gamedev-stage 2>/dev/null || echo "Stage: (run /gamedev:start to scaffold this project)"
---

# Status

Report the current project stage to the user, concisely.

The `gamedev-stage` output is injected above as `Stage: <stage>` optionally
followed by ` | Epic > Feature > Task`. It is the same stage/breadcrumb the
SessionStart hook prints — this skill is the on-demand refresh when focus has
changed mid-session.

## What to do

1. Read the injected `Stage:` line above.
2. Restate it to the user in one line: the stage, and the Epic > Feature > Task
   breadcrumb if present.
3. If the stage could not be determined (empty, or the scaffold hint appeared),
   tell the user the project has not been scaffolded yet and point them to
   `/gamedev:start`.

Do not run a full project audit — that is `/gamedev:project-stage-detect`. This
skill is a two-second peek, nothing more. Do not write or modify any files.

# Game Studio project

This is a game project managed with the gamedev plugin. Its skills and specialist roles cover design, programming, art,
audio, narrative, QA, and release.

## Sources of truth

- Read `.claude/docs/technical-preferences.md` before using engine APIs or choosing a specialist. It holds shared
  settings for Pi, Claude Code, and Codex.
- Read the configured engine's `VERSION.md` and relevant modules under `docs/engine-reference/` before using its APIs.
  Consult official engine docs when a signature or behavior is missing or uncertain.
- Read the relevant design document under `design/gdd/` and accepted decisions under `docs/architecture/` before
  implementing a feature.
- Read `production/session-state/active.md`, when present, before resuming work.
- Before editing, read applicable `.claude/rules/*.md` files according to their `paths` patterns. Claude loads these
  rules itself; Pi and Codex must read them. Also read applicable nested AGENTS.md guides before editing their
  directories.
- For framework templates, coordination, and workflow instructions, use the installed gamedev skill and its linked host
  guide.

## Technology Stack

- **Engine**: [TO BE CONFIGURED]
- **Language**: [TO BE CONFIGURED]
- **Version Control**: Git with trunk-based development
- **Build System**: [TO BE CONFIGURED]
- **Asset Pipeline**: [TO BE CONFIGURED]

## Engine Version Reference

No engine selected yet. Use gamedev's setup-engine skill to choose and pin one.

## Collaboration

The user owns creative decisions and scope. Present options and drafts before asking for a decision. An explicit request
to implement or write a change authorizes that work; do not ask for the same permission again. Ask when scope changes or
a needed decision has not been made. Do not commit or publish without user authorization.

Use the engine specialist that matches the configured engine. In Pi, use an installed subagent extension when available;
pass the bundled role instructions, project context, task, edit scope, and required evidence through its actual tool
schema. Do not assume the package's role names are registered agent names. Without delegation tools, follow role
instructions sequentially and label the checks as self-review. This cannot satisfy a required independent review.

## Validation and handoff

Run the project's documented format, lint, build, and test commands before declaring implementation complete. Report
checks that could not run. Claude's plugin hooks provide extra reminders; Pi and Codex run these checks explicitly. Keep
a concise handoff in `production/session-state/active.md` when work continues across sessions. Record the current stage
in `production/stage.txt` only when the user chooses to advance it.

## Task management

Use Backlog.md when configured. Before changing tasks, read the MCP resource `backlog://workflow/overview` or call the
available Backlog instructions tool. If Backlog is missing, explain that requirement before attempting tracker work; you
can still use design and navigation skills. Never claim a tracker update without observing its result.

## Getting started

In Pi run `/skill:gamedev-start`; in Claude Code run `/gamedev:start`. In Codex select gamedev's start skill from
`/skills` or ask “Use gamedev's start skill.” These project files are yours to edit. Running start again adds missing
files and preserves existing ones. Use the host's status skill for a stage snapshot. Pi also has a progress widget and
`/gamedev-workflow panel` overlay; neither replaces the editor or footer. Its coordinating agent records catalog work
with `gamedev_workflow`, while subagents return evidence without changing progress. Use `/gamedev-workflow` to inspect
saved runs and approve verified work. Repeatable steps need explicit whole-scope confirmation; the Backlog board remains
the story authority. Never infer approval from file presence or a subagent's completion claim.

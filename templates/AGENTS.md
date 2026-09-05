# Game Studio project

This is a game project managed with the gamedev plugin. Its skills and
specialist roles cover design, programming, art, audio, narrative, QA, and release.

## Sources of truth

- Read `.claude/docs/technical-preferences.md` before using engine APIs or
  choosing a specialist. It holds shared settings for Claude Code and Codex.
- Read the configured engine's `VERSION.md` and relevant modules under
  `docs/engine-reference/` before using its APIs. Consult official engine docs
  when a signature or behavior is missing or uncertain.
- Read the relevant design document under `design/gdd/` and accepted decisions
  under `docs/architecture/` before implementing a feature.
- Read `production/session-state/active.md`, when present, before resuming work.
- Before editing, read applicable `.claude/rules/*.md` files according to their
  `paths` patterns. Claude loads these rules itself; Codex must read them.
- For framework templates, coordination, and workflow instructions, use the
  installed gamedev skill and its linked host guide.

## Technology Stack

- **Engine**: [TO BE CONFIGURED]
- **Language**: [TO BE CONFIGURED]
- **Version Control**: Git with trunk-based development
- **Build System**: [TO BE CONFIGURED]
- **Asset Pipeline**: [TO BE CONFIGURED]

## Engine Version Reference

No engine selected yet. Use gamedev's setup-engine skill to choose and pin one.

## Collaboration

The user owns creative decisions and scope. Present options and drafts before
asking for a decision. An explicit request to implement or write a change
authorizes that work; do not ask for the same permission again. Ask when scope
changes or a needed decision has not been made. Do not commit or publish without
user authorization.

Use the engine specialist that matches the configured engine. When Codex lacks
delegation tools, follow each specialist's role instructions sequentially and
say which checks were self-review. Never claim an independent review occurred.

## Validation and handoff

Run the project's documented format, lint, build, and test commands before
declaring implementation complete. Report checks that could not run. Claude's
plugin hooks provide extra reminders; Codex workflows run these checks explicitly.
Keep a concise handoff in `production/session-state/active.md` when work continues
across sessions. Record the current stage in `production/stage.txt` only when the
user chooses to advance it.

## Task management

Use Backlog.md when configured. Before changing tasks, read the MCP resource
`backlog://workflow/overview` or call the available Backlog instructions tool.
If Backlog is missing, explain that requirement before attempting tracker work;
you can still use design and navigation skills. Never claim a tracker update
without observing its result.

## Getting started

In Claude Code run `/gamedev:start`. In Codex select gamedev's start skill from
`/skills` or ask “Use gamedev's start skill.” These project files are yours to
edit. Running start again adds missing scaffold files and preserves existing ones.

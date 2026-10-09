# Claude Code as a second packaged host

Status: accepted for unreleased 0.5.0. Extends [the host-neutral layout](host-neutral-layout.md). Pi remains supported;
shared workflows and roles stay plain Markdown.

## Decision

Ship Claude Code support from the repository root as plugin `gamedev` in marketplace `game-studio`. Users install it
with `/plugin marketplace add kessriga/game-studio` and `/plugin install gamedev@game-studio`. The 72 skills load as
`/gamedev:<name>` and the 53 role guides register as `gamedev:<role>` subagent types. Frontmatter stays `name` and
`description` only; no model, tool, or permission metadata returns.

Shared prose identifies skills by the neutral identifier `gamedev:<name>`. Host syntax (`/skill:gamedev-<name>` in Pi,
`/gamedev:<name>` in Claude Code) appears only in host guides, install instructions, and host renderers. The workflow
catalog stores the identifier; each host renders its own command.

The progress core (`progress-store.ts`, `workflow.ts`, and the generated catalog) moves from `pi/` to `workflow/`. A new
`workflow/cli.ts` exposes it as a JSON command. The Pi extension imports the core directly; the Claude mod runs the CLI
through Node. One tracking logic serves both hosts.

The previous Claude integration's shell hooks, Windows notification, session logs, subagent audit logs, and contributor
settings do not return. Their safety intent returns as function hooks inside one mod, active only in a recognized game
project. Nothing in the plugin depends on the desktop app.

## Components

| Path | Role |
| ------ | ------ |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Manifest and marketplace; version equals `package.json` |
| `hooks/hooks.json`, `hooks/gamedev.tsx`, `types/index.d.ts` | The mod: function hooks, pane, status line, tool, command |
| `workflow/` | Host-neutral progress core, catalog JSON, and `cli.ts` |
| `pi/extension.ts`, `pi/panel.ts`, `pi/skills/` | Pi host, importing `../workflow/` |
| `docs/claude-code.md` | Claude Code host guide |
| `bin/` | Shared stage reporter; Claude Code adds it to the Bash PATH |

## The mod

Project detection uses the same markers as `bin/gamedev-is-project`, checked at the session root. Outside a game project
the mod registers nothing visible and its hooks pass every event through.

Status reads run `node --experimental-strip-types <plugin>/workflow/cli.ts` with the game repository as working
directory. Writes use the same command with the update as JSON on stdin and the actor `agent:<session>` or
`user:<session>`. The CLI never approves on an agent actor; the core already refuses it.

The mod provides:

- A status line under the prompt: phase, current work, next required step, in Claude syntax.
- A pane `gamedev` listing the current phase's steps, status, and commands. `/gamedev-workflow panel` opens it. At
  session start the mod opens it unasked; the engine seats it only on wide terminals.
- The tool `workflow`, listed to the model as `mcp__gamedev__workflow`, with the Pi actions `status`, `start`, `block`,
  and `submit`, including `worktree` evidence sources.
- The command `/gamedev-workflow` with `status`, `panel`, `hide`, `show`, `history`, `approve <run> <note>`,
  `finish <step> <note>`, `handoff <run> <note>`, and `gate <note>`. The note is the rest of the arguments and is
  required. Confirmation uses the engine's question dialog. The mod rereads status before and after confirmation, as Pi
  does, and refuses when the revision changed.

Hooks inside the mod:

- `prompt.submit` adds hidden context: the workflow summary and the tracking instructions Pi injects before each turn,
  plus a reminder to read `production/session-state/active.md` when present.
- `prompt.context` adds the project's root `AGENTS.md` to the instruction files when no loaded file already imports it.
  `tool.call` on file tools adds nested `AGENTS.md` guides above the touched path, once each per session.
- `classic.PreCompact` appends the current `active.md` to the conversation so the summarizer sees it; the per-prompt
  reminder to reread the file remains the safety net.
- `tool.call` on `Bash` matching `git commit` checks the files the commit will record, including tracked changes when
  `-a` stages them: required sections in `design/gdd/*.md`, JSON validity under `assets/data/`, hardcoded tunables under
  `src/gameplay/`, and unowned TODO markers under `src/`. Invalid JSON denies the call; everything else is a note the
  model reads.
- `tool.call` on `Bash` matching `git push` to `main`, `master`, or `develop` adds a reminder note. It never denies; the
  user's own branch policy decides.
- `tool.call` on `Write` and `Edit` under `assets/` checks lowercase underscore names and JSON validity after the write
  and reports as notes.
- `tool.call` on edit, shell, agent, and workflow tools refreshes the status after the call; `turn.complete` refreshes
  too. Refreshes are coalesced.

## Error handling

A missing or old Node is reported once on the status line and in the tool result; skills still work. CLI failures return
the core's message unchanged. The mod never writes `production/workflow-state.json` itself and never resets state. A
hook that fails is skipped by the engine; the mod's `.catch` handlers keep the pane and status line from going stale
with a visible error line.

## Gates and release

- Python: manifests agree with `package.json`; shared files contain no host syntax; no shell hooks or `CLAUDE.md`
  templates exist.
- npm: core and CLI tests move with the code; Pi checks are unchanged.
- Claude: `claude plugin validate --strict` on both manifests and `claude plugin test` on an isolated copy of the plugin
  files (the runner picks up every test below a directory, including Pi's Node tests) run in `just gate` when the CLI is
  on PATH and in CI after installing `@anthropic-ai/claude-code`.
- Release: bump to 0.5.0 in `package.json`, `package-lock.json`, and both manifests. Tag with `claude plugin tag`.

## Out of scope

Scaffolds stay host-neutral; no `CLAUDE.md` shim is generated. Agent Teams, MCP servers, output styles, and evals are
not shipped. The always-on prompt cost of 125 descriptions is measured and recorded, not reduced, in this change.

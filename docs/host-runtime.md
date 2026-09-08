# Running gamedev in Pi, Claude Code, and Codex

Read this guide before following a skill or agent role. It maps the shared workflows to the current host. Host and user
instructions take precedence, including authorization already given in the conversation. Identify the host by its
runtime and tools, not its model: Pi can use Claude or Codex models.

## Paths and project instructions

Resolve framework docs, templates, scripts, and roles from the installed package, never from a guessed cache path. From
a shared `skills/<name>/SKILL.md`, the package root is `../..`; from `agents/<name>.md`, it is `..`. Pi entry points
link to the shared workflow: resolve that workflow's paths from the shared file, not the entry point. Run game commands
in the user's game repository. Do not edit the installed package to configure a game.

The project guide is `AGENTS.md`. Claude Code reads it through `@AGENTS.md` in `CLAUDE.md`. Pi and Codex read AGENTS.md
directly, without expanding Claude imports. Read applicable nested guides before editing their directories; Pi loads
guides along its working-directory ancestry, not every descendant guide. When an older project has a full guide only in
CLAUDE.md, read it too. Propose a reviewed merge into AGENTS.md before replacing anything.

Engine settings remain in `.claude/docs/technical-preferences.md` for compatibility. The rules in `.claude/rules/` also
hold shared instructions, not Claude-only data.

## Host entry points

| Host | Skill invocation | Specialist roles | Automation |
| ------ | ------------------ | ------------------ | ------------ |
| Pi | `/skill:gamedev-start` | Read role guides; delegate through an available extension | Progress extension plus explicit checks |
| Claude Code | `/gamedev:start` | Registered `gamedev:<role>` subagents | `hooks/claude-hooks.json` |
| Codex | `$gamedev:start` or its `/skills` picker | Read role guides; use available delegation tools | Explicit checks below |

Shared prose identifies skills as `gamedev:<name>`. Translate both that form and legacy `/gamedev:<name>` examples to
the current host's invocation, including commands in suggested next steps. In Pi, use `/skill:gamedev-<name>`, not
`/gamedev:<name>`, `$gamedev:<name>`, or a bare `/skill:<name>`.

See [Pi setup](pi.md), [Claude Code setup](claude-code.md), and [Codex setup](codex.md).

## Tool and metadata mapping in Pi and Codex

Claude's frontmatter fields do not configure Pi or Codex. Pi entry points expose only names and descriptions; shared
files retain Claude metadata for its users.

- Treat `argument-hint` as usage guidance. `$ARGUMENTS` means the invocation text; `$ARGUMENTS[0]` means its first
  argument. Parse it yourself. Pi appends arguments as `User: ...`; it does not interpolate these placeholders in skill
  files.
- `model`, `tools`, `allowed-tools`, `context`, `user-invocable`, `permissionMode`, `maxTurns`, and `memory` do not
  select models, grant permissions, create sessions, or enable persistence here. Use only tools and permissions actually
  available.
- If a skill declares `agent`, read `agents/<role>.md` before doing its work. If it declares `isolation: worktree`,
  arrange isolation under the project's Git policy before editing. Do not assume the host created a worktree.
- `Read`, `Glob`, and `Grep` mean local file reading and search. `Write` and `Edit` mean the host's editing tools;
  `Bash` means its shell tool. Pi's default tools are `read`, `write`, `edit`, and `bash`; use shell search if no search
  tool exists.
- `WebSearch` and `WebFetch` require available web tools or an approved CLI. `Skill` means reading and following the
  named shared SKILL.md when no invocation tool exists. Do not invent a tool call because a workflow names one.
- `AskUserQuestion` means an available question tool or a concise question in chat. Wait before dependent actions. Do
  not request permission again for an already authorized edit. Creative decisions remain with the user.
- `TodoWrite` and task-panel instructions mean an available progress tool or a short checklist in chat. In Pi, also
  record catalog steps with `gamedev_workflow` as described below. None of these instructions authorizes new tracker
  issues.
- Claude `/clear` means a fresh session; use `/new` in Pi. Pi supports `/compact` and `/settings`; do not assume Claude
  `/config` or `/plugin` commands exist.

## Delegation

The 53 files in `agents/` are role guides in Pi and Codex, not registered custom agent types. Pi core has no subagent
runner. Do not assume an `agents/` folder, `pi.agents` manifest field, or Claude `subagent_type` registers one.

For a request to delegate to `gamedev:<role>`, prefer an installed subagent runner when available and authorized. Read
the role's body and pass it, relevant project guidance, the task, input files, allowed edit scope, and expected evidence
to the runner. This applies to team skills, director gates, and specialist delegation. Do not choose sequential passes
merely because Pi core lacks subagents.

In Pi, inspect the available `subagent` tool's schema. If it supports configless calls with `task` and optional `cwd`,
include the role instructions in `task` and set `cwd` to the game repository. Omit `agent` unless discovery confirms
that the runner registered that exact name. Use `tasks` for independent parallel work only when supported; collect every
result before dependent work. See [Pi delegation](pi.md#subagents) for an example. Other extensions may expose different
interfaces; follow the installed tool's schema rather than guessing.

Do not pass Claude model IDs or assume this package installed a runner or registered its role files. Models,
permissions, and tool access remain subject to the user's extension configuration. A role prompt is not a security
sandbox.

Without delegation, perform role passes sequentially and label them as such. Resolve dependencies before each pass and
preserve domain boundaries. A role pass is self-review, not an independent reviewer. When independence or a fresh
context is required, report it as unavailable until a separate review runs. Keep the workflow's `solo`, `lean`, or
`full` review requirements; do not silently weaken them because a host lacks delegation.

## Pi workflow progress

When `gamedev_workflow` is available, read status, then start the matching catalog step before doing its work. Supply
the current revision, a short note, and a subject for repeatable steps. Submit the subject's evidence files and
verification summary afterwards; block the run when required work cannot proceed. Warn about earlier incomplete required
steps rather than silently skipping them.

Only the coordinating session records progress. Tell subagents to return evidence, not edit
`production/workflow-state.json`. Never turn their completion prose into an approval. The user approves submitted runs
and confirms repeatable scope through `/gamedev-workflow`; do not invoke those commands on the user's behalf or write
the state file directly. Missing tracking tools require an explicit checklist, not a fabricated saved state. See
[Pi tracking and UI](pi.md#workflow-tracking).

## Explicit checks

The Pi extension listens to session and tool events for progress display. It does not port Claude's validation,
notification, or audit hooks. Codex has no lifecycle hooks registered by this package. Follow the checks below in both
hosts.

At the start of a game task, read `production/session-state/active.md` when present, then the relevant design,
architecture, engine, and rule files. Before editing, read applicable `.claude/rules/*.md` files and their `paths`
patterns. Pi and Codex do not automatically apply Claude rule files.

For stage reporting, run `bash "<resolved-package-root>/bin/gamedev-stage"` in the game repository. Use forward slashes
in Bash paths on Windows. No `CLAUDE_PLUGIN_ROOT` environment variable or PATH injection is required. This prints a
snapshot, not a live display. Pi's separate progress widget adds step tracking; it does not replace this shared
reporter. Refresh status after changing stages outside the session. Never claim you can read the terminal's context
meter; use host-provided usage data when available, otherwise say it is unavailable and save progress before a long
session continues.

Before committing or pushing, run the game's documented format, lint, build, and test checks, review design
requirements, and validate changed assets. Claude hook scripts may skip unsupported input; running them without Claude
event payloads does not verify the work. Keep a concise handoff in `production/session-state/active.md` when work
continues in another session.

## Optional integrations

Pi core has no MCP client, Backlog integration, web tools, or OpenSpec runner. Discover installed tools and CLI commands
before using them. A named MCP resource or `mcp__backlog__...` call requires an installed integration; a configured CLI
may be used according to its own help and workflow instructions. Do not fabricate MCP tools, tracker writes, external
reviews, or engine validation.

If a required integration is unavailable, name it and complete only independent work. Do not install packages, servers,
credentials, or global configuration just because a workflow mentions them. Ask before adding an integration.

## Framework maintenance skills

`gamedev:skill-test` and `gamedev:skill-improve` maintain this framework, not the game. Run them in a contributor
checkout, using its `skills/` and `qa/` directories. Do not write results or edit workflows in an installed cache.
Follow [CONTRIBUTING.md](../CONTRIBUTING.md), including Pi entry-point regeneration.

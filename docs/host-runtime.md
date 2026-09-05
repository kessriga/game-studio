# Running gamedev in Claude Code and Codex

Read this guide before following a skill or agent role. It defines how to run
the shared workflows in your current host. Host and user instructions still
take precedence, including authorization already given in the conversation.

## Paths and project instructions

Resolve this file, framework docs, templates, scripts, and agent roles from the
installed plugin, never from a guessed cache path. From a skill directory the
plugin root is `../..`; from an agent file it is `..`. Run project commands with
the user's game repository as the working directory. Do not edit the plugin
cache to configure a game.

The project guide is `AGENTS.md`. Claude Code reads it through `@AGENTS.md` in
`CLAUDE.md`. When an older project has a full guide only in `CLAUDE.md`, read that
too; propose merging its guidance into `AGENTS.md` before replacing anything.
When a workflow says to update the Technology Stack in `CLAUDE.md`, update the
shared guide if the Claude file imports it. Engine settings remain in
`.claude/docs/technical-preferences.md` for compatibility with existing projects.
This path holds shared data even when Codex runs the workflow.

## Claude Code

Use `/gamedev:<skill>` and the registered `gamedev:<agent>` subagents. Claude
frontmatter controls its tools and model choices. The Claude plugin manifest
explicitly loads `hooks/claude-hooks.json`.

## Codex

- Select a gamedev skill from `/skills`, or mention the skill with `$` using the
  name shown by Codex. For ambiguous names such as `start`, select the entry
  belonging to gamedev. Natural language also works: “Use gamedev's start skill.”
  Translate `/gamedev:<skill>` references into this host's skill picker or a
  natural-language request; do not tell users to run Claude slash commands here.
- Treat `argument-hint` as usage guidance. `$ARGUMENTS` means the text after the
  invocation; `[0]` means its first argument. Parse that text yourself. These are
  not environment variables or commands to execute.
- Claude `model`, `allowed-tools`, `context`, and `user-invocable` fields are not
  Codex configuration. Use the host's available tools and configured model.
  Never request Claude model IDs in Codex or infer permissions from frontmatter.
- If a skill declares `agent`, read that role from the plugin's `agents/`
  directory before following the workflow; Codex does not select it automatically.
  If it declares `isolation: worktree`, arrange an isolated Git worktree before
  editing, following the project's branch policy. Do not assume the host created
  one or silently edit the shared checkout instead.
- `Read`, `Glob`, and `Grep` mean reading or searching local files;
  `Write`/`Edit` mean the host's file-editing tools; `Bash` means its shell tool.
  `WebSearch`/`WebFetch` mean available web tools. `Skill` means reading and
  following the named skill's `SKILL.md` if no invocation tool exists.
- `AskUserQuestion` means the available user-input tool, or a concise question
  in chat if that tool is unavailable in the current mode. Wait for answers
  before dependent actions. A request for an already authorized edit does not
  require another permission question. Keep creative decisions with the user.
- `TodoWrite` and task-panel tools mean the host's progress tools when available;
  otherwise keep a short checklist. Do not create tracker issues as a substitute.

### Delegation

The 53 files in `agents/` are role instructions in Codex, not registered custom
agent types. For a delegation to `gamedev:<role>`, read `agents/<role>.md` from
the plugin and pass its body, relevant project guidance, task, input files,
allowed edit scope, and expected evidence to an available Codex subagent.
Use the host's actual spawn/wait/message tools; do not pass `subagent_type` or
Claude model IDs to them. A role's Claude frontmatter is descriptive only here.

Delegate only when host policy and the user's authorization allow it. Otherwise
perform each role's work sequentially in the main session, preserving review
boundaries. Label these as role passes, and never claim an independent reviewer
ran. Resolve dependencies before starting the next role. If independent review
is a required acceptance check, report it as unavailable instead of substituting
self-review. Keep review modes (`solo`, `lean`, `full`) as the workflow defines.

### Explicit checks

This release does not register Codex lifecycle hooks. Claude hook payloads,
notifications, and session logs are not a Codex automation contract.

At the start of a game task, read `production/session-state/active.md` when
present and the relevant design, architecture, engine, and rule files. Before
editing, read applicable `.claude/rules/*.md` files and their `paths` patterns;
Codex does not automatically apply Claude rule files.

For stage reporting, run `bash "<resolved-plugin-root>/bin/gamedev-stage"` in the
game repository. No injected context or plugin-specific environment is needed.
Before committing or pushing, run the game's documented format, lint, build,
and test checks, review its design requirements, and validate changed assets.
The Claude hook scripts may skip unsupported input; do not treat running them
without a Claude event payload as verification. Keep a concise handoff in the
project's session-state file when work needs to continue in a later session.

### Optional integrations

Backlog.md, OpenSpec, engine tooling, and web access are separate installations.
Discover the tools actually available before calling them. If a workflow needs
an unavailable integration, name it and complete independent work. Do not claim
tracker writes, external reviews, or engine validation happened without evidence.
Do not add servers, credentials, or change the user's global configuration just
because a workflow mentions an integration.

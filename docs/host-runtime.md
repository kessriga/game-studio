# Running Game Studio workflows

Read this guide before following a skill or specialist role. Host and user instructions take precedence, including
authorization already given. The shared files describe work, not runtime configuration. Pi is the supported packaged
integration; see [Pi setup](pi.md). Other runtimes can read the Markdown, but must supply their own authorized tools. No
other host integration is shipped or verified.

## Paths and project instructions

Resolve framework docs, templates, scripts, and roles from the installed package, never a guessed cache path. From
`skills/<name>/SKILL.md`, the package root is `../..`; from `agents/<name>.md`, it is `..`. Pi entry points link to
shared workflows: resolve their paths from the shared file, not the entry point. Run game commands in the game
repository. Do not configure games by editing the installed package.

`AGENTS.md` is canonical. Read applicable nested guides before editing their directories; loading an ancestor guide does
not imply loading every descendant. Project settings live in `docs/technical-preferences.md`; explicitly read applicable
`docs/rules/*.md` files using their `paths` patterns. These patterns describe scope, not automatic runtime loading.
Before using an older layout, follow [the reviewed migration](migration-0.4.md). Do not substitute defaults for missing
neutral preferences or infer approval from preserved guides.

## Invocation and tools

Shared identifiers are `gamedev:<name>`. Pi invokes skills with `/skill:gamedev-<name>`. Without an invocation facility,
read the named `skills/<name>/SKILL.md` and follow its workflow. Skill and role frontmatter contains only `name` and
`description`; arguments and role routing are in the body. Invocation arguments mean the user's supplied text. Parse
positional arguments and flags explicitly; Pi appends arguments to the prompt rather than interpolating placeholders.

Use only available tools and authorized permissions. File-reading, search, editing, shell, web, user-input, and progress
instructions describe capabilities, not literal API names. Adapt examples to the actual schema. If a workflow groups
questions, preserve the questions and choices, using separate chat prompts when forms are unavailable. Wait for
dependent decisions; an already authorized concrete edit does not need repeated permission. A progress checklist does
not authorize new tracker issues. Session reset and compaction use the host's controls; Pi provides `/new` and
`/compact`. Never claim access to a terminal context meter. Use runtime usage data when exposed, otherwise say it is
unavailable and save a checkpoint before long work continues.

## Delegation

The 53 files in `agents/` are role guides, not registered agent types. Pi core has no subagent runner. When available
and authorized, use the installed runner: pass the role body, relevant project guidance, task, input files, edit scope,
and required evidence through its actual schema. Role labels in shared examples are routing descriptions, not tool
parameters. Do not assume this package registers names, selects models, creates worktrees, persists agent memory, or
grants tool access.

In Pi, inspect the `subagent` schema. If configless `task` and `cwd` calls are supported, include the role text in
`task` and set `cwd` to the game repository. Omit `agent` unless discovery confirms that exact registered name. Use
parallel tasks only for independent work and only when supported; collect all results before dependent work. See
[Pi delegation](pi.md#subagents).

Without delegation, perform labeled sequential role passes. They are self-review, not independent review. If
independence or fresh context is required, report it unavailable until a separate review runs. Preserve `solo`, `lean`,
and `full` requirements; do not silently weaken gates. Role prompts are not security sandboxes. Arrange required
worktree isolation under the project's Git policy before editing; never assume the runtime created it.

## Pi workflow progress

When `gamedev_workflow` is available, read status and start the matching catalog step before work. Supply the current
revision, a short note, and a subject for repeatable steps. Submit evidence files and a verification summary afterwards;
block the run when required work cannot proceed. Warn about earlier incomplete required steps rather than silently
skipping them.

Only the coordinator records progress. Subagents return evidence and must not edit `production/workflow-state.json`.
Completion prose is not approval. The user approves submitted runs and confirms repeatable scope through
`/gamedev-workflow`; never issue approvals on their behalf or write the state file directly. Missing tracking tools
require an explicit checklist, not fabricated saved state. See [Pi tracking and UI](pi.md#workflow-tracking).

## Explicit checks

There are no bundled validation, notification, compaction, or audit hooks. The Pi extension tracks progress, not
automatic validation. These responsibilities remain explicit:

- At task start and after compaction, read `production/session-state/active.md` when present, relevant design,
  architecture, preferences, engine references, rules, and nested guides. Check branch and recent changes before
  editing; identify missing design prerequisites when code already exists.
- For a stage snapshot, run `bash "<resolved-package-root>/bin/gamedev-stage"` in the game repository. It uses the
  current directory, not inherited host variables or PATH injection. Refresh after stage changes. The Pi widget is
  separate from this shared reporter.
- Before committing or pushing, obtain authorization, inspect the branch and protected-branch policy, and run the game's
  documented format, lint, build, and test commands. Check design traceability, hardcoded tunables, unfinished-work
  conventions, and document completeness. Validate changed assets for naming, schemas, JSON validity, budgets, and
  engine import behavior where applicable. Report unsupported checks; a successful command exit without validation is
  not proof.
- Save a concise handoff in `production/session-state/active.md` before compaction or session end when work continues
  elsewhere. Record task progress, decisions, files, checks, blockers, and delegation results explicitly. Do not claim
  automatic archives, notifications, or audit logs.

## Optional integrations

Pi core has no MCP client, Backlog integration, web tools, or OpenSpec runner. Discover installed tools and CLI commands
before using them. A named Backlog operation requires an available integration; a configured CLI may be used according
to its own help. Never fabricate tracker updates, external reviews, engine checks, or saved evidence. If a required
integration is missing, name it and complete only independent work. Do not install packages, credentials, or global
configuration without consent.

## Framework maintenance skills

`gamedev:skill-test` and `gamedev:skill-improve` maintain this framework, not the game. Run them in a contributor
checkout using `skills/` and `qa/`, not in an installed cache. Follow [CONTRIBUTING.md](../CONTRIBUTING.md), including
generated resource checks.

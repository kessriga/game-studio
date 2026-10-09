# Claude Code setup

Game Studio installs in Claude Code as the plugin `gamedev` from the marketplace `game-studio`. It provides the 72
skills as `/gamedev:<name>`, the 53 role guides as `gamedev:<role>` subagent types, and a mod that tracks workflow
progress. Pi remains the other supported host; see [Pi setup](pi.md).

## Install

Inside Claude Code:

```text
/plugin marketplace add kessriga/game-studio
/plugin install gamedev@game-studio
```

Open a new session at the root of a **separate game repository** and run `/gamedev:start`. From a contributor checkout,
load the plugin for one session instead:

```sh
claude --plugin-dir /absolute/path/to/game-studio
```

Node 22.17 or newer must be on PATH for workflow tracking. Git, Python 3, and Bash are needed for scaffolding and the
shared stage reporter; the plugin's `bin/` directory joins the Bash tool's PATH, so `gamedev-stage` runs by name.

## Skills and roles

Shared prose names skills as `gamedev:<name>`; type them as `/gamedev:<name>`, with arguments after the name:

```text
/gamedev:start
/gamedev:status
/gamedev:brainstorm cozy farming
```

Role guides register as subagent types named `gamedev:<role>`, for example `gamedev:qa-lead`. Delegate with the Agent
tool: pass the task, inputs, allowed edits, and required evidence. Role frontmatter carries only a name and a
description; tools, models, and permissions come from your Claude Code settings.

The names and descriptions of all 125 components stay in the system prompt. Measured with `claude plugin details`, they
add about 10,800 tokens to every session. Disable the plugin in projects that are not games.

## Workflow tracking

The mod reads progress from `production/workflow-state.json` through the shared core. It is active only in a recognized
game project: one with `docs/technical-preferences.md`, `design/registry/entities.yaml`, `production/stage.txt`, or
`design/gdd/`. Elsewhere it registers nothing and passes every event through.

The model records progress with the tool `mcp__gamedev__workflow`, which the shared workflows call `gamedev_workflow`:

1. `status` reads the phase, steps, runs, and revision.
2. `start` begins a catalog step before work. Repeatable steps need a `subject`.
3. `block` records a missing requirement.
4. `submit` records evidence paths and a note. A `worktree` source works as in [Pi](pi.md#evidence-from-a-worktree).

Every update needs the revision from the last status. The tool cannot approve work. You approve with the command, typed
at the prompt; a model-run approval is refused before any dialog:

```text
/gamedev-workflow
/gamedev-workflow approve r1 Checked the concept and the design review findings
/gamedev-workflow finish asset-spec All twelve assets in the manifest are specified
/gamedev-workflow handoff r1 Merged the reviewed worktree into main
/gamedev-workflow gate Jam build; the art bible is deferred
/gamedev-workflow history
```

The note is the rest of the line and is required. The command shows the run, its source, and its evidence, then asks you
to confirm. The core rechecks the recorded hashes and the revision before writing; a change during the dialog requires a
fresh decision. `gate` records a phase decision without changing the stage; use `/gamedev:gate-check` for the review and
the advancement.

### Status line and pane

A status line under the prompt shows the phase, the current work, and the next required step. `/gamedev-workflow hide`
and `show` control it for the session. The `Game Studio` pane lists the current phase's steps with their status and
commands. `/gamedev-workflow panel` opens it; at session start the mod opens it only on terminals wide enough to dock it
beside the transcript. Both refresh after edits, shell commands, subagent runs, and workflow updates.

## Hooks

The mod's hooks run only in a recognized game project. None of them writes project files or sends notifications.

- Each prompt carries the workflow summary and the tracking rules, the same text Pi injects before a turn.
- The project's root `AGENTS.md` joins the instruction files when no loaded `CLAUDE.md` imports it, so scaffolds stay
  host-neutral. A nested `AGENTS.md` is shown once when a file under it is read or edited. A `CLAUDE.md` containing
  `@AGENTS.md` still works and is left alone.
- Before compaction, `production/session-state/active.md` is appended to the conversation so the summarizer sees it, and
  the next prompt reminds the model to read the file again. Save the handoff explicitly; the mod does not write it.
- A `git commit` checks the files it will record, including tracked changes when `-a` stages them: required sections in
  `design/gdd/*.md`, JSON validity under `assets/data/`, hardcoded tunables under `src/gameplay/`, and `TODO` markers
  without an owner under `src/`. Invalid JSON denies the commit. Everything else reaches the model as a note on the
  command's result. A commit that names paths directly is checked by its index only.
- A `git push` to `main`, `master`, or `develop` adds a reminder to run the checks. It never denies; your branch policy
  decides.
- A write or edit under `assets/` checks the name (lowercase and underscores) and, under `assets/data/`, JSON validity.
  Findings reach the model as notes.

## Session controls

Save a checkpoint in `production/session-state/active.md` before `/clear` or `/compact`. After compaction, the next
prompt's context reminds the model to read it. The [context guide](context-management.md) defines what to preserve.

## Updates and releases

After a release, update the marketplace and the plugin, then restart Claude Code:

```sh
claude plugin marketplace update game-studio
claude plugin update gamedev@game-studio
```

Claude Code compares the declared plugin version, so a merge without a version bump leaves users on the older copy.
Contributors bump `package.json`, `package-lock.json`, and both manifests together and tag with
`claude plugin tag . --dry-run`, then `claude plugin tag . --push` once publishing is authorized. See
[CONTRIBUTING.md](../CONTRIBUTING.md#releasing).

## Verify a checkout

`just gate` validates both manifests with `claude plugin validate --strict` and runs the mod's tests with
`claude plugin test` from an isolated copy of the plugin files. Both steps are skipped when the `claude` CLI is not on
PATH. For a type check of the mod, run `/plugin-types .claude/types` inside a Claude Code session in the checkout, then
`npx tsc -p tsconfig.hooks.json`. The declaration file is specific to the installed Claude Code version and is not
committed. See [STATUS.md](../STATUS.md) for actual results.

## Upstream references

- [Claude Code plugins](https://code.claude.com/docs/en/plugins)
- [Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)
- [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)
- [Measure plugin cost](https://code.claude.com/docs/en/plugins/measure)

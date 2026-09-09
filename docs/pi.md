# Pi setup

Game Studio provides 72 namespaced skills, 53 shared role guides, and a workflow progress extension. It uses your
installed subagent runner; it does not install another one or change other extensions' settings.

## Install

Once the Pi release reaches the repository's default branch:

```sh
pi install git:github.com/kessriga/game-studio
```

Before release, use a contributor checkout:

```sh
pi install /absolute/path/to/game-studio
```

Installation updates Pi's user settings. Add `-l` for a project-local install, or try the checkout for one session
without saving settings:

```sh
pi -e /absolute/path/to/game-studio
```

Start Pi at the root of a **separate game repository**, then run:

```text
/skill:gamedev-start
/skill:gamedev-status
/skill:gamedev-brainstorm cozy farming
```

Use `/reload` after editing a local package. Use `pi update --extensions` to update unpinned installed packages. A local
install uses that checkout; a Git install uses Pi's managed clone. Neither turns the package repository into a game.

## Skills and names

Pi does not add a package namespace to skill names. Names such as `start`, `code-review`, and `hotfix` can collide with
other packages. Game Studio loads small entry points named `gamedev-<skill>` from `pi/skills/`. Each links to its shared
`skills/<skill>/SKILL.md`; there is only one workflow body to maintain. Do not add the shared `skills/` folder
separately to Pi settings.

Translate shared `gamedev:<skill>` and `/skill:gamedev-<skill>` references to `/skill:gamedev-<skill>`. Arguments are
user text, not shell variables. Read [the host guide](host-runtime.md) before following a workflow, and resolve its
relative paths from the shared file, not the generated entry point.

## Workflow tracking

The extension reads phases and steps from a generated copy of [the workflow catalog](workflow-catalog.yaml).
`production/stage.txt` remains the saved phase. Tracking starts only when that file names a known phase; installing the
package in an unrelated directory does not create progress files.

The coordinating agent uses `gamedev_workflow` to:

1. Read `status` and its revision.
2. `start` a catalog step before work. Repeatable steps also need a subject: use a system name, screen name, epic, or
   story ID.
3. `block` the run when a requirement or integration is missing.
4. `submit` the run with an evidence summary and checkout-relative file paths. For work in a registered worktree,
   include `worktree` as described below. A blocked run can submit; no new run or resume command is needed.

The agent cannot approve a run through this tool. Use the user command after checking the result:

```text
/gamedev-workflow
/gamedev-workflow approve r1
/gamedev-workflow handoff r1
/gamedev-workflow finish implement
/gamedev-workflow gate
/gamedev-workflow history
```

`approve` confirms one submitted run. `finish` confirms that **all intended subjects** for a repeatable step are
complete, not just those already recorded. Check the systems index or Backlog board before confirming scope. New work
reopens that scope. Backlog remains the authority for story status; the progress file is not a second task board.

`gate` records a phase decision and any unresolved required steps. It asks for an explicit override reason when needed
and rejects requirements that change during confirmation. It does **not** change the stage. Use `gamedev:gate-check` for
the full phase review and user-approved advancement. Gates remain advisory; no extension silently advances a phase or
prevents an informed user override.

### Evidence from a worktree

The coordinator keeps `production/workflow-state.json` and reads its own `production/stage.txt`. Submission can name a
separate source checkout without moving either file or changing the phase:

```json
{
  "action": "submit",
  "revision": 2,
  "run": "r1",
  "worktree": ".worktrees/concept review",
  "evidence": ["design/gdd/game-concept.md"],
  "note": "Concept ready for user review."
}
```

`worktree` must name the root of a registered Git worktree in the **same common repository**. It must be relative to and
inside the coordinator root. Absolute paths, sibling checkouts, arbitrary subfolders, unrelated clones, and symlinked
source paths are refused. Use a nested worktree such as `.worktrees/concept review`; spaces are supported. This
restriction keeps the existing project path protections. Git must be on PATH. Inherited `GIT_*` variables do not control
validation.

All evidence paths and catalog file patterns resolve in that source alone. Missing or stale coordinator files neither
satisfy nor contaminate a worktree submission. Omitting `worktree` on a later submission retains the run's source.
Before approval, an explicit new `worktree` can switch the source and capture new evidence. After approval, start a new
run to revise the work. Source-less records keep their coordinator-relative behavior, including non-Git projects.

Approval shows the source checkout. The extension checks its saved identity and submitted hashes before the dialog,
after confirmation, after the verification note, and under the state lock. A progress update during either prompt
requires a fresh decision. Status reloads use the same source; worktree approvals do not claim that coordinator files
are approved. Removed, replaced, or symlinked sources become stale, even if the coordinator has identical files. There
is no automatic fallback. Checkout identity is local: moving or recreating a checkout requires a fresh review, not an
edit to saved fingerprints.

### Handoff after merging

After merging the reviewed files into the coordinator checkout, use:

```text
/gamedev-workflow handoff r1
```

This user-only action switches an approved worktree run's effective reads to the coordinator. It copies no files and
changes no stage. The canonical files must match **every original reviewed hash** and the run's catalog requirements.
The extension checks them before and after both prompts, then again under the state lock. Different content needs a new
run and review; handoff never rewrites hashes to make a merge pass.

Handoff can use persisted reviewed evidence after the source worktree has been removed. It still requires the original
common Git repository. The original source identity and evidence remain in the run, alongside the handoff's coordinator
identity, user, time, and note. History records the action. Later edits to canonical evidence make the run stale.

Handoff reopens repeatable scope. It transfers only the run approval, **not an aggregate scope approval**. Use `finish`
again to review the current shared manifests and all intended subjects. Mixed-source scope checks qualify evidence by
checkout: each copy needs coverage, differing copies of the same path cannot close scope, and duplicate paths count only
once toward catalog minimums. Aggregate confirmation fingerprints the manifests in every effective source. A coordinator
manifest cannot stand in for an unreviewed worktree manifest. See the
[source and handoff decision](decisions/worktree-evidence.md).

### Evidence and saved state

Records live in `production/workflow-state.json`. Keep this project-owned file with the game's other production records
if progress should be shared. It holds runs, file fingerprints, scope confirmations, revisions, and decision history.

File presence, submitted evidence, and user approval are different states. The extension checks catalog file patterns
and records SHA-256 fingerprints; it does not judge document quality or execute the game's tests. The user must inspect
reported test results and required independent reviews. A subagent saying “done” is not proof, and its result never
marks a run approved.

For repeatable steps, submit the files for that subject rather than every file in the phase. Whole-step minimum counts
and artifact coverage are checked when confirming scope. Create Stories checks `production/epics/*/story-*.md`, not epic
specifications or the shared epic index.

Catalog entries marked `aggregate`, such as the asset manifest, are fingerprinted before the scope confirmation prompts.
Changes during confirmation or the verification-note prompt require a fresh review. Submit individual asset specs for
individual runs; changing the shared index reopens scope review without invalidating an unchanged asset spec.

Each run accepts at most 50 files, each no larger than 2 MiB; use a concise evidence report for large logs, binaries, or
external reviews. Steps without a catalog file check can use a manual verification note. Any file explicitly cited by
several runs in the same checkout remains shared evidence: changing it invalidates those runs. Changed or removed
evidence requires a new review. Reopen approved work as a new run; prior history remains available.

Writes use an exclusive lock, revision check, synced temporary file, and atomic replacement. A stale caller must reread
status. Invalid JSON is preserved, not reset. Growth beyond 10 MiB is refused before replacing readable state. Agree an
archival plan rather than deleting history. After a crash, inspect `production/workflow-state.json.lock` and confirm no
writer is active before removing the abandoned lock. This is a cooperative workflow record, not a tamper-proof audit log
or protection against arbitrary shell edits.

## Progress display

A compact widget shows the saved phase, previous approved step, current work, and next required step. Pending current
and next steps show their Pi skill command before the title, so the command stays visible when space is limited. For
example, Game Concept Document shows `/skill:gamedev-brainstorm`. Steps without a catalog command keep their title.

The widget refreshes on session start, agent turns, relevant tool results, and `/gamedev-workflow`. It does not
continuously watch external file edits. Saved runs resume across sessions without inventing completion from files.

```text
/gamedev-workflow panel
/gamedev-workflow hide
/gamedev-workflow show
```

`panel` toggles a right-side view of the current phase's steps, status, and available Pi skill commands. It does not
take keyboard focus. It waits while another overlay is present and hides below 110 columns or 22 rows. Long lists are
shortened; the status command shows all current-phase steps, and `history` shows the last 20 decisions. `hide` and
`show` control the compact widget. Display preferences are session-local.

The panel is an overlay, **not a reserved sidebar column**: it can cover transcript text. It owns only its own handle
and removes it on session teardown or reload. It does not replace the editor or footer. It requires Pi's TUI and safe
overlay ownership checks; other modes or older renderers use the compact text display where supported. No live terminal
context meter is read or fabricated.

## Subagents

For specialist work, team workflows, and reviews, use the subagent extension already available in the session. The
package does not register `agents/*.md` as extension-specific configurations. Read the selected role and pass its body
to the installed tool with project guidance, task, inputs, edit boundaries, and expected evidence.

For a runner with configless `task` and `cwd` parameters:

```text
subagent({
  task: "<body of agents/qa-lead.md>\n<host and project guidance>\n"
        + "Task: review this feature. Inputs: <paths>.\n"
        + "Allowed edits: none. Return findings and verification evidence.\n"
        + "Do not update workflow-state.json; the coordinator records progress.",
  cwd: "<absolute game repository>"
})
```

Supply the actual file text, not these placeholders. Omit `agent` unless the runner lists that exact registered name.
Use `tasks` only for independent work when its schema supports the array, then collect every result before proceeding.
Role guides do not configure models or permissions. Do not install a runner or change global settings without
permission. Without a runner, label same-session role passes as self-review, not independent review.

## Project guidance and integrations

`gamedev:start` adds canonical `AGENTS.md` guides and preserves existing files. Preferences live in
`docs/technical-preferences.md`, rules in `docs/rules/`; read applicable rules explicitly. Fresh scaffolds contain no
host-specific files. Before upgrading an older game, follow the [reviewed migration](migration-0.4.md), including stale
catalog evidence and approvals.

Git, Python 3, and Bash are needed for scaffolding and shared stage reporting. The extension requires Node 22.17 or
newer. Backlog.md, OpenSpec, engines, web tools, and Model Context Protocol (MCP) support are separate integrations.
Discover what is available. Report missing requirements instead of inventing checks or results.

## Verify a checkout

Install development dependencies and run both gates described in
[CONTRIBUTING.md](../CONTRIBUTING.md):

```sh
just gate
npm ci
npm run check
```

The npm gate checks formatting, types, workflow and renderer tests, native Pi resource discovery, and discovery from a
relocated npm tarball. No model, account, installation, or user settings changes are needed. `npm run check:pack` runs
the packed check alone and requires `tar` on PATH.

For native discovery alone, run `node scripts/check-pi.mjs`. Its first optional argument is an installed Pi SDK's
absolute `dist/index.js`; its second is the package root. The native check targets Pi 0.85.1. Use the documentation
shipped with your host when APIs differ. See [STATUS.md](../STATUS.md) for actual results; resource discovery does not
prove conversational or engine behavior.

## Upstream references

- [Pi packages](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md)
- [Pi skills](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)
- [Pi extensions](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi TUI](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/tui.md)

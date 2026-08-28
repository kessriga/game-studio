# Active Hooks

Hooks are configured in `.claude/settings.json` and fire automatically:

| Hook | Event | Trigger | Action |
| ---- | ----- | ------- | ------ |
| `validate-commit.sh` | PreToolUse (Bash) | `git commit` commands | Validates design doc sections, JSON data files, hardcoded values, TODO format |
| `validate-push.sh` | PreToolUse (Bash) | `git push` commands | Warns on pushes to protected branches (develop/main) |
| `validate-assets.sh` | PostToolUse (Write/Edit) | Asset file changes | Checks naming conventions and JSON validity for files in `assets/` |
| `session-start.sh` | SessionStart | Session begins | Loads sprint context, milestone, git activity; detects and previews active session state file for recovery |
| `detect-gaps.sh` | SessionStart | Session begins | Detects fresh projects (suggests /gamedev:start) and missing documentation when code/prototypes exist, suggests /gamedev:reverse-document or /gamedev:project-stage-detect |
| `pre-compact.sh` | PreCompact | Context compression | Dumps session state (active.md, modified files, WIP design docs) into conversation before compaction so it survives summarization |
| `post-compact.sh` | PostCompact | After compaction | Reminds Claude to restore session state from `active.md` checkpoint |
| `notify.sh` | Notification | Notification event | Shows Windows toast notification via PowerShell |
| `session-stop.sh` | Stop | Session ends | Summarizes accomplishments and updates session log |
| `log-agent.sh` | SubagentStart | Agent spawned | Audit trail start — logs subagent invocation with timestamp |
| `log-agent-stop.sh` | SubagentStop | Agent stops | Audit trail stop — completes subagent record |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | Skill file changes | Advises running `/gamedev:skill-test` after any `skills/` file is written or edited |

## Hooks only run inside a gamedev project

Claude Code enables a plugin **per scope**, not per project. A plugin enabled in your user
settings is enabled in *every* repository you open, so without a guard these hooks would run
in all of them — creating `production/session-logs/`, printing the Game Studios banner over
an unrelated project's session context, and applying gamedev commit and push conventions to
code that has nothing to do with a game.

Every hook that touches the project therefore begins with:

```sh
"${CLAUDE_PLUGIN_ROOT}/bin/gamedev-is-project" 2> /dev/null || exit 0
```

The `2> /dev/null` matters: if `CLAUDE_PLUGIN_ROOT` were ever unset the path resolves to
`/bin/gamedev-is-project`, and bash's "No such file or directory" would reach the user as
hook output. A missing predicate means *do nothing*, quietly.

`bin/gamedev-is-project` exits 0 when the current project carries at least one marker that a
skill or the `/gamedev:start` scaffold creates:

| Marker | Written by |
| ------ | ---------- |
| `.claude/docs/technical-preferences.md` | `/gamedev:start` Phase 0 scaffold |
| `design/registry/entities.yaml` | `/gamedev:start` Phase 0 scaffold |
| `production/stage.txt` | `/gamedev:start` Phase 3c, `/gamedev:gate-check` |
| `design/gdd/` | `/gamedev:brainstorm` and the design skills |

Nothing a *hook* writes is a marker. `production/session-logs/` and
`production/session-state/` are created by the logging and compaction hooks themselves, so
accepting either would let one stray session in a repository mint permission for every
session after it.

`notify.sh` and `validate-assets.sh` are unguarded on purpose: neither resolves the project
directory, and both already self-limit — `notify.sh` only echoes a notification message, and
`validate-assets.sh` ignores any path outside `assets/`.

**If your project is not recognised**, run `/gamedev:adopt`, or write its phase to
`production/stage.txt` by hand — that file is a marker as well as a stage override.

`bin/gamedev-stage` inherits the same verdict: outside a gamedev project it prints nothing and
exits 1, which is how a caller tells "not a game project" apart from a real project still at
the Concept stage.

Covered by `scripts/gamedev-is-project.test.sh` and `scripts/hooks-project-guard.test.sh`
(`just test`).

Hook reference documentation: `hooks-reference/`
Hook input schema documentation: `hooks-reference/hook-input-schemas.md`

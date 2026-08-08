# plugin-hooks Specification

## Purpose

The framework's shipped hooks run correctly from the plugin install location: they register through the plugin manifest, observe two-root path discipline, degrade gracefully before a project is scaffolded, and keep framework-dev-only validation on the repo side.

## Requirements

### Requirement: Hooks register via the plugin manifest
The 11 project-facing hooks (session-start, detect-gaps, validate-commit, validate-push, validate-assets, notify, pre-compact, post-compact, session-stop, log-agent, log-agent-stop) SHALL register through the plugin's `hooks/hooks.json` with the same events and matchers as the fork-era `settings.json`, and every registered command SHALL address its script as `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.sh`.

#### Scenario: SessionStart fires from the install location (AC #3, AC #7)
- **WHEN** a session starts in a project with the plugin enabled
- **THEN** `session-start.sh` and `detect-gaps.sh` execute from the plugin install directory and emit their context output

### Requirement: Two-root path discipline inside hook scripts
Hook scripts SHALL address framework files via `${CLAUDE_PLUGIN_ROOT}` and project files (`production/`, `design/`, `assets/`, `backlog/`, session logs) via `${CLAUDE_PROJECT_DIR}`; no shipped hook SHALL rely on a bare relative path resolving against the project root.

#### Scenario: Hook reads project state from the project root (AC #3)
- **WHEN** `session-start.sh` runs in a scaffolded project with `production/session-state/active.md` present
- **THEN** it reads and previews that file from the user's project regardless of the plugin's install path

### Requirement: Graceful pre-scaffold behavior
Shipped hooks SHALL exit successfully (status 0) and produce no error output when the project has not yet been scaffolded (no `production/`, `design/`, or project CLAUDE.md), and SessionStart SHALL point the user to `/gamedev:start` instead.

#### Scenario: Session in an empty project
- **WHEN** a session starts in an empty directory with the plugin enabled
- **THEN** no hook errors appear and the session-start output recommends running `/gamedev:start`

### Requirement: Skill-change validation stays repo-side
`validate-skill-change.sh` SHALL NOT ship as a plugin hook; it SHALL remain registered in the repository's own `.claude/settings.json`, re-keyed to the `skills/<name>/` path pattern of the restructured layout.

#### Scenario: Framework dev edits a skill (AC #3)
- **WHEN** a developer working in the framework repo edits `skills/<name>/SKILL.md`
- **THEN** the PostToolUse hook fires and advises running skill-test for that skill

#### Scenario: End user edits project files
- **WHEN** a user in their own project (plugin installed) writes any file
- **THEN** no skill-change validation hook fires

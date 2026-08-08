# stage-status-surfacing — stage + breadcrumb without a statusline

## ADDED Requirements

### Requirement: Shared stage-detection executable
The production-stage detection and Epic > Feature > Task breadcrumb logic of the fork-era `statusline.sh` SHALL live in a single shipped executable, `bin/gamedev-stage`, that reads `production/stage.txt`, the artifact heuristics, `technical-preferences.md`, and the `active.md` STATUS block from the current project and prints `<stage>` optionally followed by `| Epic > Feature > Task`. The ctx% and model segments SHALL NOT be replicated.

#### Scenario: Stage with breadcrumb in Production
- **WHEN** `gamedev-stage` runs in a project in Production stage whose `active.md` STATUS block names an epic, feature, and task
- **THEN** it prints the stage followed by the `Epic > Feature > Task` breadcrumb

#### Scenario: Pre-production project
- **WHEN** `gamedev-stage` runs in a project with a game concept but no ADRs or source
- **THEN** it prints the detected early stage and no breadcrumb

### Requirement: Stage surfaces at session start
The shipped SessionStart hook SHALL invoke `${CLAUDE_PLUGIN_ROOT}/bin/gamedev-stage` and include its output in the session context block (AC #8 delivery channel 1).

#### Scenario: Session start in a scaffolded project (AC #7, AC #8)
- **WHEN** a session starts in a scaffolded project with the plugin enabled
- **THEN** the session-start context includes the current stage (and breadcrumb when in Production+)

### Requirement: Stage available on demand via /gamedev:status
A `status` micro-skill (`model: haiku`, read-only) SHALL print the current stage and breadcrumb on demand by running `gamedev-stage` (available on the Bash tool PATH via the plugin's `bin/`), and SHALL be listed among the Haiku-tier skills in `coordination-rules.md`.

#### Scenario: Mid-session status check (AC #8)
- **WHEN** the user runs `/gamedev:status` after switching focus mid-session
- **THEN** the current stage and breadcrumb from the project's present state are printed, without any full project audit

### Requirement: The statusline is fully retired
The repository SHALL ship no `statusLine` configuration and no `statusline.sh`; nothing in the plugin or scaffolding SHALL modify the user's status line.

#### Scenario: User keeps their personal statusline (AC #8)
- **WHEN** a user with a personal `statusLine` in their global settings installs the plugin and scaffolds a project
- **THEN** their statusline is unchanged

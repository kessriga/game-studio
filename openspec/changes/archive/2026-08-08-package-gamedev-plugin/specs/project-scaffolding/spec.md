# project-scaffolding — /gamedev:start creates what a plugin cannot ship

## ADDED Requirements

### Requirement: First-run scaffolding via /gamedev:start
The `start` skill SHALL offer a scaffolding phase that creates the project-side content into the user's repository: project `CLAUDE.md` (from the shipped template), the `production/`–`design/`–`docs/`–`tests/` directory tree, `.claude/rules/` (all 11 rules files), `.claude/docs/technical-preferences.md` (placeholder skeleton), and the engine-reference snapshot for the engine the user selects. Scaffold sources SHALL ship in the plugin's `templates/` directory.

#### Scenario: Fresh project onboarding (AC #2)
- **WHEN** a user runs `/gamedev:start` in an empty repository and consents to scaffolding
- **THEN** project CLAUDE.md, the directory tree, the 11 rules files, and `technical-preferences.md` exist in the user's repo afterward

#### Scenario: Engine-reference selection (AC #2)
- **WHEN** the user selects an engine during onboarding
- **THEN** only that engine's reference snapshot is copied into the project's `docs/engine-reference/`

### Requirement: Rules are delivered by scaffolding
Because Claude Code plugins cannot ship `.claude/rules/` (verified against the plugins reference 2026-08-08), the rules files SHALL be delivered exclusively by the scaffolding flow, and this delivery decision SHALL be documented in the shipped framework docs.

#### Scenario: Rules present after scaffold (AC #6)
- **WHEN** scaffolding completes
- **THEN** the user's project contains `.claude/rules/` with the same 11 files the fork-era template committed, and the framework docs state that rules are scaffolded, not shipped

### Requirement: Scaffolding is consensual and idempotent
Scaffolding SHALL require explicit user consent before writing (per the collaboration protocol), SHALL never overwrite an existing file, and on re-run SHALL report already-present files instead of modifying them. It SHALL NOT write to the user's `settings.json` at any scope.

#### Scenario: Re-run on a scaffolded project
- **WHEN** `/gamedev:start` runs in a project that was already scaffolded
- **THEN** every existing file is left byte-identical and reported as present, and only missing files are offered for creation

#### Scenario: No settings intrusion
- **WHEN** scaffolding completes
- **THEN** the user's `settings.json` files are unmodified

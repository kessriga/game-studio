# plugin-packaging — the framework installs as the `gamedev` plugin

## ADDED Requirements

### Requirement: Marketplace-based installation
The repository SHALL be installable as a Claude Code plugin named `gamedev` via `/plugin marketplace add <repo>` followed by `/plugin install gamedev`, with the repo serving as its own marketplace through `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` that pass `claude plugin validate`.

#### Scenario: Fresh-project install (AC #1)
- **WHEN** a user in a fresh project adds the repo as a marketplace and installs `gamedev`
- **THEN** the plugin installs without errors and its skills and agents are listed under the `gamedev:` namespace

### Requirement: Canonical plugin layout
The repository SHALL keep all shipped components in the canonical plugin locations at the repo root — `skills/` (skills as `<name>/SKILL.md`), `agents/`, `hooks/hooks.json` plus hook scripts, `bin/`, `templates/`, and framework docs — while framework-dev-only tooling (OpenSpec commands, `validate-skill-change.sh`, dev settings, `qa/` corpus) remains outside the shipped component directories under `.claude/` or the repo root.

#### Scenario: Component discovery uses default locations
- **WHEN** the plugin is installed
- **THEN** all 71+ skills and 53 agents are discovered from `skills/` and `agents/` without any component path remapping in `plugin.json`

#### Scenario: Dev tooling does not ship as plugin components
- **WHEN** the installed plugin's skills, agents, and hooks are enumerated
- **THEN** no OpenSpec dev command, `validate-skill-change` hook, or `qa/` corpus content appears among them

### Requirement: Namespaced invocation
Skills SHALL be invocable as `/gamedev:<name>` and agents addressable as `gamedev:<name>` subagents. Skill and agent frontmatter `name` fields SHALL remain bare (unprefixed), relying on Claude Code's automatic plugin namespacing.

#### Scenario: Skill invocation under namespace (AC #1)
- **WHEN** a user runs `/gamedev:help` in a project with the plugin enabled
- **THEN** the `help` skill executes exactly as the bare `/help` did in the fork-era template

#### Scenario: No double prefix
- **WHEN** any shipped SKILL.md or agent file's frontmatter is inspected
- **THEN** its `name` field contains no `gamedev:` prefix

### Requirement: Namespaced internal cross-references
Every functional cross-reference in shipped skills, agents, hooks, and docs SHALL use the namespaced form (`/gamedev:<skill>`, `gamedev:<agent>`); references to Claude Code built-ins (`/plugin`, `/clear`, `/compact`, `/config`, …) SHALL remain bare. The rewrite SHALL be driven by the exact roster of shipped skill and agent names.

#### Scenario: No residual bare framework references (AC #4)
- **WHEN** shipped files are searched for bare invocations of any of the framework's skill or agent names in reference position
- **THEN** zero matches remain

#### Scenario: Built-ins untouched
- **WHEN** shipped files reference Claude Code built-in commands
- **THEN** those references carry no `gamedev:` prefix

### Requirement: Framework docs resolve from the plugin
Framework documentation referenced by skills SHALL ship inside the plugin and be referenced so it resolves from the plugin install location (located relative to the referencing skill's own path); per-project configuration (`technical-preferences.md`, scaffolded rules) SHALL be referenced at its project-side path.

#### Scenario: Skill reads a framework doc from the install location (AC #5)
- **WHEN** an installed skill that cites `coordination-rules.md` is invoked in a user project containing no copy of that doc
- **THEN** the skill resolves and reads the doc from the plugin install directory

#### Scenario: Project config stays project-side (AC #5)
- **WHEN** an installed skill needs `technical-preferences.md`
- **THEN** it reads it from the user's project, not from the plugin

## ADDED Requirements

### Requirement: Bevy is selectable in the engine setup flow
`/setup-engine` SHALL offer Bevy alongside Godot, Unity, and Unreal in every engine-enumeration site: the guided-mode option list, platform guidance, tradeoffs prose, per-engine CLAUDE.md Technology Stack template, naming conventions, Engine Specialists routing block, and knowledge-gap baselines (Bevy baseline ~0.16-0.17, default risk HIGH).

#### Scenario: Guided selection offers Bevy
- **WHEN** a user runs `/setup-engine` with no arguments
- **THEN** Bevy appears as a selectable engine option with the same depth of guidance (tradeoffs, platform notes) as the existing three engines

#### Scenario: Direct selection configures Bevy
- **WHEN** a user runs `/setup-engine bevy 0.19`
- **THEN** the skill writes a Bevy Technology Stack to CLAUDE.md, a Bevy Engine Specialists block and File Extension Routing table to `.claude/docs/technical-preferences.md`, and repoints the CLAUDE.md `@` import to `docs/engine-reference/bevy/VERSION.md`

### Requirement: Bevy specialist agent set exists and is routable
A Bevy agent set (`bevy-specialist`, `bevy-rust-specialist`, `bevy-render-specialist`, `bevy-ui-specialist`) SHALL exist in `.claude/agents/` with the same frontmatter shape as the existing engine agents, each containing a `## Version Awareness` section referencing `docs/engine-reference/bevy/`, and `dev-story`'s engine→specialist table SHALL route Bevy projects to them.

#### Scenario: dev-story routes a Bevy project
- **WHEN** `/dev-story` runs in a project whose configured engine is Bevy
- **THEN** implementation is delegated to the Bevy specialists per the routing table, with generic programmer agents as fallback for unlisted file types

#### Scenario: Bevy agents defer to the reference tree
- **WHEN** a Bevy agent needs an API introduced after its training data
- **THEN** its Version Awareness section directs it to consult `docs/engine-reference/bevy/` (and WebSearch as fallback) before asserting API shapes

### Requirement: Bevy engine-reference tree satisfies the contract
`docs/engine-reference/bevy/` SHALL contain `VERSION.md`, `breaking-changes.md`, `deprecated-apis.md`, `current-best-practices.md`, and the standard 8 module references (animation, audio, input, navigation, networking, physics, rendering, ui), each dated `Last verified`, pinned to the current Bevy minor, and honest about capabilities that live in third-party crates rather than Bevy itself.

#### Scenario: Reference tree passes the README contract
- **WHEN** the engine-reference README checklist is applied to `docs/engine-reference/bevy/`
- **THEN** all required files exist, modules are ≤150 lines, and every file carries a verification date

### Requirement: Bevy test scaffolding is cargo-based
The test scaffolding skills SHALL cover Bevy: `test-setup` provides a GitHub Actions cargo workflow (fmt, clippy, headless `cargo test`), `test-helpers` provides a Rust helper implementation, `smoke-check` and `soak-test` provide cargo invocations, `test-flakiness` parses cargo/nextest output, and `coding-standards.md` lists the Bevy CI command.

#### Scenario: test-setup scaffolds a Bevy project
- **WHEN** `/test-setup` runs with Bevy configured
- **THEN** it produces a cargo-based CI workflow that runs logic tests headlessly (no window or GPU required)

### Requirement: Rosters and docs list the Bevy set
Agent rosters and workflow documentation (`agent-roster.md`, `agent-coordination-map.md`, `quick-start.md`, `README.md`, `WORKFLOW-GUIDE.md`, `brainstorm` engine options, `shader-code.md` rule, statusline globs, testing-framework catalog) SHALL include the Bevy engine set, and no framework doc SHALL describe engine support as limited to three engines.

#### Scenario: Roster sweep finds Bevy everywhere engines are enumerated
- **WHEN** the repo is searched for engine-enumeration sites after implementation
- **THEN** every site listing Godot/Unity/Unreal also lists Bevy (or states an explicit N/A), and the testing-framework catalog contains specs for the four Bevy agents

### Requirement: Existing engine support is unchanged
The change SHALL be additive: configuring Godot, Unity, or Unreal via `/setup-engine` SHALL behave exactly as before, and no existing engine agent file is modified.

#### Scenario: Godot setup regression check
- **WHEN** `/setup-engine godot 4.6` is exercised after the change
- **THEN** its outputs (CLAUDE.md block, routing table, reference-tree handling) are identical to pre-change behavior

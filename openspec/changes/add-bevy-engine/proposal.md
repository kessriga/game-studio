## Why

The template supports Godot, Unity, and Unreal, but the owner's games are built with Bevy (Rust ECS engine). Bevy's ~3-month breaking-change cadence (currently 0.19, June 2026) sits well past LLM training cutoffs, so the template's engine-specialist agents and version-reference machinery are exactly what Bevy work needs — it must become a first-class fourth engine option. Tracked as Backlog TASK-1.

## What Changes

- New Bevy specialist agent set in `.claude/agents/` (4 agents: `bevy-specialist` primary for ECS/app architecture, `bevy-rust-specialist` for Rust code quality, `bevy-render-specialist` for wgpu/WGSL/rendering, `bevy-ui-specialist` for bevy_ui/UI), mirroring the existing per-engine structure and uniform frontmatter, each shipping a `## Version Awareness` section from day one.
- `/setup-engine` gains Bevy as a fourth option in every hardcoded engine site: guided-mode option list, platform rules, tradeoffs prose, per-engine CLAUDE.md template, naming conventions, Engine Specialists routing block, knowledge-gap baselines, and a Bevy appendix (Rust-only, so smaller than Godot's Appendix A).
- `dev-story`'s engine→specialist table gains a Bevy row.
- New `docs/engine-reference/bevy/` tree satisfying the engine-reference README contract: `VERSION.md`, `breaking-changes.md`, `deprecated-apis.md`, `current-best-practices.md`, and 8 module references, pinned to the current Bevy release.
- Test scaffolding skills (`test-setup`, `test-helpers`, `smoke-check`, `soak-test`, `test-flakiness`) and `coding-standards.md` gain cargo-based Bevy coverage (GitHub Actions cargo workflow, Rust test helpers, `cargo test` invocations, cargo/nextest log formats).
- Rosters and docs updated: `agent-roster.md`, `agent-coordination-map.md`, `quick-start.md`, `README.md`, `WORKFLOW-GUIDE.md`, `brainstorm` engine options, `content-audit` globs, `shader-code.md` rule, statusline source globs.
- Skill/agent testing framework (`qa/`) gains Bevy agent specs and `catalog.yaml` entries.
- Existing Godot/Unity/Unreal support is unchanged (additive change; no removals).

## Capabilities

### New Capabilities
- `bevy-engine-support`: Bevy is selectable, routable, version-referenced, and test-scaffolded as a first-class engine — covering agent set, setup flow, engine-reference tree, routing, and CI/test integration.

### Modified Capabilities

<!-- none: openspec/specs/ is empty; no existing capability specs to modify -->

## Impact

- `.claude/agents/` — 4 new files; no existing files modified.
- `.claude/skills/` — `setup-engine` (largest edit), `dev-story`, `test-setup`, `test-helpers`, `smoke-check`, `soak-test`, `test-flakiness`, `brainstorm`, `content-audit`, `localize` (RTL row).
- `.claude/docs/` — `agent-roster.md`, `agent-coordination-map.md`, `quick-start.md`, `coding-standards.md`; templates (`interaction-pattern-library.md` stays Godot-idiomatic — out of scope).
- `docs/` — new `engine-reference/bevy/` tree (~13 files); `WORKFLOW-GUIDE.md`; `README.md`.
- `.claude/rules/shader-code.md`, `.claude/statusline.sh` (add WGSL/RON globs).
- `qa/` — `catalog.yaml` + agent specs.
- No dependencies added; no hooks changed (already `*.rs`-aware).

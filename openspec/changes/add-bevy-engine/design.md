## Context

The template's engine support has a known, well-mapped shape: 15 engine agent files with uniform frontmatter (`name`, `description`, `tools`, `model: sonnet`, `maxTurns: 20`), a hub skill (`setup-engine`, 717 lines) where the engine list is hardcoded in six sites, exactly one hardcoded engine→specialist table (`dev-story` ~163-167), indirect runtime routing via the `## Engine Specialists` / `### File Extension Routing` sections of `.claude/docs/technical-preferences.md` (engine-neutral schema, "[TO BE CONFIGURED] → fall back to Primary"), and a `docs/engine-reference/<engine>/` contract (VERSION, breaking-changes, deprecated-apis, current-best-practices, 8 modules ≤150 lines each, `Last verified:` dates). Hooks and statusline already glob `*.rs`. Bevy 0.19 (June 2026) is current; training knowledge trails at ~0.16-0.17; Bevy intentionally ships breaking changes roughly every 3 months with official per-release migration guides.

Bevy differs structurally from the three shipped engines: it is a code-first Rust ECS library — no editor, no proprietary scene/prefab format (scenes exist as RON via `bevy_scene` but are not the primary authoring surface), WGSL shaders on wgpu, UI via `bevy_ui`, and plain `cargo test` for CI.

## Goals / Non-Goals

**Goals:**
- Bevy selectable and fully routable as a fourth engine with zero behavior change to the existing three.
- Bevy agents accurate at the pinned release, with the version-gap machinery active from day one (not deferred to setup time as with Godot).
- Cargo-native test scaffolding consistent with the template's testing standards.

**Non-Goals:**
- Removing or simplifying Godot/Unity/Unreal support (TASK-3/TASK-4 territory is also untouched).
- Changing the `technical-preferences.md` routing schema — its rows are generic and the fallback rule already handles inapplicable rows.
- Rewriting Godot-idiomatic templates like `interaction-pattern-library.md`.
- Populating a game project; this changes the framework only.

## Decisions

1. **Four agents, not five**: `bevy-specialist` (primary: app/plugin/schedule/ECS architecture, delegation map, orchestration), `bevy-rust-specialist` (Rust language quality: ownership, error handling, idioms — the GDScript-specialist analogue), `bevy-render-specialist` (wgpu/WGSL/materials/post-processing), `bevy-ui-specialist` (bevy_ui layout, widgets, input focus). *Alternative rejected*: mirroring the 5-per-engine count with an asset/scene specialist — Bevy has no editor-authored scene layer to own; forcing the symmetry would create an agent without a real concern. The primary absorbs assets/RON.
2. **Version Awareness ships in all four Bevy agents from the start**, rather than being injected by `setup-engine` as with Godot. Bevy has the fastest churn of the four engines; an unversioned Bevy agent is wrong within months. `setup-engine` §9 keeps its injection step for the other engines and becomes a no-op for Bevy.
3. **Pin to the Bevy minor release** (e.g. `0.19.x`) in `VERSION.md`; map "breaking changes" to the official migration guides per minor. Cargo semver replaces the editor-version model; `deprecated-apis.md` covers renamed/moved APIs across the last ~3 minors (roughly the training-gap window).
4. **Knowledge-gap baseline "Bevy: ~0.16-0.17" with default risk HIGH** in `setup-engine` §6 — unlike Godot's per-version risk table, every Bevy minor is presumed HIGH until the reference tree says otherwise.
5. **Routing table content for Bevy**: game code (`*.rs`) → `bevy-specialist`; shader files (`*.wgsl`) → `bevy-render-specialist`; UI code → `bevy-ui-specialist`; scene/asset data (`*.ron`, `assets/`) → Primary; native-extension row → "N/A (Bevy is native Rust)". The schema is untouched; inapplicable rows state N/A explicitly instead of dangling.
6. **Engine-reference content is drafted from verified sources at implementation time** (official migration guides + bevy.org docs via WebSearch, `Last verified` dated), following the README rule "only document things that differ from the model's training data". Module set mirrors the other engines' 8 (animation, audio, input, navigation, networking, physics, rendering, ui), with content honest about Bevy's ecosystem (e.g. networking/navigation live in third-party crates — the module ref says so and names the mainstream ones rather than inventing first-party APIs).
7. **CI/test scaffolding**: one GitHub Actions cargo workflow block in `test-setup` (fmt + clippy + `cargo test` headless; logic tests run with `MinimalPlugins`, no window/GPU), Rust test-helper implementation in `test-helpers`, `cargo test` invocations in `smoke-check`/`soak-test`, cargo/nextest output parsing in `test-flakiness`, `coding-standards.md` CI row.
8. **Testing-framework specs** are added under the skill/agent testing directory's engine section with `catalog.yaml` entries, using whatever the directory is named when this lands (TASK-2 may have renamed it to `qa/`).

## Risks / Trade-offs

- [Post-cutoff API hallucination in agent bodies] → Agent prose keeps API mentions minimal and defers specifics to `docs/engine-reference/bevy/`; every reference file carries `Last verified` and is written from fetched sources, not memory.
- [Docs drift: prose that says "three engines"] → Implementation includes a repo-wide sweep for three-engine phrasing (README, roster, coordination map, WORKFLOW-GUIDE, quick-start).
- [`setup-engine` keeps growing (717 lines + a fourth appendix)] → Bevy appendix is Rust-only (one language variant vs Godot's three), kept compact; no restructuring of the skill in this change.
- [Bevy 0.20 may land before this is used in anger] → The reference tree is refreshable via existing `setup-engine refresh`/`upgrade` subcommands; pinning + dated verification makes staleness visible rather than silent.

## Open Questions

- None blocking. (Whether `bevy-ui-specialist` earns long-term keep can be judged after first real use; folding it into the primary later is a deletion, not a redesign.)

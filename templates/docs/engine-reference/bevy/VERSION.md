# Bevy Engine — Version Reference

| Field | Value |
|-------|-------|
| **Engine Version** | Bevy 0.19 |
| **Release Date** | 2026-06-19 |
| **Project Pinned** | 2026-08-07 |
| **Last Docs Verified** | 2026-08-07 |
| **LLM Knowledge Cutoff** | January 2026 |

## Knowledge Gap Warning

The LLM's training data likely covers Bevy up to **~0.17**. Versions **0.18**
(Jan 2026) and **0.19** (Jun 2026) introduced large, breaking architectural
changes — **resources-as-components**, **render-graph-as-systems**, the
**Parley** text overhaul, **BSN** (Bevy Scene Notation) scenes, and the
`bevy_scene` → `bevy_world_serialization` rename. The model does NOT reliably
know these. **Always cross-reference this directory before suggesting a Bevy
API**, and prefer `deprecated-apis.md` for any type or method whose name you
are recalling from memory.

Bevy ships **breaking changes roughly every 3 months** (one minor per cycle),
each with an official migration guide. Treat every minor as potentially
API-breaking; there is no long-term-support release.

## Post-Cutoff Version Timeline

| Version | Release | Risk Level | Key Theme |
|---------|---------|------------|-----------|
| 0.17 | ~Nov 2025 | MEDIUM | Baseline of likely model knowledge; required-components maturing |
| 0.18 | Jan 2026 | HIGH | `GlobalTransform`/`LineHeight` required components, `AmbientLight` split, `RenderTarget` component, immutable entity events, `SimpleExecutor` removed |
| 0.19 | Jun 2026 | HIGH | Resources-as-components, render-graph-as-systems, Parley text (`FontSource`/`FontSize`), BSN scenes, `bevy_scene`→`bevy_world_serialization`, granular cargo features, `bevy_material` crate |

## Cargo Version Model

Bevy is a Rust library pinned in `Cargo.toml` (`bevy = "0.19"`), not an editor
install. "Upgrading the engine" means bumping the semver requirement and running
the migration guide — there is no separate editor version to track. Pin the
**minor** (`0.19`); patch releases (`0.19.x`) are non-breaking.

## Provenance

`breaking-changes.md` and `deprecated-apis.md` are derived from the official
0.17→0.18 and 0.18→0.19 migration guides. `VERSION.md`, `rendering.md`, and
`ui.md` draw on the 0.19 release notes plus those guides. The remaining module
refs (`input`, `audio`, `animation`, and the ecosystem pointers in `physics`,
`networking`, `navigation`) had their headline type/method names cross-checked
against `docs.rs/bevy` and the official examples on the pin date; treat the
prose framing as a lead and confirm exact signatures against `docs.rs/bevy/0.19`
before relying on them. Each file's `## Sources` section lists what was consulted.

## Verified Sources

- Official docs: https://bevy.org/learn/
- Migration guides index: https://bevy.org/learn/migration-guides/introduction/
- 0.18→0.19 migration: https://bevy.org/learn/migration-guides/0-18-to-0-19/
- 0.17→0.18 migration: https://bevy.org/learn/migration-guides/0-17-to-0-18/
- 0.19 release notes: https://bevy.org/news/bevy-0-19/
- API docs: https://docs.rs/bevy/0.19
- Repo + release content: https://github.com/bevyengine/bevy

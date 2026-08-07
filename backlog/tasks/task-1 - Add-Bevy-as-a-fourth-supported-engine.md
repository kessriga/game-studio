---
id: TASK-1
title: Add Bevy as a fourth supported engine
status: Done
assignee:
  - claude
created_date: '2026-08-07 12:45'
updated_date: '2026-08-07 15:30'
labels:
  - engine
  - agents
dependencies: []
references:
  - .claude/skills/setup-engine/SKILL.md
  - .claude/skills/dev-story/SKILL.md
  - .claude/docs/technical-preferences.md
  - docs/engine-reference/README.md
  - .claude/agents/godot-gdextension-specialist.md
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The template ships engine-specialist agents and setup flows for Godot, Unity, and Unreal. The owner's games use Bevy (Rust ECS engine, currently 0.19, ~3-month breaking-change cadence), so Bevy must become a first-class fourth option — the existing three engines stay for optionality.

Context for an implementer with no prior session memory: engine coupling concentrates in `.claude/skills/setup-engine/SKILL.md` (engine list hardcoded in ~6 places incl. a Godot-only Appendix A), `.claude/skills/dev-story/SKILL.md` lines ~163-167 (the only hardcoded engine→specialist routing table; all other routing is indirect via `.claude/docs/technical-preferences.md`, whose schema is engine-neutral), `CLAUDE.md` line ~23 (live `@docs/engine-reference/godot/VERSION.md` import), and 15 engine agent files in `.claude/agents/` whose frontmatter shape is uniform. Only Godot agents carry a `## Version Awareness` section — Bevy agents should ship with it built in. Hooks already glob `*.rs` and need no changes. Bevy differs structurally: code-first, no editor, no scene/prefab file format, WGSL shaders, `cargo test` for CI; `godot-gdextension-specialist.md` already contains reusable Rust conventions. A Bevy set of 3-4 agents (ECS architecture primary, Rust code quality, render/WGSL, optionally UI) mirrors the per-engine 5-agent pattern.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /setup-engine offers Bevy alongside Godot/Unity/Unreal in both guided and direct modes, including naming conventions, CLAUDE.md template, routing table, and knowledge-gap baseline for Bevy
- [x] #2 A Bevy specialist agent set exists in .claude/agents/ mirroring the existing engine sets' structure and frontmatter, each with a Version Awareness section
- [x] #3 dev-story's engine→specialist table routes Bevy projects to the new agents
- [x] #4 docs/engine-reference/bevy/ satisfies the engine-reference README contract (VERSION.md, breaking-changes.md, deprecated-apis.md, current-best-practices.md, module refs) pinned to the current Bevy release
- [x] #5 Test scaffolding skills (test-setup, test-helpers, smoke-check, soak-test, test-flakiness) cover Bevy via a cargo-based workflow
- [x] #6 File-extension routing accounts for Bevy's code-first nature (Rust sources, WGSL shaders, no scene/prefab rows left dangling)
- [x] #7 Roster and workflow docs (agent-roster.md, agent-coordination-map.md, quick-start.md, README.md, WORKFLOW-GUIDE.md) list the Bevy set
- [x] #8 The skill/agent testing framework catalog and specs gain entries for the Bevy agents
- [x] #9 Existing Godot/Unity/Unreal behavior is unchanged (spot-check /setup-engine for one existing engine)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Implementation follows the OpenSpec change `add-bevy-engine` (openspec/changes/add-bevy-engine/ — proposal.md, design.md, specs/bevy-engine-support/spec.md, tasks.md; all validated). Work order: (1) verify current Bevy release + collect migration-guide sources, (2) build docs/engine-reference/bevy/ tree, (3) write the 4 Bevy agents (bevy-specialist, bevy-rust-specialist, bevy-render-specialist, bevy-ui-specialist) with built-in Version Awareness, (4) setup-engine (6 sites + Bevy appendix) and dev-story routing, (5) cargo test scaffolding, (6) docs/roster sweep + testing-framework catalog, (7) verification incl. Godot regression spot-check. Implement in worktree task-1 on branch feat/1-add-bevy-engine.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented via OpenSpec change `add-bevy-engine` (all 29 tasks complete). 51 files changed, ~1950 insertions / 34 deletions — additive; Godot/Unity/Unreal untouched.

Key deliverables:
- docs/engine-reference/bevy/ — VERSION (pinned 0.19, Jun 2026), breaking-changes, deprecated-apis, current-best-practices, 8 module refs (46-68 lines each). Written from fetched primary sources (bevy.org 0.17→0.18 & 0.18→0.19 migration guides, 0.19 release notes), not memory.
- 4 agents (.claude/agents/bevy-{specialist,rust-specialist,render-specialist,ui-specialist}.md), uniform frontmatter, Version Awareness built in.
- setup-engine: Bevy added to all 6 enumeration sites + inline config (no appendix — single language); §9 made explicit no-op for Bevy.
- dev-story routing row; brainstorm option; cargo test scaffolding across test-setup/test-helpers/smoke-check/soak-test/test-flakiness + coding-standards.
- Docs/rosters swept; agent count 49→53; CCGS testing framework gained 4 Bevy specs + catalog entries + bevy tier.

Design decisions (see design.md): 4 agents not 5 (no editor/scene layer for a 5th to own); Version Awareness ships in the agents rather than injected at setup (Bevy's ~3mo cadence); default knowledge risk HIGH; File Extension Routing uses explicit N/A for the native-extension row.

Surprise vs original plan: Bevy 0.19 introduced BSN (Bevy Scene Notation) — so 'no scene format' was wrong; routing sends .bsn/.ron to the primary.

Status held at In Progress pending user review of the changeset and commit/merge (repo collaborative protocol: no commit without user instruction). Branch feat/1-add-bevy-engine in worktree task-1; not yet committed.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-07 15:28
---
Committed as 140f580 on feat/1-add-bevy-engine (worktree task-1), 59 files incl. the openspec change (user opted to track openspec/). Not yet pushed/PR'd — status held at In Progress pending review + merge. Advisor pass caught and fixed: (1) root CLAUDE.md CHOOSE lines + 8 more enumeration sites the first sweep missed (found via case-insensitive 'unreal' grep); (2) reference-module provenance — headline APIs for audio/input/animation + ecosystem crates re-verified via web search (all confirmed accurate; bevy_replicon URL corrected simgine/), and a Provenance note added to VERSION.md distinguishing source-backed from cross-checked files.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bevy added as a fourth supported engine (additive; Godot/Unity/Unreal unchanged). Delivered: 4 specialist agents with built-in Version Awareness; docs/engine-reference/bevy/ pinned to 0.19 (from official migration guides, headline APIs cross-checked against docs.rs); setup-engine (6 enumeration sites + inline config, §9 no-op for Bevy) and dev-story routing; brainstorm option; cargo-based test scaffolding across test-setup/test-helpers/smoke-check/soak-test/test-flakiness + coding-standards; doc/roster sweep (agent count 49→53); CCGS testing-framework specs + catalog + bevy tier. Design record: openspec/changes/add-bevy-engine/ (proposal, design, spec, tasks — all validated). Committed on feat/1-add-bevy-engine.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-7
title: Reconcile game-designer tier grouping between qa/CLAUDE.md and catalog.yaml
status: To Do
assignee: []
created_date: '2026-08-08 15:33'
labels:
  - qa
  - docs
  - consistency
dependencies: []
references:
  - qa/CLAUDE.md
  - qa/catalog.yaml
  - qa/agents/leads/game-designer.md
priority: low
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`qa/CLAUDE.md`'s "Agent tiers" section lists `game-designer` under the `creative` group (alongside writer, world-builder, economy-designer, systems-designer, prototyper), but `qa/catalog.yaml` places its spec under `leads/` (`qa/agents/leads/game-designer.md`, category `lead`). The two disagree about where game-designer sits, which is confusing when navigating the qa corpus and could misroute `/gamedev:skill-test` category runs.

This drift predates PR #10 (which pinned game-designer to Fable and touched its spec/catalog entry) — the grouping mismatch was not introduced there. Decide the single correct grouping and make the two files agree. game-designer is a department lead (it owns a domain and runs a pinned leadership model per coordination-rules.md), so `leads` is the likely correct home; confirm against how the other lead specs are grouped in qa/CLAUDE.md before settling it.

Scope is the qa framework's own bookkeeping only — no agent behavior or model tier changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 qa/CLAUDE.md and qa/catalog.yaml agree on which tier group game-designer belongs to
- [ ] #2 The chosen grouping is consistent with how coordination-rules.md classifies game-designer (department lead) and with where the other lead specs live
- [ ] #3 The game-designer spec file location matches its declared group (spec path and category are consistent)
- [ ] #4 No agent frontmatter, model tier, or behavior is changed — this is qa-index bookkeeping only
- [ ] #5 A quick scan confirms no other agent has the same qa/CLAUDE.md-vs-catalog grouping mismatch; any found are noted (not necessarily fixed) in the task summary
<!-- AC:END -->

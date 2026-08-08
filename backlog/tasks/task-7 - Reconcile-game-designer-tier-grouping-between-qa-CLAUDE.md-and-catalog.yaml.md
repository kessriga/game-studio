---
id: TASK-7
title: Reconcile game-designer tier grouping between qa/CLAUDE.md and catalog.yaml
status: Done
assignee: []
created_date: '2026-08-08 15:33'
updated_date: '2026-08-08 21:57'
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
- [x] #1 qa/CLAUDE.md and qa/catalog.yaml agree on which tier group game-designer belongs to
- [x] #2 The chosen grouping is consistent with how coordination-rules.md classifies game-designer (department lead) and with where the other lead specs live
- [x] #3 The game-designer spec file location matches its declared group (spec path and category are consistent)
- [x] #4 No agent frontmatter, model tier, or behavior is changed — this is qa-index bookkeeping only
- [x] #5 A quick scan confirms no other agent has the same qa/CLAUDE.md-vs-catalog grouping mismatch; any found are noted (not necessarily fixed) in the task summary
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewrote the "Agent tiers" block in qa/CLAUDE.md to mirror catalog.yaml categories and the qa/agents/ directory layout, and added a note naming catalog.yaml as the block's source of truth (model tiers stay in docs/coordination-rules.md).

game-designer now sits in `leads`, agreeing with catalog.yaml (category: lead, spec qa/agents/leads/game-designer.md) and coordination-rules.md ("Game design lead", pinned Fable). No spec file moved; no frontmatter, model, or behavior changed.

AC #5 scan result: the mismatch was systemic, not isolated — the old block was inherited from upstream CCGS and disagreed with the catalog on 12 of 53 agents (ux-designer, release-manager, localization-lead, level-designer, systems-designer, security-engineer, performance-analyst, economy-designer, writer, world-builder, prototyper, plus game-designer), omitted 3 (qa-tester, accessibility-specialist, live-ops-designer), listed a `creative` group with no matching directory, and lacked the `qa` group. All reconciled by the rewrite, since it was the same block/same class of fix. Verified by script: 53/53 agents match catalog spec paths exactly; `just test` green (36/36).

Noted, not fixed (would need file moves, out of scope): the qa corpus placement of 5 agents contradicts coordination-rules model tiers — systems-designer and level-designer sit in qa/agents/leads/ but are Sonnet specialists (the catalog's "Tier 2 Leads (Opus 4.8…)" comment is false for them), while ux-designer, release-manager, and localization-lead are Opus-pinned department leads with specs in specialists/ and operations/. The qa grouping is navigational (producer/art-director already sit in directors/ despite being Opus leads), so this may be intentional; flagging in case it warrants a follow-up.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-5
title: 'Set agent model tiers: directors → Fable, department leads → opus-4-8'
status: Done
assignee: []
created_date: '2026-08-07 15:25'
updated_date: '2026-08-08 01:34'
labels:
  - agents
  - config
dependencies: []
references:
  - .claude/agents/
  - .claude/docs/coordination-rules.md
  - qa/CLAUDE.md
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The upstream template assigns Opus to director-tier agents. The owner wants: director agents on Fable (claude-fable-5), department-lead agents on claude-opus-4-8, and specialists unchanged (sonnet). This touches the `model:` frontmatter across the affected agent files in .claude/agents/ AND the Model Tier Assignment table in .claude/docs/coordination-rules.md (which currently documents the tiers).

Roster ambiguity to resolve before implementing: the CCGS testing-framework CLAUDE.md classifies tiers as directors = creative-director, technical-director, producer, art-director; leads = lead-programmer, narrative-director, audio-director, ux-designer, qa-lead, release-manager, localization-lead. Note that narrative-director and audio-director carry "director" in their names but are classified as leads there — the user must confirm which agents count as "directors" vs "department leads" before frontmatter is changed. Engine specialists (godot-*, unity-*, ue-*, bevy-*) and the operations/creative specialists stay on sonnet.

Filed at the user's explicit request (2026-08-07). Independent of TASK-1..4; can proceed in parallel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The director/lead roster boundary is confirmed with the user and recorded in the task before any frontmatter changes
- [x] #2 Director-tier agents (creative-director, technical-director) have model: claude-fable-5 in their frontmatter
- [x] #3 Department-lead-tier agents (producer, art-director, narrative-director, audio-director, lead-programmer, qa-lead, release-manager, localization-lead, ux-designer) have model: claude-opus-4-8
- [x] #4 All specialist agents are on the sonnet alias, INCLUDING community-manager and devops-engineer lifted from haiku to the specialist floor (owner decision 2026-08-08; this supersedes the original 'remain on sonnet, unchanged' wording)
- [x] #5 coordination-rules.md Model Tier Assignment reflects the new mapping (agent tiers vs skill tiers; pinned IDs for leadership, floating sonnet alias for specialists; stale IDs corrected), AND the qa/ test corpus assertions are made consistent with it
- [x] #6 No field other than model: is altered on any agent; model: changes are confined to the 13 listed agents (2 Fable, 9 Opus 4.8, 2 haiku->sonnet)
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-07 15:27
---
Roster boundary confirmed by user (2026-08-07): ONLY creative-director + technical-director → Fable (claude-fable-5). Everyone else with a lead/director role → claude-opus-4-8: art-director, narrative-director, audio-director, producer, lead-programmer, qa-lead, release-manager, localization-lead, ux-designer. All specialists (engine sets incl. bevy-*, operations, creative, programming/design specialists) stay on sonnet. This is a top-2-authority split, not the CCGS directors/leads tiering.
---

created: 2026-08-07 23:18
---
Implemented on branch chore/5-set-agent-model-tiers (worktree task-5) via OpenSpec change set-agent-model-tiers. AC #4/#6 reworded (design Decision 4): community-manager + devops-engineer were on haiku, not sonnet, so 'remain on sonnet, unchanged' was literally false; owner chose to lift them to the sonnet floor. Scope expanded during implementation (owner-approved): the qa/ test corpus asserted each agent's model tier 'per coordination-rules.md', so 14 qa/agents specs + 2 qa/quality-rubric.md rows were corrected to match. Pre-flight confirmed subagent model: frontmatter accepts full model IDs (invalid IDs error immediately, no silent fallback). openspec validate --strict passes.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Set deliberate, version-pinned agent model tiers. Directors (creative-director, technical-director) -> claude-fable-5; nine department leads -> claude-opus-4-8; specialists stay on the floating sonnet alias, with community-manager and devops-engineer lifted haiku->sonnet to the specialist floor. Aliases could not express this: the 'opus' alias names a model family, not a specific version, so leads had to be pinned by full ID, and there is no 'fable' alias. coordination-rules.md's tier table was restructured to document agent tiers (pinned) separately from skill tiers (floating aliases), with stale IDs fixed. The qa/ skill-testing corpus (14 agent specs + 2 rubric rows) and five tier-describing docs (README, quick-start, agent-roster, director-gates, qa/catalog) were folded in and made consistent. An UPGRADING.md v1.1->v1.2 entry documents the consumer-visible change (9 agents move up a cost tier). 13 agent files changed one model: line each; no other frontmatter touched.
<!-- SECTION:FINAL_SUMMARY:END -->

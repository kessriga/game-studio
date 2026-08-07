---
id: TASK-5
title: 'Set agent model tiers: directors → Fable, department leads → opus-4-8'
status: To Do
assignee: []
created_date: '2026-08-07 15:25'
updated_date: '2026-08-07 15:27'
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
- [ ] #2 Director-tier agents have model: fable (claude-fable-5) in their frontmatter
- [ ] #3 Department-lead-tier agents have model set to claude-opus-4-8
- [ ] #4 Specialist agents remain on sonnet (unchanged)
- [ ] #5 coordination-rules.md Model Tier Assignment table reflects the new director/lead/specialist model mapping
- [ ] #6 No agent's tools or other frontmatter fields are altered by this change
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-07 15:27
---
Roster boundary confirmed by user (2026-08-07): ONLY creative-director + technical-director → Fable (claude-fable-5). Everyone else with a lead/director role → claude-opus-4-8: art-director, narrative-director, audio-director, producer, lead-programmer, qa-lead, release-manager, localization-lead, ux-designer. All specialists (engine sets incl. bevy-*, operations, creative, programming/design specialists) stay on sonnet. This is a top-2-authority split, not the CCGS directors/leads tiering.
---
<!-- COMMENTS:END -->

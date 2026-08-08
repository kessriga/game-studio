---
id: TASK-6
title: Point design skills at the game-design-lenses reference doc
status: To Do
assignee: []
created_date: '2026-08-08 15:32'
labels:
  - docs
  - skills
  - game-design
dependencies: []
references:
  - docs/game-design-lenses.md
  - 'https://github.com/kessriga/game-studio/pull/10'
priority: low
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new shipped reference, `docs/game-design-lenses.md` (added in PR #10), distills Jesse Schell's *The Art of Game Design* into a condensed lens battery, decision rules, playtest discipline, and a Quick Audit. The `game-designer` agent already reads it. The design-facing skills that perform the same kind of evaluation do not yet reference it, so their reviews don't benefit from the shared vocabulary (lenses, triangularity-first diagnostics, interest curves, dominant-strategy hunt, Quick Audit).

Wire the relevant design skills to the doc so their guidance is consistent with the agent. Confirmed candidates: `/gamedev:design-review` and `/gamedev:balance-check`. While in there, check whether `/gamedev:review-all-gdds`, `/gamedev:brainstorm`, and `/gamedev:quick-design` would also benefit — include them only if the fit is clear; do not force it.

Skills reference framework docs by path relative to their own `SKILL.md` (i.e. `../../docs/game-design-lenses.md`). Keep the reference lightweight (a pointer + when to consult it), not a wholesale copy of the doc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /gamedev:design-review references docs/game-design-lenses.md via the ../../docs/ relative path and states when to consult it (e.g. before verdicts on mechanic specs)
- [ ] #2 /gamedev:balance-check references docs/game-design-lenses.md, pointing specifically at the balance lenses and decision rules (triangularity, dominant strategy, reward-over-punishment)
- [ ] #3 review-all-gdds, brainstorm, and quick-design are evaluated for the same pointer; each is either wired in or explicitly judged not a fit, with the reasoning noted in the task summary
- [ ] #4 No skill duplicates the doc's content wholesale — references are pointers, not copies
- [ ] #5 The referenced path resolves correctly from each skill's SKILL.md location
<!-- AC:END -->

---
id: TASK-6
title: Point design skills at the game-design-lenses reference doc
status: Done
assignee: []
created_date: '2026-08-08 15:32'
updated_date: '2026-08-08 20:39'
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
- [x] #1 /gamedev:design-review references docs/game-design-lenses.md via the ../../docs/ relative path and states when to consult it (e.g. before verdicts on mechanic specs)
- [x] #2 /gamedev:balance-check references docs/game-design-lenses.md, pointing specifically at the balance lenses and decision rules (triangularity, dominant strategy, reward-over-punishment)
- [x] #3 review-all-gdds, brainstorm, and quick-design are evaluated for the same pointer; each is either wired in or explicitly judged not a fit, with the reasoning noted in the task summary
- [x] #4 No skill duplicates the doc's content wholesale — references are pointers, not copies
- [x] #5 The referenced path resolves correctly from each skill's SKILL.md location
- [x] #6 /gamedev:playtest-report references docs/game-design-lenses.md, pointing at the Playtest Discipline section (stated questions, WUBALEW cadence, FFWWDD debrief)
- [x] #7 /gamedev:design-system references docs/game-design-lenses.md at three authoring points — concept lenses at Player Fantasy (Section B), balance lenses at the formulas section, Quick Audit at the 5a self-check — all on the ungated main-session path
- [x] #8 docs/game-design-lenses.md header names the actual consumer set (game-designer agent + the seven wired skills) after the change
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wired seven design-facing skills to `docs/game-design-lenses.md` with lightweight pointers, plus the doc's own consumer-list header.

**Key finding that shaped the work:** in the default review mode (`solo`), no skill spawns the `game-designer` agent (the doc's only prior consumer) — `design-system` skips all specialist spawns, `design-review` skips Phase 3b, `balance-check` runs as `economy-designer`. So a default-mode user got zero lens contact anywhere in the pipeline. Every pointer was therefore placed in **main-session (ungated) text**, never inside a spawn-gated phase where it would evaporate in solo mode.

**Wired (8 references across 7 skills):**
- `design-review` — Quick Audit step at end of Phase 3 (the only design-theory pass in lean/solo).
- `balance-check` — Phase 4 preamble → Balance lenses #37–#53 + Decision Rules.
- `review-all-gdds` — main session reads the doc and pastes Decision Rules + lenses #40/#68/#69/#21 into the Phase 3 Task prompt as vocabulary (a subagent can't resolve the plugin-relative path — matches the skill's existing TR-registry contract).
- `brainstorm` — intro pointer to concept lenses (#1/#2/#14/#17, #30/31).
- `quick-design` — one sentence in the Tuning branch: the double-or-halve tuning rule, reflected in the Rationale column.
- `playtest-report` — Playtest Discipline (stated questions, WUBALEW, FFWWDD).
- `design-system` — three insertions on the authoring path: concept lenses at Section B, Balance lenses at the formulas section, Quick Audit in the 5a self-check (all ungated).
- `docs/game-design-lenses.md` header — consumer list now names the agent + all seven skills.

**Evaluated, not a fit (AC #3):**
- `prototype` — already implements lens #16 (one stated question, PROCEED/PIVOT/KILL); a pointer adds words, not behavior.
- `ux-review` — validates UX specs; lens #21 "flow" is challenge-vs-skill flow, not UI flow — wiring it would conflate two concepts.
- `consistency-check` — numeric/registry cross-checking, no design-theory judgment (verified: zero lens vocabulary).

**Deferred (needs owner sign-off to file):** agent-level pointers for `economy-designer`, `systems-designer`, `creative-director` (mirroring `game-designer`). They only fire in full mode (already lens-covered via game-designer) and collide with the in-flight `set-agent-model-tiers` change touching `agents/*.md`; deserve their own diff. NOT filed as a task per the no-unasked-follow-ups rule — flagged here for your call.

**qa/ corpus untouched (verified):** `qa/skills/` holds skill *test specs*, not content mirrors, and none reference the lens doc; a ≤3-line pointer violates no static assertion or test case.

**Verification:** grep confirms 7 SKILL.md + game-designer.md = exactly the header's named set; `../../docs/game-design-lenses.md` resolves from every skill dir; every reference is a one-line pointer (no wholesale copy); OpenSpec change `point-design-skills-at-lenses-doc` validates. Diff: 8 files, +22/−3.

Scope note: added AC #6–#8 for the two skills beyond the task's candidate list (playtest-report, design-system) and the doc header, per in-session scope agreement.
<!-- SECTION:FINAL_SUMMARY:END -->

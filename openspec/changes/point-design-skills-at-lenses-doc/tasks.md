# Tasks: point-design-skills-at-lenses-doc

## 1. Task-record scope update (needs owner sign-off — obtained in-session 2026-08-08)

- [x] 1.1 Add two acceptance criteria to Backlog TASK-6: playtest-report wired to the Playtest Discipline section; design-system wired at its three insertion points (Section B, formulas/balance, pre-write Quick Audit)
- [x] 1.2 Add one acceptance criterion to TASK-6: the lens doc's header consumer list names all actual consumers after the change

## 2. Confirmed candidates (TASK-6 AC #1–#2)

- [x] 2.1 `skills/design-review/SKILL.md` — add a Quick Audit step at the end of Phase 3: before forming the Phase 4 verdict, run the Quick Audit from `../../docs/game-design-lenses.md` against the reviewed document (covers lean/solo where Phase 3b never spawns)
- [x] 2.2 `skills/balance-check/SKILL.md` — add a Phase 4 preamble line: consult the Balance lenses (#37–#53) and Decision Rules (triangularity-first, dominant-strategy hunt, reward-over-punishment, double-or-halve) in `../../docs/game-design-lenses.md` before running domain checks

## 3. Evaluated candidates wired in (TASK-6 AC #3)

- [x] 3.1 `skills/review-all-gdds/SKILL.md` — direct the main session to read `../../docs/game-design-lenses.md` during Phase 1 prep and paste its Decision Rules + lens summaries (#40, #68/69, #21) into the Phase 3 design-theory Task-agent prompt as review vocabulary (content, not a path — a subagent can't resolve the plugin-relative path); extend the skill's existing "always pass to Task agents" list to name the lens vocabulary alongside the GDD paths and TR registry
- [x] 3.2 `skills/brainstorm/SKILL.md` — add one intro line: consult the concept & experience lenses (and #30/31 for core-loop verbs) in `../../docs/game-design-lenses.md` when generating and stress-testing concepts
- [x] 3.3 `skills/quick-design/SKILL.md` — add one sentence to the Tuning branch of Step 3: apply the tuning rule from the doc's Decision Rules (double or halve, never nudge 10%, then bisect) and reflect it in the Rationale column

## 4. Discovered candidates (new ACs from 1.x)

- [x] 4.1 `skills/playtest-report/SKILL.md` — add one preamble line pointing at the Playtest Discipline section of `../../docs/game-design-lenses.md` (stated questions, WUBALEW cadence, FFWWDD debrief, watch faces not screens) for both template and analyze modes
- [x] 4.2 `skills/design-system/SKILL.md` — Section B (Player Fantasy) guidance: one line pointing at the concept & experience lenses (#1, #2, #17)
- [x] 4.3 `skills/design-system/SKILL.md` — formulas/balance section guidance: one line pointing at the Balance lenses and Decision Rules
- [x] 4.4 `skills/design-system/SKILL.md` — add a Quick Audit line to the Section 5a Self-Check bullet list (ungated main-session step, runs in solo — not the gated 5a-bis CD-GDD-ALIGN block). Hard bound for 4.2–4.4: three insertions total, ≤3 lines each, no other text edited

## 5. Doc header (consumer-list truth)

- [x] 5.1 `docs/game-design-lenses.md` lines 7–9 — rewrite the consumer sentence to name the `game-designer` agent and the seven wired skills; lens content below the header untouched

## 6. Verification (TASK-6 AC #4–#5)

- [x] 6.1 Pointer check: `grep -rn "game-design-lenses" skills/ agents/ docs/` — exactly seven SKILL.md hits + game-designer.md; header list matches the grep set (the doc no longer references its own filename, so docs/ yields no self-hit)
- [x] 6.2 Path resolution: for each edited SKILL.md, resolve `../../docs/game-design-lenses.md` from its directory → all land on the existing doc; review-all-gdds hands the Phase 3 subagent pasted vocabulary, not a path
- [x] 6.3 No-copy check: no edited skill reproduces lens questions/rules inline (each reference is a one-line pointer)
- [x] 6.4 Skill-change hook confirmed advisory-only (exit 0); no edit changes frontmatter, phase headings, verdict keywords, or documented output — nothing the static test asserts

## 7. Close-out (same-PR task hygiene)

- [x] 7.1 Record the not-a-fit reasoning in the TASK-6 final summary: prototype (already implements lens #16), ux-review (UI flow ≠ challenge flow), consistency-check (no design-theory judgment); note the deferred agent-level pointers (economy-designer, systems-designer, creative-director) as a possible future filing — owner's call
- [x] 7.2 Check all TASK-6 acceptance criteria (#1–#8), set status Done with final summary
- [ ] 7.3 Copy the updated task file into the worktree, stage only it + the skill/doc/openspec changes, commit on the branch, rebase on main (set-agent-model-tiers may land first), open the PR referencing TASK-6 — **awaiting user go-ahead to commit/push**

# Proposal: point-design-skills-at-lenses-doc

## Why

`docs/game-design-lenses.md` (PR #10) distills Schell's lens method into the framework's working design reference, but today its only consumer is the `game-designer` agent — and tracing the pipeline shows that in the **default review mode (`solo`), no skill ever spawns that agent**: `design-system` skips all specialist spawns (even the "MANDATORY" ones carry a `solo → skip` check), `design-review` skips Phase 3b, and `balance-check` executes as `economy-designer`, which has no lens knowledge. A solo-mode user — the default audience — authors, reviews, balances, and playtests with zero contact with the doc. Skill-level pointers are therefore not a consistency nicety; they are the only lens delivery mechanism the default pipeline has. This closes Backlog **TASK-6**.

## What Changes

Seven skills gain a lightweight pointer (one to three lines each: the `../../docs/game-design-lenses.md` path + when to consult it), placed in **main-session analysis text or always-spawned worker prompts** — never inside spawn-gated phases, which evaporate in solo mode:

- **`design-review`** — Phase 3 gains a Quick Audit step before the verdict is formed (the doc's Quick Audit is captioned "run when reviewing any mechanic or GDD"). Covers the lean/solo gap where no `game-designer` specialist is spawned.
- **`balance-check`** — Phase 4 preamble points at the Balance lens block (#37–#53) and the Decision Rules (triangularity-first, dominant-strategy hunt, reward-over-punishment, double-or-halve tuning). Its executor (`economy-designer`) currently has no lens vocabulary.
- **`review-all-gdds`** — the **main session reads the doc** and pastes its Decision Rules + relevant lens summaries into the **Phase 3 (design-theory) Task-agent prompt**, exactly as the skill already mandates for the TR registry ("paste the registry text, not just a file path"; "do not rely on the subagent to re-read these files"). A bare path cannot ride in the prompt — a spawned subagent resolves neither the plugin-relative `../../docs/…` nor a project-root `docs/…` (the lens doc ships under `${CLAUDE_PLUGIN_ROOT}`, not the user's game repo). Adds the checks Phase 3 lacks (triangularity #40, interest curves #68/69, flow #21) as vocabulary, not new prose.
- **`brainstorm`** — one-line pointer in the intro (concept lenses #1/#2/#14/#17, emergence #30/31). The doc's own header already names brainstorm as a consumer; this makes that claim true.
- **`quick-design`** — one surgical sentence in the Tuning branch: follow the doc's tuning rule (double or halve, never nudge 10%, then bisect) when proposing new values and say so in the Rationale column.
- **`playtest-report`** (added beyond the task's candidate list) — pointer to the Playtest Discipline section (stated questions, WUBALEW cadence, FFWWDD debrief, watch-faces-not-screens). That section currently has no consumer anywhere, and this is the only skill whose job it describes.
- **`design-system`** (added beyond the task's candidate list) — three pointer-sized insertions on the authoring path: concept/experience lenses at Section B (Player Fantasy), balance lenses at the formulas/balance section, Quick Audit before the final write. Highest-leverage consumer: review-side pointers catch lens violations after the GDD is written; this prevents them, in the mode (solo) where no specialist is consulted at all. Strictly pointers — no restructuring of the skill's method.

Plus one consequence edit:

- **`docs/game-design-lenses.md` header** — the consumer list (lines 7–9) grows from "game-designer + three skills" to name all seven consumers, so the doc's claim about who reads it stays true.

Explicitly **evaluated and excluded** (recorded in design.md; reasoning lands in the TASK-6 summary per its AC #3):

- `prototype` — already implements lens #16 (one stated question, PROCEED/PIVOT/KILL); a pointer adds words, not behavior.
- `ux-review` — validates UX specs for accessibility/completeness; lens #21 "flow" is challenge-vs-skill flow, not UI flow — wiring it would conflate the two.
- `consistency-check` — numeric/registry cross-checking, no design-theory judgment (verified: zero lens-shaped vocabulary).
- **Agent-level pointers** (`economy-designer`, `systems-designer`, `creative-director`) — deferred: only pay off in full mode (the already-covered path), collide with the in-flight `set-agent-model-tiers` change touching `agents/*.md`, and deserve their own reviewable diff.

## Capabilities

### New Capabilities

- `design-lens-references`: design-facing skills reference `docs/game-design-lenses.md` at the point where design judgment happens on their solo-mode (main-session) path, as lightweight pointers (path + when to consult), and the doc's header consumer list matches the actual set of referencing skills/agents.

### Modified Capabilities

<!-- none: existing specs (plugin-hooks, plugin-packaging, project-scaffolding, stage-status-surfacing) do not cover design-skill guidance -->

## Impact

- `skills/{design-review,balance-check,review-all-gdds,brainstorm,quick-design,playtest-report,design-system}/SKILL.md` — one to three lines each; no phase restructuring, no frontmatter changes.
- `docs/game-design-lenses.md` — header consumer sentence only; lens content untouched.
- `backlog/tasks/task-6 …md` — AC additions for the two extra skills + doc header (needs owner sign-off before edit), status/summary updates ride in this PR per workflow rules.
- No agent files, hooks, templates, or `qa/` corpus files are touched.
- Path prefix rule: skills use `../../docs/…` (two levels up from `skills/<name>/SKILL.md`); the existing agent reference keeps `../docs/…`. Wrong prefixes fail silently at read time, so verification includes a resolve check per edited file.

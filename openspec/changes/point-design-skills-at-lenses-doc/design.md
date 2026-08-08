# Design: point-design-skills-at-lenses-doc

## Context

`docs/game-design-lenses.md` is a 177-line distillation of Schell's lens method: a lens battery grouped by design activity (concept, mechanics, balance, pacing, process), a Decision Rules list, a Playtest Discipline section, and a Quick Audit. Its only current consumer is `agents/game-designer.md` (via `../docs/game-design-lenses.md`, "consult it when designing a new mechanic or reviewing an existing one").

The plugin's review-mode setting (`production/review-mode.txt`, default `solo` when absent) gates every specialist-agent spawn in the design pipeline. In solo mode:

- `design-system` skips **all** section-specialist spawns — each "MANDATORY" delegation block carries a `solo → skip this agent spawn` check (SKILL.md lines 428, 463, 513, 550, 611, 688);
- `design-review` skips Phase 3b entirely, so the main session forms the verdict alone;
- `brainstorm` skips CD-PILLARS / AD-CONCEPT-VISUAL / TD-FEASIBILITY / PR-SCOPE gates;
- `balance-check` always executes as `economy-designer` (frontmatter `agent:`), which references no framework docs;
- `review-all-gdds` spawns its Phase 2/3 worker agents unconditionally (they are parallelization workers, not gates), but their prompts don't mention the lens doc, and the skill itself warns that subagents cannot see files not explicitly passed.

Net: on the default path, no participant reads the lens doc at any pipeline stage — authoring, review, balance, or playtesting.

## Goals / Non-Goals

**Goals:**

- Every point in the pipeline where design judgment happens **in solo mode** has a pointer to the lens doc: what to read and when.
- Pointers are one to three lines each — path + trigger condition + relevant doc section. No lens content is copied into any skill (TASK-6 AC #4).
- The doc's header consumer list matches reality after the change.
- Skills evaluated and rejected get their reasoning recorded (TASK-6 AC #3) — here and in the task summary.

**Non-Goals:**

- No agent-file edits (`economy-designer`, `systems-designer`, `creative-director` pointers are deliberately deferred — see Decisions).
- No restructuring of any skill's phases, output formats, or delegation tables.
- No changes to the lens doc's content below the header.
- No qa-corpus updates. Verified: `qa/skills/` holds skill *test specs* (static assertions + test cases), not mirrors of SKILL.md content, and none reference the lens doc. A ≤3-line pointer changes no frontmatter field, phase heading, verdict keyword, or documented output format — so it violates no existing static assertion or test case. TASK-7 territory (qa tier grouping) is untouched.

## Decisions

### D1 — Pointers live in main-session text (or always-spawned worker prompts), never in spawn-gated phases

The alternative — enriching the Phase 3b / director-gate prompts — reads naturally but delivers nothing in solo mode, exactly where the gap is. Rule applied per skill:

| Skill | Placement | Doc section pointed at |
|---|---|---|
| `design-review` | Phase 3 (main-session analysis), as a closing step: run the Quick Audit before forming the Phase 4 verdict | Quick Audit |
| `balance-check` | Phase 4 preamble (before domain checks) | Balance lenses #37–#53 + Decision Rules |
| `review-all-gdds` | **Main-session prep** reads the doc (`../../docs/…`), then pastes its Decision Rules + lens summaries into the Phase 3 **Task-agent prompt** (worker always spawns; skill mandates passing content, not paths) | Decision Rules + #40, #68/69, #21 as added vocabulary |
| `brainstorm` | Intro (before Phase 1), one line | Concept & experience lenses, #30/31 |
| `quick-design` | Tuning branch of Step 3, one sentence | Decision Rules → tuning rule (double-or-halve) |
| `playtest-report` | Phase 1/2 preamble, one line | Playtest Discipline (stated questions, WUBALEW, FFWWDD) |
| `design-system` | Three insertions: Section B guidance, formulas/balance section guidance, pre-write step before CD-GDD-ALIGN | Concept lenses; Balance lenses; Quick Audit |

### D2 — `design-system` and `playtest-report` join the wired set (beyond TASK-6's candidate list)

- `design-system` is the highest-leverage consumer: it *authors* what the review skills later check, and in solo mode it drafts Player Fantasy, rules, and balance values with no specialist and no lens contact. Pointer-sized only — anything more would redesign an 871-line skill's method and diverge from TASK-6's shape.
- `playtest-report` is the only skill whose job the doc's Playtest Discipline section describes, and that section otherwise has zero consumers. Same one-line pointer shape as the confirmed candidates.
- Consequence: TASK-6's acceptance criteria need two additions (owner signed off on scope in-session, 2026-08-08).

### D3 — Evaluated and rejected (the AC #3 record)

- **`prototype`** — not a fit: already implements lens #16 Risk Mitigation (Phase 1 "Define the Question", one stated question, PROCEED/PIVOT/KILL verdict). A pointer would duplicate behavior the skill already has.
- **`ux-review`** — not a fit: validates UX specs for accessibility, completeness, and GDD alignment as `ux-designer`. Lens #21 "flow" means challenge-vs-skill flow; wiring it into UI-flow review would conflate two concepts sharing a word.
- **`consistency-check`** — not a fit: numeric/registry cross-checking with no design-theory judgment (verified by grep: zero lens-shaped vocabulary).
- **Agent-level pointers** (`economy-designer`, `systems-designer`, `creative-director`, mirroring `game-designer.md:18-22`) — deferred, not rejected: (1) they only fire in full mode, the path that already gets lens coverage via `game-designer` on most spawns; (2) `set-agent-model-tiers` (in flight, 32/33) edits `agents/*.md` — a parallel PR touching the same files invites merge noise; (3) agent edits change every invocation route and deserve their own reviewable diff. Noted in the TASK-6 summary; filed only if the owner asks.

### D4 — Pointer format follows the existing `game-designer` precedent

One sentence naming the doc path, the trigger, and the specific section — e.g. "Before forming the verdict, run the Quick Audit from `../../docs/game-design-lenses.md` against the reviewed mechanic." Rationale: the agent's existing reference ("consult it when designing a new mechanic or reviewing an existing one") is the pattern users of the framework have already accepted; a bare link with no trigger gets ignored (per the user's own sources-of-truth convention).

### D5 — Path prefixes are structural, and subagents get content not paths

Skills resolve the doc as `../../docs/game-design-lenses.md` (from `skills/<name>/SKILL.md`, which lives in the plugin root); the existing agent reference keeps `../docs/…`. A **spawned Task agent gets no usable path at all**: the lens doc ships under `${CLAUDE_PLUGIN_ROOT}`, so a subagent — whose working directory is the user's game project, not the plugin — resolves neither `../../docs/…` (relative to its own cwd, wrong) nor a bare `docs/…` (the user's project has no such file). Therefore review-all-gdds' Phase 3 worker receives **pasted content** (the Decision Rules + relevant lens summaries) from the main session, which reads the doc via its skill-relative path first. This is the same contract the skill already enforces for the TR registry.

## Risks / Trade-offs

- [Doc grows stale as skills evolve] → the header consumer list is part of this change's contract; any future change adding/removing a consumer updates it (same discipline the repo applies to skill counts in README).
- [Pointer fatigue: seven more "read this doc" instructions add tokens] → each pointer is conditional ("when reviewing a mechanic", "when proposing tuning values"), not an unconditional read; the doc is ~2k tokens when actually loaded, acceptable at judgment points.
- [Quick Audit in design-review Phase 3 partially overlaps game-designer's full-mode review] → acceptable duplication: in full mode the specialist goes deeper than the audit; in solo mode the audit is all there is. No contradiction possible since both derive from the same doc.
- [`design-system` insertions drift into methodology rewrite during implementation] → hard bound in tasks.md: three insertions, ≤3 lines each, no edits to existing phase text beyond the insertion points.

## Migration Plan

Not applicable — documentation-only change to skill guidance; no data, no APIs, no user-side migration. Rollback is `git revert` of the single PR.

## Open Questions

- None blocking. The owner may later want the deferred agent-level pointers; that is a separate filing decision, not part of this change.

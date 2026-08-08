---
name: create-stories
description: "Break a single epic into implementable story files. Reads the epic, its GDD, governing ADRs, and control manifest. Each story embeds its GDD requirement TR-ID, ADR guidance, acceptance criteria, story type, and test evidence path. Run after /gamedev:create-epics for each epic."
argument-hint: "[epic-slug | epic-path] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion, mcp__backlog__task_create
model: sonnet
agent: lead-programmer
---

# Create Stories

A story is a single implementable behaviour — small enough to complete in one
focused session, self-contained, and fully traceable to a GDD requirement and
an ADR decision. Stories are what developers pick up. Epics are what architects
define.

**Run this skill per epic**, not per layer. Run it for Foundation epics first,
then Core, and so on — matching the dependency order.

**Output:** `production/epics/[epic-slug]/story-NNN-[slug].md` files

**Previous step:** `/gamedev:create-epics [system]`
**Next step after stories exist:** `/gamedev:story-readiness [story-path]` then `/gamedev:dev-story [story-path]`

---

## 1. Parse Argument

Extract `--review [full|lean|solo]` if present and store as the review mode
override for this run. If not provided, read `production/review-mode.txt`
(default `solo` if missing). This resolved mode applies to all gate spawns
in this skill — apply the check pattern from `.claude/docs/director-gates.md`
before every gate invocation.

- `/gamedev:create-stories [epic-slug]` — e.g. `/gamedev:create-stories combat`
- `/gamedev:create-stories production/epics/combat/EPIC.md` — full path also accepted
- No argument — ask: "Which epic would you like to break into stories?"
  Glob `production/epics/*/EPIC.md` and list available epics with their status.

---

## 2. Load Everything for This Epic

Read in full:

- `production/epics/[epic-slug]/EPIC.md` — epic overview, governing ADRs, GDD requirements table
- The epic's GDD (`design/gdd/[filename].md`) — read all 8 sections, especially Acceptance Criteria, Formulas, and Edge Cases
- All governing ADRs listed in the epic — read the Decision, Implementation Guidelines, Engine Compatibility, and Engine Notes sections
- `docs/architecture/control-manifest.md` — extract rules for this epic's layer; note the Manifest Version date from the header
- `docs/architecture/tr-registry.yaml` — load all TR-IDs for this system

**ADR existence validation**: After reading the governing ADRs list from the epic, confirm each ADR file exists on disk. If any ADR file cannot be found, **stop immediately** before decomposing any story:

> "Epic references [ADR-NNNN: title] but `docs/architecture/[adr-file].md` was not found.
> Check the filename in the epic's Governing ADRs list, or run `/gamedev:architecture-decision`
> to create it. Cannot create stories until all referenced ADR files are present."

Do not proceed to Step 3 until all referenced ADR files are confirmed present.

Report: "Loaded epic [name], GDD [filename], [N] governing ADRs (all confirmed present), control manifest v[date]."

---

## 3. Classify Stories by Type

**Story Type Classification** — assign each story a type based on its acceptance criteria:

| Story Type | Assign when criteria reference... |
|---|---|
| **Logic** | Formulas, numerical thresholds, state transitions, AI decisions, calculations |
| **Integration** | Two or more systems interacting, signals crossing boundaries, save/load round-trips |
| **Visual/Feel** | Animation behaviour, VFX, "feels responsive", timing, screen shake, audio sync |
| **UI** | Menus, HUD elements, buttons, screens, dialogue boxes, tooltips |
| **Config/Data** | Balance tuning values, data file changes only — no new code logic |

Mixed stories: assign the type that carries the highest implementation risk.
The type determines what test evidence is required before `/gamedev:story-done` can close the story.

---

## 4. Decompose the GDD into Stories

For each GDD acceptance criterion:

1. Group related criteria that require the same core implementation
2. Each group = one story
3. Order stories: foundational behaviour first, edge cases last, UI last

**Story sizing rule:** one story = one focused session (~2-4 hours). If a
group of criteria would take longer, split into two stories.

For each story, determine:
- **GDD requirement**: which acceptance criterion(ia) does this satisfy?
- **TR-ID**: look up in `tr-registry.yaml`. Use the stable ID. If no match, use `TR-[system]-???` and warn.
- **Governing ADR**: which ADR governs how to implement this?
  - `Status: Accepted` → embed normally
  - `Status: Proposed` → mark the story blocked: its Backlog task (minted in Step 6) gets the `blocked` label, with an Implementation Note: "BLOCKED: ADR-NNNN is Proposed — run `/gamedev:architecture-decision` to advance it"
  - **Multiple ADRs apply**: List all governing ADRs in the story's `Governing ADRs:` field. Designate the one most directly controlling the implementation pattern as primary (first in the list). Others are listed as secondary references.
  - **No ADR applies at all**: Write `ADR: N/A — [brief reason, e.g. "pure data configuration, no architectural pattern required"]` in the story's ADR field. Do NOT leave the field blank — a blank ADR field means "not checked", not "not applicable".
- **Story Type**: from Step 3 classification
- **Engine risk**: from the ADR's Knowledge Risk field

---

## 4b. QA Lead Story Readiness Gate

**Review mode check** — apply before spawning QL-STORY-READY:
- `solo` → skip. Note: "QL-STORY-READY skipped — Solo mode." Proceed to Step 5 (present stories for review).
- `lean` → skip (not a PHASE-GATE). Note: "QL-STORY-READY skipped — Lean mode." Proceed to Step 5 (present stories for review).
- `full` → spawn as normal.

After decomposing all stories (Step 4 complete) but before presenting them for write approval, spawn `qa-lead` via Task using gate **QL-STORY-READY** (`.claude/docs/director-gates.md`).

Pass: the full story list with acceptance criteria, story types, and TR-IDs; the epic's GDD acceptance criteria for reference.

Present the QA lead's assessment. For each story flagged as GAPS or INADEQUATE, revise the acceptance criteria before proceeding — stories with untestable criteria cannot be implemented correctly. Once all stories reach ADEQUATE, proceed.

**Before generating test specs**: Glob `production/qa/qa-plan-*.md` for the most recently modified file. If found, read it and check whether it contains test case specifications for the stories in this epic (look for story titles or slugs in the plan's Automated Tests Required section). If matching specs exist:
- Use `AskUserQuestion`:
  - Prompt: "A QA plan exists at [path] with test specs for some of these stories. How do you want to proceed?"
  - Options:
    - `Use existing specs from the QA plan — embed them into the story files (Recommended)`
    - `Ask qa-lead to generate fresh specs — override the QA plan`
    - `Skip test spec generation — I'll fill in ## QA Test Cases manually`
- If "Use existing specs": extract the test case specs from the qa-plan for each matching story and embed them directly into the `## QA Test Cases` section. No qa-lead spawn needed for those stories. Only spawn qa-lead for stories with no coverage in the qa-plan.
- If "Generate fresh": proceed with the qa-lead spawn below as normal.
- If "Skip": leave `## QA Test Cases` with a placeholder: `*Test cases not yet defined — run /gamedev:qa-plan to generate them.*`

**After ADEQUATE** (or after qa-plan import): for every Logic and Integration story, ask the qa-lead to produce concrete test case specifications — one per acceptance criterion — in this format:

```
Test: [criterion text]
  Given: [precondition]
  When: [action]
  Then: [expected result / assertion]
  Edge cases: [boundary values or failure states to test]
```

For Visual/Feel and UI stories, produce manual verification steps instead:
```
Manual check: [criterion text]
  Setup: [how to reach the state]
  Verify: [what to look for]
  Pass condition: [unambiguous pass description]
```

These test case specs are embedded directly into each story's `## QA Test Cases` section. The developer implements against these cases. The programmer does not write tests from scratch — QA has already defined what "done" looks like.

---

## 5. Present Stories for Review

Before writing any files, present the full story list:

```
## Stories for Epic: [name]

Story 001: [title] — Logic — ADR-NNNN
  Covers: TR-[system]-001 ([1-line summary of requirement])
  Test required: tests/unit/[system]/[slug]_test.[ext]

Story 002: [title] — Integration — ADR-MMMM
  Covers: TR-[system]-002, TR-[system]-003
  Test required: tests/integration/[system]/[slug]_test.[ext]

Story 003: [title] — Visual/Feel — ADR-NNNN
  Covers: TR-[system]-004
  Evidence required: production/qa/evidence/[slug]-evidence.md

[N stories total: N Logic, N Integration, N Visual/Feel, N UI, N Config/Data]
```

Use `AskUserQuestion`:
- Prompt: "May I write these [N] stories to `production/epics/[epic-slug]/`?"
- Options: `[A] Yes — write all [N] stories` / `[B] Not yet — I want to review or adjust first`

---

## 6. Write Story Files

For each story, write `production/epics/[epic-slug]/story-[NNN]-[slug].md`:

```markdown
# Story [NNN]: [title]

> **Epic**: [epic name]
> **Tracked in**: TASK-N *(Backlog owns status; this `.md` is the frozen spec)*
> **Layer**: [Foundation / Core / Feature / Presentation]
> **Type**: [Logic | Integration | Visual/Feel | UI | Config/Data]
> **Estimate**: [hours or t-shirt size — optional]
> **Manifest Version**: [date from control-manifest.md header]
> **Last Updated**: [set by /gamedev:story-done when Completion Notes are appended]

## Context

**GDD**: `design/gdd/[filename].md`
**Requirement**: `TR-[system]-NNN`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: [ADR-NNNN: title]
**ADR Decision Summary**: [1-2 sentence summary of what the ADR decided]

**Engine**: [name + version] | **Risk**: [LOW / MEDIUM / HIGH]
**Engine Notes**: [from ADR Engine Compatibility section — post-cutoff APIs, verification required]

**Control Manifest Rules (this layer)**:
- Required: [relevant required pattern]
- Forbidden: [relevant forbidden pattern]
- Guardrail: [relevant performance guardrail]

---

## Acceptance Criteria

*From GDD `design/gdd/[filename].md`, scoped to this story:*

- [ ] [criterion 1 — directly from GDD]
- [ ] [criterion 2]
- [ ] [performance criterion if applicable]

---

## Implementation Notes

*Derived from ADR-NNNN Implementation Guidelines:*

[Specific, actionable guidance from the ADR. Do not paraphrase in ways that
change meaning. This is what the programmer reads instead of the ADR.]

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- [Story NNN+1]: [what it handles]

---

## QA Test Cases

*Written by qa-lead at story creation. The developer implements against these — do not invent new test cases during implementation.*

**[For Logic / Integration stories — automated test specs]:**

- **AC-1**: [criterion text]
  - Given: [precondition]
  - When: [action]
  - Then: [assertion]
  - Edge cases: [boundary values / failure states]

**[For Visual/Feel / UI stories — manual verification steps]:**

- **AC-1**: [criterion text]
  - Setup: [how to reach the state]
  - Verify: [what to look for]
  - Pass condition: [unambiguous pass description]

---

## Test Evidence

**Story Type**: [type]
**Required evidence**:
- Logic: `tests/unit/[system]/[story-slug]_test.[ext]` — must exist and pass
- Integration: `tests/integration/[system]/[story-slug]_test.[ext]` OR playtest doc
- Visual/Feel: `production/qa/evidence/[story-slug]-evidence.md` + sign-off
- UI: `production/qa/evidence/[story-slug]-evidence.md` or interaction test
- Config/Data: smoke check pass (`production/qa/smoke-*.md`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: [Story NNN-1 must be DONE, or "None"]
- Unlocks: [Story NNN+1, or "None"]
```

### Then mint a Backlog task per story (Backlog owns status)

For each story `.md` just written, create the tracking task with `mcp__backlog__task_create`:

- `title`: the story title (e.g. "Story 001: Damage calculator")
- `description`: 1–2 line summary + a `Spec:` pointer to the story file path (`production/epics/[epic-slug]/story-NNN-[slug].md`) — this is the forward-pointer to the frozen spec
- `acceptanceCriteria`: the story's acceptance criteria (verbatim from the GDD-derived list)
- `milestone`: the epic name (the milestone `/gamedev:create-epics` minted)
- `labels`: `blocked` if the story's governing ADR is Proposed (Step 4); otherwise none. Never a `bug` label (these are stories)
- `status`: `To Do` (a task exists ⇒ the story is ready; `Draft` is only for stories still being authored)
- `priority`: derive from layer/dependency order if known, else leave default
- `references`: the story file path

Then edit the story `.md` header's `Tracked in: TASK-N` placeholder to the real task ID returned by `task_create`. The task (status) and the `.md` (spec + evidence trail) now cross-reference each other.

### Also update `production/epics/[epic-slug]/EPIC.md`

Replace the "Stories: Not yet created" line with a populated table. **No Status column** — status lives in the Backlog task:

```markdown
## Stories

| # | Story | Type | Task | ADR |
|---|-------|------|------|-----|
| 001 | [title] | Logic | TASK-N | ADR-NNNN |
| 002 | [title] | Integration | TASK-M | ADR-MMMM |
```

Do **not** write a story roster or status count into `production/epics/index.md` — that file is a static prose navigation map (see `/gamedev:create-epics`); the live roster is the Backlog milestone and board.

---

## 7. After Writing

Use `AskUserQuestion` to close with context-aware next steps:

Check:
- Are there other epics in `production/epics/` without stories yet? List them.

Widget:
- Prompt: "[N] stories written to `production/epics/[epic-slug]/` and [N] Backlog tasks minted under milestone [epic]. What next?"
- Options (include all that apply):
  - `[A] Start implementing — run /gamedev:story-readiness [first-story-path]` (Recommended)
  - `[B] Create stories for [next-epic-slug] — run /gamedev:create-stories [slug]` (only if other epics have no stories yet)
  - `[C] Stop here for this session`

Note in output: "Work through stories in order — each story's `Depends on:` field tells you what must be DONE before you can start it."

---

## Collaborative Protocol

1. **Read before presenting** — load all inputs silently before showing the story list
2. **Ask once** — present all stories for the epic in one summary, not one at a time
3. **Warn on blocked stories** — flag any story with a Proposed ADR before writing
4. **Ask before writing** — get approval for the full story set before writing files
5. **No invention** — acceptance criteria come from GDDs, implementation notes from ADRs, rules from the manifest
6. **Never start implementation** — this skill stops at the story file level

After writing (or declining):

- **Verdict: COMPLETE** — [N] stories written to `production/epics/[epic-slug]/`. Run `/gamedev:story-readiness` → `/gamedev:dev-story` to begin implementation.
- **Verdict: BLOCKED** — user declined. No story files written.

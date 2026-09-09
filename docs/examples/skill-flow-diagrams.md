# Skill Flow Diagrams

Visual maps of how skills chain together across the 7 development phases. These show what runs before and after each
skill, and what artifacts flow between them.

---

## Full Pipeline Overview (Zero to Ship)

```
PHASE 1: CONCEPT
  /skill:gamedev-start ──────────────────────────────────────────────────────► routes to A/B/C/D
  /skill:gamedev-brainstorm ──────────────────────────────────────────────────► design/gdd/game-concept.md
  /skill:gamedev-setup-engine ────────────────────────────────────────────────► AGENTS.md + technical-preferences.md
  /skill:gamedev-prototype [core-mechanic] ───────────────────────────────────► prototypes/[name]-concept/REPORT.md
        │ PROCEED                                                  (validate idea BEFORE writing GDDs)
        ▼
  /skill:gamedev-design-review [game-concept.md] ────────────────────────────► concept validated
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to systems-design
        │
        ▼
PHASE 2: SYSTEMS DESIGN
  /skill:gamedev-map-systems ────────────────────────────────────────────────► design/gdd/systems-index.md
        │
        ▼ (for each system, in dependency order)
  /skill:gamedev-design-system [name] ──────────────────────────────────────► design/gdd/[system].md
  /skill:gamedev-design-review [system].md ─────────────────────────────────► per-GDD review comments
        │
        ▼ (after all MVP GDDs done)
  /skill:gamedev-review-all-gdds ────────────────────────────────────────────► design/gdd/gdd-cross-review-[date].md
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to technical-setup
        │
        ▼
PHASE 3: TECHNICAL SETUP
  /skill:gamedev-create-architecture ────────────────────────────────────────► docs/architecture/master.md
  /skill:gamedev-architecture-decision (×N) ─────────────────────────────────► docs/architecture/[adr-nnn].md
  /skill:gamedev-architecture-review ────────────────────────────────────────► review report + docs/architecture/tr-registry.yaml
  /skill:gamedev-create-control-manifest ────────────────────────────────────► docs/architecture/control-manifest.md
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to pre-production
        │
        ▼
PHASE 4: PRE-PRODUCTION
  [UX — before epics, so specs exist when stories are written]
  /skill:gamedev-ux-design [screen/hud/patterns] ────────────────────────────► design/ux/*.md
  /skill:gamedev-ux-review ──────────────────────────────────────────────────► UX specs approved (HARD gate for /skill:gamedev-team-ui)

  [Test infrastructure — scaffold before stories reference tests]
  /skill:gamedev-test-setup ─────────────────────────────────────────────────► test framework + CI/CD pipeline
  /skill:gamedev-test-helpers ───────────────────────────────────────────────► tests/helpers/[engine-specific].gd

  [Vertical slice — before epics, validate full game loop]
  /skill:gamedev-vertical-slice ─────────────────────────────────────────────► prototypes/[name]-vertical-slice/REPORT.md
  /skill:gamedev-playtest-report ────────────────────────────────────────────► production/playtests/

  [Stories + milestone — only after vertical slice PROCEEDS]
  /skill:gamedev-create-epics [layer] ───────────────────────────────────────► production/epics/*/EPIC.md + Backlog milestone
  /skill:gamedev-create-stories [epic-slug] ─────────────────────────────────► production/epics/*/story-*.md + a Backlog task per story
  (prioritize the milestone's tasks on the Backlog board)
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to production
        │
        ▼
PHASE 5: PRODUCTION (continuous flow off the board)
  read the Backlog board ──────────────────────────────────────► current status (filter by milestone/status/label)
  /skill:gamedev-story-readiness [story] ────────────────────────────────────► story validated READY
        │
        ▼ (pull top ready task and implement)
  /skill:gamedev-dev-story [story] ──────────────────────────────────────────► routes to correct agent; sets task In Progress
        │
        ▼ (during implementation, as needed)
  /skill:gamedev-code-review ────────────────────────────────────────────────► code review report
  /skill:gamedev-scope-check ────────────────────────────────────────────────► scope creep detected / clear
  /skill:gamedev-content-audit ──────────────────────────────────────────────► GDD content gaps identified
  /skill:gamedev-bug-report ─────────────────────────────────────────────────► Backlog task with a `bug` label
  (triage = the Backlog board filtered by the `bug` label)

  [Team skills for feature areas — spawn when working a full feature]
  /skill:gamedev-team-combat / /skill:gamedev-team-narrative / /skill:gamedev-team-ui / /skill:gamedev-team-level / /skill:gamedev-team-audio

  [QA cycle — ongoing]
  /skill:gamedev-qa-plan ────────────────────────────────────────────────────► production/qa/qa-plan-[milestone].md
  /skill:gamedev-smoke-check ────────────────────────────────────────────────► smoke test gate (PASS/FAIL)
  /skill:gamedev-regression-suite ───────────────────────────────────────────► coverage gaps + missing regression tests
  /skill:gamedev-test-evidence-review ───────────────────────────────────────► evidence quality report
  /skill:gamedev-test-flakiness ─────────────────────────────────────────────► flaky test report
        │
        ▼
  /skill:gamedev-story-done [story] ─────────────────────────────────────────► task set Done + next task surfaced
        │
        ▼ (repeat; when a milestone's tasks are all Done)
  review milestone progress on the Backlog board ──────────────► completeness by status/label
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to polish
        │
        ▼
PHASE 6: POLISH
  /skill:gamedev-perf-profile ───────────────────────────────────────────────► perf report + fixes
  /skill:gamedev-balance-check ──────────────────────────────────────────────► balance report + fixes
  /skill:gamedev-asset-audit ────────────────────────────────────────────────► asset compliance report
  /skill:gamedev-tech-debt ──────────────────────────────────────────────────► docs/tech-debt-register.md
  /skill:gamedev-soak-test ──────────────────────────────────────────────────► soak test protocol + results
  /skill:gamedev-localize ───────────────────────────────────────────────────► localization readiness report
  /skill:gamedev-team-polish ────────────────────────────────────────────────► polish pass orchestrated
  /skill:gamedev-team-qa ────────────────────────────────────────────────────► full QA cycle sign-off
  /skill:gamedev-gate-check ─────────────────────────────────────────────────► PASS → advance to release
        │
        ▼
PHASE 7: RELEASE
  /skill:gamedev-launch-checklist ───────────────────────────────────────────► launch readiness report
  /skill:gamedev-release-checklist ──────────────────────────────────────────► platform-specific checklist
  /skill:gamedev-changelog ──────────────────────────────────────────────────► CHANGELOG.md
  /skill:gamedev-patch-notes ────────────────────────────────────────────────► player-facing notes
  /skill:gamedev-team-release ───────────────────────────────────────────────► release pipeline orchestrated
        │
        ▼ (post-launch, ongoing)
  /skill:gamedev-hotfix ─────────────────────────────────────────────────────► emergency fix with audit trail
  /skill:gamedev-team-live-ops ──────────────────────────────────────────────► live-ops content plan
```

---

## Skill Chain: /skill:gamedev-design-system in Detail

How a single GDD gets authored, reviewed, and handed to architecture:

```
systems-index.md (input)
game-concept.md (input)
upstream GDDs (input, if any)
        │
        ▼
/skill:gamedev-design-system [name]
        │
        ├── Pre-check: feasibility table + engine risk flags
        │
        ├── Section cycle × 8:
        │     question → options → decision → draft → approval → WRITE
        │     [each section written to file immediately after approval]
        │
        └── Output: design/gdd/[system].md (complete, all 8 sections)
                │
                ▼
        /skill:gamedev-design-review design/gdd/[system].md
                │
                ├── APPROVED → mark DONE in systems-index, proceed to next system
                ├── NEEDS REVISION → agent shows specific issues, re-enter section cycle
                └── MAJOR REVISION → significant redesign needed before next system
                        │
                        ▼ (after all MVP GDDs + cross-review)
                /skill:gamedev-review-all-gdds
                        │
                        └── Output: gdd-cross-review-[date].md
```

---

## Skill Chain: UX / UI Pipeline in Detail

UX specs are authored in Phase 4 (Pre-Production), before epics are written, so that story acceptance criteria can
reference specific UX artifacts.

```
design/gdd/*.md (UI/UX requirements extracted)
design/player-journey.md (emotional arc, if authored)
        │
        ▼
/skill:gamedev-ux-design hud              → design/ux/hud.md
/skill:gamedev-ux-design screen [name]    → design/ux/screens/[name].md
/skill:gamedev-ux-design patterns         → design/ux/interaction-patterns.md
        │
        ▼
/skill:gamedev-ux-review design/ux/
        │
        ├── APPROVED → UX specs ready, proceed to /skill:gamedev-create-epics
        ├── NEEDS REVISION → blocking issues listed → fix → re-run review
        └── MAJOR REVISION → fundamental UX problems → redesign before epics
                │
                ▼ (after APPROVED — in Phase 5 when implementing UI features)
        /skill:gamedev-team-ui
                │
                ├── Phase 1: /skill:gamedev-ux-design (if any specs still missing) + /skill:gamedev-ux-review
                ├── Phase 2: visual design (art-director)
                ├── Phase 3: layout implementation (ui-programmer)
                ├── Phase 4: accessibility audit (accessibility-specialist)
                └── Phase 5: final review

Note: /skill:gamedev-ux-design and /skill:gamedev-ux-review belong in Phase 4 (Pre-Production).
      /skill:gamedev-team-ui belongs in Phase 5 (Production) when a UI feature is being built.
```

---

## Skill Chain: Dev Story Flow in Detail

How a story moves from backlog to closed:

```
/skill:gamedev-story-readiness [story]
        │
        ├── READY → task stays To Do (ready) → pull for implementation
        ├── NEEDS WORK → agent shows specific gaps → resolve → re-run readiness
        └── BLOCKED → ADR still Proposed, or upstream story incomplete (task gets a `blocked` label)
                │
                ▼ (after READY)
        /skill:gamedev-dev-story [story]
                │
                ├── Reads: story file, linked GDD requirement, ADR decisions, control manifest
                ├── Routes to: gameplay-programmer / engine-programmer / ui-programmer / etc.
                │
                └── Implementation begins
                        │
                        ▼ (optional, during/after implementation)
                /skill:gamedev-code-review          → architectural review of changeset
                /skill:gamedev-scope-check          → verify no scope creep vs. original story criteria
                /skill:gamedev-test-evidence-review → validate test files and manual evidence quality
                        │
                        ▼
                /skill:gamedev-story-done [story]
                        │
                        ├── COMPLETE → task set Done on the board, next task surfaced
                        ├── COMPLETE WITH NOTES → complete but some criteria deferred (logged in `## Completion Notes`)
                        └── BLOCKED → acceptance criteria cannot be verified → investigate blocker
```

---

## Skill Chain: Story Lifecycle (Backlog to Closed)

How a story gets from backlog to closed (summary view):

```
/skill:gamedev-create-epics [layer]
        │
        └── Output: production/epics/[slug]/EPIC.md + a Backlog milestone
                │
                ▼
        /skill:gamedev-create-stories [epic-slug]
                │
                └── Output: production/epics/[slug]/story-NNN-[slug].md + a Backlog task
                            (task is To Do, or gets a `blocked` label if the ADR is Proposed)
                │
                ▼
        /skill:gamedev-story-readiness [story]
                │
                ├── READY → /skill:gamedev-dev-story → implement → /skill:gamedev-story-done
                ├── NEEDS WORK → resolve gaps → re-run
                └── BLOCKED → fix upstream dependency first
```

---

## Skill Chain: QA Pipeline in Detail

```
[Phase 4 — one-time infrastructure setup]
/skill:gamedev-test-setup ────────────────────────────────────────────────────► test framework scaffolded + CI/CD wired
/skill:gamedev-test-helpers ──────────────────────────────────────────────────► tests/helpers/[engine].gd (GDUnit4, NUnit, etc.)

[Phase 5 — ongoing QA cycle]
/skill:gamedev-qa-plan [milestone or feature]
        │
        ├── Reads: story files, GDDs, acceptance criteria
        ├── Classifies each story by test type:
        │     Logic → automated unit test (BLOCKING)
        │     Integration → integration test or documented playtest (BLOCKING)
        │     Visual/Feel → screenshot + lead sign-off (ADVISORY)
        │     UI → manual walkthrough or interaction test (ADVISORY)
        │     Config/Data → smoke check (ADVISORY)
        └── Output: production/qa/qa-plan-[milestone].md
                │
                ▼
        /skill:gamedev-smoke-check
                │
                ├── PASS → QA hand-off cleared
                └── FAIL → block QA hand-off → fix critical paths first
                        │
                        ▼
                /skill:gamedev-regression-suite
                        │
                        └── Coverage gaps + list of fixed bugs without regression tests
                                │
                                ▼
                        /skill:gamedev-test-evidence-review
                                │
                                └── Validates evidence quality, not just existence
                                        │
                                        ▼ (if CI run history available)
                        /skill:gamedev-test-flakiness
                                │
                                └── Flaky test report + fix recommendations

[Phase 6 — extended stability testing]
/skill:gamedev-soak-test ─────────────────────────────────────────────────────► soak test protocol + observed results
/skill:gamedev-team-qa ───────────────────────────────────────────────────────► full QA cycle sign-off for release gate

[Ongoing — bug management]
/skill:gamedev-bug-report ────────────────────────────────────────────────────► Backlog task with a `bug` label
(triage = the Backlog board filtered by the `bug` label)

[Meta — harness validation]
/skill:gamedev-skill-test [lint|spec|catalog] ────────────────────────────────► skill file structural + behavioral check
```

---

## Brownfield Onboarding Flow

For projects with existing work (use `/skill:gamedev-start` option D or run directly):

```
/skill:gamedev-project-stage-detect    → stage detection report
        │
        ▼
/skill:gamedev-adopt
        │
        ├── Phase 1: detect what exists
        ├── Phase 2: FORMAT audit (not just existence)
        ├── Phase 3: classify gaps (BLOCKING / HIGH / MEDIUM / LOW)
        ├── Phase 4: ordered migration plan
        ├── Phase 5: write docs/adoption-plan-[date].md
        └── Phase 6: fix most urgent gap inline (optional)
                │
                ▼
        /skill:gamedev-design-system retrofit [path]    → fills missing GDD sections
        /skill:gamedev-architecture-decision retrofit [path] → fills missing ADR sections
        /skill:gamedev-gate-check                       → where are you in the pipeline?
```

---

## How to Read These Diagrams

| Symbol | Meaning |
| -------- | --------- |
| `──►` | Produces this artifact |
| `│ ▼` | Flows into next step |
| `├──` | Branch (multiple possible outcomes) |
| `×N` | Runs N times (once per system, story, etc.) |
| `(input)` | Read by the skill but not produced here |
| `[optional]` | Not required for the gate to pass |
| `WRITE` (caps) | File written to disk immediately |

---

## Common Entry Points

| Where you are | Run this |
| --------------- | --------- |
| Brand new, no idea | `/skill:gamedev-start` → `/skill:gamedev-brainstorm` |
| Have a concept, no engine | `/skill:gamedev-setup-engine` |
| Have concept + engine | `/skill:gamedev-map-systems` |
| Mid-systems design | `/skill:gamedev-design-system [next system]` or `/skill:gamedev-map-systems next` |
| All GDDs done | `/skill:gamedev-review-all-gdds` → `/skill:gamedev-gate-check` |
| In technical setup | `/skill:gamedev-create-architecture` → `/skill:gamedev-architecture-decision` |
| Starting UX design | `/skill:gamedev-ux-design screen [name]` or `/skill:gamedev-ux-design hud` |
| Scaffolding tests | `/skill:gamedev-test-setup` → `/skill:gamedev-test-helpers` |
| Have stories, ready to code | `/skill:gamedev-story-readiness [story]` → `/skill:gamedev-dev-story [story]` |
| Story done | `/skill:gamedev-story-done [story]` |
| Running QA for a milestone | `/skill:gamedev-qa-plan` → `/skill:gamedev-smoke-check` → `/skill:gamedev-regression-suite` |
| Bug backlog needs sorting | Read the Backlog board filtered by the `bug` label |
| Extended stability testing | `/skill:gamedev-soak-test` |
| Not sure | `/skill:gamedev-help` |
| Existing project | `/skill:gamedev-adopt` |

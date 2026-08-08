# Skill Flow Diagrams

Visual maps of how skills chain together across the 7 development phases.
These show what runs before and after each skill, and what artifacts flow between them.

---

## Full Pipeline Overview (Zero to Ship)

```
PHASE 1: CONCEPT
  /gamedev:start ──────────────────────────────────────────────────────► routes to A/B/C/D
  /gamedev:brainstorm ──────────────────────────────────────────────────► design/gdd/game-concept.md
  /gamedev:setup-engine ────────────────────────────────────────────────► CLAUDE.md + technical-preferences.md
  /gamedev:prototype [core-mechanic] ───────────────────────────────────► prototypes/[name]-concept/REPORT.md
        │ PROCEED                                                  (validate idea BEFORE writing GDDs)
        ▼
  /gamedev:design-review [game-concept.md] ────────────────────────────► concept validated
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to systems-design
        │
        ▼
PHASE 2: SYSTEMS DESIGN
  /gamedev:map-systems ────────────────────────────────────────────────► design/gdd/systems-index.md
        │
        ▼ (for each system, in dependency order)
  /gamedev:design-system [name] ──────────────────────────────────────► design/gdd/[system].md
  /gamedev:design-review [system].md ─────────────────────────────────► per-GDD review comments
        │
        ▼ (after all MVP GDDs done)
  /gamedev:review-all-gdds ────────────────────────────────────────────► design/gdd/gdd-cross-review-[date].md
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to technical-setup
        │
        ▼
PHASE 3: TECHNICAL SETUP
  /gamedev:create-architecture ────────────────────────────────────────► docs/architecture/master.md
  /gamedev:architecture-decision (×N) ─────────────────────────────────► docs/architecture/[adr-nnn].md
  /gamedev:architecture-review ────────────────────────────────────────► review report + docs/architecture/tr-registry.yaml
  /gamedev:create-control-manifest ────────────────────────────────────► docs/architecture/control-manifest.md
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to pre-production
        │
        ▼
PHASE 4: PRE-PRODUCTION
  [UX — before epics, so specs exist when stories are written]
  /gamedev:ux-design [screen/hud/patterns] ────────────────────────────► design/ux/*.md
  /gamedev:ux-review ──────────────────────────────────────────────────► UX specs approved (HARD gate for /gamedev:team-ui)

  [Test infrastructure — scaffold before stories reference tests]
  /gamedev:test-setup ─────────────────────────────────────────────────► test framework + CI/CD pipeline
  /gamedev:test-helpers ───────────────────────────────────────────────► tests/helpers/[engine-specific].gd

  [Vertical slice — before epics, validate full game loop]
  /gamedev:vertical-slice ─────────────────────────────────────────────► prototypes/[name]-vertical-slice/REPORT.md
  /gamedev:playtest-report ────────────────────────────────────────────► production/playtests/

  [Stories + milestone — only after vertical slice PROCEEDS]
  /gamedev:create-epics [layer] ───────────────────────────────────────► production/epics/*/EPIC.md + Backlog milestone
  /gamedev:create-stories [epic-slug] ─────────────────────────────────► production/epics/*/story-*.md + a Backlog task per story
  (prioritize the milestone's tasks on the Backlog board)
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to production
        │
        ▼
PHASE 5: PRODUCTION (continuous flow off the board)
  read the Backlog board ──────────────────────────────────────► current status (filter by milestone/status/label)
  /gamedev:story-readiness [story] ────────────────────────────────────► story validated READY
        │
        ▼ (pull top ready task and implement)
  /gamedev:dev-story [story] ──────────────────────────────────────────► routes to correct agent; sets task In Progress
        │
        ▼ (during implementation, as needed)
  /gamedev:code-review ────────────────────────────────────────────────► code review report
  /gamedev:scope-check ────────────────────────────────────────────────► scope creep detected / clear
  /gamedev:content-audit ──────────────────────────────────────────────► GDD content gaps identified
  /gamedev:bug-report ─────────────────────────────────────────────────► Backlog task with a `bug` label
  (triage = the Backlog board filtered by the `bug` label)

  [Team skills for feature areas — spawn when working a full feature]
  /gamedev:team-combat / /gamedev:team-narrative / /gamedev:team-ui / /gamedev:team-level / /gamedev:team-audio

  [QA cycle — ongoing]
  /gamedev:qa-plan ────────────────────────────────────────────────────► production/qa/qa-plan-[milestone].md
  /gamedev:smoke-check ────────────────────────────────────────────────► smoke test gate (PASS/FAIL)
  /gamedev:regression-suite ───────────────────────────────────────────► coverage gaps + missing regression tests
  /gamedev:test-evidence-review ───────────────────────────────────────► evidence quality report
  /gamedev:test-flakiness ─────────────────────────────────────────────► flaky test report
        │
        ▼
  /gamedev:story-done [story] ─────────────────────────────────────────► task set Done + next task surfaced
        │
        ▼ (repeat; when a milestone's tasks are all Done)
  review milestone progress on the Backlog board ──────────────► completeness by status/label
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to polish
        │
        ▼
PHASE 6: POLISH
  /gamedev:perf-profile ───────────────────────────────────────────────► perf report + fixes
  /gamedev:balance-check ──────────────────────────────────────────────► balance report + fixes
  /gamedev:asset-audit ────────────────────────────────────────────────► asset compliance report
  /gamedev:tech-debt ──────────────────────────────────────────────────► docs/tech-debt-register.md
  /gamedev:soak-test ──────────────────────────────────────────────────► soak test protocol + results
  /gamedev:localize ───────────────────────────────────────────────────► localization readiness report
  /gamedev:team-polish ────────────────────────────────────────────────► polish pass orchestrated
  /gamedev:team-qa ────────────────────────────────────────────────────► full QA cycle sign-off
  /gamedev:gate-check ─────────────────────────────────────────────────► PASS → advance to release
        │
        ▼
PHASE 7: RELEASE
  /gamedev:launch-checklist ───────────────────────────────────────────► launch readiness report
  /gamedev:release-checklist ──────────────────────────────────────────► platform-specific checklist
  /gamedev:changelog ──────────────────────────────────────────────────► CHANGELOG.md
  /gamedev:patch-notes ────────────────────────────────────────────────► player-facing notes
  /gamedev:team-release ───────────────────────────────────────────────► release pipeline orchestrated
        │
        ▼ (post-launch, ongoing)
  /gamedev:hotfix ─────────────────────────────────────────────────────► emergency fix with audit trail
  /gamedev:team-live-ops ──────────────────────────────────────────────► live-ops content plan
```

---

## Skill Chain: /gamedev:design-system in Detail

How a single GDD gets authored, reviewed, and handed to architecture:

```
systems-index.md (input)
game-concept.md (input)
upstream GDDs (input, if any)
        │
        ▼
/gamedev:design-system [name]
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
        /gamedev:design-review design/gdd/[system].md
                │
                ├── APPROVED → mark DONE in systems-index, proceed to next system
                ├── NEEDS REVISION → agent shows specific issues, re-enter section cycle
                └── MAJOR REVISION → significant redesign needed before next system
                        │
                        ▼ (after all MVP GDDs + cross-review)
                /gamedev:review-all-gdds
                        │
                        └── Output: gdd-cross-review-[date].md
```

---

## Skill Chain: UX / UI Pipeline in Detail

UX specs are authored in Phase 4 (Pre-Production), before epics are written, so
that story acceptance criteria can reference specific UX artifacts.

```
design/gdd/*.md (UI/UX requirements extracted)
design/player-journey.md (emotional arc, if authored)
        │
        ▼
/gamedev:ux-design hud              → design/ux/hud.md
/gamedev:ux-design screen [name]    → design/ux/screens/[name].md
/gamedev:ux-design patterns         → design/ux/interaction-patterns.md
        │
        ▼
/gamedev:ux-review design/ux/
        │
        ├── APPROVED → UX specs ready, proceed to /gamedev:create-epics
        ├── NEEDS REVISION → blocking issues listed → fix → re-run review
        └── MAJOR REVISION → fundamental UX problems → redesign before epics
                │
                ▼ (after APPROVED — in Phase 5 when implementing UI features)
        /gamedev:team-ui
                │
                ├── Phase 1: /gamedev:ux-design (if any specs still missing) + /gamedev:ux-review
                ├── Phase 2: visual design (art-director)
                ├── Phase 3: layout implementation (ui-programmer)
                ├── Phase 4: accessibility audit (accessibility-specialist)
                └── Phase 5: final review

Note: /gamedev:ux-design and /gamedev:ux-review belong in Phase 4 (Pre-Production).
      /gamedev:team-ui belongs in Phase 5 (Production) when a UI feature is being built.
```

---

## Skill Chain: Dev Story Flow in Detail

How a story moves from backlog to closed:

```
/gamedev:story-readiness [story]
        │
        ├── READY → task stays To Do (ready) → pull for implementation
        ├── NEEDS WORK → agent shows specific gaps → resolve → re-run readiness
        └── BLOCKED → ADR still Proposed, or upstream story incomplete (task gets a `blocked` label)
                │
                ▼ (after READY)
        /gamedev:dev-story [story]
                │
                ├── Reads: story file, linked GDD requirement, ADR decisions, control manifest
                ├── Routes to: gameplay-programmer / engine-programmer / ui-programmer / etc.
                │
                └── Implementation begins
                        │
                        ▼ (optional, during/after implementation)
                /gamedev:code-review          → architectural review of changeset
                /gamedev:scope-check          → verify no scope creep vs. original story criteria
                /gamedev:test-evidence-review → validate test files and manual evidence quality
                        │
                        ▼
                /gamedev:story-done [story]
                        │
                        ├── COMPLETE → task set Done on the board, next task surfaced
                        ├── COMPLETE WITH NOTES → complete but some criteria deferred (logged in `## Completion Notes`)
                        └── BLOCKED → acceptance criteria cannot be verified → investigate blocker
```

---

## Skill Chain: Story Lifecycle (Backlog to Closed)

How a story gets from backlog to closed (summary view):

```
/gamedev:create-epics [layer]
        │
        └── Output: production/epics/[slug]/EPIC.md + a Backlog milestone
                │
                ▼
        /gamedev:create-stories [epic-slug]
                │
                └── Output: production/epics/[slug]/story-NNN-[slug].md + a Backlog task
                            (task is To Do, or gets a `blocked` label if the ADR is Proposed)
                │
                ▼
        /gamedev:story-readiness [story]
                │
                ├── READY → /gamedev:dev-story → implement → /gamedev:story-done
                ├── NEEDS WORK → resolve gaps → re-run
                └── BLOCKED → fix upstream dependency first
```

---

## Skill Chain: QA Pipeline in Detail

```
[Phase 4 — one-time infrastructure setup]
/gamedev:test-setup ────────────────────────────────────────────────────► test framework scaffolded + CI/CD wired
/gamedev:test-helpers ──────────────────────────────────────────────────► tests/helpers/[engine].gd (GDUnit4, NUnit, etc.)

[Phase 5 — ongoing QA cycle]
/gamedev:qa-plan [milestone or feature]
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
        /gamedev:smoke-check
                │
                ├── PASS → QA hand-off cleared
                └── FAIL → block QA hand-off → fix critical paths first
                        │
                        ▼
                /gamedev:regression-suite
                        │
                        └── Coverage gaps + list of fixed bugs without regression tests
                                │
                                ▼
                        /gamedev:test-evidence-review
                                │
                                └── Validates evidence quality, not just existence
                                        │
                                        ▼ (if CI run history available)
                        /gamedev:test-flakiness
                                │
                                └── Flaky test report + fix recommendations

[Phase 6 — extended stability testing]
/gamedev:soak-test ─────────────────────────────────────────────────────► soak test protocol + observed results
/gamedev:team-qa ───────────────────────────────────────────────────────► full QA cycle sign-off for release gate

[Ongoing — bug management]
/gamedev:bug-report ────────────────────────────────────────────────────► Backlog task with a `bug` label
(triage = the Backlog board filtered by the `bug` label)

[Meta — harness validation]
/gamedev:skill-test [lint|spec|catalog] ────────────────────────────────► skill file structural + behavioral check
```

---

## Brownfield Onboarding Flow

For projects with existing work (use `/gamedev:start` option D or run directly):

```
/gamedev:project-stage-detect    → stage detection report
        │
        ▼
/gamedev:adopt
        │
        ├── Phase 1: detect what exists
        ├── Phase 2: FORMAT audit (not just existence)
        ├── Phase 3: classify gaps (BLOCKING / HIGH / MEDIUM / LOW)
        ├── Phase 4: ordered migration plan
        ├── Phase 5: write docs/adoption-plan-[date].md
        └── Phase 6: fix most urgent gap inline (optional)
                │
                ▼
        /gamedev:design-system retrofit [path]    → fills missing GDD sections
        /gamedev:architecture-decision retrofit [path] → fills missing ADR sections
        /gamedev:gate-check                       → where are you in the pipeline?
```

---

## How to Read These Diagrams

| Symbol | Meaning |
|--------|---------|
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
|---------------|---------|
| Brand new, no idea | `/gamedev:start` → `/gamedev:brainstorm` |
| Have a concept, no engine | `/gamedev:setup-engine` |
| Have concept + engine | `/gamedev:map-systems` |
| Mid-systems design | `/gamedev:design-system [next system]` or `/gamedev:map-systems next` |
| All GDDs done | `/gamedev:review-all-gdds` → `/gamedev:gate-check` |
| In technical setup | `/gamedev:create-architecture` → `/gamedev:architecture-decision` |
| Starting UX design | `/gamedev:ux-design screen [name]` or `/gamedev:ux-design hud` |
| Scaffolding tests | `/gamedev:test-setup` → `/gamedev:test-helpers` |
| Have stories, ready to code | `/gamedev:story-readiness [story]` → `/gamedev:dev-story [story]` |
| Story done | `/gamedev:story-done [story]` |
| Running QA for a milestone | `/gamedev:qa-plan` → `/gamedev:smoke-check` → `/gamedev:regression-suite` |
| Bug backlog needs sorting | Read the Backlog board filtered by the `bug` label |
| Extended stability testing | `/gamedev:soak-test` |
| Not sure | `/gamedev:help` |
| Existing project | `/gamedev:adopt` |

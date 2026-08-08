# Available Skills (Slash Commands)

73 slash commands organized by phase. Type `/` in Claude Code to access any of them.

## Onboarding & Navigation

| Command | Purpose |
|---------|---------|
| `/gamedev:start` | First-time onboarding — asks where you are, then guides you to the right workflow |
| `/gamedev:help` | Context-aware "what do I do next?" — reads current stage and surfaces the required next step |
| `/gamedev:project-stage-detect` | Full project audit — detect phase, identify existence gaps, recommend next steps |
| `/gamedev:setup-engine` | Configure engine + version, detect knowledge gaps, populate version-aware reference docs |
| `/gamedev:adopt` | Brownfield format audit — checks internal structure of existing GDDs/ADRs/stories, produces migration plan |

## Game Design

| Command | Purpose |
|---------|---------|
| `/gamedev:brainstorm` | Guided ideation using professional studio methods (MDA, SDT, Bartle, verb-first) |
| `/gamedev:map-systems` | Decompose game concept into systems, map dependencies, prioritize design order |
| `/gamedev:design-system` | Guided, section-by-section GDD authoring for a single game system |
| `/gamedev:quick-design` | Lightweight design spec for small changes — tuning, tweaks, minor additions |
| `/gamedev:review-all-gdds` | Cross-GDD consistency and game design holism review across all design docs |
| `/gamedev:propagate-design-change` | When a GDD is revised, find affected ADRs and produce an impact report |

## Art & Assets

| Command | Purpose |
|---------|---------|
| `/gamedev:art-bible` | Guided, section-by-section Art Bible authoring — creates visual identity spec before asset production begins |
| `/gamedev:asset-spec` | Generate per-asset visual specifications and AI generation prompts from GDDs, level docs, or character profiles |
| `/gamedev:asset-audit` | Audit assets for naming conventions, file size budgets, and pipeline compliance |

## UX & Interface Design

| Command | Purpose |
|---------|---------|
| `/gamedev:ux-design` | Guided section-by-section UX spec authoring (screen/flow, HUD, or pattern library) |
| `/gamedev:ux-review` | Validate UX specs for GDD alignment, accessibility, and pattern compliance |

## Architecture

| Command | Purpose |
|---------|---------|
| `/gamedev:create-architecture` | Guided authoring of the master architecture document |
| `/gamedev:architecture-decision` | Create an Architecture Decision Record (ADR) |
| `/gamedev:architecture-review` | Validate all ADRs for completeness, dependency ordering, and GDD coverage |
| `/gamedev:create-control-manifest` | Generate flat programmer rules sheet from accepted ADRs |

## Stories & Sprints

| Command | Purpose |
|---------|---------|
| `/gamedev:create-epics` | Translate GDDs + ADRs into epics — one per architectural module |
| `/gamedev:create-stories` | Break a single epic into implementable story files |
| `/gamedev:dev-story` | Read a story and implement it — routes to the correct programmer agent |
| `/gamedev:story-readiness` | Validate a story is implementation-ready before pickup (READY/NEEDS WORK/BLOCKED) |
| `/gamedev:story-done` | 8-phase completion review after implementation; sets the Backlog task to Done, surfaces next task |
| `/gamedev:estimate` | Structured effort estimate with complexity, dependencies, and risk breakdown |

## Reviews & Analysis

| Command | Purpose |
|---------|---------|
| `/gamedev:design-review` | Review a game design document for completeness and consistency |
| `/gamedev:code-review` | Architectural code review for a file or changeset |
| `/gamedev:balance-check` | Analyze game balance data, formulas, and config — flag outliers |
| `/gamedev:content-audit` | Audit GDD-specified content counts against implemented content |
| `/gamedev:scope-check` | Analyze feature or sprint scope against original plan, flag scope creep |
| `/gamedev:perf-profile` | Structured performance profiling with bottleneck identification |
| `/gamedev:tech-debt` | Scan, track, prioritize, and report on technical debt |
| `/gamedev:gate-check` | Validate readiness to advance between development phases (PASS/CONCERNS/FAIL) |
| `/gamedev:consistency-check` | Scan all GDDs against the entity registry to detect cross-document inconsistencies (stats, names, rules that contradict each other) |
| `/gamedev:security-audit` | Audit the game for security vulnerabilities: save tampering, cheat vectors, network exploits, data exposure, and input validation gaps |

## QA & Testing

| Command | Purpose |
|---------|---------|
| `/gamedev:qa-plan` | Generate a QA test plan for a sprint or feature |
| `/gamedev:smoke-check` | Run critical path smoke test gate before QA hand-off |
| `/gamedev:soak-test` | Generate a soak test protocol for extended play sessions |
| `/gamedev:regression-suite` | Map test coverage to GDD critical paths, identify fixed bugs without regression tests |
| `/gamedev:test-setup` | Scaffold the test framework and CI/CD pipeline for the project's engine |
| `/gamedev:test-helpers` | Generate engine-specific test helper libraries for the test suite |
| `/gamedev:test-evidence-review` | Quality review of test files and manual evidence documents |
| `/gamedev:test-flakiness` | Detect non-deterministic (flaky) tests from CI run logs |
| `/gamedev:skill-test` | Validate skill files for structural compliance and behavioral correctness |
| `/gamedev:skill-improve` | Improve a skill using a test-fix-retest loop — diagnose, propose fix, rewrite, verify |

## Production

| Command | Purpose |
|---------|---------|
| `/gamedev:bug-report` | File a bug as a Backlog task (bug label); verify/close drive its status |
| `/gamedev:reverse-document` | Generate design or architecture docs from existing implementation |
| `/gamedev:playtest-report` | Generate a structured playtest report or analyze existing playtest notes |

> Work items (stories, bugs, epics→milestones) live on the **Backlog board**, not
> in sprint files. There are no sprint-plan/sprint-status/retrospective/milestone-review
> skills — track and prioritise work directly on the board (continuous flow).

## Release

| Command | Purpose |
|---------|---------|
| `/gamedev:release-checklist` | Generate and validate a pre-release checklist for the current build |
| `/gamedev:launch-checklist` | Complete launch readiness validation across all departments |
| `/gamedev:changelog` | Auto-generate changelog from git commits and Backlog data |
| `/gamedev:patch-notes` | Generate player-facing patch notes from git history and internal data |
| `/gamedev:hotfix` | Emergency fix workflow with audit trail, bypassing the normal flow |

## Creative & Content

| Command | Purpose |
|---------|---------|
| `/gamedev:prototype` | Concept prototype — throwaway build right after brainstorm to validate core idea (Phase 1) |
| `/gamedev:vertical-slice` | Pre-Production validation — production-quality end-to-end build before committing to Production (Phase 4) |
| `/gamedev:localize` | Localization workflow: string extraction, validation, translation readiness |

## Team Orchestration

Coordinate multiple agents on a single feature area:

| Command | Coordinates |
|---------|-------------|
| `/gamedev:team-combat` | game-designer + gameplay-programmer + ai-programmer + technical-artist + sound-designer + qa-tester |
| `/gamedev:team-narrative` | narrative-director + writer + world-builder + level-designer |
| `/gamedev:team-ui` | ux-designer + ui-programmer + art-director + accessibility-specialist |
| `/gamedev:team-release` | release-manager + qa-lead + devops-engineer + producer |
| `/gamedev:team-polish` | performance-analyst + technical-artist + sound-designer + qa-tester |
| `/gamedev:team-audio` | audio-director + sound-designer + technical-artist + gameplay-programmer |
| `/gamedev:team-level` | level-designer + narrative-director + world-builder + art-director + systems-designer + qa-tester |
| `/gamedev:team-live-ops` | live-ops-designer + economy-designer + community-manager + analytics-engineer |
| `/gamedev:team-qa` | qa-lead + qa-tester + gameplay-programmer + producer |

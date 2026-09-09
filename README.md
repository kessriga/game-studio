<p align="center">
  <h1 align="center">Game Studio</h1>
  <p align="center">
    Host-neutral game workflows, with Pi integration.
    <br />
    53 specialist roles. 72 skills. One shared workflow.
  </p>
</p>

---

## Shared workflows, Pi integration

Game Studio ships 72 shared skills, 53 specialist role guides, and the Pi package `@kessriga/gamedev`. See
[Getting Started](#getting-started), [verified capabilities](STATUS.md), and the [host guide](docs/host-runtime.md).
Other runtimes may read the workflows but have no shipped integration.

Logical identifiers such as `gamedev:brainstorm` name shared workflows. In Pi use `/skill:gamedev-start` or
`/skill:gamedev-brainstorm cozy farming`. The [Pi guide](docs/pi.md) covers installation, available-runner delegation,
progress tracking, and user approvals. The package supplies role instructions, not a subagent runner. Sequential role
passes are not independent review.

Upgrading an existing project? Follow the [reviewed 0.4 migration](docs/migration-0.4.md) before scaffolding.

## Why This Exists

Game Studio organizes game development into design, architecture, implementation, review, and release workflows. Its
roles define responsibilities, edit boundaries, and escalation paths. You keep control of creative decisions and phase
advancement.

These are workflows, not guarantees of quality. Validate generated work, run the game's checks, and distinguish an
independent review from a role pass in the same session.

---

## Table of Contents

- [What's Included](#whats-included)
- [Studio Hierarchy](#studio-hierarchy)
- [Usage Guide](#usage-guide)
- [Skill Catalog](#skill-catalog)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Design Philosophy](#design-philosophy)
- [Customization](#customization)
- [License](#license)

---

## What's Included

| Category | Count | Description |
| ---------- | ------- | ------------- |
| **Specialist roles** | 53 | Design, programming, art, audio, narrative, QA, and production expertise; delegated or followed as role passes according to host capabilities |
| **Skills** | 72 | Workflows for every phase (`gamedev:start`, `gamedev:design-system`, `gamedev:create-epics`, `gamedev:create-stories`, `gamedev:dev-story`, `gamedev:story-done`, etc.) |
| **Rules** | 11 | Coding standards for matching project paths; read explicitly using their path patterns |
| **Templates** | 39 | Document templates for GDDs, UX specs, ADRs, HUD design, accessibility, and more |

## Studio Hierarchy

Specialist roles are organized into three tiers, matching how real studios operate:

```
Tier 1 — Directors
  creative-director    technical-director    producer

Tier 2 — Department Leads
  game-designer        lead-programmer       art-director
  audio-director       narrative-director    qa-lead
  release-manager      localization-lead

Tier 3 — Specialists
  gameplay-programmer  engine-programmer     ai-programmer
  network-programmer   tools-programmer      ui-programmer
  systems-designer     level-designer        economy-designer
  technical-artist     sound-designer        writer
  world-builder        ux-designer           prototyper
  performance-analyst  devops-engineer       analytics-engineer
  security-engineer    qa-tester             accessibility-specialist
  live-ops-designer    community-manager
```

The tiers define responsibility and review authority. Follow the [coordination rules](docs/coordination-rules.md) when
delegating work. Each host controls model selection; it does not change a role's responsibilities.

### Engine Specialists

The package includes agent sets for four engines. Use the set that matches your project:

| Engine | Lead Agent | Sub-Specialists |
| -------- | ----------- | ----------------- |
| **Godot 4** | `godot-specialist` | GDScript, C#, Shaders, GDExtension |
| **Unity** | `unity-specialist` | DOTS/ECS, Shaders/VFX, Addressables, UI Toolkit |
| **Unreal Engine 5** | `unreal-specialist` | GAS, Blueprints, Replication, UMG/CommonUI |
| **Bevy** | `bevy-specialist` | Rust/ECS, Rendering/WGSL, bevy_ui |

## Usage Guide

Seventy-two commands is a lot to face on day one — but **you never memorize them.** Four navigation commands read your
project's actual state and tell you what to run next; the rest fall into a pipeline you walk once, front to back, plus a
handful you reach for only when the situation calls.

### The self-navigating loop

| Command | Answers |
| --------- | --------- |
| `gamedev:start` | *"I'm new — where do I begin?"* Routes a fresh or existing project into the right phase. |
| `gamedev:status` | *"Where am I?"* Prints the current production stage and Epic > Feature > Task breadcrumb. |
| `gamedev:help [what you just finished]` | *"What's next?"* Reads your phase and artifacts, then names the next command. |
| `gamedev:project-stage-detect` | *"What am I missing?"* Full gap analysis — deeper than `help`. |

The rhythm is: run a command → run `gamedev:help` → it names the next one → repeat. You never have to hold the whole map
in your head — `help` keeps your place.

### Set your review mode first

On a fresh project, `gamedev:start` asks one question that shapes every later step: how much director review do you want
as you work?

- **`solo`** (default) — no director reviews. Maximum speed; best for solo devs, game jams, and prototypes.
- **`lean`** — directors review only at phase-gate transitions (`gamedev:gate-check`).
- **`full`** — director specialists review at each key step. Best for teams, or for learning the workflow.

Your choice is saved to `production/review-mode.txt`. Override it for any single run with `--review solo|lean|full` on
the command.

### The pipeline — seven phases, walked once

Each phase produces a few durable artifacts the next phase builds on. The **Minimum path** is the shortest legal route
through a phase; **Optional adds** buy extra rigor where the risk justifies it (a first mechanic, a large team, a shaky
concept).

| Phase | You produce | Minimum path | Optional adds |
| ------- | ------------- | -------------- | --------------- |
| **1. Concept** | Game concept, art bible, systems map | `gamedev:brainstorm` → `gamedev:setup-engine` → `gamedev:art-bible` → `gamedev:map-systems` | `gamedev:design-review` on the concept |
| **2. Systems Design** | One approved GDD per system | `gamedev:design-system` (once per system) → `gamedev:review-all-gdds` | `gamedev:consistency-check` |
| **3. Technical Setup** | Architecture, ADRs, control manifest | `gamedev:create-architecture` → `gamedev:architecture-decision` (×3+) → `gamedev:architecture-review` → `gamedev:create-control-manifest` | — |
| **4. Pre-Production** | UX + accessibility specs, a filled Backlog board | `gamedev:ux-design` → `gamedev:ux-review` → `gamedev:create-epics` → `gamedev:create-stories` | `gamedev:asset-spec`, `gamedev:prototype`, `gamedev:test-setup`, `gamedev:vertical-slice` |
| **5. Production** | Implemented, reviewed features | the daily loop below | `gamedev:story-readiness`, `gamedev:code-review`, `gamedev:qa-plan`, `gamedev:team-*` |
| **6. Polish** | Shippable quality | `gamedev:playtest-report` (×3) → `gamedev:team-polish` | `gamedev:perf-profile`, `gamedev:balance-check`, `gamedev:asset-audit` |
| **7. Release** | A shipped game | `gamedev:release-checklist` → `gamedev:launch-checklist` | `gamedev:patch-notes`, `gamedev:changelog` |

Phase gates are **advisory**: `gamedev:help` and `gamedev:gate-check` tell you when a phase looks complete, but you
always decide when to advance.

### The daily loop (Phase 5)

You spend most of the project here, repeating one short cycle per story off the Backlog board:

```
gamedev:dev-story [story]     # implement — routes to the right programmer agent
      ↓
gamedev:code-review           # optional architectural pass
      ↓
gamedev:story-done [story]    # verify acceptance criteria, close it, surface the next story
```

`gamedev:story-done` hands you the next ready story, so the loop feeds itself. When a feature spans several domains at
once — combat, a full UI flow, an audio pass — reach for a **team** command (`gamedev:team-combat`, `gamedev:team-ui`,
`gamedev:team-audio`, and the rest) to coordinate all the relevant agents in one go.

### Everything else is on-demand

The remaining commands aren't part of the linear walk — reviews and analysis (`gamedev:balance-check`,
`gamedev:scope-check`, `gamedev:security-audit`), QA (`gamedev:qa-plan`, `gamedev:smoke-check`,
`gamedev:regression-suite`), bug and hotfix flows, and localization. You run them when the situation calls for it, and
`gamedev:help` will point at the relevant ones for your current phase. The complete reference is below.

## Skill Catalog

This is the complete reference; see the [Usage Guide](#usage-guide) above for the workflow that decides which to run
when. Use the invocation prefix shown above or select a skill from your host's picker. Arguments in `[brackets]` are
optional, `<angle brackets>` required. Most authoring, team, and gate skills also accept a review-depth flag —
`--review full|lean|solo` (`--depth` for `gamedev:design-review`) — omitted below for brevity.

**Onboarding & Navigation**

- `gamedev:start` — first-time onboarding: asks where you are, then routes you to the right workflow
- `gamedev:help [what you just finished]` — advice on what to do next, based on current project state
- `gamedev:status` — print the current production stage and Epic > Feature > Task breadcrumb
- `gamedev:project-stage-detect [role filter]` — analyze project state, detect the stage, identify gaps, recommend next
  steps
- `gamedev:setup-engine [engine] [version] | refresh | upgrade <old> <new>` — pin the project's engine and version,
  populate engine reference docs
- `gamedev:adopt [full|gdds|adrs|stories|infra]` — brownfield onboarding: audit existing artifacts for format
  compliance, produce a migration plan

**Game Design**

- `gamedev:brainstorm [genre or theme hint]` — guided ideation from zero idea to a structured game concept document
- `gamedev:map-systems [next | system-name]` — decompose the concept into systems, map dependencies, set the design
  order
- `gamedev:design-system <system-name>` — guided, section-by-section GDD authoring for one system
- `gamedev:quick-design [change description]` — lightweight design spec for tuning adjustments and minor mechanics
- `gamedev:review-all-gdds [focus]` — holistic cross-GDD review: contradictions, stale references, design-theory
  violations
- `gamedev:propagate-design-change [path/to/gdd.md]` — find ADRs made stale by a GDD revision and guide resolution

**Art & Assets**

- `gamedev:art-bible` — guided Art Bible authoring; the visual identity spec that gates asset production
- `gamedev:asset-spec [system:|level:|character:<name>]` — per-asset visual specs and AI generation prompts from GDDs
- `gamedev:asset-audit [category|all]` — audit assets against naming, size, format, and pipeline standards

**UX & Interface Design**

- `gamedev:ux-design [screen/flow | hud | patterns]` — guided UX spec authoring for a screen, flow, or HUD
- `gamedev:ux-review [file | all | hud | patterns]` — validate UX specs for completeness, accessibility, and GDD
  alignment

**Architecture**

- `gamedev:create-architecture [focus-area]` — guided authoring of the master architecture document from all GDDs
- `gamedev:architecture-decision [title]` — record an ADR: context, alternatives considered, consequences
- `gamedev:architecture-review [focus]` — validate architecture against all GDDs; traceability matrix and
  PASS/CONCERNS/FAIL verdict
- `gamedev:create-control-manifest [update]` — flat must-do/never-do rules sheet for programmers, extracted from
  accepted ADRs

**Stories**

- `gamedev:create-epics [system-name | layer | all]` — translate approved GDDs and architecture into epics, one per
  module
- `gamedev:create-stories [epic-slug]` — break one epic into implementable story files with embedded GDD/ADR context
- `gamedev:dev-story [story-path]` — implement a story end-to-end: load context, route to the right programmer agent,
  code and test
- `gamedev:story-readiness [story | all | milestone]` — READY / NEEDS WORK / BLOCKED verdict before implementation
  starts
- `gamedev:story-done [story-path]` — end-of-story review: verify acceptance criteria, close the Backlog task, surface
  the next one
- `gamedev:estimate [task-description]` — effort estimate from complexity, dependencies, historical velocity, and risk

**Reviews & Analysis**

- `gamedev:design-review [path-to-doc]` — review one design doc for completeness, consistency, and implementability
- `gamedev:code-review [path]` — architectural and quality review: standards, patterns, SOLID, testability, performance
- `gamedev:balance-check [system | data-file]` — find outliers, broken progressions, degenerate strategies, economy
  imbalances
- `gamedev:content-audit [system | --summary]` — compare GDD-specified content counts against what's implemented
- `gamedev:scope-check [feature | sprint-N]` — detect scope creep against the original plan; quantify bloat, recommend
  cuts
- `gamedev:perf-profile [system | full]` — structured profiling: bottlenecks, budget comparisons, prioritized
  recommendations
- `gamedev:tech-debt [scan|add|prioritize|report]` — track and prioritize technical debt in a debt register
- `gamedev:gate-check [target-phase]` — phase-gate readiness verdict (PASS/CONCERNS/FAIL) with specific blockers
- `gamedev:consistency-check [full | entity:<name> | item:<name>]` — cross-GDD scan for conflicting stats, values, and
  formulas
- `gamedev:security-audit [full | network | save | input | quick]` — save-tampering, cheat, network, and
  input-validation audit

**QA & Testing**

- `gamedev:qa-plan [milestone | feature | story]` — QA test plan: classify stories by test type, define required
  coverage
- `gamedev:smoke-check [milestone | quick]` — critical-path smoke gate before QA hand-off; PASS/FAIL report
- `gamedev:soak-test [duration] [focus]` — protocol for extended play sessions: slow leaks, fatigue effects, edge cases
- `gamedev:regression-suite [update | audit | report]` — map tests to GDD critical paths, catch fixed bugs lacking
  regression tests
- `gamedev:test-setup [force]` — scaffold the engine-specific test framework and CI pipeline (run once)
- `gamedev:test-helpers [system | all | scaffold]` — generate engine-specific assertion, factory, and mock helpers
- `gamedev:test-evidence-review [story | milestone | system]` — quality review of tests and manual evidence; verdict per
  story
- `gamedev:test-flakiness [ci-log | scan | registry]` — detect non-deterministic tests, recommend quarantine or fix
- `gamedev:skill-test static|spec|category|audit [skill]` — validate the framework's own skills, structurally and
  behaviorally
- `gamedev:skill-improve [skill-name]` — improve a skill via a test-fix-retest loop

**Production**

- `gamedev:bug-report [description] | analyze <path> | verify <id> | close <id>` — structured bug reports as Backlog
  tasks with repro steps
- `gamedev:reverse-document <type> <path>` — generate missing design or architecture docs from existing code
- `gamedev:playtest-report [new | analyze <path>]` — standardized playtest feedback collection and analysis

**Release**

- `gamedev:release-checklist [platform]` — pre-release validation: build verification, certification, store metadata
- `gamedev:launch-checklist [date | dry-run]` — launch readiness across every department, with go/no-go sign-offs
- `gamedev:changelog [version | sprint]` — internal and player-facing changelogs from commits and sprint data
- `gamedev:patch-notes [version] [--style brief|detailed|full]` — player-facing patch notes, translated from developer
  language
- `gamedev:hotfix [bug-id]` — emergency fix workflow with a full audit trail, bypassing the normal sprint process

**Creative & Content**

- `gamedev:prototype [concept] [--path html|engine|paper] [--spike]` — throwaway concept prototype with a
  PROCEED/PIVOT/KILL verdict
- `gamedev:vertical-slice` — production-quality end-to-end build gating the Pre-Production → Production transition
- `gamedev:localize [scan|extract|validate|status|brief|…]` — full localization pipeline, from string scan to RTL checks

**Change Management (OpenSpec)**

- `gamedev:openspec-propose` — propose a change with design, specs, and tasks generated in one step
- `gamedev:openspec-explore` — thinking-partner mode for exploring ideas before or during a change
- `gamedev:openspec-apply-change` — implement tasks from an OpenSpec change
- `gamedev:openspec-sync-specs` — fold a change's delta specs into the main specs without archiving
- `gamedev:openspec-archive-change` — archive a completed change

**Team Orchestration** (each coordinates multiple agents on a single feature)

- `gamedev:team-combat [feature]` — combat feature end-to-end: design, implementation, VFX, audio, QA
- `gamedev:team-narrative [content]` — cohesive story content, world lore, and narrative-driven level design
- `gamedev:team-ui [feature]` — full UX pipeline: spec, visual design, implementation, review, polish
- `gamedev:team-release [version]` — execute a release from candidate to deployment
- `gamedev:team-polish [feature or area]` — optimize, polish, and harden a feature to release quality
- `gamedev:team-audio [feature or area]` — audio pipeline from direction through implementation
- `gamedev:team-level [level or area]` — complete area/level creation: layout, narrative, art, systems, QA
- `gamedev:team-live-ops [season or event]` — plan a season, event, or live content update
- `gamedev:team-qa [milestone | feature]` — full QA cycle: test plan, test cases, smoke gate, sign-off report

## Getting Started

Install `gamedev`, then use it in a separate repository for your game. An empty game directory is fine. You need Git,
Python 3, Bash (Git Bash on Windows), and Pi. See [setup requirements](docs/setup-requirements.md) for optional tools.

### Install in Pi

From a terminal, after the Pi release reaches main:

```sh
pi install git:github.com/kessriga/game-studio
```

Before release, use `pi install /absolute/path/to/game-studio` with a contributor checkout. Open Pi in your game
repository and run `/skill:gamedev-start`. See [Pi setup](docs/pi.md) for local testing, subagent integration, and
progress tracking.

### Start building your game

The start skill adds shared `AGENTS.md` instructions, project rules, engine settings, and the `production/`, `design/`,
and `docs/` directories. It preserves existing files, asks where you are in development, and guides you to the right
workflow.

Once scaffolded, choose any skill directly:

- `gamedev:brainstorm` — explore game ideas from scratch
- `gamedev:setup-engine godot 4.6` — configure your engine if you already know
- `gamedev:project-stage-detect` — analyze an existing project
- `gamedev:status` — check the production stage and active work

## Project Structure

**The package** (installed separately from your game):

```text
package.json   # Pi package manifest
pi/            # Pi extension and generated namespaced entry points
skills/        # Shared workflows
agents/        # Specialist role guides
docs/          # Framework guides and document templates
templates/     # Game-owned scaffold sources
bin/           # Current-directory project and stage helpers
```

**Your game** (scaffolded without host-specific files):

```text
AGENTS.md                        # Canonical project guidance
src/                             # Source and nested AGENTS.md
assets/                          # Art, audio, VFX, shaders, data
design/                          # GDDs, narrative, registries and nested AGENTS.md
docs/technical-preferences.md     # Your engine, version, naming and budgets
docs/rules/                      # Eleven explicitly loaded path-scoped rules
docs/                            # Architecture, engine references and nested AGENTS.md
production/                      # Stage, QA evidence, workflow progress, handoff
prototypes/                      # Throwaway prototypes
```

See [directory structure](docs/directory-structure.md). Use `/skill:gamedev-status` for a snapshot.

## How It Works

### Agent Coordination

Follow these rules whether specialists run as subagents or as sequential role passes. The
[host guide](docs/host-runtime.md) explains how to delegate and how to report when independent review is unavailable.

1. **Vertical delegation** — directors delegate to leads, leads delegate to specialists
2. **Horizontal consultation** — same-tier agents can consult each other but can't make binding cross-domain decisions
3. **Conflict resolution** — disagreements escalate up to the shared parent (`creative-director` for design,
   `technical-director` for technical)
4. **Change propagation** — cross-department changes are coordinated by `producer`
5. **Domain boundaries** — agents don't modify files outside their domain without explicit delegation

### Collaboration

You own the creative decisions and scope. Authoring workflows follow this protocol:

1. **Ask** — agents ask questions before proposing solutions
2. **Present options** — agents show 2-4 options with pros/cons
3. **You decide** — the user always makes the call
4. **Draft** — agents show work before finalizing
5. **Approve** — drafts are written once you approve them

A request to implement a concrete change authorizes that work. The assistant asks when a creative decision or a change
in scope still needs your input.

### Validation and Session Support

Run the game's format, lint, build, and test checks before declaring work complete. Validate changed assets, check
branch policy before authorized commits or pushes, and save session handoffs explicitly. See
[explicit checks](docs/host-runtime.md#explicit-checks). No automatic validation hooks or audit logs are bundled.
Permissions come from the runtime and project configuration, not role prose.

### Path-Scoped Rules

Coding standards apply according to file location. Read matching `docs/rules/` files explicitly as directed by the
project's `AGENTS.md`. These instructions guide the assistant; the game's checks verify the resulting code.

| Path | Enforces |
| ------ | ---------- |
| `src/gameplay/**` | Data-driven values, delta time usage, no UI references |
| `src/core/**` | Zero allocations in hot paths, thread safety, API stability |
| `src/ai/**` | Performance budgets, debuggability, data-driven parameters |
| `src/networking/**` | Server-authoritative, versioned messages, security |
| `src/ui/**` | No game state ownership, localization-ready, accessibility |
| `design/gdd/**` | Required 8 sections, formula format, edge cases |
| `design/narrative/**` | Canon levels, lore consistency, localization-ready dialogue |
| `assets/data/**` | Valid JSON, documented schemas, no orphaned entries |
| `assets/shaders/**` | Shader naming, performance budgets, cross-platform compatibility |
| `tests/**` | Test naming, coverage requirements, fixture patterns |
| `prototypes/**` | Relaxed standards, README required, hypothesis documented |

## Design Philosophy

This framework is grounded in professional game development practices:

- **MDA Framework** — Mechanics, Dynamics, Aesthetics analysis for game design
- **Self-Determination Theory** — Autonomy, Competence, Relatedness for player motivation
- **Flow State Design** — Challenge-skill balance for player engagement
- **Bartle Player Types** — Audience targeting and validation
- **Verification-Driven Development** — Tests first, then implementation

## Customization

The project files you scaffold are yours to customize:

- **Set project guidance** — edit `AGENTS.md` with project-specific knowledge and role boundaries
- **Add rules** — create new path-scoped rules for your project's directory structure
- **Tune validation** — configure your game's checks
- **Pick your engine** — use the Godot, Unity, Unreal, or Bevy agent set (or none)
- **Set review intensity** — `full` (all director gates), `lean` (phase gates only), or `solo` (none). Set during
  `gamedev:start` or edit `production/review-mode.txt`. Override per-run with `--review solo` on any skill.

---

To change the bundled skills or roles, work in a contributor checkout and follow [CONTRIBUTING.md](CONTRIBUTING.md).
Installed package caches may be replaced by updates.

*Built for game developers using shared workflows and Pi.*

## License

MIT License. See [LICENSE](LICENSE) for details.

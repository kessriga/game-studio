# Claude Code Game Studios -- Complete Workflow Guide

> **How to go from zero to a shipped game using the Agent Architecture.**
>
> This guide walks you through every phase of game development using the
> 53-agent system, 66 slash commands, and 12 automated hooks. It assumes you
> have Claude Code installed and are working from the project root.
>
> The pipeline has 7 phases. Each phase has a formal gate (`/gamedev:gate-check`)
> that must pass before you advance. The authoritative phase sequence is
> defined in `workflow-catalog.yaml` and read by `/gamedev:help`.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Phase 1: Concept](#phase-1-concept)
3. [Phase 2: Systems Design](#phase-2-systems-design)
4. [Phase 3: Technical Setup](#phase-3-technical-setup)
5. [Phase 4: Pre-Production](#phase-4-pre-production)
6. [Phase 5: Production](#phase-5-production)
7. [Phase 6: Polish](#phase-6-polish)
8. [Phase 7: Release](#phase-7-release)
9. [Status Model](#status-model)
10. [Cross-Cutting Concerns](#cross-cutting-concerns)
11. [Appendix A: Agent Quick-Reference](#appendix-a-agent-quick-reference)
12. [Appendix B: Slash Command Quick-Reference](#appendix-b-slash-command-quick-reference)
13. [Appendix C: Common Workflows](#appendix-c-common-workflows)

---

## Quick Start

### What You Need

Before you start, make sure you have:

- **Claude Code** installed and working
- **Git** with Git Bash (Windows) or standard terminal (Mac/Linux)
- **jq** (optional but recommended -- hooks fall back to `grep` if missing)
- **Python 3** (optional -- some hooks use it for JSON validation)

### Step 1: Clone and Open

```bash
git clone <repo-url> my-game
cd my-game
```

### Step 2: Run /gamedev:start

If this is your first session:

```
/gamedev:start
```

This guided onboarding asks where you are and routes you to the right phase:

- **Path A** -- No idea yet: routes to `/gamedev:brainstorm`
- **Path B** -- Vague idea: routes to `/gamedev:brainstorm` with seed
- **Path C** -- Clear concept: routes to `/gamedev:setup-engine` and `/gamedev:map-systems`
- **Path D1** -- Existing project, few artifacts: normal flow
- **Path D2** -- Existing project, GDDs/ADRs exist: runs `/gamedev:project-stage-detect`
  then `/gamedev:adopt` for brownfield migration

### Step 3: Verify Hooks Are Working

Start a new Claude Code session. You should see output from the
`session-start.sh` hook:

```
=== Claude Code Game Studios -- Session Context ===
Branch: main
Recent commits:
  abc1234 Initial commit
===================================
```

If you see this, hooks are working. If not, check `.claude/settings.json` to
make sure the hook paths are correct for your OS.

### Step 4: Ask for Help Anytime

At any point, run:

```
/gamedev:help
```

This reads your current phase from `production/stage.txt`, checks which
artifacts exist, and tells you exactly what to do next. It distinguishes
between REQUIRED next steps and OPTIONAL opportunities.

### Step 5: Create Your Directory Structure

Directories are created as needed. The system expects this layout:

```
src/                  # Game source code
  core/               # Engine/framework code
  gameplay/           # Gameplay systems
  ai/                 # AI systems
  networking/         # Multiplayer code
  ui/                 # UI code
  tools/              # Dev tools
assets/               # Game assets
  art/                # Sprites, models, textures
  audio/              # Music, SFX
  vfx/                # Particle effects
  shaders/            # Shader files
  data/               # JSON config/balance data
design/               # Design documents
  gdd/                # Game design documents
  narrative/          # Story, lore, dialogue
  levels/             # Level design documents
  balance/            # Balance spreadsheets and data
  ux/                 # UX specifications
docs/                 # Technical documentation
  architecture/       # Architecture Decision Records
  api/                # API documentation
  postmortems/        # Post-mortems
tests/                # Test suites
prototypes/           # Throwaway prototypes
production/           # Epics, milestones, releases
  milestones/
  releases/
  epics/              # Epic and story files (from /gamedev:create-epics + /gamedev:create-stories)
  playtests/          # Playtest reports
  session-state/      # Ephemeral session state (gitignored)
  session-logs/       # Session audit trail (gitignored)
```

> **Tip:** You do not need all of these on day one. Create directories as you
> reach the phase that needs them. The important thing is to follow this
> structure when you do create them, because the **rules system** enforces
> standards based on file paths. Code in `src/gameplay/` gets gameplay rules,
> code in `src/ai/` gets AI rules, and so on.

---

## Phase 1: Concept

### What Happens in This Phase

You go from "no idea" or "vague idea" to a structured game concept document
with defined pillars and a player journey. This is where you figure out
**what** you are making and **why**.

### Phase 1 Pipeline

```
/gamedev:brainstorm  -->  game-concept.md  -->  /gamedev:design-review  -->  /gamedev:setup-engine
     |                                        |                    |
     v                                        v                    v
  10 concepts     Concept doc with       Validation          Engine pinned in
  MDA analysis    pillars, MDA,          of concept          technical-preferences.md
  Player motiv.   core loop, USP         document
                                                                   |
                                                                   v
                                                             /gamedev:prototype
                                                       (concept prototype — 1-3 days)
                                                        PROCEED ↓     PIVOT → /gamedev:brainstorm
                                                                   |
                                                                   v (PROCEED)
                                                             /gamedev:map-systems
                                                                   |
                                                                   v
                                                            systems-index.md
                                                            (all systems, deps,
                                                             priority tiers)
```

### Step 1.1: Brainstorm With /gamedev:brainstorm

This is your starting point. Run the brainstorm skill:

```
/gamedev:brainstorm
```

Or with a genre hint:

```
/gamedev:brainstorm roguelike deckbuilder
```

**What happens:** The brainstorm skill guides you through a collaborative 6-phase
ideation process using professional studio techniques:

1. Asks about your interests, themes, and constraints
2. Generates 10 concept seeds with MDA (Mechanics, Dynamics, Aesthetics) analysis
3. You pick 2-3 favorites for deep analysis
4. Performs player motivation mapping and audience targeting
5. You choose the winning concept
6. Formalizes it into `design/gdd/game-concept.md`

The concept document includes:

- Elevator pitch (one sentence)
- Core fantasy (what the player imagines themselves doing)
- MDA breakdown
- Target audience (Bartle types, demographics)
- Core loop diagram
- Unique selling proposition
- Comparable titles and differentiation
- Game pillars (3-5 non-negotiable design values)
- Anti-pillars (things the game intentionally avoids)

### Step 1.2: Review the Concept (Optional but Recommended)

```
/gamedev:design-review design/gdd/game-concept.md
```

Validates structure and completeness before you proceed.

### Step 1.3: Choose Your Engine

```
/gamedev:setup-engine
```

Or with a specific engine:

```
/gamedev:setup-engine godot 4.6
```

**What /gamedev:setup-engine does:**

- Populates `.claude/docs/technical-preferences.md` with naming conventions,
  performance budgets, and engine-specific defaults
- Detects knowledge gaps (engine version newer than LLM training data) and
  advises cross-referencing `docs/engine-reference/`
- Creates version-pinned reference docs in `docs/engine-reference/`

**Why this matters:** Once you set the engine, the system knows which
engine-specialist agents to use. If you pick Godot, agents like
`godot-specialist`, `godot-gdscript-specialist`, and `godot-shader-specialist`
become your go-to experts; pick Bevy and you get `bevy-specialist`,
`bevy-rust-specialist`, `bevy-render-specialist`, and `bevy-ui-specialist`.

### Step 1.4: Decompose Your Concept Into Systems

Before writing individual GDDs, enumerate all the systems your game needs:

```
/gamedev:map-systems
```

This creates `design/gdd/systems-index.md` -- a master tracking document that:

- Lists every system your game needs (combat, movement, UI, etc.)
- Maps dependencies between systems
- Assigns priority tiers (MVP, Vertical Slice, Alpha, Full Vision)
- Determines design order (Foundation > Core > Feature > Presentation > Polish)

This step is **required** before proceeding to Phase 2. Research from 155 game
postmortems confirms that skipping systems enumeration costs 5-10x more in
production.

### Phase 1 Gate

```
/gamedev:gate-check concept
```

**Requirements to pass:**

- Engine configured in `technical-preferences.md`
- `design/gdd/game-concept.md` exists with pillars
- `design/gdd/systems-index.md` exists with dependency ordering

**Verdict:** PASS / CONCERNS / FAIL. CONCERNS is passable with acknowledged
risks. FAIL blocks advancement.

---

## Phase 2: Systems Design

### What Happens in This Phase

You create all the design documents that define how your game works. Nothing
gets coded yet -- this is pure design. Each system identified in the systems
index gets its own GDD, authored section by section, reviewed individually,
and then all GDDs are cross-checked for consistency.

### Phase 2 Pipeline

```
/gamedev:map-systems next  -->  /gamedev:design-system  -->  /gamedev:design-review
       |                     |                     |
       v                     v                     v
  Picks next system    Section-by-section     Validates 8
  from systems-index   GDD authoring          required sections
                       (incremental writes)   APPROVED/NEEDS REVISION
       |
       |  (repeat for each MVP system)
       v
/gamedev:review-all-gdds
       |
       v
  Cross-GDD consistency + design theory review
  PASS / CONCERNS / FAIL
```

### Step 2.1: Author System GDDs

Design each system in dependency order using the guided workflow:

```
/gamedev:map-systems next
```

This picks the highest-priority undesigned system and hands off to
`/gamedev:design-system`, which guides you through creating its GDD section by section.

You can also design a specific system directly:

```
/gamedev:design-system combat-system
```

**What /gamedev:design-system does:**

1. Reads your game concept, systems index, and any upstream/downstream GDDs
2. Runs a Technical Feasibility Pre-Check (domain mapping + feasibility brief)
3. Walks you through each of the 8 required GDD sections one at a time
4. Each section follows: Context > Questions > Options > Decision > Draft > Approval > Write
5. Each section is written to file immediately after approval (survives crashes)
6. Flags conflicts with existing approved GDDs
7. Routes to specialist agents per category (systems-designer for math,
   economy-designer for economy, narrative-director for story systems)

**The 8 required GDD sections:**

| # | Section | What Goes Here |
|---|---------|---------------|
| 1 | **Overview** | One-paragraph summary of the system |
| 2 | **Player Fantasy** | What the player imagines/feels when using this system |
| 3 | **Detailed Rules** | Unambiguous mechanical rules |
| 4 | **Formulas** | Every calculation, with variable definitions and ranges |
| 5 | **Edge Cases** | What happens in weird situations? Explicitly resolved. |
| 6 | **Dependencies** | What other systems this connects to (bidirectional) |
| 7 | **Tuning Knobs** | Which values designers can safely change, with safe ranges |
| 8 | **Acceptance Criteria** | How do you test that this works? Specific, measurable. |

Plus a **Game Feel** section: feel reference, input responsiveness (ms/frames),
animation feel targets (startup/active/recovery), impact moments, weight profile.

### Step 2.2: Review Each GDD

Before the next system starts, validate the current one:

```
/gamedev:design-review design/gdd/combat-system.md
```

Checks all 8 sections for completeness, formula clarity, edge case resolution,
bidirectional dependencies, and testable acceptance criteria.

**Verdict:** APPROVED / NEEDS REVISION / MAJOR REVISION. Only APPROVED GDDs
should proceed.

### Step 2.3: Small Changes Without Full GDDs

For tuning changes, small additions, or tweaks that do not warrant a full GDD:

```
/gamedev:quick-design "add 10% damage bonus for flanking attacks"
```

This creates a lightweight spec in `design/quick-specs/` instead of a full
8-section GDD. Use it for tuning, number changes, and small additions.

### Step 2.4: Cross-GDD Consistency Review

After all MVP system GDDs are approved individually:

```
/gamedev:review-all-gdds
```

This reads ALL GDDs simultaneously and runs two analysis phases:

**Phase 1 -- Cross-GDD Consistency:**
- Dependency bidirectionality (A references B, does B reference A?)
- Rule contradictions between systems
- Stale references to renamed or removed systems
- Ownership conflicts (two systems claiming the same responsibility)
- Formula range compatibility (does System A's output fit System B's input?)
- Acceptance criteria cross-check

**Phase 2 -- Design Theory (Game Design Holism):**
- Competing progression loops (do two systems fight for the same reward space?)
- Cognitive load (more than 4 active systems at once?)
- Dominant strategies (one approach that makes all others irrelevant)
- Economic loop analysis (sources and sinks balanced?)
- Difficulty curve consistency across systems
- Pillar alignment and anti-pillar violations
- Player fantasy coherence

**Output:** `design/gdd/gdd-cross-review-[date].md` with a verdict.

### Step 2.5: Narrative Design (If Applicable)

If your game has story, lore, or dialogue, this is when you build it:

1. **World-building** -- Use `world-builder` to define factions, history,
   geography, and rules of your world
2. **Story structure** -- Use `narrative-director` to design story arcs,
   character arcs, and narrative beats
3. **Character sheets** -- Use the `narrative-character-sheet.md` template

### Phase 2 Gate

```
/gamedev:gate-check systems-design
```

**Requirements to pass:**

- All MVP systems in `systems-index.md` have `Status: Approved`
- Each MVP system has a reviewed GDD
- Cross-GDD review report exists (`design/gdd/gdd-cross-review-*.md`)
  with verdict of PASS or CONCERNS (not FAIL)

---

## Phase 3: Technical Setup

### What Happens in This Phase

You make key technical decisions, document them as Architecture Decision Records
(ADRs), validate them through review, and produce a control manifest that
gives programmers flat, actionable rules. You also establish UX foundations.

### Phase 3 Pipeline

```
/gamedev:create-architecture  -->  /gamedev:architecture-decision (x N)  -->  /gamedev:architecture-review
        |                          |                                   |
        v                          v                                   v
  Master architecture       Per-decision ADRs              Validates completeness,
  document covering         in docs/architecture/          dependency ordering,
  all systems               adr-*.md                       engine compatibility
                                                                      |
                                                                      v
                                                         /gamedev:create-control-manifest
                                                                      |
                                                                      v
                                                         Flat programmer rules
                                                         docs/architecture/
                                                         control-manifest.md
        Also in this phase:
        -------------------
        /gamedev:ux-design  -->  /gamedev:ux-review
        Accessibility requirements doc
        Interaction pattern library
```

### Step 3.1: Master Architecture Document

```
/gamedev:create-architecture
```

Creates the overarching architecture document in `docs/architecture/architecture.md`
covering system boundaries, data flow, and integration points.

### Step 3.2: Architecture Decision Records (ADRs)

For each significant technical decision:

```
/gamedev:architecture-decision "State Machine vs Behavior Tree for NPC AI"
```

**What happens:** The skill guides you through creating an ADR with:
- Context and decision drivers
- All options with pros/cons and engine compatibility
- Chosen option with rationale
- Consequences (positive, negative, risks)
- Dependencies (Depends On, Enables, Blocks, Ordering Note)
- GDD Requirements Addressed (linked by TR-ID)

ADRs go through a lifecycle: Proposed > Accepted > Superseded/Deprecated.

**Minimum 3 Foundation-layer ADRs are required** before the gate check.

**Retrofitting existing ADRs:** If you already have ADRs from a brownfield
project:

```
/gamedev:architecture-decision retrofit docs/architecture/adr-005.md
```

This detects which template sections are missing and adds only those, never
overwriting existing content.

### Step 3.3: Architecture Review

```
/gamedev:architecture-review
```

Validates all ADRs together:
- Topological sort of ADR dependencies (detects cycles)
- Engine compatibility verification
- GDD Revision Flags (flags GDD sections that need updates based on ADR choices)
- TR-ID registry maintenance (`docs/architecture/tr-registry.yaml`)

### Step 3.4: Control Manifest

```
/gamedev:create-control-manifest
```

Takes all Accepted ADRs and produces a flat programmer rules sheet:

```
docs/architecture/control-manifest.md
```

This contains Required patterns, Forbidden patterns, and Guardrails organized
by code layer. Stories created later embed the manifest version date so
staleness can be detected.

### Step 3.5: Accessibility Requirements

Create `design/accessibility-requirements.md` using the template. Commit to a
tier (Basic / Standard / Comprehensive / Exemplary) and fill the 4-axis feature
matrix (visual, motor, cognitive, auditory).

This document is required in Phase 3 because UX specs (written in Phase 4)
reference this tier — it is a design prerequisite, not a UX deliverable.

### Phase 3 Gate

```
/gamedev:gate-check technical-setup
```

**Requirements to pass:**

- `docs/architecture/architecture.md` exists
- At least 3 ADRs exist and are Accepted
- Architecture review report exists
- `docs/architecture/control-manifest.md` exists
- `design/accessibility-requirements.md` exists

---

## Phase 4: Pre-Production

### What Happens in This Phase

You create UX specs for key screens, prototype risky mechanics, turn design
documents into implementable stories (each minting a Backlog task), group them
under a milestone, and build a Vertical Slice that proves the core loop is fun.

### Phase 4 Pipeline

```
/gamedev:ux-design  -->  /gamedev:vertical-slice  -->  /gamedev:create-epics  -->  /gamedev:create-stories  -->  the Backlog board
    |                   |                   |                   |                       |
    v                   v                   v                   v                       v
  UX specs       Production-quality   EPIC.md prose +     Story .md +             Priority-ordered
  design/ux/     end-to-end build     a Backlog          a Backlog task          tasks, pulled top
                 in prototypes/       milestone          (owns status)           to bottom
                 PROCEED/PIVOT/KILL   (one per module)   (one per behaviour)
    |                                                          |
    v                                                          v
 /gamedev:ux-review                                             /gamedev:story-readiness
 (validates specs                                       (validates each story
  before epics)                                          before pickup)
                                                               |
                                                               v
                                                           /gamedev:dev-story
                                                         (implements the story,
                                                          routes to right agent)
```

### Step 4.1: UX Specs for Key Screens

Before writing epics, create UX specs so that story authors know what screens
exist and what player interactions they must support.

**UX Specs:**

```
/gamedev:ux-design main-menu
/gamedev:ux-design core-gameplay-hud
```

Three modes: screen/flow, HUD, and interaction patterns. Output goes to
`design/ux/`. Each spec includes: player need, layout zones, states,
interaction map, data requirements, events fired, accessibility, localization.

Reads your `accessibility-requirements.md` (written in Phase 3) and your
input method config from `technical-preferences.md` to drive accessibility
and input coverage checks — no need to re-specify them per screen.

> **Tip:** `/gamedev:design-system` emits a 📌 UX Flag for every system with UI
> requirements. Use those flags as a checklist for which screens need specs.

**Interaction Pattern Library:**

```
/gamedev:ux-design interaction-patterns
```

Create `design/ux/interaction-patterns.md` — 16 standard controls plus
game-specific patterns (inventory slot, ability icon, HUD bar, dialogue box,
etc.) with animation and sound standards.

**UX Review:**

```
/gamedev:ux-review all
```

Validates UX specs for GDD alignment and accessibility tier compliance.
Produces APPROVED / NEEDS REVISION / MAJOR REVISION NEEDED verdict.

### Step 4.2: Build the Vertical Slice

The vertical slice is the production-quality proof that you can build the full
game loop end-to-end before committing to full Production.

```
/gamedev:vertical-slice
```

**What it proves:** Does a player, starting from nothing, experience the core
fantasy within a few minutes, without developer guidance?

**What it builds:** A near-production-quality playable build covering at least
one complete [start → challenge → resolution] cycle. Uses real architecture
layers, real naming conventions, no hardcoded values — but not final art or
audio. This is not a throwaway like the concept prototype; it demonstrates
production pipeline feasibility.

**Note on concept prototyping:** If you ran `/gamedev:prototype` in Phase 1 (Concept),
you already validated the core idea is fun. The vertical slice now validates
you can build it properly. They answer different questions. If you skipped the
concept prototype, now is a reasonable time to run one first before investing
in the full slice.

**Verdict:** The vertical slice produces a PROCEED / PIVOT / KILL verdict.
- **PROCEED** → move to Step 4.3 (epics and stories)
- **PIVOT** → revise affected GDDs with `/gamedev:design-system [mechanic]`, then re-run `/gamedev:vertical-slice`
- **KILL** → return to `/gamedev:brainstorm` with what you learned

### Step 4.3: Create Epics and Stories From Design Artifacts

```
/gamedev:create-epics layer: foundation
/gamedev:create-stories [epic-slug]   # repeat for each epic
/gamedev:create-epics layer: core
/gamedev:create-stories [epic-slug]   # repeat for each core epic
```

`/gamedev:create-epics` reads your GDDs, ADRs, and architecture to define epic scope —
one epic per architectural module. It writes `EPIC.md` prose and mints a matching
**Backlog milestone**. Then `/gamedev:create-stories` breaks each epic into implementable
story files in `production/epics/[slug]/` and mints a **Backlog task** for each one.
The Backlog task owns work-item status; the story `.md` freezes to a status-only
record (it keeps receiving `## Completion Notes`). The two are cross-referenced:
the task carries `Spec: <path-to-story.md>`, the story carries `Tracked in: TASK-N`.
Each story embeds:
- GDD requirement references (TR-IDs, not quoted text -- stays fresh)
- ADR references (only from Accepted ADRs; a Proposed ADR gets the task a `blocked` label)
- Control manifest version date (for staleness detection)
- Engine-specific implementation notes
- Acceptance criteria from the GDD

Once stories exist, run `/gamedev:dev-story [story-path]` to implement one — it routes
automatically to the correct programmer agent.

### Step 4.4: Validate Stories Before Pickup

```
/gamedev:story-readiness production/epics/combat/story-combat-damage-calc.md
```

Checks: Design completeness, Architecture coverage, Scope clarity, Definition
of Done. Verdict: READY / NEEDS WORK / BLOCKED.

### Step 4.5: Effort Estimation

```
/gamedev:estimate production/epics/combat/story-combat-damage-calc.md
```

Provides effort estimates with risk assessment.

### Step 4.6: Set Up Your First Milestone on the Board

There are no sprints. Work is pulled off the priority-ordered Backlog board, and
grouping is the milestone (an epic == a Backlog milestone). `/gamedev:create-epics`
already minted the milestone; the `producer` agent can help you finish setting it
up collaboratively:
- Write the milestone's goal and Definition of Done into its description
- Order the milestone's tasks on the board by priority (top = pull next)
- Capture risks in an optional Backlog doc

Once tasks are prioritized, you pull the top-most ready task and run
`/gamedev:story-readiness` on it before pickup.

### Step 4.7: Vertical Slice (Hard Gate)

Before advancing to Production, you must build and playtest a Vertical Slice:

- One complete end-to-end core loop, playable from start to finish
- Representative quality (not placeholder everything)
- Played unguided in at least 3 sessions
- Playtest report written (`/gamedev:playtest-report`)

This is a **hard gate** -- `/gamedev:gate-check` will auto-FAIL if a human has not
played the build unguided.

### Phase 4 Gate

```
/gamedev:gate-check pre-production
```

**Requirements to pass:**

- At least 1 UX spec reviewed in `design/ux/`
- UX review completed (APPROVED or NEEDS REVISION with documented risks)
- At least 1 prototype with README
- Story files exist in `production/epics/[epic-slug]/`, each with a Backlog task
- At least 1 Backlog milestone exists with prioritized tasks
- At least 1 playtest report exists (Vertical Slice played in 3+ sessions)

---

## Phase 5: Production

### What Happens in This Phase

This is the core production loop. Work flows continuously — there are no sprints.
You pull the top-most ready task off the priority-ordered Backlog board,
implement it, and close it through a structured completion review. This phase
repeats until your game is content-complete.

### Phase 5 Pipeline (Continuous Flow)

```
pull top task  -->  /gamedev:story-readiness  -->  /gamedev:dev-story  -->  /gamedev:code-review  -->  /gamedev:story-done
      |                   |                    |                |                  |
      v                   v                    v                v                  v
  from the board     Story validated      Code written     Architectural     8-phase review:
  (priority order)   READY verdict        Tests pass       review            verify criteria,
                     task → In Progress                                      task → Done
      |
      |  (repeat per task; grouping is the milestone)
      v
  the Backlog board  (current state anytime — filter by milestone, label, or status)
  /gamedev:scope-check       (if a task or milestone is growing)
```

### Step 5.1: The Story Lifecycle

The production phase centers on the **story lifecycle**:

```
/gamedev:story-readiness  -->  implement  -->  /gamedev:story-done  -->  next story
```

**1. Story Readiness:** Before picking up a story, validate it:

```
/gamedev:story-readiness production/epics/combat/story-combat-damage-calc.md
```

This checks design completeness, architecture coverage, ADR status (blocks
if ADR is still Proposed), control manifest version (warns if stale), and
scope clarity. Verdict: READY / NEEDS WORK / BLOCKED.

**2. Implementation:** Work with the appropriate agents:

- `gameplay-programmer` for gameplay systems
- `engine-programmer` for core engine work
- `ai-programmer` for AI behavior
- `network-programmer` for multiplayer
- `ui-programmer` for UI code
- `tools-programmer` for dev tools

All agents follow the collaborative protocol: they read the design doc, ask
clarifying questions, present architectural options, get your approval, then
implement.

**3. Story Completion:** When a story is done:

```
/gamedev:story-done production/epics/combat/story-combat-damage-calc.md
```

This runs an 8-phase completion review:
1. Find and read the story file
2. Load referenced GDD, ADRs, and control manifest
3. Verify acceptance criteria (auto-checkable, manual, deferred)
4. Check for GDD/ADR deviations (BLOCKING / ADVISORY / OUT OF SCOPE)
5. Prompt for code review
6. Generate completion report (COMPLETE / COMPLETE WITH NOTES / BLOCKED)
7. Set the story's Backlog task to `Done` and append `## Completion Notes` to the story `.md`
8. Surface the next ready task from the board

Tech debt discovered during review is logged to `docs/tech-debt-register.md`.

### Step 5.2: Progress Tracking

Check progress anytime by reading the Backlog board — it is the single source of
truth for work-item status. Filter it by milestone (to see one epic's progress),
by status (`To Do` / `In Progress` / `Done`), or by label (`blocked`, `bug`).

If a task or milestone is growing beyond its original scope:

```
/gamedev:scope-check production/epics/combat/EPIC.md
```

This compares current scope against the original plan and flags scope increase,
recommends cuts.

### Step 5.3: Content Tracking

```
/gamedev:content-audit
```

Compares GDD-specified content against what has been implemented. Catches
content gaps early.

### Step 5.4: Design Change Propagation

When a GDD changes after stories have been created:

```
/gamedev:propagate-design-change design/gdd/combat-system.md
```

Git-diffs the GDD, finds affected ADRs, generates an impact report, and
walks you through Superseded/update/keep decisions.

### Step 5.5: Multi-System Features (Team Orchestration)

For features spanning multiple domains, use team skills:

```
/gamedev:team-combat "healing ability with HoT and cleanse"
/gamedev:team-narrative "Act 2 story content"
/gamedev:team-ui "inventory screen redesign"
/gamedev:team-level "forest dungeon level"
/gamedev:team-audio "combat audio pass"
```

Each team skill coordinates a 6-phase collaborative workflow:
1. **Design** -- game-designer asks questions, presents options
2. **Architecture** -- lead-programmer proposes code structure
3. **Parallel Implementation** -- specialists work simultaneously
4. **Integration** -- gameplay-programmer wires everything together
5. **Validation** -- qa-tester runs against acceptance criteria
6. **Report** -- coordinator summarizes status

The orchestration is automated, but **decision points stay with you**.

### Step 5.6: Milestone Reviews

Because work flows continuously off the board, there is no sprint boundary to
review. Instead, review milestone progress on the Backlog board at any
checkpoint: filter to the milestone and read its tasks by status to see feature
completeness (how many `Done` vs. `To Do`), open risks (`blocked` label), and
outstanding defects (`bug` label). When every task in a milestone is `Done`, that
epic is complete and you can weigh readiness for the next phase gate.

### Phase 5 Gate

```
/gamedev:gate-check production
```

**Requirements to pass:**

- All MVP stories complete
- Playtesting: 3 sessions covering new player, mid-game, and difficulty curve
- Fun hypothesis validated
- No confusion loops in playtest data

---

## Phase 6: Polish

### What Happens in This Phase

Your game is feature-complete. Now you make it good. This phase focuses on
performance, balance, accessibility, audio, visual polish, and playtesting.

### Phase 6 Pipeline

```
/gamedev:perf-profile  -->  /gamedev:balance-check  -->  /gamedev:asset-audit  -->  /gamedev:playtest-report (x3)
       |                  |                    |                    |
       v                  v                    v                    v
  Profile CPU/GPU    Analyze formulas     Verify naming,      Cover: new player,
  memory, optimize   and data for         formats, sizes      mid-game, difficulty
  bottlenecks        broken progressions                      curve

  /gamedev:tech-debt  -->  /gamedev:team-polish
       |                |
       v                v
  Track and        Coordinated pass:
  prioritize       performance + art +
  debt items       audio + UX + QA
```

### Step 6.1: Performance Profiling

```
/gamedev:perf-profile
```

Guides you through structured performance profiling:
- Establish targets (FPS, memory, platform)
- Identify bottlenecks ranked by impact
- Generate actionable optimization tasks with code locations and expected gains

### Step 6.2: Balance Analysis

```
/gamedev:balance-check assets/data/combat_damage.json
```

Analyzes balance data for statistical outliers, broken progression curves,
degenerate strategies, and economy imbalances.

### Step 6.3: Asset Audit

```
/gamedev:asset-audit
```

Verifies naming conventions, file format standards, and size budgets across
all assets.

### Step 6.4: Playtesting (Required: 3 Sessions)

```
/gamedev:playtest-report
```

Generates structured playtest reports. Three sessions are required, covering:
- New player experience
- Mid-game systems
- Difficulty curve

### Step 6.5: Technical Debt Assessment

```
/gamedev:tech-debt
```

Scans for TODO/FIXME/HACK comments, code duplication, overly complex functions,
missing tests, and outdated dependencies. Each item categorized and prioritized.

### Step 6.6: Coordinated Polish Pass

```
/gamedev:team-polish "combat system"
```

Coordinates 4 specialists in parallel:
1. Performance optimization (performance-analyst)
2. Visual polish (technical-artist)
3. Audio polish (sound-designer)
4. Feel/juice (gameplay-programmer + technical-artist)

You set priorities; the team executes with your approval at each step.

### Step 6.7: Localization and Accessibility

```
/gamedev:localize src/
```

Scans for hardcoded strings, concatenation that breaks translation, text that
does not account for expansion, and missing locale files.

Accessibility is audited against the tier committed in Phase 3's accessibility
requirements document.

### Phase 6 Gate

```
/gamedev:gate-check polish
```

**Requirements to pass:**

- At least 3 playtest reports exist
- Coordinated polish pass completed (`/gamedev:team-polish`)
- No blocking performance issues
- Accessibility tier requirements met

---

## Phase 7: Release

### What Happens in This Phase

Your game is polished, tested, and ready. Now you ship it.

### Phase 7 Pipeline

```
/gamedev:release-checklist  -->  /gamedev:launch-checklist  -->  /gamedev:team-release
        |                       |                      |
        v                       v                      v
  Pre-release             Full cross-department    Coordinate:
  validation across       validation (Go/No-Go     build, QA sign-off,
  code, content,          per department)           deployment, launch
  store, legal
                    Also: /gamedev:changelog, /gamedev:patch-notes, /gamedev:hotfix
```

### Step 7.1: Release Checklist

```
/gamedev:release-checklist v1.0.0
```

Generates a comprehensive pre-release checklist covering:
- Build verification (all platforms compile and run)
- Certification requirements (platform-specific)
- Store metadata (descriptions, screenshots, trailers)
- Legal compliance (EULA, privacy policy, ratings)
- Save game compatibility
- Analytics verification

### Step 7.2: Launch Readiness (Full Validation)

```
/gamedev:launch-checklist
```

Complete cross-department validation:

| Department | What Is Checked |
|-----------|---------------|
| **Engineering** | Build stability, crash rates, memory leaks, load times |
| **Design** | Feature completeness, tutorial flow, difficulty curve |
| **Art** | Asset quality, missing textures, LOD levels |
| **Audio** | Missing sounds, mixing levels, spatial audio |
| **QA** | Open bug count by severity, regression suite pass rate |
| **Narrative** | Dialogue completeness, lore consistency, typos |
| **Localization** | All strings translated, no truncation, locale testing |
| **Accessibility** | Compliance checklist, assistive feature testing |
| **Store** | Metadata complete, screenshots approved, pricing set |
| **Marketing** | Press kit ready, launch trailer, social media scheduled |
| **Community** | Patch notes draft, FAQ prepared, support channels ready |
| **Infrastructure** | Servers scaled, CDN configured, monitoring active |
| **Legal** | EULA finalized, privacy policy, COPPA/GDPR compliance |

Each item gets a **Go / No-Go** status. All must be Go to ship.

### Step 7.3: Generate Player-Facing Content

```
/gamedev:patch-notes v1.0.0
```

Generates player-friendly patch notes from git history and the Backlog board.
Translates developer language into player language.

```
/gamedev:changelog v1.0.0
```

Generates an internal changelog (more technical, for the team).

### Step 7.4: Coordinate the Release

```
/gamedev:team-release
```

Coordinates release-manager, QA, and DevOps through:
1. Pre-release validation
2. Build management
3. Final QA sign-off
4. Deployment preparation
5. Go/No-Go decision

### Step 7.5: Ship

The `validate-push` hook will warn you when pushing to `main` or `develop`.
This is intentional -- release pushes should be deliberate:

```bash
git tag v1.0.0
git push origin main --tags
```

### Step 7.6: Post-Launch

**Hotfix workflow** for critical production bugs:

```
/gamedev:hotfix "Players losing save data when inventory exceeds 99 items"
```

Bypasses the normal production flow with a full audit trail:
1. Creates a hotfix branch
2. Implements the fix
3. Ensures backport to development branch
4. Documents the incident

**Post-mortem** after launch stabilizes:

```
Ask Claude to create a post-mortem using the template at
templates/post-mortem.md
```

---

## Status model

Work-item status lives in **Backlog.md** (via the Backlog MCP), not in any
markdown file or YAML tracker. A story `.md` and its Backlog task are two halves
of one record: the task owns status, the `.md` is a status-only spec that keeps
receiving `## Completion Notes`. They cross-reference each other — the task
carries `Spec: <path-to-story.md>`, the story carries `Tracked in: TASK-N`.
Likewise, an epic's `EPIC.md` is prose and its Backlog milestone owns grouping.

### Native statuses

Backlog tasks move through three native statuses, plus one for pre-ready authoring:

| Status | Meaning |
|--------|---------|
| `Draft` | Being authored, not yet ready to pull (pre-ready) |
| `To Do` | Ready to pull off the board — a task existing at all means it is ready |
| `In Progress` | Being implemented right now (set at `/gamedev:dev-story` pickup) |
| `Done` | Verified complete (set by `/gamedev:story-done`) |

### Labels, not statuses

Two conditions that used to be statuses are now **labels** applied on top of a
native status, so a task can be, e.g., `In Progress` + `blocked`:

- **`blocked`** — cannot proceed (e.g. a referenced ADR is still `Proposed`, or an
  upstream task is unfinished).
- **`bug`** — the task is a defect. Filed by `/gamedev:bug-report`; "triage" is simply the
  board filtered by the `bug` label.

### Migration from the old six-status model

Earlier versions of this template tracked six statuses in markdown/YAML. They map
to the new model as follows:

| Old status | New model |
|------------|-----------|
| Not Started | `To Do` |
| Ready | `To Do` (a task existing ⇒ it is ready) |
| In Progress | `In Progress` |
| In Review | dropped (fold into `In Progress` until `Done`) |
| Complete | `Done` |
| Blocked | `blocked` **label** (on whatever native status applies) |

---

## Cross-Cutting Concerns

These topics apply across all phases.

### Director Review Modes

Director gates are specialist agents that review your work at key workflow steps.
**`solo` is the default review mode** — no director reviews, so you move at full
speed. You can dial review up if you want more oversight.

**Set your review intensity once during `/gamedev:start`.** Saved to `production/review-mode.txt`.

| Mode | What runs | Best for |
|------|-----------|----------|
| `solo` (default) | No director reviews | Solo dev, game jams, prototypes, maximum speed |
| `lean` | Directors only at phase transitions (`/gamedev:gate-check`) | Experienced devs wanting light oversight |
| `full` | All director gates at every step | New projects, learning the system |

**Override for a single run** without changing your global setting:

```
/gamedev:brainstorm space horror --review full
/gamedev:architecture-decision --review solo
```

The `--review` flag works on all gate-using skills. Change the global mode at any
time by editing `production/review-mode.txt` directly or re-running `/gamedev:start`.

Full gate definitions and check pattern: `director-gates.md`

---

### The Collaboration Protocol

This system is **user-driven collaborative**, not autonomous.

**Pattern:** Question > Options > Decision > Draft > Approval

Every agent interaction follows this pattern:
1. Agent asks clarifying questions
2. Agent presents 2-4 options with trade-offs and reasoning
3. You decide
4. Agent drafts based on your decision
5. You review and refine
6. Agent asks "May I write this to [filepath]?" before writing

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for the full protocol with
examples.

### The AskUserQuestion Tool

Agents use the `AskUserQuestion` tool for structured option presentation.
The pattern is Explain then Capture: full analysis in conversation text first,
then a clean UI picker for the decision. Use it for design choices,
architecture decisions, and strategic questions. Do not use it for open-ended
discovery questions or simple yes/no confirmations.

### Agent Coordination (3-Tier Hierarchy)

```
Tier 1 (Directors):    creative-director, technical-director, producer
                                          |
Tier 2 (Leads):        game-designer, lead-programmer, art-director,
                       audio-director, narrative-director, qa-lead,
                       release-manager, localization-lead
                                          |
Tier 3 (Specialists):  gameplay-programmer, engine-programmer,
                       ai-programmer, network-programmer, ui-programmer,
                       tools-programmer, systems-designer, level-designer,
                       economy-designer, world-builder, writer,
                       technical-artist, sound-designer, ux-designer,
                       qa-tester, performance-analyst, devops-engineer,
                       analytics-engineer, accessibility-specialist,
                       live-ops-designer, prototyper, security-engineer,
                       community-manager, godot-specialist,
                       godot-gdscript-specialist, godot-shader-specialist,
                       godot-csharp-specialist, godot-gdextension-specialist,
                       unity-specialist, unity-dots-specialist,
                       unity-shader-specialist, unity-addressables-specialist,
                       unity-ui-specialist, unreal-specialist,
                       ue-blueprint-specialist, ue-gas-specialist,
                       ue-replication-specialist, ue-umg-specialist
```

**Coordination rules:**
- Vertical delegation: Directors > Leads > Specialists. Never skip tiers for
  complex decisions.
- Horizontal consultation: Agents at the same tier may consult each other but
  must not make binding decisions outside their domain.
- Conflict resolution: Design conflicts go to `creative-director`. Technical
  conflicts go to `technical-director`. Scope conflicts go to `producer`.
- No unilateral cross-domain changes.

### Automated Hooks (Safety Net)

The system has 12 hooks that run automatically:

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `session-start.sh` | Session start | Shows branch, recent commits, detects active.md for recovery |
| `detect-gaps.sh` | Session start | Detects fresh projects (no engine, no concept) and suggests `/gamedev:start` |
| `pre-compact.sh` | Before compaction | Dumps session state into conversation for auto-recovery |
| `post-compact.sh` | After compaction | Reminds Claude to restore session state from `active.md` |
| `notify.sh` | Notification event | Shows Windows toast notification via PowerShell |
| `validate-commit.sh` | Before commit | Checks for design doc references, valid JSON, no hardcoded values |
| `validate-push.sh` | Before push | Warns on pushes to main/develop |
| `validate-assets.sh` | Before commit | Checks asset naming and size |
| `validate-skill-change.sh` | Skill file written | Advises running `/gamedev:skill-test` after `skills/` changes |
| `log-agent.sh` | Agent start | Logs agent invocations for audit trail |
| `log-agent-stop.sh` | Agent stop | Completes agent audit trail (start + stop) |
| `session-stop.sh` | Session end | Final session logging |

### Context Resilience

**Session state file:** `production/session-state/active.md` is a living
checkpoint. Update it after each significant milestone. After any disruption
(compaction, crash, `/clear`), read this file first.

**Incremental writing:** When creating multi-section documents, write each
section to file immediately after approval. This means completed sections
survive crashes and context compactions. Previous discussion about written
sections can be safely compacted.

**Automatic recovery:** The `session-start.sh` hook detects and previews
`active.md` automatically. The `pre-compact.sh` hook dumps state into the
conversation before compaction.

**Work-item tracking:** Status lives in **Backlog.md** (via the Backlog MCP),
queried through the board. `/gamedev:dev-story` sets a task `In Progress` at pickup and
`/gamedev:story-done` sets it `Done`; `/gamedev:help` and `/gamedev:story-done` read the board to surface
the next ready task. See [Status Model](#status-model) for the full status and
label scheme. Because status is in Backlog rather than a doc, there is no fragile
markdown or YAML tracker to keep in sync.

### Brownfield Adoption

For existing projects that already have some artifacts:

```
/gamedev:adopt
```

Or targeted:

```
/gamedev:adopt gdds
/gamedev:adopt adrs
/gamedev:adopt stories
/gamedev:adopt infra
```

This audits existing artifacts for **format** (not existence), classifies gaps
as BLOCKING/HIGH/MEDIUM/LOW, builds an ordered migration plan, and writes
`docs/adoption-plan-[date].md`. Core principle: MIGRATION not REPLACEMENT --
it never regenerates existing work, only fills gaps.

Individual skills also support retrofit mode:

```
/gamedev:design-system retrofit design/gdd/combat-system.md
/gamedev:architecture-decision retrofit docs/architecture/adr-005.md
```

These detect which sections are present vs. missing and fill only the gaps.

### Gate System

Phase gates are formal checkpoints. Run `/gamedev:gate-check` with the transition name:

```
/gamedev:gate-check concept              # Concept -> Systems Design
/gamedev:gate-check systems-design       # Systems Design -> Technical Setup
/gamedev:gate-check technical-setup      # Technical Setup -> Pre-Production
/gamedev:gate-check pre-production       # Pre-Production -> Production
/gamedev:gate-check production           # Production -> Polish
/gamedev:gate-check polish               # Polish -> Release
```

**Verdicts:**
- **PASS** -- all requirements met, advance to next phase
- **CONCERNS** -- requirements met with acknowledged risks, passable
- **FAIL** -- requirements not met, blocks advancement with specific remediation

When a gate passes, `production/stage.txt` is updated (only then), which
controls the status line and `/gamedev:help` behavior.

### Reverse Documentation

For code that exists without design docs (common after brownfield adoption):

```
/gamedev:reverse-document src/gameplay/combat/
```

Reads existing code and generates GDD-format design documentation from it.

---

## Appendix A: Agent Quick-Reference

### "I need to do X -- which agent do I use?"

| I need to... | Agent | Tier |
|-------------|-------|------|
| Come up with a game idea | `/gamedev:brainstorm` skill | -- |
| Design a game mechanic | `game-designer` | 2 |
| Design specific formulas/numbers | `systems-designer` | 3 |
| Design a game level | `level-designer` | 3 |
| Design loot tables / economy | `economy-designer` | 3 |
| Build world lore | `world-builder` | 3 |
| Write dialogue | `writer` | 3 |
| Plan the story | `narrative-director` | 2 |
| Prioritize the board / coordinate production | `producer` | 1 |
| Make a creative decision | `creative-director` | 1 |
| Make a technical decision | `technical-director` | 1 |
| Implement gameplay code | `gameplay-programmer` | 3 |
| Implement core engine systems | `engine-programmer` | 3 |
| Implement AI behavior | `ai-programmer` | 3 |
| Implement multiplayer | `network-programmer` | 3 |
| Implement UI | `ui-programmer` | 3 |
| Build dev tools | `tools-programmer` | 3 |
| Review code architecture | `lead-programmer` | 2 |
| Create shaders / VFX | `technical-artist` | 3 |
| Define visual style | `art-director` | 2 |
| Define audio style | `audio-director` | 2 |
| Design sound effects | `sound-designer` | 3 |
| Design UX flows | `ux-designer` | 3 |
| Write test cases | `qa-tester` | 3 |
| Plan test strategy | `qa-lead` | 2 |
| Profile performance | `performance-analyst` | 3 |
| Set up CI/CD | `devops-engineer` | 3 |
| Design analytics | `analytics-engineer` | 3 |
| Check accessibility | `accessibility-specialist` | 3 |
| Plan live operations | `live-ops-designer` | 3 |
| Manage a release | `release-manager` | 2 |
| Manage localization | `localization-lead` | 2 |
| Prototype quickly | `prototyper` | 3 |
| Audit security | `security-engineer` | 3 |
| Communicate with players | `community-manager` | 3 |
| Godot-specific help | `godot-specialist` | 3 |
| GDScript-specific help | `godot-gdscript-specialist` | 3 |
| Godot shader help | `godot-shader-specialist` | 3 |
| GDExtension modules | `godot-gdextension-specialist` | 3 |
| Unity-specific help | `unity-specialist` | 3 |
| Unity DOTS/ECS | `unity-dots-specialist` | 3 |
| Unity shaders/VFX | `unity-shader-specialist` | 3 |
| Unity Addressables | `unity-addressables-specialist` | 3 |
| Unity UI Toolkit | `unity-ui-specialist` | 3 |
| Unreal-specific help | `unreal-specialist` | 3 |
| Unreal GAS | `ue-gas-specialist` | 3 |
| Unreal Blueprints | `ue-blueprint-specialist` | 3 |
| Unreal replication | `ue-replication-specialist` | 3 |
| Unreal UMG/CommonUI | `ue-umg-specialist` | 3 |
| Bevy-specific help | `bevy-specialist` | 3 |
| Bevy Rust/ECS code | `bevy-rust-specialist` | 3 |
| Bevy rendering/WGSL | `bevy-render-specialist` | 3 |
| Bevy UI (bevy_ui) | `bevy-ui-specialist` | 3 |

### Agent Hierarchy

```
                    creative-director / technical-director / producer
                                         |
          ---------------------------------------------------------------
          |            |           |           |          |        |       |
    game-designer  lead-prog  art-dir  audio-dir  narr-dir  qa-lead  release-mgr
          |            |           |           |          |        |        |
     specialists  programmers  tech-art  snd-design  writer   qa-tester  devops
     (systems,    (gameplay,             (sound)     (world-  (perf,     (analytics,
      economy,     engine,                           builder)  access.)   security)
      level)       ai, net,
                   ui, tools)
```

**Escalation rule:** If two agents disagree, go up. Design conflicts go to
`creative-director`. Technical conflicts go to `technical-director`. Scope
conflicts go to `producer`.

---

## Appendix B: Slash Command Quick-Reference

### All 66 Commands by Category

#### Onboarding and Navigation (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:start` | Guided onboarding, routes to right workflow | Any (first session) |
| `/gamedev:help` | Context-aware "what do I do next?" | Any |
| `/gamedev:project-stage-detect` | Full project audit to determine current phase | Any |
| `/gamedev:setup-engine` | Configure engine, pin version, set preferences | 1 |
| `/gamedev:adopt` | Brownfield audit and migration plan | Any (existing projects) |
| `/gamedev:skill-improve` | Improve a skill via test-fix-retest loop | Any |

#### Game Design (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:brainstorm` | Collaborative ideation with MDA analysis | 1 |
| `/gamedev:map-systems` | Decompose concept into systems index | 1-2 |
| `/gamedev:design-system` | Guided section-by-section GDD authoring | 2 |
| `/gamedev:quick-design` | Lightweight spec for small changes | 2+ |
| `/gamedev:review-all-gdds` | Cross-GDD consistency and design theory review | 2 |
| `/gamedev:propagate-design-change` | Find ADRs/stories affected by GDD changes | 5 |

#### UX and Interface (2)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:ux-design` | Author UX specs (screen/flow, HUD, patterns) | 4 |
| `/gamedev:ux-review` | Validate UX specs for accessibility and GDD alignment | 4 |

#### Architecture (4)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:create-architecture` | Master architecture document | 3 |
| `/gamedev:architecture-decision` | Create or retrofit an ADR | 3 |
| `/gamedev:architecture-review` | Validate all ADRs, dependency ordering | 3 |
| `/gamedev:create-control-manifest` | Flat programmer rules from Accepted ADRs | 3 |

#### Stories (6)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:create-epics` | Translate GDDs + ADRs into epics + Backlog milestones (one per module) | 4 |
| `/gamedev:create-stories` | Break a single epic into story files + Backlog tasks | 4 |
| `/gamedev:dev-story` | Implement a story — routes to the correct programmer agent | 5 |
| `/gamedev:story-readiness` | Validate story is implementation-ready | 4-5 |
| `/gamedev:story-done` | 8-phase story completion review | 5 |
| `/gamedev:estimate` | Effort estimation with risk assessment | 4-5 |

#### Reviews and Analysis (13)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:design-review` | Validate GDD against 8-section standard | 1-2 |
| `/gamedev:code-review` | Architectural code review | 5+ |
| `/gamedev:balance-check` | Game balance formula analysis | 5-6 |
| `/gamedev:asset-audit` | Asset naming, format, size verification | 6 |
| `/gamedev:asset-spec` | Per-asset visual specs and AI generation prompts | 5-6 |
| `/gamedev:content-audit` | GDD-specified content vs. implemented | 5 |
| `/gamedev:consistency-check` | Cross-GDD entity and formula inconsistency scan | 2+ |
| `/gamedev:scope-check` | Scope creep detection | 5 |
| `/gamedev:perf-profile` | Performance profiling workflow | 6 |
| `/gamedev:tech-debt` | Tech debt scanning and prioritization | 6 |
| `/gamedev:gate-check` | Formal phase gate with PASS/CONCERNS/FAIL | All transitions |
| `/gamedev:reverse-document` | Generate design docs from existing code | Any |
| `/gamedev:security-audit` | Security vulnerability audit (save, network, input) | 6-7 |

#### QA and Testing (9)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:qa-plan` | Generate QA test plan for a milestone or feature | 5 |
| `/gamedev:smoke-check` | Critical path smoke test gate before QA hand-off | 5-6 |
| `/gamedev:soak-test` | Soak test protocol for extended play sessions | 6 |
| `/gamedev:regression-suite` | Map test coverage, identify fixed bugs lacking regression tests | 5-6 |
| `/gamedev:test-setup` | Scaffold test framework and CI/CD pipeline | 4 |
| `/gamedev:test-helpers` | Generate engine-specific test helper libraries | 4-5 |
| `/gamedev:test-evidence-review` | Quality review of test files and manual evidence | 5 |
| `/gamedev:test-flakiness` | Detect non-deterministic tests from CI logs | 5-6 |
| `/gamedev:skill-test` | Validate skill files for structural and behavioral correctness | Any |

#### Production Management (2)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:bug-report` | File a defect as a Backlog task with a `bug` label | 5+ |
| `/gamedev:playtest-report` | Structured playtest session report | 4-6 |

> Milestone progress, go/no-go, and bug triage are no longer skills — read them
> off the Backlog board (filter by milestone, status, or the `bug` label). See
> [Status Model](#status-model).

#### Release (5)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:release-checklist` | Pre-release validation | 7 |
| `/gamedev:launch-checklist` | Full cross-department launch readiness | 7 |
| `/gamedev:changelog` | Auto-generate internal changelog | 7 |
| `/gamedev:patch-notes` | Player-facing patch notes | 7 |
| `/gamedev:hotfix` | Emergency fix workflow | 7+ |

#### Creative (4)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:prototype` | Concept prototype — validate core idea before GDDs | 1 |
| `/gamedev:art-bible` | Guided Art Bible authoring — visual identity spec | 1-2 |
| `/gamedev:vertical-slice` | Production-quality end-to-end build before Production | 4 |
| `/gamedev:localize` | String extraction and validation | 6-7 |

#### Team Orchestration (9)

| Command | Purpose | Phase |
|---------|---------|-------|
| `/gamedev:team-combat` | Combat feature: design through implementation | 5 |
| `/gamedev:team-narrative` | Narrative content: structure through dialogue | 5 |
| `/gamedev:team-ui` | UI feature: UX spec through polished implementation | 5 |
| `/gamedev:team-level` | Level: layout through dressed encounters | 5 |
| `/gamedev:team-audio` | Audio: direction through implemented events | 5-6 |
| `/gamedev:team-polish` | Coordinated polish: perf + art + audio + QA | 6 |
| `/gamedev:team-release` | Release coordination: build + QA + deployment | 7 |
| `/gamedev:team-live-ops` | Live-ops planning: seasonal events, battle pass, retention | 7+ |
| `/gamedev:team-qa` | Full QA cycle: strategy, execution, coverage, sign-off | 6-7 |

---

## Appendix C: Common Workflows

### Workflow 1: "I just started and have no game idea"

```
1. /gamedev:start (routes you based on where you are)
2. /gamedev:brainstorm (collaborative ideation, pick a concept)
3. /gamedev:setup-engine (pin engine and version)
4. /gamedev:design-review on concept doc (optional, recommended)
5. /gamedev:map-systems (decompose concept into systems with deps and priorities)
6. /gamedev:gate-check concept (verify you're ready for Systems Design)
7. /gamedev:design-system per system (guided GDD authoring)
```

### Workflow 2: "I have designs and want to start coding"

```
1. /gamedev:design-review on each GDD (make sure they're solid)
2. /gamedev:review-all-gdds (cross-GDD consistency)
3. /gamedev:gate-check systems-design
4. /gamedev:create-architecture + /gamedev:architecture-decision (per major decision)
5. /gamedev:architecture-review
6. /gamedev:create-control-manifest
7. /gamedev:gate-check technical-setup
8. /gamedev:create-epics layer: foundation + /gamedev:create-stories [slug] (define epics + milestones, break into stories + Backlog tasks)
9. Prioritize the milestone's tasks on the Backlog board
10. /gamedev:story-readiness -> /gamedev:dev-story -> /gamedev:code-review -> /gamedev:story-done (story lifecycle)
```

### Workflow 3: "I need to add a complex feature mid-production"

```
1. /gamedev:design-system or /gamedev:quick-design (depending on scope)
2. /gamedev:design-review to validate
3. /gamedev:propagate-design-change if modifying existing GDDs
4. /gamedev:estimate for effort and risk
5. /gamedev:team-combat, /gamedev:team-narrative, /gamedev:team-ui, etc. (appropriate team skill)
6. /gamedev:story-done when complete
7. /gamedev:balance-check if it affects game balance
```

### Workflow 4: "Something broke in production"

```
1. /gamedev:hotfix "description of the issue"
2. Fix is implemented on hotfix branch
3. /gamedev:code-review the fix
4. Run tests
5. /gamedev:release-checklist for hotfix build
6. Deploy and backport
```

### Workflow 5: "I have an existing project and want to use this system"

```
1. /gamedev:start (choose Path D -- existing work)
2. /gamedev:project-stage-detect (determines current phase)
3. /gamedev:adopt (audits existing artifacts, builds migration plan)
4. /gamedev:design-system retrofit [path] (fill GDD gaps)
5. /gamedev:architecture-decision retrofit [path] (fill ADR gaps)
6. /gamedev:gate-check at appropriate transition
```

### Workflow 6: "Working the board (continuous flow)"

```
1. Read the Backlog board (filter to the current milestone)
2. /gamedev:scope-check [epic or story path] (ensure scope is manageable)
3. Pull the top-most ready task
4. /gamedev:story-readiness per task before pickup
5. /gamedev:dev-story to implement (sets the task In Progress)
6. /gamedev:code-review the changeset
7. /gamedev:story-done per completed task (sets the task Done, surfaces the next one)
```

### Workflow 7: "Shipping the game"

```
1. /gamedev:gate-check polish (verify Polish phase is complete)
2. /gamedev:tech-debt (decide what's acceptable at launch)
3. /gamedev:localize (final localization pass)
4. /gamedev:release-checklist v1.0.0
5. /gamedev:launch-checklist (full cross-department validation)
6. /gamedev:team-release (coordinate the release)
7. /gamedev:patch-notes and /gamedev:changelog
8. Ship!
9. /gamedev:hotfix if anything breaks post-launch
10. Post-mortem after launch stabilizes
```

### Workflow 8: "I'm lost / don't know what to do next"

```
1. /gamedev:help (reads your phase, checks artifacts, tells you what's next)
2. If /gamedev:help doesn't help: /gamedev:project-stage-detect (full audit)
3. If stage seems wrong: /gamedev:gate-check at the transition you think you're at
```

---

## Tips for Getting the Most Out of the System

1. **Always start with design, then implement.** The agent system is built
   around the assumption that a design document exists before code is written.
   Agents reference GDDs constantly.

2. **Use team skills for cross-cutting features.** Do not try to manually
   coordinate 4 agents yourself -- let `/gamedev:team-combat`, `/gamedev:team-narrative`,
   etc. handle the orchestration.

3. **Trust the rules system.** When a rule flags something in your code, fix
   it. The rules encode hard-won game development wisdom (data-driven values,
   delta time, accessibility, etc.).

4. **Compact proactively.** At ~65-70% context usage, compact or `/clear`.
   The pre-compact hook saves your progress. Do not wait until you are at the
   limit.

5. **Use the right tier of agent.** Do not ask `creative-director` to write a
   shader. Do not ask `qa-tester` to make design decisions. The hierarchy
   exists for a reason.

6. **Run /gamedev:help when uncertain.** It reads your actual project state and tells
   you the single most important next step.

7. **Run `/gamedev:design-review` before handing designs to programmers.** This
   catches incomplete specs early, saving rework.

8. **Run `/gamedev:code-review` after every major feature.** Catch architectural
   issues before they propagate.

9. **Prototype risky mechanics first.** A day of prototyping can save a week
   of production on a mechanic that does not work.

10. **Keep your scope honest.** Use `/gamedev:scope-check` regularly and keep the board
    prioritized. Scope creep is the number one killer of indie games.

11. **Document decisions with ADRs.** Future-you will thank present-you for
    recording *why* things were built the way they were.

12. **Use the story lifecycle religiously.** `/gamedev:story-readiness` before pickup,
    `/gamedev:story-done` after completion. This catches deviations early and keeps
    the pipeline honest.

13. **Write to files early and often.** Incremental section writing means your
    design decisions survive crashes and compactions. The file is the memory,
    not the conversation.

# Game Studio Agent Architecture -- Quick Start Guide

## What Is This?

This is a complete Claude Code agent architecture for game development. It
organizes 53 specialized AI agents into a studio hierarchy that mirrors
real game development teams, with defined responsibilities, delegation
rules, and coordination protocols. It includes engine-specialist agents
for Godot, Unity, Unreal, and Bevy — each with dedicated sub-specialists for
major engine subsystems. All design agents and templates are grounded in
established game design theory (MDA Framework, Self-Determination Theory,
Flow State, Bartle Player Types). Use whichever engine set matches your project.

## How to Use

### 1. Understand the Hierarchy

There are three tiers of agents:

- **Tier 1**: Directors who make high-level decisions
  - `creative-director` -- vision and creative conflict resolution
  - `technical-director` -- architecture and technology decisions
  - `producer` -- scheduling, coordination, and risk management

- **Tier 2**: Department leads who own their domain
  - `game-designer`, `lead-programmer`, `art-director`, `audio-director`,
    `narrative-director`, `qa-lead`, `release-manager`, `localization-lead`

- **Tier 3**: Specialists who execute within their domain
  - Designers, programmers, artists, writers, testers, engineers

Exact model per agent lives in `coordination-rules.md` (directors on
Fable, department leads on Opus 4.8, specialists on Sonnet).

### 2. Pick the Right Agent for the Job

Ask yourself: "What department would handle this in a real studio?"

| I need to... | Use this agent |
|-------------|---------------|
| Design a new mechanic | `game-designer` |
| Write combat code | `gameplay-programmer` |
| Create a shader | `technical-artist` |
| Write dialogue | `writer` |
| Plan the next sprint | `producer` |
| Review code quality | `lead-programmer` |
| Write test cases | `qa-tester` |
| Design a level | `level-designer` |
| Fix a performance problem | `performance-analyst` |
| Set up CI/CD | `devops-engineer` |
| Design a loot table | `economy-designer` |
| Resolve a creative conflict | `creative-director` |
| Make an architecture decision | `technical-director` |
| Manage a release | `release-manager` |
| Prepare strings for translation | `localization-lead` |
| Test a mechanic idea quickly | `prototyper` |
| Review code for security issues | `security-engineer` |
| Check accessibility compliance | `accessibility-specialist` |
| Get Unreal Engine advice | `unreal-specialist` |
| Get Unity advice | `unity-specialist` |
| Get Godot advice | `godot-specialist` |
| Get Bevy advice | `bevy-specialist` |
| Design GAS abilities/effects | `ue-gas-specialist` |
| Define BP/C++ boundaries | `ue-blueprint-specialist` |
| Implement UE replication | `ue-replication-specialist` |
| Build UMG/CommonUI widgets | `ue-umg-specialist` |
| Design DOTS/ECS architecture | `unity-dots-specialist` |
| Write Unity shaders/VFX | `unity-shader-specialist` |
| Manage Addressable assets | `unity-addressables-specialist` |
| Build UI Toolkit/UGUI screens | `unity-ui-specialist` |
| Write idiomatic GDScript | `godot-gdscript-specialist` |
| Write Godot C# code | `godot-csharp-specialist` |
| Create Godot shaders | `godot-shader-specialist` |
| Build GDExtension modules | `godot-gdextension-specialist` |
| Write idiomatic Bevy Rust / ECS | `bevy-rust-specialist` |
| Create Bevy WGSL shaders/materials | `bevy-render-specialist` |
| Build bevy_ui screens | `bevy-ui-specialist` |
| Plan live events and seasons | `live-ops-designer` |
| Write patch notes for players | `community-manager` |
| Brainstorm a new game idea | Use `/gamedev:brainstorm` skill |

### 3. Use Slash Commands for Common Tasks

| Command | What it does |
|---------|-------------|
| `/gamedev:start` | First-time onboarding — asks where you are, guides you to the right workflow |
| `/gamedev:help` | Context-aware "what do I do next?" — reads your current phase and artifacts |
| `/gamedev:project-stage-detect` | Analyze project state, detect stage, identify gaps |
| `/gamedev:setup-engine` | Configure engine + version, populate reference docs |
| `/gamedev:adopt` | Brownfield audit and migration plan for existing projects |
| `/gamedev:brainstorm` | Guided game concept ideation from scratch |
| `/gamedev:map-systems` | Decompose concept into systems, map dependencies, guide per-system GDDs |
| `/gamedev:design-system` | Guided, section-by-section GDD authoring for a single game system |
| `/gamedev:quick-design` | Lightweight spec for small changes — tuning, tweaks, minor additions |
| `/gamedev:review-all-gdds` | Cross-GDD consistency and game design theory review |
| `/gamedev:propagate-design-change` | Find ADRs and stories affected by a GDD change |
| `/gamedev:art-bible` | Guided, section-by-section Art Bible authoring — creates visual identity spec before asset production |
| `/gamedev:asset-spec` | Generate per-asset visual specifications and AI generation prompts from GDDs or character profiles |
| `/gamedev:ux-design` | Author UX specs (screen/flow, HUD, interaction patterns) |
| `/gamedev:ux-review` | Validate UX specs for accessibility and GDD alignment |
| `/gamedev:create-architecture` | Master architecture document for the game |
| `/gamedev:architecture-decision` | Creates an ADR |
| `/gamedev:architecture-review` | Validate all ADRs, dependency ordering, GDD traceability |
| `/gamedev:create-control-manifest` | Flat programmer rules sheet from Accepted ADRs |
| `/gamedev:create-epics` | Translate GDDs + ADRs into epics (one per architectural module) |
| `/gamedev:create-stories` | Break a single epic into implementable story files |
| `/gamedev:dev-story` | Read a story and implement it — routes to the correct programmer agent |
| `/gamedev:story-readiness` | Validate a story is implementation-ready before pickup |
| `/gamedev:story-done` | End-of-story completion review — verifies acceptance criteria |
| `/gamedev:estimate` | Produces structured effort estimates |
| `/gamedev:design-review` | Reviews a design document |
| `/gamedev:code-review` | Reviews code for quality and architecture |
| `/gamedev:balance-check` | Analyzes game balance data |
| `/gamedev:asset-audit` | Audits assets for compliance |
| `/gamedev:content-audit` | GDD-specified content vs. implemented — find gaps |
| `/gamedev:scope-check` | Detect scope creep against plan |
| `/gamedev:perf-profile` | Performance profiling and bottleneck ID |
| `/gamedev:tech-debt` | Scan, track, and prioritize tech debt |
| `/gamedev:gate-check` | Validate phase readiness (PASS/CONCERNS/FAIL) |
| `/gamedev:consistency-check` | Scan all GDDs for cross-document inconsistencies (conflicting stats, names, rules) |
| `/gamedev:security-audit` | Audit for security vulnerabilities: save tampering, cheat vectors, network exploits, data exposure |
| `/gamedev:reverse-document` | Generate design/architecture docs from existing code |
| `/gamedev:bug-report` | File a bug as a Backlog task (bug label); verify/close via Backlog |
| `/gamedev:playtest-report` | Creates or analyzes playtest feedback |
| `/gamedev:release-checklist` | Validates pre-release checklist |
| `/gamedev:launch-checklist` | Complete launch readiness validation |
| `/gamedev:changelog` | Generates changelog from git history |
| `/gamedev:patch-notes` | Generate player-facing patch notes |
| `/gamedev:hotfix` | Emergency fix with audit trail |
| `/gamedev:prototype` | Concept prototype — validate core idea before writing GDDs (Phase 1) |
| `/gamedev:vertical-slice` | Production-quality end-to-end build — validate full game loop (Phase 4) |
| `/gamedev:localize` | Localization scan, extract, validate |
| `/gamedev:team-combat` | Orchestrate full combat team pipeline |
| `/gamedev:team-narrative` | Orchestrate full narrative team pipeline |
| `/gamedev:team-ui` | Orchestrate full UI team pipeline |
| `/gamedev:team-release` | Orchestrate full release team pipeline |
| `/gamedev:team-polish` | Orchestrate full polish team pipeline |
| `/gamedev:team-audio` | Orchestrate full audio team pipeline |
| `/gamedev:team-level` | Orchestrate full level creation pipeline |
| `/gamedev:team-live-ops` | Orchestrate live-ops team for seasons, events, and post-launch content |
| `/gamedev:team-qa` | Orchestrate full QA team cycle — test plan, test cases, smoke check, sign-off |
| `/gamedev:qa-plan` | Generate a QA test plan for a milestone or feature |
| `/gamedev:smoke-check` | Run critical path smoke test gate before QA hand-off (PASS/FAIL) |
| `/gamedev:soak-test` | Generate a soak test protocol for extended play sessions |
| `/gamedev:regression-suite` | Map coverage to GDD critical paths, flag gaps, maintain regression suite |
| `/gamedev:test-setup` | Scaffold test framework + CI pipeline for the project's engine (run once) |
| `/gamedev:test-helpers` | Generate engine-specific test helper libraries and factory functions |
| `/gamedev:test-flakiness` | Detect flaky tests from CI history, flag for quarantine or fix |
| `/gamedev:test-evidence-review` | Quality review of test files and manual evidence — ADEQUATE/INCOMPLETE/MISSING |
| `/gamedev:skill-test` | Validate skill files for compliance and correctness (static / spec / audit) |
| `/gamedev:skill-improve` | Improve a skill using a test-fix-retest loop — diagnose, propose fix, rewrite, verify |

### 4. Use Templates for New Documents

Templates are in `templates/`:

- `game-design-document.md` -- for new mechanics and systems
- `architecture-decision-record.md` -- for technical decisions
- `architecture-traceability.md` -- maps GDD requirements to ADRs to story IDs
- `risk-register-entry.md` -- for new risks
- `narrative-character-sheet.md` -- for new characters
- `test-plan.md` -- for feature test plans
- `milestone-definition.md` -- for new milestones
- `level-design-document.md` -- for new levels
- `game-pillars.md` -- for core design pillars
- `art-bible.md` -- for visual style reference
- `technical-design-document.md` -- for per-system technical designs
- `post-mortem.md` -- for project/milestone retrospectives
- `sound-bible.md` -- for audio style reference
- `release-checklist-template.md` -- for platform release checklists
- `changelog-template.md` -- for player-facing patch notes
- `release-notes.md` -- for player-facing release notes
- `incident-response.md` -- for live incident response playbooks
- `game-concept.md` -- for initial game concepts (MDA, SDT, Flow, Bartle)
- `pitch-document.md` -- for pitching the game to stakeholders
- `economy-model.md` -- for virtual economy design (sink/faucet model)
- `faction-design.md` -- for faction identity, lore, and gameplay role
- `systems-index.md` -- for systems decomposition and dependency mapping
- `project-stage-report.md` -- for project stage detection output
- `design-doc-from-implementation.md` -- for reverse-documenting existing code into GDDs
- `architecture-doc-from-code.md` -- for reverse-documenting code into architecture docs
- `concept-doc-from-prototype.md` -- for reverse-documenting prototypes into concept docs
- `ux-spec.md` -- for per-screen UX specifications (layout zones, states, events)
- `hud-design.md` -- for whole-game HUD philosophy, zones, and element specs
- `accessibility-requirements.md` -- for project-wide accessibility tier and feature matrix
- `interaction-pattern-library.md` -- for standard UI controls and game-specific patterns
- `player-journey.md` -- for 6-phase emotional arc and retention hooks by time scale
- `difficulty-curve.md` -- for difficulty axes, onboarding ramp, and cross-system interactions
- `test-evidence.md` -- template for recording manual test evidence (screenshots, walkthrough notes)

Also in `templates/collaborative-protocols/` (used by agents, not typically edited directly):

- `design-agent-protocol.md` -- question-options-draft-approval cycle for design agents
- `implementation-agent-protocol.md` -- story pickup through /gamedev:story-done cycle for programming agents
- `leadership-agent-protocol.md` -- cross-department delegation and escalation for director-tier agents

### 5. Follow the Coordination Rules

1. Work flows down the hierarchy: Directors -> Leads -> Specialists
2. Conflicts escalate up the hierarchy
3. Cross-department work is coordinated by the `producer`
4. Agents do not modify files outside their domain without delegation
5. All decisions are documented

## First Steps for a New Project

**Don't know where to begin?** Run `/gamedev:start`. It asks where you are and routes
you to the right workflow. No assumptions about your game, engine, or experience level.

If you already know what you need, jump directly to the relevant path:

### Path A: "I have no idea what to build"

1. **Run `/gamedev:start`** (or `/gamedev:brainstorm open`) — guided creative exploration:
   what excites you, what you've played, your constraints
   - Generates 3 concepts, helps you pick one, defines core loop and pillars
   - Produces a game concept document and recommends an engine
2. **Set up the engine** — Run `/gamedev:setup-engine` (uses the brainstorm recommendation)
   - Configures CLAUDE.md, detects knowledge gaps, populates reference docs
   - Creates `.claude/docs/technical-preferences.md` with naming conventions,
     performance budgets, and engine-specific defaults
   - If the engine version is newer than the LLM's training data, it fetches
     current docs from the web so agents suggest correct APIs
3. **Validate the concept** — Run `/gamedev:design-review design/gdd/game-concept.md`
4. **Decompose into systems** — Run `/gamedev:map-systems` to map all systems and dependencies
5. **Design each system** — Run `/gamedev:design-system [system-name]` (or `/gamedev:map-systems next`)
   to write GDDs in dependency order
6. **Prototype the mechanic** — Run `/gamedev:prototype [core-mechanic]` (1–3 days — before writing GDDs)
7. **Design each system** — Run `/gamedev:design-system [system-name]` to write GDDs, informed by prototype findings
8. **Define the first epic** — After architecture and `/gamedev:vertical-slice`, run `/gamedev:create-epics` then `/gamedev:create-stories` to fill the Backlog board
9. Start building

### Path B: "I know what I want to build"

If you already have a game concept and engine choice:

1. **Set up the engine** — Run `/gamedev:setup-engine [engine] [version]`
   (e.g., `/gamedev:setup-engine godot 4.6`) — also creates technical preferences
2. **Write the Game Pillars** — delegate to `creative-director`
3. **Decompose into systems** — Run `/gamedev:map-systems` to enumerate systems and dependencies
4. **Design each system** — Run `/gamedev:design-system [system-name]` for GDDs in dependency order
5. **Create the initial ADR** — Run `/gamedev:architecture-decision`
6. **Define the first epic** — Run `/gamedev:create-epics` (mints a Backlog milestone)
7. **Break it into stories** — Run `/gamedev:create-stories [epic]` to fill the board
8. Start building

### Path C: "I know the game but not the engine"

If you have a concept but don't know which engine fits:

1. **Run `/gamedev:setup-engine`** with no arguments — it will ask about your game's
   needs (2D/3D, platforms, team size, language preferences) and recommend
   an engine based on your answers
2. Follow Path B from step 2 onward

### Path D: "I have an existing project"

If you have design docs, prototypes, or code already:

1. **Run `/gamedev:start`** (or `/gamedev:project-stage-detect`) — analyzes what exists,
   identifies gaps, and recommends next steps
2. **Run `/gamedev:adopt`** if you have existing GDDs, ADRs, or stories — audits
   internal format compliance and builds a numbered migration plan to fill gaps
   without overwriting your existing work
3. **Configure engine if needed** — Run `/gamedev:setup-engine` if not yet configured
4. **Validate phase readiness** — Run `/gamedev:gate-check` to see where you stand
5. **Pick up work** — check the Backlog board for the next ready task

## File Structure Reference

```
CLAUDE.md                          -- Master config (read this first, ~60 lines)
.claude/
  settings.json                    -- Claude Code hooks and project settings
  agents/                          -- 53 agent definitions (YAML frontmatter)
  skills/                          -- 66 slash command definitions (YAML frontmatter)
  hooks/                           -- 12 hook scripts (.sh) wired by settings.json
  rules/                           -- 11 path-specific rule files
  docs/
    quick-start.md                 -- This file
    technical-preferences.md       -- Project-specific standards (populated by /gamedev:setup-engine)
    coding-standards.md            -- Coding and design doc standards
    coordination-rules.md          -- Agent coordination rules
    context-management.md          -- Context budgets and compaction instructions
    directory-structure.md         -- Project directory layout
    workflow-catalog.yaml          -- 7-phase pipeline definition (read by /gamedev:help)
    setup-requirements.md          -- System prerequisites (Git Bash, jq, Python)
    settings-local-template.md     -- Personal settings.local.json guide
    templates/                     -- 41 document templates
```

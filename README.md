<p align="center">
  <h1 align="center">Claude Code Game Studios</h1>
  <p align="center">
    Turn a single Claude Code session into a full game development studio.
    <br />
    53 agents. 72 skills. One coordinated AI team.
  </p>
</p>

---

## Why This Exists

Building a game solo with AI is powerful — but a single chat session has no structure. No one stops you from hardcoding magic numbers, skipping design docs, or writing spaghetti code. There's no QA pass, no design review, no one asking "does this actually fit the game's vision?"

**Claude Code Game Studios** solves this by giving your AI session the structure of a real studio. Instead of one general-purpose assistant, you get 53 specialized agents organized into a studio hierarchy — directors who guard the vision, department leads who own their domains, and specialists who do the hands-on work. Each agent has defined responsibilities, escalation paths, and quality gates.

The result: you still make every decision, but now you have a team that asks the right questions, catches mistakes early, and keeps your project organized from first brainstorm to launch.

---

## Table of Contents

- [What's Included](#whats-included)
- [Studio Hierarchy](#studio-hierarchy)
- [Slash Commands](#slash-commands)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Design Philosophy](#design-philosophy)
- [Customization](#customization)
- [Platform Support](#platform-support)
- [Community](#community)
- [Supporting This Project](#supporting-this-project)
- [License](#license)

---

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| **Agents** | 53 | Specialized subagents across design, programming, art, audio, narrative, QA, and production |
| **Skills** | 72 | Slash commands for every workflow phase (`/gamedev:start`, `/gamedev:design-system`, `/gamedev:create-epics`, `/gamedev:create-stories`, `/gamedev:dev-story`, `/gamedev:story-done`, etc.) |
| **Hooks** | 11 | Automated validation on commits, pushes, asset changes, session lifecycle, agent audit trail, and gap detection |
| **Rules** | 11 | Path-scoped coding standards enforced when editing gameplay, engine, AI, UI, network code, and more |
| **Templates** | 41 | Document templates for GDDs, UX specs, ADRs, HUD design, accessibility, and more |

## Studio Hierarchy

Agents are organized into three tiers, matching how real studios operate:

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

Model per agent is set in the plugin's `docs/coordination-rules.md`: the two directors
(`creative-director`, `technical-director`) and `game-designer` — a load-bearing role
in any studio — run on Fable, the other department leads on Opus 4.8, and all
specialists on Sonnet.

### Engine Specialists

The plugin includes agent sets for four engines. Use the set that matches your project:

| Engine | Lead Agent | Sub-Specialists |
|--------|-----------|-----------------|
| **Godot 4** | `godot-specialist` | GDScript, C#, Shaders, GDExtension |
| **Unity** | `unity-specialist` | DOTS/ECS, Shaders/VFX, Addressables, UI Toolkit |
| **Unreal Engine 5** | `unreal-specialist` | GAS, Blueprints, Replication, UMG/CommonUI |
| **Bevy** | `bevy-specialist` | Rust/ECS, Rendering/WGSL, bevy_ui |

## Slash Commands

Type `/` in Claude Code to access all 72 skills. Arguments in `[brackets]` are
optional, `<angle brackets>` required. Most authoring, team, and gate skills also
accept a review-depth flag — `--review full|lean|solo` (`--depth` for
`/gamedev:design-review`) — omitted below for brevity.

**Onboarding & Navigation**
- `/gamedev:start` — first-time onboarding: asks where you are, then routes you to the right workflow
- `/gamedev:help [what you just finished]` — advice on what to do next, based on current project state
- `/gamedev:status` — print the current production stage and Epic > Feature > Task breadcrumb
- `/gamedev:project-stage-detect [role filter]` — analyze project state, detect the stage, identify gaps, recommend next steps
- `/gamedev:setup-engine [engine] [version] | refresh | upgrade <old> <new>` — pin the project's engine and version, populate engine reference docs
- `/gamedev:adopt [full|gdds|adrs|stories|infra]` — brownfield onboarding: audit existing artifacts for format compliance, produce a migration plan

**Game Design**
- `/gamedev:brainstorm [genre or theme hint]` — guided ideation from zero idea to a structured game concept document
- `/gamedev:map-systems [next | system-name]` — decompose the concept into systems, map dependencies, set the design order
- `/gamedev:design-system <system-name>` — guided, section-by-section GDD authoring for one system
- `/gamedev:quick-design [change description]` — lightweight design spec for tuning adjustments and minor mechanics
- `/gamedev:review-all-gdds [focus]` — holistic cross-GDD review: contradictions, stale references, design-theory violations
- `/gamedev:propagate-design-change [path/to/gdd.md]` — find ADRs made stale by a GDD revision and guide resolution

**Art & Assets**
- `/gamedev:art-bible` — guided Art Bible authoring; the visual identity spec that gates asset production
- `/gamedev:asset-spec [system:|level:|character:<name>]` — per-asset visual specs and AI generation prompts from GDDs
- `/gamedev:asset-audit [category|all]` — audit assets against naming, size, format, and pipeline standards

**UX & Interface Design**
- `/gamedev:ux-design [screen/flow | hud | patterns]` — guided UX spec authoring for a screen, flow, or HUD
- `/gamedev:ux-review [file | all | hud | patterns]` — validate UX specs for completeness, accessibility, and GDD alignment

**Architecture**
- `/gamedev:create-architecture [focus-area]` — guided authoring of the master architecture document from all GDDs
- `/gamedev:architecture-decision [title]` — record an ADR: context, alternatives considered, consequences
- `/gamedev:architecture-review [focus]` — validate architecture against all GDDs; traceability matrix and PASS/CONCERNS/FAIL verdict
- `/gamedev:create-control-manifest [update]` — flat must-do/never-do rules sheet for programmers, extracted from accepted ADRs

**Stories**
- `/gamedev:create-epics [system-name | layer | all]` — translate approved GDDs and architecture into epics, one per module
- `/gamedev:create-stories [epic-slug]` — break one epic into implementable story files with embedded GDD/ADR context
- `/gamedev:dev-story [story-path]` — implement a story end-to-end: load context, route to the right programmer agent, code and test
- `/gamedev:story-readiness [story | all | milestone]` — READY / NEEDS WORK / BLOCKED verdict before implementation starts
- `/gamedev:story-done [story-path]` — end-of-story review: verify acceptance criteria, close the Backlog task, surface the next one
- `/gamedev:estimate [task-description]` — effort estimate from complexity, dependencies, historical velocity, and risk

**Reviews & Analysis**
- `/gamedev:design-review [path-to-doc]` — review one design doc for completeness, consistency, and implementability
- `/gamedev:code-review [path]` — architectural and quality review: standards, patterns, SOLID, testability, performance
- `/gamedev:balance-check [system | data-file]` — find outliers, broken progressions, degenerate strategies, economy imbalances
- `/gamedev:content-audit [system | --summary]` — compare GDD-specified content counts against what's implemented
- `/gamedev:scope-check [feature | sprint-N]` — detect scope creep against the original plan; quantify bloat, recommend cuts
- `/gamedev:perf-profile [system | full]` — structured profiling: bottlenecks, budget comparisons, prioritized recommendations
- `/gamedev:tech-debt [scan|add|prioritize|report]` — track and prioritize technical debt in a debt register
- `/gamedev:gate-check [target-phase]` — phase-gate readiness verdict (PASS/CONCERNS/FAIL) with specific blockers
- `/gamedev:consistency-check [full | entity:<name> | item:<name>]` — cross-GDD scan for conflicting stats, values, and formulas
- `/gamedev:security-audit [full | network | save | input | quick]` — save-tampering, cheat, network, and input-validation audit

**QA & Testing**
- `/gamedev:qa-plan [milestone | feature | story]` — QA test plan: classify stories by test type, define required coverage
- `/gamedev:smoke-check [milestone | quick]` — critical-path smoke gate before QA hand-off; PASS/FAIL report
- `/gamedev:soak-test [duration] [focus]` — protocol for extended play sessions: slow leaks, fatigue effects, edge cases
- `/gamedev:regression-suite [update | audit | report]` — map tests to GDD critical paths, catch fixed bugs lacking regression tests
- `/gamedev:test-setup [force]` — scaffold the engine-specific test framework and CI pipeline (run once)
- `/gamedev:test-helpers [system | all | scaffold]` — generate engine-specific assertion, factory, and mock helpers
- `/gamedev:test-evidence-review [story | milestone | system]` — quality review of tests and manual evidence; verdict per story
- `/gamedev:test-flakiness [ci-log | scan | registry]` — detect non-deterministic tests, recommend quarantine or fix
- `/gamedev:skill-test static|spec|category|audit [skill]` — validate the plugin's own skills, structurally and behaviorally
- `/gamedev:skill-improve [skill-name]` — improve a skill via a test-fix-retest loop

**Production**
- `/gamedev:bug-report [description] | analyze <path> | verify <id> | close <id>` — structured bug reports as Backlog tasks with repro steps
- `/gamedev:reverse-document <type> <path>` — generate missing design or architecture docs from existing code
- `/gamedev:playtest-report [new | analyze <path>]` — standardized playtest feedback collection and analysis

**Release**
- `/gamedev:release-checklist [platform]` — pre-release validation: build verification, certification, store metadata
- `/gamedev:launch-checklist [date | dry-run]` — launch readiness across every department, with go/no-go sign-offs
- `/gamedev:changelog [version | sprint]` — internal and player-facing changelogs from commits and sprint data
- `/gamedev:patch-notes [version] [--style brief|detailed|full]` — player-facing patch notes, translated from developer language
- `/gamedev:hotfix [bug-id]` — emergency fix workflow with a full audit trail, bypassing the normal sprint process

**Creative & Content**
- `/gamedev:prototype [concept] [--path html|engine|paper] [--spike]` — throwaway concept prototype with a PROCEED/PIVOT/KILL verdict
- `/gamedev:vertical-slice` — production-quality end-to-end build gating the Pre-Production → Production transition
- `/gamedev:localize [scan|extract|validate|status|brief|…]` — full localization pipeline, from string scan to RTL checks

**Change Management (OpenSpec)**
- `/gamedev:openspec-propose` — propose a change with design, specs, and tasks generated in one step
- `/gamedev:openspec-explore` — thinking-partner mode for exploring ideas before or during a change
- `/gamedev:openspec-apply-change` — implement tasks from an OpenSpec change
- `/gamedev:openspec-sync-specs` — fold a change's delta specs into the main specs without archiving
- `/gamedev:openspec-archive-change` — archive a completed change

**Team Orchestration** (each coordinates multiple agents on a single feature)
- `/gamedev:team-combat [feature]` — combat feature end-to-end: design, implementation, VFX, audio, QA
- `/gamedev:team-narrative [content]` — cohesive story content, world lore, and narrative-driven level design
- `/gamedev:team-ui [feature]` — full UX pipeline: spec, visual design, implementation, review, polish
- `/gamedev:team-release [version]` — execute a release from candidate to deployment
- `/gamedev:team-polish [feature or area]` — optimize, polish, and harden a feature to release quality
- `/gamedev:team-audio [feature or area]` — audio pipeline from direction through implementation
- `/gamedev:team-level [level or area]` — complete area/level creation: layout, narrative, art, systems, QA
- `/gamedev:team-live-ops [season or event]` — plan a season, event, or live content update
- `/gamedev:team-qa [milestone | feature]` — full QA cycle: test plan, test cases, smoke gate, sign-off report

## Getting Started

> **Adoption model changed.** This project is now a **Claude Code plugin** named
> `gamedev`, not a fork-me template. You install it into your own game project;
> you no longer clone this repo as your game. Existing forks keep working as a
> frozen snapshot, but new adoption uses the plugin flow below.

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with plugin support
  (verified on **v2.1.226**; any recent 2.1.x should work)
- [Git](https://git-scm.com/)
- **Recommended**: [jq](https://jqlang.github.io/jq/) (for hook validation) and Python 3 (for JSON validation)

All hooks fail gracefully if optional tools are missing — nothing breaks, you just lose validation.

### Setup

1. **Add this repo as a plugin marketplace and install the plugin** (from inside Claude Code):
   ```
   /plugin marketplace add kessriga/game-studio
   /plugin install gamedev@game-studio
   ```

2. **Open your game project** (a fresh, empty directory is fine) and start Claude Code:
   ```bash
   cd my-game
   claude
   ```

3. **Run `/gamedev:start`** — on a fresh project it scaffolds the project-side
   structure (`CLAUDE.md`, `.claude/rules/`, `technical-preferences.md`, the
   `production/`/`design/`/`docs/` tree, and your engine's reference), then asks
   where you are (no idea, vague concept, clear design, existing work) and guides
   you to the right workflow. Nothing existing is overwritten.

   Once scaffolded, jump to any skill directly:
   - `/gamedev:brainstorm` — explore game ideas from scratch
   - `/gamedev:setup-engine godot 4.6` — configure your engine if you already know
   - `/gamedev:project-stage-detect` — analyze an existing project
   - `/gamedev:status` — quick production-stage + Epic > Feature > Task check

## Project Structure

**The plugin** (this repo — installed, not cloned into your game):

```
.claude-plugin/
  plugin.json                       # Plugin manifest (name: gamedev)
  marketplace.json                  # This repo is its own marketplace (source: ./)
skills/                             # 72 skills — invoked as /gamedev:<name>
agents/                             # 53 subagents — addressed as gamedev:<name>
hooks/                              # hooks.json + 11 hook scripts (run from ${CLAUDE_PLUGIN_ROOT})
bin/
  gamedev-stage                     # Stage + Epic>Feature>Task detection (on the Bash PATH)
docs/                               # Framework docs + 41 document templates (skills read via ../../docs)
templates/                          # Project scaffold sources copied out by /gamedev:start
.claude/                            # Dev-only, not shipped: settings.json, validate-skill-change, opsx/
```

**Your project** (scaffolded into your repo by `/gamedev:start`):

```
CLAUDE.md                           # Project config (imports technical-preferences + engine VERSION)
.claude/
  rules/                            # 11 path-scoped coding standards (plugins can't ship rules)
  docs/technical-preferences.md     # Your engine, naming, budgets (project-owned)
src/                                # Game source code
assets/                             # Art, audio, VFX, shaders, data files
design/                             # GDDs, narrative docs, level designs
docs/                               # ADRs, registries, your engine's reference snapshot
production/                         # Milestones, releases, QA evidence, session state
prototypes/                         # Throwaway prototypes (isolated from src/)
```

> **No status line.** A plugin cannot ship a main-session status line, so the
> production stage + breadcrumb is delivered by the SessionStart hook and on demand
> via `/gamedev:status` instead. Your personal status line is left untouched.

## How It Works

### Agent Coordination

Agents follow a structured delegation model:

1. **Vertical delegation** — directors delegate to leads, leads delegate to specialists
2. **Horizontal consultation** — same-tier agents can consult each other but can't make binding cross-domain decisions
3. **Conflict resolution** — disagreements escalate up to the shared parent (`creative-director` for design, `technical-director` for technical)
4. **Change propagation** — cross-department changes are coordinated by `producer`
5. **Domain boundaries** — agents don't modify files outside their domain without explicit delegation

### Collaborative, Not Autonomous

This is **not** an auto-pilot system. Every agent follows a strict collaboration protocol:

1. **Ask** — agents ask questions before proposing solutions
2. **Present options** — agents show 2-4 options with pros/cons
3. **You decide** — the user always makes the call
4. **Draft** — agents show work before finalizing
5. **Approve** — nothing gets written without your sign-off

You stay in control. The agents provide structure and expertise, not autonomy.

### Automated Safety

**Hooks** run automatically on every session:

| Hook | Trigger | What It Does |
|------|---------|--------------|
| `validate-commit.sh` | PreToolUse (Bash) | Checks for hardcoded values, TODO format, JSON validity, design doc sections — exits early if the command is not `git commit` |
| `validate-push.sh` | PreToolUse (Bash) | Warns on pushes to protected branches — exits early if the command is not `git push` |
| `validate-assets.sh` | PostToolUse (Write/Edit) | Validates naming conventions and JSON structure — exits early if the file is not in `assets/` |
| `session-start.sh` | Session open | Shows current branch and recent commits for orientation |
| `detect-gaps.sh` | Session open | Detects fresh projects (suggests `/gamedev:start`) and missing design docs when code or prototypes exist |
| `pre-compact.sh` | Before compaction | Preserves session progress notes |
| `post-compact.sh` | After compaction | Reminds Claude to restore session state from `active.md` |
| `notify.sh` | Notification event | Shows Windows toast notification via PowerShell |
| `session-stop.sh` | Session close | Archives `active.md` to session log and records git activity |
| `log-agent.sh` | Agent spawned | Audit trail start — logs subagent invocation |
| `log-agent-stop.sh` | Agent stops | Audit trail stop — completes subagent record |
| `validate-skill-change.sh` | PostToolUse (Write/Edit) | Advises running `/gamedev:skill-test` after any `.claude/skills/` change |

> **Note**: `validate-commit.sh`, `validate-assets.sh`, and `validate-skill-change.sh` fire on every Bash/Write tool call and exit immediately (exit 0) when the command or file path is not relevant. This is normal hook behavior — not a performance concern.

**Permission rules** in `settings.json` auto-allow safe operations (git status, test runs) and block dangerous ones (force push, `rm -rf`, reading `.env` files).

### Path-Scoped Rules

Coding standards are automatically enforced based on file location:

| Path | Enforces |
|------|----------|
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

The plugin is a starting point, not a locked framework. Everything you scaffold is yours to customize:

- **Add/remove agents** — delete agent files you don't need, add new ones for your domains
- **Edit agent prompts** — tune agent behavior, add project-specific knowledge
- **Modify skills** — adjust workflows to match your team's process
- **Add rules** — create new path-scoped rules for your project's directory structure
- **Tune hooks** — adjust validation strictness, add new checks
- **Pick your engine** — use the Godot, Unity, Unreal, or Bevy agent set (or none)
- **Set review intensity** — `full` (all director gates), `lean` (phase gates only), or `solo` (none). Set during `/gamedev:start` or edit `production/review-mode.txt`. Override per-run with `--review solo` on any skill.

## Platform Support

Primary development and testing on **Windows 10** with Git Bash. All hooks use POSIX-compatible patterns (`grep -E`, not `grep -P`) and include fallbacks for missing tools, so they should run on macOS and Linux. The `notify.sh` hook uses PowerShell for Windows toast notifications and is a no-op elsewhere — desktop notifications on macOS/Linux are not yet wired. Cross-platform testing is ongoing; please file issues for any platform-specific breakage.

## Community

- **Discussions** — [GitHub Discussions](https://github.com/Donchitos/Claude-Code-Game-Studios/discussions) for questions, ideas, and showcasing what you've built
- **Issues** — [Bug reports and feature requests](https://github.com/Donchitos/Claude-Code-Game-Studios/issues)

---

## Supporting This Project

Claude Code Game Studios is free and open source. If it saves you time or helps you ship your game, consider supporting continued development:

- **[Buy Me a Coffee](https://www.buymeacoffee.com/donchitos3)** — one-time support
- **[GitHub Sponsors](https://github.com/sponsors/Donchitos)** — recurring support through GitHub

Sponsorships help fund time spent maintaining skills, adding new agents, keeping up with Claude Code and engine API changes, and responding to community issues.

---

*Built for Claude Code. Maintained and extended — contributions welcome via [GitHub Discussions](https://github.com/Donchitos/Claude-Code-Game-Studios/discussions).*

## License

MIT License. See [LICENSE](LICENSE) for details.

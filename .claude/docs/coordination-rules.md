# Agent Coordination Rules

1. **Vertical Delegation**: Leadership agents delegate to department leads, who
   delegate to specialists. Never skip a tier for complex decisions.
2. **Horizontal Consultation**: Agents at the same tier may consult each other
   but must not make binding decisions outside their domain.
3. **Conflict Resolution**: When two agents disagree, escalate to the shared
   parent. If no shared parent, escalate to `creative-director` for design
   conflicts or `technical-director` for technical conflicts.
4. **Change Propagation**: When a design change affects multiple domains, the
   `producer` agent coordinates the propagation.
5. **No Unilateral Cross-Domain Changes**: An agent must never modify files
   outside its designated directories without explicit delegation.

## Model Tier Assignment

Agents and skills are assigned to models by task complexity. **Two mechanisms
apply, and the distinction is deliberate:**

- **Agent leadership tiers are version-pinned** — the `model:` frontmatter carries a
  full model ID so the agent runs a *specific* model that does not drift when a new
  family release ships. Specialists deliberately ride the floating `sonnet` alias
  instead, so they track the current everyday model without manual bumps.
- **Skill tiers use floating aliases** (`haiku` / `sonnet` / `opus`), each resolved
  to the latest model of that family at run time.

### Agent model tiers

| Tier | `model:` value | Agents |
|------|----------------|--------|
| **Director** (top-2 authority) | `claude-fable-5` — pinned | creative-director, technical-director |
| **Department lead** | `claude-opus-4-8` — pinned | producer, art-director, narrative-director, audio-director, lead-programmer, qa-lead, release-manager, localization-lead, ux-designer |
| **Specialist** | `sonnet` — floating alias | the other 42 agents — every engine specialist (godot/unity/unreal/bevy), game/systems/level/economy designers, live-ops-designer, analytics-engineer, all programmers, qa-tester, and the operations/creative specialists |

Leadership is pinned because the intent is a *specific* model — Fable for the two
directors, Opus 4.8 for the leads — and the bare `opus` alias names a model family,
not a specific version, so it cannot express "Opus 4.8". Note `narrative-director` and `audio-director` are department
leads despite their names; only the two top authorities are "directors".

### Skill model tiers

Skills declare a floating alias in frontmatter (or none = Sonnet):

| Alias | Resolves to (family latest) | When to use |
|-------|-----------------------------|-------------|
| `haiku` | Haiku 4.5 (`claude-haiku-4-5-20251001`) | Read-only status checks, formatting, simple lookups — no creative judgment needed |
| `sonnet` | latest Sonnet | Implementation, design authoring, analysis of individual systems — default for most work |
| `opus` | latest Opus | Multi-document synthesis, high-stakes phase gate verdicts, cross-system holistic review |

Skills with `model: haiku`: `/help`, `/story-readiness`, `/scope-check`,
`/project-stage-detect`, `/changelog`, `/patch-notes`

Skills with `model: opus`: `/review-all-gdds`, `/architecture-review`, `/gate-check`

All other skills default to Sonnet. When creating new skills, assign Haiku if the
skill only reads and formats; assign Opus if it must synthesize 5+ documents with
high-stakes output; otherwise leave unset (Sonnet).

## Subagents vs Agent Teams

This project uses two distinct multi-agent patterns:

### Subagents (current, always active)
Spawned via `Task` within a single Claude Code session. Used by all `team-*` skills
and orchestration skills. Subagents share the session's permission context, run
sequentially or in parallel within the session, and return results to the parent.

**When to spawn in parallel**: If two subagents' inputs are independent (neither
needs the other's output to begin), spawn both Task calls simultaneously rather
than waiting. Example: `/review-all-gdds` Phase 1 (consistency) and Phase 2
(design theory) are independent — spawn both at the same time.

### Agent Teams (experimental — opt-in)
Multiple independent Claude Code *sessions* running simultaneously, coordinated
via a shared task list. Each session has its own context window and token budget.
Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable.

**Use agent teams when**:
- Work spans multiple subsystems that will not touch the same files
- Each workstream would take >30 minutes and benefits from true parallelism
- A senior agent (technical-director, producer) needs to coordinate 3+ specialist
  sessions working on different epics simultaneously

**Do not use agent teams when**:
- One session's output is required as input for another (use sequential subagents)
- The task fits in a single session's context (use subagents instead)
- Cost is a concern — each team member burns tokens independently

**Current status**: Opt-in via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Document first usage here when adopted.

## Parallel Task Protocol

When an orchestration skill spawns multiple independent agents:

1. Issue all independent Task calls before waiting for any result
2. Collect all results before proceeding to dependent phases
3. If any agent is BLOCKED, surface it immediately — do not silently skip
4. Always produce a partial report if some agents complete and others block

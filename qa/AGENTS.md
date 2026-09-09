# QA — Skill & Agent Testing Framework — Contributor Instructions

This folder is the quality assurance layer for the Game Studio skill/agent framework. It is self-contained and separate
from any game project.

## Key files

| File | Purpose |
| ------ | --------- |
| `catalog.yaml` | Registry of 65 skill specs and 53 agent specs; run the coverage audit to find untracked skills. Contains category, spec path, and last-test tracking fields. Always read this first when running any test command. |
| `quality-rubric.md` | Category-specific pass/fail metrics. Read the matching `###` section for the skill's category when running `/skill:gamedev-skill-test category`. |
| `skills/[category]/[name].md` | Behavioral spec for a skill — 5 test cases + protocol compliance assertions. |
| `agents/[tier]/[name].md` | Behavioral spec for an agent — 5 test cases + protocol compliance assertions. |
| `templates/skill-test-spec.md` | Template for writing new skill spec files. |
| `templates/agent-test-spec.md` | Template for writing new agent spec files. |
| `results/` | Written by `/skill:gamedev-skill-test spec` when results are saved. Gitignored. |

## Path conventions

- Skill specs: `qa/skills/[category]/[name].md`
- Agent specs: `qa/agents/[tier]/[name].md`
- Catalog: `qa/catalog.yaml`
- Rubric: `qa/quality-rubric.md`

The `spec:` field in `catalog.yaml` is the authoritative path for each skill/agent spec. Always read it rather than
guessing the path.

## Skill categories

```
gate        → gate-check
review      → design-review, architecture-review, review-all-gdds
authoring   → design-system, quick-design, architecture-decision, art-bible,
              create-architecture, ux-design, ux-review
readiness   → story-readiness, story-done
pipeline    → create-epics, create-stories, dev-story, create-control-manifest,
              propagate-design-change, map-systems
analysis    → consistency-check, balance-check, content-audit, code-review,
              tech-debt, scope-check, estimate, perf-profile, asset-audit,
              security-audit, test-evidence-review, test-flakiness
team        → team-combat, team-narrative, team-audio, team-level, team-ui,
              team-qa, team-release, team-polish, team-live-ops
sprint      → changelog, patch-notes
utility     → all remaining skills
```

## Agent tiers

```
directors   → creative-director, technical-director, producer, art-director
leads       → lead-programmer, qa-lead, narrative-director, audio-director,
              game-designer, systems-designer, level-designer
specialists → gameplay-programmer, ai-programmer, technical-artist, sound-designer,
              engine-programmer, tools-programmer, network-programmer, ux-designer,
              ui-programmer, performance-analyst, prototyper, writer, world-builder
godot       → godot-specialist, godot-gdscript-specialist, godot-csharp-specialist,
              godot-shader-specialist, godot-gdextension-specialist
unity       → unity-specialist, unity-ui-specialist, unity-shader-specialist,
              unity-dots-specialist, unity-addressables-specialist
unreal      → unreal-specialist, ue-blueprint-specialist, ue-gas-specialist,
              ue-umg-specialist, ue-replication-specialist
bevy        → bevy-specialist, bevy-rust-specialist, bevy-render-specialist,
              bevy-ui-specialist
operations  → devops-engineer, release-manager, live-ops-designer, community-manager,
              analytics-engineer, economy-designer, localization-lead
qa          → qa-tester, security-engineer, accessibility-specialist
```

Tiers mirror the `qa/agents/` layout and `catalog.yaml` categories. Engine groups live under `qa/agents/engine/`. They
describe responsibilities, not model selection. Read [coordination rules](../docs/coordination-rules.md) for domain and
delegation boundaries.

## Workflow for testing a skill

1. Read `catalog.yaml` to get the skill's `spec:` path and `category:`
2. Read the skill at `skills/[name]/SKILL.md`
3. Read the spec at the `spec:` path
4. Evaluate assertions case by case using the host rules below
5. Offer to write results to `results/` and update `catalog.yaml`

## Runtime checks

Read [the host guide](../docs/host-runtime.md) before interpreting capabilities in a spec. Logical identifiers use
`gamedev:<name>`; Pi invocations use `/skill:gamedev-<name>`. Validate name/description frontmatter and body-level
routing, arguments, domain boundaries, and evidence. Do not infer model execution or tool availability from metadata. If
required independent review cannot run, mark it blocked; sequential role passes do not count. Distinguish written-spec
analysis from conversational execution and record the evidence actually observed.

## Workflow for improving a skill

Use `/skill:gamedev-skill-improve [name]`. It handles the full loop: test → diagnose → propose fix → rewrite → retest →
keep or revert.

## Spec validity note

Specs in this folder describe **current behavior**, not ideal behavior. They were written by reading the skills, so they
may encode bugs. When a skill misbehaves in practice, correct the skill first, then update the spec to match the fixed
behavior. Treat spec failures as "this needs investigation," not "the skill is definitively wrong."

## This folder is deletable

Deleting this folder has no effect on the Game Studio skills or agents themselves. `/skill:gamedev-skill-test` and
`/skill:gamedev-skill-improve` will report that `catalog.yaml` is missing and guide the user to initialize it.

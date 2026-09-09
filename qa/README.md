# QA — Skill & Agent Testing Framework

Quality assurance infrastructure for the **Game Studio** framework. Tests the skills and agents themselves — not any
game built with them.

> **This folder is self-contained and optional.** Game developers using Game Studio don't need it. To remove it
> entirely: `rm -rf qa` — runtime workflows do not import it.

---

## What's in here

```
qa/
├── README.md              ← you are here
├── AGENTS.md              ← shared contributor instructions
├── AGENTS.md              ← canonical contributor guidance
├── catalog.yaml           ← registry: 65 skill specs + 53 agent specs, coverage tracking
├── quality-rubric.md      ← category-specific pass/fail metrics for /skill:gamedev-skill-test category
│
├── skills/                ← behavioral spec files for skills (one per skill)
│   ├── gate/              ← gate category specs
│   ├── review/            ← review category specs
│   ├── authoring/         ← authoring category specs
│   ├── readiness/         ← readiness category specs
│   ├── pipeline/          ← pipeline category specs
│   ├── analysis/          ← analysis category specs
│   ├── team/              ← team category specs
│   ├── sprint/            ← sprint category specs
│   └── utility/           ← utility category specs
│
├── agents/                ← behavioral spec files for agents (one per agent)
│   ├── directors/         ← creative-director, technical-director, producer, art-director
│   ├── leads/             ← lead-programmer, narrative-director, audio-director, etc.
│   ├── specialists/       ← engine/code/shader/UI specialists
│   ├── godot/             ← Godot-specific specialists
│   ├── unity/             ← Unity-specific specialists
│   ├── unreal/            ← Unreal-specific specialists
│   ├── operations/        ← QA, live-ops, release, localization, etc.
│   └── creative/          ← writer, world-builder, game-designer, etc.
│
├── templates/             ← spec file templates for writing new specs
│   ├── skill-test-spec.md ← template for skill behavioral specs
│   └── agent-test-spec.md ← template for agent behavioral specs
│
└── results/               ← test run outputs (written by /skill:gamedev-skill-test spec, gitignored)
```

---

## How to use it

Two skills drive these checks. Read [AGENTS.md](AGENTS.md#host-specific-checks) for capability and execution rules. Pi
examples use `/skill:gamedev-<name>`.

### Check structural compliance

```
/skill:gamedev-skill-test static [skill-name]     # Check one skill (7 checks)
/skill:gamedev-skill-test static all              # Check all installed skills
```

### Run a behavioral spec test

```
/skill:gamedev-skill-test spec gate-check         # Evaluate a skill against its written spec
/skill:gamedev-skill-test spec design-review
```

### Check against category rubric

```
/skill:gamedev-skill-test category gate-check     # Evaluate one skill against its category metrics
/skill:gamedev-skill-test category all            # Run rubric checks across all categorized skills
```

### See full coverage picture

```
/skill:gamedev-skill-test audit                   # Skills + agents: has-spec, last tested, result
```

### Improve a failing skill

```
/skill:gamedev-skill-improve gate-check           # Test → diagnose → propose fix → retest loop
```

---

## Skill categories

| Category | Skills | Key metrics |
| ---------- | -------- | ------------- |
| `gate` | gate-check | Review mode read, full/lean/solo director panel, no auto-advance |
| `review` | design-review, architecture-review, review-all-gdds | Read-only, 8-section check, correct verdicts |
| `authoring` | design-system, quick-design, art-bible, create-architecture, … | Section-by-section May-I-write, skeleton-first |
| `readiness` | story-readiness, story-done | Blockers surfaced, director gate in full mode |
| `pipeline` | create-epics, create-stories, dev-story, map-systems, … | Upstream dependency check, handoff path clear |
| `analysis` | consistency-check, balance-check, code-review, tech-debt, … | Read-only report, verdict keyword, no writes |
| `team` | team-combat, team-narrative, team-audio, … | All required agents spawned, blocked surfaced |
| `sprint` | changelog, patch-notes | Generates release-facing notes from git/Backlog data |
| `utility` | start, adopt, hotfix, localize, setup-engine, … | Passes static checks |

---

## Agent tiers

| Tier | Agents |
| ------ | -------- |
| `directors` | creative-director, technical-director, producer, art-director |
| `leads` | lead-programmer, narrative-director, audio-director, ux-designer, qa-lead, release-manager, localization-lead |
| `specialists` | gameplay-programmer, engine-programmer, ui-programmer, tools-programmer, network-programmer, ai-programmer, level-designer, sound-designer, technical-artist |
| `godot` | godot-specialist, godot-gdscript-specialist, godot-csharp-specialist, godot-shader-specialist, godot-gdextension-specialist |
| `unity` | unity-specialist, unity-ui-specialist, unity-shader-specialist, unity-dots-specialist, unity-addressables-specialist |
| `unreal` | unreal-specialist, ue-gas-specialist, ue-replication-specialist, ue-umg-specialist, ue-blueprint-specialist |
| `operations` | devops-engineer, security-engineer, performance-analyst, analytics-engineer, community-manager |
| `creative` | writer, world-builder, game-designer, economy-designer, systems-designer, prototyper |

---

## Updating the catalog

`catalog.yaml` tracks test coverage for every skill and agent. After running a test:

- `/skill:gamedev-skill-test spec [name]` will offer to update `last_spec` and `last_spec_result`
- `/skill:gamedev-skill-test category [name]` will offer to update `last_category` and `last_category_result`
- `last_static` and `last_static_result` are updated manually or via `/skill:gamedev-skill-improve`

---

## Writing a new spec

1. Find the spec template at `templates/skill-test-spec.md`
2. Copy it to `skills/[category]/[skill-name].md`
3. Update the `spec:` field in `catalog.yaml` to point to the new file
4. Run `/skill:gamedev-skill-test spec [skill-name]` to validate it

---

## Removing this framework

This folder has no hooks into the main project. To remove:

```bash
rm -rf qa
```

The skills `/skill:gamedev-skill-test` and `/skill:gamedev-skill-improve` will still function — they'll simply report
that `catalog.yaml` is missing and suggest running `/skill:gamedev-skill-test audit` to initialize it.

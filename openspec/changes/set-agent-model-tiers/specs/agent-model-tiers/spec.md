## ADDED Requirements

### Requirement: Director agents run on the pinned Fable model
The two top-authority agents — `creative-director` and `technical-director` — SHALL declare `model: claude-fable-5` in their frontmatter. No other agent SHALL be on Fable. (AC #2)

#### Scenario: directors are pinned to Fable
- **WHEN** `.claude/agents/creative-director.md` and `.claude/agents/technical-director.md` are read
- **THEN** each has `model: claude-fable-5`, and no other agent file contains `claude-fable-5`

### Requirement: Department-lead agents run on the pinned Opus 4.8 model
The nine department leads — `producer`, `art-director`, `narrative-director`, `audio-director`, `lead-programmer`, `qa-lead`, `release-manager`, `localization-lead`, `ux-designer` — SHALL declare `model: claude-opus-4-8`. The pin is required because the `opus` alias names a model family, not a version, and cannot express 4.8. (AC #3)

#### Scenario: leads are pinned to Opus 4.8
- **WHEN** the nine lead agent files are read
- **THEN** each has `model: claude-opus-4-8`, and no lead is left on the bare `opus` alias

### Requirement: Specialist agents float on the sonnet alias
Every agent that is not a director or a department lead SHALL declare `model: sonnet` (the floating alias, intentionally not pinned). `community-manager` and `devops-engineer` SHALL be lifted from `haiku` to `sonnet` so that no agent sits below the specialist floor. (AC #4)

#### Scenario: no agent is below the sonnet floor
- **WHEN** all 53 agent files are searched for `model: haiku`
- **THEN** no match is found, and `community-manager` and `devops-engineer` read `model: sonnet`

#### Scenario: specialists stay on the alias, not a pinned ID
- **WHEN** a specialist agent file is read
- **THEN** its `model:` is the bare `sonnet` alias, not a version-pinned Sonnet ID

### Requirement: Only the model field changes on affected agents
The change SHALL alter only the `model:` line of the 13 affected agents. No agent's `tools`, `description`, name, or body SHALL change, and no agent outside the 13 SHALL have its `model:` changed. (AC #6)

#### Scenario: diff is confined to model lines
- **WHEN** the change's `git diff` over `.claude/agents/` is inspected
- **THEN** exactly 13 files differ, every hunk touches only a `model:` line, and 2 read `claude-fable-5`, 9 read `claude-opus-4-8`, 2 changed `haiku`→`sonnet`

### Requirement: coordination-rules.md documents agent tiers separately from skill tiers
`.claude/docs/coordination-rules.md` SHALL document the agent-model mapping (Director → `claude-fable-5` pinned, Department lead → `claude-opus-4-8` pinned, Specialist → `sonnet` floating) distinctly from the skill-tier alias scheme, and SHALL NOT carry stale model IDs. (AC #5)

#### Scenario: the doc reflects the pinned/floating split
- **WHEN** the Model Tier Assignment section is read after the change
- **THEN** it presents an agent-tier mapping naming the directors, leads, and specialists with their model values, explains that leadership is version-pinned while specialists float on the alias, and no longer lists `claude-opus-4-6` or `claude-sonnet-4-6`

### Requirement: The qa/ test corpus asserts the same model tiers coordination-rules.md defines
The `qa/agents/**` agent-test specs and `qa/quality-rubric.md` SHALL assert each agent's model tier consistently with `coordination-rules.md`. No qa spec SHALL assert a model an agent no longer runs, and no qa spec SHALL cite a retired pinned model ID.

#### Scenario: no qa spec contradicts the agent's actual model
- **WHEN** a `qa/agents/**` spec's model-tier assertion (summary line and static assertion) is compared to the agent's `model:` frontmatter
- **THEN** they name the same tier (Fable / Opus 4.8 / Sonnet), and no qa spec or rubric row cites `claude-opus-4-6` or `claude-sonnet-4-6`

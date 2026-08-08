# design-lens-references

## ADDED Requirements

### Requirement: Design-judgment skills reference the lens doc on their solo-mode path

Each design-facing skill that forms design judgments — `design-review`, `balance-check`, `review-all-gdds`, `brainstorm`, `quick-design`, `playtest-report`, `design-system` — SHALL reference `docs/game-design-lenses.md` at the point in its instructions where that judgment happens on the path executed in `solo` review mode (main-session text, or the prompt of a worker agent that spawns unconditionally). The reference SHALL name the trigger condition and the relevant doc section, and SHALL NOT be placed solely inside a phase that a `solo`/`lean` review-mode check skips.

#### Scenario: design-review verdict in solo mode

- **WHEN** `/gamedev:design-review` runs with review depth `lean` or `solo` (no specialist agents spawned) and reaches its verdict phase
- **THEN** its instructions direct the main session to run the lens doc's Quick Audit against the reviewed document before the verdict is formed

#### Scenario: balance-check analysis

- **WHEN** `/gamedev:balance-check` reaches its analysis phase (Phase 4)
- **THEN** its instructions direct the session to consult the lens doc's Balance lenses (#37–#53) and Decision Rules (triangularity, dominant strategy, reward-over-punishment) before running domain checks

#### Scenario: review-all-gdds design-theory worker

- **WHEN** `/gamedev:review-all-gdds` spawns its Phase 3 (design-theory) Task agent
- **THEN** the main session first reads the lens doc (via its skill-relative path) and includes the doc's Decision Rules and relevant lens summaries in the Task prompt as review vocabulary — not a bare path, which a spawned subagent cannot resolve — consistent with the skill's rule that subagents only see explicitly passed content

#### Scenario: quick-design tuning rationale

- **WHEN** `/gamedev:quick-design` drafts a Tuning-type spec
- **THEN** its instructions direct the session to apply the lens doc's tuning rule (double or halve, never nudge 10%, then bisect) when proposing new values

#### Scenario: playtest-report discipline

- **WHEN** `/gamedev:playtest-report` generates a template or analyzes playtest notes
- **THEN** its instructions point at the lens doc's Playtest Discipline section (stated questions, WUBALEW cadence, FFWWDD debrief)

#### Scenario: design-system authoring in solo mode

- **WHEN** `/gamedev:design-system` drafts the Player Fantasy section, the formulas/balance section, or finalizes a GDD in `solo` mode (no specialists spawned)
- **THEN** its instructions point at the concept/experience lenses, the Balance lenses, and the Quick Audit respectively, at those three insertion points

#### Scenario: brainstorm ideation

- **WHEN** `/gamedev:brainstorm` begins concept exploration
- **THEN** its intro directs the session to consult the lens doc's concept & experience lenses during concept generation and stress-testing

### Requirement: References are pointers, not copies

Each skill's reference to the lens doc SHALL be at most three lines (path, trigger, section) and SHALL NOT reproduce lens questions, decision rules, or audit steps inline.

#### Scenario: no wholesale duplication

- **WHEN** any wired SKILL.md is inspected after the change
- **THEN** it contains the doc path and a consult-when trigger, and no copied lens battery content

### Requirement: Referenced paths resolve from their source location

Every skill reference SHALL use `../../docs/game-design-lenses.md`, which resolves from `skills/<name>/SKILL.md` in the plugin root. No reference intended for a spawned Task agent SHALL be a path (a subagent cannot resolve a plugin-relative path from its own working directory); such references SHALL be pasted content read by the main session first.

#### Scenario: skill path resolution check

- **WHEN** each edited SKILL.md's `../../docs/game-design-lenses.md` reference is resolved relative to that skill's directory
- **THEN** it points at the existing lens doc

#### Scenario: no unresolvable subagent path

- **WHEN** the review-all-gdds Phase 3 Task prompt is inspected
- **THEN** it contains pasted lens vocabulary, not a `docs/…` or `../../docs/…` path handed to the subagent

### Requirement: The lens doc's consumer list matches reality

The header of `docs/game-design-lenses.md` SHALL name the actual set of consumers (the `game-designer` agent and the seven wired skills), and any future change that adds or removes a consumer SHALL update this list in the same change.

#### Scenario: header after this change

- **WHEN** the header consumer sentence is compared against files referencing the doc (`grep -rl game-design-lenses skills/ agents/`)
- **THEN** the two sets match exactly

## ADDED Requirements

### Requirement: Work-item state lives solely in Backlog.md
Backlog.md SHALL be the single owner of work-item status. `production/sprint-status.yaml` SHALL NOT exist, and no skill, doc, or hook SHALL read or write it. (AC #1)

#### Scenario: sprint-status.yaml is gone and unreferenced
- **WHEN** the repository is searched for `sprint-status.yaml` after the change
- **THEN** the file does not exist and no skill, doc, template, or hook references it

#### Scenario: status is set through Backlog, not markdown
- **WHEN** `/story-done` marks a story complete
- **THEN** it sets the linked Backlog task's status to `Done` via the Backlog MCP and does not write a `Status:` field into the story `.md`

### Requirement: Story lifecycle operates on Backlog tasks while prose stays in markdown
The story lifecycle skills (`create-stories`, `dev-story`, `story-readiness`, `story-done`, `bug-report`) SHALL track status/priority/grouping through Backlog tasks and read rich story context (acceptance criteria, TR-ID, governing ADRs, story type, test-evidence requirements) from the story markdown. A story `.md` and its Backlog task SHALL cross-reference each other. (AC #2)

#### Scenario: create-stories mints a tracked task per story
- **WHEN** `/create-stories` writes `production/epics/[slug]/story-NNN.md`
- **THEN** it also creates a Backlog task assigned to the epic's milestone, with the task carrying a `Spec:` pointer to the `.md` and the `.md` carrying a `Tracked in: TASK-N` back-pointer

#### Scenario: dev-story pulls work from the board and reads context from the .md
- **WHEN** `/dev-story` starts a story
- **THEN** it selects the task from Backlog, sets it to `In Progress`, and loads acceptance criteria and design context from the linked `.md`

#### Scenario: story-done preserves the evidence gate
- **WHEN** `/story-done` runs on a Logic story with no passing unit test
- **THEN** it still raises the BLOCKING test-evidence gap, and on completion appends `## Completion Notes` to the `.md` while setting the Backlog task to `Done`

#### Scenario: bug-report files a Backlog task
- **WHEN** `/bug-report` captures a defect
- **THEN** it creates a Backlog task labelled `bug` with repro steps, severity, and context, and does not write a `production/qa/bugs/*.md` file

### Requirement: Epics are Backlog milestones with prose in markdown
`/create-epics` SHALL mint a Backlog milestone per epic and keep the rich `EPIC.md` prose. Story tasks SHALL be assigned to their epic's milestone. `production/epics/index.md` SHALL NOT duplicate status/roster state that Backlog owns. (AC #3)

#### Scenario: create-epics creates a milestone
- **WHEN** `/create-epics` creates an epic
- **THEN** a Backlog milestone with the epic's name exists, the epic's goal/DoD prose is available (in `EPIC.md` and/or the milestone description), and story tasks created later are assigned to that milestone

#### Scenario: index.md is a prose map, not a status mirror
- **WHEN** `production/epics/index.md` is written
- **THEN** it lists epics with their GDD and governing ADRs as navigation, and does not carry a live Status column (status is read from the Backlog milestone list)

### Requirement: Deprecated team-scale skills are removed
`retrospective`, `milestone-review`, `day-one-patch`, and `onboard` SHALL be removed, and no catalog, `/help` output, doc, template, or hook SHALL reference them. (AC #4)

#### Scenario: no dangling references to cut skills
- **WHEN** the repo is searched for `retrospective`, `milestone-review`, `day-one-patch`, or `onboard` after the change
- **THEN** the skill directories and their `qa/` specs are gone, and `workflow-catalog.yaml`, `/help`, docs, templates, and hooks contain no invocations of them

### Requirement: Sprint machinery is replaced by continuous flow
`sprint-plan`, `sprint-status`, and `bug-triage` SHALL be removed. The Backlog board (priority-ordered, grouped by milestone) SHALL serve their tracking function; sprint goal/DoD prose SHALL have a defined home in the milestone description, with risk notes as an optional Backlog document. (AC #5, AC #3)

#### Scenario: the board replaces the sprint status report
- **WHEN** the owner wants to know what is in flight
- **THEN** the Backlog board (filtered by milestone and status/label) provides it, with no `sprint-status` skill and no `production/sprints/` files

#### Scenario: sprint prose has a home
- **WHEN** the owner records a milestone's goal and definition of done
- **THEN** it lives in the Backlog milestone description (not a `production/sprints/` file)

### Requirement: Solo is the default review mode
When `production/review-mode.txt` is absent, gate-using skills SHALL default to `solo` (all director gates skipped). `full` and `lean` SHALL remain selectable via the file or the `--review` override. (AC #6)

#### Scenario: gates skip by default
- **WHEN** a gate-using skill runs with no `review-mode.txt` and no `--review` flag
- **THEN** it resolves to `solo` and skips its director gates with a "skipped — Solo mode" note

#### Scenario: team mode still reachable
- **WHEN** `production/review-mode.txt` contains `full` (or `--review full` is passed)
- **THEN** director gates run as before

### Requirement: QA evidence gating and gate-check still function
The `story-done` BLOCKING/ADVISORY test-evidence gates and `/gate-check` phase checklists SHALL continue to work after the rewrite, referencing only skills that still exist. (AC #7)

#### Scenario: gate-check runs without deleted skills
- **WHEN** `/gate-check` is invoked
- **THEN** its phase checklists complete without invoking any removed skill

#### Scenario: story-done next-step points at the board
- **WHEN** `/story-done` finishes and surfaces the next work item
- **THEN** it names the next `To Do` task (without a `blocked` label) from the current milestone by priority, and does not print a sprint close-out sequence calling removed skills

### Requirement: Status vocabulary is native-plus-labels and configured
The status mapping SHALL be recorded and `backlog/config.yml` configured accordingly: native statuses `To Do / In Progress / Done` (plus `Draft` for pre-ready authoring), with `blocked` and `bug` as registered labels. (AC #8)

#### Scenario: config carries the labels, not extra statuses
- **WHEN** `backlog/config.yml` is inspected after the change
- **THEN** `statuses` remains the native set and `labels` includes `blocked` and `bug`

#### Scenario: blocked composes with any status
- **WHEN** an in-progress task becomes blocked
- **THEN** it keeps `In Progress` status and gains the `blocked` label (blockedness is not a status)

### Requirement: Documentation describes the new flow
`WORKFLOW-GUIDE.md` and related docs/examples SHALL describe the Backlog-backed, continuous-flow, solo-default workflow, with no residual sprint/retrospective narrative. (AC #9)

#### Scenario: workflow guide matches reality
- **WHEN** a new contributor reads `WORKFLOW-GUIDE.md` and `docs/examples/*`
- **THEN** they see the epic→milestone / story→task lifecycle, the solo default, and the board-based flow, with no references to removed skills or `sprint-status.yaml`

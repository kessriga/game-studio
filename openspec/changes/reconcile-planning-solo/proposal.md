## Why

The template tracks work as markdown under `production/` plus `production/sprint-status.yaml`, and **zero** template skills use the Backlog.md MCP the owner has adopted. Two systems now claim to own work-item status, which is exactly the drift the owner is trying to eliminate. The owner is also a solo developer (studio ≤4 for the next 2–3 years) building a live-service game, so the template's team-scale ceremony (sprints, retrospectives, milestone reviews, director gates on every step) costs more than it returns.

This change reconciles the two systems along a clean line — **Backlog.md owns work-item state; markdown keeps rich planning prose** — and cuts the workflow down to solo scale. Framework-level changes like this one are tracked in OpenSpec (this change) and closed via Backlog TASK-3.

## What Changes

- **Lifecycle split (Option C).** A story is authored as rich markdown (`production/epics/[slug]/story-NNN.md`) by `/create-stories`. When it is cleared for dev, a Backlog **task** is minted that owns status from then on; the `.md` freezes to *status-only* (it stops carrying live `Status:`, but still receives the `## Completion Notes` evidence trail). The task carries a forward-pointer (`Spec: production/epics/.../story-NNN.md`); the `.md` carries a back-pointer (`Tracked in: TASK-N`).
- **Epic = Backlog milestone.** `/create-epics` still writes `EPIC.md` prose but also mints a Backlog milestone; story tasks are assigned to that milestone. `production/epics/index.md` drops its Status/Stories tracking columns (Backlog owns those) and survives as a prose navigation map (epic → GDD → governing ADRs).
- **Status model: native + labels.** Backlog's MCP `status` enum is fixed (`Draft / To Do / In Progress / Done`); it does not accept `Ready`/`Blocked` and is not a mirror of `config.yml`. Under Option C the extra statuses are unnecessary: "task exists" ≈ Ready (`To Do`), and blockedness is orthogonal to progress. So `blocked` and `bug` become **labels**, `config.yml` statuses stay native, and the template's 6-status vocabulary maps onto native-4 + labels.
- **Continuous flow — sprints removed.** No time-boxed sprints. Backlog milestones (= epics) plus the priority-ordered board replace them. Sprint goal/DoD prose moves into the milestone description; risk notes become an optional Backlog document, not a per-cycle ritual.
- **Solo is the default review mode.** When `production/review-mode.txt` is absent, skills default to `solo` (all director gates skipped) instead of `lean`. `director-gates.md`, `/start`, and every skill's fallback line change accordingly.
- **Skills deleted (7):** `sprint-plan`, `sprint-status`, `bug-triage`, `retrospective`, `milestone-review`, `day-one-patch`, `onboard` — recoverable from git history if ever needed at team scale.
- **Skills rewired to Backlog:** `create-stories`, `dev-story`, `story-readiness`, `story-done` (status via MCP, context from the frozen `.md`), `bug-report` (files a Backlog task with a `bug` label), and `qa-plan`/`team-qa`/`help`/`adopt` (drop `sprint-status.yaml`, drop sprint framing).
- **File removed:** `production/sprint-status.yaml` and every reference to it.
- **Docs & catalog:** `workflow-catalog.yaml`, `/help`, `WORKFLOW-GUIDE.md`, `quick-start.md`, `skills-reference.md`, `agent-coordination-map.md`, doc templates, `docs/examples/*`, `UPGRADING.md`, the `qa/` catalog and per-skill specs, and the `detect-gaps.sh` hook all updated for the new flow.

## Capabilities

### New Capabilities
- `solo-planning-workflow`: work-item state lives solely in Backlog.md; stories/epics/bugs are tracked as tasks/milestones/labels while their rich prose stays in markdown; review defaults to solo; the sprint machinery is replaced by continuous flow over the board.

### Modified Capabilities

<!-- none: openspec/specs/ is empty; no existing capability specs to modify -->

## Impact

- `.claude/skills/` — **deleted:** `sprint-plan`, `sprint-status`, `bug-triage`, `retrospective`, `milestone-review`, `day-one-patch`, `onboard`. **Rewired:** `create-stories`, `create-epics`, `dev-story`, `story-readiness`, `story-done`, `bug-report`, `qa-plan`, `team-qa`, `help`, `adopt`. **Fallback line only:** every skill that resolves review mode (default `lean` → `solo`).
- `.claude/docs/` — `director-gates.md` (default mode, delete `PR-SPRINT`/`PR-MILESTONE` gate refs where orphaned), `workflow-catalog.yaml`, `skills-reference.md`, `quick-start.md`, `agent-coordination-map.md`, `coordination-rules.md`, templates referencing cut skills, `hooks-reference/post-sprint-retrospective.md`.
- `.claude/hooks/` — `detect-gaps.sh` (drop the `/sprint-plan` suggestion).
- `backlog/config.yml` — register `blocked` and `bug` labels (statuses unchanged).
- `production/` — `sprint-status.yaml` deleted; `production/sprints/` no longer written; `epics/index.md` reshaped to prose map.
- `docs/` — `WORKFLOW-GUIDE.md`, `examples/*` (`README.md`, `session-story-lifecycle.md`, `skill-flow-diagrams.md`), `UPGRADING.md`.
- `qa/` — delete 7 per-skill specs (`skills/sprint/*`, `skills/utility/{bug-triage,onboard,day-one-patch}.md`), update the catalog/README.
- No dependencies added. This is a solo-project template; no live game data exists to migrate.

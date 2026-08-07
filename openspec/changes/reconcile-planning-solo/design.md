# Design — Reconcile planning skills with Backlog.md at solo scale

## Context

The template was authored for a multi-tier studio: leadership/department/specialist agents, director gates at every workflow step, and a Scrum-shaped cadence (sprint-plan → sprint-status → retrospective) with work tracked as markdown under `production/` and mirrored into `production/sprint-status.yaml`. The owner has since adopted Backlog.md (MCP) as the work tracker and works solo. Nothing in the template uses Backlog, so status lives in two places and the ceremony is sized for a team that does not exist.

The reconciliation was decided in an explore session (2026-08-07). This document records the decisions and *why the rejected alternatives lost*, so the implementation does not relitigate them.

## Decision 1 — The story/task split point: lifecycle handoff (Option C)

A "story" is two things at once: a **work item** (status, priority, grouping — what Backlog is good at) and a **rich planning artifact** (acceptance criteria, TR-ID → `tr-registry.yaml`, governing ADRs, story type, test-evidence paths, pre-written QA test cases — what markdown is good at). The design question is where to draw the line.

**Decision:** split by lifecycle.
- `/create-stories` authors the rich `.md` (unchanged authoring ergonomics).
- When the story is cleared for dev, a Backlog **task** is minted and **owns status from then on**.
- The `.md` freezes to **status-only**: it no longer carries a live `Status:` field, but it *does* keep receiving the `## Completion Notes` block `story-done` appends (the auditable evidence trail — see Decision 6).
- Cross-links: task → `Spec: production/epics/[slug]/story-NNN.md`; `.md` → `Tracked in: TASK-N`.

**Rejected:**
- *Option A (task = thin pointer, `.md` owns everything including status):* keeps status in the `.md`, which is the duplication we are removing.
- *Option B (task = the whole story, retire the `.md`):* cramps QA test-case specs and criteria into a task body, loses markdown prose ergonomics, and is the largest rewrite. Backlog task descriptions cap at 10 000 chars and acceptance criteria at 500 chars each — workable but hostile for rich design prose.

"Frozen" means **status-frozen, not read-only** — the earlier framing was wrong and would have broken `story-done`'s own machinery.

## Decision 2 — Epic = Backlog milestone

Backlog has one native grouping (milestone) plus labels; the template has two grouping concepts (feature-sized *epics*, phase-sized *Alpha/Beta*).

**Decision:** an epic maps to a Backlog **milestone**. `/create-epics` keeps writing `EPIC.md` prose and additionally mints a milestone via `milestone_add`; each story task is assigned `milestone: [epic name]` (confirmed supported by `task_create`/`task_edit`). Day-to-day the board is grouped by the feature under construction, which is how a solo dev actually works.

- `production/epics/index.md` **drops its Status and Stories tracking columns** (Backlog owns those; keeping them re-creates the `sprint-status.yaml` drift) and becomes a **prose navigation map**: epic → GDD → governing ADRs → `EPIC.md` path. The live roster/status is the Backlog milestone list.
- Development **phases** (Concept…Release, driven by `/gate-check`) are orthogonal to milestones and remain artifact-driven; if a phase tag is ever wanted on tasks it is an optional `phase:*` label, not a milestone.

**Rejected:** *phase = milestone, epic = label* (groups less usefully for one-feature-at-a-time work) and *two-level (both)* (over-engineered bookkeeping at solo scale).

## Decision 3 — Status model: native statuses + labels

The Backlog MCP `status` parameter is a **fixed enum** — `Draft / To Do / In Progress / Done` — and is **not** a mirror of `config.yml` (config lists 3, the enum has 4, adding `Draft`). Editing `config.yml` to add `Ready`/`Blocked` is an unverified bet that the MCP tool would honor them.

**Decision:** keep native statuses; model the template's extra states as **labels**.

| Template state | New representation |
|----------------|-------------------|
| Not Started    | `To Do` |
| Ready          | `To Do` (a task exists ⇒ it is ready — Option C mints it only when cleared) |
| In Progress    | `In Progress` |
| In Review      | dropped (no review column at solo scale) |
| Complete       | `Done` |
| Blocked        | `blocked` **label** (orthogonal — composes with any status) |
| (bug)          | `bug` **label** |
| (authoring)    | `Draft` — the pre-ready state, or simply "`.md` exists, no task yet" |

`config.yml` `statuses` stay `["To Do", "In Progress", "Done"]`; `blocked` and `bug` are registered under `labels`. This is *cleaner*, not merely a fallback: blockedness genuinely is orthogonal to progress, and it sidesteps the enum gamble. This revises the task's original "extend `config.yml`" instinct — AC #8 is satisfied by *deciding and recording* the mapping, with config carrying the labels.

## Decision 4 — Solo is the default review mode

`director-gates.md` currently defaults to `lean` (phase-gates only) when `production/review-mode.txt` is absent. The owner is solo for the foreseeable future and has cut the ceremony skills.

**Decision:** the absent-file default becomes `solo` (no director gates anywhere). Changes land in `director-gates.md` (the mode table and both "default to lean" invocation blocks), `/start` (writes `solo` by default), and the `Else → default to lean` fallback line in every gate-using skill. `full`/`lean` remain available via `production/review-mode.txt` or the per-run `--review` override, so nothing is lost — only the default flips.

## Decision 5 — Continuous flow: sprints removed, not thinned

**Decision (Path 1):** no time-boxed sprints. The unit of grouping is the milestone (= epic); work is pulled off the priority-ordered board. Consequently `sprint-plan`, `sprint-status`, and `bug-triage` are **deleted, not replaced by thin equivalents** — the board *is* the status report, carryover is automatic (unfinished tasks persist), and bug triage is the board filtered by `bug` label and priority.

Prose homes for what `sprint-plan` used to carry:
- **Sprint goal + DoD** → the milestone **description** field (≤2000 chars — ample).
- **Risks** → an optional Backlog **document** (`document_create`), created only when the owner wants one; not a per-cycle ritual.
- **Task list / carryover / burndown / capacity** → the board (or dropped as solo noise).

**Rejected:** *Path 2 (thin `sprint-plan` + one Backlog doc per sprint)* — retains a calendar box whose reflection rhythm was already removed by cutting `retrospective`/`milestone-review`.

## Decision 6 — `story-done` preserves the evidence gate; only its plumbing changes

AC #7 requires the QA evidence gating to keep working. The gate logic (Phase 3 test-criterion traceability, Phase 4 deviation checks, the BLOCKING/ADVISORY test-evidence matrix by story type) is unchanged. What changes:
- **Phase 7 status write** → set the Backlog task status via `task_edit` (`In Progress`→`Done`) instead of editing the `.md` `Status:` field; **delete the `sprint-status.yaml` update step entirely**.
- **`## Completion Notes`** are still appended to the `.md` (the durable evidence record) — this is why the `.md` is status-frozen, not read-only.
- **Phase 8 "Surface the Next Story"** is rewritten: instead of reading `production/sprints/` and printing a sprint close-out sequence that invokes deleted skills (`/retrospective`, `/sprint-plan new`), it queries the Backlog board for the next `To Do` task (no `blocked` label) in the current milestone, ordered by priority.

## Decision 7 — bug-report files a Backlog task

`/bug-report` creates a Backlog task with the `bug` label; repro steps, severity, and context go in the task description/acceptance criteria. The `production/qa/bugs/*.md` markdown store is retired (bugs are lighter than stories and do not need the dual-artifact split). `/bug-triage` is deleted; triage is the board filtered by `bug` + priority.

## Delete blast radius (measured, not assumed)

Deleting 7 skills touches more than 7 directories. Each deleted skill removes: its `.claude/skills/<name>/` dir **and** its `qa/skills/**/<name>.md` spec. Additional referrers to scrub: `workflow-catalog.yaml` (11 lines), `skills-reference.md`, `quick-start.md`, `agent-coordination-map.md`, `coordination-rules.md`, doc templates under `.claude/docs/templates/`, `hooks-reference/post-sprint-retrospective.md`, `WORKFLOW-GUIDE.md`, `docs/examples/*`, `UPGRADING.md`, the `qa/` catalog/README, and the live hook `detect-gaps.sh:146` (suggests `/sprint-plan`). `story-done` Phase 8 and `team-qa`'s close-out sequence reference deleted skills and need rewrites, not scrubs.

## Non-goals

- No change to the design-authoring chain upstream of stories (`brainstorm`, `map-systems`, `design-system`, GDDs, ADRs, `create-architecture`).
- No change to `gate-check`'s phase checklists beyond removing references to deleted skills (AC #7).
- No migration tooling — this is a template with no live epic/story/sprint data.
- Team-scale features (director gates, `full`/`lean` modes, the deleted skills in git history) remain recoverable; this change re-defaults rather than amputates the team path.

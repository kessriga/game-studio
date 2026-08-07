## 1. Status model & Backlog config

- [x] 1.1 Register `blocked` and `bug` labels in `backlog/config.yml`; leave `statuses` at the native set (`To Do`, `In Progress`, `Done`)
- [ ] 1.2 Record the status vocabulary mapping (template 6-status → native-4 + labels) in the change's design.md and in `WORKFLOW-GUIDE.md` (satisfies AC #8)

## 2. Review-mode default → solo

- [x] 2.1 `director-gates.md`: change the mode table's "Default" from `lean` to `solo`, and both "Invocation Pattern" blocks' `Else → default to lean` to `Else → default to solo`
- [x] 2.2 `/start`: write `solo` into `production/review-mode.txt` by default (was `lean`)
- [x] 2.3 Every gate-using skill: change the per-skill fallback line `Else → default to lean` to `solo` (sweep `.claude/skills/**` for the pattern; ~25 skills)
- [x] 2.4 Verify `full`/`lean` remain selectable via file and `--review` (AC #6)

## 3. Story lifecycle → Backlog (Option C)

- [x] 3.1 `create-stories`: after writing each `story-NNN.md`, mint a Backlog task (`task_create`) with `milestone: [epic name]`, priority, a `Spec:` reference to the `.md`, and write `Tracked in: TASK-N` back into the `.md`. Untraced-requirement stories get the `blocked` label
- [x] 3.2 `create-stories`: stop maintaining any status roster in `production/epics/[slug]/EPIC.md` beyond the frozen pointer; remove `production/epics/index.md` Status/Stories columns (reshape to prose nav map)
- [x] 3.3 `dev-story`: select work via Backlog (`task_list`, exclude `blocked`), set task `In Progress` on start, load story context from the linked `.md`; remove `production/sprints/` and `sprint-status.yaml` reads
- [x] 3.4 `story-readiness`: stays read-only. Replace `sprint` scope with `milestone` (via `task_list`), drop `production/sprints/` reads, check dependency state via the dependency's Backlog task, make Estimate optional. Status mutation stays with dev-story/story-done, not here
- [x] 3.5 `story-done` Phase 7: set task status via `task_edit` (`Done`), delete the `sprint-status.yaml` update step, keep appending `## Completion Notes` to the `.md` (status-only freeze)
- [x] 3.6 `story-done` Phase 8: rewrite "Surface the Next Story" to query the Backlog board for the next `To Do` task (no `blocked` label) in the current milestone by priority; delete the sprint close-out sequence that invokes `/retrospective` and `/sprint-plan new`
- [x] 3.7 `story-done` Phases 1–2: replace "read `production/sprints/` for in-progress stories" with a Backlog `task_list` lookup; keep Phases 3–4 evidence gating intact (AC #7)

## 4. Epics → milestones

- [ ] 4.1 `create-epics` Step 5: after `EPIC.md`, call `milestone_add` with the epic name (and goal/DoD in the description); handle rename via `milestone_rename` if the epic is renamed
- [ ] 4.2 `create-epics`: reshape the `production/epics/index.md` template to a prose navigation map (Epic | Layer | System | GDD | Governing ADRs), dropping Status/Stories tracking columns

## 5. Bug flow

- [ ] 5.1 `bug-report`: create a Backlog task with the `bug` label (repro/severity/context in description + acceptance criteria); retire `production/qa/bugs/*.md` output
- [ ] 5.2 Delete `bug-triage` (superseded by the board filtered by `bug` + priority)

## 6. Delete the 7 skills

- [ ] 6.1 Remove skill dirs: `sprint-plan`, `sprint-status`, `bug-triage`, `retrospective`, `milestone-review`, `day-one-patch`, `onboard` under `.claude/skills/`
- [ ] 6.2 Remove their `qa/` specs: `qa/skills/sprint/{sprint-plan,sprint-status,retrospective,milestone-review}.md`, `qa/skills/utility/{bug-triage,onboard,day-one-patch}.md`
- [ ] 6.3 Update the `qa/` catalog + `qa/README.md` to drop the removed entries

## 7. Rewire remaining Backlog-coupled skills

- [ ] 7.1 `qa-plan`: replace `sprint-status.yaml`/sprint framing with milestone/board reads
- [ ] 7.2 `team-qa`: replace `sprint-status.yaml` + sprint close-out with board-based flow
- [ ] 7.3 `help`: drop `sprint-status.yaml` and removed-skill references; describe the new flow
- [ ] 7.4 `adopt`: update the brownfield audit checklist (no `sprint-status.yaml`, solo default, Backlog-backed lifecycle, removed skills)

## 8. Docs, catalog, hooks

- [ ] 8.1 `workflow-catalog.yaml`: remove the 11 lines referencing removed skills; reflect continuous flow
- [ ] 8.2 `skills-reference.md`, `quick-start.md`, `agent-coordination-map.md`, `coordination-rules.md`: scrub removed-skill and `sprint-status.yaml` references
- [ ] 8.3 `.claude/docs/templates/*` (difficulty-curve, player-journey, project-stage-report, systems-index) and `hooks-reference/post-sprint-retrospective.md`: scrub/remove references to cut skills
- [ ] 8.4 `detect-gaps.sh:146`: drop the `/sprint-plan` suggestion (replace with a Backlog/continuous-flow hint)
- [ ] 8.5 `WORKFLOW-GUIDE.md` + `docs/examples/*` (`README.md`, `session-story-lifecycle.md`, `skill-flow-diagrams.md`) + `UPGRADING.md`: rewrite to the new lifecycle (AC #9)
- [ ] 8.6 Delete `production/sprint-status.yaml` if present in any starter/template state and confirm no residual references (AC #1)

## 9. Verify & close

- [ ] 9.1 Repo-wide grep: zero references to `sprint-status.yaml` and to each removed skill (outside git history / this change's own docs)
- [ ] 9.2 Smoke-run the rewired lifecycle mentally against a sample epic: create-epics → create-stories → dev-story → story-done, confirming status flows through Backlog and evidence gates fire
- [ ] 9.3 `openspec validate reconcile-planning-solo --strict`
- [ ] 9.4 Mark TASK-3 acceptance criteria done and copy the closed record into the PR (per task-finalization workflow)

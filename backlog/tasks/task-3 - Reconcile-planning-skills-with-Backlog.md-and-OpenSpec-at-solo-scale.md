---
id: TASK-3
title: Reconcile planning skills with Backlog.md and OpenSpec at solo scale
status: Done
assignee: []
created_date: '2026-08-07 12:45'
updated_date: '2026-08-07 20:48'
labels:
  - planning
  - backlog
  - openspec
dependencies: []
references:
  - .claude/skills/sprint-plan/SKILL.md
  - .claude/skills/story-done/SKILL.md
  - .claude/docs/workflow-catalog.yaml
  - .claude/docs/director-gates.md
  - backlog/config.yml
priority: medium
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The template tracks work as markdown under production/ plus production/sprint-status.yaml; zero template skills use the Backlog.md MCP the owner has adopted. Decisions already made (2026-08-07): hybrid model — Backlog.md owns work items and status, markdown keeps rich planning prose (GDDs, ADRs, sprint goals), OpenSpec is used for changes to the framework itself. Owner is a solo dev (future studio ≤4 people) but IS planning a live-service game, so live-ops skills stay.

Scope decided: dissolve sprint-plan/sprint-status/bug-triage into Backlog (a sprint becomes a Backlog milestone or sprint-N label; sprint-status.yaml is removed; the board replaces sprint-status; bug-report files Backlog tasks with a bug label). Cut outright: retrospective, milestone-review, day-one-patch, onboard (recoverable from git history). Keep: scope-check, gate-check, estimate, the QA chain (qa-plan, smoke-check, story-done evidence gating), all team-* skills including team-live-ops, and agents live-ops-designer, analytics-engineer, community-manager. Make `solo` the default review mode (production/review-mode.txt mechanism — in solo mode director sub-agent gates are skipped). Status vocabularies must be mapped: template stories use 6 statuses, Backlog config currently has 3 (To Do/In Progress/Done) — extend backlog/config.yml statuses or map via labels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Work-item state lives solely in Backlog.md — production/sprint-status.yaml no longer exists and no skill references it
- [x] #2 Story lifecycle skills (create-stories, dev-story, story-done, story-readiness, bug-report) operate on Backlog tasks via MCP tools while preserving story context (acceptance criteria, test-evidence requirements)
- [x] #3 Sprints are modeled with Backlog milestones or labels; sprint planning prose has a defined home
- [x] #4 retrospective, milestone-review, day-one-patch, and onboard skills are removed, and workflow-catalog.yaml, /help, and docs no longer reference them
- [x] #5 sprint-plan, sprint-status, and bug-triage are removed or replaced by thin Backlog-backed equivalents
- [x] #6 Default review mode is solo
- [x] #7 QA evidence gating (story-done BLOCKING/ADVISORY gates) and gate-check phase checklists still function
- [x] #8 The status vocabulary mapping is decided and configured in backlog/config.yml
- [x] #9 WORKFLOW-GUIDE.md and related docs describe the new flow
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented via OpenSpec change `reconcile-planning-solo` (branch refactor/3-reconcile-planning-with-backlog).

Hybrid model landed at solo scale:
- **Option C lifecycle**: create-stories authors the rich story `.md` and mints a Backlog task that owns status (Spec:/Tracked-in: cross-links); dev-story/story-readiness pull from the board and read context from the `.md`; story-done sets the task Done, keeps appending Completion Notes, and surfaces the next board task. Evidence gating preserved (AC#7).
- **Epic = Backlog milestone** (create-epics mints it); production/epics/index.md reshaped to a prose nav map.
- **Status model = native + labels**: config statuses stay To Do/In Progress/Done; `blocked` and `bug` are labels (the MCP status enum is fixed, so extending was neither possible nor needed). Mapping documented in WORKFLOW-GUIDE § Status model (AC#8).
- **Solo is the default review mode** (director-gates.md + /start + all skill fallbacks); full/lean still selectable (AC#6).
- **Continuous flow**: sprint-plan/sprint-status/bug-triage/retrospective/milestone-review/day-one-patch/onboard deleted (skills + qa specs + catalog entries); sprint machinery replaced by the board; sprint goal/DoD → milestone description (AC#5).
- **bug-report** files a Backlog task with a `bug` label; verify/close drive its status (AC#2).
- sprint-status.yaml eliminated from all skills/docs (AC#1); WORKFLOW-GUIDE, examples, quick-start, skills-reference, coordination docs, templates, the producer agent, the qa spec corpus, and detect-gaps.sh all describe the new flow (AC#4, AC#9).

openspec validate --strict passes. The kept skill/doc corpus and the workflow/qa catalogs no longer reference the 7 removed skills or sprint-status.yaml (apart from an intentional "these no longer exist" note); the top-level README, UPGRADING notes, session hooks, and the @-imported .claude/docs were scrubbed of the removed skills and abolished sprint directory in a follow-up pass.

Follow-up surfaced (not filed): ~240 incidental uses of the word "sprint" as generic time-box prose remain in kept skills' test scenarios, changelog/patch-notes examples, gate-prompt prose, and some qa specs. None reference deleted skills or sprint-status.yaml; they are cosmetic consistency polish, left for a separate pass if desired.
<!-- SECTION:FINAL_SUMMARY:END -->

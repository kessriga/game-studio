---
id: TASK-3
title: Reconcile planning skills with Backlog.md and OpenSpec at solo scale
status: To Do
assignee: []
created_date: '2026-08-07 12:45'
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
- [ ] #1 Work-item state lives solely in Backlog.md — production/sprint-status.yaml no longer exists and no skill references it
- [ ] #2 Story lifecycle skills (create-stories, dev-story, story-done, story-readiness, bug-report) operate on Backlog tasks via MCP tools while preserving story context (acceptance criteria, test-evidence requirements)
- [ ] #3 Sprints are modeled with Backlog milestones or labels; sprint planning prose has a defined home
- [ ] #4 retrospective, milestone-review, day-one-patch, and onboard skills are removed, and workflow-catalog.yaml, /help, and docs no longer reference them
- [ ] #5 sprint-plan, sprint-status, and bug-triage are removed or replaced by thin Backlog-backed equivalents
- [ ] #6 Default review mode is solo
- [ ] #7 QA evidence gating (story-done BLOCKING/ADVISORY gates) and gate-check phase checklists still function
- [ ] #8 The status vocabulary mapping is decided and configured in backlog/config.yml
- [ ] #9 WORKFLOW-GUIDE.md and related docs describe the new flow
<!-- AC:END -->

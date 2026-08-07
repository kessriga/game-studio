---
id: TASK-2
title: Rename "CCGS Skill Testing Framework" directory to qa/
status: Done
assignee: []
created_date: '2026-08-07 12:45'
updated_date: '2026-08-07 17:30'
labels:
  - qa
  - refactor
dependencies: []
priority: medium
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The framework's own QA layer lives in a root directory named "CCGS Skill Testing Framework" — spaces in the name are a standing quoting hazard, and the owner wants it kept but renamed to `qa/`. The directory contains catalog.yaml (registry of all skills/agents with spec paths), quality-rubric.md, behavioral specs, and templates. Known referencers of the literal name: `.claude/skills/skill-test/SKILL.md`, `.claude/skills/skill-improve/SKILL.md`, the directory's own CLAUDE.md and README.md (which pin literal paths), and catalog.yaml spec paths. Note the repo separately has `production/qa/` for game QA evidence — that directory is unrelated and must not be touched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Directory renamed to qa/ via git mv so history follows the files
- [x] #2 All references to the old directory name are updated (skill-test, skill-improve, the directory's own CLAUDE.md/README, catalog.yaml paths, any docs)
- [x] #3 A repo-wide search for the old name returns zero hits
- [x] #4 /skill-test static mode resolves specs from the new location successfully
- [x] #5 production/qa/ (game QA evidence) is untouched
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Renamed the root directory `CCGS Skill Testing Framework/` → `qa/` via `git mv` (all 131 tracked files moved as renames, history preserved).

**References updated:** all 125 `spec:` paths in `qa/catalog.yaml`; `.claude/skills/skill-test/SKILL.md` and `skill-improve/SKILL.md`; the directory's own `qa/CLAUDE.md` and `qa/README.md` (path refs + prose headings + `rm -rf` lines, which also lost their now-pointless quotes); the `Justfile` comment; and the `add-bevy-engine` OpenSpec change (`proposal.md`, plus `design.md`/`tasks.md`, which had *descriptive* "may be renamed to qa/" hedges my literal-string grep initially missed — the now-resolved conditionals were simplified to name `qa/` directly).

**Verification (AC evidence):**
- AC#1 — `git status` shows 131 renames, not delete+add.
- AC#2/#3 — repo-wide `grep "CCGS Skill Testing Framework"` returns zero hits across the branch. (The only remaining hit anywhere is this task record's own title/description, which necessarily names what it renames.)
- AC#4 — every one of the 125 catalog `spec:` paths resolves to an existing file at the new `qa/` location (`xargs ls` clean; 125 found = 125 expected). `/skill-test` is a model-driven skill with no CLI, so this static path-resolution check is the mechanical evidence; the skill itself was not executed.
- AC#5 — `production/qa/` is a separate path (and not yet a committed dir); `git status production/` is empty. Root `qa/` does not collide with it.

**Note (out of PR scope):** the untracked file `task-5 …opus-4-8.md` in the main checkout listed `CCGS Skill Testing Framework/CLAUDE.md` as a file it plans to edit; the rename made that path stale. Corrected it to `qa/CLAUDE.md` in the main checkout so it isn't broken on disk — it rides in TASK-5's own future PR, not this one.
<!-- SECTION:FINAL_SUMMARY:END -->

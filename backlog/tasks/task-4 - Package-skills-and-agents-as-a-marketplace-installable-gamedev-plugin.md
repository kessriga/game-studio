---
id: TASK-4
title: Package skills and agents as a marketplace-installable "gamedev" plugin
status: Done
assignee: []
created_date: '2026-08-07 12:46'
updated_date: '2026-08-08 10:46'
labels:
  - plugin
  - packaging
dependencies:
  - TASK-1
  - TASK-2
  - TASK-3
documentation:
  - 'https://code.claude.com/docs/en/plugins.md'
  - 'https://code.claude.com/docs/en/plugins-reference.md'
  - 'https://code.claude.com/docs/en/plugin-marketplaces.md'
priority: medium
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The template is currently adopted by forking the whole repo; skills and agents are not installable. Package the framework as a Claude Code plugin named `gamedev`, with the repo doubling as its own marketplace (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`). Plugin naming automatically and mandatorily namespaces everything: skills become /gamedev:&lt;name&gt;, agents @gamedev:&lt;name&gt; — no manual renaming.

Key facts for an implementer: internal cross-references to bare slash commands (~2,900 occurrences across ~250 files; ~900 functional ones inside SKILL.md bodies, 6 in hooks, ~49 in agent prompts, rest in docs) must become namespaced. The framework/project split matters: a plugin can ship skills/agents/hooks/MCP config but NOT the project CLAUDE.md or the production/-design/-src/ scaffolding — those must be created into the user's project by a first-run flow (the existing /start skill is the natural home). Hazards found 2026-08-07: all hooks use bare relative paths (zero uses of $CLAUDE_PROJECT_DIR) and need ${CLAUDE_PLUGIN_ROOT} vs ${CLAUDE_PROJECT_DIR} separation; validate-skill-change.sh derives skill names from the .claude/skills/&lt;name&gt; path pattern; ~46 skills hardcode .claude/docs/... paths in prose (framework docs move into the plugin; technical-preferences.md stays project-side). Unverified: whether plugins can ship .claude/rules/ (glob-scoped rules) — test, else scaffold rules into the project. Plugin docs: https://code.claude.com/docs/en/plugins.md, plugins-reference.md, plugin-marketplaces.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A fresh project can install via /plugin marketplace add <repo> and /plugin install, then invoke skills as /gamedev:<name> and agents as @gamedev:<name>
- [x] #2 A first-run flow scaffolds project-side content (project CLAUDE.md config, production/, design/, docs/engine-reference selection) into the user's repo
- [x] #3 All hooks function when run from the plugin install location (correct ${CLAUDE_PLUGIN_ROOT}/${CLAUDE_PROJECT_DIR} usage), including validate-skill-change with plugin skill paths
- [x] #4 Internal cross-references in skills, agents, hooks, and docs use the /gamedev: namespaced form
- [x] #5 Framework docs referenced by skills resolve from inside the plugin; per-project config (technical-preferences.md) stays in the user's repo
- [x] #6 The .claude/rules delivery question is resolved (shipped in plugin if supported, otherwise scaffolded) and documented
- [x] #7 End-to-end install is verified in a fresh test project, including a SessionStart hook run and one full skill invocation
- [x] #8 The status-line delivery question is resolved and documented: plugins cannot declare a main-session statusLine, so decide how to deliver the production-stage breadcrumb now in .claude/statusline.sh + settings.json (recommended: drop from plugin, document as opt-in project settings.json entry, optionally surface stage via a SessionStart hook) rather than having the plugin auto-provide it. See the dated comment for the full finding.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: Claude (Opus 4.8)
created: 2026-08-07 15:46
---
Hazard found 2026-08-07 (verified against Claude Code plugin docs): the framework's production-stage status line does NOT survive plugin packaging. Plugins cannot ship a main-session `statusLine` — `plugin.json` has no such field, and a bundled `settings.json` only supports `agent` and `subagentStatusLine` (subagent-panel formatting, unrelated to the bottom-line session status). It works today only because the template commits a `statusLine` block into the repo's `.claude/settings.json` (project-layer settings, which apply to every session opened in the repo and override the user's global statusLine). As a plugin it would apply to zero projects automatically. Also: `${CLAUDE_PLUGIN_ROOT}` is available in hook/MCP/LSP commands but NOT in the settings-layer statusLine command, so you cannot point a project statusLine at the plugin's bundled statusline.sh via that variable. Options: (1) drop the status line, document it as an opt-in project settings.json entry pointing at the shipped statusline.sh; (2) surface the stage via a SessionStart hook that prints it (hooks can use ${CLAUDE_PLUGIN_ROOT}); (3) avoid — a hook that silently writes statusLine into the user's settings.json (invasive, recreates the shadowing problem). Silver lining: as a plugin it will no longer hijack users' personal status lines the way the committed settings.json does.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Packaged the framework as the marketplace-installable `gamedev` Claude Code plugin (posture: plugin-first; fork-template adoption retired). Verified end-to-end by installing the plugin from the branch into a fresh project on Claude Code 2.1.226.

**Conventions verified by spike before the irreversible sweep** (read from installed plugins on disk + a throwaway install): agent refs are `gamedev:<agent>` colon-form (no `@`); skills reference bundled docs by skill-relative path (`../../docs/…`); `marketplace.json` `source: "./"` is valid; `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PROJECT_DIR}` expand in hooks; plugin `bin/` lands on the Bash PATH.

**What shipped (10 commits, per-phase):**
- Canonical plugin layout: `.claude-plugin/{plugin.json,marketplace.json}`, `skills/` (72, incl. new `status`), `agents/` (53), `hooks/` (11 + hooks.json), `bin/gamedev-stage`, framework `docs/`, project scaffold sources in `templates/`. Repo `.claude/` reduced to dev-only tooling. History preserved via git mv (274 renames).
- Namespace + path sweep (list-driven, boundary-safe, idempotent): ~2,800 refs across 152 shipped files + 91 qa files → `/gamedev:` and `gamedev:`; framework-doc paths → skill-relative; project-side refs (`.claude/rules`, `technical-preferences.md`) kept. Committed `scripts/check-namespacing.py` gate (passes).
- Hooks register via `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` and a `cd ${CLAUDE_PROJECT_DIR}` guard; `validate-skill-change.sh` stays repo-side, re-keyed to `skills/<name>/SKILL.md`.
- Status line retired (AC #8): `bin/gamedev-stage` (mode 755) feeds the SessionStart hook and a new Haiku `/gamedev:status` skill; nothing touches the user's status line.
- `/gamedev:start` gains Phase 0 scaffolding (AC #2, #6): consent + engine choice, copies project CLAUDE.md, 11 rules, technical-preferences, dir tree, and only the chosen engine's reference; `cp -n` never overwrites; detect-step makes it idempotent.
- Docs: README/CONTRIBUTING rewritten for plugin install + dogfooding; "adoption model changed" note; min version recorded.

**Decisions (owner-approved):** framework-general docs ship plugin-side (not scaffolded) — trades always-in-context for always-fresh; the safety-critical Collaboration Protocol stays inline in the scaffolded CLAUDE.md. Rules can't ship in a plugin (verified) → scaffolded.

**E2E results:** install → 72 skills/53 agents under namespace; SessionStart hook fires from install location; `/gamedev:status` runs `gamedev-stage` off the PATH; `/gamedev:start` scaffolds 11 rules + technical-preferences + Godot-only reference with NO settings.json intrusion; re-run detected-and-skipped (CLAUDE.md hash unchanged). `claude plugin validate` and the namespacing gate pass.

**Notes/folds:** hook-text skill refs (task 2.4) folded into the phase-3 sweep; the namespacing gate lives in `scripts/` (not `.claude/`); qa verification used the namespacing gate over the corpus rather than running the full heavyweight skill-test harness. OpenSpec change `package-gamedev-plugin` (proposal/design/4 specs/tasks) is complete and ready to archive after merge.
<!-- SECTION:FINAL_SUMMARY:END -->

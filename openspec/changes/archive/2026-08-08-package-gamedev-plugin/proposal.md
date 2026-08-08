# Package the framework as the `gamedev` plugin

## Why

The framework is currently adopted by forking the entire repository: skills, agents, hooks, and docs only work because they sit in the adopting project's own `.claude/` directory. That makes updates a manual merge, mixes framework internals with the user's game project, and commits a `statusLine` block into project settings that hijacks every user's personal status line. Claude Code's plugin system solves all of this — a plugin ships skills/agents/hooks from a versioned install location with automatic `/gamedev:<name>` namespacing — and the repo can double as its own marketplace, so installation is two commands. Tracked as Backlog **TASK-4** (dependencies TASK-1/2/3 all Done).

The decision to go **plugin-first** is deliberate and settled: the ~900 functional cross-references inside skill bodies can only be written one way (bare `/brainstorm` *or* namespaced `/gamedev:brainstorm`), so the repo cannot remain a working fork-template and become a plugin at the same time. Fork-mode adoption is retired.

## What Changes

- **BREAKING: repo restructured to canonical plugin layout; fork-template adoption retired.** Shipped components move out of `.claude/` to the plugin root: `.claude/skills/` → `skills/` (71 skills), `.claude/agents/` → `agents/` (53 agents), hook scripts → `hooks/` + `scripts/`, framework docs out of `.claude/docs/`. `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` make the repo installable via `/plugin marketplace add` + `/plugin install gamedev`. The repo's remaining `.claude/` holds only framework-dev tooling (e.g. `validate-skill-change.sh`, OpenSpec commands), which does not ship.
- **All internal cross-references become namespaced.** ~2,900 occurrences across ~250 files (~900 functional in SKILL.md bodies, ~49 in agent prompts, 6 in hooks, rest in docs) rewritten from `/name` to `/gamedev:name` and `@agent` to `gamedev:agent` forms, plus ~46 skills' hardcoded `.claude/docs/...` paths repointed to the docs' new in-plugin locations.
- **Hooks ship via `hooks/hooks.json` with correct root separation.** All shipped hooks currently use bare relative paths; they gain `${CLAUDE_PLUGIN_ROOT}` for framework files and `${CLAUDE_PROJECT_DIR}` for project files (`production/`, `design/`, `backlog/`). `validate-skill-change.sh` is framework-dev tooling and stays repo-side, unshipped.
- **`/gamedev:start` becomes the first-run scaffolder.** A plugin cannot ship project CLAUDE.md, settings, or the `production/`–`design/`–`src/` tree, and — verified against current plugin docs — it also cannot ship `.claude/rules/` (no such component exists; resolves AC #6 as "scaffold"). `/start` gains a scaffolding phase that creates the project-side content in the user's repo: project CLAUDE.md, directory tree, the 11 rules files, `technical-preferences.md`, engine-reference selection.
- **Status line replaced by two delivery channels (resolves AC #8).** The committed `statusLine` settings block and `statusline.sh` are removed. Its framework value (production stage + Epic > Feature > Task breadcrumb) is delivered by (1) the shipped SessionStart hook printing it at session start, and (2) a new on-demand `/gamedev:status` micro-skill (Haiku tier). The live statusline's ctx%/model segments are not replicated — Claude Code's own UI already shows them. Per owner decision there is **no** opt-in scaffolded statusline.

## Capabilities

### New Capabilities

- `plugin-packaging`: the framework installs as the `gamedev` plugin from the repo acting as its own marketplace — canonical plugin layout, valid manifests, skills invocable as `/gamedev:<name>`, agents as `gamedev:<name>` subagents, all internal cross-references and framework-doc paths resolving from the plugin install location.
- `plugin-hooks`: shipped hooks function when run from the plugin install location, separating `${CLAUDE_PLUGIN_ROOT}` (framework files) from `${CLAUDE_PROJECT_DIR}` (project files); framework-dev-only hooks stay repo-side.
- `project-scaffolding`: `/gamedev:start` creates the project-side content a plugin cannot ship — project CLAUDE.md, `production/`–`design/`–`docs/` tree, rules files, `technical-preferences.md`, engine-reference selection — idempotently and with user consent.
- `stage-status-surfacing`: the production stage + breadcrumb formerly shown in the status line is printed by the SessionStart hook and available on demand via `/gamedev:status`, both driven by one shared stage-detection script.

### Modified Capabilities

<!-- none: openspec/specs/ has no synced capability specs yet (agent-model-tiers not yet synced); no existing spec requirements change -->

## Impact

- **File moves**: ~250 files relocate (`skills/`, `agents/`, hook scripts, framework docs). Git history preserved via `git mv`.
- **Content rewrite**: the ~2,900-reference namespace sweep touches nearly every skill, agent, and doc; scriptable, but needs a verification pass (AC #4).
- **`qa/` corpus**: skill/agent specs assert paths and bare invocation names; the corpus needs the same namespace-and-path sweep.
- **Repo dev workflow changes**: opening the repo no longer loads the framework's skills from `.claude/`; framework developers install the plugin from the local path to dogfood. `validate-skill-change.sh` re-keys its skill-name derivation from `.claude/skills/<name>` to `skills/<name>`.
- **Docs**: README/quick-start adoption instructions rewritten around `/plugin install`; UPGRADING content already removed (PR #8); `.claude/docs/` split into shipped framework docs vs repo-dev docs.
- **Settings**: the template's committed `statusLine` block and permission lists stop shipping to users entirely (plugin `settings.json` supports neither); statusline.sh is deleted.
- **Out of scope**: no change to what any skill/agent *does* (behavior-preserving repackaging); Backlog.md MCP configuration remains a user-level choice; no plugin `userConfig` usage.
- **Acceptance criteria mapping**: AC #1 install+invoke (plugin-packaging), AC #2 scaffolding (project-scaffolding), AC #3 hooks (plugin-hooks), AC #4 namespacing (plugin-packaging), AC #5 doc resolution (plugin-packaging), AC #6 rules→scaffold (project-scaffolding), AC #7 end-to-end verify (tasks), AC #8 statusline (stage-status-surfacing).

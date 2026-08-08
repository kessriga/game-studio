# Tasks — package-gamedev-plugin

## 0. Spike — verify conventions before the irreversible sweep (D0, D5)

- [x] 0.1 In a throwaway dir: `.claude-plugin/plugin.json` + `marketplace.json` (`"source": "./"`), 2-3 copied skills (one that reads a bundled `docs/x.md` via `../../docs/`), one hook in `hooks/hooks.json` using `${CLAUDE_PLUGIN_ROOT}`, and an executable `bin/gamedev-stage` stub
- [x] 0.2 Install into a fresh temp project; confirm all four: (a) `/gamedev:<skill>` invokes, (b) the SessionStart hook fires with `${CLAUDE_PLUGIN_ROOT}` expanded, (c) the skill reads its bundled doc via the relative path, (d) a skill runs `gamedev-stage` bare and it resolves on the Bash PATH
- [x] 0.3 If (d) fails (no on-disk precedent for plugin `bin/`), fall back to referencing `gamedev-stage` by relative path from the skill and revise D5 before proceeding

## 1. Manifests and restructure (D1, D2)

- [x] 1.1 Write `.claude-plugin/plugin.json` (name `gamedev`, description, version `0.1.0`, author) and `.claude-plugin/marketplace.json` (single plugin, `"source": "./"`); run `claude plugin validate .`
- [x] 1.2 `git mv .claude/skills skills` and `git mv .claude/agents agents`; verify no frontmatter `name:` carries a `gamedev:` prefix
- [x] 1.3 `git mv` the 11 shipped hook scripts to `hooks/` (leave `validate-skill-change.sh` in `.claude/hooks/`)
- [x] 1.4 Split `.claude/docs/`: `git mv` all framework-general docs to plugin `docs/` — including `coordination-rules.md`, `coding-standards.md`, `context-management.md`, `directory-structure.md` (all four formerly `@`-imported by CLAUDE.md), plus agent-roster, workflow catalog, hooks/rules references; move `technical-preferences.md` and the project CLAUDE.md/settings templates into `templates/` as project-side scaffold sources
- [x] 1.5 Move the 11 `.claude/rules/*.md` files into `templates/rules/`; move `docs/engine-reference/` snapshots into `templates/engine-reference/` per engine
- [x] 1.6 Reduce repo-side `.claude/settings.json` to dev tooling only: drop the `statusLine` block, keep permissions, keep only the `validate-skill-change` hook registration (re-keyed to `skills/<name>/` paths inside the script)

## 2. Hooks (D4)

- [x] 2.1 Author `hooks/hooks.json` registering the 11 shipped hooks with today's events/matchers and `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.sh` commands
- [x] 2.2 Sweep the 11 hook scripts: project paths (`production/`, `design/`, `assets/`, `backlog/`, logs) → `"$CLAUDE_PROJECT_DIR"/...`; any framework file access → `"$CLAUDE_PLUGIN_ROOT"/...`
- [x] 2.3 Add pre-scaffold guards: every shipped hook exits 0 quietly when project-side files are absent; `session-start.sh`/`detect-gaps.sh` point to `/gamedev:start` instead
- [x] 2.4 Namespace the 6 skill references inside hook output text

## 3. Namespace and path sweep (D3)

- [x] 3.1 Build the roster from the filesystem after 1.2 (72 skill names incl. new `status` + 53 agent names) and a sweep script that rewrites `/name` → `/gamedev:name` and agent references → `gamedev:name` (colon form) in `skills/`, `agents/`, `hooks/`, shipped `docs/`, `templates/`, README — excluding Claude Code built-ins and the paths `.git/`, `openspec/`, `backlog/`, `.remember/`, `.claude/worktrees/`
- [x] 3.2 Run the sweep; hand-review hits where a name appears in prose position (grep report, not blind sed)
- [x] 3.3 Rewrite the ~46 skills' hardcoded `.claude/docs/...` paths to the skill-relative form `../../docs/<file>.md` (D7); keep `technical-preferences.md`, rules, and engine `VERSION.md` references at their project-side paths
- [x] 3.4 Apply the same sweep to the `qa/` corpus (invocation names and skill/agent paths in specs, catalog, rubric)
- [x] 3.5 Zero-residual gate: grep for bare framework names in reference position across shipped files returns nothing; commit the grep as a repeatable check script in `.claude/` (dev-side)

## 4. Stage surfacing (D5)

- [x] 4.1 Extract stage detection + breadcrumb from `statusline.sh` into `bin/gamedev-stage` (drop ctx%/model; read project files from cwd); delete `statusline.sh`
- [x] 4.2 Wire `session-start.sh` to print the `gamedev-stage` output via `${CLAUDE_PLUGIN_ROOT}/bin/gamedev-stage`
- [x] 4.3 Create `skills/status/SKILL.md` (`model: haiku`, read-only) that runs `gamedev-stage` and formats stage + breadcrumb; add it to the Haiku list in `docs`' coordination-rules

## 5. Scaffolding via /gamedev:start (D6)

- [x] 5.1 Add the scaffolding phase to `skills/start/SKILL.md`: consent prompt, copy from `templates/` (project CLAUDE.md, directory tree, 11 rules, `technical-preferences.md` skeleton), never overwrite, report existing files. The scaffolded CLAUDE.md `@`-imports only project docs (`technical-preferences.md`, engine `VERSION.md`) and keeps the Collaboration Protocol + Backlog-workflow pointer inline (D6)
- [x] 5.2 Add engine-reference selection: copy only the chosen engine's snapshot into the project's `docs/engine-reference/`
- [x] 5.3 Document in the scaffolded project CLAUDE.md template that rules/technical-preferences are project-owned and how to re-run scaffolding

## 6. Docs and adoption story (D8)

- [x] 6.1 Rewrite README adoption section around `/plugin marketplace add` + `/plugin install gamedev` + `/gamedev:start`; add the "adoption model changed — forks keep working but are frozen" note; record the verified minimum Claude Code version
- [x] 6.2 Update CONTRIBUTING/quick-start for the dogfooding workflow (install plugin from local path; `.claude/` is dev-tooling only) and document the statusline retirement + rules-are-scaffolded decisions (AC #6, #8)
- [x] 6.3 Sync `.claude/docs`-adjacent references: directory-structure doc, hooks-reference, skills-reference, workflow catalog to the new layout and namespaced names

## 7. End-to-end verification (AC #7)

- [x] 7.1 In a fresh temp project: `claude plugin marketplace add <repo path>`, install `gamedev`, confirm skills/agents list under the namespace, run one full skill (`/gamedev:help`) and confirm a SessionStart hook fired from the install location
- [x] 7.2 Run `/gamedev:start` scaffolding in the temp project; verify AC #2 artifact list, idempotent re-run, untouched settings.json, and `/gamedev:status` output pre- and post-scaffold
- [x] 7.3 Verify pre-scaffold hook silence (empty project, no errors) and post-scaffold hook behavior (active.md preview, stage line)
- [x] 7.4 Run the qa corpus checks that assert names/paths; run the zero-residual grep gate; `claude plugin validate .` passes
- [x] 7.5 Close out: check TASK-4 ACs, write task summary, copy updated task record into the worktree, commit on the feature branch

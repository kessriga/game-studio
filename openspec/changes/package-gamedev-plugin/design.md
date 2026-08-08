# Design — package-gamedev-plugin

## Context

The framework today is a fork-me template: 71 skills in `.claude/skills/`, 53 agents in `.claude/agents/`, 12 hooks registered through a committed `.claude/settings.json`, framework docs in `.claude/docs/`, and a `statusLine` block that overrides the user's own. Everything addresses everything else by bare name (`/brainstorm`) and bare relative path (`.claude/docs/coordination-rules.md`, `production/session-state/active.md`).

Claude Code plugins (verified against the current plugins reference, 2026-08-08) ship skills, commands, agents, hooks, MCP/LSP config, `bin/` executables, and a `settings.json` limited to `agent`/`subagentStatusLine`. They cannot ship: project CLAUDE.md (a plugin-root CLAUDE.md is explicitly not loaded), `.claude/rules/` (no such component), a main-session `statusLine`, or permission lists. `${CLAUDE_PLUGIN_ROOT}` expands in hook/MCP/LSP commands only; `${CLAUDE_PROJECT_DIR}` addresses the user's project from hooks.

Constraints inherited from decided ACs and owner decisions: plugin-first (posture 1 — fork mode retired), rules are scaffolded, statusline is replaced by SessionStart hook + on-demand skill only, `validate-skill-change.sh` stays repo-side.

## Goals / Non-Goals

**Goals:**

- Two-command adoption: `/plugin marketplace add <repo>` + `/plugin install gamedev`, then `/gamedev:start` to scaffold a project.
- Behavior-preserving repackaging: every skill/agent/hook does exactly what it does today, from a new location and under a namespace.
- Clean framework/project split: framework files resolve from the plugin install; project files live in (and are created into) the user's repo.
- The repo remains the single source: it is the plugin, the marketplace, and the dev workspace at once.

**Non-Goals:**

- No changes to skill/agent behavior, model tiers (TASK-5 pins stay), or the workflow the framework teaches.
- No dual-mode support: a plain fork of the restructured repo is not expected to work as a `.claude/` template anymore.
- No plugin `userConfig` prompts — engine selection stays a guided conversation in `/gamedev:start` / `/gamedev:setup-engine`.
- No replication of the statusline's ctx%/model segments (Claude Code UI shows both natively).
- No auto-writing of the user's `settings.json` (the invasive option the task comment warns against).

## Decisions

### D0. Conventions confirmed against installed plugins (2026-08-08)

Read from installed plugin trees on disk (`superpowers` 6.2.0, `codex` 1.0.6, `fable-method`), not just docs:

- **Agent cross-reference form is `gamedev:<agent>`** — colon, no `@`, no leading slash — in prose *and* in `subagent_type` (codex writes `subagent_type: "codex:codex-rescue"`). The `@agent` form is only the user's interactive mention; the task's "@gamedev:" phrasing is corrected to `gamedev:` everywhere (matches the specs).
- **Skill→bundled-file references are relative paths from the skill's own directory**, `../` allowed to reach up (superpowers: `../using-superpowers/references/codex-tools.md`). This is the mechanism for D7 — no `${CLAUDE_PLUGIN_ROOT}` needed in skill bodies.
- **`marketplace.json` with `"source": "./"` is valid and real** (fable-method ships exactly this). Manifest is minimal: `name`, `description`, `version`, `author`.
- **`hooks/hooks.json` uses quoted `"${CLAUDE_PLUGIN_ROOT}/hooks/<script>"`** (superpowers), confirming D4.
- **No installed plugin ships `bin/`** — so D5's "bin on the Bash PATH" claim is the one convention with no on-disk precedent here, and is the spike's primary target (task 0).

### D1. Canonical plugin layout at repo root (not manifest path-remapping)

`skills/`, `agents/`, `hooks/`, `scripts/`, `bin/`, `templates/`, framework docs at the plugin root; `.claude-plugin/plugin.json` + `marketplace.json`. The manifest *could* remap paths into the existing `.claude/` layout with less churn, but remapping only hides the restructure: the repo's `.claude/` would then half-work as a project (bare-name skills whose bodies reference namespaced names), and framework devs with the plugin installed would load all 71 skills twice. The honest layout also re-keys `validate-skill-change.sh` trivially (`skills/<name>/`). Moves use `git mv` to preserve history.

What ships vs stays repo-side:

| Ships in plugin | Stays repo-side (`.claude/`, unshipped) |
|---|---|
| `skills/` (71 + new `status`), `agents/` (53) | `commands/opsx/` (OpenSpec dev commands) |
| `hooks/hooks.json` + 11 hook scripts | `validate-skill-change.sh` + its PostToolUse registration |
| `bin/gamedev-stage` (stage detection) | dev `settings.json` (dev hooks, permissions) |
| framework docs (moved out of `.claude/docs/`) | `agent-memory/`, `worktrees/`, OpenSpec/backlog dirs |
| `templates/` (scaffold sources incl. rules, engine-reference) | `qa/` corpus (validation harness, not runtime) |

### D2. Repo doubles as its own marketplace

`.claude-plugin/marketplace.json` lists the single `gamedev` plugin with `"source": "./"`. Install copies the repo; unshipped dirs (`qa/`, `openspec/`, `backlog/`) ride along as dead weight but are never loaded — acceptable, and the alternative (a build/publish step) violates the no-pipeline simplicity goal.

### D3. Namespace sweep is list-driven, not pattern-driven

The rewrite of ~2,900 references is a script keyed on the **exact roster of skill and agent names built from the filesystem after the `git mv`** (72 skills — 71 + new `status` — and 53 agents), not a regex for "anything slash-shaped". This protects built-ins that must stay bare (`/plugin`, `/clear`, `/compact`, `/config`) and prose that merely looks like a command. The sweep's file scope **excludes** `.git/`, `openspec/`, `backlog/`, `.remember/`, `qa/` (swept separately), and `.claude/worktrees/` (the task-2 and task-5 worktrees are live under that path — rewriting them would corrupt other in-flight work). Skill `name:` frontmatter and agent frontmatter names stay **bare** — the `gamedev:` prefix is applied by Claude Code's plugin machinery, and hardcoding it would double-prefix. Verification: after the sweep, grep for bare framework names in invocation position across shipped files must return zero; the `qa/` corpus gets the same sweep and re-asserts.

### D4. Hooks: `hooks/hooks.json` with two-root discipline

The 11 shipped hooks register in the plugin's `hooks/hooks.json` (same events/matchers as today's settings.json). Every script path becomes `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.sh`; every project file the scripts read/write (`production/session-state/active.md`, `production/session-logs/`, `design/`, `assets/`, `backlog/`) becomes `"$CLAUDE_PROJECT_DIR"/<path>` inside the scripts. Scripts gain a guard: when project-side files don't exist (plugin installed but project not scaffolded), exit 0 silently rather than erroring — the pre-`/start` experience must be clean.

### D5. Stage detection becomes one shared executable, `bin/gamedev-stage`

`statusline.sh`'s stage-detection + breadcrumb logic (minus ctx%/model, which only exist on statusline stdin) moves to `bin/gamedev-stage`. Two consumers:

- `session-start.sh` calls `"${CLAUDE_PLUGIN_ROOT}/bin/gamedev-stage"` and prints `Stage: <stage> [| Epic > Feature > Task]` in its context block (hooks can't use the bin PATH — it applies to the Bash tool only).
- New `/gamedev:status` micro-skill (`model: haiku`, read-only) runs bare `gamedev-stage` via Bash — plugin `bin/` is on the Bash tool PATH while the plugin is enabled — and formats the result. Registered in the Haiku list in `coordination-rules.md`.

The script reads `production/stage.txt`, artifact heuristics, and `technical-preferences.md` from the project (cwd), same logic as today. `statusline.sh` and the `statusLine` settings block are deleted; nothing ever touches the user's statusline again. **`bin/gamedev-stage` must be committed mode 755** — extracted as a new file it is not executable by default, and a non-executable target fails in a way that reads like "the PATH doesn't work."

### D6. `/gamedev:start` owns project scaffolding; templates ship in `templates/`

Scaffold sources ship in the plugin's `templates/` directory and cover only **project-owned** content: the project CLAUDE.md template, the 11 rules files, the `technical-preferences.md` skeleton, the directory tree, and engine-reference snapshots per engine. `/start` gains a scaffolding phase before its existing guided flow: with the user's consent (the collaboration protocol mandates asking), copy templates into the project, creating `CLAUDE.md`, `production/`, `design/`, `docs/`, `.claude/rules/`, and `.claude/docs/technical-preferences.md`. Idempotent: existing files are never overwritten, only reported. `technical-preferences.md` keeps its current project-side path so the many skill references to it remain valid unchanged.

The **scaffolded project CLAUDE.md** `@`-imports only project-owned docs — `technical-preferences.md` and the chosen engine's `VERSION.md` — never the framework-general docs (which no longer live project-side; see D7). Content that today lives *inline* in the template's CLAUDE.md and must always apply — the **Collaboration Protocol** ("ask before Write/Edit") and the **Backlog workflow** pointer — stays inline in the scaffolded CLAUDE.md, so safety-critical always-on behavior is not lost when the reference docs move plugin-side.

### D7. Framework-general docs ship plugin-side, referenced relative to the referencing skill

Per owner decision (2026-08-08), **all framework-general docs ship inside the plugin** and are never scaffolded or `@`-imported — including the three formerly force-loaded via CLAUDE.md `@`-imports (`coordination-rules.md`, `coding-standards.md`, `context-management.md`) and `directory-structure.md`, alongside agent-roster, workflow catalog, hooks/rules references, etc. They move from `.claude/docs/` to `docs/` at the plugin root.

Skills that cite a framework doc reference it by **path relative to the skill's own SKILL.md** — `../../docs/<file>.md` from `skills/<name>/SKILL.md` — the confirmed convention (D0). Only project-side docs (`technical-preferences.md`, scaffolded rules, engine `VERSION.md`) are referenced by project path.

**Accepted tradeoff:** these docs are no longer always in context — they load when a skill or agent that cites them runs, not on every turn. The owner chose this (always-fresh, thin user repo) over scaffolding (always-on but drift-prone). Mitigation for the one always-on concern: the Collaboration Protocol stays inline in the scaffolded CLAUDE.md (D6), so "ask before writing" is never merely doc-resident.

### D8. Dogfooding: framework devs install the plugin from the local path

After restructuring, opening the repo loads no skills from `.claude/`. Developers run `claude plugin marketplace add ./` + install once; edits to `skills/` are live at the install source on next session. CONTRIBUTING/README document this. The repo-side `settings.json` keeps only dev tooling (validate-skill-change hook, permissions).

## Risks / Trade-offs

- **[Sweep misses or over-rewrites]** → list-driven script (D3), zero-residual grep gate, `qa/` corpus re-run, and AC #7's end-to-end invocation in a fresh project.
- **[Docs drift: plugin behavior changes between Claude Code versions]** (bin PATH, hooks.json semantics, marketplace fields) → AC #7 verification is against a real current Claude Code, not docs; pin observed minimum version in README.
- **[Pre-scaffold sessions: hooks fire in a project with no `production/`]** → D4 exit-0 guards; SessionStart prints a "run /gamedev:start" pointer instead of noise (detect-gaps.sh already does this).
- **[Breadcrumb loses liveness]** — statusline updated every prompt; hook+skill show snapshots. Accepted by owner decision; `/gamedev:status` is the mid-session refresh.
- **[Install dead weight]** — marketplace source `./` copies qa/openspec/backlog dirs. Accepted (D2) for zero-pipeline simplicity.
- **[Forks in the wild break silently]** — anyone who forked the template keeps a working pre-plugin copy; README gains a prominent "adoption model changed" note (UPGRADING.md was already removed).

## Migration Plan

Single PR on `feat/4-package-gamedev-plugin`, committed per phase (revert points): (0) **spike** — manifest + marketplace + a few representative skills + one hook + `bin/gamedev-stage`, installed into a throwaway project, to confirm the four D0/D5 conventions (namespaced invocation, hook firing with `${CLAUDE_PLUGIN_ROOT}` expanded, a skill reading a bundled doc via `../../docs/`, a skill calling `gamedev-stage` bare on the PATH) *before* the irreversible sweep; (1) manifests + `git mv` restructure; (2) hooks.json + two-root hook edits; (3) namespace/path sweep incl. qa corpus; (4) `bin/gamedev-stage` + `/gamedev:status` + statusline deletion; (5) `/start` scaffolding phase + templates; (6) docs/README rewrite; (7) fresh-project end-to-end verification (AC #7). If the spike contradicts a convention, the affected decision is revised before phase 3. Rollback is `git revert` of the PR — no installed user base exists yet, so no compatibility shims.

## Open Questions

- Marketplace/plugin `version` discipline: adopt semver starting at `0.1.0` and bump per release PR — confirm the owner wants version bumps as a PR checklist item (not blocking; default assumed yes).
- Whether `notify.sh` (Windows-toast-specific) should ship as-is or gain a macOS/Linux fallback — shipped as-is in this change; fallback would be scope creep.

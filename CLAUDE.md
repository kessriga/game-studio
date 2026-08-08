# gamedev plugin — development workspace

This repository **is** the `gamedev` Claude Code plugin and its marketplace. It is
no longer a fork-me template: end users install it with `/plugin marketplace add`
and `/plugin install gamedev`, then run `/gamedev:start` to scaffold a project.
See `README.md` for the adoption story and `CONTRIBUTING.md` for the dev workflow.

> This file is loaded only when a contributor opens the repo directly. When the
> framework is installed as a plugin, a plugin-root `CLAUDE.md` is **not** loaded —
> the project-side `CLAUDE.md` the user gets comes from `templates/CLAUDE.md` via
> `/gamedev:start`.

## Layout

| Path | What it is |
|------|------------|
| `.claude-plugin/` | `plugin.json` + `marketplace.json` (this repo is its own marketplace) |
| `skills/` | 72 plugin skills — invoked as `/gamedev:<name>` |
| `agents/` | 53 subagents — addressed as `gamedev:<name>` |
| `hooks/` | shipped hooks (`hooks.json` + scripts), run from `${CLAUDE_PLUGIN_ROOT}` |
| `bin/` | plugin executables on the Bash `PATH` (e.g. `gamedev-stage`) |
| `docs/` | framework docs + document templates; skills read them via `../../docs/…` |
| `templates/` | project scaffold sources `/gamedev:start` copies into a user's repo (project `CLAUDE.md`, rules, engine references, directory seeds) |
| `.claude/` | **dev-only**, not shipped: `settings.json`, `hooks/validate-skill-change.sh`, `commands/opsx/`, `agent-memory/` |
| `qa/`, `openspec/`, `backlog/` | validation corpus and planning — not shipped |

## Dogfooding

To exercise the framework while developing it, install this repo as a local plugin:

```
claude plugin marketplace add ./
claude plugin install gamedev@game-studio
```

Because the local marketplace uses `source: "./"`, `${CLAUDE_PLUGIN_ROOT}` points at
this repo, so edits under `skills/`, `agents/`, `hooks/`, and `docs/` are live in the
next session.

## Conventions

- Skill/agent frontmatter `name:` stays **bare**; Claude Code applies the `gamedev:`
  prefix automatically. Never hardcode the prefix in a `name:` field.
- Cross-references between skills/agents/docs use the namespaced form
  (`/gamedev:<skill>`, `gamedev:<agent>`); Claude Code built-ins (`/plugin`, `/clear`,
  `/compact`, `/config`) stay bare.
- Skills reference framework docs by path relative to the skill's own `SKILL.md`
  (`../../docs/<file>.md`), and project-side files by their project path.
- Commit messages follow Conventional Commits and reference the task ID.

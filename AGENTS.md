# gamedev development workspace

## Sources of truth

- Read [STATUS.md](STATUS.md) before planning work to see what works and what
  still needs verification.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing or releasing; it defines
  validation and versioning. Run `just gate` before declaring a change complete.
- Read [docs/host-runtime.md](docs/host-runtime.md) when changing skills,
  delegation, project instructions, or host compatibility.
- Read [docs/decisions/](docs/decisions/) before changing a recorded design.
- Consult [README.md](README.md) for installation and the user workflow.

This repository ships the gamedev plugin for Claude Code and Codex. Game
projects belong in separate repositories. A plugin's root instructions do not
configure its users' projects; `templates/` contains their scaffold sources.

## Layout and dependency direction

Skills and role guides depend on framework docs and project artifacts.
Framework docs must not depend on a user's game. Scaffolding copies templates
into the game; game settings never live in the installed plugin cache.

| Path | Purpose |
|------|---------|
| `.claude-plugin/` | Claude manifest and marketplace |
| `.codex-plugin/`, `.agents/plugins/` | Codex manifest and marketplace |
| `skills/` | Shared skill workflows |
| `agents/` | Claude subagents; Codex role guides |
| `hooks/claude-hooks.json` | Explicitly registered Claude hooks |
| `bin/` | Project detection and stage reporting |
| `docs/` | Framework guides, decisions, and document templates |
| `templates/` | Game-project scaffolding, including shared AGENTS.md guides |
| `scripts/` | Scaffolding and repository validation |
| `.claude/`, `qa/`, `openspec/`, `backlog/` | Contributor tooling and planning |

## Editing and validation

You may inspect files, implement the requested change, run checks, and update
its docs without renewed permission. Preserve existing project files during
scaffolding. Ask before adding unrelated work or changing global configuration.
Follow the user's Git and task conventions; never commit directly to main.

- Keep skill and agent frontmatter `name:` bare. Identify skills and roles as
  `gamedev:<name>` in shared prose. Existing `/gamedev:<skill>` references are
  translated by the host guide; use each host's actual syntax in install examples.
- Call the product Game Studio and the plugin gamedev. Put host-specific model,
  installation, and runtime details in `docs/claude-code.md` or `docs/codex.md`.
- Every skill and role must link to the host guide before its workflow body.
- Resolve framework docs relative to the skill or role file. Project paths
  such as `.claude/docs/technical-preferences.md` remain project-relative.
- Maintain one instruction body in AGENTS.md; CLAUDE.md imports it. Codex does
  not expand Claude `@` imports, so AGENTS.md must explain which files to read.
- Update affected reference docs and STATUS.md with behavior changes. Keep
  detailed design reasoning under `docs/decisions/`.
- Bump both host manifests and the Claude marketplace versions together.

## Things that have caused failures

- A version bump is required for installed Claude users to receive updates.
- Hooks deliberately do nothing outside a game project, including this repo.
- Do not put Claude hooks at `hooks/hooks.json`: Codex discovers that path
  automatically. The Claude manifest points to `hooks/claude-hooks.json`.
- Claude model IDs and tool names do not configure Codex. Follow the host guide.
- Test plugin-relative paths from outside this checkout and paths with spaces.

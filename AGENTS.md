# gamedev development workspace

## Sources of truth

- Read [STATUS.md](STATUS.md) before planning work to see what works and what still needs verification.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing or releasing; it defines validation and versioning. Run
  `just gate` and `npm run check` before declaring a change complete.
- Read [docs/host-runtime.md](docs/host-runtime.md) when changing skills, delegation, project instructions, or host
  compatibility.
- Read [docs/decisions/](docs/decisions/) before changing a recorded design.
- Consult [README.md](README.md) for installation and the user workflow.

This repository ships Game Studio as a Pi package and as the gamedev plugin for Claude Code and Codex. Game projects
belong in separate repositories. Package-root instructions do not configure installed users' projects; `templates/`
contains their scaffold sources. AGENTS.md is canonical; CLAUDE.md is only an import shim.

## Layout and dependency direction

Skills and role guides depend on framework docs and project artifacts. Framework docs must not depend on a user's game.
Scaffolding copies templates into the game; game settings never live in the installed plugin cache.

| Path | Purpose |
| ------ | --------- |
| `.claude-plugin/` | Claude manifest and marketplace |
| `.codex-plugin/`, `.agents/plugins/` | Codex manifest and marketplace |
| `package.json`, `pi/` | Pi manifest, generated entry points/catalog, progress state and UI |
| `skills/` | Shared skill workflows; edit these, not generated entry points |
| `agents/` | Claude subagents; role instructions passed to Pi/Codex runners |
| `hooks/claude-hooks.json` | Explicitly registered Claude hooks |
| `bin/` | Project detection and stage reporting |
| `docs/` | Framework guides, decisions, and document templates |
| `templates/` | Game-project scaffolding, including shared AGENTS.md guides |
| `scripts/` | Scaffolding and repository validation |
| `.claude/`, `qa/`, `openspec/`, `backlog/` | Contributor tooling and planning |

## Editing and validation

You may inspect files, implement the requested change, run checks, and update its docs without renewed permission.
Preserve existing project files during scaffolding. Ask before adding unrelated work or changing global configuration.
Follow the user's Git and task conventions; never commit directly to main.

- Keep shared skill and agent frontmatter `name:` bare. Identify them as `gamedev:<name>` in shared prose. Pi uses
  `/skill:gamedev-<name>` through generated entry points; use each host's real syntax in installation and next-step
  examples.
- After changing a shared skill's name or description, run `python3 scripts/generate-pi-skills.py`. Also regenerate
  after editing `docs/workflow-catalog.yaml`. The gate checks both generated resources for drift.
- Call the product Game Studio, the Claude/Codex plugin gamedev, and the Pi package `@kessriga/gamedev`. Keep
  host-specific details in `docs/pi.md`, `docs/claude-code.md`, or `docs/codex.md`.
- Every skill and role must link to the host guide before its workflow body.
- Resolve framework docs relative to the skill or role file. Project paths such as
  `.claude/docs/technical-preferences.md` remain project-relative.
- Maintain one instruction body in AGENTS.md; CLAUDE.md imports it. Codex does not expand Claude `@` imports, so
  AGENTS.md must explain which files to read.
- Update affected reference docs and STATUS.md with behavior changes. Keep detailed design reasoning under
  `docs/decisions/`.
- Bump package.json, both plugin manifests, and the Claude marketplace together.
- Keep task worktrees under `.worktrees/`; exclude them from Git and indexers.

## Things that have caused failures

- A version bump is required for installed Claude users to receive updates.
- Hooks deliberately do nothing outside a game project, including this repo.
- Do not put Claude hooks at `hooks/hooks.json`: Codex discovers that path automatically. The Claude manifest points to
  `hooks/claude-hooks.json`.
- Claude metadata does not configure Pi or Codex. Use the installed subagent extension when available; pass role bodies
  instead of guessing registered names.
- Pi progress uses the shared catalog and game-owned state, not a second task board. Artifact presence and subagent
  prose are not approval. See `docs/pi.md`.
- The Pi panel is a noncapturing overlay, not a reserved sidebar. Preserve other extensions' handles and leave the
  editor and footer alone.
- Test plugin-relative paths from outside this checkout and paths with spaces.

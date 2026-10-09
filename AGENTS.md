# gamedev development workspace

## Sources of truth

- Read [STATUS.md](STATUS.md) before planning work to see what works and what still needs verification.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing or releasing; it defines validation and versioning. Run
  `just gate` and `npm run check` before declaring a change complete.
- Read [docs/host-runtime.md](docs/host-runtime.md) when changing skills, delegation, project instructions, or host
  compatibility.
- Read [docs/claude-code.md](docs/claude-code.md) and [docs/pi.md](docs/pi.md) when changing the mod, the Pi extension,
  manifests, or hooks.
- Read [docs/decisions/](docs/decisions/) before changing a recorded design.
- Consult [README.md](README.md) for installation and the user workflow.

This repository ships Game Studio as shared Markdown workflows, the Pi package `@kessriga/gamedev`, and the Claude Code
plugin `gamedev`. Game projects belong in separate repositories. `templates/` contains their scaffold sources;
package-root instructions do not configure installed users' games. AGENTS.md is canonical.

## Layout and dependency direction

Skills and role guides depend on framework docs and project artifacts. Framework docs must not depend on a user's game.
Scaffolding copies templates into the game; game settings never live in the installed plugin cache.

| Path | Purpose |
| ------ | --------- |
| `package.json`, `pi/` | Pi manifest, generated entry points, extension and overlay |
| `.claude-plugin/`, `hooks/`, `types/` | Claude Code manifests and the mod: hooks, pane, tool, command, state contract |
| `workflow/` | Host-neutral progress core, generated catalog JSON, and the JSON CLI |
| `skills/` | Shared skill workflows; edit these, not generated entry points |
| `agents/` | Shared specialist role instructions |
| `bin/` | Project detection and stage reporting |
| `docs/` | Framework guides, decisions, and document templates |
| `templates/` | Game-project scaffolding, including shared AGENTS.md guides |
| `scripts/` | Scaffolding and repository validation |
| `qa/`, `openspec/`, `backlog/` | Contributor tooling and planning |

## Editing and validation

You may inspect files, implement the requested change, run checks, and update its docs without renewed permission.
Preserve existing project files during scaffolding. Ask before adding unrelated work or changing global configuration.
Follow the user's Git and task conventions; never commit directly to main.

- Keep shared skill and agent frontmatter `name:` bare. Identify them as `gamedev:<name>` in shared prose. Pi uses
  `/skill:gamedev-<name>` through generated entry points and Claude Code uses `/gamedev:<name>`; shared prose never
  contains host syntax, and the contract test rejects it. Use each host's real syntax only in its guide and install
  examples.
- After changing a shared skill's name or description, run `python3 scripts/generate-pi-skills.py`. Also regenerate
  after editing `docs/workflow-catalog.yaml`. The gate checks both generated resources for drift.
- Call the product Game Studio and the Pi package `@kessriga/gamedev`. Keep Pi APIs in `docs/pi.md`.
- Every skill and role must link to the host guide before its workflow body.
- Resolve framework docs relative to the skill or role file. Project paths such as `docs/technical-preferences.md`
  remain project-relative.
- Maintain canonical AGENTS.md guides with explicit neutral preference and rule loading.
- Update affected reference docs and STATUS.md with behavior changes. Keep detailed design reasoning under
  `docs/decisions/`.
- Bump package.json, package-lock.json, and both `.claude-plugin` manifests together.
- In `hooks/`, only `gamedev.tsx` uses `$`, through top-level function declarations; the other files stay pure.
  `claude plugin validate` follows `$` only within that file.
- Keep task worktrees under `.worktrees/`; exclude them from Git and indexers.

## Things that have caused failures

- Scaffold preflight blocks legacy configuration until a reviewed migration; never replace it with defaults.
- Role metadata does not configure tools or permissions. Pass role bodies to an available authorized runner.
- Preserve protective exclusions for old host-local files and worktrees; removal is not permission to delete user data.
- Pi progress uses the shared catalog and game-owned state, not a second task board. Artifact presence and subagent
  prose are not approval. See `docs/pi.md`.
- The Pi panel is a noncapturing overlay, not a reserved sidebar. Preserve other extensions' handles and leave the
  editor and footer alone.
- Test package-relative paths from outside this checkout and paths with spaces.
- `claude plugin test <dir>` runs every `*.test.ts` below the directory, including Pi's Node tests, which it cannot
  load. `scripts/claude-check.sh` copies only the plugin files to a temporary folder first.
- The mod test kit cannot answer `session.append`; deliver notes to the model through a tool result's `context`.
  `$.ui.ask` is an `AskUserQuestion` tool call, so tests answer it with a `tool.call` hook.

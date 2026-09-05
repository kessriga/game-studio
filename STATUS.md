# Implementation status

## Working now

- Claude Code and Codex manifests expose the shared 72 skills and 53 specialist
  role guides. The release version is 0.2.0 in both host manifests.
- Root and nested game-project instructions use AGENTS.md, with CLAUDE.md imports.
  The contributor and QA guides use the same arrangement.
- Scaffolding supports Godot, Unity, Unreal, Bevy, and deferred engine selection.
  It adds missing files, preserves existing bytes, and reports guides that may
  need a reviewed migration. It rejects conflicting paths before copying.
- Status and changelog gather their inputs explicitly; help reads project state
  from files. None relies on Claude frontmatter shell injection.
- Claude's 11 hooks remain explicitly registered. Codex uses the host guide's
  explicit validation and handoff steps; no Codex hooks are registered.

## Verified locally on 2026-09-05

- `just gate`: 112 existing shell assertions and 13 Python test methods passed,
  including all engine choices, reruns, legacy guides, path conflicts, symlinks,
  and a relocated plugin directory. Ruff lint/format, shell syntax, namespacing,
  manifest consistency, and shared instruction checks passed.
- Codex CLI 0.153.4: `scripts/check-codex.py` observed all 72 namespaced skills
  through the native plugin reader and verified their host-guide paths. It
  observed no Codex hooks. This check did not install the plugin or run a model.
- The Codex plugin validator passed. Claude's manifest validator passed, with
  its expected advisory that plugin-root CLAUDE.md is contributor context and
  does not supply instructions to installed game projects.

## Limits of verification

- The first hosted run passed on Linux and macOS. Windows exposed implicit
  text decoding and Windows launching WSL Bash instead of Git Bash in the new
  tests. The repair uses UTF-8, launches the absolute Bash executable found on
  PATH, passes a slash-separated script path, and enables encoding lint.
  Hosted validation of the repair is pending.
- Conversational execution of all 72 skills, live subagent orchestration, and
  engine builds have not been exercised end to end. Role prompts and explicit
  checks do not imply automatic hook parity with Claude Code.
- The standalone skill-creator helper rejects the retained Claude extension
  fields (and OpenSpec's compatibility field). The plugin validator and Codex's
  actual plugin reader accept the shared files. Removing those fields would
  discard Claude tool and model configuration.
- Backlog.md, OpenSpec, and engines must be available separately for workflows
  that require them. No integrations or global settings were installed here.

## Recent changes

- 0.2.0: added Codex discovery, shared project guidance, portable scaffolding,
  host-aware workflows, explicit stage reporting, and the repository gate.
- Earlier releases established Claude plugin packaging, model tiers, and the
  guard that keeps hooks out of unrelated repositories.

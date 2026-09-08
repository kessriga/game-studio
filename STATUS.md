# Implementation status

## Working now

- Game Studio supports Pi, Claude Code, and Codex through shared workflows and AGENTS.md guidance. Host-specific setup
  and metadata rules live in their host guides.
- The unreleased 0.3.0 manifests agree across Pi, Claude Code, and Codex. Pi exposes 72 namespaced entry points linked
  to the shared skills and includes 53 role guides. Claude/Codex frontmatter remains unchanged.
- Root and nested game-project instructions use AGENTS.md, with CLAUDE.md imports. The contributor and QA guides use the
  same arrangement.
- Scaffolding supports Godot, Unity, Unreal, Bevy, and deferred engine selection. It adds missing files, preserves
  existing bytes, and reports guides that may need a reviewed migration. It rejects conflicting paths before copying.
- Status and changelog gather their inputs explicitly; help reads project state from files. None relies on Claude
  frontmatter shell injection.
- Claude's 11 hooks remain explicitly registered. Codex uses explicit validation and handoff steps; no Codex hooks are
  registered. Pi adds progress events, not automatic parity with Claude's validation hooks.
- Pi records named workflow runs, evidence fingerprints, user approvals, scope confirmations, and advisory gate
  decisions in `production/workflow-state.json`. Repeatable work is scoped by subject. Shared aggregate indexes are
  reviewed at scope closure rather than attached to every subject's approval.
- Pi's compact widget and optional noncapturing side overlay use the shared workflow catalog. They leave the editor and
  footer alone. The overlay can cover transcript text; it is not a reserved sidebar column.
- Delegation uses the installed subagent runner with shared role instructions. No second runner or extension-specific
  agent configurations are installed.

## Verified on 2026-09-08

These are local macOS checks against the unreleased worktree, using Node 22.23.2 and Pi 0.85.1. No package was published
or installed into user settings.

- `just --set python .venv/bin/python gate`: 112 shell assertions and 16 Python tests passed, including scaffolding,
  manifests, generated resources, and shared instruction links. Ruff lint/format, shell syntax, and namespacing passed.
- `npm run check`: formatting, TypeScript checks, and 28 workflow/extension tests passed. Tests cover stale evidence,
  subject isolation, shared manifests, gate confirmation races, concurrent updates, malformed/oversized state, path
  safety, persistence, both renderers, focus, dismissal, and owned-handle teardown.
- Pi's native resource loader found all 72 namespaced skills, 53 role guides, and one progress extension, without
  collisions with an unrelated code-review skill. Discovery passed in the checkout and a relocated 498-file npm tarball.
- Isolated offline tmux smoke checks passed in regular and fullscreen Pi: widget and panel display, continued typing,
  narrow/wide resizing, hide/show, and reload. These checks used temporary settings and no model calls or copied
  credentials.
- Independent QA ran through the installed subagent runner using the bundled QA role. Its findings drove regression
  tests; a runner result alone never approves a game workflow run. This verifies contributor review delegation, not
  every game-team workflow.
- Static review covered all 125 shared skill/role files. Every file retains its host-guide bridge and unchanged
  frontmatter. Generated entry points are current; stale sidebar and terminal-context-meter claims were corrected.

The first [hosted run](https://github.com/kessriga/game-studio/actions/runs/34269331021) passed on Linux and macOS.
Windows failed because Git converted the formatter's inputs to CRLF. A fresh checkout with `.gitattributes` reproduced
and fixed all 11 formatting failures locally. [PR #18](https://github.com/kessriga/game-studio/pull/18) carries the
current hosted results. Claude and Codex native validators could not be rerun because neither CLI is on PATH in this
environment. Earlier evidence is retained below.

## Earlier verification: 2026-09-05

- `just gate`: 112 existing shell assertions and 13 Python test methods passed, including all engine choices, reruns,
  legacy guides, path conflicts, symlinks, and a relocated plugin directory. Ruff lint/format, shell syntax,
  namespacing, manifest consistency, and shared instruction checks passed.
- Codex CLI 0.153.4: `scripts/check-codex.py` observed all 72 namespaced skills through the native plugin reader and
  verified their host-guide paths. It observed no Codex hooks. This check did not install the plugin or run a model.
- The Codex plugin validator passed. Claude's manifest validator passed, with its expected advisory that plugin-root
  CLAUDE.md is contributor context and does not supply instructions to installed game projects.
- The branding audit found no old product name in current public docs, skills, templates, QA guidance, manifests, or
  hooks. Both public catalogs list all 72 skills. New local documentation links resolve, and the 125 skill/role
  frontmatter blocks are unchanged by the documentation cleanup.

- Hosted CI passed on Linux, macOS, and Windows after the documentation audit at `3e2487c`: see the
  [successful run](https://github.com/kessriga/game-studio/actions/runs/33966091128). The Windows checks use explicit
  UTF-8 and the absolute Git Bash executable found on PATH, avoiding Windows native process search selecting WSL Bash.
  Encoding lint now runs explicitly to prevent locale-dependent text reads.

## Limits of verification

- Conversational execution of all 72 skills, full game-team orchestration, and engine builds have not been exercised end
  to end. Role prompts and explicit checks do not imply automatic hook parity with Claude Code.
- The progress store verifies files and recorded decisions, not document quality, test truth, or the completeness of an
  unrecorded story scope. The user must inspect evidence and confirm scope. This is not a tamper-proof audit log.
- Power-loss recovery, adversarial filesystem races, real RPC approval clients, and compatibility with every installed
  UI extension remain unverified.
- The standalone skill-creator helper rejects the retained Claude extension fields (and OpenSpec's compatibility field).
  The plugin validator and Codex's actual plugin reader accept the shared files. Removing those fields would discard
  Claude tool and model configuration.
- Backlog.md, OpenSpec, and engines must be available separately for workflows that require them. No integrations or
  global settings were installed here.

## Recent changes

- 0.3.0 (unreleased): Pi packaging, namespaced skill entry points, installed-runner delegation guidance, persistent
  workflow progress, compact widget and side overlay, native/packed checks, and shared documentation updates.
- 0.2.0: added Codex discovery, shared project guidance, portable scaffolding, host-aware workflows, explicit stage
  reporting, and the repository gate. Unified the Game Studio name and updated shared workflows, QA guidance, catalog
  counts, and host-specific documentation.
- Earlier releases established Claude plugin packaging, model tiers, and the guard that keeps hooks out of unrelated
  repositories.

# Implementation status

## Current implementation: 0.4.1 (unreleased)

- Shared Markdown workflows and roles are host-neutral; Pi is the only packaged integration.
- All 72 skills and 53 roles retain identity metadata, host-guide links, domain responsibilities, arguments, routing,
  review modes, and evidence requirements. Runtime permission/model metadata is removed.
- Fresh scaffolds use canonical root/nested AGENTS.md, `docs/technical-preferences.md`, and eleven explicitly loaded
  `docs/rules/` files. All five engine choices preserve existing files and preflight conflicts.
- Legacy configuration blocks before writes until a [reviewed migration](docs/migration-0.4.md) preserves user data.
  There is no normal-workflow fallback to legacy preferences.
- Stage/project detection uses cwd only. Pi retains its generated entry points, progress state, evidence fingerprints,
  user approvals, scope confirmations, widget and noncapturing overlay.
- Workflow submission can bind catalog checks and evidence to a registered nested worktree of the same repository. User
  approval checks source identity and hashes through both prompts. Explicit post-merge handoff preserves reviewed
  provenance, requires matching canonical hashes, and reopens repeatable scope without copying files or changing stage.
- Safety checks and session handoffs are explicit; no validation, notification, or audit hooks ship.

## Worktree evidence fix validation

Local macOS checks against the uncommitted 0.4.1 worktree:

- The focused real-Git regression failed before the fix: a source-only concept could not submit because the coordinator
  had zero matching catalog artifacts. It passes after the fix. Initial missing dependencies and an incorrect fixture
  step name were corrected before this red result; they are not bug evidence.
- Focused workflow and extension checks pass: 55 tests. New cases use temporary Git repositories and worktrees with
  spaces, local author configuration, and disabled fixture hooks/signing. They cover source-only and stale coordinator
  files, blocked-run submission, both approval prompts, state/source switches, restart, removed and recreated sources,
  unrelated and unregistered checkouts, inherited Git overrides, unsafe paths, symlinks, size limits, legacy records,
  matching-only handoff after removal, and mixed-source repeatable and aggregate scope.
- Same-session self-review checked source provenance, prompt-to-lock validation, catalog coverage, duplicate counts, and
  UI source labels. This is not independent review. Named Fable skills and a dedicated LSP tool were unavailable; the
  work used think/act/prove and an explicit self-judge pass. Automatic TypeScript diagnostics reported no errors.
- Independent review caught two aggregate scope gaps despite the earlier passing gates: differing subject copies could
  pass with identical manifests, and one source's manifest could satisfy another source's missing manifest. The fix
  checks conflicts across run and aggregate evidence and requires aggregate artifacts in every effective source. Five
  new regressions failed before the fix and pass afterwards, including coordinator/worktree combinations, previously
  saved false-positive approvals, and manifest removal after approval. Both independent reproduction probes now reject
  scope.
- Targeted independent recheck found both aggregate fixes correct, with no remaining findings. The parent independently
  reran both original probes (both reject), the full shell/Python gate (57 assertions and 17 tests), and the npm gate
  (63 tests, native discovery, and 485-file relocated discovery). Primary LSP checks reported zero diagnostics in all
  six changed TypeScript files. The lens diagnostics cache was unavailable; no broader scanner pass is claimed.
- `just --set python .venv/bin/python gate` passed: 57 shell assertions and 17 Python tests, with namespacing, generated
  drift, Ruff, shell syntax, and diff checks. The assumed main-checkout interpreter was absent; an approved
  worktree-local virtual environment supplied the existing requirements. That setup failure was not a code regression.
- `npm run check` passed after the review fixes: formatting, types, 63 tests, native discovery of 72 skills and 53 roles
  plus one extension, and relocated discovery from a 485-file package. Changed Markdown was formatted with
  `rumdl fmt --no-cache --enable MD013`; the diff was reviewed.
- Hosted [run 34394798811](https://github.com/kessriga/game-studio/actions/runs/34394798811) at `d416803` passed on
  Linux and macOS. Windows passed the shell/Python gate but failed one of 63 TypeScript tests: the source-disclosure
  assertion compared a slash-separated fixture path with the correctly displayed native Windows path. The corrected test
  checks the full canonical directory and its rendered boundary, not just the basename. A deterministic Windows-style
  probe through the actual text renderer and the focused local test pass. Production path/security checks are unchanged;
  corrected hosted results must be checked at the exact [PR head](https://github.com/kessriga/game-studio/pull/21).
- No real interactive UI smoke, RPC client, conversational game workflow, engine build, or package installation was run.
  No release was made.
- Checkout identity uses local paths and filesystem identity. Moving or recreating checkouts requires fresh review;
  sibling worktrees are not supported. Adversarial filesystem races and power-loss recovery remain unverified.

## Migration validation

Local macOS checks on 2026-09-09 against the uncommitted 0.4.0 worktree:

- `just gate` passed using the local virtual environment: 57 shell assertions and 17 Python test methods, including all
  five engine selections, reruns, custom data/worktree preservation, legacy conflicts and dangling links, cwd-only
  detection, relocated paths with spaces, shared identity/routing, and generated drift checks.
- `npm run check` passed: formatting, TypeScript types, 34 tests, native discovery of 72 skills and 53 role guides plus
  one extension, and relocated discovery from a 484-file npm tarball.
- Changed Markdown was formatted with `rumdl fmt --no-cache --enable MD013`; source paths and local links were
  inventoried. Template placeholders and the optional patch-notes-template probe are not required files.
- Validation caught and corrected an inverted negative Pi-command assertion, one wrapped legacy delegation reference,
  and an overly broad legacy symlink guard. These failed intermediate checks are not passing evidence.
- Review fixes allow architecture write approvals in chat while retaining drafts, labeled choices, and grouped
  multi-file approval. Onboarding asks for the concept in ordinary chat. Audio, narrative, and polish teams output
  missing-argument usage directly without follow-up questions or delegation; their QA assertions match.
- After these prose fixes, both full gates passed again with the counts above. Targeted `rumdl fmt` changed only the
  edited paragraphs. Targeted `rumdl check --no-cache --enable MD013` still reports two pre-existing long lines in
  `skills/architecture-review/SKILL.md` and `qa/skills/team/team-narrative.md`; no clean Markdown-lint pass is claimed.
- Independent review passed after the architecture-approval and chat-guidance fixes; the recheck found no remaining
  findings. The parent independently reran both full gates with the counts above and verified that the tree did not
  change during validation. Primary language-server checks reported no errors in eight changed source files.
- Earlier results below do not verify 0.4.0. No current hosted CI, conversational game workflow, engine build, live
  migration, or interactive UI smoke test was run. No package was published or installed into user settings. The
  migration preserves progress state; stale approvals require new evidence and user approval, not fingerprint rewriting.

## Historical verification (pre-0.4)

The following outcomes, `tasks/todo.md`, backlog records, and archived OpenSpec changes are preserved records of earlier
releases. Their host compatibility, metadata, hook, package-size, and approval claims are not current guarantees. See
the [reversal decision](docs/decisions/host-neutral-layout.md) and migration guidance for stale evidence.

## Command display fix verified on 2026-09-08

- `just --set python .venv/bin/python gate` passed, including 112 shell assertions and 16 Python tests.
- `npm run check` passed: formatting, types, 34 tests, native Pi discovery, and relocated package discovery. The new
  regression failed before the fix and passed afterwards. Tests cover the concept-to-brainstorm mapping, narrow display
  width, commandless steps, and unchanged phase fallback and approval labels.
- TypeScript language-server checks were clean for all three changed source/test files. Claude and Codex native
  validators were unavailable on PATH. No installed package or user settings were changed.

## Pi package verified on 2026-09-08

These are local macOS checks against the unreleased worktree, using Node 22.23.2 and Pi 0.85.1. No package was published
or installed into user settings.

- `just --set python .venv/bin/python gate`: 112 shell assertions and 16 Python tests passed, including scaffolding,
  manifests, generated resources, and shared instruction links. Ruff lint/format, shell syntax, and namespacing passed.
- `npm run check`: formatting, TypeScript checks, and 32 workflow/extension tests passed. Tests cover stale evidence,
  subject isolation, shared manifests, gate confirmation races, concurrent updates, malformed/oversized state, path
  safety, persistence, both renderers, focus, dismissal, and owned-handle teardown.
- PR #18 regression checks reject manifest changes during either scope approval prompt, exclude epic metadata from story
  scope, and keep steps with submitted subjects from displaying as approved.
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

## Historical limits of verification (pre-0.4)

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

## Release history

- 0.4.1 (unreleased): source-bound worktree evidence and explicit verified post-merge handoff.

- 0.4.0 (unreleased): host-neutral layout, explicit checks, reviewed migration, and removal of retired integrations.

- 0.3.1 (unreleased): show catalog commands in Pi's current/next-step labels and side overlay, using Pi skill syntax.
- 0.3.0 (unreleased): Pi packaging, namespaced skill entry points, installed-runner delegation guidance, persistent
  workflow progress, compact widget and side overlay, native/packed checks, and shared documentation updates.
- 0.2.0: added Codex discovery, shared project guidance, portable scaffolding, host-aware workflows, explicit stage
  reporting, and the repository gate. Unified the Game Studio name and updated shared workflows, QA guidance, catalog
  counts, and host-specific documentation.
- Earlier releases established Claude plugin packaging, model tiers, and the guard that keeps hooks out of unrelated
  repositories.

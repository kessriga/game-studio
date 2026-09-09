# Reviewed migration to 0.4

## Retired integrations

Version 0.4 removes Claude Code and Codex integrations, manifests, marketplace registrations, Claude hooks, contributor
settings, and bundled `CLAUDE.md` import shims. Pi remains supported. This is not an automatic uninstall: existing users
must review and disable their old host registrations using that host's own controls. Game Studio does not modify host
settings or delete installed caches. Historical records describe older releases, not current support.

## Preserve project data first

Stop before running start or setup-engine on an old layout. Back up the game repository, including untracked and ignored
files. Inspect `.claude/docs/technical-preferences.md`, `.claude/rules/`, all `CLAUDE.md` guides, `AGENTS.md`, and any
existing neutral destinations. Do not traverse symlinks or bulk-delete `.claude/`: it can contain settings, unrelated
data, and user worktrees.

1. Show a migration plan and obtain approval for unresolved choices. Compare legacy preferences with
   `docs/technical-preferences.md` if it exists. Preserve the configured engine, pinned version, naming conventions,
   budgets, testing choices, and custom sections; never fill over these with defaults.
2. If the destination is absent, move the reviewed preference file byte-for-byte to `docs/technical-preferences.md`.
   Move reviewed rules to `docs/rules/` without changing their bytes. If either destination exists, compare each
   conflicting file and agree on a merge. Keep a backup of both originals outside the active legacy locations. Preserve
   custom rule files, not only the eleven defaults.
3. Review all root and nested guides. Merge meaningful legacy guide content into the corresponding `AGENTS.md` without
   losing existing game or Backlog instructions. Explicitly load neutral preferences, applicable `docs/rules/` path
   patterns, engine references, and nested guides. Update project-local links that pointed at the old locations. An
   import shim is not a replacement for this review.
4. Remove the active legacy preferences/rules only after verifying the copied or merged bytes and approving the result.
   Archive originals elsewhere first. No automatic runtime fallback reads them. Review obsolete host settings and shims
   separately; delete only explicitly approved files, never a whole host directory or any worktree. The scaffold itself
   preserves existing legacy guides/settings.
5. Run the scaffold from outside the package with quoted absolute paths. It preflights legacy preferences and rules
   (including dangling symlinks) and destination conflicts before any writes. While legacy configuration remains, it
   refuses even if neutral copies also exist. Resolve the migration; do not work around the guard by writing default
   preferences manually.
6. Rerun with the configured engine. Missing neutral files are added; existing files are preserved exactly. Review all
   preserved guides and test stage reporting from the game directory. Run the game's checks.

## Existing evidence and approvals

Keep `production/workflow-state.json` and all evidence. The catalog now names neutral preference paths and Pi commands;
catalog fingerprints can mark previous approvals stale. Do not rewrite fingerprints, copy approvals, or delete state to
make it green. Inspect each affected run, submit current evidence, and ask the user to approve again through the
supported UI. An older approval is historical evidence, not approval of the migration or current artifacts. Backlog and
archived OpenSpec outcomes remain history.

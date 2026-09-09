# Host-neutral layout and retired integrations

Status: accepted for unreleased 0.4.0. Supersedes [Codex compatibility](codex-compatibility.md).

The user chose to remove Claude Code and Codex integrations rather than maintain their runtime contracts. Shared
workflows and roles remain plain Markdown; Pi is the sole packaged integration. Project guidance is canonical in
AGENTS.md, preferences in `docs/technical-preferences.md`, and explicitly loaded rules in `docs/rules/`. Frontmatter
describes identity, not tools, models, or permissions.

Remove manifests, marketplaces, hooks, import shims, and contributor host settings. Preserve their safety intent as
explicit checks, not a replacement hook system. Existing game files and worktrees are never deleted by scaffolding.
Legacy preferences and rules block scaffolding until a reviewed migration preserves or merges user data. There is no
runtime fallback to the old layout.

Historical decisions, archived tasks, and verification outcomes remain evidence of earlier releases, not current
requirements. The [migration guide](../migration-0.4.md) covers retained data and stale Pi evidence. Conversational
workflows and independent review still require actual runtime capabilities; plain role prose cannot grant permissions or
prove checks ran.

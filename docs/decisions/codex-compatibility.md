# Share gamedev workflows between Claude Code and Codex

> Historical decision, superseded for 0.4.0 by [host-neutral layout](host-neutral-layout.md). The original rationale and
> outcomes below are retained, not current instructions.

The repository originally exposed only Claude's manifest, model tiers, tool names, and hooks. The user requested an
installable Codex plugin while continuing to use the project as a game-development framework.

Keep a single set of skills, roles, framework docs, and templates. Add a Codex manifest and repository marketplace
pointing to the existing plugin root. Each skill and role links to a common host guide. This avoids maintaining a second
copy of 125 workflows that could disagree with the original after an edit.

Project instructions live in AGENTS.md, with CLAUDE.md importing the shared file. The same applies to nested project
guides and contributor instructions. Keep existing `.claude/docs/technical-preferences.md` and rule paths because
workflows and stage detection already use them; the folder name does not make the data Claude-only. Scaffolding adds
missing files with exclusive creation, reports preserved guides, and leaves semantic migration to a reviewed skill step.

Move Claude's hook configuration away from `hooks/hooks.json`, which Codex would discover automatically. Register it
explicitly in the Claude manifest. This release offers explicit Codex checks rather than claiming compatibility between
different event payloads and session lifecycle behavior. Codex role files are prompts rather than registered custom
agent configurations; unavailable independent review must remain visibly unverified.

The installed Codex CLI is the evidence for skill discovery, alongside both manifest validators. Portable regression
tests cover scaffold selection, reruns, user-file preservation, hook isolation, shared guides, and workflow coverage.
The native reader check is separate because CI need not install an AI CLI or have account access. See the retired
`docs/codex.md` guide (in pre-0.4 history) for official references and commands, and [STATUS.md](../../STATUS.md) for
validation limits.

# Use Game Studio in Codex

Install the same repository as a Codex plugin. It provides 72 skills and 53
specialist role guides. Python 3 and Bash are required for scaffolding and stage
reporting; Git Bash supplies Bash on Windows. Use forward slashes in paths
passed to Bash, including absolute paths such as `C:/projects/my-game`.

## Install from a checkout

Use a Codex version whose `codex plugin --help` lists `marketplace` and `add`.
The plugin reader was checked with Codex CLI 0.153.4.

From the root of this repository:

```sh
codex plugin marketplace add ./
codex plugin add gamedev@game-studio
```

Open a new Codex session in your **game repository**. Select `gamedev:start` from
`/skills`, type `$gamedev:start`, or ask “Use gamedev's start skill.” Start adds
missing project files and walks you through engine selection and the next step.
It preserves existing files and explains any older instructions that need merging.

If your client has a plugin browser, select the Game Studio marketplace and
install gamedev there. The repository catalog lives at
`.agents/plugins/marketplace.json`; its `./` source is the repository root.

Once the Codex-compatible release is on main, a remote install uses:

```sh
codex plugin marketplace add kessriga/game-studio
codex plugin add gamedev@game-studio
```

## Use the workflows

| Shared skill name | Codex skill mention |
|-------------------------------|--------------------|
| `gamedev:start` | `$gamedev:start` |
| `gamedev:help` | `$gamedev:help` |
| `gamedev:status` | `$gamedev:status` |
| `gamedev:brainstorm cozy farming` | `$gamedev:brainstorm cozy farming` |
| `gamedev:dev-story TASK-12` | `$gamedev:dev-story TASK-12` |

Every skill loads [the host guide](host-runtime.md). It explains tool mappings,
argument parsing, model choice, delegation, and checks. The shared workflow
catalog uses skill names; choose the matching Codex skill. Existing
`/gamedev:<skill>` references in workflows mean the same skill in your host.

Root and nested `AGENTS.md` files carry project instructions. Each `CLAUDE.md`
imports its sibling guide. Codex reads the shared files directly. Engine settings
and rule files keep their existing `.claude/` paths so both hosts use the same
project data. Codex reads the applicable rules explicitly.

## What differs

| Capability | Codex behavior |
|------------|----------------|
| Skills and document templates | Same workflows and source files |
| Specialist agents | Role prompts passed to available Codex subagents, or explicit sequential role passes |
| Claude model tiers | Codex uses its configured model; no Claude model IDs are sent |
| Claude hooks, notifications, agent audit logs | Not registered in Codex; skills require explicit checks and handoffs |
| Path-scoped Claude rules | Read according to their path patterns before editing |
| Backlog.md and OpenSpec | Separate optional integrations; required by their respective workflows |

A sequential role pass is self-review. If a check requires an independent
reviewer and no subagents are available, it remains unverified. A plugin cannot
supply engine installations, credentials, tracker access, or a running game.

## Check or update a local copy

```sh
python3 scripts/check-codex.py
```

This calls Codex's plugin reader and checks all 72 discovered skills and their
host-guide paths. It installs nothing and runs no model turn. Codex needs access
to its local runtime database for this check. `just gate` runs the portable
repository checks without requiring either AI CLI.

Codex installs a cached copy. Editing this checkout does not prove the installed
copy changed. For development updates, refresh the configured marketplace,
remove and add the plugin, then start a new session:

```sh
codex plugin marketplace upgrade game-studio
codex plugin remove gamedev@game-studio
codex plugin add gamedev@game-studio
```

Keep version numbers in both host manifests and the Claude marketplace aligned.
After removing a plugin, check that the add command succeeds before trying its
skills in a new session.

## References

- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)
  defines manifests, marketplace paths, and automatic hook discovery.
- [Codex skills](https://developers.openai.com/codex/skills) describes skill
  discovery and invocation.
- [Codex AGENTS.md guidance](https://developers.openai.com/codex/guides/agents-md)
  describes project instruction loading.
- [Claude project memory](https://code.claude.com/docs/en/memory) documents the
  `@AGENTS.md` import used by this project.

# Use Game Studio in Claude Code

The shared workflows live in `skills/`, and the specialist definitions live in
`agents/`. This guide covers the configuration that Claude Code uses to run
them. For the shared delegation rules, read [coordination-rules.md](coordination-rules.md).
For the other supported host, read [Codex setup](codex.md).

## Installation

Use Claude Code with plugin support. The manifest validator was checked with
version 2.1.226. Git, Python 3, and Bash are required by the plugin's workflows;
see [setup requirements](setup-requirements.md) for optional hook tools.

Inside Claude Code:

```text
/plugin marketplace add kessriga/game-studio
/plugin install gamedev@game-studio
```

Open a new session in your game repository and run `/gamedev:start`.
Invoke other skills as `/gamedev:<name>`, with arguments after the name.
Registered subagent types use `gamedev:<role>`.

For development, from a plugin checkout:

```sh
claude plugin marketplace add ./
claude plugin install gamedev@game-studio
```

## Project instructions and hooks

The start skill creates shared `AGENTS.md` files and sibling `CLAUDE.md` files
that import them with `@AGENTS.md`. Keep project instructions in the shared
guides. Claude Code loads matching `.claude/rules/` files automatically.

The Claude manifest registers `hooks/claude-hooks.json`. Its eleven hooks use
`${CLAUDE_PLUGIN_ROOT}` to locate scripts. See [the hook reference](hooks-reference.md)
for events and limits. The contributor hook under `.claude/hooks/` and this
repository's development settings are not installed into game projects.

## Model configuration

The `model` fields below are Claude configuration. They do not select models
or grant tools in Codex. They describe the checked-in metadata, not a guarantee
that a given account can access every model.

### Agent model tiers

| Roles | Frontmatter value |
|-------|-------------------|
| `creative-director`, `technical-director`, `game-designer` | `claude-fable-5` |
| `producer`, `art-director`, `narrative-director`, `audio-director`, `lead-programmer`, `qa-lead`, `release-manager`, `localization-lead`, `ux-designer` | `claude-opus-4-8` |
| Other specialists | `sonnet` |

Leadership entries name specific model versions; specialist entries use an
alias. Organizational tiers describe responsibility and do not map one-to-one
to model assignments.

### Skill model tiers

| Frontmatter value | Workload | Skills |
|-------------------|----------|--------|
| `haiku` | Status, formatting, and focused checks | `/gamedev:help`, `/gamedev:story-readiness`, `/gamedev:scope-check`, `/gamedev:project-stage-detect`, `/gamedev:changelog`, `/gamedev:patch-notes`, `/gamedev:status` |
| `opus` | Cross-document synthesis and phase verdicts | `/gamedev:review-all-gdds`, `/gamedev:architecture-review`, `/gamedev:gate-check` |
| `sonnet` | Other workflows | All remaining skills |

When adding a skill, choose a model according to the workload above. Keep
tool permissions separate: a model alias does not make a workflow read-only.

## Delegation and session controls

Shared workflows may name the Claude `Task` tool when requesting subagents.
Use the host's available delegation tool. Supply the task, inputs, allowed edit
scope, and expected evidence explicitly. Follow the user's delegation policy.

Claude's experimental Agent Teams mode is separate from ordinary subagents.
It uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and multiple sessions. The
plugin does not enable it, and shared workflows do not require it.

For context management, save a checkpoint before using `/clear` or `/compact`.
A focused summary request can name the current task and files already written.
Afterward, read `production/session-state/active.md` to resume. The shared
[context guide](context-management.md) defines what to preserve.

## Updates and release tags

After a versioned release, update the marketplace and plugin, then restart:

```sh
claude plugin marketplace update game-studio
claude plugin update gamedev@game-studio
```

Claude compares the declared plugin version when checking for updates. A merge
without a version bump can leave users on an older installed copy.
Contributors must follow [the shared release checklist](../CONTRIBUTING.md#releasing).
For Claude release tags, validate first with `claude plugin tag . --dry-run`;
after the release is merged and publishing is authorized, use
`claude plugin tag . --push`.

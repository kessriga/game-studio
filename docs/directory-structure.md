# Directory Structure

The skills, agents, and hooks are provided by the installed `gamedev` plugin.
Your project holds only the game and its project-side config, scaffolded by
`/gamedev:start`:

```text
/
├── CLAUDE.md                    # Project config (imports technical-preferences + engine VERSION)
├── .claude/
│   ├── rules/                   # Path-scoped coding standards (scaffolded — plugins can't ship rules)
│   └── docs/
│       └── technical-preferences.md  # Engine, naming, budgets (project-owned)
├── src/                         # Game source code (core, gameplay, ai, networking, ui, tools)
├── assets/                      # Game assets (art, audio, vfx, shaders, data)
├── design/                      # Game design documents (gdd, narrative, levels, balance)
├── docs/                        # Technical documentation (architecture, registries)
│   └── engine-reference/        # Your engine's API snapshot (version-pinned)
├── tests/                       # Test suites (unit, integration, performance, playtest)
├── tools/                       # Build and pipeline tools (ci, build, asset-pipeline)
├── prototypes/                  # Throwaway prototypes (isolated from src/)
└── production/                  # Production management (milestones, releases, QA evidence)
    ├── session-state/           # Ephemeral session state (active.md — gitignored)
    └── session-logs/            # Session audit trail (gitignored)
```

> The plugin itself (skills, agents, hooks, framework docs, scaffold templates)
> lives in the install location, not in your project. See the repository README
> for the plugin's own layout.

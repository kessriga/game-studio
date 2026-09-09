# Directory structure

The installed Game Studio package provides `skills/`, specialist `agents/`, framework `docs/`, Pi integration, and
scaffold `templates/`. See [AGENTS.md](../AGENTS.md) and [Pi setup](pi.md). Project paths are separate from package
paths; configure games only in their own repositories.

`/skill:gamedev-start` adds missing project files without replacing existing data:

```text
AGENTS.md                         # Canonical instructions and explicit sources to read
src/                              # Game source, with nested AGENTS.md
assets/                           # Art, audio, VFX, shaders, data
design/                           # GDDs, narrative, levels, balance, registries, nested AGENTS.md
docs/AGENTS.md                    # Technical documentation guide
docs/technical-preferences.md     # Engine, version, naming, budgets
docs/rules/                       # Eleven explicit path-scoped rule files
docs/engine-reference/            # Only the chosen engine's snapshot (none when undecided)
docs/architecture/                # Architecture, ADRs and technical requirement registry
docs/registry/                    # Shared architecture facts
tests/                            # Unit, integration, performance, playtest
tools/                            # Build, CI and asset pipeline
prototypes/                       # Throwaway experiments isolated from src/
production/                       # Milestones, releases, QA, workflow progress and handoffs
```

Existing session logs and state remain user data. Nothing archives or deletes them automatically. See
[reviewed migration](migration-0.4.md) for older layouts; the scaffold creates no host files.

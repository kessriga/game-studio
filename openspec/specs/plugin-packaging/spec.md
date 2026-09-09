# Package distribution specification

Supersedes the former host-plugin contract for 0.4.0; see
[the decision](../../../docs/decisions/host-neutral-layout.md). Archived task outcomes are unchanged.

## Requirements

- Game Studio SHALL ship shared `skills/`, role `agents/`, framework `docs/`, `templates/`, and `bin/`, plus the Pi
  package integration. Shared frontmatter SHALL contain only bare `name` and `description`.
- Pi SHALL discover 72 generated namespaced skill entry points linked to the shared sources and one progress extension.
  Roles SHALL be passed through an available authorized runner, not auto-registered.
- Logical identifiers SHALL use `gamedev:<name>`; runnable Pi examples SHALL use `/skill:gamedev-<name>`.
- Framework paths SHALL resolve relative to the source skill or role, independently of cwd and install path. Game
  preferences SHALL remain project-relative at `docs/technical-preferences.md`.
- Package and lock versions SHALL agree. Packed resources SHALL include neutral preferences and all eleven rules and
  SHALL exclude retired host integrations, shims, hooks, and contributor artifacts.

## Acceptance scenarios

- Native and relocated packed discovery find the same skills and extension from paths with spaces.
- All shared source links resolve; generated resources pass drift checks.
- Fresh packed scaffolding produces no host-specific resources or settings.

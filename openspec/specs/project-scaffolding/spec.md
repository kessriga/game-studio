# Project scaffolding specification

Supersedes the former host-layout contract for 0.4.0; see [reviewed migration](../../../docs/migration-0.4.md). Archived
outcomes remain historical.

## Requirements

- Start SHALL obtain consent unless already authorized, then add root/nested AGENTS.md guides,
  `docs/technical-preferences.md`, eleven `docs/rules/` files, and the shared project tree.
- Sources SHALL live under package `templates/`. Godot, Unity, Unreal, Bevy, and undecided selection SHALL copy only the
  selected engine references, with no engine snapshot for undecided.
- Existing files SHALL remain byte-identical on reruns. Missing files SHALL be added and preserved guides reported for
  review; settings and unrelated data SHALL not be modified.
- Legacy preferences/rules SHALL block before any writes, including when neutral destinations exist. A reviewed
  migration SHALL preserve or explicitly merge custom data, never silently replace it with defaults.
- Symlinks and destination type conflicts SHALL fail preflight before any copy. Fresh scaffolds SHALL contain no
  host-specific files. No fallback SHALL read retired preferences during normal workflows.

## Acceptance scenarios

- All five selections work from external directories and relocated package paths containing spaces.
- Reruns preserve custom settings/rules and add only missing files.
- Legacy, conflict, and symlink fixtures preserve existing data and create no partial scaffold.

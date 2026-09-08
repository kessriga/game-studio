---
name: gamedev-consistency-check
description: "Scan all GDDs against the entity registry to detect cross-document inconsistencies: same entity with different stats, same item with different values, same formula with different variables. Grep-first approach — reads registry then targets only conflicting GDD sections rather than full document reads."
---

# Game Studio: consistency-check

Read [the host guide](../../docs/host-runtime.md), then read and follow
[the shared workflow](../../skills/consistency-check/SKILL.md).

Resolve the workflow's relative paths from its own directory, not this entry point. Use the text after this command as
the workflow's arguments.

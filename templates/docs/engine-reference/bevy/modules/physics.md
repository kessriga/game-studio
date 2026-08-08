# Bevy Physics — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## Important: physics is NOT first-party

Bevy core ships **no physics engine**. Do not recall a `bevy::physics` API from
memory — there isn't one. Pick a community crate and pin it to the Bevy minor.
Bevy provides only `Transform`, math (`Vec2`/`Vec3`/`Quat` via glam), and simple
gizmo/ray helpers.

## Mainstream choices (2026)

| Crate | Kind | Notes |
|-------|------|-------|
| **Avian** (`avian2d` / `avian3d`) | ECS-native rigid body | Bevy-idiomatic (components/systems), actively tracks Bevy releases. Common default. |
| **bevy_rapier** (`bevy_rapier2d` / `3d`) | Rapier wrapper | Mature, battle-tested; wraps the Rapier engine. |

Choose one and record it as an ADR + in `technical-preferences.md` Allowed
Libraries. Do not mix two physics backends.

## Typical Avian setup (illustrative — verify against the crate's docs)

```rust
app.add_plugins(PhysicsPlugins::default());

commands.spawn((
    RigidBody::Dynamic,
    Collider::capsule(0.4, 1.0),
    Transform::from_xyz(0.0, 5.0, 0.0),
));
```

- Run gameplay physics in `FixedUpdate` for determinism.
- Read collisions via the crate's collision events/components (names differ per
  crate — check its docs, don't assume).

## Determinism & testing

- Fixed timestep + a single backend is the baseline for reproducible sims.
- Unit-test *gameplay rules* that consume physics results (e.g. "damage on
  collision") by feeding synthetic collision events, headless, rather than
  simulating the solver.

## Version caution

Ecosystem physics crates lag new Bevy minors by days-to-weeks. When bumping
Bevy, confirm the physics crate has a matching release **before** upgrading.

## Sources
- Avian: https://github.com/Jondolf/avian
- bevy_rapier: https://github.com/dimforge/bevy_rapier
- Bevy 0.19 notes: https://bevy.org/news/bevy-0-19/

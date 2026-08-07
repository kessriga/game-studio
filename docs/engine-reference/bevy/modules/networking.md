# Bevy Networking — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## Important: networking is NOT first-party

Bevy core ships **no netcode**. There is no `bevy::net` replication API — do not
recall one from memory. Multiplayer is provided by community crates. Pick one,
pin it to the Bevy minor, and capture the choice in an ADR.

## Mainstream choices (2026)

| Crate | Model | Notes |
|-------|-------|-------|
| **Lightyear** | Client/server replication, prediction, rollback | Full-featured; components/systems for state replication and client-side prediction. |
| **bevy_replicon** | Server-authoritative component replication | Lighter, replicates ECS components; pair with a transport. |
| **Renet / `bevy_renet`** | Reliable UDP transport | Lower-level channels; often the transport under a higher-level crate. |

Do not combine two replication frameworks. Match the crate's transport to your
platform (native UDP vs WebTransport for web/WASM builds).

## Architecture guidance

- **Server-authoritative** by default: the server owns simulation; clients send
  intent and render replicated state. This is also the project's security stance
  (see the security-engineer's anti-cheat rules).
- Keep replicated state in small, `Reflect`-able components; replication crates
  key off component types.
- Run simulation in `FixedUpdate` so client prediction and server reconciliation
  share a timestep.

## Testing

- Netcode is Integration-tier: test with a documented multi-instance harness
  (headless server + client apps) or a documented playtest, per the project's
  testing standards. Determinism (fixed step, no wall-clock in sim) is a
  precondition for reproducible network tests.

## Version caution

Networking crates track Bevy closely but not instantly; confirm a matching
release before bumping the Bevy minor.

## Sources
- Lightyear: https://github.com/cBournhonesque/lightyear
- bevy_replicon: https://crates.io/crates/bevy_replicon (repo: https://github.com/simgine/bevy_replicon)
- bevy_renet: https://github.com/lucaspoffo/renet

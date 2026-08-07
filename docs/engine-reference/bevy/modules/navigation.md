# Bevy Navigation / Pathfinding — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## Important: navigation is NOT first-party

Bevy core ships **no navmesh or pathfinding**. There is no `bevy::navigation`
API — do not recall one from memory. Use a community crate or a plain graph
search over your own grid.

## Mainstream choices (2026)

| Approach | Crate / method | When |
|----------|----------------|------|
| Navmesh + agents | **`bevy_landmass`** (wraps the `landmass` nav library) | 3D/2D navmesh steering for many agents |
| Navmesh generation | **`oxidized_navigation`** (Recast-style) | Bake navmeshes from level geometry |
| Grid pathfinding | **`pathfinding`** crate (A*, Dijkstra) over your tiles | Tile/grid games; no navmesh needed |
| Steering only | Hand-written boids/steering systems | Simple flocking/seek behaviors |

Pick per game type; record the choice as an ADR. Grid A* via the `pathfinding`
crate is the simplest and fully testable option for tile-based games.

## Grid A* pattern (testable, no Bevy dependency in the algorithm)

```rust
use pathfinding::prelude::astar;

// successors + heuristic over your own grid types; keep this pure
let result = astar(&start, |p| neighbors(p), |p| p.dist(&goal), |p| *p == goal);
```

Keeping the search in pure Rust (no `World`/`Commands`) makes it unit-testable
and reusable; a Bevy system just calls it and writes the path to a component.

## Integration guidance

- Store computed paths as components; advance along them in a movement system.
- Recompute paths on demand (target moved, obstacle changed), not every frame.

## Testing

- Pathfinding is Logic-tier: unit-test the pure search (known grid → expected
  path) deterministically. Agent steering *feel* is Visual/Feel evidence.

## Sources
- pathfinding crate: https://docs.rs/pathfinding
- bevy_landmass: https://github.com/andriyDev/landmass
- oxidized_navigation: https://github.com/TheGrimsey/oxidized_navigation

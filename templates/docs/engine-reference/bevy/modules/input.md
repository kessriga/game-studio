# Bevy Input — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## What changed since ~0.17 (LLM cutoff)

- `bevy_input_focus` moved into the **`ui_api`** feature collection.
- `bevy_picking` no longer bundles input-focus; enable **`ui_picking`** for UI
  hit-testing.
- Some input sources are feature-flagged (0.18) — check your `Cargo.toml`
  feature set if a device type seems missing.
- Text entry is handled by the UI **`EditableText`** component, not by reading
  raw keyboard events (see `ui.md`).

## Core resources & events

Input is first-party. Poll resources in systems:

```rust
fn move_player(
    keys: Res<ButtonInput<KeyCode>>,
    pads: Query<&Gamepad>,
    mut q: Query<&mut Transform, With<Player>>,
) {
    let mut dir = Vec2::ZERO;
    if keys.pressed(KeyCode::KeyW) { dir.y += 1.0; }
    if keys.pressed(KeyCode::KeyS) { dir.y -= 1.0; }
    // gamepad axes/buttons via the Gamepad component
}
```

- Keyboard: `ButtonInput<KeyCode>` (`pressed` / `just_pressed` / `just_released`).
- Mouse: `ButtonInput<MouseButton>`, plus `MouseMotion` / `MouseWheel` events.
- Gamepad: a **`Gamepad` component per connected pad** (entity-based) exposing
  buttons and axes; connection changes arrive as events.
- Touch: `Touches` resource.

## Recommended pattern

- Map raw inputs to intent in one system, write an `Action`/intent component or
  event, and let gameplay systems read intent — keeps rebinding and testing
  simple.
- For richer binding/abstraction, community crates (e.g. `leafwing-input-manager`)
  layer on top; pin one matching the Bevy minor.

## Testing

- Input-driven logic tests: construct the input resource
  (`ButtonInput`/`Touches`), insert it, run the system, assert on resulting
  state — all headless with `MinimalPlugins`.

## Sources
- API docs: https://docs.rs/bevy/0.19/bevy/input/
- Migration: https://bevy.org/learn/migration-guides/0-18-to-0-19/

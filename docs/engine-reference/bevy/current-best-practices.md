# Bevy — Current Best Practices (0.19)

Last verified: 2026-08-07 | Engine: Bevy 0.19

Patterns that are new or changed since the model's likely knowledge (~0.17).
Prefer these over remembered ≤0.17 idioms.

## App & plugin structure

- Compose the game from `Plugin`s; one plugin per feature/system, added via
  `app.add_plugins(...)`. Keep `main.rs` to plugin wiring + `.run()`.
- Persistent config uses `SettingsPlugin` with
  `#[derive(Resource, SettingsGroup, Reflect)]`.
- Schedules: `Startup` (once), `Update` (per frame), `FixedUpdate` (fixed step
  for gameplay/physics). Render work lives in the `Core2d` / `Core3d` schedules.

## ECS

- **Resources are components** (0.19). Usually transparent via `Res`/`ResMut`,
  but avoid unfiltered wide queries that can now overlap resource storage.
- **Observers** react to events/component changes and support run conditions:
  `app.add_observer(on_damage.run_if(|p: Res<Paused>| !p.0))`.
- **Required components** replace bundles: deriving `#[require(...)]` on a
  component auto-inserts dependencies. `GlobalTransform` is auto-required by
  `Transform` — never insert it by hand.
- Prefer small, single-purpose systems ordered with explicit
  `.before()`/`.after()` or system sets over one large system.
- `commands.delayed().secs(1.0).spawn(...)` schedules deferred work without a
  hand-rolled timer.

## Scenes — BSN (Bevy Scene Notation)

- Author scenes in code with the `bsn!` macro and reusable `impl Scene` functions:
  ```rust
  fn player(name: &str) -> impl Scene {
      bsn! { Name(name) Player Health(100) }
  }
  ```
- Supports relationships (`Children [ ... ]`), scene composition (patch one
  scene over another), and asset references. `.bsn` asset files are the
  forward-looking on-disk format; runtime world serialization goes through
  `DynamicWorld::serialize` (formerly `DynamicScene`).
- `#[derive(SceneComponent)]` guarantees a component is present at spawn time.

## Text (Parley)

- `TextFont { font: FontSource, font_size: FontSize }`. Build `FontSource` via
  `handle.into()` or semantic categories (`FontSource::SansSerif`,
  `::Monospace`) with variable weight/width/style.
- Responsive sizing: `FontSize::Px`, `::Rem`, `::Vh`.
- `EditableText` gives native text entry (cursor, selection, clipboard, IME,
  multiline) — use it instead of hand-rolling input capture.

## Rendering

- Custom rendering = ECS systems in `Core2d`/`Core3d`, not a `RenderGraph` node.
- Built-in post-processing components on the camera: `Vignette`,
  `LensDistortion`; `ContactShadows` for near-surface shadow detail.
- Materials now live in `bevy_material`; `Hdr` on `bevy_camera`.
- Debug helpers: `Gizmos` (`cube()`, `text_2d()`), `InfiniteGrid`,
  `TransformGizmo*` components.

## UI

- `bevy_ui` with `Node`-based flexbox layout (border radius is a `Node` field now).
- Widget kit: `bevy_ui_widgets` (stable) and `bevy_feathers` (editor-style
  widgets: text/number input, dropdowns, list view, scrollbars).
- Accessibility: `AccessibleLabel` component; UI integrates AccessKit.

## Testing

- Logic/ECS tests run headless with `MinimalPlugins` (no window, no GPU) — build
  a `World`/`App`, insert components, run the schedule, assert on state. See
  `../../engine-reference/bevy/modules/*` and the test-scaffolding skills.
- Keep gameplay logic in plain systems/functions so it is testable without a
  render context.

## Ecosystem (not first-party)

Physics, networking, and pathfinding are **third-party crates**, not in Bevy
core. Pick and pin them explicitly; see `modules/physics.md`,
`modules/networking.md`, `modules/navigation.md`. Match the crate's Bevy-version
support to the pinned Bevy minor — ecosystem crates lag new Bevy releases.

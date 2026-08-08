# Bevy — Breaking Changes (post-cutoff)

Last verified: 2026-08-07 | Engine: Bevy 0.19

Organized by risk. Every entry is a change the model's training data likely
predates. Consult before writing Bevy code that touches these areas.

## HIGH risk — 0.19 architectural changes

### Resources are now components
Resources are stored as components on dedicated abstract entities.
- `#[derive(Resource)]` now also implements `Component`; do **not** derive both.
- `Res<T>` / `ResMut<T>` access is unchanged in most systems.
- Broad queries can now conflict with resource access. A `Query<()>` or wide
  query may need a `Without<IsResource>` filter to avoid overlap panics.
- Enables hooks, observers, and relationships on resources.

### Render graph is now systems
The trait-based `RenderGraph` architecture is replaced by ECS schedules.
- `ManageViews` split into `CreateViews`, `Specialize`, `PrepareViews`.
- `SortedRenderPhase::add()` split into `add_transient()` / `add_retained()`.
- Custom render phases use change lists (`DirtySpecializations`).
- Custom rendering code from ≤0.18 will not compile — see the 0.18→0.19 guide.

### Text overhaul (cosmic-text → Parley)
- `TextFont { font: Handle<Font>, font_size: f32 }` →
  `TextFont { font: FontSource, font_size: FontSize }`.
- Build with `asset_server.load("f.ttf").into()` and `FontSize::Px(35.0)`
  (also `FontSize::Rem`, `::Vh`).
- `Font::try_from_bytes()` → `Font::from_bytes()` (no longer returns `Result`).
- `TextLayout::new_with_justify()` → `TextLayout::justify()`.

### Scenes: `bevy_scene` → `bevy_world_serialization`
- `Scene` → `WorldAsset`, `DynamicScene` → `DynamicWorld`,
  `SceneRoot` → `WorldAssetRoot`, `SceneSpawner` → `WorldInstanceSpawner`.
- `commands.spawn(SceneRoot(h))` → `commands.spawn(WorldAssetRoot(h))`.
- **BSN (Bevy Scene Notation)** is the new authoring surface: the `bsn!` macro
  and `impl Scene` functions replace verbose spawning. `.bsn` asset files are
  the forward-looking scene format (see `current-best-practices.md`).

### Cargo features are more granular
- `audio` is now an explicit default feature (was implied by `2d`/`3d`/`ui`).
  To drop audio: `default-features = false`, then re-enable `2d`/`3d`/`ui`.
- Feature collections moved: `bevy_window` → `common_api`,
  `bevy_input_focus` → `ui_api`, `custom_cursor` → `default_platform`.
- `experimental_bevy_feathers` → `bevy_feathers` (stable);
  `experimental_ui_widgets` → `bevy_ui_widgets`.
- `bevy_picking` no longer pulls `bevy_input_focus`; use `ui_picking`.

### Crate/type moves (0.19)
- New `bevy_material` crate extracts materials from `bevy_pbr`/`bevy_render`.
- `Hdr`: `bevy_render` → `bevy_camera`.
- `Atmosphere`: `bevy_pbr` → `bevy_light`; now a spawned entity, not a camera field.
- `ScreenSpaceTransmission`: extracted from `Camera3d` into a `bevy_pbr` component.

## HIGH risk — 0.18 required components & removals

- **`GlobalTransform` is auto-required by `Transform`.** Remove manual
  `GlobalTransform` / `TransformBundle` insertions — insert `Transform` alone.
- **`LineHeight`** moved out of `TextFont` into a required component on `Text`,
  `Text2d`, `TextSpan`.
- **`AmbientLight` split**: now a per-camera component; use the
  `GlobalAmbientLight` resource for a world-wide default.
- **`RenderTarget`** moved from a `Camera` field to a separate required component.
- **`BorderRadius`** removed as a component; now a field on `Node`.
- **State transitions**: `set()` triggers `OnEnter`/`OnExit` even for an identical
  state; use `set_if_neq()` for the old "only on change" behavior.
- **Entity events are immutable by default**; target-mutating methods moved to the
  `SetEntityEventTarget` trait.
- **Removed**: `SimpleExecutor`, `Internal` component. `AnimationTarget` split into
  `AnimationTargetId` + `AnimatedBy`.

## MEDIUM risk — renames (0.19)

| Old | New |
|-----|-----|
| `App::insert_non_send_resource()` | `App::insert_non_send()` |
| `World::non_send_resource_mut()` | `World::non_send_mut()` |
| `System::type_id()` | `System::system_type()` |
| `DefaultErrorHandler` | `FallbackErrorHandler` |
| `WgpuSettingsPriority::Compatibility` | `WgpuSettingsPriority::WebGPU` |
| `World::entities_allocator()` | `World::entity_allocator()` |
| `Gizmos::cuboid()` | `Gizmos::cube()` (0.18) |
| `ExecutorKind` enum | `Schedule::set_executor(SingleThreadedExecutor::new())` |

## Notes

- These lists are curated for the training-gap window, not exhaustive. For a full
  accounting run the official migration guide for the exact version jump.

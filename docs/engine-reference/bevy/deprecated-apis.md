# Bevy — Deprecated / Renamed APIs

Last verified: 2026-08-07 | Engine: Bevy 0.19

If an agent suggests any API in the "Don't use" column, replace it with the
"Use instead" column. These are the recalled-from-memory names most likely to be
wrong at 0.19. Bevy renames aggressively across minors — when unsure, check
`docs.rs/bevy/0.19` rather than trusting a remembered name.

## Types

| Don't use | Use instead | Since | Notes |
|-----------|-------------|-------|-------|
| `Scene` | `WorldAsset` | 0.19 | `bevy_scene` → `bevy_world_serialization` |
| `DynamicScene` | `DynamicWorld` | 0.19 | |
| `SceneRoot` | `WorldAssetRoot` | 0.19 | Spawn component |
| `SceneSpawner` | `WorldInstanceSpawner` | 0.19 | |
| `SimpleExecutor` | `SingleThreadedExecutor` | 0.18 | Set via `Schedule::set_executor` |
| `ExecutorKind` (enum) | `Schedule::set_executor(...)` | 0.19 | Enum removed |
| `DefaultErrorHandler` | `FallbackErrorHandler` | 0.19 | |
| `AnimationTarget` | `AnimationTargetId` + `AnimatedBy` | 0.18 | Split into two components |
| `TransformBundle` | `Transform` alone | 0.18 | `GlobalTransform` auto-required |
| `Internal` (component) | — (removed) | 0.18 | No replacement |

## Methods

| Don't use | Use instead | Since | Notes |
|-----------|-------------|-------|-------|
| `Font::try_from_bytes()` | `Font::from_bytes()` | 0.19 | No longer `Result` |
| `TextLayout::new_with_justify()` | `TextLayout::justify()` | 0.19 | |
| `App::insert_non_send_resource()` | `App::insert_non_send()` | 0.19 | |
| `World::non_send_resource_mut()` | `World::non_send_mut()` | 0.19 | |
| `System::type_id()` | `System::system_type()` | 0.19 | |
| `World::entities_allocator()` | `World::entity_allocator()` | 0.19 | |
| `Gizmos::cuboid()` | `Gizmos::cube()` | 0.18 | |

## Fields / construction patterns

| Don't use | Use instead | Since | Notes |
|-----------|-------------|-------|-------|
| `TextFont { font: handle, font_size: 32.0 }` | `TextFont { font: handle.into(), font_size: FontSize::Px(32.0) }` | 0.19 | `FontSource` / `FontSize` |
| `TextFont.line_height` | `LineHeight` required component | 0.18 | Moved out of `TextFont` |
| `Camera.render_target = ...` | `RenderTarget` component | 0.18 | Separate required component |
| `Node`-less `BorderRadius` component | `Node.border_radius` field | 0.18 | |
| Insert `GlobalTransform` manually | Insert `Transform` only | 0.18 | Auto-required |
| `AmbientLight` as global | `GlobalAmbientLight` resource | 0.18 | `AmbientLight` is per-camera now |

## Patterns (not just APIs)

| Deprecated pattern | Use instead | Why |
|--------------------|-------------|-----|
| `#[derive(Resource, Component)]` together | `#[derive(Resource)]` only | Resource implies Component at 0.19 |
| `state.set(x)` expecting no-op on equal | `state.set_if_neq(x)` | `set()` now always fires transitions |
| Verbose `commands.spawn((A, B, Children::spawn(...)))` for scenes | `bsn! { ... }` / `impl Scene` fns | BSN is the 0.19 authoring surface |
| Trait-based custom `RenderGraph` node | Render systems in `Core3d`/`Core2d` schedules | Render-graph-as-systems (0.19) |
| Manual `GlobalTransform` sync | Rely on auto-required `GlobalTransform` | Propagated automatically since 0.18 |

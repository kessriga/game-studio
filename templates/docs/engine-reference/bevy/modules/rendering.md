# Bevy Rendering — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## What changed since ~0.17 (LLM cutoff)

- **Render graph is now ECS systems** (0.19). The trait-based `RenderGraph` is
  gone; render passes are systems in the `Core2d` / `Core3d` schedules. Custom
  rendering written for ≤0.18 will not compile.
- **`bevy_material`** is a new crate holding material machinery formerly in
  `bevy_pbr` / `bevy_render`.
- **`Hdr`** moved `bevy_render` → `bevy_camera`.
- **`Atmosphere`** moved to `bevy_light`, spawned as an entity (not a camera field).
- **`ScreenSpaceTransmission`** extracted from `Camera3d` into a `bevy_pbr` component.
- Perf: GPU work transfers, batched rendering, sparse buffer uploads, GPU
  clustering. Screen-space reflections are physically based; contact shadows added.

## Backend

Bevy renders through **wgpu** (Vulkan / Metal / DX12 / WebGPU / GL fallback).
Shaders are **WGSL** (`.wgsl`). `WgpuSettingsPriority::WebGPU` (renamed from
`Compatibility`) selects the web-friendly path.

## Camera setup (0.19)

```rust
commands.spawn((
    Camera3d::default(),
    Transform::from_xyz(0.0, 6.0, 12.0).looking_at(Vec3::ZERO, Vec3::Y),
    Hdr,                       // now from bevy_camera
    Vignette::default(),       // built-in post-process
));
```

- `RenderTarget` is a separate required component (0.18), not a `Camera` field.
- Post-processing: add `Vignette`, `LensDistortion`, `ContactShadows` to the camera.

## Custom rendering

- Add systems to `Core3d`/`Core2d` schedules instead of implementing a render
  graph node. Sorted phases use `add_transient()` / `add_retained()` and change
  lists (`DirtySpecializations`) rather than the old `add()`.
- For most games, prefer a custom `Material` (via `bevy_material`) over
  hand-written render passes.

## Materials

```rust
// Custom material = derive Material + a WGSL shader
#[derive(Asset, TypePath, AsBindGroup, Clone)]
struct MyMaterial { #[uniform(0)] color: LinearRgba }
impl Material for MyMaterial {
    fn fragment_shader() -> ShaderRef { "shaders/my_material.wgsl".into() }
}
```

## Gotchas

- `Bloom` uses linear color at 0.19 — re-tune thresholds from earlier versions.
- Don't recall `RenderGraph` APIs from memory; they're removed. Consult the
  0.18→0.19 migration guide for any custom-render port.

## Sources
- Release notes: https://bevy.org/news/bevy-0-19/
- Migration: https://bevy.org/learn/migration-guides/0-18-to-0-19/
- wgpu: https://wgpu.rs/

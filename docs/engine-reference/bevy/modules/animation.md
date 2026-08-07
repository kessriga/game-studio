# Bevy Animation — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## What changed since ~0.17 (LLM cutoff)

- **`AnimationTarget` split** into `AnimationTargetId` + `AnimatedBy` components
  (0.18). Code that inserted/queried `AnimationTarget` must move to the two
  new components.
- Animation is driven by the ECS graph via `AnimationPlayer` +
  `AnimationGraph` (blend nodes), unchanged in shape but verify node APIs
  against docs.rs at 0.19.

## Core pieces

- `AnimationClip` — keyframe data (usually imported via glTF).
- `AnimationGraph` — asset describing blend/weight nodes; add clips as nodes.
- `AnimationPlayer` — component on the animated entity that plays graph nodes.
- `AnimationTargetId` / `AnimatedBy` — bind clip curves to the right entities in
  a hierarchy.

```rust
let (graph, idx) = AnimationGraph::from_clip(clip_handle);
let graph_handle = graphs.add(graph);
commands.entity(e).insert(AnimationGraphHandle(graph_handle));
// then player.play(idx).repeat();
```

## glTF workflow

Import rigged/animated models as glTF; Bevy generates the clips and target ids.
Prefer authoring animation in a DCC tool (Blender) and driving blends in Bevy.

## Tweening / procedural

Simple property tweens (UI, camera moves) are often better done with a small
tween crate or hand-written `Time`-driven systems than the animation graph,
which is aimed at skeletal/clip animation.

## Testing

- Animation *curves* and *feel* are Visual/Feel evidence (screenshot/video +
  sign-off). Logic that *selects* an animation state (state machine) is unit
  testable headlessly.

## Sources
- API docs: https://docs.rs/bevy/0.19/bevy/animation/
- Migration: https://bevy.org/learn/migration-guides/0-17-to-0-18/

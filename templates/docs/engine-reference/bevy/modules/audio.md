# Bevy Audio — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## What changed since ~0.17 (LLM cutoff)

- **`audio` is now an explicit default cargo feature** (0.19). Previously it was
  implied by `2d`/`3d`/`ui`. If you build with `default-features = false`, you
  must add `audio` back explicitly or all playback silently no-ops.

## Playback

First-party audio is entity/component based:

```rust
commands.spawn((
    AudioPlayer::new(asset.load("sfx/hit.ogg")),
    PlaybackSettings::DESPAWN,   // auto-despawn one-shots when finished
));
```

- `AudioPlayer` holds the source handle; `PlaybackSettings` controls
  loop/volume/despawn (`ONCE`, `LOOP`, `DESPAWN`, `REMOVE`).
- Control a playing entity via its `AudioSink` component (pause, set volume).
- Spatial audio: add `SpatialListener` to the listener entity and use spatial
  `PlaybackSettings`; positions come from `Transform`.

## Formats

OGG Vorbis is the safe default. FLAC/WAV/MP3 are gated behind their own cargo
features — enable per format if needed.

## Testing

- Audio is a Visual/Feel concern: verify by listening + lead sign-off, not
  headless assertions. Logic *around* audio (when a cue triggers) can be unit
  tested by asserting the trigger system spawns an `AudioPlayer`.

## Ecosystem

For advanced mixing, dynamic music layers, or DSP, community crates (e.g.
`bevy_kira_audio`) replace the built-in backend; pin one matching the Bevy minor.

## Sources
- API docs: https://docs.rs/bevy/0.19/bevy/audio/
- Migration (feature changes): https://bevy.org/learn/migration-guides/0-18-to-0-19/

# Bevy UI — Quick Reference

Last verified: 2026-08-07 | Engine: Bevy 0.19

## What changed since ~0.17 (LLM cutoff)

- **Text overhaul (Parley)**: `TextFont` now holds `FontSource` + `FontSize`
  (see `text`/typography below). `LineHeight` is a required component on `Text`.
- **`BorderRadius`** is a field on `Node`, not a separate component (0.18).
- **`EditableText`** provides native text input (cursor, selection, clipboard,
  IME, multiline).
- Widget kits stabilized: `bevy_ui_widgets` (was `experimental_ui_widgets`) and
  `bevy_feathers` (was `experimental_bevy_feathers`).
- `bevy_input_focus` moved to the `ui_api` feature collection; `bevy_picking` no
  longer pulls it in — use the `ui_picking` feature.

## Layout

`bevy_ui` uses a `Node`-based flexbox model.

```rust
commands.spawn((
    Node {
        width: Val::Percent(100.0),
        height: Val::Px(60.0),
        justify_content: JustifyContent::Center,
        align_items: AlignItems::Center,
        border_radius: BorderRadius::all(Val::Px(8.0)), // field on Node now
        ..default()
    },
    BackgroundColor(Color::srgb(0.1, 0.1, 0.12)),
));
```

## Text

```rust
commands.spawn((
    Text::new("Score"),
    TextFont { font: asset.load("f.ttf").into(), font_size: FontSize::Px(28.0) },
    // LineHeight is auto-required; set explicitly if you need a custom value
));
```

- `FontSource` also supports semantic fonts (`SansSerif`, `Monospace`) and
  variable weight/width/style. `FontSize` supports `Px`, `Rem`, `Vh`.

## Widgets

- `bevy_ui_widgets`: core interactive widgets.
- `bevy_feathers`: editor-style kit — text input, number input, dropdowns,
  disclosure toggles, list view, scrollbars. Ported to BSN.
- Compose UI with BSN (`bsn!` / `impl Scene`) the same way as gameplay scenes.

## Accessibility

- `AccessibleLabel` component separates the label from other a11y properties
  (BSN-composable). Bevy UI integrates **AccessKit** for screen readers.

## Testing UI

- Logic behind UI (state, button handlers) should live in plain systems testable
  with `MinimalPlugins`. Visual layout/appearance is verified by screenshot per
  the project's Visual/UI test-evidence rules, not headless assertions.

## Sources
- Release notes: https://bevy.org/news/bevy-0-19/
- Migration: https://bevy.org/learn/migration-guides/0-18-to-0-19/

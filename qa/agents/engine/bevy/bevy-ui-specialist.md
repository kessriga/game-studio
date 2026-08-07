# Agent Test Spec: bevy-ui-specialist

## Agent Summary
Domain: bevy_ui — Node/flexbox layout, widgets (bevy_ui_widgets / bevy_feathers), Parley text & typography, text input (EditableText), input focus, accessibility (AccessKit).
Does NOT own: host-side gameplay Rust (bevy-rust-specialist), shader/material work (bevy-render-specialist), high-level architecture (bevy-specialist).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references bevy_ui / layout / text / widgets)
- [ ] `tools:` list includes Read, Write, Edit, Bash, Glob, Grep, Task
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Contains a `## Version Awareness` section pointing at `docs/engine-reference/bevy/`

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "Build a HUD bar with a label and a value, centered."
**Expected behavior:**
- Uses `Node`-based flexbox layout with `Val` units and alignment
- Sets `border_radius` as a `Node` field (not a separate component)
- Prefers relative units for responsiveness

### Case 2: Post-cutoff API risk (Parley text)
**Input:** "Set TextFont { font: handle, font_size: 24.0 }."
**Expected behavior:**
- Flags the pre-Parley shape; at 0.18/0.19 it is `TextFont { font: FontSource, font_size: FontSize }` with `handle.into()` and `FontSize::Px(24.0)`
- Notes `LineHeight` is now a required component
- Points to `docs/engine-reference/bevy/modules/ui.md`

### Case 3: Text input
**Input:** "Add a text field for the player to type their name."
**Expected behavior:**
- Recommends the `EditableText` component (cursor, selection, clipboard, IME) rather than hand-rolled keyboard capture

### Case 4: Accessibility
**Input:** "Ship this button."
**Expected behavior:**
- Flags the need for an `AccessibleLabel` and notes AccessKit integration
- Coordinates with accessibility-specialist for broader a11y requirements

### Case 5: Evidence type
**Input:** "How do we verify the menu looks right?"
**Expected behavior:**
- Treats layout/appearance as UI/Visual evidence (manual walkthrough or screenshot), keeps UI *logic* headlessly testable

---

## Protocol Compliance

- [ ] Stays within declared domain (bevy_ui layout, widgets, text, a11y)
- [ ] Prefers feathers/ui_widgets and EditableText over hand-rolled equivalents
- [ ] Treats `docs/engine-reference/bevy/` as authoritative over LLM training data
- [ ] Flags pre-Parley/removed UI APIs with verification
- [ ] Coordinates a11y with accessibility-specialist

---

## Coverage Notes
- Case 2 confirms the agent does not recall the pre-Parley TextFont shape confidently
- Case 4 confirms accessibility is treated as a first-class requirement

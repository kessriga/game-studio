# Agent Test Spec: bevy-render-specialist

## Agent Summary
Domain: Bevy rendering — wgpu pipeline, WGSL shaders, custom materials, render-graph-as-systems, post-processing, render performance.
Does NOT own: host-side gameplay Rust (bevy-rust-specialist), UI (bevy-ui-specialist), high-level architecture (bevy-specialist).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references wgpu / WGSL / materials / render systems)
- [ ] `tools:` list includes Read, Write, Edit, Bash, Glob, Grep, Task
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Contains a `## Version Awareness` section pointing at `docs/engine-reference/bevy/`

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "I need a custom material that tints a texture."
**Expected behavior:**
- Recommends a `Material` impl (`AsBindGroup`) + a WGSL fragment shader over a hand-written render pass
- Shows the material struct and `ShaderRef` wiring; documents the bind group layout

### Case 2: Post-cutoff API risk (render graph)
**Input:** "Add a custom RenderGraph node for my post-process effect."
**Expected behavior:**
- Flags that the trait-based `RenderGraph` was removed at 0.19 (render-graph-as-systems)
- Directs to `docs/engine-reference/bevy/modules/rendering.md` and the 0.18→0.19 migration guide
- Proposes a render system in `Core3d`/`Core2d` or a built-in post-process component instead

### Case 3: Post-cutoff behavior change (Bloom)
**Input:** "Bloom looks wrong after upgrading — thresholds seem off."
**Expected behavior:**
- Notes Bloom uses linear color at 0.19 and thresholds must be re-tuned
- References the rendering module reference

### Case 4: Backend awareness
**Input:** "Will this shader work on the web build?"
**Expected behavior:**
- Notes the WebGPU/compat backend (`WgpuSettingsPriority::WebGPU`) and any features unavailable there
- Recommends testing on the target backend, not just native

### Case 5: Evidence type
**Input:** "How do we verify this shader effect is correct?"
**Expected behavior:**
- Treats render fidelity as Visual evidence (screenshot + art/lead sign-off), not headless assertions

---

## Protocol Compliance

- [ ] Stays within declared domain (render/shader/material)
- [ ] Prefers `Material` over hand-written passes where it suffices
- [ ] Treats `docs/engine-reference/bevy/` as authoritative over LLM training data
- [ ] Flags removed/changed render APIs (RenderGraph, Bloom linear color) with verification
- [ ] Escalates architecture/perf trade-offs to bevy-specialist

---

## Coverage Notes
- Case 2 confirms the agent does not recall the removed RenderGraph API confidently
- Case 5 confirms visual evidence expectations align with the project's testing standards

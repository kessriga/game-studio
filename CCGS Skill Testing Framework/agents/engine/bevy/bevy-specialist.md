# Agent Test Spec: bevy-specialist

## Agent Summary
Domain: Bevy-specific ECS architecture, app/plugin/schedule structure, system ordering, BSN scenes, and the Rust/render/UI boundary; chooses and pins ecosystem crates (physics/networking/navigation).
Does NOT own: actual Rust code authoring (delegates to bevy-rust-specialist), shader/render code (bevy-render-specialist), or UI code (bevy-ui-specialist).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references Bevy ECS / plugin / schedule architecture)
- [ ] `tools:` list includes Read, Write, Edit, Bash, Glob, Grep, Task
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Agent definition references `docs/engine-reference/bevy/VERSION.md` as the authoritative API source
- [ ] Contains a `## Version Awareness` section pointing at `docs/engine-reference/bevy/`

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "Should this new feature be one system or a plugin, and where does its state live?"
**Expected behavior:**
- Produces an architecture recommendation: a `Plugin` per feature, systems placed in the right schedule (`Update` vs `FixedUpdate`), state split into components/resources/events
- Explains rationale and trade-offs
- Does NOT write the full Rust implementation — defers code authoring to `bevy-rust-specialist`

### Case 2: Wrong-engine redirect
**Input:** "Add an @onready var and connect a Godot signal for this."
**Expected behavior:**
- Does NOT produce Godot code
- Identifies this as a Godot pattern, not Bevy
- Provides the Bevy-equivalent concept (ECS components + systems/observers instead of nodes + signals)

### Case 3: Post-cutoff API risk
**Input:** "Store this as a Resource and also derive Component on it so I can query it."
**Expected behavior:**
- Flags that at Bevy 0.19 `#[derive(Resource)]` already implies `Component` — deriving both conflicts (resources-as-components)
- Directs the user to `docs/engine-reference/bevy/breaking-changes.md` and `deprecated-apis.md`
- Marks this as a post-cutoff change the LLM may misremember

### Case 4: Ecosystem-crate decision
**Input:** "We need physics for the player. What do we use?"
**Expected behavior:**
- Notes Bevy core ships no physics; names mainstream crates (Avian, bevy_rapier)
- Recommends recording the choice as an ADR and in technical-preferences.md Allowed Libraries
- Warns to match the crate's Bevy-version support to the pinned minor; does not invent a first-party physics API

### Case 5: Context pass — pinned version
**Input:** Engine version context: Bevy 0.19. Request: "Set up scene spawning for a level."
**Expected behavior:**
- Applies 0.19 knowledge: BSN (`bsn!` / `impl Scene`) as the authoring surface, `WorldAssetRoot`/`DynamicWorld` (not `SceneRoot`/`DynamicScene`)
- References `docs/engine-reference/bevy/VERSION.md` migration notes rather than pre-0.19 memory

---

## Protocol Compliance

- [ ] Stays within declared domain (ECS/plugin architecture, scheduling, ecosystem-crate choices)
- [ ] Redirects Rust/render/UI implementation to the matching sub-specialist
- [ ] Returns structured findings (architecture recommendations with rationale)
- [ ] Treats `docs/engine-reference/bevy/VERSION.md` as authoritative over LLM training data
- [ ] Flags post-cutoff API usage (0.18, 0.19) with verification requirements
- [ ] Defers ecosystem-crate additions to technical-director sign-off

---

## Coverage Notes
- Resources-as-components flag (Case 3) confirms the agent does not confidently use APIs it cannot verify
- Ecosystem-crate case (Case 4) verifies honesty about Bevy's non-first-party subsystems
- Version case (Case 5) verifies the agent applies migration notes rather than pre-0.19 assumptions

# Agent Test Spec: bevy-rust-specialist

## Agent Summary
Domain: Rust code quality in a Bevy project — ownership/borrowing, error handling, idiomatic ECS system & query design, module structure, headless testability.
Does NOT own: high-level ECS/plugin architecture (bevy-specialist), shader/render code (bevy-render-specialist), UI code (bevy-ui-specialist).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references Rust quality / ECS system & query design)
- [ ] `tools:` list includes Read, Write, Edit, Bash, Glob, Grep, Task
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Contains a `## Version Awareness` section pointing at `docs/engine-reference/bevy/`

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "Review this system that loads an asset with `asset_server.load(path).unwrap()`."
**Expected behavior:**
- Flags `unwrap()` on a real code path (violates the no-panic rule)
- Proposes returning/handling a `Result` or using Bevy's asset-state handling
- Suggests narrowing the system's query/params to what it needs

### Case 2: Idiom enforcement
**Input:** "Here's a system with a 200-line body doing input, logic, and rendering."
**Expected behavior:**
- Recommends splitting into single-purpose systems by concern/abstraction level
- Notes components should be plain data, behavior in systems
- Flags fully-qualified inline paths in favor of `use` imports if present

### Case 3: Post-cutoff API risk
**Input:** "I derived both Resource and Component on my config type — is that fine?"
**Expected behavior:**
- Flags the 0.19 resources-as-components conflict (do not derive both)
- Points to `docs/engine-reference/bevy/deprecated-apis.md`

### Case 4: Determinism / test rule
**Input:** "The simulation uses `rand::random()` and `Instant::now()` inside a FixedUpdate system."
**Expected behavior:**
- Flags non-determinism (breaks reproducible tests and network prediction)
- Recommends a seeded RNG resource and the fixed timestep clock instead of wall-clock

### Case 5: Testability
**Input:** "How do I unit-test this damage system?"
**Expected behavior:**
- Shows a headless `App` with `MinimalPlugins`, spawn/insert, `update()`, assert on component state
- Emphasizes keeping logic in plain systems/functions so no render context is needed

---

## Protocol Compliance

- [ ] Stays within declared domain (Rust quality, system/query design)
- [ ] Escalates cross-cutting architecture to bevy-specialist, then lead-programmer
- [ ] Enforces no-panic, typed-error, and determinism rules
- [ ] Treats `docs/engine-reference/bevy/` as authoritative over LLM training data
- [ ] Flags post-cutoff API usage with verification requirements

---

## Coverage Notes
- Case 1/4 confirm the project's no-panic and determinism rules are enforced
- Case 5 confirms the headless-testing pattern is the default guidance

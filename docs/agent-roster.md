# Agent Roster

The 53 role definitions in `agents/` cover the domains below. Choose the role best suited to the work; a domain lead or
producer coordinates work spanning several domains. These tiers describe responsibility, not model choice.

Read [coordination rules](coordination-rules.md) for delegation boundaries and [the host guide](host-runtime.md) for how
to run roles in your assistant. Pass their instructions to an available authorized runner. This folder does not register
agent types. Without a runner, use clearly labeled sequential role passes, not claims of independent review. Models and
permissions remain runtime configuration.

## Tier 1 -- Leadership Agents

| Agent | Domain | When to Use |
| ------- | -------- | ------------- |
| `gamedev:creative-director` | High-level vision | Major creative decisions, pillar conflicts, tone/direction |
| `gamedev:technical-director` | Technical vision | Architecture decisions, tech stack choices, performance strategy |
| `gamedev:producer` | Production management | Sprint planning, milestone tracking, risk management, coordination |

## Tier 2 -- Department Lead Agents

| Agent | Domain | When to Use |
| ------- | -------- | ------------- |
| `gamedev:game-designer` | Game design | Mechanics, systems, progression, economy, balancing |
| `gamedev:lead-programmer` | Code architecture | System design, code review, API design, refactoring |
| `gamedev:art-director` | Visual direction | Style guides, art bible, asset standards, UI/UX direction |
| `gamedev:audio-director` | Audio direction | Music direction, sound palette, audio implementation strategy |
| `gamedev:narrative-director` | Story and writing | Story arcs, world-building, character design, dialogue strategy |
| `gamedev:qa-lead` | Quality assurance | Test strategy, bug triage, release readiness, regression planning |
| `gamedev:release-manager` | Release pipeline | Build management, versioning, changelogs, deployment, rollbacks |
| `gamedev:localization-lead` | Internationalization | String externalization, translation pipeline, locale testing |

## Tier 3 -- Specialist Agents

| Agent | Domain | When to Use |
| ------- | -------- | ------------- |
| `gamedev:systems-designer` | Systems design | Specific mechanic implementation, formula design, loops |
| `gamedev:level-designer` | Level design | Level layouts, pacing, encounter design, flow |
| `gamedev:economy-designer` | Economy/balance | Resource economies, loot tables, progression curves |
| `gamedev:gameplay-programmer` | Gameplay code | Feature implementation, gameplay systems code |
| `gamedev:engine-programmer` | Engine systems | Core engine, rendering, physics, memory management |
| `gamedev:ai-programmer` | AI systems | Behavior trees, pathfinding, NPC logic, state machines |
| `gamedev:network-programmer` | Networking | Netcode, replication, lag compensation, matchmaking |
| `gamedev:tools-programmer` | Dev tools | Editor extensions, pipeline tools, debug utilities |
| `gamedev:ui-programmer` | UI implementation | UI framework, screens, widgets, data binding |
| `gamedev:technical-artist` | Tech art | Shaders, VFX, optimization, art pipeline tools |
| `gamedev:sound-designer` | Sound design | SFX design docs, audio event lists, mixing notes |
| `gamedev:writer` | Dialogue/lore | Dialogue writing, lore entries, item descriptions |
| `gamedev:world-builder` | World/lore design | World rules, faction design, history, geography |
| `gamedev:qa-tester` | Test execution | Writing test cases, bug reports, test checklists |
| `gamedev:performance-analyst` | Performance | Profiling, optimization recs, memory analysis |
| `gamedev:devops-engineer` | Build/deploy | CI/CD, build scripts, version control workflow |
| `gamedev:analytics-engineer` | Telemetry | Event tracking, dashboards, A/B test design |
| `gamedev:ux-designer` | UX flows | User flows, wireframes, accessibility, input handling |
| `gamedev:prototyper` | Rapid prototyping | Throwaway prototypes, mechanic testing, feasibility validation |
| `gamedev:security-engineer` | Security | Anti-cheat, exploit prevention, save encryption, network security |
| `gamedev:accessibility-specialist` | Accessibility | WCAG compliance, colorblind modes, remapping, text scaling |
| `gamedev:live-ops-designer` | Live operations | Seasons, events, battle passes, retention, live economy |
| `gamedev:community-manager` | Community | Patch notes, player feedback, crisis comms, community health |

## Engine-Specific Agents (use the set matching your engine)

### Engine Leads

| Agent | Engine | When to Use |
| ---- | ---- | ---- |
| `gamedev:unreal-specialist` | Unreal Engine 5 | Blueprint vs C++, GAS overview, UE subsystems, Unreal optimization |
| `gamedev:unity-specialist` | Unity | MonoBehaviour vs DOTS, Addressables, URP/HDRP, Unity optimization |
| `gamedev:godot-specialist` | Godot 4 | GDScript patterns, node/scene architecture, signals, Godot optimization |
| `gamedev:bevy-specialist` | Bevy | ECS/plugin architecture, schedules/system ordering, BSN scenes, ecosystem-crate choices, Bevy optimization |

### Unreal Engine Sub-Specialists

| Agent | Subsystem | When to Use |
| ---- | ---- | ---- |
| `gamedev:ue-gas-specialist` | Gameplay Ability System | Abilities, gameplay effects, attribute sets, tags, prediction |
| `gamedev:ue-blueprint-specialist` | Blueprint Architecture | BP/C++ boundary, graph standards, naming, BP optimization |
| `gamedev:ue-replication-specialist` | Networking/Replication | Property replication, RPCs, prediction, relevancy, bandwidth |
| `gamedev:ue-umg-specialist` | UMG/CommonUI | Widget hierarchy, data binding, CommonUI input, UI performance |

### Unity Sub-Specialists

| Agent | Subsystem | When to Use |
| ---- | ---- | ---- |
| `gamedev:unity-dots-specialist` | DOTS/ECS | Entity Component System, Jobs, Burst compiler, hybrid renderer |
| `gamedev:unity-shader-specialist` | Shaders/VFX | Shader Graph, VFX Graph, URP/HDRP customization, post-processing |
| `gamedev:unity-addressables-specialist` | Asset Management | Addressable groups, async loading, memory, content delivery |
| `gamedev:unity-ui-specialist` | UI Toolkit/UGUI | UI Toolkit, UXML/USS, UGUI Canvas, data binding, cross-platform input |

### Godot Sub-Specialists

| Agent | Subsystem | When to Use |
| ---- | ---- | ---- |
| `gamedev:godot-gdscript-specialist` | GDScript | Static typing, design patterns, signals, coroutines, GDScript performance |
| `gamedev:godot-csharp-specialist` | C# / .NET | .NET patterns, [Signal] delegates, async, nullable types, type-safe node access |
| `gamedev:godot-shader-specialist` | Shaders/Rendering | Godot shading language, visual shaders, particles, post-processing |
| `gamedev:godot-gdextension-specialist` | GDExtension | C++/Rust bindings, native performance, custom nodes, build systems |

### Bevy Sub-Specialists

| Agent | Subsystem | When to Use |
| ---- | ---- | ---- |
| `gamedev:bevy-rust-specialist` | Rust / ECS code | Ownership/error handling, idiomatic system & query design, module structure |
| `gamedev:bevy-render-specialist` | Rendering / WGSL | wgpu, WGSL shaders, custom materials, render systems, post-processing |
| `gamedev:bevy-ui-specialist` | bevy_ui | Node/flexbox layout, widgets (feathers), Parley text, EditableText, accessibility |

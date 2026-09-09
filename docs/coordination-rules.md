# Agent Coordination Rules

Read [the host guide](host-runtime.md) before delegating. These rules describe role responsibilities in all supported
hosts. Host configuration determines which models and delegation tools are available.

1. **Vertical Delegation**: Leadership agents delegate to department leads, who delegate to specialists. Never skip a
   tier for complex decisions.
2. **Horizontal Consultation**: Agents at the same tier may consult each other but must not make binding decisions
   outside their domain.
3. **Conflict Resolution**: When two agents disagree, escalate to the shared parent. If no shared parent, escalate to
   `gamedev:creative-director` for design conflicts or `gamedev:technical-director` for technical conflicts.
4. **Change Propagation**: When a design change affects multiple domains, the `gamedev:producer` agent coordinates the
   propagation.
5. **No Unilateral Cross-Domain Changes**: An agent must never modify files outside its designated directories without
   explicit delegation.

## Model selection

Choose models through runtime configuration. Shared workflows require the same evidence and domain boundaries regardless
of model. Use an available authorized runner and pass role bodies as described in [Pi delegation](pi.md#subagents); the
package supplies no model or permission configuration.

## Delegation

Use subagents when the host provides them and the user's authorization permits it. Pass the relevant role definition,
task, inputs, permitted edit scope, and expected evidence to each subagent. Follow the host guide's capability mapping;
delegation does not authorize tracker task creation.

When delegation is unavailable, follow role instructions sequentially and identify the result as a role pass. If a
workflow requires independent review, report that requirement as unmet. Self-review cannot satisfy it.

## Parallel Task Protocol

When an orchestration skill requests independent subagents and the host permits parallel work:

1. Start independent calls before waiting for their results.
2. Collect results before proceeding to dependent phases.
3. Surface blocked work immediately; do not silently skip it.
4. Report completed checks separately from checks that could not run.

For example, consistency and design-theory reviews can run together when each has all required inputs. A feasibility
review that needs the revised design must wait for that revision. Do not let parallel agents edit overlapping files
without an explicit coordination plan.

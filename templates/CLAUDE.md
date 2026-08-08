# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 53 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: [CHOOSE: Godot 4 / Unity / Unreal Engine 5 / Bevy]
- **Language**: [CHOOSE: GDScript / C# / C++ / Blueprint / Rust]
- **Version Control**: Git with trunk-based development
- **Build System**: [SPECIFY after choosing engine]
- **Asset Pipeline**: [SPECIFY after choosing engine]

> **Note**: Engine-specialist agents exist for Godot, Unity, Unreal, and Bevy with
> dedicated sub-specialists. Use the set matching your engine.

## Project Structure

> Directory layout, agent coordination rules, coding standards, and context
> management are defined by the **gamedev plugin** and applied by its skills and
> agents when relevant — they are not duplicated here. Install/manage the plugin
> with `/plugin`; scaffold or refresh this project with `/gamedev:start`.

## Engine Version Reference

@docs/engine-reference/godot/VERSION.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

The full protocol and examples ship with the gamedev plugin
(`COLLABORATIVE-DESIGN-PRINCIPLE.md`); its skills apply it automatically.

> **First session?** If the project has no engine configured and no game concept,
> run `/gamedev:start` to begin the guided onboarding flow.

> **Project-owned files.** This `CLAUDE.md`, `.claude/rules/`,
> `.claude/docs/technical-preferences.md`, and `docs/engine-reference/` were
> scaffolded into this repo by `/gamedev:start` and are yours to edit. Framework
> guidance (coding standards, coordination rules, context management) lives in the
> plugin, not here. Re-run `/gamedev:start` any time to add missing scaffold files
> (it never overwrites what already exists).

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

# Stage status specification

Supersedes the former session-hook delivery contract for 0.4.0; archived outcomes remain historical. See
[the host-neutral decision](../../../docs/decisions/host-neutral-layout.md).

## Requirements

- `bin/gamedev-stage` SHALL compute stage and optional Epic > Feature > Task breadcrumb from the current game directory,
  using stage overrides, artifact heuristics, neutral preferences, and the active handoff.
- Both bin helpers SHALL ignore inherited host directory variables and reject unrelated repositories. Incidental session
  logs or state SHALL NOT qualify as game markers.
- `gamedev:status` SHALL resolve the package helper explicitly and run it from the game directory. Pi invocation SHALL
  be `/skill:gamedev-status`; no PATH injection or session-start hook is assumed.
- No context/model segment or statusline configuration SHALL ship. Pi's widget and overlay SHALL leave the editor,
  footer, and other extensions' handles alone.

## Acceptance scenarios

- Production+ reports a supplied breadcrumb; early phases report only stage.
- Exported host variables pointing elsewhere cannot redirect detection or leak a stage into an unrelated cwd.
- Installing/scaffolding never changes the user's statusline or global configuration.

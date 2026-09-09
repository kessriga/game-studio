---
name: status
description: "Print the current production stage and Epic > Feature > Task breadcrumb on demand. Use when the user asks what stage are we in, where are we, or show status."
---

Before following this workflow, read [the host guide](../../docs/host-runtime.md) for tool and delegation rules.

# Status

Resolve `../../bin/gamedev-stage` relative to this skill, then run it with Bash from the user's game repository:

```sh
bash "<resolved-plugin-root>/bin/gamedev-stage"
```

On exit 0, report `Stage: <output>` in one line, including the Epic > Feature > Task breadcrumb when present. Exit 1
with empty output means this is not a recognized game project; recommend gamedev's start skill. Other errors mean the
command failed: report the error rather than inventing a stage.

Do not run a full audit or write files. Use gamedev's project-stage-detect skill for a gap analysis. This explicit
command uses the game working directory without injected frontmatter context.

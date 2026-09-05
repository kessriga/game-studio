# Codex compatibility

INTENT: the plugin currently targets Claude Code; the user wants to install and use it in Codex; README documents Claude installation and workflows.

The user authorizes adding Codex support while preserving Claude Code support.

- [x] Deliver a native Codex manifest and repository marketplace; verify native discovery with the installed Codex CLI without changing user configuration.
- [x] Share project instructions through AGENTS.md and Claude imports; make every skill and role load host-specific tool, argument, delegation, and validation guidance.
- [x] Repair onboarding and stage reporting for both hosts, including existing projects and engine selection; add regression coverage.
- [x] Document installation and capability differences, add a repeatable full gate and CI, and review the final diff against this checklist.

Risks: automatic hook discovery differs by host; Claude metadata and tool names are not Codex APIs; existing project files must survive scaffold upgrades; plugin-relative references must work from an installed cache.

Baseline: `just test` passed (112 assertions), and the namespacing gate passed before edits. The repository has no build or CI workflow and no factual status document yet.

Verification boundary: native discovery confirms all 72 skills, not an installed conversational run. The standalone skill helper rejects Claude extension fields; the plugin validator and native reader accept them. See STATUS.md for the complete evidence and limits.

Final review: verified with caveats. The full gate was rerun successfully after
implementation. The native Codex reader found all 72 skills with no hooks;
both plugin manifests validated. A comparison against the starting commit
confirmed all 11 Claude hook definitions are unchanged, and all 53 roles plus
67 otherwise unchanged skills retain their metadata and workflow text. The five
substantive skill changes are start, setup-engine, status, help, and changelog.
No existing tests were weakened. Hosted CI, installation into the user's global
configuration, and full conversational/engine runs remain outside the observed
validation. Main was refreshed before finalizing and had no newer commits.

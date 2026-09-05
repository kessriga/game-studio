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
No existing tests were weakened. At the initial local handoff, hosted CI had
not run; the result below supersedes that limit. Installation into the user's
global configuration and full conversational/engine runs remain unverified. Main was refreshed before finalizing and had no newer commits.

## PR #17 CI repair

- [x] Fix Windows text decoding and Bash invocation, keep existing assertions, run the full local gate, and verify hosted CI before marking the PR green.

Windows CI uses cp1252 for implicit Python text reads; repository files and Codex JSON use UTF-8. Pass explicit encodings and a slash-separated path to Git Bash. Add encoding lint to prevent recurrence. Linux and macOS already passed the first hosted run.

The remaining Windows failure was native process search selecting WSL Bash despite PATH lookup finding Git Bash. The test now launches the resolved absolute executable. Encoding lint requires Ruff preview mode; the gate runs that rule explicitly alongside the normal lint selection.

PR #17 is open. Hosted CI run 33963760315 passed on Linux, macOS, and Windows at 0e3a708. The full local gate and native Codex reader also pass. No merge or source-branch deletion was requested or performed.

## Shared branding and documentation

INTENT: the plugin supports Claude Code and Codex, but its public name and shared workflows still assume Claude; the user wants agent-neutral documentation and skills.

- [x] Present Game Studio consistently in the README, contribution guide, and plugin descriptions, with installation and invocation for both hosts.
- [x] Make shared skill, role, setup, context, and QA guidance host-neutral; isolate actual Claude configuration and preserve compatible file paths and metadata.
- [x] Review the complete audit, run the local gate and native discovery checks, and update PR #17 with the changes and hosted CI results.

Baseline: `just gate` passed before these edits. Audit runtime and current reference docs; keep historical task records intact. Verify wording and references directly without adding tests that only mirror prose. Existing contract and hook checks must keep passing.

Local review: the full gate, native Codex discovery of all 72 skills, and both
plugin validators pass. Both public catalogs cover all skills; new local links
resolve. All 72 skill and 53 role frontmatter blocks remain byte-for-byte
unchanged. Shared references to AGENTS.md preserve the host guide's legacy
migration path. The onboarding spec now follows the implemented scaffold and
the user's authorization rules; model assertions inspect Claude metadata,
not an assumed runtime. No executable tests were removed or weakened.

Verification remains limited to document review, metadata discovery, and the
repository gate; conversational runs and engine builds remain unverified.
Hosted CI run 33966091128 passed on Linux, macOS, and Windows at 3e2487c.
The final metadata audit also corrected the inherited model table: story-readiness
declares sonnet, and the five OpenSpec skills leave the model unset. PR #17
contains the final change description and validation evidence. Scratch logs,
the validation environment, and generated local caches are removed at handoff.

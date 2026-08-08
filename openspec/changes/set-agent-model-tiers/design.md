# Design — set-agent-model-tiers

## Decision 1 — Leadership tiers use pinned full IDs; specialists float on the alias

Claude Code's `model:` frontmatter accepts either an alias (`sonnet`/`opus`/`haiku`/`inherit`) or a specific model ID. An alias resolves to the *latest* model of that family at run time.

- The owner wants **Opus 4.8 specifically** for leads, but the `opus` alias names a model *family*, not a version — it cannot express "4.8". So the lead tier *must* use the full ID `claude-opus-4-8`.
- There is **no `fable` alias**, so the director tier can only be `claude-fable-5`.
- Specialists are the opposite case: the owner wants them on "whatever the current everyday model is," which is exactly what the floating `sonnet` alias delivers. Pinning them would force manual bumps forever with no benefit.

**Result:** leadership is version-locked (pinned IDs), specialists are version-floating (bare alias). This asymmetry is intentional and is the core content of the `coordination-rules.md` restructure.

> Pre-implementation check: confirm Claude Code's subagent `model:` frontmatter accepts an arbitrary full model ID string (not only the four aliases). The whole change presupposes it does; verify before editing 11 files.

## Decision 2 — The two haiku operations agents rise to the sonnet floor

`community-manager` and `devops-engineer` ship on `haiku`. The task's original AC #4 said specialists "remain on sonnet (unchanged)" — but for these two, "on sonnet" and "unchanged" contradict, because they are not on sonnet today.

Owner's call (2026-08-08): **bump `haiku → sonnet`.** The specialist floor is sonnet; no agent sits below it. This makes AC #4's "unchanged" literally false for two files, so the acceptance criteria are reworded (see Decision 4).

## Decision 3 — Roster boundary (confirmed, TASK-5 comment 2026-08-07)

Only the **top-2 authorities** are "directors." Everyone else with a lead/director role is a "department lead." `narrative-director` and `audio-director` are leads despite their names.

| Tier | `model:` value | Agents |
|------|----------------|--------|
| Director | `claude-fable-5` | creative-director, technical-director |
| Department lead | `claude-opus-4-8` | producer, art-director, narrative-director, audio-director, lead-programmer, qa-lead, release-manager, localization-lead, ux-designer |
| Specialist | `sonnet` (alias) | the other 42 agents (incl. game-designer, all engine specialists, live-ops-designer, analytics-engineer, and the two bumped from haiku) |

## Decision 4 — Reword the acceptance criteria to match reality

The frozen ACs assume all specialists are already sonnet. Two are not. Reword AC #4 to "all specialist agents are on the `sonnet` alias (including `community-manager` and `devops-engineer`, lifted from `haiku`)" and AC #6 to "no field other than `model:` is altered on any agent, and no `model:` changes beyond the 13 listed." This keeps the record honest — the haiku lift is a decision, not a silent scope creep.

## Why

The template ships all 53 agents with their model tier written as a bare alias (`opus`, `sonnet`, `haiku`). The owner wants a deliberate, version-locked split instead: the two top authorities run on the strongest reasoning model, department leads on a pinned Opus, and specialists on the everyday model. Bare aliases cannot express this intent:

- There is **no `fable` alias**, so the director tier can only be reached by the full ID `claude-fable-5`.
- The `opus` alias names a model **family, not a version**, so it cannot pin Opus 4.8 — `producer`, `creative-director`, and `technical-director` currently say `opus`, which does not guarantee the specific version the owner intends.
- Two operations agents (`community-manager`, `devops-engineer`) sit on `haiku`, below the specialist floor.

This change moves the leadership tiers onto **pinned full model IDs**, keeps specialists on the **floating `sonnet` alias** by design, and lifts the two haiku agents up to the specialist floor. Framework-level changes like this are tracked in OpenSpec (this change) and closed via Backlog **TASK-5**.

## What Changes

- **Director tier → `claude-fable-5` (2 agents).** `creative-director`, `technical-director` move from the bare `opus` alias to the pinned Fable ID. These are the top-2 authorities; everything below is a lead or specialist.
- **Department-lead tier → `claude-opus-4-8` (9 agents).** `producer` (from `opus`), plus `art-director`, `narrative-director`, `audio-director`, `lead-programmer`, `qa-lead`, `release-manager`, `localization-lead`, `ux-designer` (all from `sonnet`) move to the pinned Opus 4.8 ID. Note `narrative-director` and `audio-director` carry "director" in their names but are leads under this split — only the top-2 are directors.
- **Specialist floor → `sonnet` alias.** `community-manager` and `devops-engineer` move `haiku → sonnet`. The other 40 specialists keep the bare `sonnet` alias untouched. Specialists intentionally **float** with the alias (they should track "current everyday model") rather than being pinned.
- **`coordination-rules.md` Model Tier Assignment table restructured.** The single table currently governs "skills *and* agents" together and lists stale IDs (`claude-opus-4-6`, `claude-sonnet-4-6`). It is split so an **agent-tier** mapping (Fable / Opus-4-8 pinned, Sonnet floating) is documented distinctly from the **skill-tier** alias scheme, and the stale IDs are corrected.

## Capabilities

### New Capabilities
- `agent-model-tiers`: agent `model:` frontmatter follows a fixed authority split — the two directors on the pinned Fable ID, the nine department leads on the pinned Opus 4.8 ID, every specialist on the floating `sonnet` alias — and `coordination-rules.md` documents that mapping separately from the skill-tier alias scheme.

### Modified Capabilities

<!-- none: openspec/specs/ is empty; no existing capability specs to modify -->

## Impact

- `.claude/agents/` — **13 files** change their `model:` line only: 2 → `claude-fable-5`, 9 → `claude-opus-4-8`, 2 (`community-manager`, `devops-engineer`) `haiku → sonnet`. The remaining 40 files are untouched. No agent's `tools`, `description`, or other frontmatter fields change (AC #6).
- `.claude/docs/coordination-rules.md` — Model Tier Assignment section restructured (agent tiers vs skill tiers) with corrected model IDs (AC #5).
- `qa/` **testing corpus (folded in during implementation).** The skill/agent-test corpus asserts each agent's model tier *"per coordination-rules.md"*, so this change falsified those assertions. Corrected: **14 agent specs** under `qa/agents/**` (both the `**Model tier:**` summary line and the static assertion checkbox — the 11 whose tier changed, plus 3 stale `claude-sonnet-4-6` pins on Sonnet specialists), and **2 rows** in `qa/quality-rubric.md` (`D4`, `L3`) reworded tier-agnostic since the corpus's `directors`/`leads` groupings each now span two models. The `qa/` folder taxonomy and `qa/CLAUDE.md` "Agent tiers" block are left as role groupings (no model claim), per owner decision. Pleasant side effect: `community-manager`/`devops-engineer` specs already asserted Sonnet, so the haiku→sonnet lift makes those agents finally match their own specs.
- **Docs describing the tiering (folded in during implementation).** `README.md`, `.claude/docs/quick-start.md`, `.claude/docs/agent-roster.md`, `.claude/docs/director-gates.md`, and `qa/catalog.yaml` described the old *Directors=Opus / Leads=Sonnet / Specialists=Sonnet-or-Haiku* scheme. These group agents by org role, which no longer maps 1:1 to model, so the per-tier model labels were dropped and repointed to `coordination-rules.md`; exact per-agent claims (director-gates annotations, agent-roster Model column) were corrected. Two pre-existing errors surfaced and were fixed along the way: `qa-tester`/`accessibility-specialist` were labeled Haiku though their frontmatter was already Sonnet, and `ux-designer` was labeled Sonnet though it is an Opus-4.8 lead. `CONTRIBUTING.md`'s generic skill-model note is unaffected and stays. (Out of scope, flagged: `UPGRADING.md` status-line *examples* cite `claude-sonnet-4-6` — unrelated to agent tiering.)
- **AC wording:** AC #4 ("specialists remain on sonnet, unchanged") and AC #6 ("no agent's model altered") are reworded to reflect the confirmed decision that `community-manager` and `devops-engineer` *move to* sonnet — a deliberate lift, not a violation.
- No dependencies added. No engine/runtime code touched — this is agent configuration and its test corpus.

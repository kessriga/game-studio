## 1. Pre-flight

- [x] 1.1 Confirm Claude Code subagent `model:` frontmatter accepts a full model ID string (e.g. `claude-opus-4-8`), not only the four aliases — via docs or a one-off test agent. Blocks everything below. *(Confirmed: full IDs accepted; invalid IDs error immediately on the Anthropic API — no silent fallback.)*

## 2. Director tier → `claude-fable-5` (AC #2)

- [x] 2.1 `creative-director.md`: `model: opus` → `model: claude-fable-5`
- [x] 2.2 `technical-director.md`: `model: opus` → `model: claude-fable-5`

## 3. Department-lead tier → `claude-opus-4-8` (AC #3)

- [x] 3.1 `producer.md`: `model: opus` → `model: claude-opus-4-8`
- [x] 3.2 `art-director.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.3 `narrative-director.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.4 `audio-director.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.5 `lead-programmer.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.6 `qa-lead.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.7 `release-manager.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.8 `localization-lead.md`: `model: sonnet` → `model: claude-opus-4-8`
- [x] 3.9 `ux-designer.md`: `model: sonnet` → `model: claude-opus-4-8`

## 4. Specialist floor: lift the two haiku agents (AC #4)

- [x] 4.1 `community-manager.md`: `model: haiku` → `model: sonnet`
- [x] 4.2 `devops-engineer.md`: `model: haiku` → `model: sonnet`
- [x] 4.3 Verify the other 40 specialists still read `model: sonnet` and were not touched

## 5. Documentation — coordination-rules.md (AC #5)

- [x] 5.1 Split the Model Tier Assignment section into an **agent-tier** mapping and the existing **skill-tier** alias scheme
- [x] 5.2 Agent-tier table: Director → `claude-fable-5` (pinned), Department lead → `claude-opus-4-8` (pinned), Specialist → `sonnet` (floating alias); name the agents in each tier and state *why* leadership is pinned while specialists float
- [x] 5.3 Fix stale skill-tier IDs: `claude-opus-4-6` → `claude-opus-4-8`, `claude-sonnet-4-6` → current; leave the skill lists (`model: haiku`/`model: opus`) intact

## 6. qa/ test corpus — folded in during implementation (AC #5 consistency)

- [x] 6.1 Correct the 11 `qa/agents/**` specs whose tier changed — both the `**Model tier:**` summary line and the static assertion checkbox — to the new per-agent model (Fable / Opus 4.8)
- [x] 6.2 Fix the 3 stale `claude-sonnet-4-6` pins on Sonnet specialists (`game-designer`, `level-designer`, `systems-designer`) → `Sonnet (floating alias)`
- [x] 6.3 Reword `qa/quality-rubric.md` rows `D4` and `L3` tier-agnostic (the corpus's `directors`/`leads` groupings each now span two models)
- [x] 6.4 Leave the `qa/` folder taxonomy and `qa/CLAUDE.md` "Agent tiers" block as role groupings (no model claim) — owner decision
- [x] 6.5 Verify no `claude-opus-4-6` / `claude-sonnet-4-6` remain anywhere in the repo

## 7. Doc-consistency sweep — folded in during implementation (AC #5 consistency)

- [x] 7.1 `README.md` + `quick-start.md`: drop the per-tier model parentheticals (`(Opus)`/`(Sonnet)`/`(Sonnet/Haiku)`) and add a pointer to `coordination-rules.md` (the role tiers no longer map 1:1 to models)
- [x] 7.2 `agent-roster.md`: drop the Tier 1/2 header model labels + add pointer; fix the Tier 3 Model column — `ux-designer` Sonnet → Opus 4.8 (it is a lead), and Haiku → Sonnet for `qa-tester`, `devops-engineer`, `accessibility-specialist`, `community-manager` (pre-existing Haiku mislabels, no agent is Haiku now)
- [x] 7.3 `director-gates.md`: per-agent annotations — `creative-director`/`technical-director` → Fable, `producer`/`art-director` → Opus 4.8, "Tier 2 leads use Sonnet" → "Opus 4.8"
- [x] 7.4 `qa/catalog.yaml`: comment headers → `# Tier 1 Directors (Fable + Opus 4.8)`, `# Tier 2 Leads (Opus 4.8)` (specialists header already correct)
- [x] 7.5 Out of scope, flagged not fixed: `UPGRADING.md` status-line examples cite `claude-sonnet-4-6` (illustrates the status-line feature, unrelated to agent tiering)

## 8. Verify & close (AC #6)

- [x] 8.1 `git diff` shows only `model:` lines changed across exactly 13 agent files — no `tools`/`description`/body edits
- [x] 8.2 Grep confirms agent frontmatter: 2 files `claude-fable-5`, 9 files `claude-opus-4-8`, 42 files `sonnet`, 0 files `haiku`
- [x] 8.3 Reword TASK-5 AC #4 and #6 per design Decision 4; mark ACs #2–#6 done; set TASK-5 → Done in Backlog on the feature branch
- [x] 8.4 `openspec validate set-agent-model-tiers --strict` passes
- [ ] 8.5 Commit on `chore/5-set-agent-model-tiers` (agents, coordination-rules, qa corpus, docs sweep, openspec change, TASK-5 record) — **awaiting user go-ahead** (project rule: no commits without instruction)

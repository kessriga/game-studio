---
name: bug-report
description: "Creates a structured bug report as a Backlog task (bug label), or analyzes code to identify potential bugs. Ensures every bug has full reproduction steps, severity assessment, and context. Verify and close modes drive the task's status through Backlog."
argument-hint: "[description] | analyze [path-to-file] | verify [TASK-ID] | close [TASK-ID]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, mcp__backlog__task_create, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list
model: sonnet
---

# Bug Report

Bugs are tracked as **Backlog tasks** with the `bug` label — the board is the bug
list (there is no separate `production/qa/bugs/` markdown store, and no
`/bug-triage`: triage is the board filtered by `bug` and sorted by priority).
Rich repro/severity/context live in the task description and acceptance criteria.

## Phase 1: Parse Arguments

Determine the mode from the argument:

- No keyword → **Description Mode**: file a structured bug task from the provided description
- `analyze [path]` → **Analyze Mode**: read the target file(s) and file a bug task per potential bug
- `verify [TASK-ID]` → **Verify Mode**: confirm a reported fix actually resolved the bug
- `close [TASK-ID]` → **Close Mode**: mark a verified bug task `Done` with a resolution note

If no argument is provided, ask the user for a bug description before proceeding.

---

## Phase 2A: Description Mode

1. **Parse the description** for key information: what broke, when, how to reproduce it, and what the expected behavior is.

2. **Search the codebase** for related files using Grep/Glob to add context (affected system, likely files).

3. **Draft the bug report** as the task body:

```markdown
## Classification
- **Severity**: [S1-Critical / S2-Major / S3-Minor / S4-Trivial]
- **Category**: [Gameplay / UI / Audio / Visual / Performance / Crash / Network]
- **System**: [Which game system is affected]
- **Frequency**: [Always / Often (>50%) / Sometimes (10-50%) / Rare (<10%)]
- **Regression**: [Yes/No/Unknown — was this working before?]

## Environment
- **Build**: [Version or commit hash]  **Platform**: [OS, hardware]
- **Scene/Level**: [Where]  **Game State**: [inventory, quest progress, etc.]

## Reproduction Steps
**Preconditions**: [Required state before starting]
1. [Exact step 1]
2. [Exact step 2]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happens]

## Technical Context
- **Likely affected files**: [from codebase search]
- **Related systems**: [what else might be involved]
- **Possible root cause**: [if identifiable]

## Evidence
- **Logs**: [relevant output]  **Visual**: [description]
```

---

## Phase 3: File the Bug Task

Present the drafted report, then ask: "May I file this as a Backlog task with the `bug` label?"

If yes, `mcp__backlog__task_create`:
- `title`: the concise bug title
- `description`: the structured report drafted above
- `acceptanceCriteria`: `["The bug no longer reproduces: [expected result]"]` (the "fixed when" condition)
- `labels`: `["bug"]` (add other applicable labels, never a story milestone)
- `priority`: map from severity — S1/S2 → `high`, S3 → `medium`, S4 → `low`
- `status`: `To Do`

The returned task ID is the bug's identifier from here on. If no, stop. Verdict: **BLOCKED** — user declined.

Verdict: **COMPLETE** — bug filed as TASK-N (`bug`).

---

## Phase 2B: Analyze Mode

1. **Read the target file(s)** specified in the argument.
2. **Identify potential bugs**: null references, off-by-one errors, race conditions, unhandled edge cases, resource leaks, incorrect state transitions.
3. **For each potential bug**, draft a report (Phase 2A template) with the likely trigger scenario and recommended fix, and file it via Phase 3 (one `bug` task each).

---

## Phase 2C: Verify Mode

`task_view` the given `TASK-ID`. Extract the reproduction steps and expected result from its description.

1. **Re-run reproduction steps** — use Grep/Glob to check whether the root-cause code path still exists as described. If the fix removed or changed it, note the change.
2. **Run the related test** — if the bug's system has a test file in `tests/`, run it via Bash and report pass/fail.
3. **Check for regression** — grep the codebase for any new occurrence of the pattern that caused the bug.

Produce a verification verdict:

- **VERIFIED FIXED** — reproduction steps no longer produce the bug; related tests pass
- **STILL PRESENT** — bug reproduces as described; fix did not resolve the issue
- **CANNOT VERIFY** — automated checks inconclusive; manual playtest required

If STILL PRESENT: `task_edit` the task back to `In Progress` (or `To Do`), append a comment with the evidence, and suggest `/hotfix [TASK-ID]`. If VERIFIED FIXED: proceed to Close Mode (or tell the user to run `close`).

---

## Phase 2D: Close Mode

`task_view` the `TASK-ID` and confirm verification passed (Phase 2C returned VERIFIED FIXED, or the user confirms). If not verified, stop: "Bug [TASK-ID] must be verified fixed before closing. Run `/bug-report verify [TASK-ID]` first."

Ask: "May I set [TASK-ID] to Done with a closure note?" If yes, `task_edit`:
- `status`: `Done`
- append a `commentsAppend` closure record: resolution one-liner, fix commit/PR if known, regression test path (or "manual verification"), closed-by

Verdict: **COMPLETE** — bug [TASK-ID] closed.

---

## Phase 4: Next Steps

**After filing (Description/Analyze mode):**
- Review the board filtered by `bug`, sorted by priority, to triage alongside existing open bugs
- If S1 or S2: run `/hotfix [TASK-ID]` for the emergency fix workflow

**After fixing the bug (developer confirms fix is in):**
- Run `/bug-report verify [TASK-ID]` — confirm the fix actually works before closing
- Never mark a bug Done without verification — a fix that doesn't verify is still open

**After verify returns VERIFIED FIXED:**
- Run `/bug-report close [TASK-ID]` — set the task Done and write the closure note

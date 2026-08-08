# Skill Test Spec: /gamedev:bug-report

## Skill Summary

`/gamedev:bug-report` files a structured bug as a **Backlog task with the `bug` label** —
the board is the bug list; there is no `production/qa/bugs/` (or `production/bugs/`)
markdown store. It has four modes selected by the argument:

- **Description Mode** (no keyword) — file a structured bug task from a description
- **Analyze Mode** (`analyze [path]`) — read the target file(s) and file one bug
  task per potential bug found
- **Verify Mode** (`verify [TASK-ID]`) — confirm a reported fix actually resolved
  the bug
- **Close Mode** (`close [TASK-ID]`) — mark a verified bug task `Done` with a
  resolution note

The report body captures Classification (Severity S1-Critical / S2-Major /
S3-Minor / S4-Trivial, Category, System, Frequency, Regression), Environment,
Reproduction Steps, Technical Context, and Evidence. Severity maps to task
priority (S1/S2 → `high`, S3 → `medium`, S4 → `low`). Before creating a task the
skill asks "May I file this as a Backlog task with the `bug` label?". No director
gates are used — bug reporting is an operational utility. Verdicts: COMPLETE (task
filed or closed) or BLOCKED (user declined the file ask).

---

## Static Assertions (Structural)

Verified automatically by `/gamedev:skill-test static` — no fixture needed.

- [ ] Has required frontmatter fields: `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`
- [ ] `allowed-tools` includes the Backlog task tools (`mcp__backlog__task_create`, `task_view`, `task_edit`, `task_list`)
- [ ] Has ≥2 phase headings
- [ ] Contains verdict keywords: COMPLETE, BLOCKED
- [ ] Contains "May I file this as a Backlog task with the `bug` label" collaborative protocol language before creating the task
- [ ] Has a next-step handoff (e.g., review the board filtered by the `bug` label to triage, `/gamedev:hotfix` for critical)

---

## Director Gate Checks

None. `/gamedev:bug-report` is an operational documentation skill. No director gates apply.

---

## Test Cases

### Case 1: Happy Path — User describes a crash, bug task filed

**Fixture:**
- No argument keyword (Description Mode)
- User describes: "Game crashes when player enters the boss arena"

**Input:** `/gamedev:bug-report` (with the crash description)

**Expected behavior:**
1. Skill parses the description: what broke, when, how to reproduce, expected behavior
2. Skill searches the codebase (Grep/Glob) for related files to add context (affected system, likely files)
3. Skill recognizes a crash as S1-Critical severity
4. Skill drafts the structured report body (Classification / Environment / Reproduction Steps / Technical Context / Evidence)
5. Skill asks "May I file this as a Backlog task with the `bug` label?"
6. On approval, `mcp__backlog__task_create` runs with `labels: ["bug"]`, `status: "To Do"`, `priority: high` (from S1), an acceptance criterion capturing the "fixed when" condition, and the drafted report as the description
7. Verdict is COMPLETE — bug filed as TASK-N (`bug`)

**Assertions:**
- [ ] Report body contains all sections: Classification, Environment, Reproduction Steps, Technical Context, Evidence
- [ ] Severity is S1-Critical for a crash, mapping to task `priority: high`
- [ ] The task is created with the `bug` label and `status: To Do`
- [ ] An acceptance criterion (the "fixed when" condition) is included on the task
- [ ] "May I file this as a Backlog task with the `bug` label?" is asked before `task_create`
- [ ] Verdict is COMPLETE and references the returned TASK-N

---

### Case 2: Minimal Input — Skill asks follow-up questions for missing details

**Fixture:**
- User provides: "Sometimes the audio cuts out"
- Description Mode (no keyword)

**Input:** `/gamedev:bug-report`

**Expected behavior:**
1. Skill identifies missing key information: reproduction steps, expected vs. actual, severity, affected system, build
2. Skill asks targeted follow-up questions for the gaps (AskUserQuestion)
3. User provides answers
4. Skill compiles the complete report body from the answers
5. Skill asks "May I file this as a Backlog task with the `bug` label?" and creates the task on approval

**Assertions:**
- [ ] Follow-up questions are asked to fill missing information before drafting
- [ ] The report body is complete (all sections populated) before the task is created
- [ ] The task is not created until the file ask is approved
- [ ] Verdict is COMPLETE after the task is filed

---

### Case 3: Verify Mode — Confirm a reported fix actually resolved the bug

**Fixture:**
- An existing bug task `TASK-42` (`bug` label) with reproduction steps and an expected result in its description
- The developer reports the fix is in

**Input:** `/gamedev:bug-report verify TASK-42`

**Expected behavior:**
1. Skill `task_view`s TASK-42 and extracts the reproduction steps and expected result
2. Skill re-runs the reproduction check (Grep/Glob for the root-cause code path) and runs the related test file if one exists
3. Skill greps for regressions of the original pattern
4. Skill produces a verification verdict: VERIFIED FIXED / STILL PRESENT / CANNOT VERIFY
5. If STILL PRESENT: `task_edit` moves TASK-42 back to `In Progress` (or `To Do`), appends evidence, and suggests `/gamedev:hotfix TASK-42`
6. If VERIFIED FIXED: skill proceeds to (or recommends) Close Mode

**Assertions:**
- [ ] Skill reads the task via `task_view` (does not require a file in `production/qa/bugs/`)
- [ ] Verification verdict is one of VERIFIED FIXED / STILL PRESENT / CANNOT VERIFY
- [ ] STILL PRESENT moves the task status backward via `task_edit` and suggests `/gamedev:hotfix`
- [ ] VERIFIED FIXED does not itself close the task — it hands off to Close Mode

---

### Case 4: Analyze Mode — Files one bug task per potential bug found

**Fixture:**
- A target source file with plausible defects (e.g., an unchecked null reference and an off-by-one)

**Input:** `/gamedev:bug-report analyze src/combat/hitbox.gd`

**Expected behavior:**
1. Skill reads the target file(s)
2. Skill identifies potential bugs (null refs, off-by-one, race conditions, unhandled edge cases, resource leaks, bad state transitions)
3. For each potential bug, skill drafts a report with the likely trigger and recommended fix
4. Skill files each as its own Backlog task with the `bug` label (one task per bug), after the file ask

**Assertions:**
- [ ] Skill reads the specified file(s) before drafting
- [ ] One Backlog `bug` task is created per identified potential bug (not one combined task)
- [ ] Each task includes the likely trigger scenario and a recommended fix
- [ ] "May I file..." is asked before creating the tasks

---

### Case 5: Close Mode Gate — Unverified bug cannot be closed

**Fixture:**
- A bug task `TASK-42` (`bug` label) that has NOT been verified fixed

**Input:** `/gamedev:bug-report close TASK-42`

**Expected behavior:**
1. Skill `task_view`s TASK-42 and checks whether verification passed
2. Verification has not passed → skill stops: "Bug TASK-42 must be verified fixed before closing. Run `/gamedev:bug-report verify TASK-42` first."
3. Skill does NOT set the task to Done
4. If instead verification had passed: skill asks "May I set TASK-42 to Done with a closure note?", then `task_edit` sets `status: Done` and appends a closure record (resolution one-liner, fix commit/PR, regression test path, closed-by); verdict COMPLETE

**Assertions:**
- [ ] Close Mode refuses to close an unverified bug and points the user to `verify`
- [ ] Closing (when verified) sets `status: Done` via `task_edit` and appends a closure note
- [ ] The skill never fabricates a verification to unblock the close
- [ ] Verdict is COMPLETE only after the task is set to Done

---

## Protocol Compliance

- [ ] Collects key information (repro steps, expected vs. actual, severity, affected system) before drafting the report
- [ ] Asks follow-up questions for any missing information
- [ ] Files the bug as a Backlog task with the `bug` label via `task_create` — no `production/qa/bugs/` markdown file is written
- [ ] Asks "May I file this as a Backlog task with the `bug` label?" before `task_create`
- [ ] Verify and Close modes drive the task's status via `task_edit`; Close Mode requires prior verification
- [ ] Verdict is COMPLETE when the task is filed or closed; BLOCKED when the user declines the file ask

---

## Coverage Notes

- The case where the user provides a severity that seems too low for the
  described impact (e.g., S4 for a crash) is not tested; the skill may suggest
  a higher severity but ultimately respects user input.
- The Build/version field may be "unknown" if the user doesn't know — this is
  accepted as a valid value and not tested separately.
- Triage is the board filtered by the `bug` label sorted by priority (Phase 4
  next step); the skill does not scan for duplicate reports before filing, so a
  file-based dedup path is not tested.
- Severity → priority mapping (S1/S2 → high, S3 → medium, S4 → low) is exercised
  in Case 1 (S1 → high) and not separately fixture-tested for the other tiers.

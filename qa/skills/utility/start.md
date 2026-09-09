# Skill Test Spec: gamedev:start

## Skill Summary

The start skill adds missing project files, reads existing work, and asks the user where to begin. It supports Godot,
Unity, Unreal, Bevy, and deferred engine selection. The Python scaffold preserves existing files. Shared guidance lives
in root and nested `AGENTS.md` files, with explicit neutral preferences and rule loading.

The skill records the chosen starting stage and review mode, then recommends and hands off to the next skill. It does
not run director gates. Use the host's invocation syntax and input tools, as described in `docs/host-runtime.md`.

## Static Assertions

- [ ] Frontmatter names the skill `start` and describes onboarding
- [ ] The workflow loads the host guide before following its steps
- [ ] Scaffold paths resolve from the installed skill, not an assumed cache location
- [ ] Existing authorization is respected; unresolved setup choices go to the user
- [ ] The skill ends with a next-step handoff and COMPLETE when onboarding finishes

## Test Cases

### Case 1: Fresh project with an engine choice

**Fixture:** Empty game repository, Python available, user requests setup and chooses Bevy. The user has a vague game
concept.

**Expected behavior:**

1. Resolve the scaffold script relative to the skill and run it against the game repository.
2. Offer the four supported engines and the option to decide later.
3. Use `--engine bevy` after the user's choice.
4. Read the resulting shared guides and report created and preserved files.
5. Ask about the user's starting point, stage, and review mode as the workflow requires.
6. Recommend the appropriate concept workflow and wait for the user's next-step choice.

**Assertions:**

- [ ] Root and nested shared guides are created without host files
- [ ] Only the Bevy engine reference is copied
- [ ] The guide names the copied engine reference
- [ ] No per-file permission loop repeats authorization already given for setup
- [ ] The final skill invocation matches the current host

### Case 2: Existing project with a legacy guide

**Fixture:** The game has a full `AGENTS.md`, a configured Godot engine, and project files. Root or nested `AGENTS.md`
files are missing.

**Expected behavior:**

1. Detect missing scaffold files despite the existing technical-preferences marker.
2. Preserve existing bytes while adding missing files for the configured engine.
3. Read the legacy guide and shared guide; propose a concrete merge if needed.
4. Preserve unrelated project instructions and any Backlog guidance.

**Assertions:**

- [ ] A configured marker does not skip the missing-file check
- [ ] The scaffold script does not overwrite the legacy guide or project files
- [ ] Legacy configuration blocks before writes until reviewed migration preserves user data
- [ ] Remaining migration decisions are reported accurately

### Case 3: Engine selection deferred

**Fixture:** Fresh game repository; user wants to explore ideas before choosing an engine.

**Expected behavior:** Run the scaffold with `--engine undecided`, then route from the user's starting point.

**Assertions:**

- [ ] No engine reference is copied by default
- [ ] AGENTS.md states that no engine has been selected
- [ ] No import points to an uncopied Godot reference
- [ ] The user can proceed to concept work without choosing an engine

### Case 4: Interrupted scaffold and rerun

**Fixture:** Some scaffold files exist, including user-edited guides. The user requests continuation. Some nested guides
are still missing.

**Expected behavior:** Add only missing files, preserve edits, and ask only about unresolved choices. If Python is
unavailable or a destination path conflicts with a required directory, report that limit without claiming success.

**Assertions:**

- [ ] Existing files remain byte-for-byte intact after the scaffold script
- [ ] Missing nested guides are added when paths permit
- [ ] No restart or overwrite is required to fill gaps
- [ ] A failed scaffold is not reported as complete

### Case 5: Review mode and host-specific handoff

**Fixture:** Scaffolding is complete, the starting path is chosen, and the user selects `lean` review mode. No
independent review is requested during onboarding.

**Expected behavior:** Save the chosen mode and stage, confirm the recommended next step, and return a short handoff in
the current host's syntax.

**Assertions:**

- [ ] `production/review-mode.txt` records `lean`
- [ ] An existing review mode is read without asking the user to choose again
- [ ] No director gate is invoked by the start skill
- [ ] Pi receives `/skill:gamedev-<skill>`; role labels are not assumed registered agent types
- [ ] The next skill is recommended, not automatically run

## Coverage Notes

`scripts/test_scaffold_project.py` executes the filesystem contracts for engine selection, reruns, legacy guides, path
conflicts, symlinks, and relocated plugin paths. The scenarios here review the surrounding conversational instructions;
they do not establish that a conversation or engine build ran successfully.

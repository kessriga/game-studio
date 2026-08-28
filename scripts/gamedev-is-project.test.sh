#!/bin/sh
# Tests for bin/gamedev-is-project and the stage contract that depends on it.
#
# The property that matters is the negative one. Claude Code enables a plugin per scope, so every
# shipped hook runs in every repository the user opens; the predicate is the only thing standing
# between that and gamedev writing production/session-logs/, printing its banner, and enforcing its
# commit conventions inside unrelated projects. A false positive is therefore the expensive failure,
# and the case that guards against the original bug is `session-logs is not a marker`: the logging
# hooks create that directory themselves, so accepting it would let the first session in any
# repository mint permission for every session after it.
#
# Each case builds a throwaway directory containing exactly one candidate path, so a marker that
# stops working cannot be masked by another one still passing.
#
# Usage: scripts/gamedev-is-project.test.sh

set -eu

TEST_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$TEST_DIR/test/assertions.sh"
SUT="$TEST_DIR/../bin/gamedev-is-project"
STAGE="$TEST_DIR/../bin/gamedev-stage"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM

# The predicate resolves its project against CLAUDE_PROJECT_DIR when set, so an inherited value
# from the developer's own session would point every case at the wrong tree.
unset CLAUDE_PROJECT_DIR

# fixture <name> <path>... -- a fresh project directory holding only the given paths. A path
# ending in / is created as a directory, anything else as an empty file.
fixture() {
    _dir="$TMP/$1"
    shift
    rm -rf "$_dir"
    mkdir -p "$_dir"
    for _path in "$@"; do
        case "$_path" in
            */) mkdir -p "$_dir/$_path" ;;
            *) mkdir -p "$_dir/$(dirname "$_path")" && : > "$_dir/$_path" ;;
        esac
    done
    printf '%s\n' "$_dir"
}

# status_in <dir> <command> -- exit status of the command run with <dir> as the project.
status_in() {
    _dir=$1
    _cmd=$2
    (cd "$_dir" && "$_cmd" > /dev/null 2>&1) && printf '0\n' || printf '%s\n' "$?"
}

# --- Markers a skill or the /gamedev:start scaffold creates -----------------------------------

for marker in \
    ".claude/docs/technical-preferences.md" \
    "design/registry/entities.yaml" \
    "production/stage.txt" \
    "design/gdd/"; do
    dir=$(fixture "marker" "$marker")
    assert_status "recognises a project by $marker" 0 "$(status_in "$dir" "$SUT")"
done

# --- Non-projects ------------------------------------------------------------------------------

dir=$(fixture "empty")
assert_status "rejects an empty directory" 1 "$(status_in "$dir" "$SUT")"

# A plain repository with source and docs is not a game project: nothing here is gamedev's.
dir=$(fixture "unrelated" "README.md" "src/main.rs" "docs/design.md" ".claude/settings.json")
assert_status "rejects an unrelated repository" 1 "$(status_in "$dir" "$SUT")"

# The regression case. production/session-logs/ is created by the logging hooks themselves, so it
# must never qualify -- otherwise one stray session in a repo permits every session after it.
dir=$(fixture "session-logs" "production/session-logs/session-log.md")
assert_status "session-logs is not a marker" 1 "$(status_in "$dir" "$SUT")"

# Same argument for the state directory the compaction hooks read and session-stop archives.
dir=$(fixture "session-state" "production/session-state/active.md")
assert_status "session-state is not a marker" 1 "$(status_in "$dir" "$SUT")"

# --- The predicate is silent: callers read the exit status, never the output --------------------

dir=$(fixture "silence" "production/stage.txt")
assert_file_empty() {
    if [ -z "$1" ]; then pass "$2"; else fail "$2 (printed: $1)"; fi
}
assert_file_empty "$(cd "$dir" && "$SUT" 2>&1)" "prints nothing when it accepts"
dir=$(fixture "silence-no")
assert_file_empty "$(cd "$dir" && "$SUT" 2>&1 || true)" "prints nothing when it rejects"

# --- CLAUDE_PROJECT_DIR wins over the working directory ----------------------------------------

# The hooks cd into the project before calling the predicate, but /gamedev:status and the plugin
# PATH entry do not, so the variable has to be honoured from an unrelated cwd.
dir=$(fixture "via-env" "production/stage.txt")
outside=$(fixture "outside")
assert_status "honours CLAUDE_PROJECT_DIR from an unrelated cwd" 0 \
    "$(cd "$outside" && CLAUDE_PROJECT_DIR="$dir" "$SUT" > /dev/null 2>&1 && printf '0\n' || printf '%s\n' "$?")"

# --- gamedev-stage inherits the verdict ---------------------------------------------------------

# "not a game project" has to be distinguishable from "a game project at the Concept stage", or the
# SessionStart banner reappears in every repository -- which is the bug this suite exists for.
dir=$(fixture "stage-none")
assert_status "gamedev-stage fails outside a gamedev project" 1 "$(status_in "$dir" "$STAGE")"
assert_file_empty "$(cd "$dir" && "$STAGE" 2>&1 || true)" "gamedev-stage prints no stage outside a project"

dir=$(fixture "stage-concept" "design/registry/entities.yaml")
assert_status "gamedev-stage succeeds inside a gamedev project" 0 "$(status_in "$dir" "$STAGE")"
assert_contains() {
    case "$1" in
        *"$2"*) pass "$3" ;;
        *) fail "$3 (expected to contain: $2, got: $1)" ;;
    esac
}
assert_contains "$(cd "$dir" && "$STAGE")" "Concept" "gamedev-stage still reports Concept inside a project"

# The explicit override keeps working through the guard, since stage.txt is itself a marker.
dir=$(fixture "stage-override" "production/stage.txt")
printf 'Production\n' > "$dir/production/stage.txt"
assert_contains "$(cd "$dir" && "$STAGE")" "Production" "gamedev-stage honours production/stage.txt"

finish

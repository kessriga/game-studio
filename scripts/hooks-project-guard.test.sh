#!/bin/sh
# Tests that every shipped hook which touches the project stays out of repositories that are not
# gamedev projects.
#
# Claude Code enables a plugin per scope, not per project, so hooks.json runs in whatever repository
# the session was started in. Before the guard, that meant production/session-logs/ appearing in
# unrelated repos, the Game Studios banner printing over someone else's session context, and gamedev
# commit conventions applying to code that has nothing to do with a game.
#
# Two halves, and both are load-bearing. The negative half asserts each hook is completely inert
# outside a gamedev project -- exit 0, not one byte on stdout or stderr, nothing created on disk.
# The positive half asserts the same hook still does its job inside one, which is what stops a
# regression to "the guard bails everywhere" from passing this suite.
#
# notify.sh and validate-assets.sh are deliberately absent: neither resolves the project directory,
# and both already self-limit (a message-only toast; an assets/ path filter), so a guard would add
# a project lookup to hooks that currently need none.
#
# Usage: scripts/hooks-project-guard.test.sh

set -eu

TEST_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$TEST_DIR/test/assertions.sh"
CLAUDE_PLUGIN_ROOT=$(CDPATH= cd -- "$TEST_DIR/.." && pwd)
export CLAUDE_PLUGIN_ROOT
HOOKS="$CLAUDE_PLUGIN_ROOT/hooks"

# The hooks resolve their project against CLAUDE_PROJECT_DIR; an inherited value from the
# developer's own session would point every case at the wrong tree.
unset CLAUDE_PROJECT_DIR

# Fixtures run git, which must not read the developer's config: a global hooksPath, commit.gpgsign,
# or init.defaultBranch would each change the outcome here.
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM

# Every guarded hook, with the stdin Claude Code would hand it. The four that read stdin get real
# payloads; the rest get nothing, which is what their events deliver.
AGENT_JSON='{"session_id":"s","agent_id":"a","agent_type":"Explore"}'
COMMIT_JSON='{"tool_name":"Bash","tool_input":{"command":"git commit -m test"}}'
PUSH_JSON='{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}'

stdin_for() {
    case "$1" in
        log-agent.sh | log-agent-stop.sh) printf '%s' "$AGENT_JSON" ;;
        validate-commit.sh) printf '%s' "$COMMIT_JSON" ;;
        validate-push.sh) printf '%s' "$PUSH_JSON" ;;
        *) : ;;
    esac
}

# run_hook <dir> <hook> <stream> -- run the hook with <dir> as the project and echo the requested
# stream. Callers read it through a command substitution, which runs in a subshell, so the exit
# status is passed back through a file instead of a variable; hook_status reads it.
STATUS_FILE="$TMP/.hook-status"

run_hook() {
    _dir=$1
    _hook=$2
    _stream=$3
    _st=0
    # Invoked through `bash <path>`, exactly as hooks.json does -- the scripts are not marked
    # executable, so running them directly would test a path Claude Code never takes.
    case "$_stream" in
        out) _out=$(cd "$_dir" && stdin_for "$_hook" | bash "$HOOKS/$_hook" 2> /dev/null) || _st=$? ;;
        err) _out=$(cd "$_dir" && stdin_for "$_hook" | bash "$HOOKS/$_hook" 2>&1 > /dev/null) || _st=$? ;;
        both) _out=$(cd "$_dir" && stdin_for "$_hook" | bash "$HOOKS/$_hook" 2>&1) || _st=$? ;;
    esac
    printf '%s' "$_st" > "$STATUS_FILE"
    printf '%s' "$_out"
}

# hook_status -- the exit status of the most recent run_hook.
hook_status() {
    cat "$STATUS_FILE"
}

assert_empty() {
    if [ -z "$1" ]; then pass "$2"; else fail "$2 (printed: $1)"; fi
}

assert_nonempty() {
    if [ -n "$1" ]; then pass "$2"; else fail "$2 (printed nothing)"; fi
}

GUARDED="detect-gaps.sh log-agent.sh log-agent-stop.sh post-compact.sh pre-compact.sh
         session-start.sh session-stop.sh validate-commit.sh validate-push.sh"

# --- Negative: inert in a repository that is not a gamedev project ------------------------------

# A realistic unrelated repo -- a Rust crate with docs and its own .claude directory. Every path
# here is one a hook might otherwise mistake for a project of its own.
for hook in $GUARDED; do
    dir="$TMP/outside-$hook"
    mkdir -p "$dir/src" "$dir/docs" "$dir/.claude"
    : > "$dir/src/main.rs"
    : > "$dir/docs/design.md"
    : > "$dir/.claude/settings.json"
    (cd "$dir" && git init -q . && git add -A && git commit -qm init)

    output=$(run_hook "$dir" "$hook" both)
    assert_status "$hook exits 0 outside a gamedev project" 0 "$(hook_status)"
    assert_empty "$output" "$hook is silent outside a gamedev project"
    if [ -e "$dir/production" ]; then
        fail "$hook creates nothing outside a gamedev project"
    else
        pass "$hook creates nothing outside a gamedev project"
    fi
done

# --- Positive: still does its job inside a gamedev project --------------------------------------

# One project fixture, rebuilt per hook so each case sees a clean tree. design/gdd/ is both the
# marker and what validate-commit.sh inspects, so a single layout serves every case.
project() {
    _dir="$TMP/inside-$1"
    rm -rf "$_dir"
    mkdir -p "$_dir/design/gdd" "$_dir/production/session-state"
    printf '# Combat\n' > "$_dir/design/gdd/combat.md"
    (cd "$_dir" && git init -q . && git add -A && git commit -qm init)
    printf '%s\n' "$_dir"
}

dir=$(project session-start)
assert_nonempty "$(run_hook "$dir" session-start.sh out)" "session-start.sh prints its banner inside a project"

dir=$(project detect-gaps)
assert_nonempty "$(run_hook "$dir" detect-gaps.sh out)" "detect-gaps.sh reports inside a project"

dir=$(project pre-compact)
assert_nonempty "$(run_hook "$dir" pre-compact.sh out)" "pre-compact.sh dumps state inside a project"

dir=$(project post-compact)
assert_nonempty "$(run_hook "$dir" post-compact.sh out)" "post-compact.sh reports inside a project"

dir=$(project session-stop)
printf 'dirty\n' > "$dir/design/gdd/combat.md"
run_hook "$dir" session-stop.sh both > /dev/null
if [ -f "$dir/production/session-logs/session-log.md" ]; then
    pass "session-stop.sh writes its log inside a project"
else
    fail "session-stop.sh writes its log inside a project"
fi

dir=$(project log-agent)
run_hook "$dir" log-agent.sh both > /dev/null
if [ -f "$dir/production/session-logs/agent-audit.log" ]; then
    pass "log-agent.sh writes its audit line inside a project"
else
    fail "log-agent.sh writes its audit line inside a project"
fi

dir=$(project log-agent-stop)
run_hook "$dir" log-agent-stop.sh both > /dev/null
if [ -f "$dir/production/session-logs/agent-audit.log" ]; then
    pass "log-agent-stop.sh writes its audit line inside a project"
else
    fail "log-agent-stop.sh writes its audit line inside a project"
fi

# validate-commit.sh warns about GDD sections only for staged design/gdd/ files, so stage one.
dir=$(project validate-commit)
printf '# Combat\n\nNo required sections here.\n' > "$dir/design/gdd/combat.md"
(cd "$dir" && git add design/gdd/combat.md)
assert_nonempty "$(run_hook "$dir" validate-commit.sh err)" "validate-commit.sh warns inside a project"

# validate-push.sh warns when the push targets a protected branch.
dir=$(project validate-push)
assert_nonempty "$(run_hook "$dir" validate-push.sh err)" "validate-push.sh warns inside a project"


# --- Fail closed when CLAUDE_PLUGIN_ROOT is missing ----------------------------------------------

# The guard reaches the predicate through CLAUDE_PLUGIN_ROOT. Claude Code always sets it for plugin
# hooks, but if it were ever empty the path resolves to /bin/gamedev-is-project and the hook must do
# nothing *quietly* -- bash's "No such file or directory" on stderr is hook output the user sees.
# Run inside a real project so nothing but the missing predicate can be what stops the hook.
for hook in $GUARDED; do
    dir=$(project "unset-root-$hook")
    st=0
    out=$(cd "$dir" && stdin_for "$hook" | env -u CLAUDE_PLUGIN_ROOT bash "$HOOKS/$hook" 2>&1) || st=$?
    assert_status "$hook exits 0 with CLAUDE_PLUGIN_ROOT unset" 0 "$st"
    assert_empty "$out" "$hook is silent with CLAUDE_PLUGIN_ROOT unset"
done

finish

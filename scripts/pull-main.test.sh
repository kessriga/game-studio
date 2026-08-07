#!/bin/sh
# Tests for scripts/pull-main.sh.
#
# The script mutates the working tree -- it resets tracked files and deletes untracked ones -- so
# the property that matters most is the negative one: it must NEVER drop a file that is not a
# byte-identical duplicate of what is landing, and must leave the tree untouched when it cannot
# fast-forward safely. Every case below therefore checks state after the run, not just the message.
#
# Each case builds a throwaway triple: a bare `upstream.git` (the remote), a `local` clone (the tree
# under test), and a `maker` clone used only to land commits on the remote. Global and system git
# config are pointed at /dev/null so the suite does not inherit the developer's pull.rebase,
# commit.gpgsign, or hooksPath -- the two config keys that would otherwise make it pass here and fail
# on another machine. Identity comes from GIT_AUTHOR_*/GIT_COMMITTER_* env for the same reason.
#
# One fixture path carries a space (`task file.md`): that is the property that motivated writing the
# script in bash with NUL-delimited iteration, and an untested motivation rots into a "why is this
# not sh" cleanup that reintroduces the bug.
#
# Usage: scripts/pull-main.test.sh

set -eu

TEST_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$TEST_DIR/test/assertions.sh"
SUT="$TEST_DIR/pull-main.sh"

# Fixtures must not read the developer's git config: pull.rebase, commit.gpgsign and a global
# hooksPath would each change the outcome. /dev/null is an empty, writable-nowhere config.
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM

# assert_contains <haystack> <needle> <name>
assert_contains() {
    case "$1" in
        *"$2"*) pass "$3" ;;
        *) fail "$3 (expected to contain: $2)" ;;
    esac
}

# assert_absent <haystack> <needle> <name> -- the complement; only meaningful when a sibling case
# proves the needle CAN appear, so each use notes which case does.
assert_absent() {
    case "$1" in
        *"$2"*) fail "$3 (unexpectedly contained: $2)" ;;
        *) pass "$3" ;;
    esac
}

# assert_file <path> <expected-contents> <name>
assert_file() {
    if [ "$(cat "$1" 2> /dev/null)" = "$2" ]; then
        pass "$3"
    else
        fail "$3 (got: $(cat "$1" 2> /dev/null))"
    fi
}

# new_fixture -- sets ROOT, LOCAL, MAKER with a shared history commit (c0). The seed carries a.txt,
# b.txt, c.txt and a space-named file; upstream.git is the bare remote both clones point at.
new_fixture() {
    ROOT=$(mktemp -d "$TMP/fix.XXXXXX")
    git init -q -b main "$ROOT/seed"
    (
        cd "$ROOT/seed"
        printf 'a0\n' > a.txt
        printf 'b0\n' > b.txt
        printf 'c0\n' > c.txt
        printf 'seed\n' > "task file.md"
        git add -A
        git commit -q -m c0
    )
    git clone -q --bare "$ROOT/seed" "$ROOT/upstream.git"
    git clone -q "$ROOT/upstream.git" "$ROOT/local"
    git clone -q "$ROOT/upstream.git" "$ROOT/maker"
    LOCAL="$ROOT/local"
    MAKER="$ROOT/maker"
}

# land <message> -- commit whatever the caller staged in MAKER and push it to the remote, advancing
# origin/main ahead of LOCAL (whose tracking ref only moves when the script fetches).
land() {
    (
        cd "$MAKER"
        git add -A
        git commit -q -m "$1"
        git push -q origin main
    )
}

# run_pull -- runs the script in LOCAL; sets OUT (combined output) and STATUS (exit code).
run_pull() {
    set +e
    OUT=$(cd "$LOCAL" && bash "$SUT" 2>&1)
    STATUS=$?
    set -e
}

head_of() { git -C "$1" rev-parse HEAD; }
is_clean() { [ -z "$(git -C "$1" status --porcelain)" ]; }

echo "environment errors exit 2"

new_fixture
(cd "$LOCAL" && git checkout -q -b feature)
run_pull
assert_status "on the wrong branch exits 2" 2 "$STATUS"
assert_contains "$OUT" "not main" "and says which branch it wanted"

out=$(cd "$TMP" && bash "$SUT" 2>&1 || true)
assert_contains "$out" "not inside a git repository" "outside a repo exits with a clear message"

echo "already up to date, ahead, and diverged"

new_fixture
run_pull
assert_status "up to date exits 0" 0 "$STATUS"
assert_contains "$OUT" "Already up to date" "up to date says so"

new_fixture
(cd "$LOCAL" && printf 'local\n' > d.txt && git add d.txt && git commit -q -m local-only)
before=$(head_of "$LOCAL")
run_pull
assert_status "ahead of the remote exits 0" 0 "$STATUS"
assert_contains "$OUT" "nothing to pull" "ahead says nothing to pull"
assert_status "ahead leaves HEAD where it was" 0 "$([ "$before" = "$(head_of "$LOCAL")" ] && echo 0 || echo 1)"

new_fixture
(cd "$MAKER" && printf 'a-remote\n' > a.txt) && land "remote edit"
(cd "$LOCAL" && printf 'a-local\n' > a.txt && git add a.txt && git commit -q -m local-edit)
before=$(head_of "$LOCAL")
run_pull
assert_status "diverged exits 1" 1 "$STATUS"
assert_contains "$OUT" "diverged" "diverged says so"
assert_status "diverged changes nothing" 0 "$([ "$before" = "$(head_of "$LOCAL")" ] && echo 0 || echo 1)"

echo "clean fast-forward"

new_fixture
(cd "$MAKER" && printf 'a1\n' > a.txt) && land "add a1"
run_pull
assert_status "a clean fast-forward exits 0" 0 "$STATUS"
assert_contains "$OUT" "Fast-forwarded" "and reports the fast-forward"
assert_file "$LOCAL/a.txt" "a1" "the incoming change is applied"

echo "an unrelated dirty file is left untouched"

new_fixture
(cd "$MAKER" && printf 'a1\n' > a.txt) && land "add a1"
# b.txt is dirty but the incoming commit does not touch it: the script must classify it as
# not-in-the-way (skip it), fast-forward anyway, and leave the local edit intact rather than
# treating a dirty tree as a reason to refuse.
(cd "$LOCAL" && printf 'b-local\n' > b.txt)
run_pull
assert_status "fast-forwards past an unrelated dirty file" 0 "$STATUS"
assert_file "$LOCAL/a.txt" "a1" "the incoming change still applies"
assert_file "$LOCAL/b.txt" "b-local" "the unrelated local edit is preserved"

echo "byte-identical duplicates are dropped, then the fast-forward proceeds"

new_fixture
# The remote lands both a modification to the space-named file and a brand-new file...
(cd "$MAKER" && printf 'landed\n' > "task file.md" && printf 'new\n' > added.md) && land "land task work"
# ...and LOCAL already holds byte-identical copies: one as an uncommitted modification, one untracked.
(cd "$LOCAL" && printf 'landed\n' > "task file.md" && printf 'new\n' > added.md)
run_pull
assert_status "duplicate-holding tree fast-forwards, exit 0" 0 "$STATUS"
assert_contains "$OUT" "Dropping 2" "it reports dropping both duplicates"
assert_contains "$OUT" "task file.md" "the space-named path is handled"
assert_file "$LOCAL/task file.md" "landed" "the modified duplicate ends at the landed content"
assert_file "$LOCAL/added.md" "new" "the untracked duplicate ends at the landed content"
assert_status "the tree is clean afterward" 0 "$(is_clean "$LOCAL" && echo 0 || echo 1)"
assert_status "HEAD reached the remote" 0 \
    "$([ "$(head_of "$LOCAL")" = "$(git -C "$LOCAL" rev-parse origin/main)" ] && echo 0 || echo 1)"

echo "a tracked change that is NOT a duplicate aborts, untouched"

new_fixture
(cd "$MAKER" && printf 'landed\n' > "task file.md") && land "land task work"
(cd "$LOCAL" && printf 'my own edit\n' > "task file.md")
before=$(head_of "$LOCAL")
run_pull
assert_status "a non-duplicate tracked change aborts (exit 1)" 1 "$STATUS"
assert_contains "$OUT" "Cannot fast-forward" "it says it cannot fast-forward"
assert_file "$LOCAL/task file.md" "my own edit" "the real local change is untouched"
assert_status "and HEAD did not move" 0 "$([ "$before" = "$(head_of "$LOCAL")" ] && echo 0 || echo 1)"

echo "an untracked file colliding with a different incoming file aborts, untouched"

new_fixture
(cd "$MAKER" && printf 'landed\n' > collide.md) && land "add collide.md"
(cd "$LOCAL" && printf 'different\n' > collide.md)
before=$(head_of "$LOCAL")
run_pull
assert_status "a colliding untracked file aborts (exit 1)" 1 "$STATUS"
assert_contains "$OUT" "Cannot fast-forward" "it says it cannot fast-forward"
assert_file "$LOCAL/collide.md" "different" "the untracked file is untouched"
assert_status "and HEAD did not move" 0 "$([ "$before" = "$(head_of "$LOCAL")" ] && echo 0 || echo 1)"

echo "a staged-only third version is caught before any mutation (the index-view union)"

new_fixture
(cd "$MAKER" && printf 'cX\n' > c.txt) && land "land c"
# Stage a distinct blob, then restore the worktree to HEAD content by hand: the index now holds a
# third version invisible to `git diff HEAD`. Only the --cached view surfaces it, and the script must
# abort cleanly rather than reach `git merge --ff-only` and fail there.
(
    cd "$LOCAL"
    printf 'cZ\n' > c.txt
    git add c.txt
    printf 'c0\n' > c.txt
)
before=$(head_of "$LOCAL")
run_pull
assert_status "a staged third version aborts (exit 1)" 1 "$STATUS"
assert_contains "$OUT" "Cannot fast-forward" "it aborts as a blocker, before mutating"
# If the index view were missing, c.txt would never be classified, no blocker would print, and the
# run would instead die in `git merge --ff-only`. Proving that message is ABSENT is what pins the fix.
assert_absent "$OUT" "Fast-forward failed" "it did not fall through to a failed merge"
assert_status "and HEAD did not move" 0 "$([ "$before" = "$(head_of "$LOCAL")" ] && echo 0 || echo 1)"

echo ""
finish

#!/usr/bin/env bash
# Fast-forward the current branch to its upstream, discarding ONLY working-tree files that are
# byte-identical to the version landing from upstream -- and aborting untouched on anything else.
#
# Why this exists: task work lands on `main` via PR while a local session still holds the same
# work uncommitted (a modified task file, an untracked follow-up task file, an archived OpenSpec
# change). A plain `git pull` then refuses -- rebase will not run over a dirty tree, and even a
# fast-forward is blocked when the incoming commits touch those exact paths. Every time, the
# resolution is the same mechanical dance: prove each dirty path is an exact duplicate of what is
# already on the remote, drop it, and fast-forward. This script is that dance, done safely.
#
# The safety spine is one predicate: a dirty path is discardable IFF its working-tree blob hashes
# equal to the blob at that path in the fetched upstream (`git hash-object` vs `git rev-parse
# <remote>:<path>`). Equal hashes mean equal bytes, filter-consistent, binary-safe. Any path that
# is dirty, collides with the incoming change, and is NOT such a duplicate is a BLOCKER: the script
# lists every blocker and exits without touching the tree. It never guesses, never stashes, never
# switches branches.
#
# The invariant that makes "discard, then fast-forward" safe to do in that order: every blob this
# script discards is -- by the discard predicate itself -- already present in the fetched
# `<remote>/<branch>` object store. So nothing unrecoverable can be dropped, even in the residual
# case where the fast-forward then fails for a reason this script did not classify (a
# file/directory collision, say). That case prints how to recover the exact bytes.
#
# Why bash when every sibling script is `#!/bin/sh`: the paths this operates on routinely contain
# spaces (the backlog task filenames do), so it iterates git's NUL-delimited output with
# `read -r -d ''`, which POSIX sh lacks. That is the whole reason; do not "simplify" it back to sh.
#
# Usage:
#   scripts/pull-main.sh              fast-forward the current branch (must be $BRANCH) to $REMOTE
#   scripts/pull-main.sh --help       print this header
#
# Overrides (tests and non-standard setups):
#   PULL_MAIN_REMOTE   remote name to fetch and track (default: origin)
#   PULL_MAIN_BRANCH   branch that must be checked out and is fast-forwarded (default: main)
#
# Exit codes: 0 = fast-forwarded, or already up to date, or nothing to pull (ahead). 1 = could not
# fast-forward safely and nothing was changed (diverged, or blockers present). 2 = usage or
# environment error (not a repo, detached HEAD, on the wrong branch, fetch failed).

set -euo pipefail

REMOTE=${PULL_MAIN_REMOTE:-origin}
BRANCH=${PULL_MAIN_BRANCH:-main}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    # Print the header block: every comment line after the shebang up to the first non-comment.
    awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"
    exit 0
fi
if [ "$#" -gt 0 ]; then
    printf 'unknown argument: %s (try --help)\n' "$1" >&2
    exit 2
fi

# --- Preconditions -------------------------------------------------------------------------

git rev-parse --git-dir > /dev/null 2>&1 || {
    printf 'not inside a git repository\n' >&2
    exit 2
}

current=$(git symbolic-ref --quiet --short HEAD) || {
    printf 'HEAD is detached; check out %s first (this helper never switches branches)\n' "$BRANCH" >&2
    exit 2
}
if [ "$current" != "$BRANCH" ]; then
    printf 'on branch %s, not %s; check out %s first (this helper never switches branches)\n' \
        "$current" "$BRANCH" "$BRANCH" >&2
    exit 2
fi

# Plain fetch uses the remote's configured refspec, so refs/remotes/<remote>/* is guaranteed to
# update -- fetching an explicit branch can leave the tracking ref untouched under a custom refspec.
git fetch "$REMOTE" || {
    printf 'git fetch %s failed\n' "$REMOTE" >&2
    exit 2
}

REMOTE_REF="$REMOTE/$BRANCH"
git rev-parse --verify -q "$REMOTE_REF" > /dev/null || {
    printf 'no remote-tracking branch %s after fetch (wrong remote or branch name?)\n' "$REMOTE_REF" >&2
    exit 2
}

# --- Behind / ahead / diverged -------------------------------------------------------------

local_head=$(git rev-parse HEAD)
upstream=$(git rev-parse "$REMOTE_REF")
base=$(git merge-base HEAD "$REMOTE_REF")

if [ "$local_head" = "$upstream" ]; then
    printf 'Already up to date with %s.\n' "$REMOTE_REF"
    exit 0
fi
if [ "$base" = "$upstream" ]; then
    ahead=$(git rev-list --count "$REMOTE_REF..HEAD")
    printf 'Local %s is %s commit(s) ahead of %s; nothing to pull.\n' "$BRANCH" "$ahead" "$REMOTE_REF"
    exit 0
fi
if [ "$base" != "$local_head" ]; then
    printf 'Local %s has diverged from %s -- this needs a real merge or rebase, not this helper.\n' \
        "$BRANCH" "$REMOTE_REF" >&2
    printf 'Nothing changed.\n' >&2
    exit 1
fi

behind=$(git rev-list --count "HEAD..$REMOTE_REF")

# --- Classify the dirty paths that collide with the incoming fast-forward ------------------

blockers=()
discard_tracked=()
discard_untracked=()

# True if $1 is already an element of the remaining arguments.
in_list() {
    local needle=$1
    shift
    local x
    for x in "$@"; do
        [ "$x" = "$needle" ] && return 0
    done
    return 1
}

# A tracked path is dirty if it differs from HEAD in the working tree OR in the index. Both views
# are needed: staging a change and then restoring the worktree to HEAD leaves a third blob visible
# only in the index -- `git diff HEAD` misses it, but `git merge --ff-only` still refuses over it.
dirty_tracked=()
while IFS= read -r -d '' p; do
    if [ ${#dirty_tracked[@]} -eq 0 ] || ! in_list "$p" "${dirty_tracked[@]}"; then
        dirty_tracked+=("$p")
    fi
done < <(
    git diff --name-only -z HEAD
    git diff --name-only -z --cached HEAD
)

classify_tracked() {
    local p=$1
    # $p reaches `git diff` and `git checkout` below as a PATHSPEC, in which git treats `*`, `?`,
    # `[...]` and a leading `:` as active. :(literal) pins each to exactly this path so a name like
    # `a*.md` can never widen the match to a glob-sibling. This is defensive: $p always names a real
    # tracked file, so the literal is matched regardless -- but pinning it removes any dependence on
    # git's (surprising) habit of sparing siblings on checkout, and states the intent outright.
    # (hash-object, `rev-parse <tree>:<path>` and rm below take literal filesystem/tree paths, not
    # pathspecs, so they need no such guard.)
    # If the incoming range does not touch this path, the fast-forward leaves it alone -- skip it.
    if git diff --quiet HEAD "$REMOTE_REF" -- ":(literal)$p"; then
        return
    fi
    # git hash-object follows a symlink to its target, so a link whose target happens to match would
    # compare equal. Never auto-resolve one.
    if [ -L "$p" ]; then
        blockers+=("$p -- symlink colliding with an incoming change (not auto-resolved)")
        return
    fi
    if [ ! -e "$p" ]; then
        blockers+=("$p -- deleted locally but changed upstream")
        return
    fi
    local remote_blob
    remote_blob=$(git rev-parse --verify -q "$REMOTE_REF:$p") || {
        blockers+=("$p -- removed upstream but changed locally")
        return
    }
    local work_blob
    work_blob=$(git hash-object -- "$p")
    if [ "$work_blob" != "$remote_blob" ]; then
        blockers+=("$p -- differs from the incoming version (real local change)")
        return
    fi
    # Working tree equals the incoming version. Refuse if the index hides a distinct third blob
    # (neither HEAD nor the incoming), which a checkout-to-HEAD would silently drop.
    local index_blob head_blob
    index_blob=$(git rev-parse --verify -q ":$p" 2> /dev/null || true)
    head_blob=$(git rev-parse --verify -q "HEAD:$p" 2> /dev/null || true)
    if [ -n "$index_blob" ] && [ "$index_blob" != "$head_blob" ] && [ "$index_blob" != "$remote_blob" ]; then
        blockers+=("$p -- staged content differs from both HEAD and the incoming version")
        return
    fi
    discard_tracked+=("$p")
}

classify_untracked() {
    local u=$1
    # An untracked file blocks the fast-forward only if the incoming range adds a file at this exact
    # path. If it does not, the fast-forward leaves the file alone -- keep it.
    if ! git rev-parse --verify -q "$REMOTE_REF:$u" > /dev/null 2>&1; then
        return
    fi
    if [ -L "$u" ]; then
        blockers+=("$u -- untracked symlink colliding with an incoming file (not auto-resolved)")
        return
    fi
    local remote_blob work_blob
    remote_blob=$(git rev-parse "$REMOTE_REF:$u")
    work_blob=$(git hash-object -- "$u")
    if [ "$work_blob" = "$remote_blob" ]; then
        discard_untracked+=("$u")
    else
        blockers+=("$u -- untracked; upstream adds a different version at this path")
    fi
}

if [ ${#dirty_tracked[@]} -gt 0 ]; then
    for p in "${dirty_tracked[@]}"; do
        classify_tracked "$p"
    done
fi

while IFS= read -r -d '' u; do
    classify_untracked "$u"
done < <(git ls-files -z --others --exclude-standard)

# --- Abort on any blocker; otherwise discard duplicates and fast-forward -------------------

if [ ${#blockers[@]} -gt 0 ]; then
    printf 'Cannot fast-forward: %s local change(s) are not duplicates of the incoming version:\n' \
        "${#blockers[@]}" >&2
    for b in "${blockers[@]}"; do
        printf '  %s\n' "$b" >&2
    done
    printf 'Nothing changed. Resolve these (commit, stash, or discard) and re-run.\n' >&2
    exit 1
fi

dropped=$(( ${#discard_tracked[@]} + ${#discard_untracked[@]} ))
if [ "$dropped" -gt 0 ]; then
    printf 'Dropping %s working-tree file(s) that are byte-identical to what is landing:\n' "$dropped"
    if [ ${#discard_tracked[@]} -gt 0 ]; then
        for p in "${discard_tracked[@]}"; do
            printf '  (modified)  %s\n' "$p"
            git checkout HEAD -- ":(literal)$p"
        done
    fi
    if [ ${#discard_untracked[@]} -gt 0 ]; then
        for u in "${discard_untracked[@]}"; do
            printf '  (untracked) %s\n' "$u"
            rm -f -- "$u"
        done
    fi
fi

if ! git merge --ff-only "$REMOTE_REF"; then
    printf 'Fast-forward failed unexpectedly.\n' >&2
    if [ "$dropped" -gt 0 ]; then
        printf 'The %s dropped file(s) were exact duplicates of %s -- recover any with:\n' \
            "$dropped" "$REMOTE_REF" >&2
        printf '  git checkout %s -- <path>\n' "$REMOTE_REF" >&2
    fi
    exit 1
fi

printf 'Fast-forwarded %s by %s commit(s) to %s.\n' "$BRANCH" "$behind" "$REMOTE_REF"

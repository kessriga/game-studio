# Worktree evidence and post-merge handoff

Status: accepted for unreleased 0.4.1. Extends the Pi evidence rules without moving coordinator state or stage.

## Source binding

The coordinator owns progress. A submission may name a nested, coordinator-relative worktree root. Reuse the existing
project path guard to reject traversal and symlinks, including the source directory. Do not accept sibling paths or
arbitrary subfolders. Git must confirm a registered checkout in the same common repository; a matching remote is not
proof. Run Git without inherited `GIT_*` variables, shell interpolation, or new dependencies.

Persist the source's canonical root, Git directory, common directory, and filesystem identities. Validate them before
reading evidence. Directory names alone do not distinguish a removed checkout from its replacement. This binding is
local, not a portable approval for other clones. Records without a source retain their old behavior.

Submission, approval, status, and scope use the same effective source. Required catalog artifacts are not relaxed.
Approval checks the original hashes after both user prompts and under the revision lock. A changed source or revision
requires a fresh decision. An unavailable source fails closed; it never falls back to coordinator files.

## Explicit handoff

`/gamedev-workflow handoff <run>` transfers an approved run's effective reads to the coordinator only when all reviewed
run files have identical hashes and meet the run's catalog requirements. The user confirms the transfer. Recheck after
both prompts and under the lock. Copy no files, change no stage, and never rewrite reviewed hashes.

Keep the original source and evidence. Add the coordinator identity, time, user, and note to the run and record the
handoff in history. The persisted evidence permits handoff after source removal, but only within the original common
repository. Canonical edits after handoff invalidate the run.

Reopen repeatable scope on handoff rather than carry a scope decision across checkouts. Aggregate approval does not
transfer: the user must review the effective manifests again. Across mixed sources, qualify artifact coverage and hashes
by checkout. Count distinct relative paths toward catalog minimums, not duplicate copies. Require all copies to be
covered and reject differing hashes for the same path when closing scope.

These checks guard cooperative workflow records. They do not prove content quality or defend against arbitrary state
file edits and adversarial filesystem races.

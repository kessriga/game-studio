#!/usr/bin/env bash
# Validate the Claude Code plugin manifests and run the mod's tests.
# Skips with a message when the claude CLI is not on PATH, so the portable gate
# still passes on machines without Claude Code.
#
# `claude plugin test` runs every *.test.ts below the folder it is given, and
# the Pi and core tests under pi/ and workflow/ are Node tests it cannot load.
# The mod's own tests therefore run from a temporary copy holding only the
# plugin manifest, hooks/, and types/.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if ! command -v claude >/dev/null 2>&1; then
  echo "claude-check: claude is not on PATH; Claude Code checks skipped"
  exit 0
fi
claude plugin validate --strict "$root/.claude-plugin/plugin.json"
claude plugin validate --strict "$root"
stage=$(mktemp -d "${TMPDIR:-/tmp}/gamedev-mod-test.XXXXXX")
trap 'rm -rf "$stage"' EXIT
cp -R "$root/.claude-plugin" "$root/hooks" "$root/types" "$stage/"
claude plugin test "$stage"

# shellcheck shell=sh
# Shared pass/fail accounting for the scripts/*.test.sh suites, dot-sourced from each. Holds ONLY
# the counter/reporter primitives every suite duplicated; fixtures, command shims, environment
# overrides, and domain assertions stay in their owning suite.
#
# No shebang: this file is sourced, never executed. The `shell=sh` directive above is what tells
# ShellCheck the target dialect in the absence of one (SC2148); it is not a runtime concern.
TEST_PASSED=0
TEST_FAILED=0

pass() {
    TEST_PASSED=$((TEST_PASSED + 1))
    printf 'ok %s\n' "$1"
}

fail() {
    TEST_FAILED=$((TEST_FAILED + 1))
    printf 'not ok %s\n' "$1" >&2
}

assert_status() {
    _label=$1
    _expected=$2
    _actual=$3
    if [ "$_actual" -eq "$_expected" ]; then
        pass "$_label"
    else
        fail "$_label (expected $_expected, got $_actual)"
    fi
}

finish() {
    printf '%s passed, %s failed\n' "$TEST_PASSED" "$TEST_FAILED"
    [ "$TEST_FAILED" -eq 0 ]
}

# The repo's command surface: every repeated command line, defined once.
#
# This repo is mostly markdown (skills, agents, docs, backlog, OpenSpec changes) driven by Claude
# Code, so the surface is deliberately small: there is no build, no CI gate, and the .claude/hooks
# scripts are invoked by Claude Code itself, never by hand. Skill/agent quality checks are
# model-driven (/skill-test and the skill/agent testing framework in qa/), so no recipe can wrap them.
# Add a recipe when a command line starts being repeated, not before.
#
#   just          list every recipe (`just --list --unsorted`, so the order below is the order
#                 you see -- plain `just --list` sorts alphabetically instead)
#   just pull     safely fast-forward main when task work has landed via PR
#   just test     the scripts' own test suite

# List the available recipes.
default:
    @just --list --unsorted

# The safe form of the "task landed on main while I still held it uncommitted" pull -- here that
# means backlog task files and archived OpenSpec changes. It drops only working-tree files
# byte-identical to what is landing and aborts untouched on any genuine local change. bash, not
# sh, because it iterates paths that contain spaces (the backlog task filenames);
# scripts/pull-main.sh --help has the full contract.

# Fast-forward main to origin, dropping only exact duplicates of landed work.
pull:
    bash scripts/pull-main.sh

# A red here means the pull helper is broken -- fix it before trusting `just pull`, which
# mutates the working tree.

# Run the scripts' own test suite.
test:
    sh scripts/pull-main.test.sh

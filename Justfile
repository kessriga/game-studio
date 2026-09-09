# The repo's command surface: every repeated command line, defined once.
#
# This repository ships shared Markdown workflows and a Pi package. CI runs the gate below.
# Behavioral skill/role checks also live in qa/.
# Add a recipe when a command line starts being repeated, not before.
#
#   just          list every recipe (`just --list --unsorted`, so the order below is the order
#                 you see -- plain `just --list` sorts alphabetically instead)
#   just pull     safely fast-forward main when task work has landed via PR
#   just test     the scripts' own test suite

# List the available recipes.
python := "python3"
maintained_python := "scripts/scaffold-project.py scripts/generate-pi-skills.py scripts/test_scaffold_project.py scripts/test_shared_contract.py scripts/test_pi_package.py"

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
    sh scripts/gamedev-is-project.test.sh
    {{python}} -m unittest discover -s scripts -p 'test_*.py' -v

# Validate package metadata, workflows, shell syntax, and maintained Python tools.
lint:
    {{python}} scripts/check-namespacing.py
    {{python}} -m ruff check {{maintained_python}}
    {{python}} -m ruff check --preview --select PLW1514 {{maintained_python}}
    bash -c 'for script in bin/* scripts/*.sh scripts/test/*.sh; do bash -n "$script" || exit; done'

# Check formatting without rewriting existing files.
format-check:
    {{python}} -m ruff format --check {{maintained_python}}
    git diff --check

# Full portable gate; host-specific reader checks are documented in CONTRIBUTING.md.
gate: lint format-check test

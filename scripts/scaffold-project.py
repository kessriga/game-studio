#!/usr/bin/env python3
"""Add missing game-project templates while preserving user-owned files."""

import argparse
import sys
from pathlib import Path

ENGINES = ("godot", "unity", "unreal", "bevy", "undecided")
TEMPLATES = Path(__file__).resolve().parents[1] / "templates"


def selected_sources(engine):
    for source in sorted(TEMPLATES.rglob("*")):
        if not source.is_file():
            continue
        relative = source.relative_to(TEMPLATES)
        if (
            relative.parts[:2] == ("docs", "engine-reference")
            and len(relative.parts) > 3
            and relative.parts[2] != engine
        ):
            continue
        yield source, relative


def destination_files(project, engine):
    files = []
    for source, relative in selected_sources(engine):
        target = project / relative
        # Check all paths before writing anything, including dangling symlinks.
        for path in (target, *target.parents):
            if path == project.parent:
                break
            if path.is_symlink():
                raise ValueError(f"Refusing to scaffold through symlink: {path}")
            if path != target and path.exists() and not path.is_dir():
                raise ValueError(f"Expected a directory: {path}")
        if target.exists() and not target.is_file():
            raise ValueError(f"Expected a file: {target}")
        files.append((source, target))
    return files


def template_bytes(source, engine):
    content = source.read_bytes()
    if source == TEMPLATES / "AGENTS.md" and engine != "undecided":
        text = content.decode("utf-8")
        text = text.replace(
            "No engine selected yet. Use gamedev's setup-engine skill to choose and pin one.",
            f"Read `docs/engine-reference/{engine}/VERSION.md` before using engine APIs.\n"
            "Use gamedev's setup-engine skill to pin its version and configure the stack.",
        )
        content = text.encode("utf-8")
    return content


def scaffold(project, engine):
    if engine not in ENGINES:
        raise ValueError(f"Unknown engine: {engine}")
    project = project.absolute()
    # Legacy configuration must be reviewed before defaults can be introduced.
    # Even a dangling symlink counts: never follow or replace user-owned data.
    for relative in (".claude/docs/technical-preferences.md", ".claude/rules"):
        legacy = project / relative
        links = (project / ".claude", project / ".claude/docs", legacy)
        if any(path.is_symlink() for path in links) or legacy.exists():
            raise ValueError(
                f"Legacy configuration requires reviewed migration: {legacy}. "
                "See docs/migration-0.4.md in the Game Studio package; no files written."
            )
    files = destination_files(project, engine)
    created, preserved = [], []
    for source, target in files:
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            with target.open("xb") as output:
                output.write(template_bytes(source, engine))
            created.append(target.relative_to(project).as_posix())
        except FileExistsError:
            preserved.append(target.relative_to(project).as_posix())
    return created, preserved


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path, help="Game repository to scaffold")
    parser.add_argument("--engine", choices=ENGINES, default="undecided")
    args = parser.parse_args()
    try:
        created, preserved = scaffold(args.project, args.engine)
    except (OSError, ValueError) as error:
        print(f"Scaffolding failed: {error}", file=sys.stderr)
        return 1
    print(f"Created {len(created)} files; preserved {len(preserved)} existing files.")
    for name in ("AGENTS.md",):
        if name in preserved:
            print(f"Preserved {name}; review it for shared project guidance.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

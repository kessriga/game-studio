#!/usr/bin/env python3
"""Generate Pi entry points and the runtime catalog from shared sources."""

import argparse
import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "pi"


def entry_points():
    for source in sorted(ROOT.glob("skills/*/SKILL.md")):
        metadata = yaml.safe_load(source.read_text(encoding="utf-8").split("---", 2)[1])
        name = source.parent.name
        description = json.dumps(metadata["description"], ensure_ascii=False)
        yield (
            f"skills/gamedev-{name}.md",
            (
                f"---\nname: gamedev-{name}\ndescription: {description}\n---\n\n"
                f"# Game Studio: {name}\n\n"
                "Read [the host guide](../../docs/host-runtime.md), then read and follow\n"
                f"[the shared workflow](../../skills/{name}/SKILL.md).\n\n"
                "Resolve the workflow's relative paths from its own directory, not this entry point. Use the text after this command as\n"
                "the workflow's arguments.\n"
            ),
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check", action="store_true", help="Fail on missing or stale entry points"
    )
    args = parser.parse_args()
    expected = dict(entry_points())
    catalog = yaml.safe_load(
        (ROOT / "docs/workflow-catalog.yaml").read_text(encoding="utf-8")
    )
    expected["workflow-catalog.json"] = (
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    )
    if args.check:
        paths = [*OUTPUT.glob("skills/*.md"), *OUTPUT.glob("workflow-catalog.json")]
        actual = {
            p.relative_to(OUTPUT).as_posix(): p.read_text(encoding="utf-8")
            for p in paths
        }
        changed = sorted(
            name
            for name in expected.keys() | actual.keys()
            if expected.get(name) != actual.get(name)
        )
        if changed:
            print(
                "Regenerate Pi entry points; remove obsolete files: "
                + ", ".join(changed)
            )
            return 1
        print(
            f"Pi resources current: {len(expected) - 1} skill entry points and catalog"
        )
        return 0
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, content in expected.items():
        path = OUTPUT / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")
    print(
        f"Wrote {len(expected) - 1} Pi skill entry points and catalog. Run --check to detect obsolete files."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

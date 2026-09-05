#!/usr/bin/env python3
"""Verify plugin discovery with the installed Codex app server; installs nothing."""

import argparse
import json
import queue
import subprocess
import sys
import threading
from pathlib import Path


def collect_responses(stream, responses):
    for line in stream:
        responses.put(line)
    responses.put(None)


def request(process, responses, ident, method, params):
    payload = {"id": ident, "method": method, "params": params}
    process.stdin.write(json.dumps(payload) + "\n")
    process.stdin.flush()
    while True:
        line = responses.get(timeout=30)
        if line is None:
            raise RuntimeError("Codex exited before responding; check its stderr above")
        value = json.loads(line)
        if value.get("id") != ident:
            continue
        if "error" in value:
            raise RuntimeError(str(value["error"]))
        return value["result"]


def inspect_plugin(root):
    with subprocess.Popen(
        ["codex", "app-server"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    ) as process:
        responses = queue.Queue()
        reader = threading.Thread(
            target=collect_responses, args=(process.stdout, responses), daemon=True
        )
        reader.start()
        try:
            request(
                process,
                responses,
                1,
                "initialize",
                {
                    "clientInfo": {"name": "gamedev-validation", "version": "0.2.0"},
                    "capabilities": {"experimentalApi": True},
                },
            )
            result = request(
                process,
                responses,
                2,
                "plugin/read",
                {
                    "pluginName": "gamedev",
                    "marketplacePath": str(root / ".agents/plugins/marketplace.json"),
                },
            )
            return result["plugin"]
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            reader.join(timeout=5)


def verify(root, plugin):
    expected = {
        f"gamedev:{path.parent.name}" for path in root.glob("skills/*/SKILL.md")
    }
    actual = {skill["name"] for skill in plugin["skills"]}
    if actual != expected:
        raise ValueError(
            f"Skill discovery mismatch: missing {expected - actual}; extra {actual - expected}"
        )
    if plugin["summary"]["availability"] != "AVAILABLE":
        raise ValueError("Codex does not consider this plugin available")
    if plugin.get("hooks"):
        raise ValueError("Codex unexpectedly discovered hooks")
    for skill in plugin["skills"]:
        path = Path(skill["path"])
        if (
            not path.is_file()
            or not (path.parent / "../../docs/host-runtime.md").is_file()
        ):
            raise ValueError(f"Broken installed skill reference: {path}")
    print(
        f"Codex recognized gamedev and all {len(actual)} skills. No plugin was installed."
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1]
    )
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        verify(root, inspect_plugin(root))
    except (OSError, RuntimeError, ValueError, queue.Empty) as error:
        print(f"Codex verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

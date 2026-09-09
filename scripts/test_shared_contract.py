"""Shared workflows remain host-neutral and resolve their instruction sources."""

import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


class SharedContractTests(unittest.TestCase):
    def test_all_skills_and_roles_load_the_host_guide(self):
        for pattern in ("skills/*/SKILL.md", "agents/*.md"):
            for path in sorted(ROOT.glob(pattern)):
                with self.subTest(path=path.relative_to(ROOT)):
                    front, body = path.read_text(encoding="utf-8").split("---", 2)[1:]
                    metadata = yaml.safe_load(front)
                    expected = (
                        path.parent.name if path.name == "SKILL.md" else path.stem
                    )
                    self.assertEqual(metadata["name"], expected)
                    self.assertIsInstance(metadata["description"], str)
                    self.assertTrue(metadata["description"])
                    link = re.search(r"\[the host guide\]\(([^)]+)\)", body)
                    assert link is not None
                    self.assertLess(link.start(), 150)
                    self.assertEqual(
                        (path.parent / link[1]).resolve(),
                        ROOT / "docs/host-runtime.md",
                    )
                    self.assertEqual(set(metadata), {"name", "description"})

    def test_shared_bodies_use_neutral_paths_and_delegation(self):
        retired = re.compile(
            r"\.claude|\.codex|CLAUDE\.md|subagent_type|AskUserQuestion|"
            r"TodoWrite|Task\s+tool|via\s+Task|/gamedev:|\$gamedev:"
        )
        for path in [
            *ROOT.glob("skills/*/SKILL.md"),
            *ROOT.glob("agents/*.md"),
        ]:
            with self.subTest(path=path.relative_to(ROOT)):
                text = path.read_text(encoding="utf-8")
                self.assertIsNone(
                    retired.search(text),
                    "Retired runtime reference",
                )
                for target in re.findall(r"\*\*Primary role:\*\* Read `([^`]+)`", text):
                    self.assertTrue((path.parent / target).is_file(), target)

    def test_retired_distribution_resources_are_absent(self):
        for name in (
            ".claude-plugin",
            ".codex-plugin",
            ".agents/plugins",
            "hooks",
            "CLAUDE.md",
        ):
            self.assertFalse(any(p.is_file() for p in (ROOT / name).rglob("*")))
            self.assertFalse((ROOT / name).is_file())
        self.assertFalse(list((ROOT / "templates").rglob("CLAUDE.md")))


if __name__ == "__main__":
    unittest.main()

"""Keep Pi entry points and their shared distribution consistent."""

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


class PiPackageTests(unittest.TestCase):
    def test_entry_points_are_current(self):
        subprocess.run(
            [sys.executable, str(ROOT / "scripts/generate-pi-skills.py"), "--check"],
            check=True,
            cwd=ROOT,
        )

    def test_pi_manifest_and_release_match(self):
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(package["version"], lock["version"])
        self.assertEqual(package["version"], lock["packages"][""]["version"])
        self.assertIn("pi-package", package["keywords"])
        self.assertEqual(
            package["pi"],
            {
                "skills": ["./pi/skills"],
                "extensions": ["./pi/extension.ts"],
                "prompts": [],
                "themes": [],
            },
        )
        self.assertTrue(
            {"test", "typecheck", "format:check"} <= package["scripts"].keys()
        )
        self.assertFalse(
            {"preinstall", "install", "postinstall", "prepare"}
            & package["scripts"].keys()
        )
        self.assertNotIn("dependencies", package)
        for path in (
            "skills/",
            "agents/",
            "templates/",
            "docs/",
            "bin/",
            "scripts/scaffold-project.py",
        ):
            self.assertIn(path, package["files"])

    def test_all_pi_names_and_links_are_valid(self):
        sources = sorted(ROOT.glob("skills/*/SKILL.md"))
        entries = sorted(ROOT.glob("pi/skills/*.md"))
        self.assertEqual(len(entries), len(sources))
        for source, entry in zip(sources, entries, strict=True):
            with self.subTest(entry=entry.name):
                front, body = entry.read_text(encoding="utf-8").split("---", 2)[1:]
                metadata = yaml.safe_load(front)
                self.assertEqual(set(metadata), {"name", "description"})
                self.assertEqual(metadata["name"], f"gamedev-{source.parent.name}")
                self.assertRegex(metadata["name"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                self.assertLessEqual(len(metadata["name"]), 64)
                self.assertTrue(0 < len(metadata["description"]) <= 1024)
                links = re.findall(r"\]\(([^)]+)\)", body)
                self.assertEqual(
                    [(entry.parent / link).resolve() for link in links],
                    [ROOT / "docs/host-runtime.md", source],
                )
                for link in links:
                    self.assertTrue((entry.parent / link).is_file())


if __name__ == "__main__":
    unittest.main()

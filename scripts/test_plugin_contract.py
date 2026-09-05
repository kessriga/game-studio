"""Keep both plugin hosts pointed at the complete shared distribution."""

import json
import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


class PluginContractTests(unittest.TestCase):
    def test_manifests_and_marketplaces_agree(self):
        claude = json.loads((ROOT / ".claude-plugin/plugin.json").read_text())
        codex = json.loads((ROOT / ".codex-plugin/plugin.json").read_text())
        marketplace = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
        catalog = json.loads((ROOT / ".agents/plugins/marketplace.json").read_text())
        entry = catalog["plugins"][0]
        self.assertEqual(claude["name"], codex["name"])
        self.assertEqual(entry["name"], codex["name"])
        self.assertEqual(claude["version"], codex["version"])
        self.assertEqual(marketplace["plugins"][0]["version"], codex["version"])
        self.assertEqual(marketplace["metadata"]["version"], codex["version"])
        self.assertEqual((ROOT / entry["source"]["path"]).resolve(), ROOT)
        self.assertEqual((ROOT / codex["skills"]).resolve(), ROOT / "skills")
        self.assertEqual(entry["policy"]["installation"], "AVAILABLE")
        self.assertEqual(entry["policy"]["authentication"], "ON_INSTALL")
        self.assertTrue(entry["category"])

    def test_all_skills_and_roles_load_the_host_guide(self):
        for pattern in ("skills/*/SKILL.md", "agents/*.md"):
            for path in sorted(ROOT.glob(pattern)):
                with self.subTest(path=path.relative_to(ROOT)):
                    front, body = path.read_text().split("---", 2)[1:]
                    metadata = yaml.safe_load(front)
                    expected = (
                        path.parent.name if path.name == "SKILL.md" else path.stem
                    )
                    self.assertEqual(metadata["name"], expected)
                    self.assertIsInstance(metadata["description"], str)
                    self.assertTrue(metadata["description"])
                    link = re.search(r"\[the host guide\]\(([^)]+)\)", body)
                    self.assertIsNotNone(link)
                    self.assertLess(link.start(), 150)
                    self.assertEqual(
                        (path.parent / link[1]).resolve(), ROOT / "docs/host-runtime.md"
                    )
                    self.assertNotIn("context", metadata)

    def test_claude_hooks_are_explicit_and_codex_does_not_discover_them(self):
        claude = json.loads((ROOT / ".claude-plugin/plugin.json").read_text())
        codex = json.loads((ROOT / ".codex-plugin/plugin.json").read_text())
        self.assertNotIn("hooks", codex)
        self.assertFalse((ROOT / "hooks/hooks.json").exists())
        hooks = json.loads((ROOT / claude["hooks"]).read_text())["hooks"]
        self.assertEqual(
            set(hooks),
            {
                "SessionStart",
                "PreToolUse",
                "PostToolUse",
                "Notification",
                "PreCompact",
                "PostCompact",
                "Stop",
                "SubagentStart",
                "SubagentStop",
            },
        )
        scripts = []
        for groups in hooks.values():
            for group in groups:
                for hook in group["hooks"]:
                    match = re.fullmatch(
                        r'bash "\$\{CLAUDE_PLUGIN_ROOT\}/(hooks/[^" ]+)"',
                        hook["command"],
                    )
                    self.assertIsNotNone(match)
                    self.assertTrue((ROOT / match[1]).is_file())
                    scripts.append(match[1])
        self.assertEqual(len(scripts), 11)
        self.assertEqual(len(set(scripts)), 11)

    def test_claude_project_files_import_shared_guides(self):
        paths = [ROOT / "CLAUDE.md", ROOT / "qa/CLAUDE.md"]
        paths.extend((ROOT / "templates").rglob("CLAUDE.md"))
        for path in paths:
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertEqual(path.read_text(), "@AGENTS.md\n")
                self.assertTrue(path.with_name("AGENTS.md").is_file())


if __name__ == "__main__":
    unittest.main()

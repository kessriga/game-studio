"""Behavioral tests for fresh projects, reruns, and preserved user files."""

import importlib.util
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("scaffold-project.py")
SPEC = importlib.util.spec_from_file_location("scaffold_project", SCRIPT)
scaffold_project = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scaffold_project)


class ScaffoldTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gamedev project ")
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name) / "game with spaces"

    def test_each_engine_gets_only_its_reference_and_shared_guides(self):
        for engine in scaffold_project.ENGINES:
            with self.subTest(engine=engine):
                project = self.project / engine
                created, preserved = scaffold_project.scaffold(project, engine)
                self.assertTrue(created)
                self.assertFalse(preserved)
                for directory in ("", "src", "design", "docs"):
                    base = project / directory
                    self.assertEqual((base / "CLAUDE.md").read_text(), "@AGENTS.md\n")
                    self.assertGreater(len((base / "AGENTS.md").read_text()), 100)
                references = project / "docs/engine-reference"
                actual = {path.name for path in references.iterdir() if path.is_dir()}
                self.assertEqual(actual, set() if engine == "undecided" else {engine})
                guide = (project / "AGENTS.md").read_text()
                if engine == "undecided":
                    self.assertIn("No engine selected yet", guide)
                    self.assertNotIn("godot/VERSION.md", guide)
                else:
                    self.assertIn(f"{engine}/VERSION.md", guide)
                    self.assertTrue((references / engine / "VERSION.md").is_file())
                self.assertEqual(
                    len(list((project / ".claude/rules").glob("*.md"))), 11
                )

    def test_rerun_preserves_bytes_and_adds_missing_nested_guide(self):
        scaffold_project.scaffold(self.project, "bevy")
        guide = self.project / "AGENTS.md"
        guide.write_bytes(b"User instructions\r\nDo not change.\r\n")
        nested = self.project / "src/AGENTS.md"
        nested.unlink()
        created, preserved = scaffold_project.scaffold(self.project, "bevy")
        self.assertEqual(created, ["src/AGENTS.md"])
        self.assertIn("AGENTS.md", preserved)
        self.assertEqual(guide.read_bytes(), b"User instructions\r\nDo not change.\r\n")
        self.assertTrue(nested.is_file())

    def test_old_project_marker_does_not_prevent_adding_guidance(self):
        preferences = self.project / ".claude/docs/technical-preferences.md"
        preferences.parent.mkdir(parents=True)
        preferences.write_text("Existing engine settings")
        (self.project / "CLAUDE.md").write_text("Existing Claude guide")
        created, preserved = scaffold_project.scaffold(self.project, "unity")
        self.assertIn("AGENTS.md", created)
        self.assertIn("CLAUDE.md", preserved)
        self.assertEqual(preferences.read_text(), "Existing engine settings")
        self.assertEqual(
            (self.project / "CLAUDE.md").read_text(), "Existing Claude guide"
        )

    def test_existing_backlog_guide_is_preserved(self):
        self.project.mkdir()
        guide = self.project / "AGENTS.md"
        guide.write_text("Existing Backlog instructions")
        _, preserved = scaffold_project.scaffold(self.project, "undecided")
        self.assertIn("AGENTS.md", preserved)
        self.assertEqual(guide.read_text(), "Existing Backlog instructions")

    def test_invalid_engine_creates_nothing(self):
        with self.assertRaises(ValueError):
            scaffold_project.scaffold(self.project, "../unity")
        self.assertFalse(self.project.exists())

    def test_conflicting_directory_fails_before_any_copy(self):
        self.project.mkdir()
        (self.project / "src").write_text("User file")
        with self.assertRaises(ValueError):
            scaffold_project.scaffold(self.project, "godot")
        self.assertEqual(list(self.project.iterdir()), [self.project / "src"])

    def test_symlink_cannot_write_outside_project(self):
        self.project.mkdir()
        outside = Path(self.temp.name) / "outside"
        outside.mkdir()
        try:
            (self.project / "design").symlink_to(outside, target_is_directory=True)
        except OSError as error:
            self.skipTest(f"Symlinks unavailable: {error}")
        with self.assertRaises(ValueError):
            scaffold_project.scaffold(self.project, "godot")
        self.assertFalse(list(outside.iterdir()))
        self.assertFalse((self.project / "AGENTS.md").exists())

    def test_scaffold_and_stage_from_unrelated_working_directory(self):
        result = subprocess.run(
            [
                os.sys.executable,
                str(SCRIPT.resolve()),
                str(self.project),
                "--engine",
                "bevy",
            ],
            cwd=self.temp.name,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertIn("preserved 0", result.stdout)
        stage = SCRIPT.resolve().parents[1] / "bin/gamedev-stage"
        env = {
            key: value
            for key, value in os.environ.items()
            if key != "CLAUDE_PROJECT_DIR"
        }
        result = subprocess.run(
            ["bash", str(stage)],
            cwd=self.project,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertEqual(result.stdout, "Concept\n")

    def test_relocated_plugin_resolves_its_own_templates(self):
        plugin = Path(self.temp.name) / "installed plugin"
        (plugin / "scripts").mkdir(parents=True)
        script = plugin / "scripts/scaffold-project.py"
        shutil.copy2(SCRIPT, script)
        shutil.copytree(SCRIPT.resolve().parents[1] / "templates", plugin / "templates")
        subprocess.run(
            [os.sys.executable, str(script), str(self.project), "--engine", "unreal"],
            cwd=self.temp.name,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertIn("unreal/VERSION.md", (self.project / "AGENTS.md").read_text())
        self.assertTrue(
            (self.project / "docs/engine-reference/unreal/VERSION.md").is_file()
        )


if __name__ == "__main__":
    unittest.main()

"""Behavioral tests for fresh projects, reruns, and preserved user files."""

import importlib.util
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("scaffold-project.py")
SPEC = importlib.util.spec_from_file_location("scaffold_project", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
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
                for retired in (
                    ".claude",
                    ".codex",
                    ".claude-plugin",
                    ".codex-plugin",
                    ".agents",
                ):
                    self.assertFalse((project / retired).exists())
                self.assertTrue((project / "docs/technical-preferences.md").is_file())
                for directory in ("", "src", "design", "docs"):
                    base = project / directory
                    self.assertFalse((base / "CLAUDE.md").exists())
                    self.assertGreater(
                        len((base / "AGENTS.md").read_text(encoding="utf-8")), 100
                    )
                references = project / "docs/engine-reference"
                actual = {path.name for path in references.iterdir() if path.is_dir()}
                self.assertEqual(actual, set() if engine == "undecided" else {engine})
                guide = (project / "AGENTS.md").read_text(encoding="utf-8")
                if engine == "undecided":
                    self.assertIn("No engine selected yet", guide)
                    self.assertNotIn("godot/VERSION.md", guide)
                else:
                    self.assertIn(f"{engine}/VERSION.md", guide)
                    self.assertTrue((references / engine / "VERSION.md").is_file())
                self.assertEqual(len(list((project / "docs/rules").glob("*.md"))), 11)

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

    def test_legacy_configuration_blocks_before_any_write(self):
        for marker in (
            ".claude/docs/technical-preferences.md",
            ".claude/rules/custom.md",
        ):
            for neutral_exists in (False, True):
                with self.subTest(marker=marker, neutral_exists=neutral_exists):
                    project = self.project / str(neutral_exists) / marker.split("/")[1]
                    legacy = project / marker
                    legacy.parent.mkdir(parents=True)
                    legacy.write_bytes(b"User settings\r\nEngine: custom\r\n")
                    if neutral_exists:
                        neutral = project / "docs/technical-preferences.md"
                        neutral.parent.mkdir(parents=True)
                        neutral.write_bytes(b"Conflicting neutral settings\n")
                    before = {
                        p.relative_to(project): p.read_bytes()
                        for p in project.rglob("*")
                        if p.is_file()
                    }
                    with self.assertRaisesRegex(ValueError, "reviewed migration"):
                        scaffold_project.scaffold(project, "unity")
                    after = {
                        p.relative_to(project): p.read_bytes()
                        for p in project.rglob("*")
                        if p.is_file()
                    }
                    self.assertEqual(before, after)
                    self.assertFalse((project / "AGENTS.md").exists())

    def test_reviewed_migration_preserves_custom_settings_and_rules(self):
        legacy = self.project / ".claude/docs/technical-preferences.md"
        legacy.parent.mkdir(parents=True)
        legacy.write_bytes(b"Custom engine version\r\n")
        rules = self.project / ".claude/rules"
        rules.mkdir()
        (rules / "gameplay-code.md").write_bytes(b"Custom rules\r\n")
        guide = self.project / "CLAUDE.md"
        guide.write_bytes(b"User-owned legacy guide\r\n")
        settings = self.project / ".claude/settings.local.json"
        settings.write_bytes(b'{"custom": true}\n')
        worktree_file = self.project / ".claude/worktrees/other-game/src/user.txt"
        worktree_file.parent.mkdir(parents=True)
        worktree_file.write_bytes(b"Do not touch this other worktree\r\n")
        # Simulate the user-reviewed move documented in migration-0.4.md.
        (self.project / "docs").mkdir()
        legacy.rename(self.project / "docs/technical-preferences.md")
        rules.rename(self.project / "docs/rules")
        _, preserved = scaffold_project.scaffold(self.project, "godot")
        self.assertIn("docs/technical-preferences.md", preserved)
        self.assertIn("docs/rules/gameplay-code.md", preserved)
        self.assertEqual(
            (self.project / "docs/technical-preferences.md").read_bytes(),
            b"Custom engine version\r\n",
        )
        self.assertEqual(
            (self.project / "docs/rules/gameplay-code.md").read_bytes(),
            b"Custom rules\r\n",
        )
        self.assertEqual(guide.read_bytes(), b"User-owned legacy guide\r\n")

        self.assertEqual(settings.read_bytes(), b'{"custom": true}\n')
        self.assertEqual(
            worktree_file.read_bytes(), b"Do not touch this other worktree\r\n"
        )

    def test_dangling_legacy_links_block_before_any_write(self):
        for relative in (
            ".claude",
            ".claude/docs",
            ".claude/rules",
            ".claude/docs/technical-preferences.md",
        ):
            with self.subTest(relative=relative):
                project = self.project / relative.replace("/", "-")
                legacy = project / relative
                legacy.parent.mkdir(parents=True)
                legacy.symlink_to(project / "missing", target_is_directory=True)
                with self.assertRaisesRegex(ValueError, "reviewed migration"):
                    scaffold_project.scaffold(project, "godot")
                self.assertTrue(legacy.is_symlink())
                self.assertFalse((project / "AGENTS.md").exists())
                self.assertFalse((project / "docs/technical-preferences.md").exists())

    def test_existing_backlog_guide_is_preserved(self):
        self.project.mkdir()
        guide = self.project / "AGENTS.md"
        guide.write_text("Existing Backlog instructions", encoding="utf-8")
        _, preserved = scaffold_project.scaffold(self.project, "undecided")
        self.assertIn("AGENTS.md", preserved)
        self.assertEqual(
            guide.read_text(encoding="utf-8"), "Existing Backlog instructions"
        )

    def test_invalid_engine_creates_nothing(self):
        with self.assertRaises(ValueError):
            scaffold_project.scaffold(self.project, "../unity")
        self.assertFalse(self.project.exists())

    def test_conflicting_directory_fails_before_any_copy(self):
        self.project.mkdir()
        (self.project / "src").write_text("User file", encoding="utf-8")
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
                sys.executable,
                str(SCRIPT.resolve()),
                str(self.project),
                "--engine",
                "bevy",
            ],
            cwd=self.temp.name,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
        )
        self.assertIn("preserved 0", result.stdout)
        stage = SCRIPT.resolve().parents[1] / "bin/gamedev-stage"
        # Retired host variables must not redirect stage reporting.
        env = dict(os.environ, CLAUDE_PROJECT_DIR=self.temp.name)
        bash_path = shutil.which("bash")
        assert bash_path is not None, "Bash is required for stage reporting"
        result = subprocess.run(
            [bash_path, stage.as_posix()],
            cwd=self.project,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )
        self.assertEqual(
            result.returncode,
            0,
            f"Bash: {bash_path}\nstdout: {result.stdout}\nstderr: {result.stderr}",
        )
        self.assertEqual(result.stdout, "Concept\n")

    def test_relocated_plugin_resolves_its_own_templates(self):
        plugin = Path(self.temp.name) / "installed plugin"
        (plugin / "scripts").mkdir(parents=True)
        script = plugin / "scripts/scaffold-project.py"
        shutil.copy2(SCRIPT, script)
        shutil.copytree(SCRIPT.resolve().parents[1] / "templates", plugin / "templates")
        subprocess.run(
            [sys.executable, str(script), str(self.project), "--engine", "unreal"],
            cwd=self.temp.name,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
        )
        self.assertIn(
            "unreal/VERSION.md",
            (self.project / "AGENTS.md").read_text(encoding="utf-8"),
        )
        self.assertTrue(
            (self.project / "docs/engine-reference/unreal/VERSION.md").is_file()
        )


if __name__ == "__main__":
    unittest.main()

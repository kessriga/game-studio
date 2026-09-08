#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const sdk = fileURLToPath(
  import.meta.resolve("@earendil-works/pi-coding-agent"),
);
const temporary = await mkdtemp(join(tmpdir(), "gamedev packed check "));

try {
  assert.ok(
    process.env.npm_execpath,
    "Run npm run check:pack so the portable npm CLI path is available.",
  );
  const { stdout } = await execute(
    process.execPath,
    [
      process.env.npm_execpath,
      "pack",
      "--json",
      "--pack-destination",
      temporary,
    ],
    { cwd: root },
  );
  const [packed] = JSON.parse(stdout);
  const paths = new Set(packed.files.map((file) => file.path));
  for (const required of [
    "pi/extension.ts",
    "pi/workflow-catalog.json",
    "pi/skills/gamedev-start.md",
    "skills/start/SKILL.md",
    "templates/AGENTS.md",
    "scripts/scaffold-project.py",
  ]) {
    assert.ok(paths.has(required), `Missing packed resource: ${required}`);
  }
  for (const path of paths) {
    assert.doesNotMatch(
      path,
      /^(node_modules|\.venv|\.git|\.worktrees|backlog|openspec)\//,
    );
    assert.doesNotMatch(path, /\.test\.ts$/);
  }
  await execute("tar", [
    "-xzf",
    join(temporary, packed.filename),
    "-C",
    temporary,
  ]);
  const check = join(dirname(fileURLToPath(import.meta.url)), "check-pi.mjs");
  const result = await execute(process.execPath, [
    check,
    sdk,
    join(temporary, "package"),
  ]);
  process.stdout.write(result.stdout);
  console.log(
    `Packed distribution: ${paths.size} files; relocated discovery passed.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

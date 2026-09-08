#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(
  process.argv[3] ?? join(dirname(fileURLToPath(import.meta.url)), ".."),
);
const temporary = await mkdtemp(join(tmpdir(), "gamedev pi check "));

try {
  // Keep native discovery away from user resources and credentials.
  process.env.HOME = temporary;
  process.env.USERPROFILE = temporary;
  process.env.PI_OFFLINE = "1";
  process.env.PI_CODING_AGENT_DIR = join(temporary, "agent");
  const sdk = process.argv[2]
    ? pathToFileURL(resolve(process.argv[2])).href
    : "@earendil-works/pi-coding-agent";
  const { DefaultResourceLoader, SettingsManager } = await import(sdk);
  const agentDir = join(temporary, "agent");
  const cwd = join(temporary, "game");
  const otherSkill = join(agentDir, "skills", "code-review");
  await mkdir(otherSkill, { recursive: true });
  await mkdir(cwd);
  await writeFile(
    join(otherSkill, "SKILL.md"),
    "---\nname: code-review\ndescription: Unrelated review skill.\n---\n",
  );
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager: SettingsManager.inMemory({ packages: [root] }),
  });
  await loader.reload();
  const { skills, diagnostics } = loader.getSkills();
  assert.deepEqual(diagnostics, [], "Pi skill diagnostics");
  const shared = (await readdir(join(root, "skills"))).sort();
  const bundled = skills.filter((skill) => skill.name.startsWith("gamedev-"));
  assert.deepEqual(
    bundled.map((skill) => skill.name).sort(),
    shared.map((name) => `gamedev-${name}`),
  );
  assert.equal(
    skills.length,
    shared.length + 1,
    "Only entry points plus the unrelated skill should load",
  );
  assert.ok(skills.some((skill) => skill.name === "code-review"));
  for (const skill of bundled) {
    const text = await readFile(skill.filePath, "utf8");
    for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
      assert.ok(
        (await readFile(resolve(dirname(skill.filePath), link), "utf8"))
          .length > 0,
      );
    }
  }
  const roles = (await readdir(join(root, "agents"))).filter((name) =>
    name.endsWith(".md"),
  );
  assert.equal(roles.length, 53);
  for (const name of roles) {
    assert.match(
      await readFile(join(root, "agents", name), "utf8"),
      /\[the host guide\]\(\.\.\/docs\/host-runtime\.md\)/,
    );
  }
  assert.deepEqual(loader.getExtensions().errors, []);
  assert.equal(loader.getExtensions().extensions.length, 1);
  const extension = loader.getExtensions().extensions[0];
  assert.ok(extension.tools.has("gamedev_workflow"));
  assert.ok(extension.commands.has("gamedev-workflow"));
  assert.ok(extension.handlers.has("session_shutdown"));
  assert.equal(
    loader.getPrompts().prompts.length,
    0,
    "Role guides must not become bare prompt commands",
  );
  assert.equal(loader.getThemes().themes.length, 0);
  console.log(
    `Pi native reader: ${bundled.length} skills, ${roles.length} role guides, one progress extension; no collisions.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

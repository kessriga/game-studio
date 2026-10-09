import type { On } from "claude-code";
import { expect, mock, test } from "claude-code/testing";
import {
  checkAsset,
  checkStagedFiles,
  isGitCommit,
  isGitPush,
  pathsToRead,
  protectedPushTarget,
} from "./validators.ts";

test("git commit and push are recognised at the start of a command or chain", () => {
  expect(isGitCommit("git commit -m 'x'")).toBe(true);
  expect(isGitCommit("cd game && git commit -am x")).toBe(true);
  expect(isGitCommit("git log --oneline")).toBe(false);
  expect(isGitCommit("echo 'git commit'")).toBe(false);
  expect(isGitPush("git push -u origin feat/x")).toBe(true);
  expect(isGitPush("git pull")).toBe(false);
});

test("a protected push is found by name or by the current branch", () => {
  expect(protectedPushTarget("git push origin main", "feat/x")).toBe("main");
  expect(protectedPushTarget("git push", "develop")).toBe("develop");
  expect(protectedPushTarget("git push origin HEAD:master", "feat/x")).toBe(
    "master",
  );
  expect(
    protectedPushTarget("git push -u origin feat/main-menu", "feat/main-menu"),
  ).toBe(undefined);
});

test("only checked paths are read", () => {
  expect(
    pathsToRead([
      "design/gdd/combat.md",
      "assets/data/items.json",
      "src/gameplay/hit.gd",
      "src/ui/menu.gd",
      "README.md",
      "assets/sprites/hero.png",
    ]),
  ).toEqual([
    "design/gdd/combat.md",
    "assets/data/items.json",
    "src/gameplay/hit.gd",
    "src/ui/menu.gd",
  ]);
});

test("invalid JSON denies the commit and the other checks are notes", () => {
  const finding = checkStagedFiles([
    { path: "assets/data/items.json", content: "{ not json" },
    {
      path: "design/gdd/combat.md",
      content: "# Combat\n## Overview\n## Player Fantasy\n",
    },
    { path: "src/gameplay/hit.gd", content: "var damage = 10\n" },
    { path: "src/ui/menu.gd", content: "# TODO fix later\n" },
    { path: "src/ui/ok.gd", content: "# TODO(kess) fix later\n" },
    { path: "src/missing.gd", content: undefined },
  ]);
  expect(finding.deny).toContain("assets/data/items.json");
  expect(finding.notes).toEqual([
    "DESIGN: design/gdd/combat.md is missing sections: Detailed, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria.",
    "CODE: src/gameplay/hit.gd may hardcode gameplay values; move tunables to data files.",
    "STYLE: src/ui/menu.gd has TODO/FIXME/HACK without an owner; use TODO(name).",
  ]);
  expect(
    checkStagedFiles([{ path: "assets/data/items.json", content: '{"a":1}' }]),
  ).toEqual({ notes: [] });
});

test("asset names must be lowercase with underscores and data files valid JSON", () => {
  expect(checkAsset("assets/sprites/Hero Idle.png", undefined).notes).toEqual([
    "NAMING: assets/sprites/Hero Idle.png should be lowercase with underscores (got Hero Idle.png).",
  ]);
  expect(checkAsset("assets\\data\\items.json", "nope").notes).toEqual([
    "FORMAT: assets\\data\\items.json is not valid JSON; fix it before continuing.",
  ]);
  expect(checkAsset("assets/data/items.json", '{"ok":true}').notes).toEqual([]);
});

const ok = (stdout: string) => ({
  value: {
    exitCode: 0,
    stdout,
    stderr: "",
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
});

function boot(
  on: On,
  files: Record<string, string>,
  staged: string[],
  branch = "feat/x",
) {
  mock.clock(on);
  on("fs.exists", (_, e) => ({
    value: e.path === "/game/production/stage.txt",
  }));
  on("fs.read", (_, e) => {
    const text = files[e.path];
    return text === undefined ? { deny: "ENOENT" } : { value: text };
  });
  on("process.run", (_, e) => {
    const [bin, sub] = e.argv;
    if (bin === "git" && sub === "diff")
      return ok(staged.map((path) => `${path}\0`).join(""));
    if (bin === "git" && sub === "rev-parse") return ok(`${branch}\n`);
    return ok(JSON.stringify({ ok: true, snapshot: null }));
  });
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("tool.check", () => ({ decision: "allow" as const }));
  on("ui.status", () => ({ value: undefined }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
}

const bashRan = {
  result: { stdout: "", stderr: "", interrupted: false },
  text: "",
};

test("a commit with invalid staged JSON is denied; warnings become notes on the result", async ($, on) => {
  const files: Record<string, string> = {
    "/game/assets/data/items.json": "{ nope",
    "/game/src/ui/menu.gd": "# TODO later\n",
  };
  boot(on, files, ["assets/data/items.json", "src/ui/menu.gd"]);
  let ran = 0;
  on("tool.call", { tool: "Bash" }, () => {
    ran += 1;
    return bashRan;
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const denied = await $.tool.call({
    tool: "Bash",
    command: "git commit -m 'items'",
  });
  expect(denied.deny).toContain("assets/data/items.json");
  expect(ran).toBe(0);
  files["/game/assets/data/items.json"] = '{"ok":true}';
  const allowed = await $.tool.call({
    tool: "Bash",
    command: "git commit -m 'items'",
  });
  expect(allowed.deny).toBe(undefined);
  expect(ran).toBe(1);
  expect(allowed.context?.[0]).toContain(
    "STYLE: src/ui/menu.gd has TODO/FIXME/HACK without an owner",
  );
});

test("a push to main leaves a reminder and never denies; other commands pass silently", async ($, on) => {
  boot(on, {}, [], "main");
  on("tool.call", { tool: "Bash" }, () => bashRan);
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const push = await $.tool.call({ tool: "Bash", command: "git push" });
  expect(push.deny).toBe(undefined);
  expect(push.context?.[0]).toContain("protected branch main");
  const other = await $.tool.call({ tool: "Bash", command: "ls" });
  expect(other.context).toBe(undefined);
});

test("writing a badly named asset leaves notes after the write", async ($, on) => {
  boot(on, {}, []);
  on("tool.call", { tool: "Write" }, () => ({
    result: {
      type: "create" as const,
      filePath: "x",
      content: "",
      structuredPatch: [],
    },
    text: "ok",
  }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const written = await $.tool.call({
    tool: "Write",
    file_path: "assets/data/Enemy Stats.json",
    content: "{ nope",
  });
  expect(written.context?.[0]).toContain(
    "NAMING: assets/data/Enemy Stats.json",
  );
  expect(written.context?.[0]).toContain(
    "FORMAT: assets/data/Enemy Stats.json is not valid JSON",
  );
  const plain = await $.tool.call({
    tool: "Write",
    file_path: "src/a.gd",
    content: "x",
  });
  expect(plain.context).toBe(undefined);
});

test("commit -a also reads unstaged tracked changes and git -C is recognised", async ($, on) => {
  const files: Record<string, string> = {
    "/game/assets/data/items.json": "{ nope",
  };
  mock.clock(on);
  on("fs.exists", (_, e) => ({
    value: e.path === "/game/production/stage.txt",
  }));
  on("fs.read", (_, e) => {
    const text = files[e.path];
    return text === undefined ? { deny: "ENOENT" } : { value: text };
  });
  const listings: string[] = [];
  on("process.run", (_, e) => {
    const [bin, sub, ...rest] = e.argv;
    if (bin === "git" && sub === "diff") {
      listings.push(e.argv.join(" "));
      return ok(rest.includes("--cached") ? "" : "assets/data/items.json\0");
    }
    if (bin === "git" && sub === "rev-parse") return ok("feat/x\n");
    return ok(JSON.stringify({ ok: true, snapshot: null }));
  });
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("tool.check", () => ({ decision: "allow" as const }));
  on("ui.status", () => ({ value: undefined }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  on("tool.call", { tool: "Bash" }, () => bashRan);
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const plain = await $.tool.call({ tool: "Bash", command: "git commit -m x" });
  expect(plain.deny).toBe(undefined);
  const all = await $.tool.call({
    tool: "Bash",
    command: "git -C /game commit -am x",
  });
  expect(all.deny).toContain("assets/data/items.json");
  expect(
    listings.some(
      (line) => line === "git diff --cached --name-only -z --relative",
    ),
  ).toBe(true);
  expect(
    listings.some((line) => line === "git diff --name-only -z --relative"),
  ).toBe(true);
});

test("push destinations follow the refspec and Windows asset paths normalise", () => {
  expect(protectedPushTarget("git push origin feature:feature", "main")).toBe(
    undefined,
  );
  expect(protectedPushTarget("git push origin HEAD:main", "feat/x")).toBe(
    "main",
  );
  expect(
    protectedPushTarget("git push -u origin refs/heads/develop", "feat/x"),
  ).toBe("develop");
  expect(protectedPushTarget("git push --force-with-lease", "master")).toBe(
    "master",
  );
  expect(
    checkAsset("C:\\game\\assets\\sprites\\Hero.png", undefined).notes.length,
  ).toBe(1);
});

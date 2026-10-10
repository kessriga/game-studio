import { fixturePath } from "./paths.test-support.ts";
import { expect, test } from "claude-code/testing";
import {
  handoffNote,
  hasRootGuide,
  newNestedGuides,
  promptContext,
  rootGuideFile,
  touchedPath,
} from "./context.ts";

test("the root guide is detected directly or through an @ import", () => {
  expect(hasRootGuide([], "/game")).toBe(false);
  expect(
    hasRootGuide(
      [{ path: "/game/AGENTS.md", kind: "project", content: "# Game" }],
      "/game/",
    ),
  ).toBe(true);
  expect(
    hasRootGuide(
      [{ path: "/game/CLAUDE.md", kind: "project", content: "@AGENTS.md\n" }],
      "/game",
    ),
  ).toBe(true);
  expect(
    hasRootGuide(
      [{ path: "/game/CLAUDE.md", kind: "project", content: "See AGENTS.md" }],
      "/game",
    ),
  ).toBe(false);
  expect(rootGuideFile("/game", "# Game")).toEqual({
    path: "/game/AGENTS.md",
    kind: "project",
    content: "# Game",
  });
});

test("nested guides are reported once and the root guide never", () => {
  const seen = new Set<string>();
  const found = [
    { dir: "/game", content: "root" },
    { dir: "/game/src", content: "src rules" },
  ];
  expect(newNestedGuides(found, "/game", seen)).toEqual([
    { dir: "/game/src", content: "src rules" },
  ]);
  expect(newNestedGuides(found, "/game", seen)).toEqual([]);
  expect(
    newNestedGuides(
      [...found, { dir: "/game/src/ui", content: "ui" }],
      "/game",
      seen,
    ),
  ).toEqual([{ dir: "/game/src/ui", content: "ui" }]);
});

test("the prompt context carries the summary and the tracking guidance", () => {
  const text = promptContext("Current: nothing");
  expect(text.startsWith("Current: nothing\n")).toBe(true);
  expect(text).toContain("mcp__gamedev__workflow");
  expect(text).toContain("/gamedev-workflow");
});

test("the handoff note is bounded and names the file", () => {
  expect(handoffNote("short")).toContain("short");
  const long = handoffNote("x".repeat(9000));
  expect(long.length).toBeLessThan(8300);
  expect(long).toContain(
    "[truncated; read production/session-state/active.md for the rest]",
  );
});

test("file tool inputs yield the touched path", () => {
  expect(touchedPath({ file_path: "src/a.gd" })).toBe("src/a.gd");
  expect(touchedPath({ notebook_path: "n.ipynb" })).toBe("n.ipynb");
  expect(touchedPath({ command: "ls" })).toBe(undefined);
});

import type { InstructionFile, On } from "claude-code";
import { mock } from "claude-code/testing";

const ok = (stdout: string) => ({
  value: {
    exitCode: 0,
    stdout,
    stderr: "",
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
});

function boot(on: On, files: Record<string, string>) {
  mock.clock(on);
  on("fs.exists", (_, e) => ({
    value: fixturePath(e.path) === "/game/production/stage.txt",
  }));
  on("fs.read", (_, e) => {
    const text = files[fixturePath(e.path)];
    return text === undefined ? { deny: "ENOENT" } : { value: text };
  });
  on("process.run", () => ok(JSON.stringify({ ok: true, snapshot: null })));
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("tool.check", () => ({ decision: "allow" as const }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
}

test("each prompt carries the workflow summary and tracking guidance", async ($, on) => {
  boot(on, {});
  let context: readonly string[] | undefined;
  on("prompt.submit", (_, e) => {
    context = e.context;
    return { text: e.text };
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  await $.prompt.submit({
    text: "hi",
    wait: false,
    origin: { kind: "composer" },
  });
  expect(context?.length).toBe(1);
  expect(context?.[0]).toContain("No saved game phase. Run /gamedev:start");
  expect(context?.[0]).toContain("mcp__gamedev__workflow");
});

test("the root AGENTS.md joins the instruction files unless a CLAUDE.md already imports it", async ($, on) => {
  boot(on, {
    "/game/AGENTS.md": "# Game project\nRead docs/technical-preferences.md.",
  });
  const claudeMd = {
    path: "/game/CLAUDE.md",
    kind: "project" as const,
    content: "@AGENTS.md",
  };
  let served: InstructionFile[] = [];
  on("prompt.context", (_, e) => ({
    blocks: e.blocks,
    instructionFiles: served,
  }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const added = await $.prompt.context({ blocks: [], instructionFiles: [] });
  expect(added.instructionFiles?.length).toBe(1);
  expect(fixturePath(added.instructionFiles?.[0]?.path)).toBe(
    "/game/AGENTS.md",
  );
  expect(added.instructionFiles?.[0]).toMatchObject({
    kind: "project",
    content: "# Game project\nRead docs/technical-preferences.md.",
  });
  served = [claudeMd];
  const kept = await $.prompt.context({
    blocks: [],
    instructionFiles: [claudeMd],
  });
  expect(kept.instructionFiles).toEqual([claudeMd]);
});

test("a nested AGENTS.md is shown once after a file beneath it is touched", async ($, on) => {
  boot(on, {});
  on("fs.ancestors", (_, e) => ({
    value: fixturePath(e.of).startsWith("/game/src/")
      ? [
          {
            dir: e.below ?? "/game",
            name: "AGENTS.md",
            content: "root",
            parts: [],
          },
          {
            dir: `${e.below ?? "/game"}/src`,
            name: "AGENTS.md",
            content: "Source rules",
            parts: [],
          },
        ]
      : [],
  }));
  on("tool.call", { tool: "Read" }, () => ({
    result: {
      type: "text" as const,
      file: {
        filePath: "x",
        content: "",
        numLines: 0,
        startLine: 1,
        totalLines: 0,
      },
    },
    text: "",
  }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const first = await $.tool.call({
    tool: "Read",
    file_path: "/game/src/player.gd",
  });
  expect(first.context?.length).toBe(1);
  expect(fixturePath(first.context?.[0])).toContain(
    "Nested project guide /game/src/AGENTS.md",
  );
  expect(first.context?.[0]).toContain("Source rules");
  const second = await $.tool.call({
    tool: "Read",
    file_path: "/game/src/enemy.gd",
  });
  expect(second.context).toBe(undefined);
  const outside = await $.tool.call({
    tool: "Read",
    file_path: "/game/README.md",
  });
  expect(outside.context).toBe(undefined);
});

test("Windows paths are normalised for guide detection", () => {
  expect(
    hasRootGuide(
      [{ path: "C:\\game\\AGENTS.md", kind: "project", content: "# G" }],
      "C:\\game",
    ),
  ).toBe(true);
  expect(
    hasRootGuide(
      [
        {
          path: "C:\\game\\src\\CLAUDE.md",
          kind: "project",
          content: "@AGENTS.md",
        },
      ],
      "C:\\game",
    ),
  ).toBe(false);
  const seen = new Set<string>();
  expect(
    newNestedGuides(
      [{ dir: "C:\\game\\src", content: "src" }],
      "C:\\game",
      seen,
    ),
  ).toEqual([{ dir: "C:/game/src", content: "src" }]);
});

test("prompt context without instruction files is left untouched", async ($, on) => {
  boot(on, { "/game/AGENTS.md": "# Game" });
  on("prompt.context", (_, e) => ({ blocks: e.blocks }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const result = await $.prompt.context({
    blocks: [{ name: "currentDate", text: "today" }],
  });
  expect(result).toEqual({ blocks: [{ name: "currentDate", text: "today" }] });
});

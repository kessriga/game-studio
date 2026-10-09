import { expect, test } from "claude-code/testing";
import { NODE_HINT, parseWorkflowReply, workflowArgv } from "./project.ts";

const ran = (exitCode: number, stdout: string, stderr = "") => ({
  exitCode,
  stdout,
  stderr,
  isStdoutTruncated: false,
  isStderrTruncated: false,
});

test("the argument vector runs the CLI through node with the revision", () => {
  const argv = workflowArgv("/plugins/gamedev", {
    root: "/game",
    action: "start",
    actor: "agent:s1",
    revision: 3,
  });
  expect(argv).toEqual([
    "node",
    "--experimental-strip-types",
    "/plugins/gamedev/workflow/cli.ts",
    "start",
    "--root",
    "/game",
    "--actor",
    "agent:s1",
    "--revision",
    "3",
  ]);
  expect(
    workflowArgv("/p", { root: "/g", action: "status", actor: "a" }),
  ).not.toContain("--revision");
});

test("a JSON reply is returned as the core wrote it", () => {
  expect(parseWorkflowReply(ran(0, '{"ok":true,"snapshot":null}\n'))).toEqual({
    ok: true,
    snapshot: null,
  });
  expect(
    parseWorkflowReply(ran(1, '{"ok":false,"error":"Read status first."}')),
  ).toEqual({
    ok: false,
    error: "Read status first.",
  });
});

test("a node that cannot start reports the requirement, not a crash", () => {
  const reply = parseWorkflowReply({ failed: new Error("spawn node ENOENT") });
  expect(reply.ok).toBe(false);
  if (!reply.ok) {
    expect(reply.error).toContain(NODE_HINT);
    expect(reply.error).toContain("ENOENT");
  }
});

test("an old node that rejects the flag reports its first stderr line", () => {
  const reply = parseWorkflowReply(
    ran(9, "", "node: bad option: --experimental-strip-types\nmore\n"),
  );
  expect(reply.ok).toBe(false);
  if (!reply.ok)
    expect(reply.error).toBe(
      `${NODE_HINT} node: bad option: --experimental-strip-types`,
    );
});

test("output that is not JSON is reported, bounded", () => {
  const reply = parseWorkflowReply(ran(0, "x".repeat(500)));
  expect(reply.ok).toBe(false);
  if (!reply.ok) expect(reply.error.length).toBeLessThan(260);
});

test("the mod runs the CLI in the project and leaves other directories alone", async ($, on) => {
  const calls: (readonly string[])[] = [];
  on("fs.exists", (_, e) => ({
    value: e.path === "/game/production/stage.txt",
  }));
  on("process.run", (_, e) => {
    calls.push(e.argv);
    return {
      value: ran(0, JSON.stringify({ ok: true, snapshot: null })),
    };
  });
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("ui.status", () => ({ value: undefined }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  expect(calls.length).toBe(1);
  expect(calls[0]?.slice(3, 6)).toEqual(["status", "--root", "/game"]);
});

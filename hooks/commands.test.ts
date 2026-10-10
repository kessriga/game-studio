import type { Engine } from "claude-code/testing";
import type { On } from "claude-code";
import { fixturePath } from "./paths.test-support.ts";
import { expect, test } from "claude-code/testing";
import { parseWorkflowCommand, toolBody, USAGE } from "./commands.ts";

test("command arguments parse into actions, ids and notes", () => {
  expect(parseWorkflowCommand("")).toEqual({ action: "status" });
  expect(parseWorkflowCommand("  panel ")).toEqual({ action: "panel" });
  expect(
    parseWorkflowCommand("approve r1 Checked the GDD and the review"),
  ).toEqual({
    action: "approve",
    id: "r1",
    note: "Checked the GDD and the review",
  });
  expect(
    parseWorkflowCommand("finish asset-spec All twelve assets are specified"),
  ).toEqual({
    action: "finish",
    id: "asset-spec",
    note: "All twelve assets are specified",
  });
  expect(parseWorkflowCommand("gate Jam scope; art bible deferred")).toEqual({
    action: "gate",
    note: "Jam scope; art bible deferred",
  });
});

test("a missing note or id shows usage instead of acting", () => {
  expect(parseWorkflowCommand("approve r1")).toEqual({ usage: USAGE });
  expect(parseWorkflowCommand("approve")).toEqual({ usage: USAGE });
  expect(parseWorkflowCommand("gate")).toEqual({ usage: USAGE });
  expect(parseWorkflowCommand("explode now")).toEqual({ usage: USAGE });
});

test("the tool body carries only the update fields", () => {
  expect(
    toolBody({
      action: "submit",
      revision: 2,
      run: "r1",
      note: "n",
      evidence: ["a.md"],
      extra: 1,
    }),
  ).toEqual({
    run: "r1",
    note: "n",
    evidence: ["a.md"],
  });
});

type Call = { argv: readonly string[]; stdin: string };

/** Run /gamedev-workflow as the person would type it. */
function workflow($: Engine, args: string) {
  return $.command.run({
    command: "gamedev-workflow",
    args,
    origin: { kind: "composer" },
    presentation: { isFullscreen: false, columns: 120 },
  });
}

/** Answer the engine's ask dialog, which $.ui.ask raises as an AskUserQuestion tool call. */
function answerWith(questions: readonly { question: string }[], label: string) {
  const answers: Record<string, string> = {};
  for (const item of questions) answers[item.question] = label;
  return { result: { questions, answers }, text: label };
}

const view = {
  phase: "concept",
  label: "Concept",
  index: 1,
  count: 7,
  nextPhase: "systems-design",
  nextLabel: "Systems Design",
  revision: 2,
  steps: [
    {
      id: "game-concept",
      name: "Game Concept Document",
      command: "gamedev:brainstorm",
      required: true,
      repeatable: false,
      aggregate: false,
      status: "submitted",
      complete: false,
      artifacts: ["design/gdd/game-concept.md"],
    },
    {
      id: "asset-spec",
      name: "Asset Specs",
      command: "gamedev:asset-spec",
      required: true,
      repeatable: true,
      aggregate: true,
      status: "not started",
      complete: false,
      artifacts: [],
    },
  ],
  runs: [
    {
      id: "r1",
      phase: "concept",
      step: "game-concept",
      subject: "",
      status: "submitted",
      note: "Concept ready.",
      evidence: ["design/gdd/game-concept.md"],
      source: "coordinator checkout",
    },
  ],
  blockers: ["game-concept", "asset-spec"],
};

function boot(on: On, calls: Call[], failingAction?: string) {
  on("fs.exists", (_, e) => ({
    value: fixturePath(e.path) === "/game/production/stage.txt",
  }));
  on("process.run", (_, e) => {
    calls.push({ argv: e.argv, stdin: e.init?.stdin ?? "" });
    const action = e.argv[3];
    if (action === failingAction)
      return {
        value: {
          exitCode: 1,
          stdout: JSON.stringify({
            ok: false,
            error: "Workflow state changed. Read status again before retrying.",
          }),
          stderr: "",
          isStdoutTruncated: false,
          isStderrTruncated: false,
        },
      };
    const body =
      action === "history"
        ? {
            ok: true,
            snapshot: view,
            history: [
              {
                at: "t",
                actor: "user:s1",
                action: "approve",
                note: "concept/r1: ok",
              },
            ],
          }
        : action === "block"
          ? { ok: false, error: "Run not found in the current phase." }
          : { ok: true, snapshot: view };
    return {
      value: {
        exitCode: 0,
        stdout: JSON.stringify(body),
        stderr: "",
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    };
  });
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("tool.check", () => ({ decision: "allow" as const }));
  on("session.id", () => ({ value: "s1" }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
}

test("the tool reads status and records updates with the agent actor", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls);
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const status = await $.tool.call({
    tool: "mcp__gamedev__workflow",
    action: "status",
  });
  expect(status.text).toContain("State revision: 2");
  expect(status.text).toContain("r1: game-concept  — Concept ready.");
  const started = await $.tool.call({
    tool: "mcp__gamedev__workflow",
    action: "start",
    revision: 2,
    step: "asset-spec",
    subject: "hero",
    note: "Spec the hero.",
  });
  expect(started.isError).toBe(undefined);
  const start = calls.find((call) => call.argv[3] === "start");
  expect(start?.argv[4]).toBe("--root");
  expect(fixturePath(start?.argv[5])).toBe("/game");
  expect(start?.argv.slice(6)).toEqual([
    "--actor",
    "agent:s1",
    "--revision",
    "2",
  ]);
  expect(JSON.parse(start?.stdin ?? "{}")).toEqual({
    step: "asset-spec",
    subject: "hero",
    note: "Spec the hero.",
  });
  const noRevision = await $.tool.call({
    tool: "mcp__gamedev__workflow",
    action: "submit",
    run: "r1",
    note: "x",
  });
  expect(noRevision.isError).toBe(true);
  expect(noRevision.text).toContain("revision");
  const refused = await $.tool.call({
    tool: "mcp__gamedev__workflow",
    action: "block",
    revision: 2,
    run: "r9",
    note: "x",
  });
  expect(refused.isError).toBe(true);
  expect(refused.text).toBe("Run not found in the current phase.");
});

test("approve asks the user and records with the user actor and revision", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls);
  let asked = "";
  on("tool.call", { tool: "AskUserQuestion" }, (_, e) => {
    asked = e.questions[0]?.question ?? "";
    return answerWith(e.questions, "Confirm");
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const { text } = await workflow(
    $,
    "approve r1 Checked the GDD and the review",
  );
  expect(asked).toContain("Approve r1? Concept ready.");
  expect(asked).toContain("Evidence: design/gdd/game-concept.md");
  expect(text).toBe(
    "Approval recorded. Changed evidence will require a new review.",
  );
  const approve = calls.find((call) => call.argv[3] === "approve");
  expect(approve?.argv.slice(6)).toEqual([
    "--actor",
    "user:s1",
    "--revision",
    "2",
  ]);
  expect(JSON.parse(approve?.stdin ?? "{}")).toEqual({
    run: "r1",
    note: "Checked the GDD and the review",
  });
});

test("cancelling, a missing note, and a wrong id record nothing", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls);
  let asks = 0;
  on("tool.call", { tool: "AskUserQuestion" }, (_, e) => {
    asks += 1;
    return answerWith(e.questions, "Cancel");
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  expect((await workflow($, "approve r1")).text).toContain("Usage:");
  expect((await workflow($, "approve r2 Looks fine")).text).toBe(
    "Run not found in this phase.",
  );
  expect((await workflow($, "finish game-concept All done")).text).toBe(
    "Choose a repeatable step in this phase.",
  );
  expect((await workflow($, "approve r1 Looks fine")).text).toBe(
    "Cancelled; nothing recorded.",
  );
  expect(asks).toBe(1);
  expect(calls.filter((call) => call.argv[3] !== "status").length).toBe(0);
  const history = await workflow($, "history");
  expect(history.text).toBe("t approve (user:s1): concept/r1: ok");
});

test("gate names the unresolved steps and finish names the sources", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls);
  const questions: string[] = [];
  on("tool.call", { tool: "AskUserQuestion" }, (_, e) => {
    questions.push(e.questions[0]?.question ?? "");
    return answerWith(e.questions, "Confirm");
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const gate = await workflow($, "gate Jam build; art bible deferred");
  expect(questions[0]).toContain(
    "Unresolved: Game Concept Document, Asset Specs. Record an override toward Systems Design?",
  );
  expect(gate.text).toContain("Decision recorded; stage unchanged.");
  expect(
    JSON.parse(calls.find((call) => call.argv[3] === "gate")?.stdin ?? "{}"),
  ).toEqual({ note: "Jam build; art bible deferred" });
  const finish = await workflow(
    $,
    "finish asset-spec All twelve assets are specified",
  );
  expect(questions[1]).toContain(
    "Confirm ALL intended subjects for asset-spec are complete",
  );
  expect(finish.text).toContain("Approval recorded.");
  expect(
    JSON.parse(calls.find((call) => call.argv[3] === "finish")?.stdin ?? "{}"),
  ).toEqual({ step: "asset-spec", note: "All twelve assets are specified" });
});

test("a state change during the dialog returns the core's error unchanged", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls, "approve");
  on("tool.call", { tool: "AskUserQuestion" }, (_, e) =>
    answerWith(e.questions, "Confirm"),
  );
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const before = calls.length;
  const { text } = await workflow($, "approve r1 Checked it");
  expect(text).toBe(
    "Workflow state changed. Read status again before retrying.",
  );
  expect(calls.length).toBeGreaterThan(before);
});

test("a model-run approval command is refused before any dialog", async ($, on) => {
  const calls: Call[] = [];
  boot(on, calls);
  let asks = 0;
  on("tool.call", { tool: "AskUserQuestion" }, (_, e) => {
    asks += 1;
    return answerWith(e.questions, "Confirm");
  });
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const { text } = await $.command.run({
    command: "gamedev-workflow",
    args: "approve r1 Looks fine",
    origin: { kind: "plugin", name: "other" },
    presentation: { isFullscreen: false, columns: 120 },
  });
  expect(text).toContain("typed by the user");
  expect(asks).toBe(0);
  expect(calls.filter((call) => call.argv[3] === "approve").length).toBe(0);
});

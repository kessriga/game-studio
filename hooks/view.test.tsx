import { fixturePath } from "./paths.test-support.ts";
import { expect, test } from "claude-code/testing";
import type { Tracking, WorkflowView } from "../types";
import { claudeCommand, focusOf, statusText, summaryText } from "./view.tsx";

const view: WorkflowView = {
  phase: "concept",
  label: "Concept",
  index: 1,
  count: 7,
  nextPhase: "systems-design",
  nextLabel: "Systems Design",
  revision: 2,
  steps: [
    {
      id: "brainstorm",
      name: "Brainstorm",
      command: "gamedev:brainstorm",
      required: false,
      repeatable: false,
      aggregate: false,
      status: "not started",
      complete: false,
      artifacts: [],
    },
    {
      id: "engine-setup",
      name: "Engine Setup",
      command: "gamedev:setup-engine",
      required: true,
      repeatable: false,
      aggregate: false,
      status: "approved",
      complete: true,
      artifacts: ["docs/technical-preferences.md"],
    },
    {
      id: "game-concept",
      name: "Game Concept Document",
      command: "gamedev:brainstorm",
      required: true,
      repeatable: false,
      aggregate: false,
      status: "missing artifact",
      complete: false,
      artifacts: [],
    },
  ],
  runs: [],
  blockers: ["game-concept"],
};

test("commands render in Claude Code syntax", () => {
  expect(claudeCommand("gamedev:brainstorm")).toBe("/gamedev:brainstorm");
  expect(claudeCommand(undefined)).toBe(undefined);
});

test("the focus names the previous approved step and the next required one", () => {
  expect(focusOf(view)).toEqual({
    previous: "Engine Setup",
    current: "/gamedev:brainstorm · Game Concept Document",
    next: "Systems Design",
  });
  const tracking: Tracking = { kind: "view", view };
  expect(statusText(tracking)).toBe(
    "Game Studio · Concept 1/7 · Current: /gamedev:brainstorm · Game Concept Document · Next: Systems Design",
  );
});

test("an active run becomes the current line and the summary lists it", () => {
  const active: WorkflowView = {
    ...view,
    runs: [
      {
        id: "r1",
        phase: "concept",
        step: "game-concept",
        subject: "",
        status: "submitted",
        note: "Draft ready.",
        evidence: ["design/gdd/game-concept.md"],
        source: "worktree /g/.worktrees/x",
      },
    ],
  };
  const focus = focusOf(active);
  expect(focus.current).toBe(
    "r1 game-concept (awaiting user approval; worktree evidence)",
  );
  const summary = summaryText({ kind: "view", view: active });
  expect(summary).toContain("State revision: 2");
  expect(summary).toContain(
    "r1: game-concept  — Draft ready. [source: worktree /g/.worktrees/x]",
  );
  expect(summary).toContain("Artifact presence is not approval.");
});

test("no phase and errors have their own texts", () => {
  expect(statusText({ kind: "none" })).toBe(undefined);
  expect(
    statusText({ kind: "error", message: "Unknown saved phase: Alpha." }),
  ).toBe("Game Studio: Unknown saved phase: Alpha.");
  expect(summaryText({ kind: "none" })).toContain("/gamedev:start");
});

test("the pane lists the phase steps after a session start in a game project", async ($, on) => {
  on("fs.exists", (_, e) => ({
    value: fixturePath(e.path) === "/game/production/stage.txt",
  }));
  on("process.run", () => ({
    value: {
      exitCode: 0,
      stdout: JSON.stringify({ ok: true, snapshot: view }),
      stderr: "",
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }));
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  let status: string | undefined;
  on("ui.status", (_, e) => {
    status = e.text;
    return { value: undefined };
  });
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  expect(status).toContain("Game Studio · Concept 1/7");
  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({
      plugin: "gamedev",
      surface,
      component: "Pane",
      requestId: "gamedev",
      props: {
        title: "Game Studio",
        isFocused: false,
        bodyColumns: 60,
        placement: "dock",
        scroll: { offset: 0, bodyRows: 20 },
        view: {},
      },
    });
    expect(
      await ui.find({ type: "Text", text: /Game Studio · Concept \(1\/7\)/ }),
    ).toBeDefined();
    expect(
      await ui.find({ type: "Text", text: /✓ Engine Setup/ }),
    ).toBeDefined();
    expect(
      await ui.find({
        type: "Text",
        text: /missing artifact · \/gamedev:brainstorm/,
      }),
    ).toBeDefined();
    expect(
      await ui.find({ type: "Text", text: /Next phase: Systems Design/ }),
    ).toBeDefined();
    await ui.unmount();
  }
});

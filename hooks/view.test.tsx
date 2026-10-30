import { fixturePath } from "./paths.test-support.ts";
import { expect, test } from "claude-code/testing";
import type { WorkflowView } from "../types";
import {
  claudeCommand,
  focusOf,
  pendingActions,
  progressText,
  summaryText,
} from "./view.tsx";

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
      finishable: false,
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
      finishable: false,
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
      finishable: false,
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
        superseded: false,
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
  expect(summaryText({ kind: "none" })).toContain("/gamedev:start");
  expect(
    summaryText({ kind: "error", message: "Unknown saved phase: Alpha." }),
  ).toContain("Workflow tracking is unavailable: Unknown saved phase: Alpha.");
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
  let statusCalls = 0;
  on("ui.status", () => {
    statusCalls += 1;
    return { value: undefined };
  });
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  expect(statusCalls).toBe(0);
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
      await ui.find({
        type: "Text",
        text: /Concept · phase 1\/7 ● ○ ○ ○ ○ ○ ○/,
      }),
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

const systems: WorkflowView = {
  ...view,
  phase: "systems-design",
  label: "Systems Design",
  index: 2,
  progress: {
    label: "systems",
    status: "Approved",
    done: 5,
    total: 48,
    focus: { label: "MVP", done: 5, total: 28 },
  },
  steps: [
    {
      id: "design-system",
      name: "System GDDs",
      command: "gamedev:design-system",
      required: true,
      repeatable: true,
      aggregate: false,
      status: "5 approved; scope open",
      complete: false,
      finishable: false,
      artifacts: [],
    },
  ],
  runs: [
    ["r16", "approved", "worktree /g/.worktrees/old", true],
    [
      "r18",
      "approved",
      "coordinator /g (handed off from /g/.worktrees/a)",
      false,
    ],
    ["r25", "approved", "worktree /g/.worktrees/camera", false],
    ["r27", "submitted", "worktree /g/.worktrees/connectors", false],
  ].map(([id, status, source, superseded]) => ({
    id: id as string,
    phase: "systems-design",
    step: "design-system",
    subject:
      (
        { r16: "Time Scale", r18: "Time Scale", r25: "Camera" } as Record<
          string,
          string
        >
      )[id as string] ?? "Connectors",
    status: status as string,
    note: "Done.",
    evidence: [],
    source: source as string,
    superseded: superseded as boolean,
  })),
  blockers: ["design-system"],
};

test("the progress text names the focus tier and the whole index", () => {
  expect(progressText(systems.progress)).toBe(
    "MVP systems 5/28 approved · all 5/48",
  );
  expect(
    progressText({
      label: "stories",
      status: "Implemented",
      done: 2,
      total: 3,
    }),
  ).toBe("stories 2/3 implemented");
  expect(progressText(undefined)).toBe(undefined);
});

test("waiting actions skip replaced and handed-off runs and steps the core cannot finish", () => {
  expect(pendingActions(systems)).toEqual([
    {
      kind: "approve",
      what: "design-system · Connectors",
      command: "/gamedev-workflow approve r27 <what you verified>",
    },
    {
      kind: "handoff",
      what: "design-system · Camera (once its branch merges)",
      command: "/gamedev-workflow handoff r25 <note>",
    },
  ]);
  const done: WorkflowView = {
    ...systems,
    runs: [],
    steps: systems.steps.map((step) => ({ ...step, finishable: true })),
  };
  expect(pendingActions(done)).toEqual([
    {
      kind: "finish",
      what: "System GDDs",
      command: "/gamedev-workflow finish design-system <scope you confirmed>",
    },
  ]);
});

test("the summary leaves out replaced runs and names what waits on the user", () => {
  const summary = summaryText({ kind: "view", view: systems });
  expect(summary).toContain("Progress: MVP systems 5/28 approved · all 5/48");
  expect(summary).not.toContain("r16:");
  expect(summary).toContain("r25: design-system Camera");
  expect(summary).toContain(
    "Waiting on the user: approve design-system · Connectors (/gamedev-workflow approve r27 <what you verified>)",
  );
});

test("the pane shows the systems count and what needs the user", async ($, on) => {
  on("fs.exists", (_, e) => ({
    value: fixturePath(e.path) === "/game/production/stage.txt",
  }));
  on("process.run", () => ({
    value: {
      exitCode: 0,
      stdout: JSON.stringify({ ok: true, snapshot: systems }),
      stderr: "",
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }));
  on("command.register", (_, e) => ({ value: { command: e.name } }));
  on("tool.register", (_, e) => ({
    value: { tool: `mcp__gamedev__${e.name}` },
  }));
  on("session.start", (_, e) => ({ cwd: e.cwd }));
  await $.session.start({
    cwd: "/game",
    surface: "terminal",
    isInteractive: false,
  });
  const ui = await $.ui.mount({
    plugin: "gamedev",
    surface: "terminal",
    component: "Pane",
    requestId: "gamedev",
    props: {
      title: "Game Studio",
      isFocused: false,
      bodyColumns: 60,
      placement: "dock",
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  });
  expect(
    await ui.find({
      type: "Text",
      text: /MVP systems 5\/28 approved · all 5\/48/,
    }),
  ).toBeDefined();
  expect(await ui.find({ type: "Text", text: /Needs you/ })).toBeDefined();
  expect(
    await ui.find({ type: "Text", text: /handoff r25 <note>/ }),
  ).toBeDefined();
  expect(await ui.find({ type: "Text", text: /r16/ })).toBeUndefined();
  await ui.unmount();
});

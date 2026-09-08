import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
  TuiAltScreen,
  TuiMainScreen,
  visibleWidth,
} from "@earendil-works/pi-tui";
import type { Component, Terminal, TUI } from "@earendil-works/pi-tui";
import {
  boundedLines,
  compactLines,
  createPanel,
  panelLines,
  plain,
} from "./panel.ts";
import { phases } from "./workflow.ts";
import type { Snapshot } from "./workflow.ts";

function pendingPhase(phase: string): Snapshot {
  return {
    phase,
    label: phases[phase].label,
    nextPhase: phases[phase].next_phase,
    state: { version: 1, revision: 0, runs: [], scopes: [], history: [] },
    rows: phases[phase].steps.map((step) => ({
      step,
      status: "pending",
      runs: [],
      artifacts: [],
      runsApproved: false,
      complete: false,
    })),
  };
}

test("current and next steps show runnable Pi commands from the catalog", () => {
  const view = pendingPhase("concept");
  const lines = compactLines(view);
  assert.equal(lines[1], "Current: /skill:gamedev-setup-engine · Engine Setup");
  assert.equal(
    lines[2],
    "Next required: /skill:gamedev-brainstorm · Game Concept Document",
  );
  assert.ok(
    boundedLines(lines, 60)[2].includes("/skill:gamedev-brainstorm"),
    "Keep the runnable command ahead of the title when space is limited",
  );
  assert.ok(panelLines(view).includes("  /skill:gamedev-brainstorm"));
  assert.doesNotMatch(lines.join("\n"), /\/gamedev:|undefined/);
});

test("commandless steps and phase destinations keep their labels", () => {
  const view = pendingPhase("technical-setup");
  view.rows = view.rows.filter((row) => row.step.id === "accessibility-doc");
  const lines = compactLines(view);
  assert.equal(lines[1], `Current: ${view.rows[0].step.name}`);
  assert.equal(lines[2], "Next required: Pre-Production");
  assert.doesNotMatch(
    [...lines, ...panelLines(view)].join("\n"),
    /\/skill:|undefined/,
  );
  view.rows[0].complete = true;
  assert.equal(compactLines(view)[1], "Current: Ready for phase review");
  view.nextPhase = null;
  assert.equal(compactLines(view)[2], "Next required: Release sign-off");
});

function terminal() {
  let receive = (_data: string) => {};
  const value: Terminal = {
    columns: 120,
    rows: 40,
    kittyProtocolActive: false,
    start(onInput) {
      receive = onInput;
    },
    stop() {},
    async drainInput() {},
    write() {},
    moveBy() {},
    hideCursor() {},
    showCursor() {},
    clearLine() {},
    clearFromCursor() {},
    clearScreen() {},
    setTitle() {},
    setProgress() {},
  };
  return { value, input: (data: string) => receive(data) };
}

function context(tui: TUI): ExtensionContext {
  return {
    mode: "tui",
    hasUI: true,
    ui: {
      setWidget(_key: string, factory: unknown) {
        if (typeof factory === "function") factory(tui);
      },
      notify() {},
      theme: { fg: (_color: string, text: string) => text },
    },
  } as unknown as ExtensionContext;
}

for (const Renderer of [TuiMainScreen, TuiAltScreen]) {
  test(`${Renderer.name}: panel preserves typing and owns only its own overlay`, (t) => {
    const term = terminal();
    const tui = new Renderer(term.value);
    const panel = createPanel(context(tui));
    t.after(() => {
      panel.dispose();
      tui.stop();
    });
    let editorInput = "";
    const editor: Component = {
      render: () => ["EDITOR"],
      invalidate() {},
      handleInput: (data) => {
        editorInput += data;
      },
    };
    tui.addChild(editor);
    tui.setFocus(editor);
    tui.start();
    const hiddenDialog = tui.showOverlay({
      render: () => ["DIALOG"],
      invalidate() {},
    });
    hiddenDialog.setHidden(true);
    panel.update(["GAME STUDIO", "Systems Design"]);
    panel.toggle();
    assert.equal(tui.hasOverlay(), false, "Must wait even for a hidden dialog");
    hiddenDialog.hide();
    panel.update(["GAME STUDIO", "Systems Design"]);
    assert.equal(tui.hasOverlay(), true);
    term.input("x");
    assert.equal(editorInput, "x", "Panel must not take editor focus");
    let dialogInput = "";
    const dialog = tui.showOverlay({
      render: () => ["DIALOG"],
      invalidate() {},
      handleInput: (data) => {
        dialogInput += data;
      },
    });
    panel.dispose();
    assert.equal(
      tui.hasOverlay(),
      true,
      "Disposing panel must leave other dialog mounted",
    );
    term.input("y");
    assert.equal(dialogInput, "y");
    dialog.hide();
    panel.update(["LATE UPDATE"]);
    assert.equal(
      tui.hasOverlay(),
      false,
      "Late updates must not resurrect a disposed panel",
    );
  });

  test(`${Renderer.name}: narrow terminals and toggling unmount the panel`, (t) => {
    const term = terminal();
    const tui = new Renderer(term.value);
    const panel = createPanel(context(tui));
    t.after(() => {
      panel.dispose();
      tui.stop();
    });
    panel.update(["GAME STUDIO"]);
    panel.toggle();
    assert.equal(tui.hasOverlay(), true);
    Object.defineProperty(term.value, "columns", {
      value: 75,
      configurable: true,
    });
    panel.update(["GAME STUDIO"]);
    assert.equal(tui.hasOverlay(), false);
    Object.defineProperty(term.value, "columns", {
      value: 120,
      configurable: true,
    });
    panel.update(["GAME STUDIO"]);
    assert.equal(tui.hasOverlay(), true);
    panel.toggle();
    assert.equal(tui.hasOverlay(), false);
    let cursorRestored = false;
    term.value.showCursor = () => {
      cursorRestored = true;
    };
    panel.toggle();
    panel.dispose("quit");
    assert.equal(
      cursorRestored,
      true,
      "Teardown after TUI stop must not leave the shell cursor hidden",
    );
  });
}

test("rendered text is bounded and does not execute terminal control sequences", () => {
  const input = [
    "A very long title 日本語 with extra text",
    "\u001b[31mred\u001b[0m\n\u0007alert",
  ];
  for (const width of [0, 1, 10, 46]) {
    for (const line of boundedLines(input, width)) {
      assert.ok(visibleWidth(line) <= width);
      assert.doesNotMatch(line, /[\u0000-\u001f]/);
    }
  }
  assert.equal(plain("\u001b[31mred\u001b[0m"), "red");
});

test("a renderer without ownership checks retains the compact-widget fallback", () => {
  const unsupported = {
    terminal: { columns: 120, rows: 40 },
    requestRender() {},
    showOverlay() {
      assert.fail("Unsafe mount");
    },
  };
  const panel = createPanel(context(unsupported as unknown as TUI));
  panel.update(["GAME STUDIO"]);
  panel.toggle();
  panel.dispose();
});

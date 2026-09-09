import type {
  ExtensionContext,
  SessionShutdownEvent,
} from "@earendil-works/pi-coding-agent";
import {
  stripTerminalSequences,
  truncateToWidth,
} from "@earendil-works/pi-tui";
import type { OverlayHandle, TUI } from "@earendil-works/pi-tui";
import { blockers, phases } from "./workflow.ts";
import type { Snapshot, Step } from "./workflow.ts";

export function plain(text: string): string {
  return stripTerminalSequences(text).replace(
    /[\u0000-\u001f\u007f-\u009f]/g,
    " ",
  );
}

export function boundedLines(lines: string[], width: number): string[] {
  return lines.map((line) =>
    stripTerminalSequences(truncateToWidth(plain(line), Math.max(0, width))),
  );
}

function stepLabel(step: Step): string {
  return step.command ? `${step.command} · ${step.name}` : step.name;
}

export function compactLines(view: Snapshot): string[] {
  const current = view.state.runs
    .filter((run) => run.phase === view.phase && run.status !== "approved")
    .at(-1);
  const remaining = blockers(view);
  const focused = current
    ? view.rows.find((row) => row.step.id === current.step)
    : remaining[0];
  const status =
    current?.status === "submitted"
      ? "awaiting user approval"
      : current?.status;
  const focus = current
    ? `${current.id} ${current.step}${current.subject ? ` · ${current.subject}` : ""} (${status})`
    : focused
      ? stepLabel(focused.step)
      : "Ready for phase review";
  const nextStep = remaining.find(
    (row) => row.step.id !== focused?.step.id,
  )?.step;
  const next = nextStep
    ? stepLabel(nextStep)
    : view.nextPhase
      ? phases[view.nextPhase].label
      : "Release sign-off";
  const previous =
    view.rows.filter((row) => row.complete).at(-1)?.step.name ??
    "none approved";
  return [
    `Game Studio · ${view.label} · ${Object.keys(phases).indexOf(view.phase) + 1}/${Object.keys(phases).length} | Previous: ${previous}`,
    `Current: ${focus}`,
    `Next required: ${next}`,
  ];
}

export function panelLines(view: Snapshot): string[] {
  const lines = ["GAME STUDIO", view.label, ""];
  for (const row of view.rows) {
    const marker = row.complete
      ? "✓"
      : row.status.startsWith("active")
        ? "▶"
        : row.status.startsWith("blocked")
          ? "!"
          : "○";
    lines.push(
      `${marker} ${row.step.name}${row.step.required ? "" : " (optional)"}`,
    );
    lines.push(`  ${row.status}`);
    if (row.step.command) lines.push(`  ${row.step.command}`);
  }
  lines.push(
    "",
    `Next phase: ${view.nextPhase ? phases[view.nextPhase].label : "end"}`,
  );
  return lines;
}

function captureRenderer(ctx: ExtensionContext): TUI | undefined {
  let renderer: TUI | undefined;
  try {
    ctx.ui.setWidget("gamedev:tui-handle", (provided) => {
      renderer = provided;
      return { render: () => [], invalidate() {} };
    });
  } finally {
    ctx.ui.setWidget("gamedev:tui-handle", undefined);
  }
  return renderer;
}

/** Own only our overlay; never close a dialog or replace another extension's footer. */
export function createPanel(ctx: ExtensionContext) {
  let enabled = false;
  let disposed = false;
  let lines: string[] = [];
  let tui: TUI | undefined;
  let handle: OverlayHandle | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unmount = () => {
    handle?.hide();
    handle = undefined;
  };
  const refresh = () => {
    clearTimeout(timer);
    if (disposed || !enabled || !lines.length || !tui) {
      unmount();
      return;
    }
    if (tui.terminal.columns < 110 || tui.terminal.rows < 22) unmount();
    else if (
      !handle &&
      "hasOverlayEntries" in tui &&
      tui.hasOverlayEntries === false
    ) {
      handle = tui.showOverlay(
        {
          render(width) {
            const limit = Math.max(
              3,
              Math.floor((tui?.terminal.rows ?? 30) * 0.85),
            );
            const shown =
              lines.length > limit
                ? [
                    ...lines.slice(0, limit - 1),
                    "… /gamedev-workflow for all steps",
                  ]
                : lines;
            return boundedLines(shown, width).map((line) =>
              ctx.ui.theme.fg("text", line),
            );
          },
          invalidate() {},
        },
        {
          nonCapturing: true,
          anchor: "top-right",
          width: 46,
          maxHeight: "85%",
          margin: { top: 1, right: 1 },
        },
      );
    }
    tui.requestRender();
    timer = setTimeout(refresh, 250);
    timer.unref();
  };

  return {
    update(next: string[]) {
      lines = next;
      refresh();
    },
    toggle() {
      if (ctx.mode !== "tui" || disposed) return;
      enabled = !enabled;
      if (enabled && !tui) {
        tui = captureRenderer(ctx);
        if (
          !tui ||
          !("hasOverlayEntries" in tui) ||
          typeof tui.hasOverlayEntries !== "boolean"
        ) {
          enabled = false;
          ctx.ui.notify(
            "This Pi renderer lacks safe overlay ownership checks; use the compact widget.",
            "warning",
          );
        }
      }
      refresh();
      if (enabled)
        ctx.ui.notify(
          "Workflow panel enabled; waits for other panels and wide terminals. Toggle again to close.",
          "info",
        );
    },
    dispose(reason?: SessionShutdownEvent["reason"]) {
      disposed = true;
      clearTimeout(timer);
      unmount();
      if (
        reason === "quit" &&
        tui &&
        "hasOverlayEntries" in tui &&
        tui.hasOverlayEntries === false
      ) {
        tui.terminal.showCursor();
      }
      tui = undefined;
    },
  };
}

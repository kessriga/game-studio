import { atom, read, update } from "claude-code";
import type { EngineInterface, Register, Timer } from "claude-code";
import type { Tracking, WorkflowReply } from "../types";
import { MARKERS, parseWorkflowReply, workflowArgv } from "./project.ts";
import type { WorkflowRequest } from "./project.ts";
import { PANE, paneTree, statusText } from "./view.tsx";

const tracking = atom(
  { plugin: "gamedev", key: "tracking" } as const,
  {
    kind: "none",
  } as Tracking,
);
const isHidden = atom({ plugin: "gamedev", key: "isHidden" } as const, false);

/** Tools whose results can change workflow state or evidence. */
const REFRESH_TOOLS = new Set([
  "Write",
  "Edit",
  "MultiEdit",
  "NotebookEdit",
  "Bash",
  "Agent",
  "mcp__gamedev__workflow",
]);

/** The game repository this session tracks; undefined outside a game project. A reload re-detects it. */
let root: string | undefined;
let pending: Timer | undefined;

async function isGameProject(
  $: EngineInterface,
  directory: string,
): Promise<boolean> {
  for (const marker of MARKERS) {
    if (await $.fs.exists(`${directory}/${marker}`)) return true;
  }
  return false;
}

async function runWorkflow(
  $: EngineInterface,
  request: WorkflowRequest,
): Promise<WorkflowReply> {
  const argv = workflowArgv($.plugin.root, request);
  try {
    const result = await $.process.run(argv, {
      cwd: request.root,
      stdin: JSON.stringify(request.body ?? {}),
      timeoutMs: 30_000,
    });
    return parseWorkflowReply(result);
  } catch (failed) {
    return parseWorkflowReply({ failed });
  }
}

async function refresh($: EngineInterface): Promise<Tracking> {
  if (!root) return { kind: "none" };
  const reply = await runWorkflow($, {
    root,
    action: "status",
    actor: "agent:refresh",
  });
  const next: Tracking = !reply.ok
    ? { kind: "error", message: reply.error }
    : reply.snapshot
      ? { kind: "view", view: reply.snapshot }
      : { kind: "none" };
  await update($, tracking, () => next);
  $.ui.status((await read($, isHidden)) ? undefined : statusText(next));
  return next;
}

function refreshSoon($: EngineInterface): void {
  pending?.cancel();
  pending = $.clock.after(250, () => {
    pending = undefined;
    void refresh($);
  });
}

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    root = (await isGameProject($, e.cwd)) ? e.cwd : undefined;
    if (!root) {
      $.ui.status(undefined);
      return next(e);
    }
    await $.command.register({
      name: "gamedev-workflow",
      description:
        "Game Studio workflow: status, panel, history, approve <run> <note>, finish <step> <note>, handoff <run> <note>, gate <note>, hide, show",
      argumentHint: "[action] [id] [note]",
    });
    await refresh($);
    if (e.isInteractive) void $.ui.open({ id: PANE, title: "Game Studio" });
    return next(e);
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) =>
    paneTree($.ui.resolve(e), await read($, tracking)),
  );

  on("turn.complete", async ($, e, next) => {
    const result = await next(e);
    if (root) refreshSoon($);
    return result;
  });

  on("tool.call", async ($, e, next) => {
    const result = await next(e);
    if (root && REFRESH_TOOLS.has(e.tool)) refreshSoon($);
    return result;
  });
};

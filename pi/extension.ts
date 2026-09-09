import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import {
  boundedLines,
  compactLines,
  createPanel,
  panelLines,
  plain,
} from "./panel.ts";
import {
  blockers,
  checkHandoff,
  checkRunApproval,
  scopeEvidence,
  phases,
  recordGateDecision,
  recordUpdate,
  snapshot,
} from "./workflow.ts";
import type { Snapshot, Update } from "./workflow.ts";
import type { Run } from "./progress-store.ts";

function sourceLabel(run: Run): string {
  if (run.handoff)
    return `coordinator ${run.handoff.coordinator.root} (handed off from ${run.source!.checkout.root})`;
  return run.source
    ? `worktree ${run.source.checkout.root}`
    : "coordinator checkout";
}

function summary(view: Snapshot | undefined): string {
  if (!view)
    return "No saved game phase. Run /skill:gamedev-start; tracking does not infer completion from a directory.";
  const lines = [
    ...compactLines(view),
    `State revision: ${view.state.revision}`,
    ...view.rows.map(
      (row) =>
        `${row.step.id}: ${row.status}${row.step.required ? " [required]" : " [optional]"}`,
    ),
  ];
  const active = view.state.runs
    .filter(
      (run) =>
        run.phase === view.phase && (run.status !== "approved" || run.source),
    )
    .slice(-8);
  for (const run of active)
    lines.push(
      `${run.id}: ${run.step} ${run.subject} — ${run.note} [source: ${sourceLabel(run)}]`,
    );
  lines.push(
    "Artifact presence is not approval. Repeatable steps need scope confirmation. Backlog remains the story authority.",
  );
  return lines.map(plain).join("\n");
}

export default function gameStudio(pi: ExtensionAPI): void {
  let session:
    | {
        ctx: ExtensionContext;
        panel: ReturnType<typeof createPanel>;
        stopped: boolean;
        sequence: number;
      }
    | undefined;
  let showWidget = true;

  async function refresh(ctx: ExtensionContext): Promise<Snapshot | undefined> {
    const owner = session;
    const sequence = owner ? ++owner.sequence : 0;
    const view = await snapshot(ctx.cwd);
    if (
      !owner ||
      owner.stopped ||
      owner !== session ||
      sequence !== owner.sequence
    )
      return view;
    if (ctx.hasUI) {
      const lines = view && showWidget ? compactLines(view) : undefined;
      if (ctx.mode === "tui" && lines) {
        ctx.ui.setWidget("gamedev:progress", () => ({
          render: (width) => boundedLines(lines, width),
          invalidate() {},
        }));
      } else ctx.ui.setWidget("gamedev:progress", lines?.map(plain));
      owner.panel.update(view ? panelLines(view) : []);
    }
    return view;
  }

  async function refreshSafely(ctx: ExtensionContext): Promise<void> {
    const owner = session;
    try {
      await refresh(ctx);
    } catch (error) {
      if (!owner || owner.stopped || owner !== session) return;
      session?.panel.update([]);
      if (ctx.hasUI)
        ctx.ui.setWidget(
          "gamedev:progress",
          showWidget
            ? [plain(`Game Studio tracking error: ${String(error)}`)]
            : undefined,
        );
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    session?.panel.dispose();
    session = { ctx, panel: createPanel(ctx), stopped: false, sequence: 0 };
    await refreshSafely(ctx);
  });
  pi.on("session_shutdown", (event, ctx) => {
    if (session) {
      session.stopped = true;
      session.panel.dispose(event.reason);
    }
    session = undefined;
    if (ctx.hasUI) ctx.ui.setWidget("gamedev:progress", undefined);
  });
  pi.on("agent_settled", async (_event, ctx) => {
    await refreshSafely(ctx);
  });
  pi.on("tool_result", async (event, ctx) => {
    if (["write", "edit", "bash", "subagent"].includes(event.toolName))
      await refreshSafely(ctx);
  });
  pi.on("before_agent_start", async (_event, ctx) => {
    let context: string;
    try {
      const view = await refresh(ctx);
      if (!view) return;
      context = summary(view);
    } catch (error) {
      context = `Workflow tracking is unavailable: ${String(error)}. Do not overwrite or reset its state.`;
    }
    return {
      message: {
        customType: "gamedev-progress",
        display: false,
        content:
          `${context}\nUse gamedev_workflow to track catalog steps. Start before work, block on missing requirements, and submit evidence afterwards. ` +
          "Warn about earlier incomplete required steps; do not silently bypass them. Delegate specialist work through the installed subagent tool with bundled role bodies. " +
          "Only the coordinating session updates progress; subagents return evidence. A subagent exit or file's existence does not prove completion. " +
          "The user approves runs and repeatable scope through /gamedev-workflow. Never invoke approval commands on the user's behalf or edit workflow-state.json directly. " +
          "Keep production/stage.txt authoritative. Before phase advancement, run the gate-check skill and ask for the user's decision; record unresolved requirements and any override.",
      },
    };
  });

  pi.registerTool({
    name: "gamedev_workflow",
    label: "Game Studio workflow",
    description:
      "Read saved workflow status, start a catalog step, report a blocker, or submit evidence. Does not approve work or advance phases. Use the latest revision for updates. Outputs are bounded to current-phase summaries.",
    promptSnippet:
      "Track Game Studio steps and submit evidence without claiming user approval",
    parameters: Type.Object({
      action: StringEnum(["status", "start", "block", "submit"] as const),
      revision: Type.Optional(Type.Integer({ minimum: 0 })),
      step: Type.Optional(Type.String()),
      subject: Type.Optional(Type.String({ maxLength: 500 })),
      run: Type.Optional(Type.String()),
      note: Type.Optional(Type.String({ maxLength: 2000 })),
      evidence: Type.Optional(Type.Array(Type.String(), { maxItems: 50 })),
      worktree: Type.Optional(
        Type.String({
          maxLength: 4000,
          description:
            "Submit source: registered same-repository worktree root, relative to and inside coordinator cwd. Evidence paths are relative to this checkout. Omit to retain the run source.",
        }),
      ),
    }),
    async execute(_id, args, _signal, _onUpdate, ctx) {
      if (args.action !== "status") {
        if (args.revision === undefined)
          throw new Error("Read status first and provide its revision.");
        let update: Update;
        if (args.action === "start")
          update = {
            action: "start",
            step: args.step ?? "",
            subject: args.subject ?? "",
            note: args.note ?? "",
          };
        else if (args.action === "block")
          update = {
            action: "block",
            run: args.run ?? "",
            note: args.note ?? "",
          };
        else
          update = {
            action: "submit",
            run: args.run ?? "",
            note: args.note ?? "",
            evidence: args.evidence ?? [],
            worktree: args.worktree,
          };
        await recordUpdate(
          ctx.cwd,
          args.revision,
          update,
          `agent:${ctx.sessionManager.getSessionId()}`,
        );
      }
      const view = await refresh(ctx);
      return {
        content: [{ type: "text", text: summary(view) }],
        details: { revision: view?.state.revision, phase: view?.phase },
      };
    },
  });

  pi.registerCommand("gamedev-workflow", {
    description:
      "Workflow status, panel, history, approve <run>, finish <step>, handoff <run>, gate, hide, or show",
    handler: async (args, ctx) => {
      try {
        const [action, id] = args.trim().split(/\s+/);
        if (action === "panel") {
          session?.panel.toggle();
          await refreshSafely(ctx);
          return;
        }
        if (action === "hide") {
          showWidget = false;
          ctx.ui.setWidget("gamedev:progress", undefined);
          return;
        }
        if (action === "show") {
          showWidget = true;
          await refreshSafely(ctx);
          return;
        }
        const view = await refresh(ctx);
        if (!view) {
          ctx.ui.notify(summary(view), "info");
          return;
        }
        if (
          action === "approve" ||
          action === "finish" ||
          action === "handoff"
        ) {
          await approveFromUser(action, id, view, ctx);
          await refresh(ctx);
          return;
        }
        if (action === "gate") {
          await gateFromUser(view, ctx);
          return;
        }
        if (action === "history") {
          const history = view.state.history
            .slice(-20)
            .map(
              (entry) =>
                `${entry.at} ${entry.action} (${entry.actor}): ${entry.note}`,
            );
          pi.sendMessage({
            customType: "gamedev-history",
            display: true,
            content:
              history.map(plain).join("\n") || "No recorded workflow history.",
          });
          return;
        }
        pi.sendMessage({
          customType: "gamedev-status",
          display: true,
          content: summary(view),
        });
      } catch (error) {
        ctx.ui.notify(plain(String(error)), "error");
      }
    },
  });
}

async function approveFromUser(
  action: "approve" | "finish" | "handoff",
  id: string | undefined,
  view: Snapshot,
  ctx: ExtensionContext,
): Promise<void> {
  if (!ctx.hasUI)
    throw new Error("Approval requires an interactive user decision.");
  if (!id)
    throw new Error(
      `Usage: /gamedev-workflow ${action} <${action === "finish" ? "step ID" : "run ID"}>`,
    );
  const run = view.state.runs.find(
    (item) => item.id === id && item.phase === view.phase,
  );
  const step = view.rows.find((row) => row.step.id === id);
  if (action !== "finish" && !run)
    throw new Error("Run not found in this phase.");
  if (action === "finish" && !step?.step.repeatable)
    throw new Error("Choose a repeatable step in this phase.");
  const reviewedEvidence =
    action === "finish" && step?.step.artifact?.aggregate
      ? await scopeEvidence(ctx.cwd, step)
      : [];
  const evidence =
    run?.evidence.map((item) => item.path).join(", ") ||
    "No file evidence; manual verification required.";
  const recheck = async () => {
    const current = await snapshot(ctx.cwd);
    if (
      !current ||
      current.phase !== view.phase ||
      current.state.revision !== view.state.revision
    )
      throw new Error(
        "Workflow state changed. Read status again before retrying.",
      );
    if (action === "approve") await checkRunApproval(ctx.cwd, run!);
    if (action === "handoff") await checkHandoff(ctx.cwd, run!);
    if (
      action === "finish" &&
      step?.step.artifact?.aggregate &&
      JSON.stringify(
        await scopeEvidence(
          ctx.cwd,
          current.rows.find((row) => row.step.id === id)!,
        ),
      ) !== JSON.stringify(reviewedEvidence)
    )
      throw new Error(
        "Scope evidence changed. Review the current artifacts and confirm again.",
      );
  };
  await recheck();
  const prompt =
    action === "handoff"
      ? `Hand off ${id} from ${sourceLabel(run!)} to coordinator ${ctx.cwd}?\nEvidence: ${evidence}\nAll reviewed hashes must match. No files are copied and the stage stays unchanged. Repeatable scope reopens, including aggregate review.`
      : action === "approve"
        ? `Approve ${id}? ${run?.note}\nSource: ${sourceLabel(run!)}\nEvidence: ${evidence}\nConfirm you checked the result and any required independent review.`
        : `Confirm ALL intended subjects for ${id} are complete, not just the recorded runs. Check the systems list or Backlog board first.\nSources: ${[...new Set(step!.runs.map(sourceLabel))].join(", ")}`;
  if (!(await ctx.ui.confirm("Game Studio approval", plain(prompt)))) return;
  await recheck();
  const note = await ctx.ui.input("Record what you verified (required)");
  if (!note?.trim()) return;
  await recheck();
  const update: Update =
    action === "finish"
      ? { action, step: id, note, reviewedEvidence }
      : { action, run: id, note };
  await recordUpdate(
    ctx.cwd,
    view.state.revision,
    update,
    `user:${ctx.sessionManager.getSessionId()}`,
  );
  ctx.ui.notify(
    action === "handoff"
      ? "Handoff recorded; scope reopened and stage unchanged."
      : "Approval recorded. Changed evidence will require a new review.",
    "info",
  );
}

async function gateFromUser(
  view: Snapshot,
  ctx: ExtensionContext,
): Promise<void> {
  if (!ctx.hasUI)
    throw new Error("Phase decisions require an interactive user.");
  const remaining = blockers(view).map((row) => row.step.name);
  const destination = view.nextPhase
    ? phases[view.nextPhase].label
    : "release sign-off";
  const message = remaining.length
    ? `Unresolved: ${remaining.join(", ")}. Record an override toward ${destination}?`
    : `Recorded steps are approved. Record your decision toward ${destination}? This does not replace the gate-check review.`;
  if (!(await ctx.ui.confirm("Game Studio phase decision", message))) return;
  const note = await ctx.ui.input(
    remaining.length
      ? "Override reason (required)"
      : "Gate review evidence and decision (required)",
  );
  if (!note?.trim()) return;
  await recordGateDecision(
    ctx.cwd,
    view,
    note,
    `user:${ctx.sessionManager.getSessionId()}`,
  );
  ctx.ui.notify(
    "Decision recorded; stage unchanged. Use /skill:gamedev-gate-check to review and advance with your approval.",
    "info",
  );
}

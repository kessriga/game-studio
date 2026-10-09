import type { WorkflowHistory } from "../types";

export const TOOL = "workflow";
export const TOOL_NAME = "mcp__gamedev__workflow";
export const COMMAND = "gamedev-workflow";

export const USAGE = [
  "Usage: /gamedev-workflow [status|panel|history|hide|show]",
  "       /gamedev-workflow approve <run> <what you verified>",
  "       /gamedev-workflow finish <step> <scope you confirmed>",
  "       /gamedev-workflow handoff <run> <note>",
  "       /gamedev-workflow gate <decision or override reason>",
].join("\n");

export type WorkflowCommand =
  | { action: "status" | "panel" | "history" | "hide" | "show" }
  | { action: "approve" | "finish" | "handoff"; id: string; note: string }
  | { action: "gate"; note: string }
  | { usage: string };

/** Parse the text after /gamedev-workflow. Notes are the rest of the line and are required. */
export function parseWorkflowCommand(args: string): WorkflowCommand {
  const [action = "status", id = "", ...rest] = args.trim().split(/\s+/);
  switch (action) {
    case "":
    case "status":
    case "panel":
    case "history":
    case "hide":
    case "show":
      return { action: action || "status" };
    case "approve":
    case "finish":
    case "handoff": {
      const note = rest.join(" ").trim();
      if (!id || !note) return { usage: USAGE };
      return { action, id, note };
    }
    case "gate": {
      const note = [id, ...rest].join(" ").trim();
      if (!note) return { usage: USAGE };
      return { action, note };
    }
    default:
      return { usage: USAGE };
  }
}

/** The JSON schema of the agent's tool; the same fields Pi's gamedev_workflow takes. */
export const TOOL_SCHEMA = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["status", "start", "block", "submit"],
      description:
        "status reads progress; start begins a catalog step; block reports a blocker; submit records evidence. The user approves through /gamedev-workflow.",
    },
    revision: {
      type: "integer",
      minimum: 0,
      description: "The revision from the last status; required for updates.",
    },
    step: { type: "string", description: "Catalog step id for start." },
    subject: {
      type: "string",
      maxLength: 500,
      description:
        "Subject for repeatable steps: system, screen, epic, or story id.",
    },
    run: { type: "string", description: "Run id for block and submit." },
    note: { type: "string", maxLength: 2000 },
    evidence: {
      type: "array",
      items: { type: "string" },
      maxItems: 50,
      description: "Checkout-relative evidence paths for submit.",
    },
    worktree: {
      type: "string",
      maxLength: 4000,
      description:
        "Submit source: registered same-repository worktree root, relative to and inside the coordinator root. Omit to keep the run's source.",
    },
  },
  required: ["action"],
} as const;

export const TOOL_DESCRIPTION =
  "Game Studio workflow tracking. Read saved status, start a catalog step, report a blocker, or submit evidence. Never approves work or advances phases; the user approves through /gamedev-workflow. Use the latest revision for updates.";

export const AGENT_GUIDANCE =
  "Use the mcp__gamedev__workflow tool to track catalog steps. Start before work, block on missing requirements, and submit evidence afterwards. " +
  "Warn about earlier incomplete required steps; do not silently bypass them. Delegate specialist work to the gamedev:<role> subagent types with the task, inputs, edit scope, and required evidence. " +
  "Only the coordinating session updates progress; subagents return evidence. A subagent exit or file's existence does not prove completion. " +
  "The user approves runs and repeatable scope through /gamedev-workflow. Never invoke approval commands on the user's behalf or edit workflow-state.json directly. " +
  "Keep production/stage.txt authoritative. Before phase advancement, run /gamedev:gate-check and ask for the user's decision; record unresolved requirements and any override. " +
  "Read production/session-state/active.md when present before resuming work.";

export function historyText(history: WorkflowHistory[] | undefined): string {
  const lines = (history ?? []).map(
    (entry) => `${entry.at} ${entry.action} (${entry.actor}): ${entry.note}`,
  );
  return lines.join("\n") || "No recorded workflow history.";
}

export function toolBody(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of [
    "step",
    "subject",
    "run",
    "note",
    "evidence",
    "worktree",
  ]) {
    if (input[key] !== undefined) body[key] = input[key];
  }
  return body;
}

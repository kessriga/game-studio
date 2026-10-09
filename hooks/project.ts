import type { ProcessRunResult } from "claude-code";
import type { WorkflowReply } from "../types";

/** Project-owned markers; runtime state alone never identifies a game. Mirrors bin/gamedev-is-project. */
export const MARKERS = [
  "docs/technical-preferences.md",
  "design/registry/entities.yaml",
  "production/stage.txt",
  "design/gdd",
] as const;

export const NODE_HINT = "Game Studio tracking needs Node 22.17+ on PATH.";

export type WorkflowRequest = {
  root: string;
  action: string;
  actor: string;
  revision?: number;
  body?: Record<string, unknown>;
};

/** The argument vector that runs one progress-core action through workflow/cli.ts. */
export function workflowArgv(
  pluginRoot: string,
  request: WorkflowRequest,
): string[] {
  const argv = [
    "node",
    "--experimental-strip-types",
    `${pluginRoot}/workflow/cli.ts`,
    request.action,
    "--root",
    request.root,
    "--actor",
    request.actor,
  ];
  if (request.revision !== undefined)
    argv.push("--revision", String(request.revision));
  return argv;
}

/** Turn the CLI process result, or the failure to start it, into a reply. */
export function parseWorkflowReply(
  result: ProcessRunResult | { failed: unknown },
): WorkflowReply {
  if ("failed" in result)
    return { ok: false, error: `${NODE_HINT} ${messageOf(result.failed)}` };
  const text = result.stdout.trim();
  if (text) {
    try {
      return JSON.parse(text) as WorkflowReply;
    } catch {
      return {
        ok: false,
        error: `Unreadable workflow reply: ${text.slice(0, 200)}`,
      };
    }
  }
  const detail = result.stderr.trim().split("\n")[0] ?? "";
  return {
    ok: false,
    error: `${NODE_HINT} ${detail || `node exited with code ${result.exitCode}.`}`,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

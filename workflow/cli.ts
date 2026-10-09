#!/usr/bin/env node
/**
 * JSON command over the progress core for hosts that cannot import it, such
 * as the Claude Code mod. One action per process; the update body arrives on
 * stdin and one JSON reply leaves on stdout.
 *
 *   node --experimental-strip-types cli.ts <action> --root <dir> --actor <id> [--revision <n>]
 *
 * Actions: status, history, start, block, submit, approve, finish, handoff,
 * gate. Approvals and gate decisions still require a `user:` actor; the core
 * enforces it.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  blockers,
  phases,
  recordGateDecision,
  recordUpdate,
  scopeEvidence,
  snapshot,
  sourceLabel,
} from "./workflow.ts";
import type { Snapshot, Update } from "./workflow.ts";
import type { History } from "./progress-store.ts";

export type SnapshotJson = {
  phase: string;
  label: string;
  index: number;
  count: number;
  nextPhase: string | null;
  nextLabel: string | null;
  revision: number;
  steps: {
    id: string;
    name: string;
    command?: string;
    required: boolean;
    repeatable: boolean;
    aggregate: boolean;
    status: string;
    complete: boolean;
    artifacts: string[];
  }[];
  runs: {
    id: string;
    phase: string;
    step: string;
    subject: string;
    status: string;
    note: string;
    evidence: string[];
    source: string;
  }[];
  blockers: string[];
};

export type Reply =
  | { ok: true; snapshot: SnapshotJson | null; history?: History[] }
  | { ok: false; error: string };

const ACTIONS = new Set([
  "status",
  "history",
  "start",
  "block",
  "submit",
  "approve",
  "finish",
  "handoff",
  "gate",
]);

export function toJson(view: Snapshot): SnapshotJson {
  const keys = Object.keys(phases);
  return {
    phase: view.phase,
    label: view.label,
    index: keys.indexOf(view.phase) + 1,
    count: keys.length,
    nextPhase: view.nextPhase,
    nextLabel: view.nextPhase ? phases[view.nextPhase]!.label : null,
    revision: view.state.revision,
    steps: view.rows.map((row) => ({
      id: row.step.id,
      name: row.step.name,
      command: row.step.command,
      required: row.step.required,
      repeatable: row.step.repeatable === true,
      aggregate: row.step.artifact?.aggregate === true,
      status: row.status,
      complete: row.complete,
      artifacts: row.artifacts,
    })),
    runs: view.state.runs.map((run) => ({
      id: run.id,
      phase: run.phase,
      step: run.step,
      subject: run.subject,
      status: run.status,
      note: run.note,
      evidence: run.evidence.map((item) => item.path),
      source: sourceLabel(run),
    })),
    blockers: blockers(view).map((row) => row.step.id),
  };
}

type Options = {
  action: string;
  root: string;
  actor: string;
  revision?: number;
};

function parseArguments(argv: string[]): Options {
  const [action, ...rest] = argv;
  if (!action || !ACTIONS.has(action))
    throw new Error(`Unknown action: ${action ?? "(none)"}`);
  const options: Options = { action, root: process.cwd(), actor: "agent:cli" };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (value === undefined) throw new Error(`Missing value for ${flag}`);
    if (flag === "--root") options.root = value;
    else if (flag === "--actor") options.actor = value;
    else if (flag === "--revision") {
      options.revision = Number(value);
      if (!Number.isInteger(options.revision) || options.revision < 0)
        throw new Error("The revision must be a non-negative integer.");
    } else throw new Error(`Unknown flag: ${flag}`);
  }
  return options;
}

function readBody(): Record<string, unknown> {
  let text = "";
  try {
    text = readFileSync(0, "utf8");
  } catch {
    return {};
  }
  if (!text.trim()) return {};
  const body: unknown = JSON.parse(text);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("The update body must be a JSON object.");
  return body as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function requireRevision(options: Options): number {
  if (options.revision === undefined)
    throw new Error("Read status first and provide its revision.");
  return options.revision;
}

async function applyUpdate(
  options: Options,
  body: Record<string, unknown>,
): Promise<void> {
  const revision = requireRevision(options);
  const note = text(body, "note");
  let update: Update;
  switch (options.action) {
    case "start":
      update = {
        action: "start",
        step: text(body, "step"),
        subject: text(body, "subject"),
        note,
      };
      break;
    case "block":
      update = { action: "block", run: text(body, "run"), note };
      break;
    case "submit": {
      const evidence = Array.isArray(body.evidence)
        ? body.evidence.filter(
            (item): item is string => typeof item === "string",
          )
        : [];
      const worktree = text(body, "worktree");
      update = {
        action: "submit",
        run: text(body, "run"),
        note,
        evidence,
        ...(worktree ? { worktree } : {}),
      };
      break;
    }
    case "approve":
      update = { action: "approve", run: text(body, "run"), note };
      break;
    case "handoff":
      update = { action: "handoff", run: text(body, "run"), note };
      break;
    case "finish": {
      const step = text(body, "step");
      const view = await currentView(options.root, revision);
      const row = view.rows.find((item) => item.step.id === step);
      if (!row) throw new Error("Choose a repeatable step in this phase.");
      update = {
        action: "finish",
        step,
        note,
        ...(row.step.artifact?.aggregate
          ? { reviewedEvidence: await scopeEvidence(options.root, row) }
          : {}),
      };
      break;
    }
    case "gate": {
      const view = await currentView(options.root, revision);
      await recordGateDecision(options.root, view, note, options.actor);
      return;
    }
    default:
      throw new Error(`Unknown action: ${options.action}`);
  }
  await recordUpdate(options.root, revision, update, options.actor);
}

async function currentView(root: string, revision: number): Promise<Snapshot> {
  const view = await snapshot(root);
  if (!view) throw new Error("No saved game phase. Run gamedev:start first.");
  if (view.state.revision !== revision)
    throw new Error(
      "Workflow state changed. Read status again before retrying.",
    );
  return view;
}

export async function main(argv: string[]): Promise<Reply> {
  try {
    const options = parseArguments(argv);
    const body = readBody();
    if (options.action !== "status" && options.action !== "history")
      await applyUpdate(options, body);
    const view = await snapshot(options.root);
    const reply: Reply = { ok: true, snapshot: view ? toJson(view) : null };
    if (options.action === "history" && view)
      reply.history = view.state.history.slice(-20);
    return reply;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const reply = await main(process.argv.slice(2));
  process.stdout.write(JSON.stringify(reply) + "\n");
  if (!reply.ok) process.exitCode = 1;
}

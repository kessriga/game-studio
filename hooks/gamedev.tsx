import { atom, read, update } from "claude-code";
import type { EngineInterface, Register, Timer } from "claude-code";
import type { Tracking, WorkflowReply } from "../types";
import { MARKERS, parseWorkflowReply, workflowArgv } from "./project.ts";
import type { WorkflowRequest } from "./project.ts";
import {
  COMMAND,
  historyText,
  parseWorkflowCommand,
  TOOL,
  TOOL_DESCRIPTION,
  TOOL_NAME,
  TOOL_SCHEMA,
  toolBody,
} from "./commands.ts";
import type { WorkflowCommand } from "./commands.ts";
import {
  ACTIVE_STATE,
  GUIDE,
  handoffNote,
  hasRootGuide,
  nestedGuideNote,
  newNestedGuides,
  promptContext,
  rootGuideFile,
  touchedPath,
} from "./context.ts";
import {
  checkAsset,
  checksNote,
  checkStagedFiles,
  commitStagesAll,
  isAssetPath,
  isGitCommit,
  isGitPush,
  pathsToRead,
  protectedPushTarget,
  pushReminder,
} from "./validators.ts";
import type { Finding, StagedFile } from "./validators.ts";
import { PANE, paneTree, statusText, summaryText } from "./view.tsx";

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
]);

const NOT_A_PROJECT =
  "This directory is not a Game Studio project: no project markers found. Run /gamedev:start in the game repository.";

/** The game repository this session tracks; undefined outside a game project. A reload re-detects it. */
let root: string | undefined;
let pending: Timer | undefined;
/** The newest refresh issued; an older in-flight result is dropped. */
let refreshSequence = 0;
/** Directories whose nested AGENTS.md this session has already shown. */
const shownGuides = new Set<string>();

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
  const sequence = ++refreshSequence;
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
  if (sequence !== refreshSequence) return next;
  await update($, tracking, () => next);
  $.ui.status((await read($, isHidden)) ? undefined : statusText(next));
  return next;
}

type Approval = Exclude<
  WorkflowCommand,
  | { usage: string }
  | { action: "status" | "panel" | "history" | "hide" | "show" }
>;

/** Approve, finish, handoff, or gate: the user confirms in the ask dialog; the core checks the revision again. */
async function approveFromUser(
  $: EngineInterface,
  command: Approval,
): Promise<string> {
  if (!root) return NOT_A_PROJECT;
  const before = await refresh($);
  if (before.kind !== "view") return summaryText(before);
  const { view } = before;
  const destination = view.nextLabel ?? "release sign-off";
  let prompt: string;
  let body: Record<string, unknown>;
  if (command.action === "gate") {
    const unresolved = view.steps
      .filter((step) => view.blockers.includes(step.id))
      .map((step) => step.name);
    prompt = unresolved.length
      ? `Unresolved: ${unresolved.join(", ")}. Record an override toward ${destination}?`
      : `Recorded steps are approved. Record your decision toward ${destination}? This does not replace the gate-check review.`;
    body = { note: command.note };
  } else if (command.action === "finish") {
    const step = view.steps.find((item) => item.id === command.id);
    if (!step?.repeatable) return "Choose a repeatable step in this phase.";
    const sources = [
      ...new Set(
        view.runs
          .filter((run) => run.phase === view.phase && run.step === step.id)
          .map((run) => run.source),
      ),
    ];
    prompt = `Confirm ALL intended subjects for ${step.id} are complete, not just the recorded runs. Check the systems list or Backlog board first.\nSources: ${sources.join(", ") || "none recorded"}`;
    body = { step: step.id, note: command.note };
  } else {
    const run = view.runs.find(
      (item) => item.id === command.id && item.phase === view.phase,
    );
    if (!run) return "Run not found in this phase.";
    const evidence =
      run.evidence.join(", ") ||
      "No file evidence; manual verification required.";
    prompt =
      command.action === "approve"
        ? `Approve ${run.id}? ${run.note}\nSource: ${run.source}\nEvidence: ${evidence}\nConfirm you checked the result and any required independent review.`
        : `Hand off ${run.id} from ${run.source} to the coordinator ${root}?\nEvidence: ${evidence}\nAll reviewed hashes must match. No files are copied and the stage stays unchanged. Repeatable scope reopens, including aggregate review.`;
    body = { run: run.id, note: command.note };
  }
  let answer: string;
  try {
    answer = await $.ui.ask(`${prompt}\nYour note: ${command.note}\nConfirm?`, [
      "Confirm",
      "Cancel",
    ]);
  } catch {
    return "Cancelled; nothing recorded.";
  }
  if (answer !== "Confirm") return "Cancelled; nothing recorded.";
  const reply = await runWorkflow($, {
    root,
    action: command.action,
    actor: `user:${await $.session.id()}`,
    revision: view.revision,
    body,
  });
  await refresh($);
  if (!reply.ok) return reply.error;
  if (command.action === "handoff")
    return "Handoff recorded; scope reopened and stage unchanged.";
  if (command.action === "gate")
    return "Decision recorded; stage unchanged. Use /gamedev:gate-check to review and advance with your approval.";
  return "Approval recorded. Changed evidence will require a new review.";
}

/** Attach notes the model reads after a tool's result; the person never sees them typed. */
function withNotes<R extends { context?: readonly string[] }>(
  result: R,
  notes: readonly string[],
): R {
  if (!notes.length) return result;
  return { ...result, context: [...(result.context ?? []), ...notes] };
}

async function readOptional(
  $: EngineInterface,
  path: string,
): Promise<string | undefined> {
  try {
    const text = await $.fs.read(path);
    return typeof text === "string" ? text : undefined;
  } catch {
    return undefined;
  }
}

/** Files a commit will record: the index, plus tracked changes when -a stages them. */
async function changedPaths(
  $: EngineInterface,
  command: string,
): Promise<string[]> {
  const listings = [
    ["git", "diff", "--cached", "--name-only", "-z", "--relative"],
  ];
  if (commitStagesAll(command))
    listings.push(["git", "diff", "--name-only", "-z", "--relative"]);
  const paths = new Set<string>();
  for (const argv of listings) {
    const listed = await $.process.run(argv, { cwd: root });
    if (listed.exitCode !== 0) continue;
    for (const path of listed.stdout.split("\0")) if (path) paths.add(path);
  }
  return [...paths];
}

async function stagedFinding(
  $: EngineInterface,
  command: string,
): Promise<Finding> {
  const paths = pathsToRead(await changedPaths($, command));
  const files: StagedFile[] = [];
  for (const path of paths)
    files.push({ path, content: await readOptional($, `${root}/${path}`) });
  return checkStagedFiles(files);
}

async function currentBranch($: EngineInterface): Promise<string | undefined> {
  const result = await $.process.run(
    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
    {
      cwd: root,
    },
  );
  return result.exitCode === 0 ? result.stdout.trim() : undefined;
}

async function assetNotes(
  $: EngineInterface,
  path: string,
  content: string | undefined,
): Promise<string[]> {
  const finding = checkAsset(path, content ?? (await readOptional($, path)));
  return finding.notes.length
    ? [checksNote("asset checks", finding.notes)]
    : [];
}

/** Nested AGENTS.md guides above a touched path, each shown once per session. */
async function nestedGuideNotes(
  $: EngineInterface,
  path: string,
): Promise<string[]> {
  if (!root) return [];
  let found;
  try {
    found = await $.fs.ancestors({ names: [GUIDE], of: path, below: root });
  } catch {
    return [];
  }
  return newNestedGuides(found, root, shownGuides).map(nestedGuideNote);
}

function reportRefreshFailure($: EngineInterface, error: unknown): void {
  $.ui.status(`Game Studio: refresh failed: ${String(error)}`);
}

function refreshSoon($: EngineInterface): void {
  pending?.cancel();
  pending = $.clock.after(250, () => {
    pending = undefined;
    refresh($).catch((error) => reportRefreshFailure($, error));
  });
}

/** Approvals come from the person's own prompt, never from a model-run command. */
function isPersonsCommand(origin: { kind: string }): boolean {
  return (
    origin.kind === "composer" ||
    origin.kind === "bridge" ||
    origin.kind === "sdk"
  );
}

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    pending?.cancel();
    pending = undefined;
    shownGuides.clear();
    root = (await isGameProject($, e.cwd)) ? e.cwd : undefined;
    if (!root) {
      $.ui.status(undefined);
      return next(e);
    }
    await $.tool.register({
      name: TOOL,
      description: TOOL_DESCRIPTION,
      inputSchema: TOOL_SCHEMA,
    });
    await $.command.register({
      name: COMMAND,
      description:
        "Game Studio workflow: status, panel, history, approve <run> <note>, finish <step> <note>, handoff <run> <note>, gate <note>, hide, show",
      argumentHint: "[action] [id] [note]",
    });
    await refresh($);
    if (e.isInteractive)
      $.ui.open({ id: PANE, title: "Game Studio" }).catch((error) =>
        $.ui.log(`Game Studio pane did not open: ${String(error)}`, {
          to: "debug",
        }),
      );
    return next(e);
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) =>
    paneTree($.ui.resolve(e), await read($, tracking)),
  );

  on("tool.call", { tool: TOOL_NAME }, async ($, e) => {
    const fail = (message: string) => ({
      isError: true as const,
      result: message,
      text: message,
    });
    if (!root) return fail(NOT_A_PROJECT);
    const input = e as unknown as Record<string, unknown>;
    const action = typeof input.action === "string" ? input.action : "status";
    const revision =
      typeof input.revision === "number" ? input.revision : undefined;
    if (action !== "status") {
      if (revision === undefined)
        return fail("Read status first and provide its revision.");
      const reply = await runWorkflow($, {
        root,
        action,
        actor: `agent:${await $.session.id()}`,
        revision,
        body: toolBody(input),
      });
      if (!reply.ok) {
        await refresh($);
        return fail(reply.error);
      }
    }
    const text = summaryText(await refresh($));
    return { result: text, text };
  });

  on("command.run", { command: COMMAND }, async ($, e) => {
    if (!root) return { text: NOT_A_PROJECT };
    const command = parseWorkflowCommand(e.args);
    if ("usage" in command) return { text: command.usage };
    switch (command.action) {
      case "panel":
        await $.ui.open({ id: PANE, title: "Game Studio" });
        return { text: "Game Studio pane opened." };
      case "hide":
        await update($, isHidden, () => true);
        $.ui.status(undefined);
        return { text: "Game Studio status line hidden for this session." };
      case "show":
        await update($, isHidden, () => false);
        await refresh($);
        return { text: "Game Studio status line shown." };
      case "history": {
        const reply = await runWorkflow($, {
          root,
          action: "history",
          actor: "agent:history",
        });
        return { text: reply.ok ? historyText(reply.history) : reply.error };
      }
      case "status":
        return { text: summaryText(await refresh($)) };
      default:
        if (!isPersonsCommand(e.origin))
          return {
            text: "Approvals are typed by the user; the model records evidence with the workflow tool.",
          };
        return { text: await approveFromUser($, command) };
    }
  });

  on("tool.call", { tool: "Bash" }, async ($, e, next) => {
    if (!root) return next(e);
    const notes: string[] = [];
    if (isGitCommit(e.command)) {
      const finding = await stagedFinding($, e.command);
      if (finding.deny) return { deny: finding.deny };
      if (finding.notes.length)
        notes.push(checksNote("commit checks", finding.notes));
    } else if (isGitPush(e.command)) {
      const target = protectedPushTarget(e.command, await currentBranch($));
      if (target) notes.push(pushReminder(target));
    }
    return withNotes(await next(e), notes);
  });

  on("tool.call", { tool: "Write" }, async ($, e, next) => {
    const result = await next(e);
    if (!root || result.deny || result.isError || !isAssetPath(e.file_path))
      return result;
    return withNotes(result, await assetNotes($, e.file_path, e.content));
  });

  on("tool.call", { tool: "Edit" }, async ($, e, next) => {
    const result = await next(e);
    if (!root || result.deny || result.isError || !isAssetPath(e.file_path))
      return result;
    return withNotes(result, await assetNotes($, e.file_path, undefined));
  });

  on("prompt.submit", async ($, e, next) => {
    if (!root) return next(e);
    const text = promptContext(summaryText(await refresh($)));
    return next({ ...e, context: [...(e.context ?? []), text] });
  });

  on("prompt.context", async ($, e, next) => {
    const result = await next(e);
    if (!root || !result.instructionFiles) return result;
    if (hasRootGuide(result.instructionFiles, root)) return result;
    const content = await readOptional($, `${root}/${GUIDE}`);
    if (content === undefined) return result;
    return {
      ...result,
      instructionFiles: [
        ...result.instructionFiles,
        rootGuideFile(root, content),
      ],
    };
  });

  on("classic.PreCompact", async ($, e, next) => {
    if (root) {
      const content = await readOptional($, `${root}/${ACTIVE_STATE}`);
      if (content?.trim()) {
        try {
          await $.session.append({
            message: {
              type: "user",
              content: [{ type: "text", text: handoffNote(content) }],
            },
          });
        } catch {
          $.ui.log(
            "Game Studio could not keep the handoff before compaction.",
            {
              to: "debug",
            },
          );
        }
      }
    }
    return next(e);
  });

  on("turn.complete", async ($, e, next) => {
    const result = await next(e);
    if (root) refreshSoon($);
    return result;
  });

  on("tool.call", async ($, e, next) => {
    const result = await next(e);
    if (!root) return result;
    if (REFRESH_TOOLS.has(e.tool)) refreshSoon($);
    const path = touchedPath(e as unknown as Record<string, unknown>);
    if (!path || result.deny) return result;
    return withNotes(result, await nestedGuideNotes($, path));
  });
};

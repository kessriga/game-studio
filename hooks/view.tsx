import type { Elements, RenderSurface } from "claude-code";
import type {
  Tracking,
  WorkflowProgress,
  WorkflowStep,
  WorkflowView,
} from "../types";

export const PANE = "gamedev";

/** Render the catalog's neutral `gamedev:<skill>` identifier as Claude Code's command. */
export function claudeCommand(command: string | undefined): string | undefined {
  return command?.replace(/^gamedev:/, "/gamedev:");
}

function stepLabel(step: WorkflowStep): string {
  const command = claudeCommand(step.command);
  return command ? `${command} · ${step.name}` : step.name;
}

type Focus = { previous: string; current: string; next: string };

/** The three lines Pi's compact widget shows, computed from the CLI view. */
export function focusOf(view: WorkflowView): Focus {
  const current = view.runs
    .filter((run) => run.phase === view.phase && run.status !== "approved")
    .at(-1);
  const remaining = view.steps.filter(
    (step) => step.required && !step.complete,
  );
  const focused = current
    ? view.steps.find((step) => step.id === current.step)
    : remaining[0];
  const status =
    current?.status === "submitted"
      ? "awaiting user approval"
      : current?.status;
  const currentText = current
    ? `${current.id} ${current.step}${current.subject ? ` · ${current.subject}` : ""} (${status}${current.source.startsWith("worktree") ? "; worktree evidence" : ""})`
    : focused
      ? stepLabel(focused)
      : "Ready for phase review";
  const nextStep = remaining.find((step) => step.id !== focused?.id);
  const next = nextStep
    ? stepLabel(nextStep)
    : (view.nextLabel ?? "Release sign-off");
  const previousStep = view.steps.filter((step) => step.complete).at(-1);
  const previous = previousStep ? previousStep.name : "none approved";
  return { previous, current: currentText, next };
}

/** "MVP systems 5/28 approved · all 5/48", or nothing outside a counted phase. */
export function progressText(
  progress: WorkflowProgress | undefined,
): string | undefined {
  if (!progress) return undefined;
  const all = `${progress.done}/${progress.total}`;
  const { focus } = progress;
  return focus
    ? `${focus.label} ${progress.label} ${focus.done}/${focus.total} approved · all ${all}`
    : `${progress.label} ${all} approved`;
}

export type Action = {
  kind: "approve" | "handoff" | "finish";
  what: string;
  command: string;
};

/** The workflow steps only the user can take: approve, hand off, or finish a step's scope. */
export function pendingActions(view: WorkflowView): Action[] {
  const runs = view.runs.filter(
    (run) => run.phase === view.phase && !run.superseded,
  );
  const what = (run: WorkflowView["runs"][number]) =>
    `${run.step}${run.subject ? ` · ${run.subject}` : ""}`;
  const approve = runs
    .filter((run) => run.status === "submitted")
    .map((run) => ({
      kind: "approve" as const,
      what: what(run),
      command: `/gamedev-workflow approve ${run.id} <what you verified>`,
    }));
  const handoff = runs
    .filter(
      (run) => run.status === "approved" && run.source.startsWith("worktree"),
    )
    .map((run) => ({
      kind: "handoff" as const,
      what: what(run),
      command: `/gamedev-workflow handoff ${run.id} <note>`,
    }));
  const counted = view.progress?.focus ?? view.progress;
  const scopeDone = !counted || counted.done === counted.total;
  const finish = view.steps
    .filter((step) => step.finishable && scopeDone)
    .map((step) => ({
      kind: "finish" as const,
      what: step.name,
      command: `/gamedev-workflow finish ${step.id} <scope you confirmed>`,
    }));
  return [...approve, ...handoff, ...finish];
}

/** The text the model and the command output read: Pi's summary in Claude syntax. */
export function summaryText(tracking: Tracking): string {
  if (tracking.kind === "none")
    return "No saved game phase. Run /gamedev:start; tracking does not infer completion from a directory.";
  if (tracking.kind === "error")
    return `Workflow tracking is unavailable: ${tracking.message} Do not overwrite or reset its state.`;
  const { view } = tracking;
  const focus = focusOf(view);
  const lines = [
    `Game Studio · ${view.label} · ${view.index}/${view.count} | Previous: ${focus.previous}`,
    `Current: ${focus.current}`,
    `Next required: ${focus.next}`,
    ...(view.progress ? [`Progress: ${progressText(view.progress)}`] : []),
    `State revision: ${view.revision}`,
    ...view.steps.map(
      (step) =>
        `${step.id}: ${step.status}${step.required ? " [required]" : " [optional]"}`,
    ),
  ];
  const active = view.runs
    .filter(
      (run) =>
        run.phase === view.phase &&
        !run.superseded &&
        (run.status !== "approved" || run.source.startsWith("worktree")),
    )
    .slice(-8);
  for (const run of active)
    lines.push(
      `${run.id}: ${run.step} ${run.subject} — ${run.note} [source: ${run.source}]`,
    );
  const actions = pendingActions(view);
  if (actions.length)
    lines.push(
      `Waiting on the user: ${actions.map((action) => `${action.kind} ${action.what} (${action.command})`).join("; ")}`,
    );
  lines.push(
    "Artifact presence is not approval. Repeatable steps need scope confirmation. Backlog remains the story authority.",
  );
  return lines.join("\n");
}

type Marker = { glyph: string; color: string };

/** Glyph and theme color for a step, so the pane reads at a glance. */
function marker(step: WorkflowStep): Marker {
  if (step.complete) return { glyph: "✓", color: "success" };
  if (step.status.startsWith("active")) return { glyph: "▶", color: "claude" };
  if (step.status.startsWith("blocked")) return { glyph: "!", color: "error" };
  return { glyph: "○", color: "inactive" };
}

/** One dot per phase, filled up to the current phase and spaced for legibility. */
function phaseDots(view: WorkflowView): string {
  const filled = Array<string>(view.index).fill("●");
  const empty = Array<string>(view.count - view.index).fill("○");
  return [...filled, ...empty].join(" ");
}

export type PaneElements = Pick<Elements[RenderSurface], "Box" | "Text">;

export function paneTree({ Box, Text }: PaneElements, tracking: Tracking) {
  if (tracking.kind === "none")
    return (
      <Box paddingX={1}>
        <Text dimColor>
          No saved game phase. Run /gamedev:start to begin tracking.
        </Text>
      </Box>
    );
  if (tracking.kind === "error")
    return (
      <Box paddingX={1}>
        <Text color="error">{tracking.message}</Text>
      </Box>
    );
  const { view } = tracking;
  const progress = progressText(view.progress);
  const actions = pendingActions(view);
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text wrap="truncate-end">
        <Text bold color="claude">
          {view.label}
        </Text>
        <Text dimColor>
          {" "}
          · phase {view.index}/{view.count}{" "}
        </Text>
        <Text color="claude">{phaseDots(view)}</Text>
      </Text>
      {progress ? <Text wrap="truncate-end">{progress}</Text> : ""}
      {actions.length ? (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="warning">
            Needs you
          </Text>
          {actions.map((action) => (
            <Box flexDirection="column">
              <Text wrap="truncate-end">
                <Text color="warning">!</Text> {action.kind} {action.what}
              </Text>
              <Text wrap="truncate-end" color="suggestion">
                {"  "}
                {action.command}
              </Text>
            </Box>
          ))}
        </Box>
      ) : (
        ""
      )}
      <Box flexDirection="column" marginTop={1}>
        {view.steps.map((step) => {
          const { glyph, color } = marker(step);
          const command = claudeCommand(step.command);
          return (
            <Box flexDirection="column">
              <Text wrap="truncate-end">
                <Text color={color}>{glyph}</Text>
                <Text bold={!step.complete && step.required}> {step.name}</Text>
                {step.required ? "" : <Text dimColor> (optional)</Text>}
              </Text>
              <Text wrap="truncate-end">
                <Text dimColor>
                  {"  "}
                  {step.status}
                </Text>
                {command ? <Text color="suggestion"> · {command}</Text> : ""}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text wrap="truncate-end">
          <Text dimColor>Next phase: </Text>
          <Text>{view.nextLabel ?? "end"}</Text>
        </Text>
      </Box>
    </Box>
  );
}

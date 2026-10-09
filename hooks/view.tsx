import type { Elements, RenderSurface } from "claude-code";
import type { Tracking, WorkflowStep, WorkflowView } from "../types";

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

export function statusText(tracking: Tracking): string | undefined {
  if (tracking.kind === "none") return undefined;
  if (tracking.kind === "error") return `Game Studio: ${tracking.message}`;
  const { view } = tracking;
  const focus = focusOf(view);
  return `Game Studio · ${view.label} ${view.index}/${view.count} · Current: ${focus.current} · Next: ${focus.next}`;
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
        (run.status !== "approved" || run.source.startsWith("worktree")),
    )
    .slice(-8);
  for (const run of active)
    lines.push(
      `${run.id}: ${run.step} ${run.subject} — ${run.note} [source: ${run.source}]`,
    );
  lines.push(
    "Artifact presence is not approval. Repeatable steps need scope confirmation. Backlog remains the story authority.",
  );
  return lines.join("\n");
}

function marker(step: WorkflowStep): string {
  if (step.complete) return "✓";
  if (step.status.startsWith("active")) return "▶";
  if (step.status.startsWith("blocked")) return "!";
  return "○";
}

export type PaneElements = Pick<Elements[RenderSurface], "Box" | "Text">;

export function paneTree({ Box, Text }: PaneElements, tracking: Tracking) {
  if (tracking.kind === "none")
    return (
      <Box>
        <Text dimColor>
          No saved game phase. Run /gamedev:start to begin tracking.
        </Text>
      </Box>
    );
  if (tracking.kind === "error")
    return (
      <Box>
        <Text color="red">{tracking.message}</Text>
      </Box>
    );
  const { view } = tracking;
  return (
    <Box flexDirection="column">
      <Text bold>
        Game Studio · {view.label} ({view.index}/{view.count})
      </Text>
      {view.steps.map((step) => (
        <Box flexDirection="column">
          <Text wrap="truncate-end">
            {marker(step)} {step.name}
            {step.required ? "" : " (optional)"}
          </Text>
          <Text dimColor wrap="truncate-end">
            {"  "}
            {step.status}
            {claudeCommand(step.command)
              ? ` · ${claudeCommand(step.command)}`
              : ""}
          </Text>
        </Box>
      ))}
      <Text dimColor>Next phase: {view.nextLabel ?? "end"}</Text>
    </Box>
  );
}

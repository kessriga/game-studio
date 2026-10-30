/**
 * State contract of the gamedev mod. The values mirror the JSON reply of
 * workflow/cli.ts so the pane never reads the core directly.
 */
export type WorkflowStep = {
  id: string;
  name: string;
  command?: string;
  required: boolean;
  repeatable: boolean;
  aggregate: boolean;
  status: string;
  complete: boolean;
  /** Every run is approved with current evidence; the user can confirm the scope. */
  finishable: boolean;
  artifacts: string[];
};

export type WorkflowCount = { done: number; total: number };

/** Rows of a project index table, such as the systems index, that reached the done status. */
export type WorkflowProgress = WorkflowCount & {
  label: string;
  focus?: WorkflowCount & { label: string };
};

export type WorkflowRun = {
  id: string;
  phase: string;
  step: string;
  subject: string;
  status: string;
  note: string;
  evidence: string[];
  source: string;
  /** A newer run for the same step and subject replaces this one. */
  superseded: boolean;
};

export type WorkflowView = {
  phase: string;
  label: string;
  index: number;
  count: number;
  nextPhase: string | null;
  nextLabel: string | null;
  revision: number;
  steps: WorkflowStep[];
  runs: WorkflowRun[];
  blockers: string[];
  progress?: WorkflowProgress;
};

export type WorkflowHistory = {
  at: string;
  actor: string;
  action: string;
  note: string;
};

export type WorkflowReply =
  | { ok: true; snapshot: WorkflowView | null; history?: WorkflowHistory[] }
  | { ok: false; error: string };

export type Tracking =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "view"; view: WorkflowView };

declare module "claude-code" {
  interface PluginState {
    gamedev: { tracking: Tracking };
  }
}

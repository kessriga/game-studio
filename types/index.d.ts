/**
 * State contract of the gamedev mod. The values mirror the JSON reply of
 * workflow/cli.ts so the pane and status line never read the core directly.
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
  artifacts: string[];
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
    gamedev: { tracking: Tracking; isHidden: boolean };
  }
}

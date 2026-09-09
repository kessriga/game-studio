import { readFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import {
  captureSource,
  checkoutIdentity,
  effectiveSource,
  runRoot,
  sourceRoot,
  evidenceCurrent,
  fingerprint,
  readOptional,
  readState,
  updateState,
} from "./progress-store.ts";
import type {
  Evidence,
  EvidenceSource,
  ProgressState,
  Run,
} from "./progress-store.ts";

export type Step = {
  id: string;
  name: string;
  command?: string;
  description: string;
  required: boolean;
  repeatable?: boolean;
  artifact?: {
    glob?: string;
    pattern?: string;
    min_count?: number;
    aggregate?: boolean;
    note?: string;
  };
};
export type Phase = { label: string; next_phase: string | null; steps: Step[] };
export const phases = loadCatalog();

function loadCatalog(): Record<string, Phase> {
  try {
    return JSON.parse(
      readFileSync(new URL("workflow-catalog.json", import.meta.url), "utf8"),
    ).phases;
  } catch (cause) {
    throw new Error(
      "Cannot load the bundled workflow catalog. Regenerate Pi resources.",
      { cause },
    );
  }
}

export type Row = {
  step: Step;
  status: string;
  runs: Run[];
  artifacts: string[];
  artifactRefs?: ArtifactRef[];
  runsApproved: boolean;
  complete: boolean;
};
export type Snapshot = {
  phase: string;
  label: string;
  nextPhase: string | null;
  state: ProgressState;
  rows: Row[];
};
export type Update =
  | { action: "start"; step: string; subject: string; note: string }
  | { action: "block"; run: string; note: string }
  | {
      action: "submit";
      run: string;
      note: string;
      evidence: string[];
      worktree?: string;
    }
  | { action: "handoff"; run: string; note: string }
  | { action: "approve"; run: string; note: string }
  | {
      action: "finish";
      step: string;
      note: string;
      reviewedEvidence?: Evidence[];
    };

export async function currentPhase(root: string): Promise<string | undefined> {
  const saved = (await readOptional(root, "production/stage.txt"))?.trim();
  if (!saved) return undefined;
  const match = Object.entries(phases).find(
    ([, phase]) => phase.label === saved,
  );
  if (!match)
    throw new Error(
      `Unknown saved phase: ${saved}. Correct production/stage.txt before tracking work.`,
    );
  return match[0];
}

function getStep(phase: string, id: string): Step {
  const step = phases[phase]?.steps.find((item) => item.id === id);
  if (!step) throw new Error(`Unknown workflow step: ${phase}/${id}`);
  return step;
}

function latestRuns(state: ProgressState, phase: string, step: string): Run[] {
  const bySubject = new Map<string, Run>();
  for (const run of state.runs) {
    if (run.phase === phase && run.step === step)
      bySubject.set(run.subject, run);
  }
  return [...bySubject.values()];
}

export async function artifactFiles(
  root: string,
  step: Step,
): Promise<string[]> {
  if (!step.artifact?.glob) return [];
  const paths: string[] = [];
  for await (const path of glob(step.artifact.glob, { cwd: root })) {
    const text = await readOptional(root, path);
    if (!text?.trim()) continue;
    if (
      !step.artifact.pattern ||
      new RegExp(step.artifact.pattern, "m").test(text)
    )
      paths.push(path.replaceAll("\\", "/"));
  }
  return paths.sort();
}

function requireArtifacts(step: Step, artifacts: string[]): void {
  if (
    step.artifact?.glob &&
    artifacts.length < (step.artifact.min_count ?? 1)
  ) {
    throw new Error(
      `${step.name}: missing required artifacts (${artifacts.length}/${step.artifact.min_count ?? 1}).`,
    );
  }
}

type ArtifactRef = { path: string; source?: EvidenceSource };
const evidenceKey = (item: ArtifactRef) =>
  JSON.stringify([item.source?.checkout ?? null, item.path]);
const runEvidence = (run: Run): Evidence[] =>
  run.evidence.map((item) => ({
    ...item,
    ...(effectiveSource(run) ? { source: effectiveSource(run) } : {}),
  }));
function conflictingCopies(evidence: Evidence[]): boolean {
  const hashes = new Map<string, string>();
  for (const item of evidence) {
    if (hashes.has(item.path) && hashes.get(item.path) !== item.sha256)
      return true;
    hashes.set(item.path, item.sha256);
  }
  return false;
}

function aggregateSourcesCovered(
  step: Step,
  runs: Run[],
  artifacts: ArtifactRef[],
): boolean {
  if (!step.artifact?.aggregate || !step.artifact.glob) return true;
  return runs.every((run) => {
    const source = JSON.stringify(effectiveSource(run)?.checkout ?? null);
    return (
      artifacts.filter(
        (item) => JSON.stringify(item.source?.checkout ?? null) === source,
      ).length >= (step.artifact!.min_count ?? 1)
    );
  });
}

export async function scopeEvidence(
  root: string,
  row: Row,
): Promise<Evidence[]> {
  return Promise.all(
    (
      row.artifactRefs ?? row.artifacts.map((path): ArtifactRef => ({ path }))
    ).map(async (item) => ({
      ...(await fingerprint(await sourceRoot(root, item.source), item.path)),
      ...(item.source ? { source: item.source } : {}),
    })),
  );
}

async function rowFor(
  root: string,
  state: ProgressState,
  phase: string,
  step: Step,
): Promise<Row> {
  const runs = latestRuns(state, phase, step.id);
  const artifactRefs: ArtifactRef[] = [];
  const sources = new Set<string>();
  let stale = false;
  for (const run of runs) {
    try {
      const directory = await runRoot(root, run);
      if (!(await evidenceCurrent(directory, run.evidence))) stale = true;
      const source = effectiveSource(run);
      const key = JSON.stringify(source?.checkout ?? null);
      if (!sources.has(key)) {
        sources.add(key);
        artifactRefs.push(
          ...(await artifactFiles(directory, step)).map((path) => ({
            path,
            ...(source ? { source } : {}),
          })),
        );
      }
    } catch {
      stale = true;
    }
  }
  if (!runs.length)
    artifactRefs.push(
      ...(await artifactFiles(root, step)).map((path) => ({ path })),
    );
  const artifacts = [...new Set(artifactRefs.map((item) => item.path))].sort();
  const latest = runs.at(-1);
  const approved =
    runs.length > 0 && runs.every((run) => run.status === "approved") && !stale;
  const scope = state.scopes.find(
    (item) => item.phase === phase && item.step === step.id,
  );
  const scopeCurrent =
    scope &&
    scope.runs.length === runs.length &&
    runs.every((run) => scope.runs.includes(run.id)) &&
    (await evidenceCurrent(root, scope.evidence ?? []));
  const hasArtifacts =
    (!step.artifact?.glob ||
      artifacts.length >= (step.artifact.min_count ?? 1)) &&
    aggregateSourcesCovered(step, runs, artifactRefs);
  const subjectEvidence = runs.flatMap(runEvidence);
  const evidence = step.artifact?.aggregate
    ? (scope?.evidence ?? [])
    : subjectEvidence;
  const captured = new Set(evidence.map(evidenceKey));
  const artifactSetCurrent =
    artifactRefs.every((item) => captured.has(evidenceKey(item))) &&
    !conflictingCopies([...subjectEvidence, ...evidence]);
  const complete =
    approved &&
    hasArtifacts &&
    artifactSetCurrent &&
    (!step.repeatable || Boolean(scopeCurrent));
  let status =
    artifacts.length > 0 ? "artifact found; not approved" : "pending";
  if (latest) status = latest.status;
  if (approved && step.repeatable && !scopeCurrent)
    status = `${runs.length} approved; scope open`;
  if (complete) status = "approved";
  if (runs.some((run) => run.status === "submitted")) status = "submitted";
  if (
    stale ||
    (approved &&
      (!hasArtifacts ||
        (!artifactSetCurrent && (!step.artifact?.aggregate || scope))))
  )
    status = "stale evidence";
  const active = runs.find(
    (run) => run.status === "active" || run.status === "blocked",
  );
  if (active && !(stale && runs.some((run) => run.source)))
    status = `${active.status}: ${active.subject || active.id}`;
  if (runs.some((run) => effectiveSource(run)))
    status += " [worktree evidence]";
  return {
    step,
    status,
    runs,
    artifacts,
    artifactRefs,
    runsApproved: approved,
    complete,
  };
}

export async function snapshot(root: string): Promise<Snapshot | undefined> {
  const phase = await currentPhase(root);
  if (!phase) return undefined;
  const state = await readState(root);
  for (const run of state.runs) getStep(run.phase, run.step);
  const rows = await Promise.all(
    phases[phase].steps.map((step) => rowFor(root, state, phase, step)),
  );
  return {
    phase,
    label: phases[phase].label,
    nextPhase: phases[phase].next_phase,
    state,
    rows,
  };
}

export function blockers(view: Snapshot): Row[] {
  return view.rows.filter((row) => row.step.required && !row.complete);
}

function requireNote(note: string): void {
  if (!note.trim() || note.length > 2000)
    throw new Error(
      "Provide a concise reason or evidence summary (1–2000 characters).",
    );
}

function requireRun(state: ProgressState, phase: string, id: string): Run {
  const run = state.runs.find((item) => item.id === id);
  if (!run || run.phase !== phase)
    throw new Error("Run not found in the current phase.");
  if (!latestRuns(state, phase, run.step).includes(run))
    throw new Error("A newer run supersedes this one.");
  return run;
}

function startRun(
  state: ProgressState,
  phase: string,
  update: Extract<Update, { action: "start" }>,
): void {
  const step = getStep(phase, update.step);
  const subject = update.subject.trim();
  if (subject.length > 500 || (step.repeatable && !subject))
    throw new Error(
      "Repeatable steps need a subject, such as a story ID or system name.",
    );
  if (!step.repeatable && subject)
    throw new Error("Subjects are only used for repeatable steps.");
  const existing = latestRuns(state, phase, step.id).find(
    (run) => run.subject === subject,
  );
  if (existing && existing.status !== "approved")
    throw new Error(
      `Resume ${existing.id} instead of starting a duplicate run.`,
    );
  const id = `r${state.runs.length + 1}`;
  if (state.runs.some((run) => run.id === id))
    throw new Error(
      "Run IDs are inconsistent; repair state before continuing.",
    );
  state.runs.push({
    id,
    phase,
    step: step.id,
    subject,
    status: "active",
    note: update.note,
    evidence: [],
  });
  state.scopes = state.scopes.filter(
    (scope) => scope.phase !== phase || scope.step !== step.id,
  );
}

async function submitRun(
  root: string,
  run: Run,
  update: Extract<Update, { action: "submit" }>,
): Promise<void> {
  if (run.status === "approved")
    throw new Error("Start a new run before revising approved work.");
  const source =
    update.worktree === undefined
      ? run.source
      : await captureSource(root, update.worktree);
  const directory = await sourceRoot(root, source);
  const step = getStep(run.phase, run.step);
  const artifacts = await artifactFiles(directory, step);
  if (!step.repeatable) requireArtifacts(step, artifacts);
  const selected = step.repeatable
    ? update.evidence
    : [...artifacts, ...update.evidence];
  const paths = [
    ...new Set(
      selected.map((path) => path.replaceAll("\\", "/").replace(/^\.\//, "")),
    ),
  ];
  if (
    step.repeatable &&
    step.artifact?.glob &&
    (step.artifact.aggregate
      ? paths.length === 0
      : !paths.some((path) => artifacts.includes(path)))
  ) {
    throw new Error(
      "Include subject evidence files (matching catalog artifacts unless it names a shared aggregate); phase-wide minimums apply at scope completion.",
    );
  }
  if (paths.length > 50) throw new Error("Use at most 50 evidence files.");
  const evidence: Evidence[] = await Promise.all(
    paths.map((path) => fingerprint(directory, path)),
  );
  run.source = source;
  run.evidence = evidence;
  run.status = "submitted";
  run.note = update.note;
}

export async function checkRunApproval(root: string, run: Run): Promise<void> {
  if (run.status !== "submitted")
    throw new Error("Submit evidence before requesting approval.");
  const directory = await runRoot(root, run);
  if (!(await evidenceCurrent(directory, run.evidence)))
    throw new Error("Evidence changed. Submit it again before approval.");
  const step = getStep(run.phase, run.step);
  const artifacts = await artifactFiles(directory, step);
  if (!step.repeatable) {
    requireArtifacts(step, artifacts);
    if (
      artifacts.some(
        (path) =>
          !run.evidence.some(
            (item) => item.path === path.replaceAll("\\", "/"),
          ),
      )
    ) {
      throw new Error("New artifacts appeared. Submit them before approval.");
    }
  }
}

/** Handoff verifies reviewed run files only; aggregate scope must be reviewed again. */
export async function checkHandoff(root: string, run: Run): Promise<void> {
  if (run.status !== "approved" || !run.source || run.handoff)
    throw new Error(
      "Handoff requires an approved worktree run without a prior handoff.",
    );
  const coordinator = await checkoutIdentity(root);
  if (
    coordinator.commonDir !== run.source.checkout.commonDir ||
    coordinator.commonIdentity !== run.source.checkout.commonIdentity
  )
    throw new Error(
      "Handoff coordinator must belong to the original Git repository.",
    );
  if (!(await evidenceCurrent(root, run.evidence)))
    throw new Error(
      "Canonical evidence differs from reviewed hashes. Merge identical content or start a new review.",
    );
  const step = getStep(run.phase, run.step);
  const artifacts = await artifactFiles(root, step);
  if (!step.repeatable || step.artifact?.aggregate)
    requireArtifacts(step, artifacts);
  if (
    step.artifact?.glob &&
    !step.artifact.aggregate &&
    (step.repeatable
      ? !run.evidence.some((item) => artifacts.includes(item.path))
      : artifacts.some(
          (path) => !run.evidence.some((item) => item.path === path),
        ))
  )
    throw new Error("Canonical catalog artifacts differ. Start a new review.");
}

async function finishScope(
  root: string,
  state: ProgressState,
  phase: string,
  update: Extract<Update, { action: "finish" }>,
): Promise<void> {
  const step = getStep(phase, update.step);
  if (!step.repeatable)
    throw new Error("Only repeatable steps need scope confirmation.");
  const row = await rowFor(root, state, phase, step);
  requireArtifacts(step, row.artifacts);
  if (!aggregateSourcesCovered(step, row.runs, row.artifactRefs!))
    throw new Error(
      `${step.name}: missing required aggregate artifacts in a source checkout.`,
    );
  if (
    !row.runsApproved ||
    (!step.artifact?.aggregate && row.status.startsWith("stale evidence"))
  ) {
    throw new Error(
      "Approve all current runs with unchanged evidence before confirming their scope is complete.",
    );
  }
  const reviewedEvidence = update.reviewedEvidence ?? [];
  if (
    step.artifact?.aggregate &&
    (JSON.stringify(row.artifactRefs!.map(evidenceKey).sort()) !==
      JSON.stringify(reviewedEvidence.map(evidenceKey).sort()) ||
      conflictingCopies([
        ...row.runs.flatMap(runEvidence),
        ...reviewedEvidence,
      ]) ||
      !(await evidenceCurrent(root, reviewedEvidence)))
  ) {
    throw new Error(
      "Scope evidence changed. Review the current artifacts and confirm again.",
    );
  }
  state.scopes = state.scopes.filter(
    (scope) => scope.phase !== phase || scope.step !== step.id,
  );
  state.scopes.push({
    phase,
    step: step.id,
    runs: row.runs.map((run) => run.id),
    note: update.note,
    ...(step.artifact?.aggregate ? { evidence: reviewedEvidence } : {}),
  });
}

export async function recordUpdate(
  root: string,
  revision: number,
  update: Update,
  actor: string,
): Promise<ProgressState> {
  requireNote(update.note);
  const phase = await currentPhase(root);
  if (!phase)
    throw new Error(
      "No saved game phase. Run gamedev:start before tracking work.",
    );
  if (
    (update.action === "approve" ||
      update.action === "finish" ||
      update.action === "handoff") &&
    !actor.startsWith("user:")
  ) {
    throw new Error(
      "Approval requires the user's workflow command, not an agent claim.",
    );
  }
  return updateState(root, revision, async (state) => {
    if ((await currentPhase(root)) !== phase)
      throw new Error("Phase changed. Read status before retrying.");
    if (update.action === "start") startRun(state, phase, update);
    else if (update.action === "finish")
      await finishScope(root, state, phase, update);
    else {
      const run = requireRun(state, phase, update.run);
      if (update.action === "submit") await submitRun(root, run, update);
      if (update.action === "approve") {
        await checkRunApproval(root, run);
        run.status = "approved";
        run.note = update.note;
      }
      if (update.action === "handoff") {
        await checkHandoff(root, run);
        run.handoff = {
          coordinator: await checkoutIdentity(root),
          at: new Date().toISOString(),
          actor,
          note: update.note,
        };
        state.scopes = state.scopes.filter(
          (scope) => scope.phase !== phase || scope.step !== run.step,
        );
      }
      if (update.action === "block") {
        if (run.status === "approved")
          throw new Error("Start a new run before reopening approved work.");
        run.status = "blocked";
        run.note = update.note;
      }
    }
    const target = "run" in update ? update.run : update.step;
    state.history.push({
      at: new Date().toISOString(),
      actor,
      action: update.action,
      note: `${phase}/${target}: ${update.note}`,
    });
  });
}

export async function recordGateDecision(
  root: string,
  view: Snapshot,
  note: string,
  actor: string,
): Promise<void> {
  requireNote(note);
  if (!actor.startsWith("user:"))
    throw new Error("A phase decision requires user confirmation.");
  await updateState(root, view.state.revision, async (state) => {
    const current = await snapshot(root);
    if (!current || current.phase !== view.phase)
      throw new Error("Phase changed during the decision.");
    const remaining = blockers(current).map((row) => row.step.id);
    if (
      JSON.stringify(remaining) !==
      JSON.stringify(blockers(view).map((row) => row.step.id))
    ) {
      throw new Error(
        "Gate evidence changed during confirmation. Review status and make a fresh decision.",
      );
    }
    state.history.push({
      at: new Date().toISOString(),
      actor,
      action: "gate-decision",
      note: `${view.phase} -> ${view.nextPhase ?? "end"}; unresolved: ${remaining.join(", ") || "none"}; ${note}`,
    });
  });
}

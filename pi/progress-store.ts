import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export type Evidence = { path: string; sha256: string };
export type Run = {
  id: string;
  phase: string;
  step: string;
  subject: string;
  status: "active" | "blocked" | "submitted" | "approved";
  note: string;
  evidence: Evidence[];
};
export type History = {
  at: string;
  actor: string;
  action: string;
  note: string;
};
export type ScopeApproval = {
  phase: string;
  step: string;
  runs: string[];
  note: string;
  evidence?: Evidence[];
};
export type ProgressState = {
  version: 1;
  revision: number;
  runs: Run[];
  scopes: ScopeApproval[];
  history: History[];
};
export const STATE_FILE = "production/workflow-state.json";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 4000;
const missing = (error: unknown) => isObject(error) && error.code === "ENOENT";
const isEvidence = (value: unknown): value is Evidence =>
  isObject(value) &&
  isText(value.path) &&
  isText(value.sha256) &&
  /^[a-f0-9]{64}$/.test(value.sha256);

export function parseState(text: string): ProgressState {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new Error(
      "Cannot parse workflow state; preserve the file and repair its JSON before continuing.",
      { cause },
    );
  }
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 0 ||
    !Array.isArray(value.runs) ||
    !Array.isArray(value.scopes) ||
    !Array.isArray(value.history)
  ) {
    throw new Error(
      "Invalid workflow state; preserve the file and repair it before continuing.",
    );
  }
  const ids = new Set<string>();
  for (const run of value.runs) {
    if (
      !isObject(run) ||
      ![run.id, run.phase, run.step, run.subject, run.note].every(isText) ||
      !/^r[1-9][0-9]*$/.test(String(run.id)) ||
      ids.has(String(run.id)) ||
      !["active", "blocked", "submitted", "approved"].includes(
        String(run.status),
      ) ||
      !Array.isArray(run.evidence) ||
      run.evidence.length > 50
    ) {
      throw new Error("Invalid workflow run record.");
    }
    ids.add(String(run.id));
    if (!run.evidence.every(isEvidence))
      throw new Error("Invalid evidence record.");
  }
  for (const scope of value.scopes) {
    if (
      !isObject(scope) ||
      ![scope.phase, scope.step, scope.note].every(isText) ||
      !Array.isArray(scope.runs) ||
      !scope.runs.every((id) => isText(id) && ids.has(id)) ||
      (scope.evidence !== undefined &&
        (!Array.isArray(scope.evidence) || !scope.evidence.every(isEvidence)))
    ) {
      throw new Error("Invalid workflow scope approval.");
    }
  }
  for (const event of value.history) {
    if (
      !isObject(event) ||
      ![event.at, event.actor, event.action, event.note].every(isText)
    ) {
      throw new Error("Invalid workflow history record.");
    }
  }
  return value as ProgressState;
}

/** Resolve project-owned files without writing through symlinked directories. */
export async function projectPath(root: string, name: string): Promise<string> {
  const path = resolve(root, name);
  const local = relative(resolve(root), path);
  if (
    !name ||
    isAbsolute(name) ||
    local === "" ||
    local === ".." ||
    local.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new Error(`Expected a file inside the game repository: ${name}`);
  }
  let current = resolve(root);
  for (const part of local.split(/[\\/]/)) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symlink: ${name}`);
    } catch (error) {
      if (missing(error)) break;
      throw error;
    }
  }
  return path;
}

export async function readOptional(
  root: string,
  name: string,
): Promise<string | undefined> {
  const path = await projectPath(root, name);
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.size > MAX_FILE_BYTES)
      throw new Error(`Expected a file under 10 MiB: ${name}`);
    return await readFile(path, "utf8");
  } catch (error) {
    if (missing(error)) return undefined;
    throw error;
  }
}

export async function readState(root: string): Promise<ProgressState> {
  const text = await readOptional(root, STATE_FILE);
  return text === undefined
    ? { version: 1, revision: 0, runs: [], scopes: [], history: [] }
    : parseState(text);
}

export async function fingerprint(
  root: string,
  name: string,
): Promise<Evidence> {
  const path = await projectPath(root, name);
  const info = await lstat(path);
  if (!info.isFile() || info.size > 2 * 1024 * 1024)
    throw new Error(`Evidence must be a file under 2 MiB: ${name}`);
  const bytes = await readFile(path);
  return {
    path: relative(resolve(root), path).split("\\").join("/"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function evidenceCurrent(
  root: string,
  evidence: Evidence[],
): Promise<boolean> {
  for (const item of evidence) {
    try {
      if ((await fingerprint(root, item.path)).sha256 !== item.sha256)
        return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function writeState(path: string, state: ProgressState): Promise<void> {
  const text = `${JSON.stringify(state, null, 2)}\n`;
  if (Buffer.byteLength(text) > MAX_FILE_BYTES) {
    throw new Error(
      "Workflow state would exceed 10 MiB. Previous state preserved; agree an archival plan before continuing.",
    );
  }
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(text, "utf8");
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!missing(error)) throw error;
    });
  }
}

/** Lock across Pi processes; stale callers must reread rather than overwrite progress. */
export async function updateState(
  root: string,
  revision: number,
  change: (state: ProgressState) => Promise<void>,
): Promise<ProgressState> {
  const path = await projectPath(root, STATE_FILE);
  await mkdir(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  const lock = await open(lockPath, "wx", 0o600).catch((error: unknown) => {
    if (isObject(error) && error.code === "EEXIST")
      throw new Error(
        "Workflow state is locked. Retry; inspect an abandoned lock before removing it.",
      );
    throw error;
  });
  try {
    const state = await readState(root);
    if (state.revision !== revision)
      throw new Error(
        "Workflow state changed. Read status again before retrying.",
      );
    await change(state);
    state.revision++;
    await writeState(path, state);
    return state;
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

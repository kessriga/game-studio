import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export type Checkout = {
  root: string;
  commonDir: string;
  commonIdentity: string;
  gitDir: string;
  identity: string;
};
export type EvidenceSource = { worktree: string; checkout: Checkout };
export type Evidence = {
  path: string;
  sha256: string;
  source?: EvidenceSource;
};
export type Run = {
  id: string;
  phase: string;
  step: string;
  subject: string;
  status: "active" | "blocked" | "submitted" | "approved";
  note: string;
  evidence: Evidence[];
  source?: EvidenceSource;
  handoff?: { coordinator: Checkout; at: string; actor: string; note: string };
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
const isCheckout = (value: unknown): value is Checkout =>
  isObject(value) &&
  [
    value.root,
    value.commonDir,
    value.commonIdentity,
    value.gitDir,
    value.identity,
  ].every(isText);
const isSource = (value: unknown): value is EvidenceSource =>
  isObject(value) && isText(value.worktree) && isCheckout(value.checkout);
const isEvidence = (value: unknown): value is Evidence =>
  isObject(value) &&
  isText(value.path) &&
  isText(value.sha256) &&
  (value.source === undefined || isSource(value.source)) &&
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
      run.evidence.length > 50 ||
      (run.source !== undefined && !isSource(run.source)) ||
      (run.handoff !== undefined &&
        (!run.source ||
          run.status !== "approved" ||
          !isObject(run.handoff) ||
          !isCheckout(run.handoff.coordinator) ||
          ![run.handoff.at, run.handoff.actor, run.handoff.note].every(isText)))
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

const execGit = promisify(execFile);
async function git(root: string, args: string[]): Promise<string> {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.toUpperCase().startsWith("GIT_"),
    ),
  );
  const { stdout } = await execGit("git", args, {
    cwd: root,
    env,
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  return stdout;
}

/** Bind evidence to a registered checkout, not a remote URL or a directory name. */
export async function checkoutIdentity(root: string): Promise<Checkout> {
  if ((await lstat(root)).isSymbolicLink())
    throw new Error("Refusing symlink source checkout.");
  const canonical = await realpath(root);
  const [top, common, directory] = (
    await git(root, [
      "rev-parse",
      "--path-format=absolute",
      "--show-toplevel",
      "--git-common-dir",
      "--absolute-git-dir",
    ])
  )
    .trimEnd()
    .split("\n");
  if (!top || !common || !directory || (await realpath(top)) !== canonical)
    throw new Error(
      "Expected a registered Git worktree root, not a subdirectory.",
    );
  const registered = (
    await git(root, ["worktree", "list", "--porcelain", "-z"])
  )
    .split("\0")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice(9));
  if (
    !(
      await Promise.all(
        registered.map((path) => realpath(path).catch(() => "")),
      )
    ).includes(canonical)
  )
    throw new Error("Source is not a registered Git worktree.");
  const commonDir = await realpath(common);
  const gitDir = await realpath(directory);
  const identities = await Promise.all(
    [canonical, gitDir, commonDir].map(async (path) => {
      const info = await lstat(path);
      return `${info.dev}:${info.ino}:${info.birthtimeMs}`;
    }),
  );
  return {
    root: canonical,
    commonDir,
    commonIdentity: identities[2],
    gitDir,
    identity: identities.slice(0, 2).join("/"),
  };
}

function sameCheckout(a: Checkout, b: Checkout): boolean {
  return (
    a.root === b.root &&
    a.commonDir === b.commonDir &&
    a.commonIdentity === b.commonIdentity &&
    a.gitDir === b.gitDir &&
    a.identity === b.identity
  );
}

export async function captureSource(
  root: string,
  worktree: string,
): Promise<EvidenceSource> {
  const path = await projectPath(root, worktree);
  const coordinator = await checkoutIdentity(root);
  const checkout = await checkoutIdentity(path);
  if (coordinator.commonDir !== checkout.commonDir)
    throw new Error("Source worktree must belong to the same Git repository.");
  return {
    worktree: relative(resolve(root), path).split("\\").join("/"),
    checkout,
  };
}

export async function sourceRoot(
  root: string,
  source?: EvidenceSource,
): Promise<string> {
  if (!source) return root;
  const current = await captureSource(root, source.worktree);
  if (!sameCheckout(current.checkout, source.checkout))
    throw new Error(
      "Source checkout identity changed. Submit fresh evidence for review.",
    );
  return await projectPath(root, source.worktree);
}

export async function runRoot(root: string, run: Run): Promise<string> {
  if (!run.handoff) return sourceRoot(root, run.source);
  const current = await checkoutIdentity(root);
  if (
    !sameCheckout(current, run.handoff.coordinator) ||
    current.commonDir !== run.source?.checkout.commonDir
  )
    throw new Error("Handoff coordinator identity changed.");
  return root;
}

export function effectiveSource(run: Run): EvidenceSource | undefined {
  return run.handoff ? undefined : run.source;
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
      if (
        (await fingerprint(await sourceRoot(root, item.source), item.path))
          .sha256 !== item.sha256
      )
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

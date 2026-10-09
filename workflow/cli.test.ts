import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, type TestContext } from "node:test";

const cli = fileURLToPath(new URL("cli.ts", import.meta.url));

type Reply = {
  ok: boolean;
  error?: string;
  snapshot?: {
    phase: string;
    revision: number;
    runs: { id: string; status: string }[];
  } | null;
  history?: { action: string }[];
};

function run(
  root: string,
  action: string,
  body?: object,
  actor = "agent:test",
  revision?: number,
): Reply & { status: number | null } {
  const args = [
    "--experimental-strip-types",
    cli,
    action,
    "--root",
    root,
    "--actor",
    actor,
  ];
  if (revision !== undefined) args.push("--revision", String(revision));
  const result = spawnSync(process.execPath, args, {
    input: body ? JSON.stringify(body) : "",
    encoding: "utf8",
  });
  const text = result.stdout.trim();
  const reply = text
    ? (JSON.parse(text) as Reply)
    : { ok: false, error: result.stderr };
  return { ...reply, status: result.status };
}

async function game(t: TestContext, phase = "Concept"): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "gamedev cli "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "production"));
  await writeFile(join(root, "production/stage.txt"), phase);
  return root;
}

test("status reports the saved phase and a missing stage as null", async (t) => {
  const root = await game(t);
  const reply = run(root, "status");
  assert.equal(reply.status, 0);
  assert.equal(reply.ok, true);
  assert.equal(reply.snapshot?.phase, "concept");
  assert.equal(reply.snapshot?.revision, 0);
  await rm(join(root, "production/stage.txt"));
  assert.equal(run(root, "status").snapshot, null);
});

test("updates need a revision and approvals need a user actor", async (t) => {
  const root = await game(t);
  const noRevision = run(root, "start", {
    step: "brainstorm",
    subject: "",
    note: "Begin.",
  });
  assert.equal(noRevision.ok, false);
  assert.match(noRevision.error!, /revision/);
  assert.equal(noRevision.status, 1);
  const started = run(
    root,
    "start",
    { step: "brainstorm", subject: "", note: "Begin." },
    "agent:test",
    0,
  );
  assert.equal(started.ok, true);
  const run1 = started.snapshot!.runs[0]!.id;
  const submitted = run(
    root,
    "submit",
    { run: run1, note: "Manual check.", evidence: [] },
    "agent:test",
    started.snapshot!.revision,
  );
  assert.equal(submitted.ok, true);
  const agentApproval = run(
    root,
    "approve",
    { run: run1, note: "Looks done." },
    "agent:test",
    submitted.snapshot!.revision,
  );
  assert.equal(agentApproval.ok, false);
  assert.match(agentApproval.error!, /user/);
  const approved = run(
    root,
    "approve",
    { run: run1, note: "Checked it." },
    "user:test",
    submitted.snapshot!.revision,
  );
  assert.equal(approved.ok, true, approved.error);
  assert.equal(approved.snapshot!.runs[0]!.status, "approved");
});

test("gate and history record user decisions; unknown actions fail", async (t) => {
  const root = await game(t);
  const status = run(root, "status");
  const gate = run(
    root,
    "gate",
    { note: "Override: concept is enough for a jam." },
    "user:test",
    status.snapshot!.revision,
  );
  assert.equal(gate.ok, true);
  const history = run(root, "history");
  assert.equal(history.ok, true);
  assert.equal(history.history!.at(-1)!.action, "gate-decision");
  const unknown = run(root, "explode");
  assert.equal(unknown.ok, false);
  assert.equal(unknown.status, 1);
});

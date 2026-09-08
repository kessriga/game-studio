import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { readState, STATE_FILE } from "./progress-store.ts";
import { compactLines } from "./panel.ts";
import {
  blockers,
  phases,
  recordGateDecision,
  recordUpdate,
  snapshot,
} from "./workflow.ts";
import type { Update } from "./workflow.ts";

async function game(t: TestContext, phase = "Concept"): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "gamedev workflow "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "production"));
  await writeFile(join(root, "production/stage.txt"), phase);
  return root;
}

async function update(root: string, change: Update, actor = "agent:test") {
  return recordUpdate(root, (await readState(root)).revision, change, actor);
}

async function approveStory(
  root: string,
  subject: string,
  step = "implement",
  evidence: string[] = [],
): Promise<string> {
  const state = await update(root, {
    action: "start",
    step,
    subject,
    note: "Work on this subject.",
  });
  const run = state.runs.at(-1)!.id;
  await update(root, {
    action: "submit",
    run,
    evidence,
    note: "Manual review needed: verify the board and test results.",
  });
  await update(
    root,
    {
      action: "approve",
      run,
      note: "Checked story acceptance and test evidence.",
    },
    "user:test",
  );
  return run;
}

test("catalog commands resolve to real shared workflows and phase links are valid", async () => {
  assert.equal(Object.keys(phases).length, 7);
  for (const [key, phase] of Object.entries(phases)) {
    assert.ok(phase.next_phase === null || phases[phase.next_phase]);
    assert.equal(
      new Set(phase.steps.map((step) => step.id)).size,
      phase.steps.length,
      key,
    );
    for (const step of phase.steps) {
      if (step.command) {
        const name = step.command.replace("/gamedev:", "");
        assert.ok(
          (
            await readFile(
              new URL(`../skills/${name}/SKILL.md`, import.meta.url),
              "utf8",
            )
          ).length,
        );
      }
      if (step.artifact?.pattern)
        assert.doesNotThrow(() => new RegExp(step.artifact!.pattern!));
    }
  }
});

test("status is read-only and an unrelated directory remains untouched", async (t) => {
  const root = await game(t);
  await rm(join(root, "production"), { recursive: true });
  assert.equal(await snapshot(root), undefined);
  await assert.rejects(readFile(join(root, STATE_FILE)), { code: "ENOENT" });
  await assert.rejects(
    recordUpdate(
      root,
      0,
      { action: "start", step: "art-bible", subject: "", note: "Start" },
      "agent:test",
    ),
  );
});

test("unknown phases, steps, and missing repeatable subjects are rejected", async (t) => {
  const root = await game(t, "Production");
  await assert.rejects(
    update(root, {
      action: "start",
      step: "implement",
      subject: "",
      note: "Start",
    }),
    /subject/,
  );
  await assert.rejects(
    update(root, {
      action: "start",
      step: "bogus",
      subject: "",
      note: "Start",
    }),
    /Unknown workflow step/,
  );
  await writeFile(join(root, "production/stage.txt"), "Bogus");
  await assert.rejects(snapshot(root), /Unknown saved phase/);
});

test("artifact discovery is not approval; missing and changed evidence cannot pass", async (t) => {
  const root = await game(t);
  await update(root, {
    action: "start",
    step: "art-bible",
    subject: "",
    note: "Create art bible.",
  });
  await assert.rejects(
    update(root, { action: "submit", run: "r1", evidence: [], note: "Ready" }),
    /missing required artifacts/,
  );
  await mkdir(join(root, "design/art"), { recursive: true });
  await writeFile(
    join(root, "design/art/art-bible.md"),
    "Reviewed art direction",
  );
  const found = await snapshot(root);
  assert.equal(
    found!.rows.find((row) => row.step.id === "art-bible")!.complete,
    false,
  );
  await update(root, {
    action: "submit",
    run: "r1",
    evidence: [],
    note: "Review these choices.",
  });
  await assert.rejects(
    update(root, { action: "approve", run: "r1", note: "Agent says done" }),
    /user/,
  );
  await writeFile(
    join(root, "design/art/art-bible.md"),
    "Different art direction",
  );
  await assert.rejects(
    update(
      root,
      { action: "approve", run: "r1", note: "Approved" },
      "user:test",
    ),
    /Evidence changed/,
  );
  await update(root, {
    action: "submit",
    run: "r1",
    evidence: [],
    note: "Review changed choices.",
  });
  await update(
    root,
    {
      action: "approve",
      run: "r1",
      note: "I reviewed and approve these choices.",
    },
    "user:test",
  );
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "art-bible")!
      .complete,
    true,
  );
  await writeFile(join(root, "design/art/art-bible.md"), "Another change");
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "art-bible")!
      .status,
    "stale evidence",
  );
});

test("repeatable work needs separate subjects and an explicit whole-scope decision", async (t) => {
  const root = await game(t, "Production");
  await approveStory(root, "task-1");
  let view = (await snapshot(root))!;
  assert.equal(
    view.rows.find((row) => row.step.id === "implement")!.complete,
    false,
  );
  await update(
    root,
    {
      action: "finish",
      step: "implement",
      note: "Checked the board: all intended stories are complete.",
    },
    "user:test",
  );
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "implement")!
      .complete,
    true,
  );
  await update(root, {
    action: "start",
    step: "implement",
    subject: "task-2",
    note: "New story added.",
  });
  view = (await snapshot(root))!;
  assert.equal(
    view.rows.find((row) => row.step.id === "implement")!.complete,
    false,
  );
  assert.equal(view.state.runs.length, 2);
  await assert.rejects(
    update(
      root,
      { action: "finish", step: "implement", note: "Done" },
      "user:test",
    ),
    /Approve all/,
  );
});

test("duplicate active work is rejected and reopening preserves prior history", async (t) => {
  const root = await game(t, "Production");
  await approveStory(root, "task-1");
  await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Reopen changed story.",
  });
  await assert.rejects(
    update(root, {
      action: "start",
      step: "implement",
      subject: "task-1",
      note: "Duplicate",
    }),
    /Resume r2/,
  );
  await assert.rejects(
    update(root, { action: "block", run: "r1", note: "Old run" }),
    /supersedes/,
  );
  const stored = await readState(root);
  assert.equal(stored.runs[0].status, "approved");
  assert.equal(stored.runs[1].status, "active");
  assert.equal(stored.history.length, 4);
});

test("stale revisions and parallel sessions cannot silently overwrite progress", async (t) => {
  const root = await game(t, "Production");
  const start: Update = {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Work",
  };
  const results = await Promise.allSettled([
    recordUpdate(root, 0, start, "agent:a"),
    recordUpdate(root, 0, start, "agent:b"),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal((await readState(root)).runs.length, 1);
  await assert.rejects(
    recordUpdate(
      root,
      0,
      { action: "block", run: "r1", note: "Stale" },
      "agent:a",
    ),
    /changed/,
  );
});

test("malformed state is preserved rather than reset", async (t) => {
  const root = await game(t);
  const bad = '{"version":1,"revision":0,"runs":null}';
  await writeFile(join(root, STATE_FILE), bad);
  await assert.rejects(snapshot(root), /Invalid workflow state/);
  await assert.rejects(
    recordUpdate(
      root,
      0,
      { action: "start", step: "art-bible", subject: "", note: "Work" },
      "agent:test",
    ),
  );
  assert.equal(await readFile(join(root, STATE_FILE), "utf8"), bad);
  await writeFile(join(root, STATE_FILE), "{");
  await assert.rejects(snapshot(root), /Cannot parse workflow state/);
});

test("evidence cannot escape the game repository", async (t) => {
  const root = await game(t, "Production");
  await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Work",
  });
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      note: "Evidence",
      evidence: ["../outside.md"],
    }),
    /inside the game/,
  );
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      note: "Evidence",
      evidence: ["missing.md"],
    }),
    /ENOENT/,
  );
});

test("symlinked state paths and evidence are refused", async (t) => {
  const root = await game(t, "Production");
  await writeFile(join(root, "original.md"), "Keep me");
  try {
    await symlink(join(root, "original.md"), join(root, "linked.md"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") {
      t.skip("Symlink privileges unavailable");
      return;
    }
    throw error;
  }
  await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Work",
  });
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      note: "Evidence",
      evidence: ["linked.md"],
    }),
    /symlink/,
  );
  await rm(join(root, STATE_FILE));
  await symlink(join(root, "original.md"), join(root, STATE_FILE));
  await assert.rejects(snapshot(root), /symlink/);
  assert.equal(await readFile(join(root, "original.md"), "utf8"), "Keep me");
});

test("gate overrides are recorded, not treated as completed checks or automatic phase changes", async (t) => {
  const root = await game(t);
  const view = (await snapshot(root))!;
  assert.ok(blockers(view).length > 0);
  await assert.rejects(
    recordGateDecision(root, view, "Skip", "agent:test"),
    /user/,
  );
  await recordGateDecision(
    root,
    view,
    "Prototype first; knowingly defer missing documents.",
    "user:test",
  );
  assert.equal(
    await readFile(join(root, "production/stage.txt"), "utf8"),
    "Concept",
  );
  const state = await readState(root);
  assert.equal(state.history[0].action, "gate-decision");
  assert.match(state.history[0].note, /unresolved: engine-setup/);
  assert.equal(state.runs.length, 0);
  await writeFile(join(root, "production/stage.txt"), "Systems Design");
  assert.equal((await snapshot(root))!.phase, "systems-design");
  assert.equal((await snapshot(root))!.state.history.length, 1);
});

test("large story collections remain readable and repeatable evidence stays scoped", async (t) => {
  const root = await game(t, "Pre-Production");
  await mkdir(join(root, "production/epics/movement"), { recursive: true });
  const files = Array.from(
    { length: 60 },
    (_, i) => `production/epics/movement/story-${i}.md`,
  );
  await Promise.all(
    files.map((file) =>
      writeFile(join(root, file), "Story acceptance criteria"),
    ),
  );
  assert.equal(
    (await snapshot(root))!.rows.find(
      (row) => row.step.id === "create-stories",
    )!.artifacts.length,
    60,
  );
  await approveStory(
    root,
    "movement-part-1",
    "create-stories",
    files.slice(0, 30),
  );
  assert.equal((await readState(root)).runs[0].evidence.length, 30);
});

test("one repeatable screen can be approved before the phase-wide minimum exists", async (t) => {
  const root = await game(t, "Pre-Production");
  await mkdir(join(root, "design/ux"), { recursive: true });
  await writeFile(
    join(root, "design/ux/main-menu.md"),
    "Main menu specification",
  );
  await approveStory(root, "main-menu", "ux-design", [
    "./design/ux/main-menu.md",
  ]);
  assert.equal((await readState(root)).runs[0].status, "approved");
  await assert.rejects(
    update(
      root,
      { action: "finish", step: "ux-design", note: "Only one screen so far." },
      "user:test",
    ),
    /missing required artifacts/,
  );
});

test("revising an ADR does not invalidate unrelated subjects", async (t) => {
  const root = await game(t, "Technical Setup");
  const step = phases["technical-setup"].steps.find(
    (item) => item.id === "architecture-decision",
  )!;
  assert.equal(step.artifact!.glob, "docs/architecture/adr-*.md");
  await mkdir(join(root, "docs/architecture"), { recursive: true });
  for (const subject of ["input", "saves", "assets"]) {
    const path = `docs/architecture/adr-${subject}.md`;
    await writeFile(join(root, path), `Decision: ${subject}`);
    await approveStory(root, subject, "architecture-decision", [path]);
  }
  await update(
    root,
    {
      action: "finish",
      step: "architecture-decision",
      note: "All three intended decisions reviewed.",
    },
    "user:test",
  );
  await writeFile(
    join(root, "docs/architecture/adr-saves.md"),
    "Revised save strategy",
  );
  await approveStory(root, "saves", "architecture-decision", [
    "docs/architecture/adr-saves.md",
  ]);
  await update(
    root,
    {
      action: "finish",
      step: "architecture-decision",
      note: "Revised scope verified.",
    },
    "user:test",
  );
  assert.equal(
    (await snapshot(root))!.rows.find(
      (row) => row.step.id === "architecture-decision",
    )!.complete,
    true,
  );
  await writeFile(
    join(root, "docs/architecture/adr-new.md"),
    "A newly required decision",
  );
  assert.equal(
    (await snapshot(root))!.rows.find(
      (row) => row.step.id === "architecture-decision",
    )!.complete,
    false,
  );
});

test("gate decisions reject requirements that changed during confirmation", async (t) => {
  const root = await game(t);
  await mkdir(join(root, "design/art"), { recursive: true });
  await writeFile(join(root, "design/art/art-bible.md"), "Art direction");
  await approveStory(root, "", "art-bible");
  const shown = (await snapshot(root))!;
  await writeFile(join(root, "design/art/art-bible.md"), "Changed direction");
  await assert.rejects(
    recordGateDecision(
      root,
      shown,
      "Override only the requirements you showed me.",
      "user:test",
    ),
    /changed during confirmation/,
  );
  assert.equal((await readState(root)).history.at(-1)!.action, "approve");
});

test("state growth cannot commit an unreadable file", async (t) => {
  const root = await game(t, "Production");
  const state = await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Start",
  });
  const event = {
    at: "2026-09-08T00:00:00Z",
    actor: "agent:test",
    action: "block",
    note: "x".repeat(2000),
  };
  const size = (history: typeof state.history) =>
    Buffer.byteLength(JSON.stringify({ ...state, history }, null, 2) + "\n");
  const perEvent = size([event, event]) - size([event]);
  const limit = 10 * 1024 * 1024;
  state.history = Array.from(
    { length: Math.floor((limit - size([])) / perEvent) },
    () => ({ ...event }),
  );
  const saved = JSON.stringify(state, null, 2) + "\n";
  assert.ok(Buffer.byteLength(saved) < limit);
  await writeFile(join(root, STATE_FILE), saved);
  await assert.rejects(
    update(root, { action: "block", run: "r1", note: "x".repeat(2000) }),
    /Previous state preserved/,
  );
  assert.equal(await readFile(join(root, STATE_FILE), "utf8"), saved);
  assert.equal((await readState(root)).revision, state.revision);
});

test("engine configuration patterns match the template, not its placeholder", async (t) => {
  const root = await game(t);
  await mkdir(join(root, ".claude/docs"), { recursive: true });
  const path = join(root, ".claude/docs/technical-preferences.md");
  await writeFile(path, "- **Engine**: [TO BE CONFIGURED]\n");
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "engine-setup")!
      .artifacts.length,
    0,
  );
  await writeFile(path, "- **Engine**: Godot 4\n");
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "engine-setup")!
      .artifacts.length,
    1,
  );
});

test("current and next are distinct, with submitted work waiting for user approval", async (t) => {
  const root = await game(t);
  const view = (await snapshot(root))!;
  let lines = compactLines(view);
  assert.match(lines[1], /Current: Engine Setup/);
  assert.doesNotMatch(lines[2], /Engine Setup/);
  view.state.runs.push({
    id: "r1",
    phase: view.phase,
    step: "engine-setup",
    subject: "",
    status: "submitted",
    note: "Review",
    evidence: [],
  });
  lines = compactLines(view);
  assert.match(lines[1], /r1.*awaiting user approval/);
  assert.doesNotMatch(lines[2], /Engine Setup/);
});

test("shared asset indexes are reviewed at scope closure, not on unrelated subject runs", async (t) => {
  const root = await game(t, "Pre-Production");
  await mkdir(join(root, "design/assets"), { recursive: true });
  const manifest = join(root, "design/assets/asset-manifest.md");
  await writeFile(manifest, "Player asset");
  await writeFile(
    join(root, "design/assets/player.md"),
    "Player specification",
  );
  await approveStory(root, "player", "asset-spec", ["design/assets/player.md"]);
  await update(
    root,
    {
      action: "finish",
      step: "asset-spec",
      note: "Player is the complete current asset scope.",
    },
    "user:test",
  );
  await writeFile(manifest, "Player and enemy assets");
  let view = (await snapshot(root))!;
  assert.equal(
    view.rows.find((row) => row.step.id === "asset-spec")!.complete,
    false,
  );
  assert.equal(
    view.rows.find((row) => row.step.id === "asset-spec")!.runsApproved,
    true,
  );
  await writeFile(join(root, "design/assets/enemy.md"), "Enemy specification");
  await approveStory(root, "enemy", "asset-spec", ["design/assets/enemy.md"]);
  await update(
    root,
    {
      action: "finish",
      step: "asset-spec",
      note: "Both intended assets and the shared index are reviewed.",
    },
    "user:test",
  );
  view = (await snapshot(root))!;
  assert.equal(
    view.rows.find((row) => row.step.id === "asset-spec")!.complete,
    true,
  );
  assert.equal(
    view.state.runs.length,
    2,
    "The unchanged player must not need a replacement run",
  );
  assert.equal(view.state.runs[0].evidence[0].path, "design/assets/player.md");
  assert.equal(
    view.state.scopes[0].evidence![0].path,
    "design/assets/asset-manifest.md",
  );
  await writeFile(
    join(root, "design/assets/player.md"),
    "Changed player specification",
  );
  await assert.rejects(
    update(
      root,
      { action: "finish", step: "asset-spec", note: "Recheck" },
      "user:test",
    ),
    /Approve all/,
  );
});

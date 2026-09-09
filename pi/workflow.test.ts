import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";
import { fingerprint, readState, STATE_FILE } from "./progress-store.ts";
import { compactLines } from "./panel.ts";
import {
  blockers,
  phases,
  recordGateDecision,
  recordUpdate,
  snapshot,
  scopeEvidence,
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
  worktree?: string,
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
    worktree,
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
        const name = step.command.replace("/skill:gamedev-", "");
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

test("submitted subjects keep a step pending even when another subject is approved", async (t) => {
  const root = await game(t, "Production");
  await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Implement the first story.",
  });
  await update(root, {
    action: "submit",
    run: "r1",
    evidence: [],
    note: "Ready for user review.",
  });
  await approveStory(root, "task-2");
  let row = (await snapshot(root))!.rows.find(
    (item) => item.step.id === "implement",
  )!;
  assert.equal(row.status, "submitted");
  assert.equal(row.complete, false);
  await update(
    root,
    { action: "approve", run: "r1", note: "First story verified." },
    "user:test",
  );
  await update(
    root,
    { action: "finish", step: "implement", note: "Both stories verified." },
    "user:test",
  );
  row = (await snapshot(root))!.rows.find(
    (item) => item.step.id === "implement",
  )!;
  assert.equal(row.status, "approved");
  assert.equal(row.complete, true);
  const reopened = await update(root, {
    action: "start",
    step: "implement",
    subject: "task-1",
    note: "Reopen the earlier subject.",
  });
  await update(root, {
    action: "submit",
    run: reopened.runs.at(-1)!.id,
    evidence: [],
    note: "Revised story ready for review.",
  });
  row = (await snapshot(root))!.rows.find(
    (item) => item.step.id === "implement",
  )!;
  assert.equal(row.status, "submitted");
  assert.equal(row.complete, false);
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

test("story scope covers story files without attaching shared epic metadata", async (t) => {
  const root = await game(t, "Pre-Production");
  await mkdir(join(root, "production/epics/combat"), { recursive: true });
  const index = join(root, "production/epics/index.md");
  const epic = join(root, "production/epics/combat/EPIC.md");
  await writeFile(index, "Epic navigation");
  await writeFile(epic, "Combat epic specification");
  const files = [
    "production/epics/combat/story-001-hit.md",
    "production/epics/combat/story-002-dodge.md",
  ];
  for (const file of files)
    await writeFile(join(root, file), "Story specification");
  await approveStory(root, "combat", "create-stories", files);
  await update(
    root,
    {
      action: "finish",
      step: "create-stories",
      note: "All combat stories reviewed.",
    },
    "user:test",
  );
  await writeFile(index, "Updated epic navigation");
  await writeFile(epic, "Updated epic metadata");
  const row = (await snapshot(root))!.rows.find(
    (item) => item.step.id === "create-stories",
  )!;
  assert.deepEqual(row.artifacts, files);
  assert.equal(row.complete, true);
  await writeFile(join(root, files[0]), "Changed story requirements");
  assert.equal(
    (await snapshot(root))!.rows.find(
      (item) => item.step.id === "create-stories",
    )!.complete,
    false,
  );
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
  await mkdir(join(root, "docs"), { recursive: true });
  const path = join(root, "docs/technical-preferences.md");
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
  assert.match(
    lines[1],
    /Current: \/skill:gamedev-setup-engine · Engine Setup/,
  );
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
      reviewedEvidence: [
        await fingerprint(root, "design/assets/asset-manifest.md"),
      ],
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
      reviewedEvidence: [
        await fingerprint(root, "design/assets/asset-manifest.md"),
      ],
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

async function worktreeGame(t: TestContext, phase = "Concept") {
  const root = await game(t, phase);
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      [
        "-c",
        `core.hooksPath=${join(root, ".no-hooks")}`,
        "-c",
        "commit.gpgSign=false",
        "-c",
        "core.autocrlf=false",
        ...args,
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => !key.toUpperCase().startsWith("GIT_"),
          ),
        ),
      },
    );
  git("init");
  git("config", "user.name", "Workflow test");
  git("config", "user.email", "workflow@example.invalid");
  git("add", "production/stage.txt");
  git("commit", "-m", "Fixture");
  const worktree = ".worktrees/source checkout";
  git("worktree", "add", "--detach", worktree);
  return { root, worktree, source: join(root, worktree), git };
}

const conceptFile = "design/gdd/game-concept.md";
test("worktree submit resolves catalog and evidence only in the registered source", async (t) => {
  const { root, worktree, source } = await worktreeGame(t);
  await mkdir(join(source, "design/gdd"), { recursive: true });
  await writeFile(join(source, conceptFile), "Reviewed source concept");
  await update(root, {
    action: "start",
    step: "game-concept",
    subject: "",
    note: "Work",
  });
  await update(root, {
    action: "block",
    run: "r1",
    note: "Awaiting source evidence",
  });
  await update(root, {
    action: "submit",
    run: "r1",
    worktree,
    evidence: [],
    note: "Review source",
  } as Update);
  assert.deepEqual(
    (await readState(root)).runs[0].evidence.map((item) => item.path),
    [conceptFile],
  );
  await update(
    root,
    { action: "approve", run: "r1", note: "Reviewed source" },
    "user:test",
  );
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "game-concept")!
      .complete,
    true,
  );
  await mkdir(join(root, "design/gdd"), { recursive: true });
  await writeFile(
    join(root, "design/gdd/game-concept.md"),
    "Stale coordinator",
  );
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "game-concept")!
      .complete,
    true,
  );
  assert.equal(
    await readFile(join(root, "production/stage.txt"), "utf8"),
    "Concept",
  );
  assert.equal((await readState(source)).revision, 0);
  assert.match(
    compactLines((await snapshot(root))!)[0],
    /Previous: Game Concept Document \[worktree evidence\]/,
  );
});

async function put(root: string, path: string, text = "Reviewed evidence") {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), text);
}
const row = async (root: string, step: string) =>
  (await snapshot(root))!.rows.find((item) => item.step.id === step)!;

test("stale coordinator cannot satisfy a missing worktree artifact or contaminate resubmission", async (t) => {
  const { root, worktree, source } = await worktreeGame(t);
  await put(root, conceptFile, "Stale coordinator");
  await update(root, {
    action: "start",
    step: "game-concept",
    subject: "",
    note: "Work",
  });
  const before = await readState(root);
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      worktree,
      evidence: [],
      note: "Review",
    }),
    /missing required artifacts/,
  );
  assert.deepEqual(await readState(root), before);
  await put(source, conceptFile, "Worktree concept");
  await update(root, {
    action: "submit",
    run: "r1",
    worktree,
    evidence: [],
    note: "Review",
  });
  await put(source, conceptFile, "Changed worktree concept");
  assert.match((await row(root, "game-concept")).status, /stale evidence/);
  await assert.rejects(
    update(root, { action: "approve", run: "r1", note: "Review" }, "user:test"),
    /Evidence changed/,
  );
  await update(root, {
    action: "submit",
    run: "r1",
    evidence: [],
    note: "Retain source without worktree argument",
  });
  const saved = (await readState(root)).runs[0];
  assert.equal(saved.source!.worktree, worktree);
  assert.deepEqual(saved.evidence, [await fingerprint(source, conceptFile)]);
});

test("removed or recreated unrelated source never falls back to identical coordinator files", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(t);
  await put(source, conceptFile);
  await put(root, conceptFile);
  await approveStory(root, "", "game-concept", [], worktree);
  const before = await readState(root);
  git("worktree", "remove", "--force", worktree);
  assert.equal((await row(root, "game-concept")).complete, false);
  assert.match(
    (await row(root, "game-concept")).status,
    /stale evidence.*worktree/,
  );
  await put(source, conceptFile);
  git("-C", source, "init");
  assert.equal((await row(root, "game-concept")).complete, false);
  assert.deepEqual(await readState(root), before);
});

test("recreating even a registered same-repository checkout requires fresh review", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(t);
  await put(source, conceptFile);
  await approveStory(root, "", "game-concept", [], worktree);
  git("worktree", "remove", "--force", worktree);
  git("worktree", "add", "--detach", worktree);
  await put(source, conceptFile);
  assert.equal((await row(root, "game-concept")).complete, false);
});

test("worktree validation rejects unrelated repositories, subfolders and unsafe paths despite inherited Git overrides", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(t, "Production");
  const unrelated = ".worktrees/unrelated";
  await mkdir(join(root, unrelated));
  git("-C", join(root, unrelated), "init");
  git("remote", "add", "origin", "https://example.invalid/same-remote.git");
  git(
    "-C",
    join(root, unrelated),
    "remote",
    "add",
    "origin",
    "https://example.invalid/same-remote.git",
  );
  await put(source, "report.md");
  await update(root, {
    action: "start",
    step: "implement",
    subject: "story",
    note: "Work",
  });
  const before = await readState(root);
  for (const invalid of [
    unrelated,
    worktree + "/production",
    "../outside",
    source,
    ".",
    "",
  ]) {
    await assert.rejects(
      update(root, {
        action: "submit",
        run: "r1",
        worktree: invalid,
        evidence: [],
        note: "Review",
      }),
    );
    assert.deepEqual(await readState(root), before);
  }
  const previous = {
    GIT_DIR: process.env.GIT_DIR,
    GIT_WORK_TREE: process.env.GIT_WORK_TREE,
    GIT_COMMON_DIR: process.env.GIT_COMMON_DIR,
  };
  Object.assign(process.env, {
    GIT_DIR: join(root, ".git"),
    GIT_WORK_TREE: source,
    GIT_COMMON_DIR: join(root, ".git"),
  });
  try {
    await assert.rejects(
      update(root, {
        action: "submit",
        run: "r1",
        worktree: unrelated,
        evidence: [],
        note: "Review",
      }),
      /same Git repository/,
    );
    await update(root, {
      action: "submit",
      run: "r1",
      worktree,
      evidence: ["report.md"],
      note: "Review",
    });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("worktree evidence retains traversal, regular-file, size and symlink protections", async (t) => {
  const { root, worktree, source } = await worktreeGame(t, "Production");
  await put(source, "report.md");
  await put(source, "large.md", "x".repeat(2 * 1024 * 1024 + 1));
  await update(root, {
    action: "start",
    step: "implement",
    subject: "story",
    note: "Work",
  });
  for (const evidence of [
    ["../../production/stage.txt"],
    [join(source, "report.md")],
    ["production"],
    ["large.md"],
    Array.from({ length: 51 }, (_, i) => `file-${i}.md`),
  ]) {
    await assert.rejects(
      update(root, {
        action: "submit",
        run: "r1",
        worktree,
        evidence,
        note: "Review",
      }),
    );
  }
  try {
    await symlink(source, join(root, ".worktrees/linked source"), "junction");
    await symlink(join(source, "report.md"), join(source, "linked.md"));
    await symlink(
      join(source, "production"),
      join(source, "linked-dir"),
      "junction",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") {
      t.skip("Symlink privileges unavailable");
      return;
    }
    throw error;
  }
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      worktree: ".worktrees/linked source",
      evidence: ["report.md"],
      note: "Review",
    }),
    /symlink/,
  );
  for (const evidence of [["linked.md"], ["linked-dir/stage.txt"]])
    await assert.rejects(
      update(root, {
        action: "submit",
        run: "r1",
        worktree,
        evidence,
        note: "Review",
      }),
      /symlink/,
    );
  await update(root, {
    action: "submit",
    run: "r1",
    worktree,
    evidence: ["report.md"],
    note: "Review",
  });
  await rm(source, { recursive: true });
  await symlink(root, source, "junction");
  assert.equal((await row(root, "implement")).complete, false);
  await assert.rejects(
    update(root, { action: "approve", run: "r1", note: "Review" }, "user:test"),
    /symlink/,
  );
});

test("handoff after source removal requires identical canonical content and preserves provenance", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(t);
  await put(source, conceptFile);
  await approveStory(root, "", "game-concept", [], worktree);
  const before = await readState(root);
  git("worktree", "remove", "--force", worktree);
  const handoff: Update = {
    action: "handoff",
    run: "r1",
    note: "Merged reviewed content",
  };
  await assert.rejects(update(root, handoff), /user/);
  await assert.rejects(
    update(root, handoff, "user:test"),
    /Canonical evidence differs/,
  );
  await put(root, conceptFile, "Different merged content");
  await assert.rejects(
    update(root, handoff, "user:test"),
    /Canonical evidence differs/,
  );
  assert.deepEqual(await readState(root), before);
  await put(root, conceptFile);
  await update(root, handoff, "user:test");
  const after = await readState(root);
  assert.deepEqual(after.runs[0].source, before.runs[0].source);
  assert.deepEqual(after.runs[0].evidence, before.runs[0].evidence);
  assert.equal(after.runs[0].handoff!.actor, "user:test");
  assert.equal(after.history.at(-1)!.action, "handoff");
  assert.equal((await row(root, "game-concept")).complete, true);
  assert.equal(
    await readFile(join(root, "production/stage.txt"), "utf8"),
    "Concept",
  );
  await assert.rejects(update(root, handoff, "user:test"), /prior handoff/);
  await put(root, conceptFile, "Edited after handoff");
  assert.equal((await row(root, "game-concept")).complete, false);
});

test("mixed-source repeatable scope uses qualified coverage and does not approve differing copies", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(
    t,
    "Technical Setup",
  );
  const second = ".worktrees/second checkout";
  git("worktree", "add", "--detach", second);
  const path = "docs/architecture/adr-input.md";
  await put(source, path, "Source decision");
  await put(join(root, second), path, "Different decision");
  const other = [
    "docs/architecture/adr-saves.md",
    "docs/architecture/adr-assets.md",
  ];
  for (const file of other) await put(source, file);
  await approveStory(
    root,
    "first",
    "architecture-decision",
    [path, ...other],
    worktree,
  );
  await approveStory(root, "second", "architecture-decision", [path], second);
  await assert.rejects(
    update(
      root,
      { action: "finish", step: "architecture-decision", note: "All subjects" },
      "user:test",
    ),
    /Approve all/,
  );
  await put(join(root, second), path, "Source decision");
  await approveStory(root, "second", "architecture-decision", [path], second);
  await update(
    root,
    {
      action: "finish",
      step: "architecture-decision",
      note: "Both copies reviewed",
    },
    "user:test",
  );
  assert.equal((await row(root, "architecture-decision")).complete, true);
  await put(join(root, second), "docs/architecture/adr-new.md");
  assert.equal((await row(root, "architecture-decision")).complete, false);
});

test("copies of one screen across worktrees cannot satisfy the three-screen minimum", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(
    t,
    "Pre-Production",
  );
  const path = "design/ux/menu.md";
  for (let i = 0; i < 3; i++) {
    const tree = i === 0 ? worktree : `.worktrees/screen ${i}`;
    if (i) git("worktree", "add", "--detach", tree);
    await put(i === 0 ? source : join(root, tree), path);
    await approveStory(root, `screen-${i}`, "ux-design", [path], tree);
  }
  await assert.rejects(
    update(
      root,
      {
        action: "finish",
        step: "ux-design",
        note: "Three runs are not three artifacts",
      },
      "user:test",
    ),
    /missing required artifacts \(1\/3\)/,
  );
});

test("aggregate scope fingerprints every source, rejects differing manifests and reopens on handoff", async (t) => {
  const { root, worktree, source, git } = await worktreeGame(
    t,
    "Pre-Production",
  );
  const second = ".worktrees/second checkout";
  git("worktree", "add", "--detach", second);
  const manifest = "design/assets/asset-manifest.md";
  const player = "design/assets/player.md";
  const enemy = "design/assets/enemy.md";
  await put(source, player);
  await put(source, manifest, "Player and enemy");
  await put(join(root, second), enemy);
  await put(join(root, second), manifest, "Only enemy");
  await approveStory(root, "player", "asset-spec", [player], worktree);
  await approveStory(root, "enemy", "asset-spec", [enemy], second);
  const finish = async () =>
    update(
      root,
      {
        action: "finish",
        step: "asset-spec",
        note: "All assets",
        reviewedEvidence: await scopeEvidence(
          root,
          await row(root, "asset-spec"),
        ),
      },
      "user:test",
    );
  await assert.rejects(finish(), /Scope evidence changed/);
  await put(join(root, second), manifest, "Player and enemy");
  await finish();
  const scope = (await readState(root)).scopes[0];
  assert.equal(scope.evidence!.length, 2);
  assert.notDeepEqual(scope.evidence![0].source, scope.evidence![1].source);
  assert.equal((await row(root, "asset-spec")).complete, true);
  await put(root, player);
  await put(root, manifest, "Player and enemy");
  git("worktree", "remove", "--force", worktree);
  await update(
    root,
    { action: "handoff", run: "r1", note: "Merged player" },
    "user:test",
  );
  assert.equal((await readState(root)).scopes.length, 0);
  assert.equal((await row(root, "asset-spec")).complete, false);
  await finish();
  assert.equal((await row(root, "asset-spec")).complete, true);
  await put(join(root, second), manifest, "Unreviewed change");
  assert.equal((await row(root, "asset-spec")).complete, false);
});

test("legacy source-less records still read coordinator evidence in Git and non-Git games", async (t) => {
  const { root, source } = await worktreeGame(t);
  await put(root, conceptFile, "Canonical legacy concept");
  await put(source, conceptFile, "Different worktree concept");
  await approveStory(root, "", "game-concept");
  const saved = await readState(root);
  assert.equal(saved.runs[0].source, undefined);
  assert.equal(saved.runs[0].handoff, undefined);
  assert.equal((await row(root, "game-concept")).complete, true);
  await assert.rejects(
    update(
      root,
      { action: "handoff", run: "r1", note: "Not a source run" },
      "user:test",
    ),
    /approved worktree run/,
  );
  const nonGit = await game(t);
  await put(nonGit, conceptFile, "Canonical legacy concept");
  await writeFile(join(nonGit, STATE_FILE), JSON.stringify(saved));
  assert.equal((await row(nonGit, "game-concept")).complete, true);
  await put(nonGit, conceptFile, "Changed canonical concept");
  assert.equal((await row(nonGit, "game-concept")).complete, false);
});

test("an unregistered checkout cannot borrow a registered worktree's Git directory", async (t) => {
  const { root, source, git } = await worktreeGame(t, "Production");
  const fake = ".worktrees/unregistered";
  await mkdir(join(root, fake));
  await writeFile(
    join(root, fake, ".git"),
    `gitdir: ${git("-C", source, "rev-parse", "--absolute-git-dir").trim()}\n`,
  );
  await update(root, {
    action: "start",
    step: "implement",
    subject: "story",
    note: "Work",
  });
  await assert.rejects(
    update(root, {
      action: "submit",
      run: "r1",
      worktree: fake,
      evidence: [],
      note: "Review",
    }),
    /registered Git worktree/,
  );
});

test("handoff cannot transfer approval to a replacement repository at the same coordinator path", async (t) => {
  const { root, source, worktree, git } = await worktreeGame(t);
  await put(source, conceptFile);
  await put(root, conceptFile);
  await approveStory(root, "", "game-concept", [], worktree);
  const before = await readState(root);
  git("worktree", "remove", "--force", worktree);
  await rm(join(root, ".git"), { recursive: true });
  git("init");
  await assert.rejects(
    update(
      root,
      {
        action: "handoff",
        run: "r1",
        note: "Same path is not same repository",
      },
      "user:test",
    ),
    /original Git repository/,
  );
  assert.deepEqual(await readState(root), before);
});

test("aggregate scope rejects conflicting subject copies despite identical manifests", async (t) => {
  const { root, source, worktree, git } = await worktreeGame(
    t,
    "Pre-Production",
  );
  const second = ".worktrees/conflicting assets";
  git("worktree", "add", "--detach", second);
  const manifest = "design/assets/asset-manifest.md";
  const subject = "design/assets/shared.md";
  await put(source, manifest, "Shared asset");
  await put(join(root, second), manifest, "Shared asset");
  await put(source, subject, "First reviewed spec");
  await put(join(root, second), subject, "Different reviewed spec");
  await approveStory(root, "first", "asset-spec", [subject], worktree);
  await approveStory(root, "second", "asset-spec", [subject], second);
  const before = await readState(root);
  const reviewedEvidence = await scopeEvidence(
    root,
    await row(root, "asset-spec"),
  );
  await assert.rejects(
    update(
      root,
      {
        action: "finish",
        step: "asset-spec",
        note: "Both copies",
        reviewedEvidence,
      },
      "user:test",
    ),
    /Scope evidence changed/,
  );
  assert.deepEqual(await readState(root), before);

  // Older versions could persist this false-positive scope with unchanged files.
  const previousApproval = structuredClone(before);
  previousApproval.scopes.push({
    phase: "pre-production",
    step: "asset-spec",
    runs: before.runs.map((run) => run.id),
    note: "Previous scope decision",
    evidence: reviewedEvidence,
  });
  await writeFile(join(root, STATE_FILE), JSON.stringify(previousApproval));
  const invalid = await row(root, "asset-spec");
  assert.equal(invalid.complete, false);
  assert.match(invalid.status, /^stale evidence/);

  await put(join(root, second), subject, "First reviewed spec");
  await approveStory(root, "second", "asset-spec", [subject], second);
  await update(
    root,
    {
      action: "finish",
      step: "asset-spec",
      note: "Matching reviewed copies",
      reviewedEvidence: await scopeEvidence(
        root,
        await row(root, "asset-spec"),
      ),
    },
    "user:test",
  );
  assert.equal((await row(root, "asset-spec")).complete, true);
});

for (const coordinator of [false, true]) {
  for (const missingFirst of [false, true]) {
    test(`aggregate scope requires each source manifest (${coordinator ? "coordinator/worktree" : "worktree/worktree"}, ${missingFirst ? "first" : "second"} missing)`, async (t) => {
      const { root, source, worktree, git } = await worktreeGame(
        t,
        "Pre-Production",
      );
      const second = ".worktrees/other assets";
      git("worktree", "add", "--detach", second);
      const firstRoot = coordinator ? root : source;
      const secondRoot = join(root, second);
      const manifest = "design/assets/asset-manifest.md";
      const firstSubject = "design/assets/player.md";
      const secondSubject = "design/assets/enemy.md";
      await put(firstRoot, firstSubject);
      await put(secondRoot, secondSubject);
      await put(
        missingFirst ? secondRoot : firstRoot,
        manifest,
        "Player and enemy",
      );
      await approveStory(
        root,
        "player",
        "asset-spec",
        [firstSubject],
        coordinator ? undefined : worktree,
      );
      await approveStory(root, "enemy", "asset-spec", [secondSubject], second);
      const before = await readState(root);
      const reviewedEvidence = await scopeEvidence(
        root,
        await row(root, "asset-spec"),
      );
      const finish = async () =>
        update(
          root,
          {
            action: "finish",
            step: "asset-spec",
            note: "All assets",
            reviewedEvidence: await scopeEvidence(
              root,
              await row(root, "asset-spec"),
            ),
          },
          "user:test",
        );
      await assert.rejects(finish(), /missing required aggregate artifacts/);
      assert.deepEqual(await readState(root), before);
      assert.equal(
        (await row(root, "asset-spec")).runsApproved,
        true,
        "Missing manifests reopen scope, not individual subject approvals",
      );

      // Reload an approval written by the older union-only scope check.
      const previousApproval = structuredClone(before);
      previousApproval.scopes.push({
        phase: "pre-production",
        step: "asset-spec",
        runs: before.runs.map((run) => run.id),
        note: "Previous scope decision",
        evidence: reviewedEvidence,
      });
      await writeFile(join(root, STATE_FILE), JSON.stringify(previousApproval));
      assert.equal((await row(root, "asset-spec")).complete, false);
      assert.match((await row(root, "asset-spec")).status, /^stale evidence/);
      const missingRoot = missingFirst ? firstRoot : secondRoot;
      await put(missingRoot, manifest, "Player and enemy");
      await finish();
      assert.equal((await row(root, "asset-spec")).complete, true);
      await rm(join(missingRoot, manifest));
      const removed = await row(root, "asset-spec");
      assert.equal(removed.complete, false);
      assert.match(removed.status, /^stale evidence/);
      await assert.rejects(finish(), /missing required aggregate artifacts/);
    });
  }
}

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { TuiMainScreen, type Terminal, type TUI } from "@earendil-works/pi-tui";
import gameStudio from "./extension.ts";
import { readState } from "./progress-store.ts";
import { snapshot } from "./workflow.ts";

type Handler = (
  event: unknown,
  ctx: ExtensionContext,
) => Promise<unknown> | unknown;
function harness(cwd: string, tui?: TUI) {
  const hooks = new Map<string, Handler>();
  const tools = new Map<string, ToolDefinition>();
  const commands = new Map<
    string,
    { handler: (args: string, ctx: ExtensionCommandContext) => Promise<void> }
  >();
  const widgets = new Map<string, unknown>();
  let consent = false;
  const ctx = {
    cwd,
    mode: "tui",
    hasUI: true,
    sessionManager: { getSessionId: () => "isolated-test" },
    ui: {
      setWidget(key: string, value: unknown) {
        widgets.set(key, value);
        if (tui && typeof value === "function") value(tui);
      },
      notify() {},
      async confirm() {
        return consent;
      },
      async input() {
        return "Checked test evidence and independent review.";
      },
      theme: { fg: (_color: string, text: string) => text },
    },
  } as unknown as ExtensionContext;
  const api = {
    on(name: string, handler: Handler) {
      hooks.set(name, handler);
    },
    registerTool(tool: ToolDefinition) {
      tools.set(tool.name, tool);
    },
    registerCommand(
      name: string,
      command: {
        handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
      },
    ) {
      commands.set(name, command);
    },
    sendMessage() {},
  } as unknown as ExtensionAPI;
  gameStudio(api);
  return {
    ctx,
    tools,
    widgets,
    consent(value: boolean) {
      consent = value;
    },
    event(name: string, event: unknown = {}) {
      return hooks.get(name)?.(event, ctx);
    },
    command(args: string) {
      return commands
        .get("gamedev-workflow")!
        .handler(args, ctx as ExtensionCommandContext);
    },
    call(args: Record<string, unknown>) {
      return tools
        .get("gamedev_workflow")!
        .execute("test-call", args, undefined, undefined, ctx);
    },
  };
}

test("actual extension routes tracking, requires user approval, and restores saved runs", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gamedev extension "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "production"));
  await writeFile(join(root, "production/stage.txt"), "Production");
  const app = harness(root);
  t.after(() => app.event("session_shutdown"));
  await app.event("session_start");
  assert.ok(app.widgets.get("gamedev:progress"));
  assert.doesNotMatch(
    JSON.stringify(app.tools.get("gamedev_workflow")!.parameters),
    /"approve"|"finish"/,
  );
  await assert.rejects(
    app.call({
      action: "start",
      step: "implement",
      subject: "task-1",
      note: "Start",
    }),
    /revision/,
  );
  await app.call({
    action: "start",
    revision: 0,
    step: "implement",
    subject: "task-1",
    note: "Implement story.",
  });
  await app.event("tool_result", {
    toolName: "subagent",
    content: [{ type: "text", text: "Done; all checks passed." }],
  });
  assert.equal(
    (await readState(root)).runs[0].status,
    "active",
    "Subagent prose is not completion evidence",
  );
  await app.call({
    action: "submit",
    revision: 1,
    run: "r1",
    note: "Tests and review need user verification.",
  });
  await app.command("approve r1");
  assert.equal(
    (await readState(root)).runs[0].status,
    "submitted",
    "Cancelled approval must not mutate state",
  );
  app.consent(true);
  await app.command("approve r1");
  assert.equal((await readState(root)).runs[0].status, "approved");
  await app.event("session_shutdown");
  assert.equal(app.widgets.get("gamedev:progress"), undefined);
  const resumed = harness(root);
  t.after(() => resumed.event("session_shutdown"));
  await resumed.event("session_start");
  const context = await resumed.event("before_agent_start");
  assert.match(JSON.stringify(context), /1 approved; scope open/);
  assert.match(JSON.stringify(context), /installed subagent tool/);
});

for (const prompt of ["confirm", "input"] as const) {
  test(`scope approval rejects manifest changes during ${prompt}`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), "gamedev scope approval "));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(join(root, "production"));
    await writeFile(join(root, "production/stage.txt"), "Pre-Production");
    await mkdir(join(root, "design/assets"), { recursive: true });
    const manifest = join(root, "design/assets/asset-manifest.md");
    await writeFile(manifest, "Player asset");
    await writeFile(
      join(root, "design/assets/player.md"),
      "Player specification",
    );
    const app = harness(root);
    t.after(() => app.event("session_shutdown"));
    await app.event("session_start");
    await app.call({
      action: "start",
      revision: 0,
      step: "asset-spec",
      subject: "player",
      note: "Specify the player asset.",
    });
    await app.call({
      action: "submit",
      revision: 1,
      run: "r1",
      note: "Player specification ready for review.",
      evidence: ["design/assets/player.md"],
    });
    app.consent(true);
    await app.command("approve r1");
    const before = await readState(root);
    const notices: string[] = [];
    app.ctx.ui.notify = (message) => {
      notices.push(message);
    };
    const confirm = app.ctx.ui.confirm;
    const input = app.ctx.ui.input;
    if (prompt === "confirm") {
      app.ctx.ui.confirm = async () => {
        await writeFile(manifest, "Player and unreviewed enemy assets");
        return true;
      };
    } else {
      app.ctx.ui.input = async () => {
        await writeFile(manifest, "Player and unreviewed enemy assets");
        return "Reviewed the original player-only scope.";
      };
    }
    await app.command("finish asset-spec");
    assert.deepEqual(await readState(root), before);
    assert.match(notices.join("\n"), /Scope evidence changed/);
    app.ctx.ui.confirm = confirm;
    app.ctx.ui.input = input;
    await app.command("finish asset-spec");
    const after = await readState(root);
    assert.equal(after.revision, before.revision + 1);
    assert.equal(
      after.scopes.length,
      1,
      "A fresh review can approve the new manifest",
    );
  });
}

test("unrelated sessions get neither progress files nor injected game instructions", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "unrelated extension "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = harness(root);
  t.after(() => app.event("session_shutdown"));
  await app.event("session_start");
  assert.equal(app.widgets.get("gamedev:progress"), undefined);
  assert.equal(await app.event("before_agent_start"), undefined);
  assert.equal((await readState(root)).revision, 0);
});

test("users can dismiss owned UI even when progress state is corrupt", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "gamedev dismiss "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "production"));
  await writeFile(join(root, "production/stage.txt"), "Production");
  const terminal: Terminal = {
    columns: 120,
    rows: 40,
    kittyProtocolActive: false,
    start() {},
    stop() {},
    async drainInput() {},
    write() {},
    moveBy() {},
    hideCursor() {},
    showCursor() {},
    clearLine() {},
    clearFromCursor() {},
    clearScreen() {},
    setTitle() {},
    setProgress() {},
  };
  const tui = new TuiMainScreen(terminal);
  const app = harness(root, tui);
  t.after(async () => {
    await app.event("session_shutdown");
    tui.stop();
  });
  await app.event("session_start");
  await app.command("panel");
  assert.equal(tui.hasOverlay(), true);
  await writeFile(join(root, "production/workflow-state.json"), "{");
  await app.command("panel");
  assert.equal(tui.hasOverlay(), false);
  await app.command("hide");
  assert.equal(app.widgets.get("gamedev:progress"), undefined);
  await app.event("agent_settled");
  assert.equal(app.widgets.get("gamedev:progress"), undefined);
});

async function sourceApp(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), "gamedev worktree extension "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "production"));
  await writeFile(join(root, "production/stage.txt"), "Concept");
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
  const source = join(root, worktree);
  await mkdir(join(source, "design/gdd"), { recursive: true });
  const file = "design/gdd/game-concept.md";
  await writeFile(join(source, file), "Reviewed concept");
  const app = harness(root);
  t.after(() => app.event("session_shutdown"));
  await app.event("session_start");
  await app.call({
    action: "start",
    revision: 0,
    step: "game-concept",
    subject: "",
    note: "Work",
  });
  await app.call({
    action: "submit",
    revision: 1,
    run: "r1",
    worktree,
    evidence: [],
    note: "Review source",
  });
  app.consent(true);
  const notices: string[] = [];
  app.ctx.ui.notify = (message) => {
    notices.push(message);
  };
  return { root, worktree, source, file, app, git, notices };
}

test("worktree command approval displays the checkout and survives a fresh extension instance", async (t) => {
  const { root, worktree, source, file, app } = await sourceApp(t);
  assert.doesNotMatch(
    JSON.stringify(app.tools.get("gamedev_workflow")!.parameters),
    /"handoff"/,
  );
  let prompt = "";
  app.ctx.ui.confirm = async (_title, message) => {
    prompt = message;
    return true;
  };
  await app.command("approve r1");
  assert.match(prompt, /Source: worktree/);
  assert.ok(prompt.includes(worktree));
  assert.equal((await readState(root)).runs[0].status, "approved");
  const restarted = harness(root);
  t.after(() => restarted.event("session_shutdown"));
  await restarted.event("session_start");
  let context = JSON.stringify(await restarted.event("before_agent_start"));
  assert.match(context, /approved \[worktree evidence\]/);
  assert.match(context, /source: worktree/);
  assert.equal((await readState(source)).revision, 0);
  await writeFile(join(source, file), "Unreviewed replacement");
  context = JSON.stringify(await restarted.event("before_agent_start"));
  assert.match(context, /stale evidence/);
  assert.equal(
    (await snapshot(root))!.rows.find((row) => row.step.id === "game-concept")!
      .complete,
    false,
  );
});

for (const prompt of ["confirm", "input"] as const) {
  for (const mutation of ["file", "removed source", "source switch"] as const) {
    test(`worktree approval rejects ${mutation} during ${prompt}`, async (t) => {
      const { root, worktree, source, file, app, git, notices } =
        await sourceApp(t);
      const before = await readState(root);
      let expected = before;
      const change = async () => {
        if (mutation === "file")
          await writeFile(join(source, file), "Unreviewed change");
        if (mutation === "removed source")
          git("worktree", "remove", "--force", worktree);
        if (mutation === "source switch") {
          const second = ".worktrees/switched checkout";
          git("worktree", "add", "--detach", second);
          await mkdir(join(root, second, "design/gdd"), { recursive: true });
          await writeFile(join(root, second, file), "Reviewed concept");
          await app.call({
            action: "submit",
            revision: before.revision,
            run: "r1",
            worktree: second,
            evidence: [],
            note: "Different source",
          });
          expected = await readState(root);
        }
      };
      const confirm = app.ctx.ui.confirm;
      const input = app.ctx.ui.input;
      if (prompt === "confirm")
        app.ctx.ui.confirm = async () => {
          await change();
          return true;
        };
      else
        app.ctx.ui.input = async () => {
          await change();
          return "Checked original source";
        };
      await app.command("approve r1");
      assert.deepEqual(await readState(root), expected);
      assert.equal(expected.runs[0].status, "submitted");
      assert.ok(notices.length);
      assert.doesNotMatch(notices.join("\n"), /Approval recorded/);
      app.ctx.ui.confirm = confirm;
      app.ctx.ui.input = input;
      if (mutation !== "removed source") {
        await app.call({
          action: "submit",
          revision: expected.revision,
          run: "r1",
          evidence: [],
          note: "Fresh review",
        });
        await app.command("approve r1");
        assert.equal((await readState(root)).runs[0].status, "approved");
      }
    });
  }

  test(`handoff rejects canonical changes during ${prompt} and succeeds after fresh confirmation`, async (t) => {
    const { root, source, worktree, file, app, git, notices } =
      await sourceApp(t);
    await app.command("approve r1");
    await mkdir(join(root, "design/gdd"), { recursive: true });
    await writeFile(join(root, file), await readFile(join(source, file)));
    git("worktree", "remove", "--force", worktree);
    const before = await readState(root);
    const confirm = app.ctx.ui.confirm;
    const input = app.ctx.ui.input;
    const change = () =>
      writeFile(join(root, file), "Unreviewed canonical change");
    if (prompt === "confirm")
      app.ctx.ui.confirm = async () => {
        await change();
        return true;
      };
    else
      app.ctx.ui.input = async () => {
        await change();
        return "Checked original canonical copy";
      };
    await app.command("handoff r1");
    assert.deepEqual(await readState(root), before);
    assert.match(notices.join("\n"), /Canonical evidence differs/);
    app.ctx.ui.confirm = confirm;
    app.ctx.ui.input = input;
    await writeFile(join(root, file), "Reviewed concept");
    app.consent(false);
    await app.command("handoff r1");
    assert.deepEqual(await readState(root), before);
    app.consent(true);
    await app.command("handoff r1");
    const after = await readState(root);
    assert.deepEqual(after.runs[0].evidence, before.runs[0].evidence);
    assert.deepEqual(after.runs[0].source, before.runs[0].source);
    assert.ok(after.runs[0].handoff);
    const restarted = harness(root);
    t.after(() => restarted.event("session_shutdown"));
    const context = JSON.stringify(await restarted.event("before_agent_start"));
    assert.match(context, /handed off from/);
    assert.equal(
      (await snapshot(root))!.rows.find(
        (row) => row.step.id === "game-concept",
      )!.complete,
      true,
    );
    assert.equal(
      await readFile(join(root, "production/stage.txt"), "utf8"),
      "Concept",
    );
  });

  test(`mixed-source aggregate approval rejects worktree manifest changes during ${prompt}`, async (t) => {
    const { root, source, worktree, app, git, notices } = await sourceApp(t);
    // Move the fixture to its asset phase; no workflow command changes the stage.
    await writeFile(join(root, "production/stage.txt"), "Pre-Production");
    const second = ".worktrees/second assets";
    git("worktree", "add", "--detach", second);
    const manifest = "design/assets/asset-manifest.md";
    for (const [tree, subject] of [
      [worktree, "player"],
      [second, "enemy"],
    ]) {
      await mkdir(join(root, tree, "design/assets"), { recursive: true });
      await writeFile(join(root, tree, manifest), "Player and enemy");
      await writeFile(
        join(root, tree, `design/assets/${subject}.md`),
        `${subject} spec`,
      );
      await app.call({
        action: "start",
        revision: (await readState(root)).revision,
        step: "asset-spec",
        subject,
        note: "Specify asset",
      });
      const run = (await readState(root)).runs.at(-1)!.id;
      await app.call({
        action: "submit",
        revision: (await readState(root)).revision,
        run,
        worktree: tree,
        evidence: [`design/assets/${subject}.md`],
        note: "Review asset",
      });
      await app.command(`approve ${run}`);
    }
    const before = await readState(root);
    const confirm = app.ctx.ui.confirm;
    const input = app.ctx.ui.input;
    const change = () =>
      writeFile(join(source, manifest), "Unreviewed new asset");
    if (prompt === "confirm")
      app.ctx.ui.confirm = async () => {
        await change();
        return true;
      };
    else
      app.ctx.ui.input = async () => {
        await change();
        return "Original scope";
      };
    await app.command("finish asset-spec");
    assert.deepEqual(await readState(root), before);
    assert.match(notices.join("\n"), /Scope evidence changed/);
    app.ctx.ui.confirm = confirm;
    app.ctx.ui.input = input;
    await writeFile(join(source, manifest), "Player and enemy");
    await app.command("finish asset-spec");
    assert.equal((await readState(root)).scopes[0].evidence!.length, 2);
    assert.equal(
      (await snapshot(root))!.rows.find((row) => row.step.id === "asset-spec")!
        .complete,
      true,
    );
  });
}

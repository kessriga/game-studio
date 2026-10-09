import type { InstructionFile } from "claude-code";
import { AGENT_GUIDANCE } from "./commands.ts";

/** Pure helpers behind the context, AGENTS.md, and pre-compaction hooks. */
export const ACTIVE_STATE = "production/session-state/active.md";
export const GUIDE = "AGENTS.md";
const HANDOFF_LIMIT = 8000;

function normalize(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/$/, "");
}

/** True when the engine already loaded the project's root AGENTS.md, directly or through an @ import. */
export function hasRootGuide(
  files: readonly InstructionFile[] | undefined,
  root: string,
): boolean {
  const guide = `${normalize(root)}/${GUIDE}`;
  return (files ?? []).some(
    (file) =>
      normalize(file.path) === guide ||
      /(^|\s)@(\.\/)?AGENTS\.md(\s|$)/.test(file.content),
  );
}

export function rootGuideFile(root: string, content: string): InstructionFile {
  return { path: `${normalize(root)}/${GUIDE}`, kind: "project", content };
}

export type Guide = { dir: string; content: string };

/** Nested guides above a touched path that this session has not shown yet; marks them seen. */
export function newNestedGuides(
  found: readonly Guide[],
  root: string,
  seen: Set<string>,
): Guide[] {
  const base = normalize(root);
  const fresh: Guide[] = [];
  for (const guide of found) {
    const dir = normalize(guide.dir);
    if (dir === base || seen.has(dir)) continue;
    seen.add(dir);
    fresh.push({ dir, content: guide.content });
  }
  return fresh;
}

export function nestedGuideNote(guide: Guide): string {
  return `Nested project guide ${guide.dir}/${GUIDE} applies to files under it:\n\n${guide.content}`;
}

export function promptContext(summary: string): string {
  return `${summary}\n${AGENT_GUIDANCE}`;
}

/** The handoff text to keep in the conversation before compaction, bounded. */
export function handoffNote(content: string): string {
  const text =
    content.length > HANDOFF_LIMIT
      ? `${content.slice(0, HANDOFF_LIMIT)}\n[truncated; read ${ACTIVE_STATE} for the rest]`
      : content;
  return `Session handoff from ${ACTIVE_STATE}, kept for compaction. Read the file again after compaction before resuming:\n\n${text}`;
}

/** File-tool inputs that name a path the nested guide check follows. */
export function touchedPath(
  input: Record<string, unknown>,
): string | undefined {
  const path = input.file_path ?? input.notebook_path;
  return typeof path === "string" && path ? path : undefined;
}

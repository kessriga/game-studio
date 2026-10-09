/**
 * Pure checks behind the mod's commit, push, and asset hooks. They take file
 * paths and contents the module already read; nothing here touches `$`.
 */
export type Finding = { deny?: string; notes: string[] };

const COMMAND_START = /(^|&&|\|\||;|\n)\s*git\s+(?:-C\s+\S+\s+|--no-pager\s+)*/;

export function isGitCommit(command: string): boolean {
  return new RegExp(`${COMMAND_START.source}commit\\b`).test(command);
}

export function isGitPush(command: string): boolean {
  return new RegExp(`${COMMAND_START.source}push\\b`).test(command);
}

export const PROTECTED_BRANCHES = ["main", "master", "develop"] as const;

/** True when the commit stages tracked changes itself (-a, --all, --include). */
export function commitStagesAll(command: string): boolean {
  return /(^|\s)(-[a-zA-Z]*a[a-zA-Z]*|--all|--include)(\s|$)/.test(command);
}

/** The branch a push updates: an explicit refspec's destination, else the current branch. */
function pushDestination(
  command: string,
  currentBranch: string | undefined,
): string | undefined {
  const match = new RegExp(`${COMMAND_START.source}push\\b([^&|;\\n]*)`).exec(
    command,
  );
  const words = (match?.[2] ?? "")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !word.startsWith("-"));
  const refspec = words[1];
  if (refspec)
    return refspec.includes(":") ? refspec.split(":").at(-1) : refspec;
  return currentBranch;
}

/** The protected branch a push targets, by name in the command or by the current branch. */
export function protectedPushTarget(
  command: string,
  currentBranch: string | undefined,
): string | undefined {
  const destination = pushDestination(command, currentBranch)?.replace(
    /^refs\/heads\//,
    "",
  );
  return PROTECTED_BRANCHES.find((branch) => branch === destination);
}

export const GDD_SECTIONS = [
  "Overview",
  "Player Fantasy",
  "Detailed",
  "Formulas",
  "Edge Cases",
  "Dependencies",
  "Tuning Knobs",
  "Acceptance Criteria",
] as const;

export type StagedFile = { path: string; content: string | undefined };

function normalize(path: string): string {
  return path.replace(/\\/g, "/");
}

export function isDesignDocument(path: string): boolean {
  return /^design\/gdd\/.*\.md$/.test(normalize(path));
}

export function isDataFile(path: string): boolean {
  return /(^|\/)assets\/data\/.*\.json$/.test(normalize(path));
}

export function isGameplayCode(path: string): boolean {
  return /^src\/gameplay\//.test(normalize(path));
}

export function isSourceFile(path: string): boolean {
  return /^src\//.test(normalize(path));
}

/** Staged paths the commit checks read; everything else is left unread. */
export function pathsToRead(paths: readonly string[]): string[] {
  return paths.filter(
    (path) =>
      isDesignDocument(path) ||
      isDataFile(path) ||
      isGameplayCode(path) ||
      isSourceFile(path),
  );
}

const TUNABLE =
  /\b(damage|health|speed|rate|chance|cost|duration)\s*[:=]\s*[0-9]+/;
const UNOWNED_TODO = /\b(TODO|FIXME|HACK)\b(?!\()/;

export function checkStagedFiles(files: readonly StagedFile[]): Finding {
  const notes: string[] = [];
  const invalid: string[] = [];
  for (const { path, content } of files) {
    if (content === undefined) continue;
    if (isDesignDocument(path)) {
      const lower = content.toLowerCase();
      const missing = GDD_SECTIONS.filter(
        (section) => !lower.includes(section.toLowerCase()),
      );
      if (missing.length)
        notes.push(
          `DESIGN: ${path} is missing sections: ${missing.join(", ")}.`,
        );
    }
    if (isDataFile(path) && !isValidJson(content)) invalid.push(path);
    if (isGameplayCode(path) && TUNABLE.test(content))
      notes.push(
        `CODE: ${path} may hardcode gameplay values; move tunables to data files.`,
      );
    if (isSourceFile(path) && UNOWNED_TODO.test(content))
      notes.push(
        `STYLE: ${path} has TODO/FIXME/HACK without an owner; use TODO(name).`,
      );
  }
  return {
    ...(invalid.length
      ? {
          deny: `Invalid JSON in staged data files: ${invalid.join(", ")}. Fix them before committing.`,
        }
      : {}),
    notes,
  };
}

export function isAssetPath(path: string): boolean {
  return /(^|\/)assets\//.test(normalize(path));
}

/** Naming and format checks for a file written under assets/. */
export function checkAsset(path: string, content: string | undefined): Finding {
  const notes: string[] = [];
  const name = normalize(path).split("/").at(-1) ?? "";
  if (/[A-Z\s-]/.test(name))
    notes.push(
      `NAMING: ${path} should be lowercase with underscores (got ${name}).`,
    );
  if (isDataFile(path) && content !== undefined && !isValidJson(content))
    notes.push(`FORMAT: ${path} is not valid JSON; fix it before continuing.`);
  return { notes };
}

export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function checksNote(title: string, notes: readonly string[]): string {
  return [`Game Studio ${title}:`, ...notes.map((note) => `- ${note}`)].join(
    "\n",
  );
}

export function pushReminder(branch: string): string {
  return `Game Studio: this push targets the protected branch ${branch}. Confirm the build and tests pass and no S1/S2 bugs are open; follow the project's branch policy.`;
}

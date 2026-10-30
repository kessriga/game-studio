/** Counts rows of a project's Markdown index table, such as the systems index. */

export type ProgressSpec = {
  table: string;
  label: string;
  done: string;
  focus?: string;
  /** The repeatable step whose finish waits until the counted tier is done. */
  step?: string;
};

export type Count = { done: number; total: number };
export type Progress = Count & {
  label: string;
  status: string;
  focus?: Count & { label: string };
};

const STATUS = "status";
const PRIORITY = "priority";

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().toLowerCase());
}

function tableRows(
  text: string,
): { header: string[]; rows: string[][] } | undefined {
  const lines = text.split(/\r?\n/);
  for (let index = 0; index + 1 < lines.length; index++) {
    const header = cells(lines[index]!);
    if (!lines[index]!.trim().startsWith("|") || !header.includes(STATUS))
      continue;
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1]!)) continue;
    const rows: string[][] = [];
    for (const line of lines.slice(index + 2)) {
      if (!line.trim().startsWith("|")) break;
      rows.push(cells(line));
    }
    return { header, rows };
  }
  return undefined;
}

/** Count rows whose Status matches `done`, overall and within the `focus` Priority tier. */
export function countProgress(
  text: string,
  spec: ProgressSpec,
): Progress | undefined {
  const table = tableRows(text);
  if (!table) return undefined;
  const status = table.header.indexOf(STATUS);
  const priority = table.header.indexOf(PRIORITY);
  const isDone = (row: string[]) => row[status] === spec.done.toLowerCase();
  const progress: Progress = {
    label: spec.label,
    status: spec.done,
    done: table.rows.filter(isDone).length,
    total: table.rows.length,
  };
  if (!spec.focus || priority < 0) return progress;
  const tier = table.rows.filter(
    (row) => row[priority] === spec.focus!.toLowerCase(),
  );
  if (!tier.length) return progress;
  return {
    ...progress,
    focus: {
      label: spec.focus,
      done: tier.filter(isDone).length,
      total: tier.length,
    },
  };
}

/** The focus tier, or the whole table without one, has rows and all of them are done. */
export function tierComplete(progress: Progress): boolean {
  const counted = progress.focus ?? progress;
  return counted.total > 0 && counted.done === counted.total;
}

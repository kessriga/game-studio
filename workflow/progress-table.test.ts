import assert from "node:assert/strict";
import { test } from "node:test";
import { countProgress } from "./progress-table.ts";

const spec = {
  table: "design/gdd/systems-index.md",
  label: "systems",
  done: "Approved",
  focus: "MVP",
};

const index = `# Systems Index

| Metric | Count |
| --- | --- |
| Total | 3 |

| # | System Name | Category | Priority | Status | Design Doc |
|---|---|---|---|---|---|
| 1 | Run State | Core | MVP | Approved | [a](a.md) |
| 2 | Camera | Core | MVP | In Review | [b](b.md) |
| 3 | Crowd | World | Vertical Slice | Approved | — |
| 4 | Audio | Audio | Vertical Slice | Not Started | — |

Text after the table.
`;

test("counts approved rows overall and in the focus tier", () => {
  assert.deepEqual(countProgress(index, spec), {
    label: "systems",
    done: 2,
    total: 4,
    focus: { label: "MVP", done: 1, total: 2 },
  });
});

test("a table without a Priority column reports only the overall count", () => {
  const text =
    "| Name | Status |\n| --- | --- |\n| A | approved |\n| B | Designed |\n";
  assert.deepEqual(countProgress(text, spec), {
    label: "systems",
    done: 1,
    total: 2,
  });
});

test("text without a status table reports nothing", () => {
  assert.equal(countProgress("# Empty\n\nNo table yet.\n", spec), undefined);
});

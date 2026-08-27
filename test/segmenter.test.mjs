import test from "node:test";
import assert from "node:assert/strict";
import { parseRequirements } from "../src/segmenter.mjs";

test("extracts ordered asks without treating list markers as content", () => {
  const parsed = parseRequirements(`
1. Write the README
2. Add unit tests
3. Run the CI workflow
`);

  assert.deepEqual(parsed.requirements.map(({ text, kind }) => ({ text, kind })), [
    { text: "Write the README", kind: "numbered" },
    { text: "Add unit tests", kind: "numbered" },
    { text: "Run the CI workflow", kind: "numbered" }
  ]);
  assert.equal(parsed.requirements[0].id, "r1");
  assert.equal(parsed.requirements[2].id, "r3");
}
);

test("keeps checkbox and bullet asks separate", () => {
  const parsed = parseRequirements(`
- [ ] Export a JSON report
- [x] Keep the check local
* Add a copy button
`);

  assert.deepEqual(parsed.requirements.map(({ text, kind }) => ({ text, kind })), [
    { text: "Export a JSON report", kind: "checkbox" },
    { text: "Keep the check local", kind: "checkbox" },
    { text: "Add a copy button", kind: "bullet" }
  ]);
}
);

test("uses question lines when a request has no list", () => {
  const parsed = parseRequirements("Who is this for?\nWhat does it cost?\nHow do I start?");

  assert.deepEqual(parsed.requirements.map((item) => item.text), [
    "Who is this for?",
    "What does it cost?",
    "How do I start?"
  ]);
  assert.ok(parsed.requirements.every((item) => item.kind === "question"));
}
);

test("caps extraction so a pasted transcript cannot create an unbounded review", () => {
  const parsed = parseRequirements(Array.from({ length: 20 }, (_, index) => `${index + 1}. Item ${index + 1}`).join("\n"), { maxItems: 4 });

  assert.equal(parsed.requirements.length, 4);
  assert.equal(parsed.truncated, true);
}
);

import test from "node:test";
import assert from "node:assert/strict";
import { parseRequirements } from "../src/segmenter.mjs";
import { buildFollowUp, checkCoverage } from "../src/coverage.mjs";

test("marks every explicit ask complete when the answer contains direct evidence", () => {
  const requirements = parseRequirements(`
1. Write the README
2. Add unit tests
3. Run the CI workflow
`).requirements;
  const result = checkCoverage(requirements, "README written. Unit tests added. CI workflow run.");

  assert.deepEqual(result.items.map((item) => item.status), ["complete", "complete", "complete"]);
  assert.deepEqual(result.summary, { total: 3, complete: 3, partial: 0, missing: 0, unclear: 0, needsFollowUp: 0 });
  assert.equal(result.overallStatus, "complete");
}
);

test("distinguishes a covered ask from missing work", () => {
  const requirements = parseRequirements("1. Export a JSON report\n2. Add unit tests\n3. Publish a release").requirements;
  const result = checkCoverage(requirements, "The JSON report is exported. I did not add tests yet.");

  assert.equal(result.items[0].status, "complete");
  assert.equal(result.items[1].status, "missing");
  assert.equal(result.items[2].status, "missing");
  assert.equal(result.summary.needsFollowUp, 2);
  assert.match(result.items[0].evidence, /JSON report/i);
}
);

test("marks uncertain evidence unclear instead of claiming completion", () => {
  const requirements = parseRequirements("1. Verify the backup").requirements;
  const result = checkCoverage(requirements, "The backup is probably verified, but I am not sure.");

  assert.equal(result.items[0].status, "unclear");
  assert.equal(result.summary.needsFollowUp, 1);
}
);

test("builds a follow-up containing only incomplete asks", () => {
  const requirements = parseRequirements("1. Write the README\n2. Add unit tests").requirements;
  const result = checkCoverage(requirements, "README written.");

  assert.equal(buildFollowUp(result), "Please answer these incomplete items only:\n1. Add unit tests");
}
);

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildFollowUp, checkCoverage } from "../src/coverage.mjs";
import { parseRequirements } from "../src/segmenter.mjs";

const project = join(fileURLToPath(new URL("..", import.meta.url)));
const example = JSON.parse(await readFile(join(project, "examples", "conversation.json"), "utf8"));
const parsed = parseRequirements(example.request);
const coverage = checkCoverage(parsed.requirements, example.answer);

assert.equal(coverage.summary.total, 3);
assert.equal(coverage.summary.complete, 2);
assert.equal(coverage.summary.missing, 1);
assert.match(buildFollowUp(coverage), /Publish a release/);

for (const relative of ["manifest.json", "popup.html", "popup.css", "popup.js", "src/segmenter.mjs", "src/coverage.mjs", "src/collectors.mjs", "BUILD.txt"]) {
  await access(join(project, "dist", relative));
}
const distManifest = JSON.parse(await readFile(join(project, "dist", "manifest.json"), "utf8"));
assert.equal(distManifest.version, "0.1.0");
assert.equal(pathToFileURL(join(project, "dist", "manifest.json")).protocol, "file:");

console.log(`Smoke passed: ${coverage.summary.complete}/${coverage.summary.total} example asks covered; follow-up generated; dist package readable.`);

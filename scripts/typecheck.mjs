import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkCoverage } from "../src/coverage.mjs";
import { parseRequirements } from "../src/segmenter.mjs";

const project = join(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(await readFile(join(project, "manifest.json"), "utf8"));
const collectorUrl = pathToFileURL(join(project, "src", "collectors.mjs")).href;
const { collectConversationFromDocument } = await import(collectorUrl);

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.action.default_popup, "popup.html");
assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "clipboardWrite"]);
assert.equal(typeof collectConversationFromDocument, "function");

const parsed = parseRequirements("1. Write docs\n2. Add tests");
const coverage = checkCoverage(parsed.requirements, "Docs written. Tests added.");
assert.equal(coverage.summary.complete, 2);
assert.equal(coverage.overallStatus, "complete");

console.log("Typecheck passed: MV3 manifest, injection export, and core contract are valid.");

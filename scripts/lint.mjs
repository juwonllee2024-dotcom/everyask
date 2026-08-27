import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const project = join(fileURLToPath(new URL("..", import.meta.url)));
const files = [
  "popup.js",
  "src/segmenter.mjs",
  "src/coverage.mjs",
  "src/collectors.mjs",
  "scripts/build.mjs",
  "scripts/lint.mjs",
  "scripts/smoke.mjs",
  "scripts/typecheck.mjs"
];
const runtimeFiles = ["popup.js", "src/segmenter.mjs", "src/coverage.mjs", "src/collectors.mjs"];

for (const relative of files) {
  const file = join(project, relative);
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  const source = await readFile(file, "utf8");
  if (/[ \t]+$/mu.test(source)) throw new Error(`Trailing whitespace in ${relative}`);
}

for (const relative of runtimeFiles) {
  const source = await readFile(join(project, relative), "utf8");
  for (const forbidden of ["fetch(", "XMLHttpRequest", "WebSocket", "localStorage", "sessionStorage", "document.cookie"]) {
    if (source.includes(forbidden)) throw new Error(`Unexpected network or persistent-data API in ${relative}: ${forbidden}`);
  }
}

const manifest = JSON.parse(await readFile(join(project, "manifest.json"), "utf8"));
if (manifest.host_permissions || manifest.content_scripts) throw new Error("EveryAsk must remain host-permission-free.");
if (JSON.stringify(manifest.permissions) !== JSON.stringify(["activeTab", "scripting", "clipboardWrite"])) {
  throw new Error("EveryAsk permission boundary changed.");
}

console.log(`Lint passed for ${files.length} source files and manifest privacy policy.`);

import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const project = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(project, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "src"), { recursive: true });

for (const file of ["manifest.json", "popup.html", "popup.css", "popup.js"]) {
  await cp(join(project, file), join(dist, file));
}
for (const file of ["segmenter.mjs", "coverage.mjs", "collectors.mjs"]) {
  await cp(join(project, "src", file), join(dist, "src", file));
}
await writeFile(join(dist, "BUILD.txt"), "EveryAsk v0.1.0\nLoad this folder as an unpacked Chrome extension.\n");

console.log(`Built ${dist}`);

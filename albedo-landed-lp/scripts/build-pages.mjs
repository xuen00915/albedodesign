import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "pages-dist");

if (path.dirname(output) !== root) throw new Error("Unexpected Pages output path");

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "elementor"), { recursive: true });

const preview = await readFile(path.join(root, "preview", "index.html"), "utf8");
const page = preview.replaceAll("../elementor/", "elementor/");

await writeFile(path.join(output, "index.html"), page);
await writeFile(path.join(output, ".nojekyll"), "");
await cp(path.join(root, "preview", "assets"), path.join(output, "assets"), { recursive: true });
await cp(
  path.join(root, "elementor", "alb-landing.css"),
  path.join(output, "elementor", "alb-landing.css")
);
await cp(
  path.join(root, "elementor", "alb-landing.js"),
  path.join(output, "elementor", "alb-landing.js")
);

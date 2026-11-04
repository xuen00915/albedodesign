import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(testDirectory, "..");

export async function readProject(relativePath) {
  try {
    return await readFile(path.join(projectRoot, relativePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

export async function loadPreview() {
  const html = await readProject("preview/index.html");
  return new JSDOM(html, {
    url: "https://example.test/landed-home-renovation/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
}

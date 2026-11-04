import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sectionDirectory = path.join(root, "elementor", "sections");
const files = (await readdir(sectionDirectory))
  .filter((name) => /^\d{2}-.*\.html$/.test(name))
  .sort();
const sections = await Promise.all(
  files.map((name) => readFile(path.join(sectionDirectory, name), "utf8"))
);

const document = String.raw`<!doctype html>
<html lang="en-SG">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Landed Home Renovation Singapore | Albedo Design</title>
  <meta name="description" content="Terrace, semi-D, bungalow and shophouse renovation by one trusted design & build team. 800+ projects, BCA & HDB licensed. Book a free consultation.">
  <link rel="preconnect" href="https://albedodesign.com.sg">
  <link rel="stylesheet" href="../elementor/alb-landing.css">
</head>
<body style="margin:0">
  <div class="alb-lp alb-page">
${sections.join("\n")}
  </div>
  <script src="../elementor/alb-landing.js"></script>
</body>
</html>
`;

await mkdir(path.join(root, "preview"), { recursive: true });
await writeFile(path.join(root, "preview", "index.html"), document);

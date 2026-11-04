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
const previewAssetMap = new Map([
  ["https://albedodesign.com.sg/wp-content/uploads/2025/12/cropped-logo-small.png", "assets/albedo-logo.png"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/09/odern-Interior-Design-Project-Singapore.webp", "assets/hero-1.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/09/Residential-Interior-Design-Portfolio-Singapore.webp", "assets/hero-2.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/09/Condominium-Interior-design-singapore.webp", "assets/hero-3.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/09/slider-3-1605243418.webp", "assets/hero-4.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/1612427144.jpg", "assets/consultation-offer.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/09/Heritage-View-Condo-Interior-Design-Singapore.webp", "assets/final-cta.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/4.png", "assets/credential-nippon.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/2.png", "assets/credential-sac.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/1.png", "assets/credential-bizsafe.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/7.png", "assets/credential-top-singapore.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/5.png", "assets/credential-hafele.webp"],
  ["https://albedodesign.com.sg/wp-content/uploads/2026/01/Albedo-HDB-Renovation-Licensed-contractor.jpg", "assets/credential-hdb.webp"]
]);
const previewSections = sections.map((section) => {
  for (const [remoteUrl, localPath] of previewAssetMap) section = section.replaceAll(remoteUrl, localPath);
  return section;
});
previewSections[1] = previewSections[1].replace(
  'src="assets/hero-1.webp"',
  'src="assets/hero-1.webp" srcset="assets/hero-1-800.webp 800w, assets/hero-1.webp 1600w" sizes="(max-width:1024px) calc(100vw - 36px), 740px"'
);
for (const deferredHero of ["hero-2.webp", "hero-3.webp", "hero-4.webp"]) {
  previewSections[1] = previewSections[1].replace(
    'src="assets/' + deferredHero + '"',
    'src="assets/hero-1-800.webp" data-src="assets/' + deferredHero + '"'
  );
}
for (const sectionIndex of [4, 7]) {
  previewSections[sectionIndex] = previewSections[sectionIndex].replace(
    /src="assets\/(hero-[1-4]\.webp)"/g,
    'src="assets/hero-1-800.webp" data-src="assets/$1" data-alb-lazy'
  );
}

const document = String.raw`<!doctype html>
<html lang="en-SG">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Landed Home Renovation Singapore | Albedo Design</title>
  <meta name="description" content="Terrace, semi-D, bungalow and shophouse renovation by one trusted design & build team. 800+ projects, BCA & HDB licensed. Book a free consultation.">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2300325D'/%3E%3Cpath d='M16 45 30 15h5l14 30h-8l-3-7H27l-3 7zm14-14h6l-3-8z' fill='white'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="../elementor/alb-landing.css">
</head>
<body style="margin:0">
  <div class="alb-lp alb-page">
${previewSections[0]}
    <main class="alb-main">
${previewSections.slice(1, 13).join("\n")}
    </main>
${previewSections.slice(13).join("\n")}
  </div>
  <script src="../elementor/alb-landing.js"></script>
</body>
</html>
`;

await mkdir(path.join(root, "preview"), { recursive: true });
await writeFile(path.join(root, "preview", "index.html"), document);

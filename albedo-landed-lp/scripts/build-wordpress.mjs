import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "wordpress-dist");
const siteConfig = JSON.parse(await readFile(path.join(root, "wordpress/site.json"), "utf8"));
const shortcode = process.env.ALB_FORM_SHORTCODE ?? siteConfig.form_shortcode;
if (!/^\[contact-form-7\s+id="[a-zA-Z0-9_-]+"(?:\s+title="[^"<>\[\]]*")?\]$/.test(shortcode)) {
  throw new Error('Set ALB_FORM_SHORTCODE to the verified existing form, e.g. [contact-form-7 id="123"]. No preview form will be shipped.');
}
const site = new URL(process.env.ALB_SITE_URL || siteConfig.site_url);
if (site.pathname !== "/" || site.search || site.hash || site.username || site.password || !["http:", "https:"].includes(site.protocol)) {
  throw new Error("ALB_SITE_URL must be a site origin without credentials or a path.");
}
const html = await readFile(path.join(root, "preview/index.html"), "utf8");
const css = await readFile(path.join(root, "elementor/alb-landing.css"), "utf8") + "\n" + await readFile(path.join(root, "wordpress/alb-wordpress.css"), "utf8") + "\n" + await readFile(path.join(root, "wordpress/alb-polish.css"), "utf8");
const landingJs = await readFile(path.join(root, "elementor/alb-landing.js"), "utf8");
const wordpressJs = await readFile(path.join(root, "wordpress/alb-wordpress.js"), "utf8");
const houseJs = await readFile(path.join(root, "elementor/alb-house3d.js"), "utf8");
const cf7Form = await readFile(path.join(root, "wordpress/cf7-form.html"), "utf8");
const hash = createHash("sha256").update(html + css + landingJs + wordpressJs + houseJs + cf7Form + shortcode + site.origin);
const assetNames = (await readdir(path.join(root, "preview/assets"))).sort();
for (const name of assetNames) hash.update(await readFile(path.join(root, "preview/assets", name)));
hash.update(await readFile(path.join(root, "elementor/vendor/three.min.js")));
const version = hash.digest("hex").slice(0, 12);
const assetRelative = `alb-landed/${version}`;
const assetUrl = `${site.origin}/wp-content/uploads/${assetRelative}/`;
await rm(output, { recursive: true, force: true });
const assets = path.join(output, "uploads", assetRelative);
await mkdir(assets, { recursive: true });
for (const name of assetNames) await cp(path.join(root, "preview/assets", name), path.join(assets, name));
await cp(path.join(root, "elementor/vendor/three.min.js"), path.join(assets, "three.min.js"));
await cp(path.join(root, "elementor/vendor/three.LICENSE"), path.join(assets, "three.LICENSE"));
await writeFile(path.join(assets, "alb-landing.css"), css);
await writeFile(path.join(assets, "alb-landing.js"), landingJs);
await writeFile(path.join(assets, "alb-house3d.js"), houseJs);
await writeFile(path.join(assets, "alb-wordpress.js"), wordpressJs);

const dom = new JSDOM(html);
const document = dom.window.document;
for (const node of document.querySelectorAll("[src],[data-src],[data-three-src],[srcset]")) {
  for (const attr of ["src", "data-src", "data-three-src", "srcset"]) {
    const value = node.getAttribute(attr);
    if (value) node.setAttribute(attr, value.replaceAll("../elementor/vendor/three.min.js", `${assetUrl}three.min.js`).replaceAll("assets/", assetUrl));
  }
}
const form = document.querySelector("[data-alb-preview-form]");
if (!form || document.querySelectorAll("[data-alb-preview-form]").length !== 1) throw new Error("Expected one preview form slot.");
const slot = document.createElement("div");
slot.className = "alb-form";
slot.textContent = shortcode;
form.replaceWith(slot);
const sections = [...document.querySelector(".alb-page").children].flatMap(node => node.matches("main") ? [...node.children] : [node]);
const id = value => createHash("sha256").update(value).digest("hex").slice(0, 8);
const content = sections.map((section, index) => {
  let markup = section.outerHTML;
  if (index === 0) markup = `<link rel="stylesheet" href="${assetUrl}alb-landing.css">\n` + markup;
  if (index === sections.length - 1) markup += ["alb-landing.js", "alb-house3d.js", "alb-wordpress.js"].map(name => `\n<script src="${assetUrl}${name}" defer></script>`).join("");
  const formSection = section.id === "hero";
  return {
    id: id(`section-${index}`), elType: "widget", widgetType: formSection ? "shortcode" : "html", isInner: false,
    settings: { _title: section.dataset.albSection || section.id || `Section ${index + 1}`, _css_classes: "alb-wp-section", [formSection ? "shortcode" : "html"]: markup }, elements: []
  };
});
const template = {
  title: "Albedo Landed Home Renovation — Review", type: "page", version: "0.4",
  page_settings: { template: "elementor_canvas", hide_title: "yes" },
  content: [{ id: id("albedo-page"), elType: "container", isInner: false,
    settings: { content_width: "full", css_classes: "alb-lp alb-page alb-wp-page", padding: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true } }, elements: content }]
};
const serialized = JSON.stringify(template, null, 2);
if (serialized.includes("data-alb-preview-form")) throw new Error("Preview form leaked into WordPress package.");
await writeFile(path.join(output, "albedo-landed-elementor.json"), serialized + "\n");
await cp(path.join(root, "wordpress/import-draft.php"), path.join(output, "import-draft.php"));
await cp(path.join(root, "wordpress/repair-review-form.php"), path.join(output, "repair-review-form.php"));
await writeFile(path.join(output, "cf7-form.html"), cf7Form);
await cp(path.join(root, "wordpress/PUBLISH.md"), path.join(output, "PUBLISH.md"));
await cp(path.join(root, "docs/placeholders.md"), path.join(output, "content-signoff.md"));
await writeFile(path.join(output, "release.json"), JSON.stringify({
  version, site: site.origin, form_shortcode: shortcode, assets_path: `/wp-content/uploads/${assetRelative}/`,
  target_path: "/landed-home-renovation/", mode: "draft-review", form_delivery_tested: false,
  template_sha256: createHash("sha256").update(serialized + "\n").digest("hex")
}, null, 2) + "\n");
execFileSync("python3", ["-c", "import pathlib,sys,zipfile\np=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:\n for f in sorted(p.rglob('*')):\n  if f.is_file(): z.write(f,f.relative_to(p))", output, path.join(root, "wordpress-release.zip")]);
console.log(`Prepared WordPress release ${version}: ${output}\nArchive: ${path.join(root, "wordpress-release.zip")}`);

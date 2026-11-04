import test from "node:test";
import assert from "node:assert/strict";
import { loadPreview, readProject } from "./helpers.mjs";

async function loadHouseScript(window) {
  const script = await readProject("elementor/alb-house3d.js");
  assert.ok(script, "missing elementor/alb-house3d.js");
  window.eval(script);
}

test("why-us section carries the 3D house markup and honest illustration label", async () => {
  const dom = await loadPreview();
  const section = dom.window.document.querySelector('[data-alb-section="why-us"]');
  assert.ok(section.hasAttribute("data-alb-house"), "section must opt in to the 3D house");
  assert.match(section.getAttribute("data-three-src"), /three\.min\.js$/);

  const canvas = section.querySelector("canvas.alb-house__canvas");
  assert.equal(canvas.getAttribute("role"), "img");
  assert.ok(canvas.getAttribute("aria-label").length > 20);
  assert.ok(canvas.hasAttribute("hidden"), "canvas stays hidden until the 3D scene is built");

  const fallback = section.querySelector("img.alb-house__fallback");
  assert.ok(fallback.getAttribute("alt").length > 10, "fallback illustration needs alt text");
  assert.equal(section.querySelector(".alb-house__label").textContent.trim(), "Illustration of our 3D design process");

  const steps = [...section.querySelectorAll(".alb-why__step")];
  assert.deepEqual(
    steps.map((step) => step.querySelector("h3").textContent.trim()),
    ["1. We plan every floor first", "2. You see every room in 3D", "3. One team builds your complete home"]
  );
  assert.deepEqual(
    steps.map((step) => step.dataset.label),
    ["Floor plan & layout", "3D interior design", "Your complete home"]
  );
});

test("Elementor snippet points at WordPress media and the preview maps it locally", async () => {
  const snippet = await readProject("elementor/sections/04-why-us.html");
  assert.match(snippet, /data-three-src="https:\/\/albedodesign\.com\.sg\/wp-content\/uploads\/alb\/three\.min\.js"/);
  assert.match(snippet, /src="https:\/\/albedodesign\.com\.sg\/wp-content\/uploads\/alb\/house-3d-complete\.webp"/);
  const preview = await readProject("preview/index.html");
  assert.match(preview, /data-three-src="\.\.\/elementor\/vendor\/three\.min\.js"/);
  assert.match(preview, /<script src="\.\.\/elementor\/alb-house3d\.js"><\/script>/);
  assert.ok(await readProject("elementor/vendor/three.min.js"), "vendored three.js is missing");
});

test("without WebGL the section stays a static illustration and list", async () => {
  const dom = await loadPreview();
  const { window } = dom;
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  await loadHouseScript(window);
  window.AlbedoHouse3D.initAll(window.document);
  const section = window.document.querySelector('[data-alb-section="why-us"]');
  assert.equal(section.classList.contains("is-3d"), false, "no pinned scroll scene without WebGL");
  assert.ok(section.querySelector(".alb-house__canvas").hasAttribute("hidden"));
  assert.equal(window.document.querySelectorAll('script[src*="three.min.js"]').length, 0, "three.js must not load");
});

test("scroll progress maps each third of the section to one 3D stage", async () => {
  const dom = await loadPreview();
  await loadHouseScript(dom.window);
  const { sceneProgress } = dom.window.AlbedoHouse3D;
  assert.equal(sceneProgress(0), 0);
  assert.ok(Math.abs(sceneProgress(1 / 3) - 0.5) < 1e-9, "step 1 ends when the upper floor is built");
  assert.ok(Math.abs(sceneProgress(2 / 3) - 0.8) < 1e-9, "step 2 ends when the interior is furnished");
  assert.ok(Math.abs(sceneProgress(1) - 1) < 1e-9, "step 3 ends on the complete house");
});

test("stylesheet pins the 3D section only after the script enhances it", async () => {
  const css = await readProject("elementor/alb-landing.css");
  assert.match(css, /\.alb-lp\.alb-why\.is-3d \.alb-why__track\s*\{[^}]*height:2600px/s);
  assert.match(css, /\.alb-lp\.alb-why\.is-3d \.alb-why__pin\s*\{[^}]*position:sticky/s);
  assert.doesNotMatch(css, /\.alb-lp \.alb-why__track\s*\{[^}]*height:/s, "un-enhanced track must not reserve scroll height");
});

import test from "node:test";
import assert from "node:assert/strict";
import { readProject } from "./helpers.mjs";

test("shared stylesheet defines the approved token values", async () => {
  const css = await readProject("elementor/alb-landing.css");
  for (const declaration of [
    "--alb-navy:#00325D",
    "--alb-orange:#ED5930",
    "--alb-bg:#F7F8FA",
    "--alb-max:1360px",
    "--alb-section-y:104px"
  ]) {
    assert.ok(css.includes(declaration), "missing token " + declaration);
  }
});

test("every ordinary selector is scoped from alb-lp", async () => {
  const css = await readProject("elementor/alb-landing.css");
  const selectorLines = css.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("{") && !line.startsWith("@"));
  assert.ok(selectorLines.length > 20, "stylesheet is missing component rules");
  for (const line of selectorLines) {
    const selectors = line.slice(0, -1).split(",").map((selector) => selector.trim());
    for (const selector of selectors) {
      assert.ok(selector.startsWith(".alb-lp"), "unscoped selector " + selector);
    }
  }
});

test("stylesheet includes required accessibility and responsive contracts", async () => {
  const css = await readProject("elementor/alb-landing.css");
  assert.match(css, /\.alb-lp .*:focus-visible/);
  assert.match(css, /@media \(max-width:1024px\)/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.alb-lp \.alb-is-hidden\s*\{[^}]*display:none/s);
  assert.match(css, /\.alb-lp \.alb-table-wrap\s*\{[^}]*overflow-x:auto/s);
});

import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import { loadPreview, projectRoot, readProject } from "./helpers.mjs";

const sections = [
  ["header", "01-header.html"],
  ["hero", "02-hero.html"],
  ["trust", "03-trust-bar.html"],
  ["why-us", "04-why-us.html"],
  ["property-types", "05-property-types.html"],
  ["pricing", "06-pricing.html"],
  ["consultation-offer", "07-consultation-offer.html"],
  ["projects", "08-projects.html"],
  ["testimonials", "09-testimonials.html"],
  ["process", "10-process.html"],
  ["comparison", "11-comparison.html"],
  ["faq", "12-faq.html"],
  ["final-cta", "13-final-cta.html"],
  ["footer", "14-footer.html"],
  ["mobile-bar", "15-mobile-bar.html"]
];
const sectionOrder = sections.map(([name]) => name);

test("preview exposes exactly one page heading", async () => {
  const dom = await loadPreview();
  assert.equal(dom.window.document.querySelectorAll("h1").length, 1);
});

test("preview keeps all landing-page components in the approved order", async () => {
  const dom = await loadPreview();
  const actual = [...dom.window.document.querySelectorAll("[data-alb-section]")]
    .map((node) => node.getAttribute("data-alb-section"));
  assert.deepEqual(actual, sectionOrder);
});

test("all Elementor section snippets exist", async () => {
  await Promise.all(sections.map(async ([, filename]) => {
    await assert.doesNotReject(
      access(path.join(projectRoot, "elementor", "sections", filename)),
      filename
    );
  }));
});

test("enquiry form uses the approved visible and hidden field names", async () => {
  const dom = await loadPreview();
  const form = dom.window.document.querySelector("#enquire form");
  assert.ok(form, "missing fallback enquiry form");
  const names = [...form.elements].map((field) => field.name).filter(Boolean);
  for (const required of [
    "name",
    "phone",
    "property_type",
    "start_when",
    "pdpa_consent",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "gclid",
    "landing_page"
  ]) {
    assert.ok(names.includes(required), "missing form field " + required);
  }
});

test("contact actions use the approved telephone and WhatsApp destinations", async () => {
  const dom = await loadPreview();
  const links = [...dom.window.document.querySelectorAll("a")].map((link) => link.href);
  assert.ok(links.includes("tel:+6596699319"), "mobile call link missing");
  assert.ok(links.includes("tel:+6563932278"), "office call link missing");
  assert.ok(links.includes("https://wa.me/6596699319"), "WhatsApp link missing");
});

test("optional pricing is built but hidden by the approved utility class", async () => {
  const dom = await loadPreview();
  const pricing = dom.window.document.querySelector('[data-alb-section="pricing"]');
  assert.ok(pricing);
  assert.ok(pricing.classList.contains("alb-is-hidden"));
});

test("every bracketed launch placeholder is registered", async () => {
  const html = await readProject("preview/index.html");
  const register = await readProject("docs/placeholders.md");
  const placeholders = [...new Set(html.match(/\[[^\]\n]+\]/g) || [])];
  assert.ok(placeholders.length > 0, "preview must retain launch placeholders");
  for (const placeholder of placeholders) {
    assert.ok(register.includes(placeholder), "unregistered placeholder " + placeholder);
  }
});

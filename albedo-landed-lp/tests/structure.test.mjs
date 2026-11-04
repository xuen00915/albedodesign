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

test("static preview uses local optimized copies of supplied media", async () => {
  const dom = await loadPreview();
  const images = [...dom.window.document.querySelectorAll("img")];
  assert.ok(images.length >= 8, "expected supplied logo and project media");
  for (const image of images) {
    assert.ok(
      image.getAttribute("src").startsWith("assets/"),
      "preview image is not local: " + image.getAttribute("src")
    );
  }
  const lcpImage = dom.window.document.querySelector(".alb-slide.is-active img");
  assert.match(lcpImage.getAttribute("srcset") || "", /hero-1-800\.webp 800w/);

  const deferredImages = [...dom.window.document.querySelectorAll(".alb-slide img[data-src]")];
  assert.equal(deferredImages.length, 3, "only the first hero photo should load upfront");
  for (const image of deferredImages) {
    assert.equal(image.getAttribute("src"), "assets/hero-1-800.webp");
    assert.match(image.dataset.src, /\.webp$/);
  }
});

test("hero exposes an accessible playback control and balanced headline phrases", async () => {
  const dom = await loadPreview();
  const toggle = dom.window.document.querySelector(".alb-slider__toggle");
  assert.ok(toggle, "missing slider pause/play control");
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(toggle.getAttribute("aria-label"), "Pause project slideshow");

  const headlineLines = [...dom.window.document.querySelectorAll("#hero h1 .alb-h1-line")];
  assert.equal(headlineLines.length, 2);
  assert.equal(
    headlineLines.map((line) => line.textContent.trim()).join(" "),
    "Landed home renovation, crafted end to end."
  );
});

test("mobile header keeps a concise consultation label", async () => {
  const dom = await loadPreview();
  const cta = dom.window.document.querySelector(".alb-header a[href='#enquire']");
  assert.equal(cta.querySelector(".alb-header__cta-full")?.textContent.trim(), "Free consultation");
  assert.equal(cta.querySelector(".alb-header__cta-short")?.textContent.trim(), "Free consult");
});

test("credentials section uses all supplied accreditation assets", async () => {
  const snippet = await readProject("elementor/sections/03-trust-bar.html");
  for (const filename of ["4.png", "2.png", "1.png", "7.png", "5.png", "Albedo-HDB-Renovation-Licensed-contractor.jpg"]) {
    assert.ok(snippet.includes("/2026/01/" + filename), "missing credential asset " + filename);
  }

  const dom = await loadPreview();
  const section = dom.window.document.querySelector("#trust");
  assert.match(section.querySelector("h2")?.textContent || "", /Industry credentials/i);
  const primaryGroup = section.querySelector(".alb-trust__group:not([aria-hidden='true'])");
  assert.ok(primaryGroup, "credential strip needs an accessible primary logo group");
  const images = [...primaryGroup.querySelectorAll("img")];
  assert.equal(images.length, 6);
  for (const image of images) {
    assert.match(image.getAttribute("src") || "", /^assets\/credential-.+\.webp$/);
    assert.ok(image.getAttribute("alt")?.trim(), "credential image needs useful alternative text");
  }
  const duplicate = section.querySelector(".alb-trust__group[aria-hidden='true']");
  assert.equal(duplicate?.querySelectorAll("img").length, 6, "running strip needs a seamless duplicate group");
});

test("property types and hero slides target their matching project showcases", async () => {
  const dom = await loadPreview();
  const expected = ["#project-terrace", "#project-semi-detached", "#project-bungalow", "#project-shophouse"];
  const propertyTargets = [...dom.window.document.querySelectorAll(".alb-property-grid .alb-property")]
    .map((link) => link.getAttribute("href"));
  const slideTargets = [...dom.window.document.querySelectorAll(".alb-slider .alb-slide")]
    .map((slide) => slide.dataset.project);

  assert.deepEqual(propertyTargets, expected);
  assert.deepEqual(slideTargets, expected);
  assert.equal(dom.window.document.querySelector(".alb-slider__project-link")?.getAttribute("href"), expected[0]);
  for (const selector of expected) {
    const project = dom.window.document.querySelector(selector);
    assert.ok(project, "missing project target " + selector);
    assert.ok(project.querySelector("img"), "project target needs real imagery " + selector);
  }
});

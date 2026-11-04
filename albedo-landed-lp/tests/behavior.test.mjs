import test from "node:test";
import assert from "node:assert/strict";
import { loadPreview, readProject } from "./helpers.mjs";

async function createPage({ reducedMotion = true, url, beforeScript } = {}) {
  const dom = await loadPreview();
  const { window } = dom;
  if (url) window.history.replaceState({}, "", url);
  const intervals = new Map();
  const timeouts = new Map();
  let nextInterval = 1;
  window.matchMedia = () => ({
    matches: reducedMotion,
    addEventListener() {},
    removeEventListener() {}
  });
  window.setInterval = (callback) => {
    const id = nextInterval++;
    intervals.set(id, callback);
    return id;
  };
  window.clearInterval = (id) => intervals.delete(id);
  window.setTimeout = (callback) => {
    const id = nextInterval++;
    timeouts.set(id, callback);
    return id;
  };
  window.clearTimeout = (id) => timeouts.delete(id);
  window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(options) {
    this.dataset.scrolledWith = JSON.stringify(options || {});
  };
  window.document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    const href = link?.getAttribute("href") || "";
    if (href.startsWith("tel:") || href.startsWith("https://wa.me/")) event.preventDefault();
  }, true);
  if (beforeScript) beforeScript(window);
  const script = await readProject("elementor/alb-landing.js");
  if (script) window.eval(script);
  return { dom, window, intervals, timeouts };
}

function requireApi(window) {
  assert.ok(window.AlbedoLanding, "expected the landing-page API to be installed");
  return window.AlbedoLanding;
}

function activeIndex(slider) {
  return [...slider.querySelectorAll(".alb-slide")]
    .findIndex((slide) => slide.classList.contains("is-active"));
}

test("next and previous controls wrap carousel state and accessibility metadata", async () => {
  const { window } = await createPage();
  const api = requireApi(window);
  api.initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");

  slider.querySelector(".alb-prev").click();
  assert.equal(activeIndex(slider), 3);
  assert.equal(slider.querySelectorAll(".alb-slide")[3].getAttribute("aria-hidden"), "false");
  assert.match(slider.querySelector(".alb-slider__counter").textContent, /^04 \/ 04/);

  slider.querySelector(".alb-next").click();
  assert.equal(activeIndex(slider), 0);
  assert.equal(slider.querySelectorAll(".alb-slide")[3].getAttribute("aria-hidden"), "true");
});

test("carousel segment selection updates the slide, segment, and live caption", async () => {
  const { window } = await createPage();
  const api = requireApi(window);
  api.initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");

  slider.querySelector('[data-slide="2"]').click();

  assert.equal(activeIndex(slider), 2);
  assert.ok(slider.querySelectorAll(".alb-slider-segment")[2].classList.contains("is-active"));
  assert.equal(
    slider.querySelector(".alb-slider__caption-text").textContent,
    "Bright living and dining, made for family"
  );
  assert.equal(slider.querySelector(".alb-slider__project-link").getAttribute("href"), "#project-bungalow");
});

test("repeated initialization does not duplicate carousel handlers", async () => {
  const { window } = await createPage();
  const api = requireApi(window);
  api.initAll(window.document);
  api.initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");

  slider.querySelector(".alb-next").click();

  assert.equal(slider.dataset.albReady, "true");
  assert.equal(activeIndex(slider), 1);
});

test("reduced motion prevents carousel autoplay", async () => {
  const { window, intervals } = await createPage({ reducedMotion: true });
  requireApi(window).initAll(window.document);
  assert.equal(intervals.size, 0);
});

test("autoplay defers its first transition, then advances every six-second cycle and pauses", async () => {
  const { window, intervals, timeouts } = await createPage({ reducedMotion: false });
  requireApi(window).initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");
  assert.equal(intervals.size, 0);
  assert.equal(timeouts.size, 1);

  [...timeouts.values()][0]();
  assert.equal(intervals.size, 1);
  [...intervals.values()][0]();
  assert.equal(activeIndex(slider), 1);

  slider.dispatchEvent(new window.MouseEvent("mouseenter"));
  assert.equal(intervals.size, 0);
  slider.dispatchEvent(new window.MouseEvent("mouseleave"));
  assert.equal(intervals.size, 1);

  slider.dispatchEvent(new window.FocusEvent("focusin", { bubbles: true }));
  assert.equal(intervals.size, 0);
  slider.dispatchEvent(new window.FocusEvent("focusout", { bubbles: true }));
  assert.equal(intervals.size, 1);

  Object.defineProperty(window.document, "visibilityState", { configurable: true, value: "hidden" });
  window.document.dispatchEvent(new window.Event("visibilitychange"));
  assert.equal(intervals.size, 0);
  Object.defineProperty(window.document, "visibilityState", { configurable: true, value: "visible" });
  window.document.dispatchEvent(new window.Event("visibilitychange"));
  assert.equal(intervals.size, 1);
});

test("slider pause button holds playback until the visitor explicitly resumes", async () => {
  const { window, intervals, timeouts } = await createPage({ reducedMotion: false });
  requireApi(window).initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");
  const toggle = slider.querySelector(".alb-slider__toggle");

  [...timeouts.values()][0]();
  assert.equal(intervals.size, 1);

  toggle.click();
  assert.equal(intervals.size, 0);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  assert.equal(toggle.getAttribute("aria-label"), "Play project slideshow");
  assert.ok(slider.classList.contains("is-user-paused"));

  slider.querySelector(".alb-next").click();
  assert.equal(activeIndex(slider), 1);
  assert.equal(intervals.size, 0, "manual navigation must not override the pause choice");

  toggle.click();
  assert.equal(intervals.size, 1);
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(toggle.getAttribute("aria-label"), "Pause project slideshow");
  assert.ok(!slider.classList.contains("is-user-paused"));
});

test("carousel responds to scoped arrow keys and horizontal swipe", async () => {
  const { window } = await createPage();
  requireApi(window).initAll(window.document);
  const slider = window.document.querySelector(".alb-slider");

  slider.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal(activeIndex(slider), 1);

  const pointerDown = new window.Event("pointerdown", { bubbles: true });
  Object.defineProperty(pointerDown, "clientX", { value: 200 });
  slider.dispatchEvent(pointerDown);
  const pointerUp = new window.Event("pointerup", { bubbles: true });
  Object.defineProperty(pointerUp, "clientX", { value: 120 });
  slider.dispatchEvent(pointerUp);
  assert.equal(activeIndex(slider), 2);
});

test("enquiry CTA scrolls to the form and focuses the Name field", async () => {
  const { window } = await createPage();
  requireApi(window).initAll(window.document);
  const target = window.document.querySelector("#enquire");
  const name = window.document.querySelector('[name="name"]');

  window.document.querySelector('#final-cta a[href="#enquire"]').click();

  assert.match(target.dataset.scrolledWith, /"behavior":"auto"/);
  assert.equal(window.document.activeElement, name);
});

test("call, WhatsApp, and enquiry CTA clicks push section-aware events", async () => {
  const { window } = await createPage();
  requireApi(window).initAll(window.document);

  window.document.querySelector('[data-alb-section="header"] a[href^="tel:"]').click();
  window.document.querySelector('#footer a[href^="https://wa.me/"]').click();
  window.document.querySelector('#final-cta a[href="#enquire"]').click();

  assert.deepEqual(
    JSON.parse(JSON.stringify(window.dataLayer.slice(-3))),
    [
      { event: "alb_call_click", location: "header" },
      { event: "alb_whatsapp_click", location: "footer" },
      { event: "alb_cta_click", label: "Get a Free Consultation" }
    ]
  );
});

test("URL attribution persists in sessionStorage and repopulates hidden fields", async () => {
  const { window } = await createPage({
    url: "/landed-home-renovation/?utm_source=google&utm_medium=cpc&utm_campaign=landed&utm_term=renovation&gclid=test-123"
  });
  const api = requireApi(window);
  api.initAll(window.document);
  assert.equal(window.document.querySelector('[name="utm_source"]').value, "google");
  assert.equal(window.document.querySelector('[name="gclid"]').value, "test-123");

  window.history.replaceState({}, "", "/landed-home-renovation/");
  window.document.querySelector('[name="utm_source"]').value = "";
  window.document.querySelector('[name="gclid"]').value = "";
  api.initAll(window.document);

  assert.equal(window.document.querySelector('[name="utm_source"]').value, "google");
  assert.equal(window.document.querySelector('[name="gclid"]').value, "test-123");
});

test("preview form provides a local success state and lead payload", async () => {
  const { window } = await createPage();
  requireApi(window).initAll(window.document);
  const form = window.document.querySelector("[data-alb-preview-form]");
  form.querySelector('[name="name"]').value = "Jamie";
  form.querySelector('[name="phone"]').value = "+65 8123 4567";
  form.querySelector('[name="email"]').value = "jamie@example.com";
  form.querySelector('[name="property_type"]').value = "Terrace";
  form.querySelector('[name="promo_opt_in"][value="Yes"]').checked = true;

  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  assert.match(form.querySelector('[role="status"]').textContent, /Thank you!/);
  assert.deepEqual(
    JSON.parse(JSON.stringify(window.dataLayer.at(-1))),
    {
      event: "alb_lead_submit",
      property_type: "Terrace",
      promo_opt_in: "Yes"
    }
  );
});

test("Elementor HTML widget hook safely initializes its scoped carousel", async () => {
  let registration;
  const { window } = await createPage({
    beforeScript(pageWindow) {
      pageWindow.elementorFrontend = {
        hooks: {
          addAction(name, callback) {
            registration = { name, callback };
          }
        }
      };
    }
  });

  window.dispatchEvent(new window.Event("elementor/frontend/init"));

  assert.equal(registration?.name, "frontend/element_ready/html.default");
  const slider = window.document.querySelector(".alb-slider");
  registration.callback({ 0: slider });
  assert.equal(slider.dataset.albReady, "true");
});

test("Elementor submit_success bridge pushes the approved lead payload", async () => {
  let submitRegistration;
  const { window } = await createPage({
    beforeScript(pageWindow) {
      pageWindow.jQuery = () => ({
        on(eventName, selector, callback) {
          submitRegistration = { eventName, selector, callback };
        }
      });
    }
  });
  requireApi(window).initAll(window.document);
  const form = window.document.querySelector("[data-alb-preview-form]");
  form.querySelector('[name="property_type"]').value = "Semi-detached";
  form.querySelector('[name="promo_opt_in"][value="No"]').checked = true;

  assert.ok(submitRegistration, "expected Elementor submit_success registration");
  submitRegistration.callback.call(form);

  assert.equal(submitRegistration.eventName, "submit_success");
  assert.equal(submitRegistration.selector, ".elementor-form");
  assert.deepEqual(
    JSON.parse(JSON.stringify(window.dataLayer.at(-1))),
    { event: "alb_lead_submit", property_type: "Semi-detached", promo_opt_in: "No" }
  );
});

test("deferred carousel images receive their real source only when selected", async () => {
  const { window } = await createPage({
    beforeScript(pageWindow) {
      const image = pageWindow.document.querySelectorAll(".alb-slide img")[1];
      image.setAttribute("src", "assets/hero-1-800.webp");
      image.setAttribute("data-src", "assets/hero-2.webp");
    }
  });
  const image = window.document.querySelectorAll(".alb-slide img")[1];

  window.dispatchEvent(new window.Event("load"));
  assert.match(image.src, /assets\/hero-1-800\.webp$/);

  window.document.querySelector('[data-slide="1"]').click();

  assert.match(image.src, /assets\/hero-2\.webp$/);
  assert.equal(image.hasAttribute("data-src"), false);
});

test("an enquiry CTA inserted after initialization still scrolls and focuses the form", async () => {
  const { window } = await createPage();
  requireApi(window).initAll(window.document);
  const dynamicCta = window.document.createElement("a");
  dynamicCta.href = "#enquire";
  dynamicCta.textContent = "Dynamic consultation CTA";
  window.document.querySelector("#footer").append(dynamicCta);

  dynamicCta.click();

  assert.match(window.document.querySelector("#enquire").dataset.scrolledWith, /"block":"start"/);
  assert.equal(window.document.activeElement, window.document.querySelector('[name="name"]'));
});

test("a click anywhere on a project photo opens its details", async () => {
  const { window } = await createPage();
  const document = window.document;
  document.querySelector("#project-bungalow .alb-project-card__media img").click();
  const dialog = document.getElementById("project-bungalow-details");
  assert.ok(dialog.open || dialog.hasAttribute("open"), "dialog should open from the photo");
});

test("hero View project link scrolls to and highlights the matching card", async () => {
  const { window } = await createPage();
  const document = window.document;
  const link = document.querySelector(".alb-slider__project-link");
  link.setAttribute("href", "#project-shophouse");
  link.click();
  const card = document.getElementById("project-shophouse");
  assert.equal(card.classList.contains("is-active"), true);
  assert.ok(card.dataset.scrolledWith);
});

test("project details open, track the view, hydrate photos and close", async () => {
  const { window } = await createPage();
  const document = window.document;
  window.dataLayer = [];
  const opener = document.querySelector('#project-terrace [data-alb-dialog]');
  opener.click();
  const dialog = document.getElementById("project-terrace-details");
  assert.ok(dialog.open || dialog.hasAttribute("open"), "dialog should open");
  assert.equal(document.documentElement.style.overflow, "hidden");
  assert.equal(dialog.querySelectorAll("img[data-src]").length, 0, "dialog photos load on open");
  for (const image of dialog.querySelectorAll("img")) {
    assert.match(image.getAttribute("src"), /^assets\/hero-1\.webp$/, "dialog photo source must survive lazy hydration");
  }
  assert.deepEqual({ ...window.dataLayer.at(-1) }, { event: "alb_project_view", project: "terrace" });

  dialog.querySelector("[data-alb-dialog-close]").click();
  assert.equal(dialog.open || dialog.hasAttribute("open"), false);
  assert.equal(document.documentElement.style.overflow, "");
});

test("Get a design like this pre-selects the property type and scrolls to the form", async () => {
  const { window } = await createPage();
  const document = window.document;
  window.dataLayer = [];
  document.querySelector('#project-semi-detached .alb-project-card__more').click();
  const dialog = document.getElementById("project-semi-detached-details");
  dialog.querySelector("a[data-alb-property]").click();
  assert.equal(dialog.open || dialog.hasAttribute("open"), false);
  assert.equal(document.querySelector('#enquire [name="property_type"]').value, "Semi-detached");
  assert.ok(document.getElementById("enquire").dataset.scrolledWith, "should scroll to the enquiry form");
  assert.equal(window.dataLayer.at(-1).event, "alb_cta_click");
});

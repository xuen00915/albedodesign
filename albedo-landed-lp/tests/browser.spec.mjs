import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const pageUrl = "http://127.0.0.1:4187/preview/";

async function revealLazyImages(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(20);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test("core landing-page interactions work in the rendered browser", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  const slider = page.locator(".alb-slider");
  await expect(slider.locator(".alb-slide.is-active")).toHaveAttribute("data-caption", "Open-plan living with warm timber accents");
  await slider.locator(".alb-next").click();
  await expect(slider.locator(".alb-slide.is-active")).toHaveAttribute("data-caption", "Feature wall and layered ceiling lighting");
  await slider.locator('[data-slide="3"]').click();
  await expect(slider.locator(".alb-slide.is-active")).toHaveAttribute("data-caption", "Statement lounge with sculpted lighting");
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider.locator(".alb-slide.is-active")).toHaveAttribute("data-caption", "Bright living and dining, made for family");

  await slider.dispatchEvent("pointerdown", { clientX: 220 });
  await slider.dispatchEvent("pointerup", { clientX: 120 });
  await expect(slider.locator(".alb-slide.is-active")).toHaveAttribute("data-caption", "Statement lounge with sculpted lighting");

  await page.locator('#final-cta a[href="#enquire"]').click();
  await expect(page.locator('[name="name"]')).toBeFocused();

  await page.locator('[name="name"]').fill("Preview test");
  await page.locator('[name="phone"]').fill("+65 8123 4567");
  await page.locator('[name="property_type"]').selectOption({ label: "Terrace" });
  await page.locator('[name="start_when"]').selectOption({ label: "Within 3 months" });
  await page.locator('[name="pdpa_consent"]').check();
  await page.locator("[data-alb-preview-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator(".alb-form__status")).toContainText("Thank you!");

  const events = await page.evaluate(() => window.dataLayer.map((item) => item.event));
  expect(events).toContain("alb_cta_click");
  expect(events).toContain("alb_lead_submit");
  expect(consoleErrors).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 360, height: 800 }
]) {
  test("layout has no page overflow at " + viewport.width + "px", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto(pageUrl, { waitUntil: "networkidle" });

    const dimensions = await page.evaluate(() => ({
      rootWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heroWidth: document.querySelector("#hero").getBoundingClientRect().width
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.rootWidth + 1);
    expect(dimensions.heroWidth).toBeLessThanOrEqual(dimensions.rootWidth + 1);
    await expect(page.locator("#hero h1")).toBeVisible();
    await expect(page.locator("#enquire")).toBeVisible();

    if (viewport.width <= 760) {
      await expect(page.locator(".alb-mbar")).toBeVisible();
      await expect(page.locator(".alb-header .alb-hide-sm").first()).toBeHidden();
    } else {
      await expect(page.locator(".alb-mbar")).toBeHidden();
    }
    if (viewport.width === 390) {
      const formTop = await page.locator("#enquire").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
      expect(formTop).toBeLessThanOrEqual(viewport.height * 1.5);
    }
    expect(consoleErrors).toEqual([]);
  });
}

test("capture QA screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await revealLazyImages(page);
  await page.screenshot({ path: "preview/qa-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await revealLazyImages(page);
  await page.screenshot({ path: "preview/qa-mobile.png", fullPage: true });
});

test("rendered page meets landmark, contrast, target-size, and favicon fundamentals", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]')).toHaveCount(1);

  const primaryButtons = await page.locator(".alb-btn--primary").evaluateAll((nodes) => {
    function channel(value) {
      value /= 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }
    function luminance(color) {
      const [r, g, b] = color.match(/\d+/g).slice(0, 3).map(Number);
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }
    return nodes.map((node) => {
      const style = getComputedStyle(node);
      const lighter = Math.max(luminance(style.color), luminance(style.backgroundColor));
      const darker = Math.min(luminance(style.color), luminance(style.backgroundColor));
      return {
        label: node.textContent.trim().replace(/\s+/g, " "),
        ratio: (lighter + 0.05) / (darker + 0.05),
        size: parseFloat(style.fontSize),
        weight: Number(style.fontWeight)
      };
    });
  });
  for (const button of primaryButtons) {
    expect(button.ratio, button.label).toBeGreaterThanOrEqual(4.5);
  }

  const footerTargets = await page.locator(".alb-footer a").evaluateAll((nodes) =>
    nodes.map((node) => ({ label: node.textContent.trim(), height: node.getBoundingClientRect().height }))
  );
  for (const target of footerTargets) {
    expect(target.height, target.label).toBeGreaterThanOrEqual(24);
  }
});

test("desktop hero and slider controls fit within the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  const geometry = await page.locator(".alb-slider").evaluate((slider) => {
    const box = slider.getBoundingClientRect();
    const nav = slider.querySelector(".alb-slider__nav").getBoundingClientRect();
    const hero = document.querySelector("#hero").getBoundingClientRect();
    return { heroBottom: hero.bottom, sliderBottom: box.bottom, sliderHeight: box.height, navBottom: nav.bottom };
  });
  expect(geometry.heroBottom).toBeLessThanOrEqual(800);
  expect(geometry.sliderHeight).toBeLessThanOrEqual(560);
  expect(geometry.sliderBottom).toBeLessThanOrEqual(800);
  expect(geometry.navBottom).toBeLessThanOrEqual(800);
});

test("credentials render as one compact running strip that pauses for interaction", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await page.locator("#trust").scrollIntoViewIfNeeded();

  const sectionHeight = await page.locator("#trust").evaluate((node) => node.getBoundingClientRect().height);
  expect(sectionHeight).toBeLessThanOrEqual(220);

  const track = page.locator(".alb-trust__track");
  const firstTransform = await track.evaluate((node) => getComputedStyle(node).transform);
  await page.waitForTimeout(450);
  const secondTransform = await track.evaluate((node) => getComputedStyle(node).transform);
  expect(secondTransform).not.toBe(firstTransform);

  const marquee = page.locator(".alb-trust__marquee");
  await marquee.hover();
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await marquee.focus();
  await expect(track).toHaveCSS("animation-play-state", "paused");
});

test("credential motion stops when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await expect(page.locator(".alb-trust__track")).toHaveCSS("animation-name", "none");
});

test("property cards navigate to matching project showcases", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  await page.locator('.alb-property[href="#project-bungalow"]').click();
  await expect(page).toHaveURL(/#project-bungalow$/);
  const targetTop = await page.locator("#project-bungalow").evaluate((node) => node.getBoundingClientRect().top);
  expect(targetTop).toBeGreaterThanOrEqual(70);
  expect(targetTop).toBeLessThanOrEqual(180);
});

test("initial load requests only the first hero photo", async ({ page }) => {
  const heroRequests = [];
  page.on("request", (request) => {
    if (/\/assets\/hero-[1-4](?:-800)?\.webp$/.test(request.url())) heroRequests.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  expect(heroRequests.some((url) => /hero-1-800\.webp$/.test(url))).toBe(true);
  expect(heroRequests.some((url) => /hero-[234]\.webp$/.test(url))).toBe(false);
});

test("mobile header and slider controls remain uncrowded", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  await expect(page.locator(".alb-header__cta-full")).toBeHidden();
  await expect(page.locator(".alb-header__cta-short")).toBeVisible();
  const geometry = await page.evaluate(() => {
    const header = document.querySelector(".alb-header__inner").getBoundingClientRect();
    const logo = document.querySelector(".alb-logo").getBoundingClientRect();
    const cta = document.querySelector(".alb-header .alb-btn--navy").getBoundingClientRect();
    const caption = document.querySelector(".alb-slider__caption").getBoundingClientRect();
    const nav = document.querySelector(".alb-slider__nav").getBoundingClientRect();
    const controls = [...document.querySelectorAll(".alb-slider__nav button")]
      .filter((button) => getComputedStyle(button).display !== "none")
      .map((button) => {
        const box = button.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
    return {
      headerFits: logo.right <= cta.left && cta.right <= header.right + 1,
      controlsClearCaption: caption.right + 8 <= nav.left,
      controls
    };
  });
  expect(geometry.headerFits).toBe(true);
  expect(geometry.controlsClearCaption).toBe(true);
  for (const control of geometry.controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
});

test("Elementor snippets retain section-level styles without the preview wrapper", async ({ page }) => {
  const names = [
    "01-header.html",
    "02-hero.html",
    "04-why-us.html",
    "06-pricing.html",
    "10-process.html",
    "14-footer.html",
    "15-mobile-bar.html"
  ];
  const snippets = await Promise.all(names.map((name) =>
    readFile(new URL("../elementor/sections/" + name, import.meta.url), "utf8")
  ));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(
    '<link rel="stylesheet" href="http://127.0.0.1:4187/elementor/alb-landing.css">' +
    snippets.join("\n"),
    { waitUntil: "networkidle" }
  );

  const styles = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    return {
      headerPosition: style(".alb-header").position,
      heroBackground: style(".alb-hero").backgroundColor,
      sectionPadding: parseFloat(style(".alb-why").paddingTop),
      pricingDisplay: style(".alb-pricing").display,
      processBackground: style(".alb-process").backgroundColor,
      footerBackground: style(".alb-footer").backgroundColor,
      mobileBarDisplay: style(".alb-mbar").display
    };
  });

  expect(styles).toEqual({
    headerPosition: "sticky",
    heroBackground: "rgb(247, 248, 250)",
    sectionPadding: 72,
    pricingDisplay: "none",
    processBackground: "rgb(0, 34, 63)",
    footerBackground: "rgb(0, 26, 51)",
    mobileBarDisplay: "flex"
  });
});

test("why-us 3D house pins, follows the scroll, and loads three.js lazily", async ({ page }) => {
  const threeRequests = [];
  const errors = [];
  page.on("request", (request) => {
    if (/three\.min\.js$/.test(request.url())) threeRequests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  expect(threeRequests).toHaveLength(0);

  const section = page.locator('[data-alb-section="why-us"]');
  const track = section.locator(".alb-why__track");
  const top = await track.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  const span = await track.evaluate((node) => node.offsetHeight - window.innerHeight);
  expect(span).toBeGreaterThan(800);

  const expected = [
    [0.1, 0, "Floor plan & layout"],
    [0.5, 1, "3D interior design"],
    [0.95, 2, "Your complete home"]
  ];
  for (const [fraction, index, label] of expected) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(top + fraction * span));
    await expect(section.locator(".alb-why__step").nth(index)).toHaveClass(/is-active/);
    await expect(section.locator(".alb-why__step").nth(index)).toHaveAttribute("aria-current", "step");
    await expect(section.locator(".alb-house__badge")).toHaveText(label);
    const pinTop = await section.locator(".alb-why__pin").evaluate((node) => node.getBoundingClientRect().top);
    expect(pinTop).toBeGreaterThanOrEqual(60);
    expect(pinTop).toBeLessThanOrEqual(80);
    const activeBottom = await section.locator(".alb-why__step").nth(index)
      .evaluate((node) => node.getBoundingClientRect().bottom);
    const barTop = await page.locator(".alb-mbar").evaluate((node) => node.getBoundingClientRect().top);
    expect(activeBottom).toBeLessThanOrEqual(barTop);
  }

  expect(threeRequests).toHaveLength(1);
  await expect(section.locator(".alb-house")).toHaveClass(/is-live/);
  await expect(section.locator(".alb-house__canvas")).toBeVisible();
  expect(errors).toEqual([]);
});

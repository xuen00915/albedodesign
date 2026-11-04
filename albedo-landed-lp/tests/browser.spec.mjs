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
  await page.locator('[name="email"]').fill("preview@example.com");
  await page.locator("#enquire .alb-choice__pill").filter({ hasText: "Yes" }).click();
  await expect(page.locator('[name="promo_opt_in"][value="Yes"]')).toBeChecked();
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
    const copy = document.querySelector(".alb-hero__copy");
    return { heroBottom: hero.bottom, sliderBottom: box.bottom, sliderTop: slider.offsetTop, copyTop: copy.offsetTop, sliderHeight: slider.offsetHeight, copyHeight: copy.offsetHeight, navBottom: nav.bottom };
  });
  expect(geometry.heroBottom).toBeLessThanOrEqual(800);
  expect(Math.abs(geometry.sliderTop - geometry.copyTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.sliderHeight - geometry.copyHeight)).toBeLessThanOrEqual(1);
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

test("project cards sit four in a row, fill one screen, reveal View more on hover and open details", async ({ page }) => {
  const events = [];
  await page.exposeFunction("albEvent", (payload) => events.push(payload));
  await page.addInitScript(() => {
    window.dataLayer = [];
    const push = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = (payload) => { window.albEvent(payload); return push(payload); };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  const tops = await page.locator(".alb-project-card").evaluateAll((cards) =>
    cards.map((card) => Math.round(card.getBoundingClientRect().top)));
  expect(tops).toHaveLength(4);
  expect(new Set(tops).size).toBe(1);

  const fit = await page.evaluate(() => {
    const head = document.querySelector("#projects h2").getBoundingClientRect();
    const grid = document.querySelector(".alb-project-grid").getBoundingClientRect();
    const header = document.querySelector(".alb-header").getBoundingClientRect();
    return grid.bottom - head.top + header.height + 40;
  });
  expect(fit).toBeLessThanOrEqual(1000);

  const card = page.locator("#project-bungalow");
  const more = card.locator(".alb-project-card__more");
  await card.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await expect.poll(() => more.evaluate((node) => getComputedStyle(node).opacity)).toBe("0");
  await card.hover();
  await expect.poll(() => more.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  expect(await card.locator(".alb-project-card__media").evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await more.click();
  const dialog = page.locator("#project-bungalow-details");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".alb-project-dialog__close")).toBeFocused();
  await expect.poll(() => dialog.locator("img").evaluateAll((images) =>
    images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(card.locator(".alb-project-card__more")).toBeFocused();

  await card.locator(".alb-project-card__more").click();
  await dialog.locator("a[data-alb-property]").click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#enquire [name="property_type"]')).toHaveValue("Bungalow / detached");
  await expect.poll(() => page.evaluate(() => {
    const top = document.getElementById("enquire").getBoundingClientRect().top;
    return top > -10 && top < 220;
  })).toBe(true);
  expect(events.some((event) => event.event === "alb_project_view" && event.project === "bungalow")).toBe(true);
});

test("project cards stack on phones and always show View more", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const lefts = await page.locator(".alb-project-card").evaluateAll((cards) =>
    cards.map((card) => Math.round(card.getBoundingClientRect().left)));
  expect(new Set(lefts).size).toBe(1);
  const card = page.locator("#project-terrace");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".alb-project-card__more")).toBeVisible();
  await card.locator(".alb-project-card__more").tap();
  await expect(page.locator("#project-terrace-details")).toBeVisible();
  await context.close();
});

test("hero View project link scrolls to the matching card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await page.locator('.alb-slider [data-slide="2"]').click();
  await page.locator(".alb-slider__project-link").click();
  await expect(page.locator("#project-bungalow")).toHaveClass(/is-active/);
  await expect(page).toHaveURL(/#project-bungalow$/);
  await expect.poll(() => page.locator("#project-bungalow").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  })).toBe(true);
});

test("form labels keep the required star inline and buttons carry no arrow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const rows = await page.evaluate(() => [...document.querySelectorAll("#enquire .alb-form__label")].map((label) => {
    const star = label.querySelector(".alb-req");
    if (!star) return true;
    return Math.abs(star.getBoundingClientRect().top - label.getBoundingClientRect().top) < 4;
  }));
  expect(rows.every(Boolean)).toBe(true);
  await expect(page.locator('#enquire button[type="submit"] svg')).toHaveCount(0);
  await expect(page.locator(".alb-offer-badge")).not.toContainText("[");
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
    heroBackground: "rgb(255, 255, 255)",
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

test("project cards and the consultation offer keep one section gap", async ({ page }) => {
  for (const [width, expected] of [[1440, 104], [390, 72]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const gap = await page.evaluate(() => {
      const grid = document.querySelector(".alb-project-grid").getBoundingClientRect();
      const panel = document.querySelector(".alb-offer__panel").getBoundingClientRect();
      return Math.round(panel.top - grid.bottom);
    });
    expect(gap).toBe(expected);
  }
});

test("FAQ contact buttons carry icons and share one size", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const buttons = page.locator("#faq .alb-contact-card .alb-btn");
  await expect(buttons).toHaveCount(2);
  await expect(buttons.nth(0).locator("svg.alb-icon-whatsapp")).toHaveCount(1);
  await expect(buttons.nth(1).locator("svg")).toHaveCount(1);
  const sizes = await buttons.evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return [Math.round(rect.width), Math.round(rect.height)];
  }));
  expect(sizes[0]).toEqual(sizes[1]);
});

test("jumping to the form or a project hops over the 3D section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await expect(page.locator(".alb-why")).toHaveClass(/is-3d/);
  const watch = () => page.evaluate(() => {
    const why = document.querySelector(".alb-why");
    const top = why.getBoundingClientRect().top + scrollY;
    window.albWhy = [top, top + why.offsetHeight - innerHeight];
    window.albSeen = [];
    window.addEventListener("scroll", () => window.albSeen.push(scrollY));
  });
  const crossed = () => page.evaluate(() =>
    window.albSeen.filter((y) => y > window.albWhy[0] + 2 && y < window.albWhy[1] - 2).length);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await watch();
  await page.locator('#final-cta a[href="#enquire"]').click();
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("enquire").getBoundingClientRect().top))).toBeLessThan(200);
  expect(await crossed()).toBe(0);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await watch();
  await page.locator(".alb-slider__project-link").click();
  await expect.poll(() => page.evaluate(() => {
    const rect = document.querySelector("#project-terrace").getBoundingClientRect();
    return rect.top > 0 && rect.bottom < innerHeight + 200;
  })).toBe(true);
  expect(await crossed()).toBe(0);
});

test("process title sits on one line on desktop and every step has an icon", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await expect(page.locator("#process .alb-process__grid article svg.alb-process__icon")).toHaveCount(6);
  const lines = await page.locator("#process h2").evaluate((node) =>
    Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight || "0") || 0));
  const fits = await page.locator("#process h2").evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
  expect(fits).toBe(true);
  expect(lines).toBeLessThanOrEqual(1);
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
  test(`tablet ${viewport.width}px keeps photos within half the screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const heights = await page.evaluate(() =>
      [".alb-slider", ".alb-project-card__media", ".alb-offer__panel > img", ".alb-final__panel"].map((selector) =>
        [selector, document.querySelector(selector).getBoundingClientRect().height]));
    for (const [selector, height] of heights) {
      expect(height, selector).toBeLessThanOrEqual(Math.max(440, viewport.height * 0.58));
    }
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`why-us steps jump straight to their stage when clicked (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const why = page.locator(".alb-why");
    await expect(why).toHaveClass(/is-3d/);
    await page.evaluate(() => {
      const track = document.querySelector(".alb-why__track");
      window.scrollTo(0, track.getBoundingClientRect().top + scrollY + 10);
    });
    const steps = page.locator(".alb-why__step");
    await expect(steps.nth(0)).toHaveClass(/is-active/);
    await expect(steps.nth(2).locator("button.alb-why__jump")).toHaveCount(1);

    await steps.nth(2).locator("h3").click();
    await expect(steps.nth(2)).toHaveClass(/is-active/);
    const atEnd = await page.evaluate(() => {
      const track = document.querySelector(".alb-why__track");
      return Math.abs(track.getBoundingClientRect().bottom - innerHeight) < 4;
    });
    expect(atEnd).toBe(true);

    await steps.nth(1).locator("h3").click();
    await expect(steps.nth(1)).toHaveClass(/is-active/);
    await steps.nth(0).locator("button.alb-why__jump").focus();
    await page.keyboard.press("Enter");
    await expect(steps.nth(0)).toHaveClass(/is-active/);
  });
}

test("Google logo sits in the rating beside the heading and stays on one line on phones", async ({ page }) => {
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const logo = page.locator("#testimonials .alb-rating__logo");
    await logo.scrollIntoViewIfNeeded();
    await expect.poll(() => logo.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(logo).toHaveAttribute("alt", "Google");
    const rating = await page.locator("#testimonials .alb-rating").evaluate((node) => ({
      labelHeight: node.querySelector(":scope > span:last-child").getBoundingClientRect().height,
      right: node.getBoundingClientRect().right
    }));
    expect(rating.labelHeight).toBeLessThan(26);
    expect(rating.right).toBeLessThanOrEqual(width);
  }
});

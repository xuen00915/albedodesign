import { test, expect } from "@playwright/test";

const pageUrl = "http://127.0.0.1:4187/preview/";

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
  await page.screenshot({ path: "preview/qa-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
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
    const requiredRatio = button.size >= 18.66 && button.weight >= 700 ? 3 : 4.5;
    expect(button.ratio, button.label).toBeGreaterThanOrEqual(requiredRatio);
  }

  const footerTargets = await page.locator(".alb-footer a").evaluateAll((nodes) =>
    nodes.map((node) => ({ label: node.textContent.trim(), height: node.getBoundingClientRect().height }))
  );
  for (const target of footerTargets) {
    expect(target.height, target.label).toBeGreaterThanOrEqual(24);
  }
});

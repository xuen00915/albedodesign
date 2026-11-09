import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { projectRoot, readProject } from "./helpers.mjs";

test("WordPress package renders the real form shortcode and bundles every referenced asset", async () => {
  execFileSync(process.execPath, ["scripts/build-wordpress.mjs"], { cwd: projectRoot });
  const template = JSON.parse(await readProject("wordpress-dist/albedo-landed-elementor.json"));
  const release = JSON.parse(await readProject("wordpress-dist/release.json"));
  const widgets = template.content[0].elements;
  const markup = widgets.map(widget => widget.settings.html || widget.settings.shortcode).join("\n");
  const document = new JSDOM(markup).window.document;
  assert.equal(template.page_settings.template, "elementor_canvas");
  assert.equal(widgets.filter(widget => widget.widgetType === "shortcode").length, 1);
  assert.ok(document.querySelector("#enquire").textContent.includes(release.form_shortcode));
  assert.equal(document.querySelectorAll("form,[data-alb-preview-form]").length, 0);
  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.ok(document.querySelector(".alb-is-hidden"), "unapproved prices remain hidden");
  for (const node of document.querySelectorAll("img,script,[data-three-src],link[rel=stylesheet]")) {
    for (const attribute of ["src", "data-src", "data-three-src", "href"]) {
      const value = node.getAttribute(attribute);
      if (!value) continue;
      assert.ok(value.startsWith(release.site + release.assets_path), `unexpected asset: ${value}`);
      await access(path.join(projectRoot, "wordpress-dist/uploads", new URL(value).pathname.replace("/wp-content/uploads/", "")));
    }
  }
  const form = await readProject("wordpress-dist/cf7-form.html");
  assert.doesNotMatch(form, /data-alb-cf7-fields|\binert\b/);
  for (const name of ["your-name", "your-phone", "your-email", "promo_opt_in", "property_type", "utm_source", "utm_medium", "utm_campaign", "utm_term", "gclid", "landing_page"]) assert.ok(form.includes(name));
});

test("CF7 success is tracked once, excludes other forms and never counts rejected submissions", async () => {
  const dom = new JSDOM('<div class="alb-wp-page"><div id="enquire"><div class="wpcf7" id="landed"></div></div></div><div class="wpcf7" id="other"></div>', { runScripts: "outside-only" });
  const { window } = dom;
  const script = await readProject("wordpress/alb-wordpress.js");
  window.eval(script);
  window.eval(script);
  const detail = { inputs: [{ name: "your-email", value: "private@example.test" }, { name: "property_type", value: "Terrace" }, { name: "promo_opt_in", value: "No" }] };
  const dispatch = (id, type) => window.document.getElementById(id).dispatchEvent(new window.CustomEvent(type, { bubbles: true, detail }));
  for (const type of ["wpcf7submit", "wpcf7invalid", "wpcf7spam", "wpcf7mailfailed"]) dispatch("landed", type);
  dispatch("other", "wpcf7mailsent");
  assert.equal(window.dataLayer, undefined);
  dispatch("landed", "wpcf7mailsent");
  assert.deepEqual(JSON.parse(JSON.stringify(window.dataLayer)), [{ event: "alb_lead_submit", property_type: "Terrace", promo_opt_in: "No" }]);
  assert.ok(!JSON.stringify(window.dataLayer).includes("private@example.test"));
});

test("WordPress builder rejects missing or unsafe form shortcodes before producing a release", () => {
  for (const shortcode of ["", '[contact-form-7 id="123"]<script>alert(1)</script>']) {
    assert.throws(() => execFileSync(process.execPath, ["scripts/build-wordpress.mjs"], { cwd: projectRoot, env: { ...process.env, ALB_FORM_SHORTCODE: shortcode }, stdio: "pipe" }));
  }
});

# Albedo WordPress release

This package updates the Git design for the main `albedodesign.com.sg` site. It is prepared for draft review, not an automatic public release.

## Current review — 9 November 2026

- WordPress draft **10993**: https://albedodesign.com.sg/?page_id=10993&preview=true (requires login).
- Copied CF7 form **10992**, verified saved shortcode ID **ef39ba3**. Published page **10972** and original form **10973** were not changed by this work.
- Installed draft asset release: **280550199669**, matching the local package. Stylesheet SHA256: `701938ea13f26ab4df820cb9e6ef0d328f329881de9e23aced7f60b1a85edce4`.
- The draft form reference was repaired using the freshly loaded saved form's shortcode. Desktop preview confirms the form renders, name/phone align side by side, email spans the card, choices are aligned, and the orange submit button is styled correctly. No enquiry was submitted.
- Page polish includes tighter section spacing, consistent corners, softer hero shadow, corrected header offset, and page-scoped hiding of duplicate WPCode header/footer/floating buttons. WP Armour's administrator-only notice is hidden; honeypot protection remains active.
- Private server backup folder: `/home/albedode/alb-landed-review-20261106/`. Latest pre-change draft backup: `draft-before-final-20261109-050038.json`. Main WordPress root: `/home/albedode/public_html`.
- Remote `final-polish.php` applied guarded CSS changes with source/target checksum checks, replaced 48 asset URL prefixes inside decoded widget fields, repaired the form shortcode, verified stored data, and cleared the draft Elementor caches. Do not rerun it: its old-release guard will reject the current state.
- Never replace release hashes globally in raw Elementor JSON; that previously altered a form title and broke rendering. Replace asset URL prefixes only, and preserve form IDs/titles.
- The packaged `repair-review-form.php` is an optional guarded repair utility, not a required next step; the current draft is already repaired. The importer now reloads saved CF7 forms before generating their shortcodes.
- Desktop hero/form visually verified. A 722px responsive view showed clean stacking. Full tablet/phone visual and interaction checks remain unfinished because the user requested a restart during viewport adjustment. Finish these before publication.
- Both PHP files pass syntax checks and all 42 automated checks pass. Email delivery and content signoff remain pending. Keep this page as a draft until release checks are complete.
- cPanel access restored on 9 November. WordPress access restored through the main installation's Softaculous Login link. Use normal sign-in again if sessions expire; no credentials are stored in this repo.

## Verified site context — 5 November 2026

The main WordPress dashboard shows WordPress 7.1.4, Elementor 4.3.6, Elementor Pro 4.3.3, Hello Elementor and Rank Math. A **published** page already exists at `/landed-home-renovation/`, dated 4 November. The rendered enquiry form is Contact Form 7 with WP Armour. Its original form (post 10973, shortcode `2ff5e90`) uses `your-name`, `your-phone`, `your-email` and `promo_opt_in`, inside a hidden/inert wrapper intended for the existing page's custom bridge. It has no attribution fields in the form template.

The package therefore **copies** that form for the review draft, preserves its mail settings, replaces the hidden wrapper with a directly usable form, and adds project/attribution fields. It leaves the original published page and original form intact. The current recipient is `[_site_admin_email]`, which differs from the original repository brief's `enquiry@albedodesign.com.sg`; its resolved mailbox and delivery must be checked before release.

The separate `commercial.albedodesign.com.sg` hosting and commercial form IDs do not apply. Main-site access was verified through the user's cPanel/Chrome session. Do not put credentials, session URLs, private backups or enquiries into Git.

## Build after a Git change

From `albedo-landed-lp`, install with `npm ci`, then build. `wordpress/site.json` records the verified **Landed Home Consultation** shortcode (`2ff5e90`) from the main site's Contact Forms list on 5 November:

```sh
npm run build:wordpress
npm test
```

If the form is replaced, verify its shortcode in **Contact → Contact Forms**, update `wordpress/site.json`, and rebuild. `ALB_FORM_SHORTCODE` and `ALB_SITE_URL` can override these values for a separate test environment.

The builder refuses to include the simulated preview form. It generates `wordpress-dist/` and `wordpress-release.zip`. `release.json` identifies the site, existing form, asset version and template checksum. All images and three.js are bundled under a new versioned upload folder so a release does not overwrite assets used by the existing page.

## Prepare a review draft

Preferred route when WP-CLI is available:

1. Extract the ZIP into a private folder outside `public_html`.
2. Read `release.json` and confirm the main-site URL and form shortcode.
3. From that folder run `wp --path=/actual/wordpress/root eval-file import-draft.php --use-include`.
4. The installer verifies the site, plugins, source form field names and template checksum, copies new versioned assets, clones the source form with `cf7-form.html` and its existing delivery settings, and creates a **draft** with Elementor Canvas and page-level noindex. It refuses to overwrite an existing review page or a mismatching asset. It does not alter the published page or source form. The cloned form adds attribution to the copied email body.

Admin-only route:

1. Upload the package's `uploads/alb-landed/RELEASE/` folder into the site's `wp-content/uploads/alb-landed/` using cPanel File Manager or SFTP. Keep the version subfolder intact.
2. Import `albedo-landed-elementor.json` through Elementor's saved-template importer.
3. Create a new page titled **Landed Home Renovation — Review**. Keep it a draft. Set Elementor Canvas, hide the title, and insert the imported template with its page settings.
4. In Contact Forms, duplicate **Landed Home Consultation**. Give it a review title, replace only its Form tab with `cf7-form.html`, and retain the copied Mail, Messages and Additional Settings. Add the new hidden-field mail tags to the copied message body if those values should appear in email. Change the hero Shortcode widget to the **new copy's** shortcode. Do not leave the original hidden/inert form in the review template.
5. Other sections remain HTML widgets; content edits should be made in Git and rebuilt. The JSON intentionally references the source form until the importer or operator substitutes the copied form's shortcode.

The template includes its own header/footer and loads its CSS/scripts inside this page. Do not additionally paste those assets into site-wide Custom Code or WPCode. If existing Albedo landing scripts/styles are site-wide, inspect their scope before previewing to avoid loading two versions.

## Form and tracking checks

- Preserve the existing recipient, reply-to, anti-spam and storage configuration. Do not assume a visually working form delivers email.
- Required visible CF7 fields: `your-name`, `your-phone`, `your-email`, `promo_opt_in` (Yes/No). HTML IDs remain `form-field-name`, `form-field-phone`, and `form-field-email` for the shared JavaScript. Hidden fields: `property_type`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `gclid`, `landing_page`.
- Confirm the exact source field names before import. The CLI installer refuses a source form with missing names; it does not change the shared form.
- Confirm the resolved site-admin recipient and sender delivery configuration. The package preserves them; it does not silently redirect enquiries to the address in the older brief.
- The WordPress adapter emits `alb_lead_submit` only for CF7 `wpcf7mailsent` inside this page's enquiry card. It excludes invalid/spam/failed submissions and includes only property type and marketing choice, not personal contact data.
- Inspect current GTM and site snippets for existing success handlers, conversions and redirects before connecting another conversion. Do not add duplicate tracking or remove an existing success redirect blindly.
- When the owner authorizes a labelled test enquiry, check required-field rejection, Yes and No opt-in, selected project type, attribution, anti-spam behavior, stored submission, and actual mailbox receipt. Invalid or failed submissions must not count as leads. A successful browser message alone is insufficient.

## Review and publish

1. Check `content-signoff.md`: landed-project photography, logo quality, credentials, reviews and offer claims still require the documented business confirmation. Keep unapproved pricing hidden.
2. Preview desktop (1440), small laptop (1024), tablet (768), and mobile (390 and 360). Check the hero/form fit, sticky header/3D section, project dialogs, FAQs, sticky mobile controls, and no horizontal scrolling. Check a logged-out view because WordPress admin bars change geometry.
3. Check privacy link, contact destinations, asset requests, console errors and one event per interaction. Verify the existing global header/footer do not appear around Canvas.
4. Before updating the published page, export its current Elementor data, page settings/template, SEO metadata and any page-specific scripts. Store this private backup outside Git. Record its page ID and current modified time; stop if someone else has changed it since the backup.
5. After review and authorization to publish, apply the reviewed template to the **existing** `/landed-home-renovation/` page. Preserve the page ID and URL. Decide its intended indexing setting; the review draft's noindex is not a campaign decision.
6. Regenerate that page's Elementor CSS, purge only relevant caches, then verify the anonymous public page and a fresh form check. A save toast does not prove the live page updated.
7. Record page ID, source commit/release, backup location, public checks and any unfinished checks in the handoff.

Rollback: restore only that page's saved content/metadata or switch its asset references back to the previous version. Do not restore a whole database over newer enquiries. Keep the previous assets until the release is accepted.

## Reference

Elementor's [page-content JSON format](https://developers.elementor.com/docs/data-structure/page-content) and [Shortcode widget](https://elementor.com/help/shortcode-widget/) describe the import structure and form rendering. The existing `elementor/INSTALL-ELEMENTOR.md` remains the manual Elementor Pro alternative, not the selected form integration for this site's current CF7 setup.

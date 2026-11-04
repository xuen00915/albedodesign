# Edit the Albedo landed-home landing page

This guide explains how to edit, preview, test, and deploy Albedo Design’s landed-home renovation page. The page uses dependency-free HTML, CSS, and JavaScript so its sections can also run inside Elementor HTML widgets.

- **Live page**: [Albedo landed-home landing page](https://xuen00915.github.io/albedodesign/)
- **Repository**: [xuen00915/albedodesign](https://github.com/xuen00915/albedodesign)
- **Audience**: designers and developers maintaining page content, media, layout, or interactions
- **Goal**: make later edits without breaking the static preview, Elementor version, accessibility, or GitHub Pages deployment

## Start editing

Run these commands from `albedo-landed-lp`:

```bash
npm install
npx playwright install chromium
npm run build:preview
python3 -m http.server 4187
```

Open `http://localhost:4187/preview/`. Keep the local server running when you run browser tests.

## Know which files to change

Edit the source files, then regenerate the preview:

- `elementor/sections/01-header.html` through `15-mobile-bar.html`: page content and section markup, in display order
- `elementor/alb-landing.css`: shared responsive styles, scoped under `.alb-lp`
- `elementor/alb-landing.js`: slider behavior, lazy loading, attribution, form handling, and analytics events
- `elementor/alb-house3d.js`: the scroll-driven 3D house in the why-us section (scene, scroll mapping, lazy three.js loading, static fallback)
- `elementor/vendor/three.min.js`: self-hosted three.js r149 used by `alb-house3d.js`; do not upgrade without re-testing the scene
- `preview/assets/`: optimized local images used by the static preview and GitHub Pages
- `scripts/build-preview.mjs`: assembles the section files and maps WordPress image URLs to local preview assets
- `scripts/build-pages.mjs`: creates the GitHub Pages artifact
- `preview/index.html`: generated review page; do not edit it directly
- `pages-dist/`: generated deployment output; do not edit or commit it
- `tests/`: structure, behavior, CSS, accessibility, and browser regression tests

Run `npm run build:preview` after changing any section. Commit the regenerated `preview/index.html` with the source change.

## Edit common page areas

Use the matching section file for each content change:

| Area | File | Keep intact |
| --- | --- | --- |
| Header and navigation | `01-header.html` | Mobile label and consultation anchor |
| Hero, form, and project slider | `02-hero.html` | Slide controls, `data-project` values, and form field names |
| Credential logo strip | `03-trust-bar.html` | Six-logo accessible group and matching `aria-hidden` duplicate group |
| 3D house and why-us points | `04-why-us.html` + `alb-house3d.js` | `data-alb-house`, `data-three-src`, the three `.alb-why__step` items and their `data-label` badges, the illustration label |
| Landed-home types | `05-property-types.html` | Links to the matching project IDs |
| Consultation offer | `07-consultation-offer.html` | Consultation call to action |
| Project showcases | `08-projects.html` | `project-terrace`, `project-semi-detached`, `project-bungalow`, and `project-shophouse` IDs |
| Reviews | `09-testimonials.html` | Approved review and rating claims only |
| Questions and answers | `12-faq.html` | Accessible question buttons and answer panels |
| Footer contacts | `14-footer.html` | Phone, WhatsApp, address, and company details |
| Mobile contact bar | `15-mobile-bar.html` | Tap target sizes and contact destinations |

## Replace an image

The Elementor snippets use WordPress media-library URLs. The static preview replaces those URLs with local optimized files through `previewAssetMap` in `scripts/build-preview.mjs`.

To replace an image:

1. Add an optimized `.webp` file to `preview/assets/`
2. Update the WordPress media URL in the relevant section file
3. Update the URL-to-file entry in `scripts/build-preview.mjs`
4. Preserve useful `alt` text and the image `width` and `height`
5. Run `npm run build:preview`
6. Check desktop and mobile crops before committing

Keep the first hero image eager and high priority. Keep later hero and below-fold project images lazy-loaded so they do not compete with the first image.

## Preserve linked project navigation

Each hero slide and property-type card points to one project showcase. Keep these values synchronized:

| Home type | Link target |
| --- | --- |
| Terrace | `#project-terrace` |
| Semi-detached | `#project-semi-detached` |
| Bungalow | `#project-bungalow` |
| Shophouse | `#project-shophouse` |

If you rename a target, update the hero slide, property card, and project card together.

## Maintain the credential strip

The credential rail contains two identical logo groups to create a seamless loop. The first group has descriptive alternative text. The duplicate group uses `aria-hidden="true"` and empty `alt` attributes so assistive technology does not announce every logo twice.

When you add, remove, or reorder a credential:

1. Make the same change in both groups
2. Keep descriptive `alt` text in the first group
3. Keep empty `alt` text in the duplicate group
4. Preserve hover and keyboard-focus pausing
5. Preserve the static horizontal fallback for reduced-motion users

## Handle forms and analytics

The static preview form does not send personal data. It validates locally, shows a success state, and pushes an `alb_lead_submit` event for quality assurance.

Production lead delivery uses the Elementor Pro Form widget or a documented fallback. Follow `elementor/INSTALL-ELEMENTOR.md` when connecting email delivery, spam protection, consent, Google Tag Manager, or Google Ads conversions.

Do not rename these form fields without updating the JavaScript, production form, analytics, and tests:

- `name`
- `phone`
- `property_type`
- `start_when`
- `pdpa_consent`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `gclid`
- `landing_page`

## Test your changes

Run the generated build and unit tests:

```bash
npm run build:pages
npm test
```

With `python3 -m http.server 4187` still running in another terminal, run the browser suite:

```bash
npm run test:browser
git diff --check
```

Before you commit, check:

- The hero and its slider controls fit within the first desktop screen
- The page has no horizontal overflow at 1440, 1024, 768, 390, or 360 pixels
- The mobile header, form, slider, and sticky contact bar remain usable
- Slider autoplay pauses on hover and focus and stops for reduced-motion users
- The credential strip loops, pauses, and shows all six logos
- Every property card opens its matching project showcase
- Phone and WhatsApp links use the approved destinations
- The browser console and network panel show no errors

## Deploy through GitHub Pages

Push an approved commit to `main`. The `Deploy GitHub Pages` workflow builds `pages-dist/` and publishes the live page automatically.

```bash
git add .
git commit -m "describe the landing-page change"
git push
```

Check the repository’s **Actions** tab before treating the deployment as complete. Then open the live page and verify the changed section.

## Use the Elementor version

The GitHub Pages build is the review and hosted static version. The production WordPress version uses the ordered HTML snippets plus the shared CSS and JavaScript.

Follow `elementor/INSTALL-ELEMENTOR.md` for widget order, global CSS placement, script loading, form configuration, tracking, and launch checks.

## Review unresolved launch content

Check `docs/placeholders.md` before a production launch. It records business details, approved claims, reviews, offers, privacy links, and other content that needs confirmation.

The design reference is `design/concept-overview.png`. The implementation inventory is `design/implementation-inventory.md`.

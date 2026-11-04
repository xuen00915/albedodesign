# Albedo Landed Home Renovation Landing Page

Dependency-free HTML, CSS, and JavaScript for Albedo Design’s landed-home renovation Google Ads landing page, plus ordered Elementor HTML-widget snippets.

## Deliverables

- preview/index.html — complete static review page.
- elementor/alb-landing.css — shared styles, fully scoped under .alb-lp.
- elementor/alb-landing.js — carousel, attribution, CTA focus, tracking, and Elementor lifecycle behavior.
- elementor/sections — 15 ordered HTML snippets.
- elementor/INSTALL-ELEMENTOR.md — production installation guide.
- docs/placeholders.md — launch-blocking business, review, pricing, privacy, claim, and asset inputs.
- design/concept-overview.png — visual rhythm reference; the supplied written build specification remains the content authority.

## Preview locally

From this directory:

    npm install
    npm run build:preview
    python3 -m http.server 4173

Open http://localhost:4173/preview/.

The preview references Albedo’s current WordPress media-library URLs, so an internet connection is required for those images. Project and accreditation slots intentionally remain labelled placeholders until Albedo supplies approved assets.

## Test

    npm test
    npm run test:browser

The unit/structure suite checks document order, field contracts, contact links, scoped CSS, carousel state, reduced-motion behavior, attribution persistence, tracking payloads, fallback-form behavior, and Elementor hooks. Browser tests add responsive overflow, console, and core-interaction checks.

## Preview form boundary

The static preview form never sends personal data. It validates locally, displays a local success message, and pushes the same alb_lead_submit dataLayer event used for QA. Production lead delivery must use the Elementor Pro Form widget (or the documented Fluent Forms/WPForms fallback) configured in elementor/INSTALL-ELEMENTOR.md.

## Rebuild rule

The static preview is assembled from the ordered files in elementor/sections:

    npm run build:preview

Run that command after editing a section snippet and commit the regenerated preview/index.html with the snippet change.

## Production checklist

Before launch:

1. Resolve every item in docs/placeholders.md.
2. Replace condo/residential imagery with approved landed-home project photography.
3. Configure the production form, email/submission actions, honeypot, and reCAPTCHA.
4. Add the real privacy-policy URL.
5. Confirm all claims, credentials, review data, response time, and any offer or urgency.
6. Configure GTM and Google Ads conversion triggers.
7. Test form delivery, WhatsApp, calls, mobile sticky actions, and consent on a real phone.
8. Run browser QA and Lighthouse against the final WordPress page.

## Source of truth

The approved design record is ../docs/superpowers/specs/2026-11-04-albedo-landed-lp-design.md. The original detailed brief was supplied at /Users/dmsyx/Downloads/albedo-landed-landing-page-spec.md on 2026-11-04.

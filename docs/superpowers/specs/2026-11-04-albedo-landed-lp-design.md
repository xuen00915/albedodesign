# Albedo Landed Home Renovation Landing Page Design

## Intent

Build a conversion-focused Google Ads landing page for Singapore homeowners planning a terrace, semi-detached, bungalow, detached, cluster-house, or shophouse renovation. The page must give visitors a credible, low-friction route to request a free consultation while remaining portable into WordPress Elementor.

## Approved source

The approved source of truth is /Users/dmsyx/Downloads/albedo-landed-landing-page-spec.md, supplied by the user on 2026-11-04. Its final copy, section order, design tokens, behavior, accessibility requirements, contact details, and placeholder rules take precedence over implementation preferences.

## Goals

- Deliver a dependency-free static browser preview.
- Deliver the same page as ordered Elementor HTML-widget snippets.
- Keep all production CSS scoped under .alb-lp.
- Keep production JavaScript vanilla ES2017, safely re-initializable in Elementor.
- Implement the carousel, CTA scrolling/focus, attribution persistence, tracking events, FAQ behavior, and static fallback form.
- Meet responsive, accessibility, performance, and SEO requirements in the supplied spec.
- Document every unresolved business, pricing, review, asset, and compliance placeholder.

## Non-goals

- Do not hand-author an Elementor JSON export.
- Do not invent testimonials, price ranges, urgency, ratings, offers, or landed-project claims.
- Do not submit the preview form to a real endpoint.
- Do not change the existing audit artifacts.
- Do not deploy, push, or configure WordPress, GTM, Google Ads, or Elementor remotely.

## Constraints

- Page runtime: plain HTML, CSS, and JavaScript with no libraries.
- Static preview location: albedo-landed-lp/preview/index.html.
- Elementor package: albedo-landed-lp/elementor.
- CSS and visible copy follow the supplied tokens and content.
- Existing Albedo media-library URLs may be referenced; unavailable landed imagery stays as clearly labelled placeholders.
- Optional pricing remains present but hidden with .alb-is-hidden.
- The current public repository is empty and the local workspace contains unrelated, untracked audit directories; implementation work is isolated under albedo-landed-lp plus project-level planning files.

## Approach

The selected approach is one canonical set of section snippets, shared CSS, and shared JavaScript, with a generated static preview assembled from the same section content. This keeps browser review and Elementor installation aligned while avoiding brittle Elementor JSON.

Alternatives rejected:

- A React/Vite application would violate the static dependency-free and Elementor HTML-widget requirements.
- A single monolithic HTML file would make Elementor installation and section maintenance error-prone.
- Hand-written Elementor JSON is explicitly described as optional and brittle by the source spec.

## Visual system

Use the exact navy, steel, orange, neutral, typography, radius, shadow, and spacing tokens from the source spec. The page alternates open white sections, pale neutral bands, and restrained navy panels. Editorial divided lists and full-width bands carry most content; cards are reserved for the hero form, testimonial quotes, comparison table, and other locations explicitly called for by the spec.

## Interaction and data flow

- Each carousel owns its current index and autoplay timer and guards duplicate initialization with data-alb-ready.
- Manual carousel actions restart autoplay; hover, focus, visibility, and reduced-motion preferences control pausing.
- CTA links to #enquire scroll with the correct motion preference and focus the Name field.
- Click tracking pushes section-aware events to window.dataLayer.
- UTM values and gclid are copied from the URL into sessionStorage and matching hidden fields.
- The static form provides an accessible local success state only; Elementor form success events generate the production lead event.

## Verification

Automated tests cover document structure, required links and form fields, scoped CSS, placeholder registration, carousel behavior, tracking, attribution, and reduced-motion behavior. Browser verification covers core interactions, console errors, responsive overflow at the required widths, screenshots, and a visual comparison against the generated concept reference.

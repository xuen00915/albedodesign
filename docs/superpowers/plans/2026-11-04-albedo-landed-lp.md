# Albedo Landed Home Renovation Landing Page Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build the approved static and Elementor-ready Albedo landed-renovation advertising landing page with tested interactions, responsive behavior, documentation, and placeholders.

**Architecture:** A canonical dependency-free HTML/CSS/JavaScript implementation lives under albedo-landed-lp. Ordered Elementor snippets reuse the same class and data-attribute contracts as the static preview, while Node-based development tests and Playwright browser checks validate the production artifacts without adding runtime dependencies.

**Tech Stack:** Semantic HTML5, scoped CSS custom properties, vanilla ES2017 JavaScript, Node test runner, jsdom for behavior tests, Playwright for local browser QA.

**Spec:** docs/superpowers/specs/2026-11-04-albedo-landed-lp-design.md and /Users/dmsyx/Downloads/albedo-landed-landing-page-spec.md

## Global Constraints

- Production output has no runtime dependencies and no jQuery dependency.
- Every CSS selector is scoped to .alb-lp, including pseudo-elements and responsive rules.
- JavaScript is an IIFE, initializes on DOMContentLoaded and Elementor frontend hooks, and guards duplicate initialization.
- Preserve the exact supplied section order, copy, contact data, token values, accessibility semantics, and image-loading rules.
- Do not invent unresolved business claims; register each bracketed placeholder in docs/placeholders.md.
- Keep the optional pricing section built but hidden with .alb-is-hidden.
- Do not modify or stage existing audit directories.

## Review Focus

- Repeated Elementor initialization must not create duplicate timers or click handlers.
- Reduced-motion users must receive no carousel autoplay, Ken Burns scaling, or entrance animation.
- Query attribution must survive reloads through sessionStorage and populate existing hidden fields only.
- All CTA, call, WhatsApp, and submit interactions must generate the correct dataLayer payload without blocking navigation.
- Layout must not overflow at 360px, and the form must remain reachable above the mobile sticky action bar.

---

### Task 1: Visual reference and test harness

**Files:**
- Create: albedo-landed-lp/design/concept-overview.png
- Create: albedo-landed-lp/package.json
- Create: albedo-landed-lp/tests/structure.test.mjs
- Create: albedo-landed-lp/tests/helpers.mjs

**Interfaces:**
- Consumes: approved content and tokens from the source spec.
- Produces: accepted visual direction, test commands, DOM-loading helpers, and initial failing structural contracts.

- [ ] Step 1: Generate a coordinated full-page concept reference that preserves the source section order, navy/orange system, editorial layout, exact first-viewport copy, and code-native controls.
- [ ] Step 2: Inspect the concept with view_image and record its container, typography, media, button, and section-rhythm decisions in the implementation inventory.
- [ ] Step 3: Add package scripts for unit, structure, and browser tests using Node, jsdom, and Playwright as development-only dependencies.
- [ ] Step 4: Write failing structure tests for the single H1, all 15 ordered sections, required form fields, correct contact links, hidden pricing section, and registered placeholders.
- [ ] Step 5: Run npm test and confirm failure because production artifacts do not exist.

### Task 2: Static document, section snippets, and scoped visual system

**Files:**
- Create: albedo-landed-lp/preview/index.html
- Create: albedo-landed-lp/elementor/alb-landing.css
- Create: albedo-landed-lp/elementor/sections/01-header.html through 15-mobile-bar.html
- Create: albedo-landed-lp/docs/placeholders.md

**Interfaces:**
- Consumes: the structural contracts and visual inventory from Task 1.
- Produces: .alb-lp markup contracts, .alb-slider controls, #enquire form fields, data tracking attributes, and the complete responsive style system.

- [ ] Step 1: Implement the smallest complete semantic markup and snippets needed to satisfy structure tests, retaining all required placeholders.
- [ ] Step 2: Add the exact scoped token block and responsive component styles, including reduced-motion, focus-visible, mobile action bar, overflow-safe comparison table, and hidden pricing utility.
- [ ] Step 3: Add tests that parse CSS selectors and fail on unscoped selector lists or missing required responsive/reduced-motion rules.
- [ ] Step 4: Run npm test and fix only contract failures until the structure and CSS suites pass.
- [ ] Step 5: Commit only the Task 1 and Task 2 project files.

### Task 3: Carousel, tracking, attribution, and form behavior

**Files:**
- Create: albedo-landed-lp/elementor/alb-landing.js
- Create: albedo-landed-lp/tests/behavior.test.mjs

**Interfaces:**
- Consumes: .alb-slider, .alb-slide, .alb-slider-segment, .alb-prev, .alb-next, #enquire, and named hidden-field markup from Task 2.
- Produces: safe initAll(root), per-slider navigation/autoplay, tracking pushes, attribution persistence, smooth CTA focus, and preview-form success behavior.

- [ ] Step 1: Write failing jsdom tests for next/previous wrapping, segment selection, aria-hidden state, caption/counter updates, and duplicate-init prevention.
- [ ] Step 2: Run behavior tests and confirm expected failures because alb-landing.js is absent.
- [ ] Step 3: Implement minimal carousel initialization and rerun tests to green.
- [ ] Step 4: Add failing tests for reduced motion, visibility pause, hover/focus pause, CTA focus, section-aware call/WhatsApp/CTA tracking, UTM persistence, and preview-form success.
- [ ] Step 5: Implement each behavior in the IIFE and rerun the complete suite after every green cycle.
- [ ] Step 6: Add Elementor frontend hook initialization and submit_success tracking with a guarded jQuery bridge.
- [ ] Step 7: Commit the tested behavior slice.

### Task 4: Installation and handoff documentation

**Files:**
- Create: albedo-landed-lp/README.md
- Create: albedo-landed-lp/elementor/INSTALL-ELEMENTOR.md

**Interfaces:**
- Consumes: final paths, field IDs, hooks, and placeholders from Tasks 2 and 3.
- Produces: local preview instructions, exact Elementor paste order, form configuration, tracking map, asset replacement steps, and launch checklist.

- [ ] Step 1: Document local preview and test commands, file map, production boundaries, and why the preview form is non-delivering.
- [ ] Step 2: Write the Elementor installation sequence from the approved spec, including form field IDs, hidden attribution fields, success/error behavior, spam controls, and custom code placement.
- [ ] Step 3: Cross-check every registered placeholder against the page and remove none without verified business input.
- [ ] Step 4: Commit documentation.

### Task 5: Browser, responsive, accessibility, and fidelity QA

**Files:**
- Create: albedo-landed-lp/tests/browser.spec.mjs
- Create during QA, then remove: temporary screenshots and reports.

**Interfaces:**
- Consumes: the complete static preview and concept reference.
- Produces: verified interactions, console-clean browser runs, responsive screenshots, and a fidelity ledger.

- [ ] Step 1: Start a local static server and open the preview in Browser/IAB first.
- [ ] Step 2: Verify carousel arrows, segments, keyboard, swipe, CTA scrolling/focus, fallback form success, and dataLayer events.
- [ ] Step 3: Run Playwright checks at 1440, 1024, 768, 390, and 360 widths for horizontal overflow, clipping, required visibility, and console errors.
- [ ] Step 4: Capture the latest 1440px and 390px implementation screenshots.
- [ ] Step 5: Inspect both the accepted concept and implementation screenshots with view_image and compare copy, layout, typography, palette, image treatment, spacing, controls, and responsive behavior.
- [ ] Step 6: Fix every material mismatch and rerun unit, structure, browser, and responsive checks.
- [ ] Step 7: Run a final git diff/status review and ensure unrelated audit files remain untouched and unstaged.

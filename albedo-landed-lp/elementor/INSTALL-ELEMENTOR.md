# Install in Elementor

## 1. Create the page

1. In WordPress, open Pages → Add New.
2. Title the page Landed Home Renovation and choose Edit with Elementor.
3. In Page Settings, set Page Layout to Elementor Canvas and hide the page title.
4. Use the final URL /landed-home-renovation/ unless the campaign owner specifies another route.

Do not add the theme header, footer, navigation menu, or unrelated links. The landing page supplies its own header and footer.

## 2. Add the shared CSS

Paste the complete contents of alb-landing.css into Elementor → Site Settings → Custom CSS. If site-wide custom CSS is unavailable, paste it into the landing page’s Advanced → Custom CSS area.

The stylesheet is scoped under .alb-lp. Do not remove that class from snippets or Elementor containers.

Inter weights 300, 400, 500, 600, and 700 are required. Use the copy already loaded by the Albedo site; configure Inter in Elementor Global Fonts only if it is not already present.

## 3. Add sections in order

For every snippet below:

1. Add a full-width Elementor Container.
2. Set Content Width to Full Width, padding to 0, and gap to 0.
3. Add an HTML widget.
4. Paste the snippet exactly.

Paste order:

1. sections/01-header.html
2. sections/02-hero.html
3. sections/03-trust-bar.html
4. sections/04-why-us.html
5. sections/05-projects.html (Real landed homes: type tabs and project detail dialogs)
6. sections/06-pricing.html
7. sections/07-consultation-offer.html
8. sections/09-testimonials.html
9. sections/10-process.html
10. sections/11-comparison.html
11. sections/12-faq.html
12. sections/13-final-cta.html
13. sections/14-footer.html
14. sections/15-mobile-bar.html

There is no 08 snippet: the former property-types and projects sections are merged into 05-projects.html.

The project detail dialogs use the native `<dialog>` element. Keep each dialog inside the 05 HTML widget so its "View project details" buttons can open it. "Get a design like this" pre-selects the matching option in the Property type field, so keep the form option labels Terrace, Semi-detached, Bungalow / detached and Shophouse.

The pricing snippet is deliberately hidden with alb-is-hidden. Remove only that class after Albedo approves every price and the GST note.

## 4. Replace the static hero form with Elementor Pro

The hero snippet includes a marked FORM SLOT and a static fallback form for browser preview. Do not use the fallback form for production lead delivery.

In the hero copy column:

1. Keep the outer form card appearance and create an Elementor Container with CSS ID enquire and CSS class alb-form-card.
2. Add a small HTML or Heading widget for Book a free consultation and the approved offer badge.
3. Add an Elementor Pro Form widget.
4. Add an HTML widget below it for the no-obligation micro-copy.
5. Keep the stats row after the form card.
6. Remove the fallback form element carrying data-alb-preview-form from the production HTML widget.

If Elementor will not place a native Form widget between parts of the HTML snippet, split 02-hero.html into HTML widgets immediately before and after the FORM SLOT and place the native form-card Container between them.

### Visible fields

| Label | Field ID | Type | Required | Options |
|---|---|---|---|---|
| Name | name | Text | Yes | Placeholder: Your name |
| Mobile / WhatsApp | phone | Tel | Yes | Placeholder: +65 8123 4567 |
| Property type | property_type | Select | No | Terrace; Corner terrace; Semi-detached; Bungalow / detached; Cluster house; Shophouse |
| Start renovation | start_when | Select | No | Within 3 months; 3–6 months; 6+ months; Just exploring |
| Consent | pdpa_consent | Acceptance | Yes | Use the approved consent copy and live privacy-policy link |

Keep visible labels. Set the paired field widths to 50% on desktop and 100% on mobile.

### Hidden fields

Add hidden fields with these exact IDs:

- utm_source
- utm_medium
- utm_campaign
- utm_term
- gclid
- landing_page, default value landed-renovation

alb-landing.js copies URL attribution into sessionStorage and populates matching hidden fields on page load and Elementor reinitialization.

### Submit and messages

- Submit text: Get My Free Consultation
- Success: Thank you! An Albedo designer will contact you within [1 working day]. Want a faster reply? WhatsApp us at 9669 9319.
- Use field-specific errors, including: Please enter your mobile number so we can reach you.

Replace the response-time placeholder only after Albedo confirms it. A dedicated /thank-you-landed/ page is preferable if the campaign uses redirect-based conversion validation.

### Actions after submit

1. Email the submission to enquiry@albedodesign.com.sg.
2. Add an AdCendes copy only if the client has approved the recipient and data handling.
3. Enable Collect Submissions.
4. Add a CRM or Google Sheet webhook only after the destination and privacy handling are approved.
5. Enable Elementor Honeypot and reCAPTCHA v3.

If Elementor Pro is unavailable, use Fluent Forms or WPForms with the same field names, visual classes, consent requirement, and hidden attribution fields. Connect its documented success hook to:

    window.dataLayer.push({
      event: "alb_lead_submit",
      property_type: "...",
      start_when: "..."
    });

## 5. Add the JavaScript

Paste alb-landing.js into Elementor → Custom Code:

- Location: Body End
- Display condition: this landing page only

Alternatively load it from the theme footer or a trusted code-snippets plugin on this page only.

The script:

- safely initializes each carousel once;
- supports arrows, progress segments, keyboard arrows, and horizontal swipe;
- pauses for hover, focus, hidden tabs, and reduced motion;
- scrolls enquiry CTAs to the form and focuses the first field;
- persists UTM values and gclid in sessionStorage;
- pushes tracking events, including alb_project_view when a project detail dialog opens;
- switches the project type tabs and opens project details;
- reinitializes Elementor HTML widgets in editor preview.

### 5a. Add the 3D house for the "See your landed home" section

The why-us snippet (`04-why-us.html`) pins a 3D house that builds itself as visitors scroll: floor plan and layout, then the furnished 3D interior, then the complete home. It needs two uploaded files and one more script.

1. Upload these files to the WordPress media library or by SFTP into `/wp-content/uploads/alb/`:
   - `elementor/vendor/three.min.js` (three.js r149, MIT licence in `elementor/vendor/three.LICENSE`)
   - `preview/assets/house-3d-complete.webp` (the still illustration shown before the 3D loads and on devices without WebGL)
2. If the files end up at different URLs, update `data-three-src` and the fallback `<img src>` in `04-why-us.html` before pasting it.
3. Add `alb-house3d.js` in Elementor → Custom Code after `alb-landing.js`, with the same Body End location and this-page-only display condition.
4. In the Container holding the why-us HTML widget, keep **Overflow: Default** and do not add Motion Effects or transforms. Overflow hidden or a transform on any parent stops the section from pinning.

The script loads three.js only after the page has finished loading and the visitor is near the section. Without JavaScript, IntersectionObserver, or WebGL, the section stays a static illustration with all three points visible. Keep the "Illustration of our 3D design process" label: the model is illustrative and not an Albedo project.

## 6. Replace assets

1. Upload approved WebP images at up to 1920px wide and no more than roughly 250 KB each.
2. Replace every labelled IMAGE placeholder with the corresponding landed-home project photo.
3. Replace the current condo/residential hero and CTA photography with landed-home work when supplied.
4. Replace trust slots with current official BCA, HDB Licensed Renovation Contractor, bizSAFE Star, ISO, and Google Reviews assets.
5. Replace the 100 × 50 pixel logo with an approved SVG or high-resolution transparent version.
6. Preserve width, height, alt, loading, and fetchpriority attributes described in the source brief.

Do not hot-link third-party imagery. Albedo-owned media-library URLs are allowed until local replacements are uploaded.

## 7. Resolve content placeholders

Use ../docs/placeholders.md as the launch gate. It includes the offer, response time, privacy URL, urgency, pricing, timing, trust marks, project assets/captions, ratings, reviews, and claim sign-offs.

Use real Google reviews only. Do not publish invented testimonials, ratings, review counts, prices, scarcity, or urgency.

After FAQ placeholders are resolved, add valid FAQPage JSON-LD for the same six visible questions and answers using Yoast, RankMath, or approved custom code.

## 8. Configure GTM and Google Ads

alb-landing.js pushes:

| Interaction | dataLayer event | Conversion |
|---|---|---|
| Successful Elementor form | alb_lead_submit | Lead – Form |
| WhatsApp link | alb_whatsapp_click | Lead – WhatsApp |
| Telephone link | alb_call_click | Lead – Call |
| #enquire CTA | alb_cta_click | Diagnostic/engagement unless the media plan says otherwise |
| Project detail dialog opened | alb_project_view (project: terrace, semi-detached, bungalow or shophouse) | Engagement only; shows which home types interest visitors |

Click events include the originating section where applicable. Form events include property_type and start_when.

In GTM:

1. Create Custom Event triggers for the required events.
2. Map them to the named Google Ads conversions.
3. Test with GTM Preview and Google Ads Tag Assistant.
4. Enable Enhanced Conversions with hashed phone data only if the account, consent setup, and privacy policy allow it.
5. Prevent duplicate Google Ads conversion firing if another form plugin or thank-you-page rule already tracks the same lead.

## 9. SEO and page settings

- Title: Landed Home Renovation Singapore | Albedo Design
- Description: Terrace, semi-D, bungalow and shophouse renovation by one trusted design & build team. 800+ projects, BCA & HDB licensed. Book a free consultation.
- Decide with AdCendes whether this Ads-only page should be noindex.
- Keep one H1 and the supplied H2/H3 hierarchy.

## 10. Pre-launch QA

Test in Chrome, Safari, and Firefox, then on a real phone:

- 1440, 1024, 768, 390, and 360px layouts have no page-level horizontal overflow.
- The header, carousel, swipe, arrows, progress controls, and keyboard arrows work.
- Reduced-motion mode has no autoplay or zoom animation.
- Every enquiry CTA lands below the sticky header and focuses Name.
- WhatsApp uses +65 9669 9319.
- Mobile call actions use +65 9669 9319; the FAQ office call uses +65 6393 2278.
- The mobile action bar does not cover form controls or footer content.
- Consent is required and the privacy link is live.
- Successful submissions arrive at every approved destination.
- dataLayer payloads appear once per interaction.
- Placeholder, review, pricing, asset, and claim gates are fully resolved.
- Lighthouse mobile meets the approved performance, accessibility, best-practices, SEO, LCP, and CLS targets.

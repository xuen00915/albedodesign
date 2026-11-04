# Implementation Inventory

## Authority

The user-supplied build specification is the content and behavior authority. The generated 1024 × 1536 concept is a visual reference for composition only. It invented navigation, price guidance, accreditation labels, project copy, and testimonials; those items must not enter production.

## Visual reference

- Concept: design/concept-overview.png
- Canvas: long desktop page with a 2:3 aspect ratio.
- Background character: true white sections alternating with #F7F8FA or #EEF2F7 bands and deep navy moments.
- Container: broad centered editorial frame; production uses the specified 1360px maximum and 24px gutters.
- First viewport: quiet header, left conversion copy/form, right dominant photography-led carousel, followed immediately by a narrow proof band.
- Typography: Inter-like sans serif, weight 600 for headings, very tight display tracking, compact readable controls, navy body hierarchy.
- Media: stable rounded frames, large photography, warm contemporary interiors, minimal overlays.
- Buttons: pill geometry, orange primary, navy or white secondary, SVG directional icons.
- Section rhythm: alternate open editorial lists, image grids, wide navy panels, neutral proof bands, table/list structures, then a cinematic closing image.

## Color lock

- True white remains #FFFFFF.
- Page neutral remains #F7F8FA; proof/testimonial neutral remains #EEF2F7.
- Heading navy remains #00325D; deep panels #00223F; footer #001A33.
- Primary orange remains #ED5930; small-text orange uses the darker accessible token.
- No cream, beige, decorative gradients, or orange color wash over photography.

## Container and component families

- Open max-width sections with generous vertical rhythm.
- Hairline-divided editorial lists for Why Us, process, and FAQ.
- Rounded media frames for carousel, project imagery, consultation panel, and final CTA.
- Cards only where the specification calls for the form, testimonial quotes, comparison table, and compact rating element.
- Comparison is a table, never a card grid.

## Typography

- Display: Inter, Arial, sans-serif; 600 weight; -0.03em to -0.035em tracking.
- Body: 16–18px at 1.6–1.65 line height, maximum readable line length near 68ch.
- Controls: deliberate 13–19px sizing and 600 weight where required; never browser-default typography.

## Allowed above-the-fold copy

- Albedo Design
- 9669 9319
- WhatsApp
- Free consultation
- Landed home renovation, crafted end to end.
- Terrace, semi-D, bungalow or shophouse. One Albedo team designs, builds and manages your renovation, and you see it in 3D before works begin.
- Book a free consultation
- Get My Free Consultation
- No obligation · Reply within [1 working day] · or WhatsApp us
- 800+ / projects completed
- 10+ / years in Singapore
- BCA · HDB / licensed & accredited

No menu, eyebrow, kicker, invented price, invented offer, or extra proof chip is allowed in the first viewport.

## Hero media treatment

The carousel photos have no color overlay. A subtle top scrim appears only behind progress controls. Captions use a separate white translucent card. The first image is eager/high priority; later images are lazy.

## Icon inventory

- Phone: 24px outline handset, round caps, currentColor.
- WhatsApp/chat: 24px outline chat bubble, round caps, currentColor.
- CTA arrow: 18–20px outline right arrow.
- Carousel chevrons: 22px outline, optically centered in 52px circular buttons.
- Check circle: 22px outline circle/check, white on navy panel.
- FAQ plus/minus: 20px outline in a compact square control.
- Stars: filled five-point SVGs, accessible grouped label.

All icons use inline SVG with viewBox, consistent 1.8–2px stroke, round linecap/linejoin, and aria-hidden unless the icon is the only control label.

## Motion

- Carousel opacity transition plus slow scale on active imagery.
- Subtle copy entrance once on load.
- Smooth CTA scroll and focus transfer.
- All autoplay, scale, entrance, and smooth scrolling are disabled or reduced under prefers-reduced-motion.

## Responsive continuation

- At 1024px the hero becomes a single column with media first.
- At 760px the desktop phone/WhatsApp actions hide, the sticky three-action mobile bar appears, and before/after media stacks.
- At 360px all grids become one column, controls remain at least 44px, the comparison table scrolls within its wrapper, and no page-level horizontal overflow occurs.

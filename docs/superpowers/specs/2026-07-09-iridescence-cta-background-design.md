# Iridescence CTA Background Design

## Goal

Add a React Bits `Iridescence` background to the landing page CTA section that starts with "Ready to reclaim your evenings?".

This change should preserve the existing landing page backgrounds and animations. The current hero `SoftAurora`, pictogram motion, section reveal animation, and overall warm FreePeriod palette stay in place.

## Approved Approach

Use a contained glow behind the CTA card.

The `Iridescence` layer should sit behind the `SpotlightCard` in the final CTA section only. It should read as a warm, moving wash of coral and mustard light around the card, not as a full-page background or a texture inside the card.

## Visual Direction

- Placement: inside the CTA section wrapper, positioned absolutely behind the card.
- Size: approximately `1080px` square, centered behind the card.
- Motion: slow and calm, using `speed={0.5}` and `mouseReact={false}`.
- Shape: softly clipped by the section, with enough blur/opacity/masking to avoid a hard square edge.
- Palette: coral and mustard influence where supported by the component API; otherwise use page overlays and opacity to harmonize the shader with the brand palette.
- Contrast: CTA card content must remain readable in light and dark mode.

## Component Integration

Use the React Bits registry item:

```bash
npx shadcn@latest add @react-bits/Iridescence-TS-TW
```

Expected dependency:

- `ogl@^1.0.11`

The component should be imported client-side only if needed. The landing page already uses dynamic imports for visual effects, so follow the existing pattern in `app/page.tsx`.

## Landing Page Changes

Target file:

- `app/page.tsx`

Target section:

- The final CTA section containing `Ready to reclaim your evenings?`

Recommended structure:

```tsx
<section className="relative z-10 mx-auto max-w-4xl overflow-hidden px-6 py-16 md:py-20">
  <div
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 h-[1080px] w-[1080px] -translate-x-1/2 -translate-y-1/2 opacity-40"
  >
    <Iridescence speed={0.5} amplitude={0} mouseReact={false} />
  </div>
  <SpotlightCard className="relative rounded-2xl border border-border bg-surface/80">
    CTA content
  </SpotlightCard>
</section>
```

The exact opacity and masking should be tuned during implementation to protect readability.

## Reduced Motion

Respect the existing `prefersReduced` state in `HomePage`.

When reduced motion is enabled:

- Do not render the animated `Iridescence` shader.
- Keep the CTA card and copy unchanged.
- A static brand-tinted radial background is acceptable only if it is subtle and does not add noise.

## Error Handling

The new background is decorative. If the component cannot render, the CTA should still function as a normal static card.

No user-facing error state is needed.

## Accessibility

- The background layer must be `aria-hidden`.
- The background must be `pointer-events-none`.
- The CTA link must remain keyboard focusable with the existing coral focus ring.
- Text contrast must remain at least WCAG AA.

## Testing

Run focused checks after implementation:

- `npm test -- app/page.test.tsx`
- `npm run build`

Manual review:

- Landing page in light mode.
- Landing page in dark mode.
- Reduced-motion behavior.
- Mobile viewport to ensure the 1080px layer does not cause horizontal scroll.

## Out Of Scope

- Replacing the existing hero `SoftAurora`.
- Adding React Bits backgrounds to pricing, auth, or app pages.
- Redesigning the CTA copy or card layout beyond the background wrapper needed for this change.

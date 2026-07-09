# Pictogram Logo — Design Spec

**Date:** 2026-07-08  
**Status:** Approved (brainstorming)  
**Scope:** Replace the inline SVG mug logo with the coloured pictogram across all brand touchpoints.

---

## Decisions Summary

| Decision | Choice |
|----------|--------|
| Header lockup | Circular pictogram + "FreePeriod" wordmark |
| Rollout scope | Full — Logo component, favicon, Apple icon, OG image |
| Asset strategy | Static PNG in `public/` + CSS circular crop |
| Coral pill wrapper | Removed |

---

## Background

The site currently uses a custom `Logo` component: a coral rounded-square pill containing an inline SVG mug, plus the "FreePeriod" wordmark. Favicon, Apple icon, and Open Graph image are green-gradient placeholders with "fp" text — not on-brand.

A new asset was added: `assets/Free Period Coloured Pictogram.png` — a clock-face + steaming mug mark in coral pink and mustard yellow, aligned with existing brand tokens.

The PNG has a solid black background. The mark itself is circular; a CSS `rounded-full` + `object-cover` crop removes the black square without requiring a transparent export for v1.

---

## Goals

1. Make the pictogram the primary brand mark across the site.
2. Replace all placeholder metadata icons with on-brand imagery.
3. Keep the existing `Logo` component API (`size`, `showText`, `className`) so consumers require no changes.
4. Document the logo in brand guidelines.

## Non-Goals

- Recreating the mark as SVG (deferred; may revisit if favicon quality is insufficient).
- Changing the hero `MugAnimation` component.
- Updating DOCX export branding.
- Providing a transparent PNG export (optional future improvement).

---

## Asset Layout

| Path | Purpose |
|------|---------|
| `assets/Free Period Coloured Pictogram.png` | Design source (unchanged) |
| `public/brand/pictogram.png` | Runtime asset served by Next.js |

Copy the source file to `public/brand/pictogram.png` at implementation time. Do not move or delete the original in `assets/`.

---

## Component: `Logo` (`components/ui/Logo.tsx`)

### Visual

- **Mark:** `<Image>` from `next/image` pointing at `/brand/pictogram.png`
- **Crop:** `rounded-full object-cover` — circular crop hides black background
- **Text:** "FreePeriod" in `font-display font-extrabold text-text-primary` (unchanged)
- **Layout:** `inline-flex items-center gap-2` (unchanged)

### Sizes

| Prop | Image size | Text class |
|------|------------|------------|
| `sm` | 28×28 px | `text-base` |
| `md` | 36×36 px | `text-xl` |
| `lg` | 48×48 px | `text-3xl` |

### Props (unchanged)

```tsx
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;  // default true
  className?: string;
}
```

### Removed

- Coral pill wrapper (`bg-coral rounded-xl`)
- Inline SVG mug paths

### Accessibility

- Image: `alt="FreePeriod"` when `showText` is false; empty alt with `aria-hidden` on mark when text is shown (text provides the label).
- Wrap in `<span>` or keep structure so existing link wrappers are unaffected.

### Consumers (no changes required)

- `app/page.tsx` — landing navbar
- `components/layout/Navbar.tsx` — app navbar
- `app/(auth)/sign-in/SignInPage.tsx`, `sign-up`, `forgot-password`, `update-password`
- `app/pricing/PricingClient.tsx`
- `components/legal/LegalDocumentShell.tsx`

---

## Metadata Icons

All generators use `ImageResponse` from `next/og` and import colors from `lib/utils/brand-colors.ts`.

### `app/icon.tsx` — 32×32 favicon

- Background: `BACKGROUND` (`#FFFBF7`)
- Pictogram: centered, circular, ~80% of canvas
- No text

### `app/apple-icon.tsx` — 180×180

- Same as favicon at larger size
- Pictogram ~75% of canvas with padding

### `app/opengraph-image.tsx` — 1200×630

- Background: `BACKGROUND`
- Pictogram: circular, ~120 px, centered horizontally, upper third
- Title: "FreePeriod" — bold serif, `TEXT_PRIMARY`, ~72 px
- Subtitle: "AI lesson planner for teachers" — `TEXT_SECONDARY`, ~28 px

**Implementation note:** `ImageResponse` cannot load local files via `<img src="/brand/...">` at build time. Read the PNG from disk using `fs.readFileSync` + base64 data URI, or place a copy in the app directory and import it. Prefer reading from `public/brand/pictogram.png` via filesystem path in the server component.

---

## Brand Guidelines Update

Add to `docs/brand-guidelines.md`:

### Logo section

- **Primary mark:** Coloured pictogram (clock + mug)
- **Lockup:** Pictogram left, "FreePeriod" wordmark right
- **Minimum clear space:** 4 px gap between mark and text (enforced by `gap-2`)
- **Do not:** Stretch non-uniformly, add drop shadows, place on busy backgrounds without contrast check
- **Asset path:** `public/brand/pictogram.png`

---

## Testing

### E2E (existing — should pass without changes)

- `tests/e2e/landing.spec.ts` — navbar logo presence
- `tests/e2e/auth.spec.ts` — logo on sign-in/sign-up
- `tests/e2e/pricing.spec.ts` — public header logo

### Manual verification

- [ ] Landing page navbar shows circular pictogram + wordmark
- [ ] Auth pages show larger lockup
- [ ] Browser tab favicon shows pictogram (not green "fp")
- [ ] `/opengraph-image` renders on-brand preview
- [ ] Light and dark mode: logo text uses `text-text-primary` correctly

### Unit tests

No new unit tests required unless `Logo.tsx` gains non-trivial logic. Optional snapshot of rendered markup if existing test patterns support it.

---

## Error Handling

- If `public/brand/pictogram.png` is missing, `next/image` will 404 — build/deploy should catch this via manual check. No runtime fallback to the old SVG (fail visibly during development).

---

## Future Improvements

1. Transparent PNG export for sharper favicon edges.
2. SVG recreation for infinite scalability.
3. `showText={false}` icon-only variant in mobile navbar (deferred — user chose full lockup for v1).

---

## Implementation Order

1. Copy asset to `public/brand/pictogram.png`
2. Update `components/ui/Logo.tsx`
3. Update `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`
4. Update `docs/brand-guidelines.md`
5. Manual + E2E verification

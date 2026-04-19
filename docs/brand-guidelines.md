# FreePeriod Brand Guidelines

> Single source of truth for colors, typography, and visual identity.

---

## Color Palette

### Primary — Coral

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| Coral 500 (primary) | `#FF8BB0` | `var(--color-coral)` | `bg-coral`, `text-coral` | CTAs, focus rings, key accents |
| Coral 300 (light) | `#FFB8D0` | `var(--color-coral-light)` | `bg-coral-light`, `text-coral-light` | Hover states, subtle tints |
| Coral 700 (dark) | `#E5709A` | `var(--color-coral-dark)` | `bg-coral-dark`, `text-coral-dark` | Active states, hover on coral bg |

### Accent — Mustard

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| Mustard 500 (accent) | `#F7C34B` | `var(--color-mustard)` | `bg-mustard`, `text-mustard` | Secondary highlights, icons on coral bg |
| Mustard 300 (light) | `#FADB8A` | `var(--color-mustard-light)` | `bg-mustard-light`, `text-mustard-light` | Soft backgrounds |
| Mustard 700 (dark) | `#D4A52E` | `var(--color-mustard-dark)` | `bg-mustard-dark`, `text-mustard-dark` | Text on light mustard bg |

### Background & Surface

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| Background | `#FFFBF7` | `var(--color-background)` | `bg-background` | Page canvas — warm white |
| Surface | `#FFFFFF` | `var(--surface)` | `bg-surface` | Cards, modals, elevated panels |
| Border | `#E5E7EB` | `var(--color-border)` | `border-border` | Dividers, card outlines |

### Typography

| Token | Light theme | Dark theme | CSS Variable | Tailwind Class |
|-------|------------|------------|-------------|----------------|
| Text primary | `#1A1A2E` | `#F0F4FF` | `var(--text-primary)` | `text-text-primary` |
| Text secondary | `#4B5563` | `#B0BEC5` | `var(--text-secondary)` | `text-text-secondary` |

### Feedback

| Token | Hex | CSS Variable | Tailwind Class | Usage |
|-------|-----|-------------|----------------|-------|
| Success | `#10B981` | `var(--color-success)` | `text-success`, `bg-success` | Confirmations, save flashes |
| Error | `#EF4444` | `var(--color-error)` | `text-error`, `bg-error` | Validation, destructive actions |

---

## Using Colors in Code

### ✅ Preferred — Tailwind utilities

```tsx
<button className="bg-coral text-white hover:bg-coral-dark">
  Get started
</button>
```

### ✅ Acceptable — CSS custom properties (non-Tailwind contexts)

```tsx
<div style={{ background: 'var(--color-coral)' }}>…</div>
```

Use for SVG `fill`/`stroke` where Tailwind classes don't apply:

```tsx
<path style={{ fill: 'var(--color-mustard)' }} />
```

### ✅ Required for non-CSS contexts — import from `lib/utils/brand-colors.ts`

Use when CSS variables are not available: `@react-pdf/renderer`, WebGL shaders (ColorBends, SoftAurora), icon metadata generators (`apple-icon.tsx`, `icon.tsx`).

```ts
import { CORAL, MUSTARD, TEXT_PRIMARY } from '@/lib/utils/brand-colors';

// In react-pdf:
const styles = StyleSheet.create({
  heading: { color: CORAL },
});

// In SoftAurora / ColorBends:
<SoftAurora color1={CORAL} color2={MUSTARD} />
```

### ❌ Never — raw hex literals in component files

```tsx
// ❌ Bad
<button style={{ background: '#FF8BB0' }}>…</button>
<path fill="#F7C34B" />
```

---

## Typography

| Role | Font | Weight | Tailwind class |
|------|------|--------|----------------|
| Display / Headings | Nunito | 700–900 | `font-display` |
| Body / UI text | Inter | 400–600 | `font-body` |

CSS variables:
- `var(--font-display)` → Nunito
- `var(--font-body)` → Inter

---

## Iconography

- Library: **Lucide React** (`lucide-react`)
- Default size: `24px` (use `h-6 w-6` Tailwind classes)
- Stroke width: `1.5px` (Lucide default)
- Color: always inherit from text color via `currentColor`

---

## Spacing & Sizing

- Minimum touch target: **44px** (use `min-h-[44px] min-w-[44px]`)
- Focus ring: `2px solid` coral — `outline-coral` Tailwind class, or `focus-visible:outline-coral`
- Border radius scale: `rounded-lg` (8px), `rounded-xl` (12px) for cards/modals

---

## Animation

- Library: **anime.js** only — never Framer Motion or GSAP
- Only animate `transform` and `opacity` (no layout properties)
- Max duration: **800ms** per animation
- Reduced motion: always check `window.matchMedia('(prefers-reduced-motion: reduce)')` before animating
- `will-change: transform` on particle elements; remove after animation

---

## Design Token Layers

The token system has three layers defined in `assets/design-tokens.json`:

1. **Primitive** — raw hex values (`#FF8BB0`, `#F7C34B`, …)
2. **Semantic** — purposeful aliases (`primary`, `accent`, `background`, `text-primary`, …)
3. **Component** — UI-role bindings (`button.primary-bg`, `card.border`, …)

CSS variables (defined in `app/globals.css` `@theme` block) map to semantic tokens:

```
--color-coral        → semantic.color.primary
--color-mustard      → semantic.color.accent
--color-background   → semantic.color.background
--color-success      → semantic.color.success
--color-error        → semantic.color.error
--text-primary       → semantic.color.text-primary
--text-secondary     → semantic.color.text-secondary
```

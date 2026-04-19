# Color Audit Report

> Audit performed on the FreePeriod codebase to identify hardcoded hex color values
> and define the remediation strategy for each occurrence.

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Resolved — uses CSS variable / Tailwind class | 3 files |
| 🔧 Remediated — migrated to CSS var or token import | 5 files |
| ⚠️ Intentional — cannot use CSS vars in this context | 4 files |

---

## Findings

### `app/globals.css` ✅ Source of Truth (No Action Required)

Defines all brand CSS custom properties. These are the **authoritative** values.

```css
/* @theme block — Tailwind v4 token registration */
--color-coral: #FF8BB0;
--color-coral-light: #FFB8D0;
--color-coral-dark: #E5709A;
--color-mustard: #F7C34B;
--color-mustard-light: #FADB8A;
--color-mustard-dark: #D4A52E;
--color-background: #FFFBF7;
--color-error: #EF4444;
--color-success: #10B981;

/* :root — semantic aliases */
--text-primary: #1A1A2E;   /* light theme */
--text-secondary: #4B5563; /* light theme */
--surface: #FFFFFF;

/* .dark — dark mode overrides */
--text-primary: #F0F4FF;
--text-secondary: #B0BEC5;
```

**Action**: No changes needed. This is the definition layer.

---

### `components/lesson/SectionCard.tsx` 🔧 Remediated

**Found**: Hardcoded hex values in an anime.js border flash animation.

```ts
// Before
animate(cardRef.current, {
  borderColor: ['#10B981', '#e5e7eb'],
  …
});
```

**Fix**: Read CSS variables at animation time via `getComputedStyle`.

```ts
// After
const root = document.documentElement;
const successColor = getComputedStyle(root).getPropertyValue('--color-success').trim() || '#10B981';
const endColor = getComputedStyle(cardRef.current).borderColor;
animate(cardRef.current, {
  borderColor: [successColor, endColor],
  …
});
```

---

### `components/animations/MugAnimation.tsx` 🔧 Remediated

**Found**: Multiple SVG presentation attributes with hardcoded hex.

```tsx
// Before — 9 occurrences
<circle fill="#FF8BB0" />
<circle fill="#F7C34B" />
<rect stroke="#FF8BB0" />
<path fill="#F7C34B" />
```

**Fix**: Replace with `style` prop using CSS custom properties.

```tsx
// After
<circle style={{ fill: 'var(--color-coral)' }} />
<rect style={{ fill: 'white', stroke: 'var(--color-coral)' }} />
<path style={{ fill: 'var(--color-mustard)' }} />
```

SVG presentation attributes (`fill=`, `stroke=`) do **not** support CSS `var()` natively,
but React inline `style` props do — and CSS variables resolve correctly.

---

### `components/ui/Logo.tsx` 🔧 Remediated

**Found**: SVG path attributes using mustard hex.

```tsx
// Before — 5 occurrences of #F7C34B
<path fill="#F7C34B" stroke="#F7C34B" />
```

**Fix**: Same inline `style` prop approach.

```tsx
<path style={{ fill: 'var(--color-mustard)', stroke: 'var(--color-mustard)' }} />
```

---

### `app/page.tsx` 🔧 Remediated

**Found two issues**:

1. Inline SVG decorative underline: `stroke="#FF8BB0"`
2. SoftAurora WebGL color props: `color1="#FF8BB0" color2="#F7C34B"`

**Fix 1**: Replace SVG attribute with style prop:

```tsx
// Before
<path stroke="#FF8BB0" … />
// After
<path style={{ stroke: 'var(--color-coral)' }} … />
```

**Fix 2**: SoftAurora uses OGL (WebGL) — it calls `hexToVec3()` to convert hex to
GPU floats. Import constants from `lib/utils/brand-colors.ts`:

```tsx
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
<SoftAurora color1={CORAL} color2={MUSTARD} … />
```

---

### `lib/export/pdf.tsx` ⚠️ Intentional — No CSS Vars Available

**Context**: `@react-pdf/renderer` generates PDFs in-memory using a custom layout
engine. It does **not** run in a browser DOM context — `getComputedStyle` and CSS
custom properties are unavailable.

**Before** (raw literals, no shared source):

```ts
const CORAL = '#FF8BB0';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B7280';
borderBottomColor: '#E5E7EB',
```

**Fix**: Import from shared constants to ensure single source of truth:

```ts
import { CORAL, TEXT_PRIMARY, TEXT_SECONDARY, BORDER } from '@/lib/utils/brand-colors';
```

---

### `components/backgrounds/SoftAurora.tsx` ⚠️ Intentional — Default Prop Values

**Found**: Default prop values `color1 = '#f7f7f7'` and `color2 = '#e100ff'`.

These are **generic fallback defaults** in the component signature, not brand colors.
They are overridden by every caller that passes explicit `color1` / `color2` props.

**Action**: No change. The component is a generic animation primitive, not a
brand-specific component. Callers (`app/page.tsx`) use `lib/utils/brand-colors.ts`.

---

### `components/backgrounds/ColorBends.jsx` ⚠️ GLSL False Positive

**Found**: `#define MAX_COLORS ${MAX_COLORS}` in a GLSL shader template literal.

This is a **GLSL preprocessor directive** — `#define` in shader code — not a hex color.
The regex matcher flagged it incorrectly.

**Action**: No change needed.

---

### `app/apple-icon.tsx` and `app/icon.tsx` ⚠️ Intentional — Server Icon Generators

**Found**:

```ts
background: 'linear-gradient(135deg, #FF8BB0 0%, #F7C34B 100%)'
```

These are Next.js image metadata files rendered on the server (Node.js process).
There is no DOM, no CSS cascade, and no CSS variables available.

**Fix**: Import from `lib/utils/brand-colors.ts`:

```ts
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
background: `linear-gradient(135deg, ${CORAL} 0%, ${MUSTARD} 100%)`
```

---

### `components/ui/SoftAurora/SoftAurora.tsx` — Non-brand Colors

**Found**: `#f7f7f7` and `#e100ff` as default props.

These are **not brand colors**. They are placeholder defaults in a generic animation
component. No change required.

---

## Files With No Action Required

| File | Reason |
|------|--------|
| `lib/utils/subjects.ts` | No color references |
| `jest.config.ts` | Test configuration |
| `playwright.config.ts` | Test configuration |
| `components/ui/Button.tsx` | Already uses Tailwind tokens only |
| `components/ui/*.tsx` (most) | Already clean |

---

## Post-Remediation Verification

Run the following PowerShell command to confirm no hardcoded brand hex values remain
in component files:

```powershell
Get-ChildItem -Recurse -Include "*.tsx","*.ts","*.jsx" `
  | Where-Object { $_.FullName -notmatch "node_modules|\.next|brand-colors\.ts|globals\.css|design-tokens\.json|COLOR_AUDIT" } `
  | ForEach-Object {
      Select-String -Path $_.FullName -Pattern '#FF8BB0|#F7C34B|#10B981|#1A1A2E|#6B7280|#E5E7EB' `
      | ForEach-Object { "$($_.Filename): $($_.Line.Trim())" }
    }
```

Expected result: **zero matches** in component files (matches only in `brand-colors.ts`,
`globals.css`, and token/doc files are expected and correct).

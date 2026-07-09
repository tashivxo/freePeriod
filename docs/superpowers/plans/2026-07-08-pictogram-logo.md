# Pictogram Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline SVG mug logo and green placeholder metadata icons with the coloured pictogram asset across all brand touchpoints.

**Architecture:** Copy the source PNG to `public/brand/pictogram.png` for runtime serving. Update the client `Logo` component to use `next/image` with circular crop. Add a small server-side helper that reads the PNG as a base64 data URI for `ImageResponse` generators (favicon, Apple icon, OG). No consumer API changes.

**Tech Stack:** Next.js 15 App Router, `next/image`, `next/og` (`ImageResponse`), Jest + Testing Library, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-07-08-pictogram-logo-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `public/brand/pictogram.png` | Create | Runtime logo asset served by Next.js |
| `lib/brand/pictogram-data-uri.ts` | Create | Read PNG from disk → base64 data URI for OG/icon generators |
| `components/ui/Logo.tsx` | Modify | Pictogram image + wordmark lockup |
| `components/ui/Logo.test.tsx` | Create | Unit tests for Logo rendering and a11y |
| `app/icon.tsx` | Modify | 32×32 favicon with pictogram |
| `app/apple-icon.tsx` | Modify | 180×180 Apple icon with pictogram |
| `app/opengraph-image.tsx` | Modify | 1200×630 social card with pictogram + wordmark |
| `docs/brand-guidelines.md` | Modify | Document logo usage rules |

**Unchanged:** All `Logo` consumers (`app/page.tsx`, `Navbar.tsx`, auth pages, pricing, legal shell).

---

### Task 1: Add brand asset

**Files:**
- Create: `public/brand/pictogram.png` (copy from source)
- Source: `assets/Free Period Coloured Pictogram.png`

- [ ] **Step 1: Create directory and copy asset**

```powershell
New-Item -ItemType Directory -Force -Path "public/brand"
Copy-Item "assets/Free Period Coloured Pictogram.png" "public/brand/pictogram.png"
```

- [ ] **Step 2: Verify file exists**

```powershell
Test-Path "public/brand/pictogram.png"
```

Expected: `True`

- [ ] **Step 3: Commit**

```bash
git add public/brand/pictogram.png
git commit -m "feat: add pictogram brand asset"
```

---

### Task 2: Pictogram data URI helper

**Files:**
- Create: `lib/brand/pictogram-data-uri.ts`
- Create: `lib/brand/pictogram-data-uri.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/brand/pictogram-data-uri.test.ts
import { getPictogramDataUri } from './pictogram-data-uri';

describe('getPictogramDataUri', () => {
  it('returns a PNG data URI', () => {
    const uri = getPictogramDataUri();
    expect(uri).toMatch(/^data:image\/png;base64,/);
    expect(uri.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/brand/pictogram-data-uri.test.ts
```

Expected: FAIL — module or function not found

- [ ] **Step 3: Implement helper**

```ts
// lib/brand/pictogram-data-uri.ts
import fs from 'fs';
import path from 'path';

let cached: string | null = null;

export function getPictogramDataUri(): string {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'public', 'brand', 'pictogram.png');
  const buffer = fs.readFileSync(filePath);
  cached = `data:image/png;base64,${buffer.toString('base64')}`;
  return cached;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- lib/brand/pictogram-data-uri.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/brand/pictogram-data-uri.ts lib/brand/pictogram-data-uri.test.ts
git commit -m "feat: add pictogram data URI helper for OG icons"
```

---

### Task 3: Update Logo component

**Files:**
- Modify: `components/ui/Logo.tsx`
- Create: `components/ui/Logo.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Logo.test.tsx
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('FreePeriod')).toBeInTheDocument();
  });

  it('renders pictogram image with correct src', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { hidden: true });
    expect(img).toHaveAttribute('src', expect.stringContaining('/brand/pictogram.png'));
  });

  it('uses accessible alt when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.getByRole('img', { name: 'FreePeriod' })).toBeInTheDocument();
  });

  it('hides decorative image from accessibility tree when showText is true', () => {
    render(<Logo showText={true} />);
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });
});
```

Note: `next/jest` transforms `next/image` to a plain `<img>`. If `getByRole('img', { hidden: true })` fails, use `document.querySelector('img')` instead.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/ui/Logo.test.tsx
```

Expected: FAIL — old SVG structure, wrong src

- [ ] **Step 3: Replace Logo implementation**

```tsx
// components/ui/Logo.tsx
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { px: 28, text: 'text-base' },
  md: { px: 36, text: 'text-xl' },
  lg: { px: 48, text: 'text-3xl' },
} as const;

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/brand/pictogram.png"
        alt={showText ? '' : 'FreePeriod'}
        aria-hidden={showText ? true : undefined}
        width={s.px}
        height={s.px}
        className="flex-shrink-0 rounded-full object-cover"
        priority={size === 'lg'}
      />

      {showText && (
        <span
          className={cn(
            'font-display font-extrabold tracking-tight text-text-primary leading-none',
            s.text
          )}
        >
          FreePeriod
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/ui/Logo.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ui/Logo.tsx components/ui/Logo.test.tsx
git commit -m "feat: replace inline SVG mug with pictogram in Logo"
```

---

### Task 4: Update favicon (`app/icon.tsx`)

**Files:**
- Modify: `app/icon.tsx`

- [ ] **Step 1: Replace placeholder implementation**

```tsx
// app/icon.tsx
import { ImageResponse } from 'next/og';
import { BACKGROUND } from '@/lib/utils/brand-colors';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const pictogram = getPictogramDataUri();
  const markSize = 26;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUND,
        }}
      >
        <img
          src={pictogram}
          width={markSize}
          height={markSize}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Verify build generates icon**

```bash
npm run build
```

Expected: Build succeeds. No errors from `app/icon.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/icon.tsx
git commit -m "feat: use pictogram for favicon"
```

---

### Task 5: Update Apple icon (`app/apple-icon.tsx`)

**Files:**
- Modify: `app/apple-icon.tsx`

- [ ] **Step 1: Replace placeholder implementation**

```tsx
// app/apple-icon.tsx
import { ImageResponse } from 'next/og';
import { BACKGROUND } from '@/lib/utils/brand-colors';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  const pictogram = getPictogramDataUri();
  const markSize = 135;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUND,
        }}
      >
        <img
          src={pictogram}
          width={markSize}
          height={markSize}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/apple-icon.tsx
git commit -m "feat: use pictogram for Apple touch icon"
```

---

### Task 6: Update Open Graph image (`app/opengraph-image.tsx`)

**Files:**
- Modify: `app/opengraph-image.tsx`

- [ ] **Step 1: Replace placeholder implementation**

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/utils/brand-colors';
import { getPictogramDataUri } from '@/lib/brand/pictogram-data-uri';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const pictogram = getPictogramDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUND,
          fontFamily: 'serif',
        }}
      >
        <img
          src={pictogram}
          width={120}
          height={120}
          style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 24 }}
        />
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            letterSpacing: '-2px',
          }}
        >
          FreePeriod
        </div>
        <div style={{ fontSize: 28, color: TEXT_SECONDARY, marginTop: 16 }}>
          AI lesson planner for teachers
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "feat: use pictogram on Open Graph image"
```

---

### Task 7: Update brand guidelines

**Files:**
- Modify: `docs/brand-guidelines.md` (insert after Color Palette section, before "Using Colors in Code")

- [ ] **Step 1: Add Logo section**

```markdown
## Logo

### Primary mark

The **coloured pictogram** (clock face + steaming mug) is the primary brand mark.

| Asset | Path |
|-------|------|
| Runtime PNG | `public/brand/pictogram.png` |
| Design source | `assets/Free Period Coloured Pictogram.png` |

### Lockup

Default header lockup: pictogram (left) + **FreePeriod** wordmark (right), rendered by `components/ui/Logo.tsx`.

- Image: circular crop (`rounded-full object-cover`)
- Text: `font-display font-extrabold text-text-primary`
- Gap: `gap-2` (8 px minimum clear space)

### Sizes

| Context | `size` prop | Image |
|---------|-------------|-------|
| Navbar, legal, pricing | `sm` | 28×28 px |
| Forgot password | `md` | 36×36 px |
| Auth sign-in/up | `lg` | 48×48 px |

### Do not

- Stretch the mark non-uniformly
- Add drop shadows to the pictogram
- Place the lockup on backgrounds without sufficient contrast
- Use the green "fp" placeholder (removed)

### Metadata icons

Favicon, Apple touch icon, and Open Graph image all use the same pictogram asset via `lib/brand/pictogram-data-uri.ts`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/brand-guidelines.md
git commit -m "docs: add pictogram logo to brand guidelines"
```

---

### Task 8: Full verification

**Files:** None (verification only)

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: All tests PASS (including new Logo and pictogram-data-uri tests)

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no icon/OG errors

- [ ] **Step 3: Run E2E smoke tests**

```bash
npm run test:e2e -- tests/e2e/landing.spec.ts tests/e2e/auth.spec.ts tests/e2e/pricing.spec.ts
```

Expected: All PASS — tests check for "FreePeriod" text presence

- [ ] **Step 4: Manual checks (dev server)**

```bash
npm run dev
```

Verify in browser:
- `/` — navbar shows circular pictogram + "FreePeriod"
- `/sign-in` — larger lockup
- Browser tab favicon is pictogram (not green "fp")
- Visit `/opengraph-image` — on-brand social card

- [ ] **Step 5: Final commit (if any fixups needed)**

Only if verification uncovered issues. Otherwise skip.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Copy asset to `public/brand/pictogram.png` | Task 1 |
| Logo component with `next/image` + circular crop | Task 3 |
| Keep `Logo` API unchanged | Task 3 |
| Favicon 32×32 | Task 4 |
| Apple icon 180×180 | Task 5 |
| OG image 1200×630 | Task 6 |
| Brand colors from `brand-colors.ts` | Tasks 4–6 |
| Brand guidelines logo section | Task 7 |
| E2E verification | Task 8 |

## Out of Scope (per spec)

- SVG recreation
- `MugAnimation` changes
- DOCX export branding
- Transparent PNG export

# Iridescence CTA Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a contained React Bits `Iridescence` glow behind the landing page CTA card ("Ready to reclaim your evenings?") without changing existing hero or app backgrounds.

**Architecture:** Install `@react-bits/Iridescence-TS-TW` via the shadcn registry, wrap it in a small client component that accepts `prefersReduced`, and mount it absolutely inside the CTA section behind the existing `SpotlightCard`. Hero `SoftAurora` and all other backgrounds stay unchanged.

**Tech Stack:** Next.js App Router, React Bits (`ogl`), shadcn CLI, Tailwind CSS, Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-09-iridescence-cta-background-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/ui/iridescence.tsx` (or CLI output path) | Create | React Bits Iridescence shader component |
| `components/backgrounds/CtaIridescenceBackground.tsx` | Create | CTA-only background wrapper with brand-tuned props |
| `app/page.tsx` | Modify | Mount background in CTA section; pass `prefersReduced` |
| `app/page.test.tsx` | Modify | Assert CTA section structure and reduced-motion behavior |
| `package.json` / `package-lock.json` | Modify | `ogl` dependency from registry install |

**Unchanged:** Hero `SoftAurora`, `HeroPictogram`, pricing/auth pages, `ColorBendsBackground` on app routes.

---

### Task 1: Install React Bits Iridescence

**Files:**
- Create: `components/ui/iridescence.tsx` (exact path confirmed by CLI)
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Add the registry component**

```bash
npx shadcn@latest add @react-bits/Iridescence-TS-TW
```

Expected: component file created under `components/` and `ogl` added to dependencies.

- [ ] **Step 2: Confirm install output**

```bash
git status --short
```

Expected: new component file(s) and updated lockfile.

- [ ] **Step 3: Read the generated component API**

Open the installed file and note the export name and supported props (`speed`, `amplitude`, `mouseReact`, color props if any).

- [ ] **Step 4: Commit**

```bash
git add components/ package.json package-lock.json
git commit -m "feat: add React Bits Iridescence component"
```

---

### Task 2: CTA background wrapper

**Files:**
- Create: `components/backgrounds/CtaIridescenceBackground.tsx`

- [ ] **Step 1: Create the wrapper**

```tsx
'use client';

import dynamic from 'next/dynamic';

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false });

interface CtaIridescenceBackgroundProps {
  prefersReduced: boolean;
}

export function CtaIridescenceBackground({ prefersReduced }: CtaIridescenceBackgroundProps) {
  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[min(1080px,140vw)] w-[min(1080px,140vw)] -translate-x-1/2 -translate-y-1/2 opacity-35 blur-[1px] dark:opacity-25"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,139,176,0.18),transparent_68%)]" />
      <Iridescence speed={0.5} amplitude={0} mouseReact={false} />
    </div>
  );
}
```

Adjust the dynamic import path if the CLI installs to a different filename (e.g. `Iridescence.tsx`).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "CtaIridescence|iridescence" -CaseSensitive:$false
```

Expected: no errors for the new files.

- [ ] **Step 3: Commit**

```bash
git add components/backgrounds/CtaIridescenceBackground.tsx
git commit -m "feat: add CTA iridescence background wrapper"
```

---

### Task 3: Wire into landing page CTA section

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add dynamic import near other effect imports**

```tsx
const CtaIridescenceBackground = dynamic(
  () =>
    import('@/components/backgrounds/CtaIridescenceBackground').then(
      (m) => m.CtaIridescenceBackground
    ),
  { ssr: false }
);
```

- [ ] **Step 2: Update the CTA section wrapper**

Replace the current CTA `<section>` opening with:

```tsx
<section className="relative z-10 mx-auto max-w-4xl overflow-hidden px-6 py-16 md:py-20">
  <CtaIridescenceBackground prefersReduced={prefersReduced} />
  <SpotlightCard className="relative rounded-2xl border border-border bg-surface/80 p-8 text-center backdrop-blur transition-colors hover:border-coral/50 md:p-12">
```

Changes from current code:
- Section gets `overflow-hidden`
- `SpotlightCard` gets `relative` and `bg-surface/80` (was `bg-surface/50`) for readability over the shader

- [ ] **Step 3: Confirm hero SoftAurora block is untouched**

The hero block starting around line 136 must remain identical.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add iridescence glow behind landing CTA"
```

---

### Task 4: Landing page tests

**Files:**
- Modify: `app/page.test.tsx`

- [ ] **Step 1: Mock the CTA background component**

Add after existing mocks:

```tsx
jest.mock('@/components/backgrounds/CtaIridescenceBackground', () => ({
  CtaIridescenceBackground: ({ prefersReduced }: { prefersReduced: boolean }) =>
    prefersReduced ? null : <div data-testid="cta-iridescence" aria-hidden="true" />,
}));
```

Also mock dynamic import if needed — if tests fail to resolve, mock `@/components/animations/HeroPictogram` and `SoftAurora` the same way existing tests already tolerate them.

- [ ] **Step 2: Add CTA section test**

```tsx
it('renders iridescence background behind CTA when motion is allowed', () => {
  render(<HomePage />);
  expect(screen.getByTestId('cta-iridescence')).toBeInTheDocument();
});

it('hides iridescence background when reduced motion is preferred', () => {
  const matchMedia = window.matchMedia as jest.Mock;
  matchMedia.mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));

  render(<HomePage />);
  expect(screen.queryByTestId('cta-iridescence')).not.toBeInTheDocument();
});
```

If `matchMedia` is not yet mocked globally, add a `beforeEach` mock in this describe block.

- [ ] **Step 3: Run tests**

```bash
npm test -- app/page.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add app/page.test.tsx
git commit -m "test: cover CTA iridescence reduced-motion behavior"
```

---

### Task 5: Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run focused test suite**

```bash
npm test -- app/page.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: PASS (no TypeScript errors).

- [ ] **Step 3: Manual review checklist**

- `/` in light mode — CTA readable, glow visible but subtle
- `/` in dark mode — CTA readable, glow not overpowering
- Reduced motion — no animated shader behind CTA
- Mobile viewport (~390px) — no horizontal scroll from 1080px layer

- [ ] **Step 4: Final commit if any tuning was needed**

```bash
git add -A
git commit -m "fix: tune CTA iridescence opacity for readability"
```

Skip if no tuning changes were required.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| CTA-only placement | Task 3 |
| Contained 1080px glow | Task 2, Task 3 |
| `speed={0.5}`, `mouseReact={false}` | Task 2 |
| Preserve hero SoftAurora | Task 3 (explicit no-touch) |
| Reduced motion support | Task 2, Task 4 |
| `aria-hidden`, `pointer-events-none` | Task 2 |
| Light/dark readability | Task 2 (`opacity`, `bg-surface/80`) |
| `npm test` + `npm run build` | Task 5 |

---

## Out Of Scope (do not implement)

- Replacing hero `SoftAurora`
- Adding Iridescence to pricing/auth/app pages
- Redesigning CTA copy or layout beyond background wrapper

# Language Picker UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove mustard hover on the landing language menu, match Settings dropdown open timing (`150ms` / `scale 0.97`), localize the picker `aria-label`, and fix Sev 1–2 UX issues on hybrid localized surfaces across EN / AR / ES / FR.

**Architecture:** Keep Radix `LanguagePicker` on landing and `AnimatedDropdown` in Settings. Defeat `focus:bg-accent` (mustard) with per-item `className` overrides via `tailwind-merge`. Retune only `DropdownMenuContent` duration/zoom utilities on the LanguagePicker instance. Reuse `settings.language` for the trigger `aria-label`. Run a four-locale UX audit on five hybrid surfaces; fix Sev 1–2 only.

**Tech Stack:** Next.js App Router, Radix DropdownMenu, Tailwind + `tw-animate-css`, existing `LocaleProvider` / `useT()`, Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-07-language-picker-ux-design.md`

**Agents:** Orchestrator Grok (`cursor-grok-4.5-high`); Implementers Composer 2.5 (`composer-2.5`); Reviewer GPT 5.6 Terra (`gpt-5.6-terra-medium`).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/ui/LanguagePicker.tsx` | Modify | Coral item hover/selected, content motion overrides, localized `aria-label` |
| `components/ui/LanguagePicker.test.tsx` | Create | Unit coverage for polish + a11y |
| `app/page.tsx` | Modify only if Sev 1–2 | Landing copy / layout from UX audit |
| `components/layout/Navbar.tsx` | Modify only if Sev 1–2 | Nav label issues |
| `app/(app)/settings/SettingsClient.tsx` | Modify only if Sev 1–2 | Settings chrome issues |
| `features/generate/components/GenerateForm.tsx` | Modify only if Sev 1–2 | Plan-language hint |
| `components/legal/MarketingFooter.tsx` | Modify only if Sev 1–2 | Footer link labels |
| `lib/i18n/messages/{en,ar,es,fr}.ts` | Modify only if Sev 1–2 | Missing/broken strings |

**Do not modify:** `components/ui/dropdown-menu.tsx`, `components/ui/animated-dropdown.tsx`, Logo mirroring.

---

### Task 1: Failing LanguagePicker tests (TDD)

**Files:**
- Create: `components/ui/LanguagePicker.test.tsx`
- Pattern: `features/generate/components/GenerationModePicker.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
import { render, screen, within } from '@/lib/test-utils';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n';

const setLocale = jest.fn();
let mockLocale: 'en' | 'ar' | 'es' | 'fr' = 'en';

jest.mock('@/providers/locale', () => {
  const messages: Record<string, Record<string, string>> = {
    en: { 'settings.language': 'Language' },
    ar: { 'settings.language': 'اللغة' },
    es: { 'settings.language': 'Idioma' },
    fr: { 'settings.language': 'Langue' },
  };
  const t = (key: string) => messages[mockLocale][key] ?? key;
  return {
    useLocale: () => ({
      locale: mockLocale,
      setLocale,
      dir: mockLocale === 'ar' ? 'rtl' : 'ltr',
      messages: {},
      t,
    }),
    useT: () => t,
  };
});

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => ({
    ref: { current: null },
    animationDisabled: true,
  }),
}));

jest.mock('@/components/ui/icons/languages', () => ({
  LanguagesIcon: () => <span data-testid="languages-icon" />,
}));

jest.mock('@/components/ui/icons/MotionSafeIcon', () => ({
  MotionSafeIcon: ({ icon: Icon, ...props }: { icon: React.ComponentType }) => (
    <Icon {...props} />
  ),
}));

describe('LanguagePicker', () => {
  beforeEach(() => {
    setLocale.mockClear();
    mockLocale = 'en';
  });

  it('uses a localized aria-label from settings.language', () => {
    mockLocale = 'ar';
    render(<LanguagePicker variant="icon" />);
    expect(screen.getByRole('button', { name: 'اللغة' })).toBeInTheDocument();
  });

  it('renders native locale names for every LOCALES entry', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    for (const code of LOCALES) {
      expect(screen.getByRole('menuitem', { name: LOCALE_LABELS[code] })).toBeInTheDocument();
    }
  });

  it('marks the selected locale with coral wash classes and a check', async () => {
    mockLocale = 'es';
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Idioma' }));
    const selected = screen.getByRole('menuitem', { name: LOCALE_LABELS.es });
    expect(selected.className).toMatch(/primary-light/);
    expect(selected.className).toMatch(/text-coral/);
    expect(within(selected).getByRole('img', { hidden: true })).toBeTruthy();
    // Prefer: expect(selected.querySelector('svg')).toBeTruthy() if Check has no role
  });

  it('does not use bg-accent / focus:bg-accent on items', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.className).not.toMatch(/bg-accent/);
      expect(item.className).toMatch(/primary-light/);
    }
  });

  it('calls setLocale once when selecting a different locale', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(screen.getByRole('menuitem', { name: LOCALE_LABELS.fr }));
    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith('fr');
  });

  it('overrides content motion to duration-150 and zoom 0.97', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    const content = document.querySelector('[data-slot="dropdown-menu-content"]');
    expect(content).toBeTruthy();
    expect(content!.className).toMatch(/duration-150/);
    expect(content!.className).toMatch(/zoom-in-\[0\.97\]/);
    expect(content!.className).toMatch(/zoom-out-\[0\.97\]/);
    expect(content!.className).not.toMatch(/duration-100/);
    expect(content!.className).not.toMatch(/zoom-in-95/);
  });
});
```

If the Check icon has no accessible role, assert with `expect(selected.querySelector('svg')).toBeTruthy()` instead of `getByRole('img')`.

For the “does not use bg-accent” test: only selected + hover overrides need `primary-light`; if unselected items only get `focus:`/`data-[highlighted]:` utilities (no resting wash), assert `not.toMatch(/bg-accent/)` on all items and `toMatch(/primary-light/)` on the selected item plus that each item’s `className` includes the focus override string `focus:bg-[var(--color-primary-light)]/20`.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npx jest --testPathPatterns="LanguagePicker.test" 2>&1 | Select-Object -Last 40
```

Expected: FAIL (aria-label still `"Language"`; missing coral / duration overrides).

- [ ] **Step 3: Commit tests**

```powershell
git add -- "components/ui/LanguagePicker.test.tsx"
git commit -m "test: add failing LanguagePicker UX polish coverage"
```

---

### Task 2: Implement LanguagePicker polish

**Files:**
- Modify: `components/ui/LanguagePicker.tsx`

- [ ] **Step 1: Wire `useT` and localized aria-label**

In `LanguagePicker.tsx`, import and call `useT` from `@/providers/locale` (alongside `useLocale`). Replace:

```tsx
aria-label="Language"
```

with:

```tsx
aria-label={t('settings.language')}
```

- [ ] **Step 2: Override DropdownMenuContent motion**

Replace the content opening with:

```tsx
<DropdownMenuContent
  align="end"
  className="min-w-[10rem] duration-150 data-open:zoom-in-[0.97] data-closed:zoom-out-[0.97]"
>
```

Do not edit `dropdown-menu.tsx`. Do not add Motion or `.t-dropdown`.

- [ ] **Step 3: Override DropdownMenuItem hover + selected styles**

On each item:

```tsx
{LOCALES.map((code) => {
  const selected = locale === code;
  return (
    <DropdownMenuItem
      key={code}
      className={cn(
        'flex min-h-[44px] items-center justify-between gap-3',
        'focus:bg-[var(--color-primary-light)]/20 focus:text-text-primary',
        'data-[highlighted]:bg-[var(--color-primary-light)]/20 data-[highlighted]:text-text-primary',
        selected && 'bg-[var(--color-primary-light)]/20 text-coral',
      )}
      onSelect={() => handleSelect(code)}
    >
      <span>{LOCALE_LABELS[code]}</span>
      {selected ? (
        <Check className="h-4 w-4 shrink-0 text-coral" aria-hidden />
      ) : null}
    </DropdownMenuItem>
  );
})}
```

Notes:
- `focus:*` defeats shared `focus:bg-accent` via `tailwind-merge`.
- Include `data-[highlighted]:*` if Radix highlights via that attribute in this version (verify in DOM; keep if present on hover).
- Do not add `bg-accent` anywhere.

- [ ] **Step 4: Run LanguagePicker tests**

```powershell
npx jest --testPathPatterns="LanguagePicker.test" 2>&1 | Select-Object -Last 30
```

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add -- "components/ui/LanguagePicker.tsx" "components/ui/LanguagePicker.test.tsx"
git commit -m "fix: coral LanguagePicker hover and Settings-like open timing"
```

---

### Task 3: Four-locale UX audit (Sev 1–2)

**Files (modify only if issues found):**
- `app/page.tsx`
- `components/layout/Navbar.tsx`
- `app/(app)/settings/SettingsClient.tsx`
- `features/generate/components/GenerateForm.tsx`
- `components/legal/MarketingFooter.tsx`
- `lib/i18n/messages/{en,ar,es,fr}.ts`

- [ ] **Step 1: Static message-key audit**

For each in-scope surface key used via `t('...')`, confirm the key exists in `en.ts`, `ar.ts`, `es.ts`, and `fr.ts` with the same shape. List any missing keys.

```powershell
# Example quick scan — adapt as needed
npx jest --testPathPatterns="locale.test" 2>&1 | Select-Object -Last 20
```

If `getMessages` / locale tests exist, keep them green. Add a small unit assertion in `providers/locale.test.tsx` or a messages test only if you find a real missing-key Sev 1.

- [ ] **Step 2: Run the severity checklist**

Per locale `en`, `ar`, `es`, `fr`, against:

1. Landing (`/`)
2. Navbar (authenticated shell)
3. Settings language row
4. Generate hint
5. MarketingFooter

Use the table in the spec (Sev 1 blocks use, Sev 2 confusing, Sev 3 polish). Record findings in the commit message or a short bullet list in the PR body — do not create a new markdown doc unless Sev 3s need a follow-up note.

- [ ] **Step 3: Fix every Sev 1–2 finding**

Examples of expected fixes (only if confirmed):
- Raw key string rendering → add/fix dictionary entry in all four locale files
- English-only control label → switch to `t('...')`
- RTL check icon not trailing → wrap Check with `ms-auto` (logical), do not use `ml-auto`/`float`
- Mustard still visible → strengthen LanguagePicker overrides (Task 2), still do not edit shared `dropdown-menu.tsx`

Log Sev 3 (truncation polish, minor RTL spacing) — do not block.

- [ ] **Step 4: Re-run related unit tests**

```powershell
npx jest --testPathPatterns="LanguagePicker.test|locale.test|SettingsClient.test|page.test|GenerateClient.test" 2>&1 | Select-Object -Last 40
```

Expected: all PASS

- [ ] **Step 5: Commit audit fixes (skip if no file changes)**

```powershell
git add -- "app/page.tsx" "components/layout/Navbar.tsx" "app/(app)/settings/SettingsClient.tsx" "features/generate/components/GenerateForm.tsx" "components/legal/MarketingFooter.tsx" "lib/i18n/messages"
git commit -m "fix: resolve Sev 1-2 hybrid locale UX issues"
```

If nothing changed after audit, skip commit and note “audit clean” in the handoff.

---

### Task 4: Visual smoke + preview redeploy

**Files:** none required (verification)

- [ ] **Step 1: Local or preview visual checks**

Confirm:
1. Landing language list hover/focus is coral wash, not mustard `#F7C34B`
2. Open/close feels like Settings (~150ms / 0.97), not stock Radix punch
3. Arabic: `dir=rtl`, check on trailing edge, Logo not mirrored
4. `aria-label` reads localized name in AR/ES/FR
5. Reduced motion: menu still usable

If `zoom-in-[0.97]` does not visually apply, fall back to the closest working override that still removes `zoom-in-95` and uses `duration-150` — document the fallback in the commit message. Do not introduce Motion or `.t-dropdown`.

- [ ] **Step 2: Push branch and redeploy preview**

```powershell
git push -u origin HEAD
npx vercel deploy --yes
```

Expected: Ready preview URL. Share with reviewers.

- [ ] **Step 3: Terra review handoff**

Dispatch GPT 5.6 Terra (`gpt-5.6-terra-medium`) to review the diff against the spec success criteria. Fix blockers only; then stop.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Coral hover override (no mustard) | Task 2 |
| Selected coral wash + check | Task 2 |
| `duration-150` + `zoom 0.97` | Task 2 |
| Localized `aria-label` via `settings.language` | Task 2 |
| Do not edit shared dropdown-menu defaults | Task 2 (explicit) |
| Four-locale hybrid UX Sev 1–2 | Task 3 |
| RTL verify-then-patch | Task 3 |
| Unit tests listed in spec | Task 1–2 |
| Preview / manual pass | Task 4 |
| Terra review | Task 4 |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-07-language-picker-ux.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh Composer 2.5 subagent per task, Grok orchestrates, Terra reviews at the end  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?

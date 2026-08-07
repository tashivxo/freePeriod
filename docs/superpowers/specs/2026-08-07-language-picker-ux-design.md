# Language Picker UX Polish Design

**Status:** Approved (brainstorming)
**Branch:** `feat/language-settings`
**Date:** 2026-08-07

## Goal

Remove the mustard/yellow hover on the landing language menu, retune its open/close feel to match Settings' `AnimatedDropdown` timing, and raise hybrid localized surfaces to strong UX-heuristic quality across EN / AR / ES / FR.

## Decisions

| Topic | Choice |
|-------|--------|
| Component strategy | Keep both: landing `LanguagePicker` (Radix `DropdownMenu`) + Settings `AnimatedDropdown` (Motion) |
| Motion | Hybrid: retune Radix's existing `animate-in`/`zoom-in` classes to match `AnimatedDropdown`'s values (`scale 0.97 → 1`, fade, `150ms` ease-out); no full transitions-dev `.t-dropdown` rewrite, no swap to Motion |
| Hover scope | `LanguagePicker`'s `DropdownMenuItem` instances only, via `className` override — do not touch `components/ui/dropdown-menu.tsx` defaults |
| UX pass scope | Full hybrid surfaces: landing header/hero/features/CTA copy, Navbar, Settings, Generate plan-language hint, MarketingFooter |
| Agents | Orchestrator: Grok; Implementers: Composer 2.5; Reviewer: GPT 5.6 Terra |

## Problem

`components/ui/LanguagePicker.tsx` renders items with the shared `DropdownMenuItem` (`components/ui/dropdown-menu.tsx`), which hardcodes `focus:bg-accent focus:text-accent-foreground`. `--accent` resolves to mustard `#F7C34B` (`app/globals.css:144`), so pointer hover/keyboard focus on the landing picker reads as yellow. `AnimatedDropdown` (Settings) instead washes items with `bg-[var(--color-primary-light)]/20` and marks the selected one `text-coral` (`components/ui/animated-dropdown.tsx:133-139`) — the two controls look and feel inconsistent, and the landing one is off-brand.

Radix's `DropdownMenuContent` already animates via `tw-animate-css` utilities baked into the shared component (`components/ui/dropdown-menu.tsx:51`):

```text
duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
```

That's a `100ms`, `0.95`-scale zoom — snappier and slightly punchier than `AnimatedDropdown`'s Motion-driven panel (`opacity 0→1`, `scale 0.97→1`, `y -4→0`, `150ms` `ease-out`, see `components/ui/animated-dropdown.tsx:99-102`).

## Design

### Landing LanguagePicker look and motion

**Item states — scoped overrides in `LanguagePicker.tsx` only, passed via `className` on each `DropdownMenuItem`**

Because `components/ui/utils.cn` uses `tailwind-merge`, a conflicting utility passed in `className` wins over the component's baked-in default for the same property+variant group — so these overrides replace `focus:bg-accent` without editing the shared component:

- Hover / keyboard focus: `focus:bg-[var(--color-primary-light)]/20 focus:text-text-primary` (defeats `focus:bg-accent`/`focus:text-accent-foreground`; matches `AnimatedDropdown`'s unselected hover, `animated-dropdown.tsx:136`).
- Selected row: apply a persistent (not just on-focus) wash + coral text, matching `AnimatedDropdown`'s selected style exactly: `bg-[var(--color-primary-light)]/20 text-coral` when `locale === code`, plus the existing `Check` icon (already `text-coral`).
- Never emit `focus:bg-accent` / mustard for these items — mustard stays reserved for the app's shared accent semantics elsewhere.

**Panel motion — retune Radix's own animate-in classes, don't fight them**

Do not replace the Radix `animate-in`/`animate-out` machinery or add Motion to this component. Override only the two utilities that differ from the `AnimatedDropdown` target, on the `DropdownMenuContent` instance's `className` (again relying on `tailwind-merge` dedup against the shared component's `duration-100`/`zoom-in-95`/`zoom-out-95`):

```tsx
<DropdownMenuContent
  align="end"
  className="min-w-[10rem] duration-150 data-open:zoom-in-[0.97] data-closed:zoom-out-[0.97]"
>
```

- `duration-150` replaces `duration-100` → matches `AnimatedDropdown`'s `150ms`.
- `zoom-in-[0.97]` / `zoom-out-[0.97]` replace `zoom-in-95` / `zoom-out-95` → matches `AnimatedDropdown`'s `scale(0.97)`.
- Leave `fade-in-0`/`fade-out-0`, `slide-in-from-*`, and `ease` timing function as-is (Radix's default easing is close enough; do not introduce `--dropdown-ease` from `.t-dropdown` — that belongs to the transitions-dev system we are explicitly not adopting here).
- `prefers-reduced-motion` is already handled globally for `animate-in`/`animate-out` via `tw-animate-css`; no extra work needed.
- Keep `align="end"`, portal, and transform-origin (`--radix-dropdown-menu-content-transform-origin`, already wired in the shared component) unchanged.

**Trigger**

- Unchanged: icon button, `hover:bg-muted`, 44×44px minimum target (icon variant) / 44px min-height (default variant), `LanguagesIcon` via `MotionSafeIcon`.
- Fix the English-only `aria-label="Language"` (`LanguagePicker.tsx:86`) — see localization fix below.

### UX heuristics across locales

**Target:** Raise hybrid chrome from roughly 6–7/10 toward 9+/10 on Nielsen heuristics for localized surfaces only (not a full-app redesign).

**Surfaces in scope**

1. Landing header + hero / features / CTA copy (`app/page.tsx`)
2. App Navbar labels (`components/layout/Navbar.tsx`)
3. Settings language row + localized strings (`app/(app)/settings/SettingsClient.tsx`)
4. Generate plan-language hint (`features/generate/components/GenerateForm.tsx:176`)
5. MarketingFooter translated links (`components/legal/MarketingFooter.tsx`)

**Localized `aria-label` fix (concrete):** `LanguagePicker`'s trigger button hardcodes the English string `aria-label="Language"`. Reuse the existing `settings.language` message key (already translated in all four `lib/i18n/messages/*.ts` files: `Language` / `اللغة` / `Idioma` / `Langue`) via `useT()` instead of adding a new key. Do not leave it English-only, and do not invent a duplicate key.

**Severity-oriented audit checklist (per locale: en, ar, es, fr)**

Run each surface in scope against this list; fix everything Sev 1–2, log Sev 3 as follow-up (do not block on it):

| Sev | Check | Example issue to look for |
|-----|-------|----------------------------|
| 1 — Blocks use | Selected locale is always visibly marked (check + wash) after a switch | Picker shows no visual confirmation after selecting a language, user re-opens to check if it "took" |
| 1 — Blocks use | No untranslated/`undefined`/raw-key text renders on any in-scope surface | Missing key falls through to `t()`'s key string, e.g. literal `settings.languageDescription` shown in AR |
| 2 — Confusing | Native language names only, no flag-only or code-only guessing | Row shows `fr` instead of `Français` |
| 2 — Confusing | `aria-label`/`aria-selected` on the picker and its options is localized, not English-only, when read by a screen reader in AR/ES/FR | Screen reader announces "Language" while UI is in Arabic |
| 2 — Confusing | No mustard/inconsistent hover between landing picker and Settings dropdown | Landing item flashes yellow, Settings item flashes coral — reads as two different controls |
| 3 — Polish | No copy truncation/overflow on narrow widths, especially FR/ES (longer strings) | `Le site web et les nouveaux plans...` clips inside a fixed-width row on mobile |
| 3 — Polish | RTL surfaces have no obviously mirrored/misaligned spacing | Icon-to-label gap collapses or double-adds in AR on the Generate hint |

**Arabic / RTL — concrete, scoped checks**

Rely on the existing `html[dir=rtl]` toggle (`providers/locale.tsx:57`); do not mirror the `Logo`. Verify, and only patch if broken:

- Check icon placement in `LanguagePicker` items: the item is `flex ... justify-between` with the label first and `Check` second — flexbox already reverses visual order under `dir=rtl`, so the check should land on the trailing (left, in RTL) edge automatically. If it doesn't, fix with `ms-auto` on the `Check` wrapper rather than hardcoding `float`/`order`.
- `DropdownMenuContent align="end"` + `data-[side=*]:slide-in-from-*`: Radix/`floating-ui` detects `dir` from computed style, so `align="end"` should already flip to the correct physical edge under RTL. Confirm visually in the AR pass; do not add a manual `dir`-conditional `align` prop unless the visual check fails.
- Generate hint (`GenerateForm.tsx:176`) and MarketingFooter links currently use logical/bidirectional-safe utilities only (`gap-x-*`, no hardcoded `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`) — confirmed by inspection, so no change expected there; re-check only if the audit surfaces a visual break.

**Copy QA:** missing keys, truncation on narrow widths (esp. FR/ES), unclear CTAs — fix Sev 1–2 in this pass; log Sev 3 (see table above).

### Non-goals

- Changing shared `DropdownMenuItem` defaults globally
- Replacing Settings' `AnimatedDropdown` with `LanguagePicker` (or the reverse)
- Full transitions-dev `.t-dropdown` rewrite for this menu, or introducing Motion into `LanguagePicker`
- Translating generate form, history, lesson editor, or legal page bodies
- Adding new locales
- Mirroring the `Logo`

## Architecture / touch points

| Area | Files |
|------|----------------|
| Picker polish | `components/ui/LanguagePicker.tsx` |
| Localized aria-label | `components/ui/LanguagePicker.tsx` (consume `useT()` + `settings.language`) |
| UX fixes (as found, Sev ≥2 only) | `app/page.tsx`, `components/layout/Navbar.tsx`, `app/(app)/settings/SettingsClient.tsx`, `features/generate/components/GenerateForm.tsx`, `components/legal/MarketingFooter.tsx`, `lib/i18n/messages/*.ts` |
| Unchanged (verify only) | `components/ui/dropdown-menu.tsx`, `components/ui/animated-dropdown.tsx` |
| Tests | `components/ui/LanguagePicker.test.tsx` (new); existing locale/Settings suites stay green |

Root cause of yellow hover (for implementers):

```text
DropdownMenuItem → focus:bg-accent → --accent (#F7C34B mustard)
```

Override only on `LanguagePicker`'s per-item `className` (see snippet above), leaving `components/ui/dropdown-menu.tsx` defaults intact for every other consumer.

## Test plan

Unit (`components/ui/LanguagePicker.test.tsx`, pattern per `features/generate/components/GenerationModePicker.test.tsx`):

- Trigger has an `aria-label` matching the localized `settings.language` string for the active locale (not the literal English word `Language` when locale is `ar`/`es`/`fr`).
- Opening the menu renders one `menuitem`/option per `LOCALES` entry with its native `LOCALE_LABELS` name (no flags, no locale codes).
- The item matching the current locale renders a `Check` icon and has `bg-[var(--color-primary-light)]/20`/coral-text classes; other items do not.
- No rendered item or the content panel carries a `bg-accent`/`focus:bg-accent`/mustard class name.
- Selecting a different item calls `setLocale` with that locale's code exactly once and closes the menu.
- `DropdownMenuContent` renders with `duration-150` and the `0.97` zoom utilities (not the shared component's `duration-100`/`95%` defaults) via className assertion.

Manual on preview:

- Cycle EN → ES → FR → AR on the landing picker; Settings language row; Generate hint; footer.
- Compare landing picker open/close feel side-by-side with a Settings `AnimatedDropdown` — should read as the same family, not identical pixel-for-pixel.
- Arabic RTL pass across all five in-scope surfaces using the checklist above.
- Reduced motion (OS setting): menu still opens/closes and remains fully operable (click/keyboard), no snapping/no console errors.

## Success criteria

1. No yellow/mustard hover or focus state anywhere in the landing language list.
2. Landing open/close motion uses `150ms` / `scale(0.97)` — the same values as `AnimatedDropdown`, not Radix's stock `100ms`/`0.95`.
3. `LanguagePicker`'s `aria-label` and any picker-adjacent copy are localized in ar/es/fr, not hardcoded English.
4. All Sev 1–2 issues found in the four-locale UX audit (table above) are fixed across the five in-scope surfaces; Sev 3s are logged, not blocking.
5. RTL checks pass on all in-scope surfaces without mirroring the `Logo`.

## Implementation agents

| Role | Model |
|------|--------|
| Orchestrator | Grok (`cursor-grok-4.5-high`) |
| Implementers | Composer 2.5 (`composer-2.5`) |
| Reviewer | GPT 5.6 Terra (`gpt-5.6-terra-medium`) |

After this spec is approved by the user, create an implementation plan via writing-plans (do not implement until the plan exists and is approved for execution).

# Language Picker UX Polish Design

**Status:** Approved (brainstorming)  
**Branch:** `feat/language-settings`  
**Date:** 2026-08-07

## Goal

Remove the mustard/yellow hover on the landing language menu, align its open feel with Settings dropdowns without unifying components, and raise hybrid localized surfaces to strong UX-heuristic quality across EN / AR / ES / FR.

## Decisions

| Topic | Choice |
|-------|--------|
| Component strategy | Keep both: landing `LanguagePicker` (Radix) + Settings `AnimatedDropdown` |
| Motion | Hybrid: Settings-like Motion timing (scale ~0.97, fade, ~150–200ms); no full transitions-dev `.t-dropdown` rewrite |
| Hover scope | LanguagePicker item overrides only — do not change global `DropdownMenuItem` accent |
| UX pass scope | Full hybrid surfaces: landing chrome + copy, Navbar, Settings, Generate hint, MarketingFooter |
| Agents | Orchestrator: Grok; Implementers: Composer 2.5; Reviewer: GPT 5.6 Terra |

## Problem

Landing `LanguagePicker` uses Radix `DropdownMenuItem` with `focus:bg-accent`. `--accent` is mustard (`#F7C34B`), so pointer hover reads as yellow. Settings language uses `AnimatedDropdown` with coral-light wash — inconsistent and off-brand for this control.

## Design

### Landing LanguagePicker look and motion

**Item states (scoped overrides on LanguagePicker items only)**

- Hover / keyboard focus: coral wash `bg-[var(--color-primary-light)]/20` with readable primary text (same family as `AnimatedDropdown` items).
- Selected: same wash + existing coral check.
- Must not apply `focus:bg-accent` / mustard on these items.

**Panel motion (minimal)**

- Keep Radix portal and `DropdownMenuContent`.
- Tune open/close toward Settings: approximately `scale(0.97 → 1)`, fade, ~150–200ms ease-out.
- Respect `prefers-reduced-motion` and zen/motion-safe patterns already used for icons.
- Keep `align="end"` for the sticky header; transform origin top-right.

**Trigger**

- Unchanged: icon button, `hover:bg-muted`, 44px minimum target, `LanguagesIcon` via MotionSafe.

### UX heuristics across locales

**Target:** Raise hybrid chrome from roughly 6–7/10 toward 9+/10 on Krug/Nielsen for localized surfaces only (not a full-app redesign).

**Surfaces in scope**

1. Landing header + hero / features / CTA copy  
2. App Navbar labels  
3. Settings (language row + localized strings)  
4. Generate plan-language hint  
5. MarketingFooter translated links  

**Pass method (per locale: en, ar, es, fr)**

- Trunk test: site, page, and language control findable without hunting.
- Don't make me think: native language names; clear current selection (check + wash); localized or clear `aria-label` for Language.
- Visibility of system status: selected locale always marked; Settings language change remains instant.
- Consistency: landing item hover matches Settings coral family; no mustard on language list.
- Recognition over recall: four options listed; no flag-only guessing.
- Minimalism: no extra copy inside the picker.
- Arabic / RTL: rely on existing `html[dir=rtl]`; fix mirrored gaps on these surfaces only (check position, dropdown align, logical spacing on hint/footer if broken). Do not mirror the Logo.
- Copy QA: missing keys, truncation on narrow widths (esp. FR/ES), unclear CTAs. Fix severity ≥2 only in this pass.

### Non-goals

- Changing shared `DropdownMenuItem` defaults globally  
- Replacing Settings language control with `LanguagePicker` (or the reverse)  
- Full transitions-dev `.t-dropdown` rewrite for this menu  
- Translating generate form, history, lesson editor, or legal page bodies  
- Adding new locales  

## Architecture / touch points

| Area | Likely files |
|------|----------------|
| Picker polish | `components/ui/LanguagePicker.tsx` |
| UX fixes (as found) | `app/page.tsx`, `components/layout/Navbar.tsx`, `SettingsClient.tsx`, Generate hint, `MarketingFooter.tsx`, `lib/i18n/messages/*` |
| Tests | LanguagePicker unit/a11y; existing locale/Settings suites stay green |

Root cause of yellow hover (for implementers):

```text
DropdownMenuItem → focus:bg-accent → --accent (#F7C34B mustard)
```

Override only on LanguagePicker item `className`, leaving `components/ui/dropdown-menu.tsx` defaults intact.

## Test plan

- Unit: LanguagePicker items do not use mustard / `bg-accent` for hover-focus; selected state shows coral wash + check.
- Manual on preview: cycle EN → ES → FR → AR on landing picker; Settings language row; Generate hint; footer; Arabic RTL on hybrid chrome.
- Reduced motion: menu still opens/closes and remains operable.

## Success criteria

1. No yellow/mustard hover on the landing language list.  
2. Landing open/close feel is in the same timing/scale family as Settings dropdowns.  
3. Hybrid surfaces are clear and usable in all four locales; severity ≥2 issues from the UX pass are fixed.  

## Implementation agents

| Role | Model |
|------|--------|
| Orchestrator | Grok (`cursor-grok-4.5-high`) |
| Implementers | Composer 2.5 (`composer-2.5`) |
| Reviewer | GPT 5.6 Terra (`gpt-5.6-terra-medium`) |

After this spec is approved by the user, create an implementation plan via writing-plans (do not implement until the plan exists and is approved for execution).

---
goal: Regional ColorBends atmosphere defaults with a Settings override
version: 1.0
date_created: 2026-10-13
last_updated: 2026-10-13
owner: Tashiv / Arham
status: 'Planned'
tags:
  - feature
  - colorbends
  - settings
  - uae
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Living implementation plan. **Do not start coding until this file’s status is changed from Planned and a kickoff is explicit.** Amend open decisions in place; bump `last_updated` and `version` on each amendment.

Authenticated app surfaces (dashboard, generate, history, settings, lesson) use ColorBends. Two atmospheres:

| Mode | User-facing label (draft) | Shader behaviour |
| --- | --- | --- |
| `brand` | FreePeriod colours | Pass `COLOR_BENDS_PALETTE` (option C: rose / peach / gold). Keep Arham’s weighted-average mix (`sumCol / sumW`, alpha once). |
| `rainbow` | Multicolour | Restore production’s empty-colors RGB-split path (independent R/G/B bands). Do not pass named `colors`. |

Defaults: `brand` in the Middle East, `rainbow` everywhere else. A Settings control next to theme and zen overrides the default and persists. Zen mode still hides ColorBends entirely. Light/dark still only changes `COLOR_BENDS_INTENSITY`.

Current branch this plan assumes: `colorBends_rework_branch` (palette C + Arham mix from PR #32, `c427e48`). Empty-colors GLSL currently renders transparent (`col = vec3(0.0); a = 0.0`) in `components/ui/backgrounds/ColorBends.jsx` around L78–80. `rainbow` requires restoring the old RGB else-branch.

## 1. Requirements & Constraints

- **REQ-001**: Two atmosphere modes only: `brand` and `rainbow`. No third “auto” value in the persisted override; auto is the absence of an override.
- **REQ-002**: Middle East users default to `brand` until they pick otherwise.
- **REQ-003**: Non-Middle-East users default to `rainbow` until they pick otherwise.
- **REQ-004**: Settings exposes a dropdown (same `AnimatedDropdown` pattern as language) for atmosphere, in the same card stack as `ThemeToggle` and the zen switch in `app/(app)/settings/SettingsClient.tsx` (theme ~L187, zen ~L190–212, language ~L214).
- **REQ-005**: An explicit Settings choice always wins over the regional default.
- **REQ-006**: Zen mode (`fp-zen-mode` in `providers/zen-mode.tsx`) continues to unmount ColorBends. Atmosphere has no effect while zen is on.
- **REQ-007**: Theme remains independent. Light intensity `1`, dark intensity `0.45` from `COLOR_BENDS_INTENSITY` in `lib/utils/brand-colors.ts`.
- **REQ-008**: `brand` keeps Arham’s mix. `rainbow` uses the restored RGB-split else-branch, not named palette stops.
- **REQ-009**: ColorBends stays on the authenticated app shell only (`app/(app)/layout.tsx`). Auth Waves and marketing Iridescence / SoftAurora are out of scope.
- **REQ-010**: User-facing copy has no em dashes. Draft English: “Background”, “FreePeriod colours”, “Multicolour”, helper “Warm coral and gold, or the original multicolour bands.”
- **REQ-011**: Add matching keys in `lib/i18n/messages/{en,ar,es,fr,zh-Hans}.ts` so `Messages` stays aligned.
- **SEC-001**: Do not use IP geolocation in v1 unless OPEN-DEC-001 is amended. No new third-party geo API.
- **SEC-002**: Persist only `brand` | `rainbow` | unset. No PII in the atmosphere key.
- **CON-001**: Do not change motion uniforms (speed, warp, mouse, parallax, grain, bandWidth) except what restoring the RGB else-branch requires.
- **CON-002**: Prefer-reduced-motion still skips ColorBends (`ColorBendsWrapper.tsx` L34).
- **GUD-001**: Labels in UI and copy say “FreePeriod colours” / “Multicolour”, never “Arham” or “pride”.
- **GUD-002**: Code identifiers use `brand` / `rainbow` (or `COLOR_BENDS_ATMOSPHERE`), never `arham`.
- **PAT-001**: Mirror zen/theme: a client provider + `localStorage` key, consumed by `ColorBendsBackground`.
- **PAT-002**: Settings row layout matches zen: icon + label + description + control in a bordered `bg-background` card.
- **OPEN-DEC-001**: How to detect Middle East for the default. **Current draft:** treat `default_curriculum` in `('UAE MOE', 'ADEK (Abu Dhabi)')` as ME. Do not use IP. Arabic locale alone is not enough. Broader GCC curricula can be added here later.
- **OPEN-DEC-002**: Persistence. **Current draft:** `localStorage` key `fp-color-bends-atmosphere` with values `brand` | `rainbow`, same as zen. Cross-device sync (users column) is a later amendment.
- **OPEN-DEC-003**: Signed-out / no-curriculum users. **Current draft:** default `rainbow` (non-ME).
- **OPEN-DEC-004**: Exact ME membership list (UAE only vs GCC). **Current draft:** UAE MOE + ADEK only.
- **OPEN-DEC-005**: Whether `rainbow` must pixel-match production’s pre-rework GLSL else-branch. **Current draft:** yes, restore that branch under `uColorCount == 0`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Lock types, storage key, and regional default helper with no UI yet.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add `export type ColorBendsAtmosphere = 'brand' \| 'rainbow'` and `COLOR_BENDS_ATMOSPHERE_STORAGE_KEY = 'fp-color-bends-atmosphere'` next to the palettes in `lib/utils/brand-colors.ts`. | | |
| TASK-002 | Add `isMiddleEastAtmosphereDefault(curriculum: string \| null): boolean` in `lib/utils/brand-colors.ts` (or `lib/utils/color-bends-atmosphere.ts` if the file would otherwise mix concerns). Return true only for `'UAE MOE'` and `'ADEK (Abu Dhabi)'` until OPEN-DEC-001/004 change. | | |
| TASK-003 | Add `resolveColorBendsAtmosphere({ override, curriculum }: { override: ColorBendsAtmosphere \| null; curriculum: string \| null }): ColorBendsAtmosphere`. If `override` is `brand` or `rainbow`, return it. Else return `brand` when TASK-002 is true, otherwise `rainbow`. | | |
| TASK-004 | Unit-test TASK-002 and TASK-003 in `tests/unit/lib/utils/brand-colors.color-bends.test.ts` (or a sibling `color-bends-atmosphere.test.ts`): UAE MOE → brand, ADEK → brand, GCSE/null/custom → rainbow, override always wins. | | |

### Implementation Phase 2

- GOAL-002: Restore the production rainbow GLSL path behind empty `colors`.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | In `components/ui/backgrounds/ColorBends.jsx`, replace the empty-colors else-branch (currently L78–80 transparent black) with the production RGB-split loop (the `col[k]` / `uBandWidth` path removed in `b586e1f`). Keep `uColorCount > 0` on Arham’s weighted-average mix. | | |
| TASK-006 | Update `tests/unit/components/ui/backgrounds/ColorBends.empty-colors.test.ts`: empty-colors branch must contain the RGB-split markers (`col[k]`), not `col = vec3(0.0)` / `a = 0.0`. Add a source assertion that the `uColorCount > 0` branch still has `sumCol / max(sumW`. | | |

### Implementation Phase 3

- GOAL-003: Client provider and ColorBends wiring.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Add `providers/color-bends-atmosphere.tsx` mirroring `providers/zen-mode.tsx`: read/write `fp-color-bends-atmosphere`, expose `{ atmosphere, setAtmosphere, resolvedAtmosphere }`. `atmosphere` is the override (`null` = follow default). `resolvedAtmosphere` uses TASK-003 plus `default_curriculum` from the signed-in user. | | |
| TASK-008 | Pass curriculum into the provider from `app/(app)/layout.tsx` (or a thin client wrapper). If layout stays server-first, load `default_curriculum` the same way `app/(app)/generate/page.tsx` already selects it (~L28). | | |
| TASK-009 | Wrap the app tree in `app/layout.tsx` next to `ThemeProvider` / `ZenModeProvider` (~L105–108). | | |
| TASK-010 | In `components/ui/backgrounds/ColorBendsWrapper.tsx`, when `resolvedAtmosphere === 'brand'` pass `colors={[...COLOR_BENDS_PALETTE]}`; when `'rainbow'` pass `colors={[]}` (or omit). Keep theme intensity and zen/reduced-motion early return. | | |
| TASK-011 | Extend `tests/unit/components/ui/backgrounds/ColorBendsWrapper.test.tsx`: brand passes palette, rainbow passes empty array, zen still renders nothing. Mock the new provider. | | |

### Implementation Phase 4

- GOAL-004: Settings dropdown and copy.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | In `SettingsClient.tsx`, add a card under the zen row (~after L212) with `AnimatedDropdown` options `brand` / `rainbow`. Selecting a value calls `setAtmosphere`. Include a “Use regional default” action that sets override to `null` **only if** we keep that in the UI; otherwise omit until amended (OPEN-DEC: no reset control in v1). | | |
| TASK-013 | Add `settings.background`, `settings.backgroundDescription`, `settings.backgroundBrand`, `settings.backgroundRainbow` to `lib/i18n/messages/en.ts` and the same keys in `ar.ts`, `es.ts`, `fr.ts`, `zh-Hans.ts`. | | |
| TASK-014 | Extend `tests/unit/app/(app)/settings/SettingsClient.test.tsx` like the zen tests (~L242): changing the dropdown calls `setAtmosphere('brand' \| 'rainbow')`. | | |
| TASK-015 | Confirm `lib/i18n/messages.test.ts` (or equivalent) still type-checks all locales against `Messages`. | | |

### Implementation Phase 5

- GOAL-005: Browser check and stop.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Manual: `/settings` dropdown, `/dashboard` and `/generate` in light and dark, zen on/off, reduced-motion. ME-default: user with UAE MOE and no override sees brand. Non-ME: rainbow. Override persists across reload via `localStorage`. | | |
| TASK-017 | Do not merge to `main` from this plan. Stay on `colorBends_rework_branch` until a later kickoff. | | |

## 3. Alternatives

- **ALT-001**: IP geolocation for ME default. Rejected for v1 (VPN, travel, extra vendor). Reopen via OPEN-DEC-001.
- **ALT-002**: Default everyone to `brand` and only offer rainbow in Settings. Simpler, but contradicts the agreed regional default.
- **ALT-003**: Two shaders / two components. Rejected: one `ColorBends.jsx` with `uColorCount > 0` vs else is enough.
- **ALT-004**: Persist on `users` in v1. Rejected until OPEN-DEC-002 changes; zen/theme already localStorage-only.
- **ALT-005**: Toggle instead of dropdown. Rejected: two named atmospheres plus later “regional default” fits a dropdown like language.
- **ALT-006**: Geo-split Arham’s mix vs production mix. Rejected: mix stays on `brand`; rainbow is the empty-colors RGB path.

## 4. Dependencies

- **DEP-001**: `colorBends_rework_branch` including `c427e48` (Arham mix) and palette C.
- **DEP-002**: `AnimatedDropdown` in `components/ui/animated-dropdown.tsx`.
- **DEP-003**: `default_curriculum` on `public.users` (`lib/supabase/schema.sql`).
- **DEP-004**: No new npm packages.

## 5. Files

- **FILE-001**: `lib/utils/brand-colors.ts` (types, ME helper, resolve helper) and/or `lib/utils/color-bends-atmosphere.ts`
- **FILE-002**: `components/ui/backgrounds/ColorBends.jsx` (restore RGB else-branch)
- **FILE-003**: `components/ui/backgrounds/ColorBendsWrapper.tsx` (pass colors from resolved atmosphere)
- **FILE-004**: `providers/color-bends-atmosphere.tsx` (new)
- **FILE-005**: `app/layout.tsx` (provider)
- **FILE-006**: `app/(app)/layout.tsx` (curriculum into provider if needed)
- **FILE-007**: `app/(app)/settings/SettingsClient.tsx` (dropdown card)
- **FILE-008**: `lib/i18n/messages/en.ts`, `ar.ts`, `es.ts`, `fr.ts`, `zh-Hans.ts`
- **FILE-009**: `tests/unit/lib/utils/brand-colors.color-bends.test.ts` (or new sibling)
- **FILE-010**: `tests/unit/components/ui/backgrounds/ColorBends.empty-colors.test.ts`
- **FILE-011**: `tests/unit/components/ui/backgrounds/ColorBendsWrapper.test.tsx`
- **FILE-012**: `tests/unit/app/(app)/settings/SettingsClient.test.tsx`
- **FILE-013**: `tests/unit/providers/color-bends-atmosphere.test.tsx` (new, if provider logic is non-trivial)

## 6. Testing

- **TEST-001**: `isMiddleEastAtmosphereDefault` true only for UAE MOE and ADEK (Abu Dhabi).
- **TEST-002**: `resolveColorBendsAtmosphere` override wins; else ME → brand, else rainbow.
- **TEST-003**: ColorBends GLSL: named-colors path still averages; empty-colors path RGB-splits.
- **TEST-004**: Wrapper passes palette vs `[]` from resolved atmosphere; zen still empty DOM.
- **TEST-005**: Settings dropdown calls `setAtmosphere`.
- **TEST-006**: All five locale message objects include the new keys.
- **TEST-007**: Manual browser pass in TASK-016.

## 7. Risks & Assumptions

- **RISK-001**: Restoring RGB-split reintroduces rainbow on every non-ME session, including screenshots and a UAE teacher whose curriculum is unset or who is on a non-UAE preset.
- **RISK-002**: Curriculum is a weak proxy for “lives in the ME” (British curriculum in Dubai would get rainbow under OPEN-DEC-001 as drafted).
- **RISK-003**: localStorage override does not follow the user across browsers/devices.
- **RISK-004**: Empty-colors tests today lock transparent black; TASK-006 must invert that contract on purpose.
- **ASSUMPTION-001**: ColorBends is the only pride-adjacent background in the app shell. Marketing/auth stay unchanged.
- **ASSUMPTION-002**: Option C remains `COLOR_BENDS_DEFAULT_OPTION` for `brand`.
- **ASSUMPTION-003**: No implementation work starts while `status` is `Planned`.

## 8. Related Specifications / Further Reading

- Git history: `b586e1f` palette C + fail-closed empty colors; `c03a675` `colors: string[]`; `c427e48` / [PR #32](https://github.com/tashivxo/freePeriod/pull/32) weighted-average mix
- `components/ui/backgrounds/ColorBends.jsx` fragment shader (`uColorCount` branch vs else)
- `components/ui/backgrounds/ColorBendsWrapper.tsx`
- `lib/utils/brand-colors.ts` (`COLOR_BENDS_PALETTES`, `COLOR_BENDS_INTENSITY`)
- `app/(app)/settings/SettingsClient.tsx` theme + zen + language stack
- `providers/zen-mode.tsx`, `providers/theme.tsx`
- `lib/utils/curricula.ts` (`UAE MOE`, `ADEK (Abu Dhabi)`)
- docs/brand-guidelines.md
- docs/superpowers/specs/2026-07-11-zen-mode-design.md

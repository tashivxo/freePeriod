---
goal: Regional ColorBends atmosphere defaults with a Settings override
version: 1.3
date_created: 2026-10-13
last_updated: 2026-10-14
owner: Tashiv / Arham
status: 'In Progress'
tags:
  - feature
  - colorbends
  - settings
  - onboarding
  - uae
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In_Progress-yellow)

Living implementation plan. Kickoff: 2026-10-14 on `background_color_implementation`. Amend open decisions in place; bump `last_updated` and `version` on each amendment.

**v1.3** folds the GPT 5.6 Luna review (2026-10-13): authenticated-shell provider only, cookie locale as the Arabic signal, zen-style hydration, `schema.sql` + migration dual-write, four-step onboarding test checklist, native radio tiles, and exact RGB-split invariants. See **§11 Architecture**.

Authenticated app surfaces (dashboard, generate, history, settings, lesson) use ColorBends. Two atmospheres:

| Mode | User-facing label (draft) | Shader behaviour |
| --- | --- | --- |
| `brand` | FreePeriod colours | Pass `COLOR_BENDS_PALETTE` (option C: rose / peach / gold). Keep Arham’s weighted-average mix (`sumCol / sumW`, alpha once). |
| `rainbow` | Multicolour | Restore the pre-`b586e1f` empty-colors RGB-split loop (independent R/G/B bands). Do not pass named `colors`. |

Defaults: `brand` when **any** Middle East signal is true, `rainbow` otherwise. Signals are OR’d, never AND’d: onboarding/Settings **country** in the locked ME list, **or** a Middle East **curriculum**, **or** the **visible** locale is Arabic (`fp-locale` / `useLocale().locale`). An explicit Settings background choice still wins and is **sticky** (no reset-to-auto UI in v1). Settings shows **two preview tiles** in the appearance stack. Zen still hides ColorBends. Light/dark still only changes `COLOR_BENDS_INTENSITY`. See **§9 Settings surface**, **§10 ME detection**, **§11 Architecture**.

Current branch this plan assumes: `colorBends_rework_branch` (palette C + Arham mix from PR #32, `c427e48`). Empty-colors GLSL currently renders transparent (`col = vec3(0.0); a = 0.0`) in `components/ui/backgrounds/ColorBends.jsx` around L78–80. `rainbow` requires restoring the old RGB else-branch from `b586e1f^`.

## 1. Requirements & Constraints

- **REQ-001**: Two atmosphere modes only: `brand` and `rainbow`. No third “auto” value in the persisted override; auto is the absence of an override.
- **REQ-002**: Default `brand` when `isMiddleEastAtmosphereDefault` is true (any ME signal), until they pick a background in Settings.
- **REQ-003**: Default `rainbow` when no ME signal is true.
- **REQ-012**: Collect **country** at onboarding (new step) and persist `users.country` as ISO 3166-1 alpha-2, uppercase. Same field editable in Settings teaching defaults. Do not infer country from IP. App validates against `COUNTRY_ITEMS`. DB allows `NULL` or `^[A-Z]{2}$` (not a full ISO enum). Dual-write: `lib/supabase/schema.sql` **and** `supabase/migrations/009_users_country.sql`.
- **REQ-013**: Do **not** store a `me` / `is_middle_east` column. Derive it every time from country, curriculum, and **visible locale**. Profile edits re-default **only while override is null**. After a tile tap, the override stays until `fp-color-bends-atmosphere` is cleared (no reset control in v1).
- **REQ-004**: Settings exposes two visible preview tiles (`brand` / `rainbow`) in the appearance stack of `SettingsClient.tsx`, **after the zen card (~L190–212) and before language (~L214)**. Native `<input type="radio">` styled as tiles. Instant apply, no Save. Full layout in §9.
- **REQ-005**: An explicit Settings choice always wins over the regional default.
- **REQ-006**: Zen mode (`fp-zen-mode` in `providers/zen-mode.tsx`) continues to unmount ColorBends. Atmosphere has no effect while zen is on.
- **REQ-007**: Theme remains independent. Light intensity `1`, dark intensity `0.45` from `COLOR_BENDS_INTENSITY` in `lib/utils/brand-colors.ts`.
- **REQ-008**: `brand` keeps Arham’s mix and the current `gl_FragColor = vec4(col * a, …)` path. `rainbow` restores the pre-rework `uColorCount == 0` RGB-split loop (three-band `col[k]`, `uBandWidth`, alpha from max RGB). It must not keep the transparent-black fallback.
- **REQ-009**: ColorBends stays on the authenticated app shell only (`app/(app)/layout.tsx`). Auth Waves and marketing Iridescence / SoftAurora are out of scope.
- **REQ-010**: User-facing copy has no em dashes. Locked English draft in §9.4. Short labels only. No “Arham”, “pride”, “shader”, or “palette C”.
- **REQ-011**: Add matching keys in `lib/i18n/messages/{en,ar,es,fr,zh-Hans}.ts` so `Messages` stays aligned. Country **display names** stay English exonyms in v1 (OPEN-DEC-007).
- **REQ-014**: `ColorBendsAtmosphereProvider` mounts **only** in `app/(app)/layout.tsx`, wrapping `ColorBendsBackground` **and** app children. Do **not** mount it in root `app/layout.tsx` (that layout has no profile row and must not grow an auth query for marketing/auth routes).
- **REQ-015**: The Arabic ME signal is the **visible** locale: `useLocale().locale === 'ar'`, seeded from the `fp-locale` cookie (`app/layout.tsx` `readLocaleCookie`, `providers/locale.tsx`). Do **not** read `users.preferred_locale` for atmosphere. `preferred_locale` remains Settings persistence for the language picker only. Today Settings is the only place that copies `preferred_locale` into `setLocale` (`SettingsClient.tsx` ~L90–94); atmosphere must follow the screen, not a stale DB value.
- **REQ-016**: First paint mirrors zen. SSR/first client render uses server profile signals + cookie locale + `override = null`. Read `fp-color-bends-atmosphere` in `useEffect` (same as `providers/zen-mode.tsx` ~L16–28). A short flash of the regional default before a stored override applies is **accepted**. No extra bootstrap script. Invalid storage values (`not brand|rainbow`) → treat as null.
- **REQ-017**: After a successful teaching-defaults save, call `setProfileSignals({ country, curriculum })` on the atmosphere provider. Do not wait for `router.refresh()`. Do not load profile from `app/(app)/generate/page.tsx` (it does not select `country` and cannot feed the shell).
- **SEC-001**: Do not use IP geolocation. Country is self-reported. No geo vendor.
- **SEC-002**: Persist only `brand` | `rainbow` | unset in localStorage. No country, locale, or other profile data in that key.
- **SEC-003**: `users.country` is self-reported location profile data (not precise geolocation). It follows the existing users-row retention/deletion path. TASK-022 reviews privacy copy.
- **CON-001**: Do not change motion uniforms (speed, warp, mouse, parallax, grain, bandWidth) except what restoring the RGB else-branch requires.
- **CON-002**: Prefer-reduced-motion still skips ColorBends (`ColorBendsWrapper.tsx` L34).
- **GUD-001**: Labels in UI and copy say “FreePeriod colours” / “Multicolour”, never “Arham” or “pride”.
- **GUD-002**: Code identifiers use `brand` / `rainbow` (or `COLOR_BENDS_ATMOSPHERE`), never `arham`.
- **PAT-001**: Mirror zen/theme: a client provider + `localStorage` key, consumed by `ColorBendsBackground`. Profile signals are props + `setProfileSignals`, not a second storage key.
- **PAT-002**: Outer card matches zen/language (`rounded-xl border border-border bg-background p-4`, icon + label + one-line description). Inner control is a two-column native radiogroup of preview tiles, not a switch and not a dropdown.
- **PAT-003**: Selected tile uses the existing coral focus language (`border-coral` + `ring-2 ring-coral/20`), 44px min hit area, `font-body`. Instant apply like zen (`setAtmosphere` on click, no Save Settings). When zen is on, radios are actually `disabled` (not `aria-disabled` only).
- **OPEN-DEC-001**: How to detect Middle East. **Resolved in 1.2/1.3:** OR of country, curriculum, visible `ar`. Lists in §10.1. Do not use IP.
- **OPEN-DEC-002**: Persistence of the *override*. **Current draft:** `localStorage` key `fp-color-bends-atmosphere` with values `brand` | `rainbow`, same as zen. Cross-device sync of the override is a later amendment. Country itself lives on `users.country`.
- **OPEN-DEC-003**: No signals. **Resolved in 1.2:** missing country, non-ME curriculum, and locale not `ar` → `rainbow`. Signed-out routes have no ColorBends (REQ-009).
- **OPEN-DEC-004**: Exact ME membership. **Resolved in 1.2:** locked ISO and curriculum lists in §10.1. Maghreb (MA, DZ, TN, LY) and IL / TR / CY are out until amended.
- **OPEN-DEC-005**: Rainbow GLSL. **Resolved in 1.3:** restore the exact empty-colors loop from `b586e1f^` under `uColorCount == 0` / empty `colors`. Keep Arham’s mix + single alpha multiply on the named-colors branch. Source tests must assert three-band `col[k]`, `uBandWidth`, alpha from max RGB, and **absence** of `col = vec3(0.0)` / `a = 0.0`. Manual visual check on `/dashboard` before merge.
- **OPEN-DEC-006**: Mini previews are **static CSS gradients**, not extra WebGL canvases. The live ColorBends behind the Settings sheet is the real preview. Amend only if tiles feel too abstract.
- **OPEN-DEC-007**: Country names in non-English Settings. **Resolved in 1.3:** English exonyms in v1 (onboarding is already English-only). Localized country names are a later amendment.
- **OPEN-DEC-008**: Reset to regional default. **Resolved in 1.3:** no UI. Override is sticky. Clearing site data / that localStorage key is the only reset. Do not imply that tile-tappers still follow country/language edits.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Lock types, storage key, country list, schema, and regional default helper with no UI yet.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add `export type ColorBendsAtmosphere = 'brand' \| 'rainbow'` and `COLOR_BENDS_ATMOSPHERE_STORAGE_KEY = 'fp-color-bends-atmosphere'` next to the palettes in `lib/utils/brand-colors.ts`. | Yes | 2026-10-14 |
| TASK-002 | Add `isMiddleEastAtmosphereDefault({ country, curriculum, locale })` in `lib/utils/color-bends-atmosphere.ts` (keep palettes in `brand-colors.ts`). True if uppercase country ∈ `MIDDLE_EAST_COUNTRY_CODES` **or** curriculum ∈ `MIDDLE_EAST_CURRICULA` **or** locale is `'ar'`. Lists in §10.1. | Yes | 2026-10-14 |
| TASK-003 | Add `resolveColorBendsAtmosphere({ override, country, curriculum, locale })`. If `override` is `brand` or `rainbow`, return it. Else return `brand` when TASK-002 is true, otherwise `rainbow`. | Yes | 2026-10-14 |
| TASK-004 | Unit-test TASK-002/003: each signal alone → brand (AE + GCSE + en; null + UAE MOE + en; GB + GCSE + ar); all false → rainbow; override always wins; nulls → rainbow; lowercase `ae` still matches. | Yes | 2026-10-14 |
| TASK-018 | Add `lib/utils/countries.ts`: ISO 3166-1 alpha-2 list with English names, `COUNTRY_ITEMS` for the picker (`value` = code, `name` = English), a **common** group list from §10.3, plus `MIDDLE_EAST_COUNTRY_CODES` from §10.1. No npm geo package. | Yes | 2026-10-14 |
| TASK-019 | Dual-write country: add `country text` to `lib/supabase/schema.sql` on `public.users`, **and** `supabase/migrations/009_users_country.sql` (`add column if not exists`, check `country is null or country ~ '^[A-Z]{2}$'`). `User.country: string \| null` in `types/database.ts`. App uppercases before write. Existing rows stay null. | Yes | 2026-10-14 |

### Implementation Phase 1b

- GOAL-001b: Country on onboarding and Settings. Self-reported, not IP.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Onboarding four-step migration. Insert required **Where do you teach?** between grade and curriculum. Copy in §10.3. Native `<select>` with `<optgroup>` Common then A–Z (not `AnimatedDropdown`). Persist uppercase `country` on the existing users upsert. Rewrite `OnboardingPage.test.tsx` for 4 steps: progress `aria-valuemax=4` and “Step n of 4”, every navigation fixture selects a country before curriculum, Back from curriculum lands on country, Next disabled without country, finish upsert includes `country`, custom-curriculum / error / finish-status / dashboard-link cases still pass. Native select has an accessible name matching the heading. | Yes | 2026-10-14 |
| TASK-021 | Settings teaching defaults: country `<select>` next to curriculum, saved with **Save Settings**. Keys `settings.country` / `settings.selectCountry`. After a successful save, call `setProfileSignals({ country, curriculum })`. English country names (OPEN-DEC-007). Cover save in `SettingsClient.test.tsx`. **Deviation:** `ColorBendsAtmosphereProvider` does not exist until Phase 3 TASK-007. This task saves `country` to Supabase only and leaves `// Phase 3 TASK-007: setProfileSignals({ country, curriculum })` after a successful save. No provider stub. | Yes | 2026-10-14 |
| TASK-023 | Confirm signup / sign-in recovery upserts (`app/(auth)/sign-up/SignUpPage.tsx` ~L155–164 and equivalents) still succeed with nullable `country`. Do not require country until onboarding finishes. **Verified 2026-10-14:** SignUpPage insert, SignInPage recovery insert, auth callback insert, and middleware profile upsert omit `country`. The users Insert type keeps `country` optional. Signup and sign-in unit tests still pass. No test change. | Yes | 2026-10-14 |
| TASK-022 | Privacy: confirm `docs` / privacy page still covers profile fields at the existing granularity, or add one sentence that country is an optional teaching-location default. Do not invent new legal claims. **Done:** profile fields were listed specifically and did not mention country. Added one sentence on the privacy page. No separate privacy copy under `docs/`. | Yes | 2026-10-14 |

### Implementation Phase 2

- GOAL-002: Restore the production rainbow GLSL path behind empty `colors`.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | In `components/ui/backgrounds/ColorBends.jsx`, replace the empty-colors else-branch (currently L78–80 transparent black) with the `b586e1f^` RGB-split loop (`col[k]` / `uBandWidth` / alpha from max of the three bands). Keep `uColorCount > 0` on Arham’s weighted-average mix and the post-loop `vec4(col * a, …)` (L91–93). | Yes | 2026-10-14 |
| TASK-006 | Update `tests/unit/components/ui/backgrounds/ColorBends.empty-colors.test.ts`: empty-colors branch contains `col[k]`, mentions `uBandWidth`, does **not** contain `col = vec3(0.0)` / `a = 0.0`. Named-colors branch still has `sumCol / max(sumW`. TASK-016 includes a visual rainbow vs brand check. | Yes | 2026-10-14 |

### Implementation Phase 3

- GOAL-003: Authenticated-shell provider and ColorBends wiring. Follow §11 exactly.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Add `providers/color-bends-atmosphere.tsx`. Props: `initialCountry`, `initialCurriculum`. Reads override from localStorage in `useEffect` (REQ-016). Reads locale from `useLocale()`. Exposes `{ atmosphere, setAtmosphere, resolvedAtmosphere, setProfileSignals }`. `atmosphere` is the override (`null` = follow default). `resolvedAtmosphere` = TASK-003. Invalid stored values → null. | Yes | 2026-10-14 |
| TASK-008 | Convert `app/(app)/layout.tsx` to **async**. After session, `select('country, default_curriculum')` for the signed-in user (not generate/page.tsx). Pass those as `initialCountry` / `initialCurriculum`. Nulls if missing. | Yes | 2026-10-14 |
| TASK-009 | Mount `ColorBendsAtmosphereProvider` in `app/(app)/layout.tsx` around `ColorBendsBackground` **and** children. **Do not** wrap `app/layout.tsx`. Root keeps Locale / Theme / Zen only. | Yes | 2026-10-14 |
| TASK-010 | In `components/ui/backgrounds/ColorBendsWrapper.tsx`, when `resolvedAtmosphere === 'brand'` pass `colors={[...COLOR_BENDS_PALETTE]}`; when `'rainbow'` pass `colors={[]}` (or omit). Keep theme intensity and zen/reduced-motion early return. | Yes | 2026-10-14 |
| TASK-011 | Extend wrapper tests: brand passes palette, rainbow passes empty array, zen still renders nothing. Provider tests: invalid storage ignored; `setProfileSignals` changes resolved value when override is null and does not when override is set; locale `ar` from `useLocale` flips default. | Yes | 2026-10-14 |

### Implementation Phase 4

- GOAL-004: Settings preview-tile picker and copy. Follow §9 exactly.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Add the Background card in `SettingsClient.tsx` between zen and language per §9. Two tiles wrapping native `<input type="radio" name="fp-atmosphere">`. Instant `setAtmosphere`. When zen is on, radios are `disabled` and the zen-locked sentence is `aria-describedby`. No reset-to-auto control. | | |
| TASK-013 | Add i18n keys from §9.4 to `en.ts`, `ar.ts`, `es.ts`, `fr.ts`, `zh-Hans.ts`. | | |
| TASK-014 | Extend `SettingsClient.test.tsx`: click FreePeriod colours → `setAtmosphere('brand')`; click Multicolour → `setAtmosphere('rainbow')`; zen on → radios `disabled`; keyboard arrows / Space apply; group accessible name is Background. | | |
| TASK-015 | Confirm all five locale message objects still satisfy `Messages`. | | |

### Implementation Phase 5

- GOAL-005: Browser check and stop.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Manual: `/settings` tiles (desktop + ~375px), live ColorBends behind the card on select, zen disables tiles, light/dark intensity, RTL (`ar`) tile order, keyboard. Hydration: stored override may flash regional default then correct (accepted). ME-default cases from §10.2. Onboarding country step. Existing user with null country + GCSE + English stays rainbow; same user switching the **in-app language picker** to العربية gets brand until they override. Visual rainbow vs brand on `/dashboard`. | | |
| TASK-017 | Do not merge to `main` from this plan. Stay on `colorBends_rework_branch` until a later kickoff. | | |

## 3. Alternatives

- **ALT-001**: IP geolocation for ME default. Rejected (VPN, travel, extra vendor). Country is asked, not sniffed.
- **ALT-008**: Persist `users.is_middle_east`. Rejected: stale when they change country, curriculum, or language. Derive.
- **ALT-009**: Curriculum only (v1.0). Rejected in 1.2: a Dubai GCSE teacher would get rainbow. Country and Arabic close that hole.
- **ALT-010**: Mount atmosphere provider on root `app/layout.tsx`. Rejected in 1.3: root has no profile; would force auth/profile work onto marketing routes.
- **ALT-011**: Use `users.preferred_locale` as the Arabic signal. Rejected in 1.3: it can disagree with the visible `fp-locale` cookie. Atmosphere follows the screen.
- **ALT-012**: Bootstrap script so the override is known before hydration. Rejected in 1.3: zen does not do this; do not invent a one-off. Accept a short flash.
- **ALT-002**: Default everyone to `brand` and only offer rainbow in Settings. Simpler, but contradicts the agreed regional default.
- **ALT-003**: Two shaders / two components. Rejected: one `ColorBends.jsx` with `uColorCount > 0` vs else is enough.
- **ALT-004**: Persist the background *override* on `users` in v1. Rejected until OPEN-DEC-002 changes; zen/theme already localStorage-only. Country is a profile field and does belong on `users`.
- **ALT-005**: `AnimatedDropdown` like language. Rejected in v1.1: two visual choices fail Krug (“don’t make me think”) and Nielsen #6 (recognition) if hidden in a menu. Language has five options; this has two. Preview tiles.
- **ALT-007**: Binary switch “Warm / Rainbow”. Rejected: a switch implies on/off, not two named looks. Tiles name each option.
- **ALT-006**: Geo-split Arham’s mix vs production mix. Rejected: mix stays on `brand`; rainbow is the empty-colors RGB path.

## 4. Dependencies

- **DEP-001**: `colorBends_rework_branch` including `c427e48` (Arham mix) and palette C.
- **DEP-002**: Existing Settings card pattern (zen/language) and coral focus ring. Not `AnimatedDropdown`. Native radios for tiles; native `<select>` for country.
- **DEP-003**: `default_curriculum` and new `country` on `public.users`. Visible locale from `fp-locale` / `LocaleProvider`. `preferred_locale` is not an atmosphere input.
- **DEP-004**: No new npm packages. Country names live in-repo.

## 5. Files

- **FILE-001**: `lib/utils/brand-colors.ts` (atmosphere types/storage key if they sit next to palettes) and `lib/utils/color-bends-atmosphere.ts` (ME helper, resolve helper, ME sets)
- **FILE-014**: `lib/utils/countries.ts` (ISO list + picker items + common group)
- **FILE-015**: `app/(auth)/onboarding/OnboardingPage.tsx` (country step) and `tests/unit/app/(auth)/onboarding/OnboardingPage.test.tsx`
- **FILE-016**: `lib/supabase/schema.sql`, `supabase/migrations/009_users_country.sql`, `types/database.ts`
- **FILE-017**: `app/(app)/settings/SettingsClient.tsx` (country in teaching defaults **and** Background card) plus i18n keys; optional `features/settings/components/AtmospherePicker.tsx`
- **FILE-002**: `components/ui/backgrounds/ColorBends.jsx` (restore RGB else-branch)
- **FILE-003**: `components/ui/backgrounds/ColorBendsWrapper.tsx` (pass colors from resolved atmosphere)
- **FILE-004**: `providers/color-bends-atmosphere.tsx` (new)
- **FILE-005**: `app/layout.tsx` stays Locale / Theme / Zen only. **No** atmosphere provider here.
- **FILE-006**: `app/(app)/layout.tsx` (async profile select + scoped provider wrapping background and children)
- **FILE-007**: (merged into FILE-017)
- **FILE-008**: `lib/i18n/messages/en.ts`, `ar.ts`, `es.ts`, `fr.ts`, `zh-Hans.ts`
- **FILE-009**: `tests/unit/lib/utils/color-bends-atmosphere.test.ts` (or sibling under brand-colors)
- **FILE-010**: `tests/unit/components/ui/backgrounds/ColorBends.empty-colors.test.ts`
- **FILE-011**: `tests/unit/components/ui/backgrounds/ColorBendsWrapper.test.tsx`
- **FILE-012**: `tests/unit/app/(app)/settings/SettingsClient.test.tsx`
- **FILE-013**: `tests/unit/providers/color-bends-atmosphere.test.tsx`

## 6. Testing

- **TEST-001**: `isMiddleEastAtmosphereDefault` true for any one of: ME country, ME curriculum, `ar`. False when all three miss.
- **TEST-002**: `resolveColorBendsAtmosphere` override wins; else ME → brand, else rainbow.
- **TEST-008**: Onboarding 4-step checklist in TASK-020. Settings save updates `users.country` and calls `setProfileSignals`.
- **TEST-003**: ColorBends GLSL: named-colors path still averages; empty-colors path RGB-splits with `col[k]` / `uBandWidth` and without transparent-black.
- **TEST-004**: Wrapper passes palette vs `[]` from resolved atmosphere; zen still empty DOM.
- **TEST-005**: Settings native radios call `setAtmosphere`; zen-on **disables** them; keyboard arrows/Space; accessible group name.
- **TEST-006**: All five locale message objects include the new keys.
- **TEST-007**: Manual browser pass in TASK-016.
- **TEST-009**: Provider: invalid localStorage ignored; hydration starts override-null then applies stored `brand`/`rainbow`.
- **TEST-010**: `setProfileSignals` re-resolves when override is null; does not clobber an override.
- **TEST-011**: `schema.sql` and migration `009` both define `country`.

## 7. Risks & Assumptions

- **RISK-001**: Restoring RGB-split reintroduces rainbow on every session with no ME signal, including screenshots and existing users who never set country and are not on Arabic / UAE curricula.
- **RISK-002**: Mitigated in 1.2 for new onboarding (country catches Dubai GCSE). Remaining: existing accounts with `country` null until they edit Settings; a teacher who picks United Kingdom while working in Dubai; Maghreb countries not in the locked list.
- **RISK-005**: Arabic as an ME signal defaults Maghreb and Arabic-speaking diaspora teachers to `brand`. That is intended (safer default). They can pick Multicolour in Settings.
- **RISK-003**: localStorage override does not follow the user across browsers/devices.
- **RISK-004**: Empty-colors tests today lock transparent black; TASK-006 must invert that contract on purpose.
- **RISK-006**: First paint may show the regional default for a tick before a stored override hydrates (same class of flash as zen). Accepted in REQ-016.
- **RISK-007**: `preferred_locale` in Supabase can disagree with the `fp-locale` cookie. Atmosphere follows the cookie/screen (REQ-015). A teacher with Arabic in the DB and English on screen gets the English (rainbow-unless-other-signals) default.
- **ASSUMPTION-001**: ColorBends is the only pride-adjacent background in the app shell. Marketing/auth stay unchanged.
- **ASSUMPTION-002**: Option C remains `COLOR_BENDS_DEFAULT_OPTION` for `brand`.
- **ASSUMPTION-003**: No implementation work starts while `status` is `Planned`.

## 8. Related Specifications / Further Reading

- Git history: `b586e1f` palette C + fail-closed empty colors; `c03a675` `colors: string[]`; `c427e48` / [PR #32](https://github.com/tashivxo/freePeriod/pull/32) weighted-average mix; empty-colors restore source `b586e1f^`
- GPT 5.6 Luna plan review, 2026-10-13 (folded in v1.3)
- `components/ui/backgrounds/ColorBends.jsx` fragment shader (`uColorCount` branch vs else)
- `components/ui/backgrounds/ColorBendsWrapper.tsx`
- `lib/utils/brand-colors.ts` (`COLOR_BENDS_PALETTES`, `COLOR_BENDS_INTENSITY`)
- `app/(app)/layout.tsx` (today sync, no profile query; becomes async in TASK-008)
- `app/layout.tsx` (`readLocaleCookie`, Locale / Theme / Zen only)
- `app/(app)/settings/SettingsClient.tsx` theme + zen + language stack; `preferred_locale` sync ~L90–94
- `providers/zen-mode.tsx` (hydration pattern to copy), `providers/theme.tsx`, `providers/locale.tsx`
- `lib/utils/curricula.ts` (`UAE MOE`, `ADEK (Abu Dhabi)`)
- `app/(auth)/onboarding/OnboardingPage.tsx` (subject → grade → curriculum today; country becomes the new step 3)
- `app/(auth)/sign-up/SignUpPage.tsx` (profile upsert without country)
- `lib/supabase/schema.sql` + `supabase/migrations/008_preferred_locale_zh_hans.sql` (next number is `009`)
- docs/brand-guidelines.md
- docs/superpowers/specs/2026-07-11-zen-mode-design.md
- PRODUCT.md (Operate surface, coral focus, 44px targets, no hype)
- This file §9 (Settings appearance), §10 (ME detection), §11 (architecture)

## 9. Settings surface (Operate)

**Mode:** Operate. Teachers open Settings to change a preference, not to admire the shader. The live ColorBends behind the sheet is the preview. The card only has to name the two looks and show which one is on.

**Visitor:** Signed-in teacher, often on a phone between lessons. Satisficing: they will tap the tile that looks like the background they want. They will not read a paragraph or open a dropdown of two items.

**Primary task:** See both atmospheres, pick one, watch the app background change, leave. Success is one confident tap with no “what does this mean?” pause.

**Placement:** Same appearance stack as today. Theme stays in the header. Order: **Zen Mode → Background → Language → teaching defaults.** Background sits next to zen because both control ColorBends. Language stays a dropdown (five locales). Background does not.

**Heuristic score of this spec: 9/10.** Gaps to 10/10 in §9.8. Do not ship a dropdown and call it done.

### 9.1 Wireframe (desktop and ~375px)

Two columns at 375px. Do not stack. Seeing both options at once is the point (Nielsen #6 recognition).

```
Settings
[ ThemeToggle ]

┌─ Zen Mode ──────────────────────────────── Switch ─┐
│  leafy icon   Zen Mode                               │
│               Are our colorful backgrounds…          │
└──────────────────────────────────────────────────────┘

┌─ Background ─────────────────────────────────────────┐
│  sparkles     Background                             │
│               Colour of the moving bands             │
│               behind the app.                        │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │  [rose / peach  │  │  [RGB-split     │            │
│  │   / gold wash]  │  │   band wash]    │            │
│  │                 │  │                 │            │
│  │  FreePeriod     │  │  Multicolour    │            │
│  │  colours     ●  │  │              ○  │            │
│  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────────────────────────────┘

┌─ Language ──────────────────────────── [dropdown] ───┐
│  …existing language card unchanged…                  │
└──────────────────────────────────────────────────────┘
```

Zen on: same card, tiles at 40% opacity, radios **`disabled`**, helper line under the tiles: **Turn Zen Mode off to change this.** Do not hide the card. Do not use a tooltip. Hover-only fails on phones. `aria-disabled` alone is not enough (clicks would still fire).

### 9.2 Layout and visual language

Incumbent Settings world. Refinement, not a new visual world. No DESIGN.md; `SettingsClient.tsx` and PRODUCT.md are the authority.

| Token | Match |
| --- | --- |
| Outer card | `mb-6 rounded-xl border border-border bg-background p-4` (zen/language) |
| Header row | `MotionSafeIcon` 20px `text-text-secondary` + label `text-sm font-body font-medium text-text-primary` + description `mt-1 text-sm font-body text-text-secondary` |
| Icon | Existing `SparklesIcon` via `MotionSafeIcon`. Same family as Leaf / Languages. Do not add a new icon file. |
| Tile grid | `mt-4 grid grid-cols-2 gap-3` |
| Tile | `<label>` wrapping native radio + swatch + text. Swatch ~64px + label row. `rounded-lg border` `p-2` `text-left`. Whole tile is the hit target. |
| Unselected | `border-border bg-background` |
| Selected | `border-coral ring-2 ring-coral/20` plus the native radio’s checked state (visually a coral pip). Coral is selection, not decoration. |
| Focus | Existing coral focus ring (`:focus-visible`) on the radio or label. |
| Hover | Border darkens slightly. No lift, no scale, no glow. 150–250ms if any. `prefers-reduced-motion`: no transition. |
| Label | Under the swatch, not over it. Gradient-on-text fails WCAG. `text-sm font-body text-text-primary`. |

**Swatches are static CSS.** No second WebGL canvas (OPEN-DEC-006).

- **FreePeriod colours:** `linear-gradient(135deg, COLOR_BENDS_ROSE, COLOR_BENDS_PEACH, COLOR_BENDS_GOLD)` from `lib/utils/brand-colors.ts`. Import the constants. Do not invent hex.
- **Multicolour:** overlapping diagonal red / green / blue washes, like the RGB-split shader. **Not** six horizontal pride-flag stripes. Example direction: three `linear-gradient` layers at ~20°, 0°, and -20° with red, lime-green, and blue at ~0.55 alpha on `bg-background`. Must read as “several coloured bands”, not a flag.

Dark mode: card chrome follows theme. Swatches stay full chroma so the two looks stay distinct. Do not dim tiles to `COLOR_BENDS_INTENSITY.dark`; the live shader already does that behind the sheet.

RTL (`ar`): grid and pip follow `dir`. No physical `left`/`right` in the tile CSS.

### 9.3 Interaction

- Control is a **native radiogroup**: `<fieldset>` or `role="radiogroup"` labelled by the “Background” heading, two `<input type="radio" name="fp-atmosphere" value="brand|rainbow">`. Do not fake radios with buttons plus `aria-checked` unless native styling is impossible; native is the default.
- Arrow keys, Space, and Enter come from the browser. Do not reimplement roving tabindex unless a browser bug forces it.
- Click / tap / Space on a tile calls `setAtmosphere('brand' | 'rainbow')` immediately. No Save Settings. Same contract as zen and theme.
- The live ColorBends behind Settings updates on the same tick (Nielsen #1). That is the confirmation. No toast, no “Saved.”
- Tapping the already-selected tile is a no-op.
- No “Use regional default” control in v1 (OPEN-DEC-008). Once either tile is chosen, automatic regional behaviour does not come back through the UI.
- Browser Back still leaves Settings. Do not trap history.

### 9.4 Copy (locked English, no em dashes)

| Key | English |
| --- | --- |
| `settings.background` | Background |
| `settings.backgroundDescription` | Colour of the moving bands behind the app. |
| `settings.backgroundBrand` | FreePeriod colours |
| `settings.backgroundRainbow` | Multicolour |
| `settings.backgroundZenLocked` | Turn Zen Mode off to change this. |
| `settings.country` | Country |
| `settings.selectCountry` | Select a country |

Banned on the Background card: Arham, pride, shader, palette, atmosphere, RGB, WebGL, “warm”, “original”, “default for your region”, happy-talk, em dashes.

Arabic, Spanish, French, and Simplified Chinese get equivalent short labels in TASK-013. Keep “FreePeriod” untranslated in the brand tile label. Country **options** stay English (OPEN-DEC-007).

Zen copy stays as it is. Do not rewrite it in this feature.

### 9.5 States

| State | What the teacher sees |
| --- | --- |
| Default (no override, non-ME) | Multicolour selected. Live shader is rainbow. |
| Default (no override, any ME signal) | FreePeriod colours selected. Live shader is brand. |
| Override | Tile matches the stored override even if it disagrees with country / curriculum / locale. |
| Zen on | Shader unmounted (plain `bg-background`). Radios `disabled`. Zen-locked sentence visible. |
| Zen off again | Radios enabled. Last override (or regional default) still selected. Shader returns. |
| Reduced motion | ColorBends already skipped in the wrapper. Tiles still work. No tile animation. |
| First paint before override hydration | Tiles and shader follow the **regional default** from server profile + cookie locale. After `useEffect`, a stored override may snap. Same class of flash as zen. Do not add a bootstrap script. |

### 9.6 Accessibility

- 44px minimum hit area per tile (PRODUCT.md). The whole `<label>` is the hit target, not just the pip.
- Visible text labels. Swatches alone are mystery meat.
- Selected state is not colour-only: coral border **and** native checked radio.
- Label contrast is on `bg-background`, never on the gradient.
- Zen on: `disabled` on both radios, helper in the tree (`id` + `aria-describedby` on the group).
- Screen reader name for the group: “Background”. Each radio name is the tile label.

### 9.7 Heuristic notes (why tiles, not a dropdown)

| Heuristic | Application here |
| --- | --- |
| Krug 1 Don’t make me think | Both looks are visible. No clever name. “Background” matches zen’s “colorful backgrounds”. |
| Krug 2 Clicks | One tap. Opening a two-item dropdown is a thinking click. |
| Krug 3 Half the words | One-line description. No regional-default essay. |
| Trunk test | Card heading is the page-level “you are here” for this control. Settings `h1` already exists. |
| Nielsen 1 Status | Selected pip + live shader behind the card. |
| Nielsen 2 Real world | “Colours” / “Multicolour”, not `brand` / `rainbow`. |
| Nielsen 3 Control | Pick the other tile. Zen is the emergency off. No confirm dialog. Sticky override is an explicit v1 trade (OPEN-DEC-008). |
| Nielsen 4 Consistency | Same card chrome as zen/language. Instant apply like zen. Coral = selected, like other app controls. Native radios, not a new widget. |
| Nielsen 5 Prevention | Native radios, not a text field. Zen disables instead of silently no-op. |
| Nielsen 6 Recognition | Tiles show the looks. Dropdown would force recall. |
| Nielsen 8 Minimal | Two options, one card, one primary accent (the selected tile). |
| Nielsen 9 Errors | Invalid storage value falls back to regional default (provider). No error string on this card. |

Dark pattern check: none. Changing background is as easy as the first pick. No confirmshaming, no buried off-ramp.

### 9.8 Score and remaining gaps to 10/10

**9/10** as specified. To reach 10/10 at implementation time, all of these must be true:

1. Selected tile is obvious at a glance (coral ring + native checked), including in dark mode.
2. Zen-locked helper is always visible, never hover/title; radios are actually disabled.
3. Labels sit under swatches with AA contrast.
4. Multicolour swatch does not read as a pride flag (severity 3 if it does: UAE teachers will not use it, which is the original problem).
5. Keyboard: Tab to group, arrows between tiles, Space/Enter apply (native radios).
6. Two columns survive 375px without truncating “FreePeriod colours”.
7. Live shader behind the card changes on the same tap. If it lags, teachers will re-tap (Nielsen 1 fail).

Out of scope for 10/10 in v1: undo toast, “reset to regional default”, live WebGL inside the tiles, explaining *why* the default was brand vs rainbow, zero-flash override hydration.

### 9.9 Anti-goals

- Do not reuse `AnimatedDropdown`.
- Do not use a switch. A switch is on/off, not two named looks.
- Do not put this control in the header next to `ThemeToggle`. Header has no room for two previews.
- Do not restyle the rest of Settings.
- Do not add a third tile for “Auto”.
- Do not write CSS that assumes LTR.
- Do not implement radios as undecorated buttons that only set `aria-checked`.

## 10. Middle East detection

Do not ask “Are you in the Middle East?” and do not sniff IP. Ask where they teach, keep curriculum and language as they already exist, and OR the three.

`ME = country ∈ ME codes  OR  curriculum ∈ ME curricula  OR  visibleLocale === 'ar'`

Store country. Do not store `ME`. Recompute on every resolve so Settings language / curriculum / country edits move the default **until** the teacher has picked a background tile (`override` set). After that, override is sticky (OPEN-DEC-008).

### 10.1 Locked lists (amend here, do not invent at implementation)

**Countries** (`users.country`, ISO 3166-1 alpha-2, compare uppercase):

`AE`, `BH`, `KW`, `OM`, `QA`, `SA` (GCC), `IQ`, `JO`, `LB`, `SY`, `PS`, `YE`, `IR`, `EG`

Out until this list is amended: Maghreb (`MA`, `DZ`, `TN`, `LY`), `IL`, `TR`, `CY`.

**Curricula** (exact match on `default_curriculum` only; a lesson’s own curriculum field is not an atmosphere input):

`'UAE MOE'`, `'ADEK (Abu Dhabi)'`

Those are the only Middle East presets in `lib/utils/curricula.ts` today. Custom curriculum text does **not** fuzzy-match (`Saudi`, `KHDA`, …). Add a named preset to `CURRICULA` and to this list if a new ME curriculum ships.

**Locale:** `useLocale().locale === 'ar'` (cookie `fp-locale`, `LocaleProvider`). Not `users.preferred_locale`. Not `ar-AE`. Spanish / French / Chinese never count as ME.

### 10.2 Truth table

| Country | Curriculum | Visible locale | Override | Result |
| --- | --- | --- | --- | --- |
| `AE` | GCSE | en | none | brand |
| `GB` | UAE MOE | en | none | brand |
| `GB` | GCSE | ar | none | brand |
| `GB` | GCSE | en | none | rainbow |
| null | null | en | none | rainbow |
| `AE` | UAE MOE | ar | `rainbow` | rainbow (override) |
| `GB` | GCSE | en | `brand` | brand (override) |
| null | UAE MOE | en | none | brand (existing user, no country) |
| `AE` | GCSE | en | `brand` then country→`GB` | still brand (sticky override) |

Existing users: `country` is null. Curriculum and visible Arabic still apply. No forced re-onboarding. Country appears in Settings so they can set it later.

### 10.3 Onboarding country step (Operate)

Today: 3 steps (subject, grade, curriculum) with progress `total = 3` (`OnboardingPage.tsx` ~L185–249) and tests that assert “Step 1 of 3”. Add country as **step 3**; curriculum becomes **step 4**. Extra click is fine if it is obvious (Krug 2). TASK-020 lists the test rewrites; “extend the file” is not enough.

Copy, hardcoded English like the rest of onboarding (that page is not on `t()` yet):

- Heading: `Where do you teach?`
- Helper: `You can change this in Settings.`
- Trigger placeholder: `Select a country`
- Next disabled until a country is chosen (same as grade/curriculum).

Do not mention backgrounds, palettes, or the Middle East. Country is a teaching-profile field that also drives the default.

Control: native `<select>` of all countries, English names, `value` = ISO code. Two `<optgroup>`s: **Common** (`United Arab Emirates`, `Saudi Arabia`, `United Kingdom`, `United States`, `India`, `Australia`, `South Africa`) then **All countries** A–Z. Native select beats a 200-row `AnimatedDropdown`. OS search behaviour is platform-dependent; do not promise typeahead on every device.

RTL: onboarding stays LTR until that page is translated. Out of scope.

### 10.4 Settings country

Teaching defaults, not the appearance stack. Label `Country`. Saved with **Save Settings** next to subject, grade, curriculum. Instant apply is reserved for zen, theme, language, and background tiles.

After a successful save, call `setProfileSignals({ country, curriculum })` with the values just written. If override is null, ColorBends re-resolves on the same tick. If override is set, signals update but the shader does not change (OPEN-DEC-008). Do not rely on `router.refresh()` or on generate/page.tsx.

### 10.5 Heuristic notes for detection

| Heuristic | Application |
| --- | --- |
| Krug 1 | “Where do you teach?” not “Region for culturally safe atmosphere”. |
| Nielsen 2 | Country names, not ISO codes in the UI. Codes are the stored value. |
| Nielsen 3 | Wrong country is editable in Settings. Wrong default is one tap on a background tile. |
| Nielsen 5 | Closed country list, not a free-text country field. App + `^[A-Z]{2}$` DB check. |
| Nielsen 6 | Common countries on top so UAE/UK/US are visible without hunting. |

**Detection helper score: 8/10** until country is actually on onboarding (without it we are back to curriculum + Arabic only). Gaps to 10/10: common-country grouping ships, native select is keyboard reachable, existing users can set country in Settings without repeating onboarding, Maghreb decision stays explicit in §10.1.

## 11. Architecture (authenticated shell)

Luna blocker: TASK-008 vs TASK-009 used to contradict. This is the only allowed shape.

```
app/layout.tsx (root, public + auth + app)
  LocaleProvider (cookie fp-locale)
  ThemeProvider
  ZenModeProvider
    children
      app/(app)/layout.tsx   ← async server layout
        session + select country, default_curriculum
        ColorBendsAtmosphereProvider(initialCountry, initialCurriculum)
          ColorBendsBackground      ← uses resolvedAtmosphere + zen + theme
          Navbar / main / children  ← Settings can setAtmosphere + setProfileSignals
```

**Provider API**

| Field | Meaning |
| --- | --- |
| `atmosphere` | Override from localStorage: `brand` \| `rainbow` \| `null` |
| `setAtmosphere(next)` | Writes localStorage + state. Sticky. |
| `resolvedAtmosphere` | `resolveColorBendsAtmosphere({ override: atmosphere, country, curriculum, locale })` |
| `setProfileSignals({ country, curriculum })` | Client update after Settings save. Locale is **not** passed; the provider reads `useLocale()` itself so a language change applies immediately. |

**Data loading.** `app/(app)/layout.tsx` gets the session and selects `country, default_curriculum` only. `generate/page.tsx` (~L28) is **not** the template (it omits `country` and is page-scoped). Signup recovery upserts stay valid with `country` null (TASK-023).

**Hydration.** Match zen: `useState(null)` override, `useEffect` read localStorage. SSR ColorBends uses regional default. Documented flash: RISK-006.

**Why not root layout.** `app/layout.tsx` ~L104–110 has cookie locale but no user row. Putting the provider there would either default everyone to rainbow on first paint (wrong for UAE teachers) or run a Supabase profile query on `/`, `/pricing`, `/sign-in`. Out of scope.

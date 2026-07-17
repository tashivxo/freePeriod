# UI/UX Audit P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the highest-severity fixes from the UI/UX audit — conversion-breaking auth, trapped generation states, inaccessible controls, and high-frequency feedback failures — without removing any brand motion/effects.

**Architecture:** Foundation first (token alignment notes + shared Button/Input/focus), then independent product surfaces (auth signup, generate lifecycle, lesson edit, history), then feedback consumers (settings, history search). Motion work only adds `prefers-reduced-motion` / Zen gates and visibility resets.

**Tech Stack:** Next.js 16 App Router, React, Tailwind v4 + shadcn, Supabase auth, anime.js / existing motion components, Jest + Testing Library, Playwright optional for smoke.

**Backlog:** [`../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md`](../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md)  
**Index:** [`2026-07-17-uiux-audit-plans-index.md`](./2026-07-17-uiux-audit-plans-index.md)

**Sequence (do in order):**

```text
T0 W-TOKENS-01 (foundation slice)
 → T1 W-PRIMITIVES-01
 → T2 W-MOTION-01
 → T3 W-AUTH-01 || T4 W-LESSON-01 || T5 W-HISTORY-01  (parallel OK)
 → T6 W-GENERATE-01
 → T7 W-FEEDBACK-01
 → T8 W-SETTINGS-01
 → T9 W-HISTORY-02
```

**Phase effort:** ~16 engineer-days (includes early token foundation).

**Motion constraint:** Refine/gate only — never delete SoftAurora, Iridescence, ColorBends, Waves, BlurText, grain, GenerationScreen, SpotlightCard, MagicCard, `.btn-shine`, Button spotlight.

---

### Task 0: W-TOKENS-01 — Token foundation (P0 pull-forward)

**Scope:** Align `--text-secondary` / primary↔coral bridge and skeleton surface tokens so P0 primitives and consumers do not thrash. Full consumer cleanup of every page may finish in P2; this task establishes the source of truth.

**Effort:** M (~1.5d)  
**Depends on:** —  
**Files:**
- Modify: `app/globals.css`
- Modify: `assets/design-tokens.json`
- Modify: `components/ui/skeleton.tsx` (if present) / skeleton call sites using `bg-gray-*` in settings/history pages
- Reference: `docs/brand-guidelines.md`

**Steps:**
- [ ] **Step 1:** Document current mismatches in a short comment block at the top of the `:root` section in `globals.css` (coral, text-secondary hex vs JSON).
- [ ] **Step 2:** Set a single `--text-secondary` value and mirror it in `@theme` and `assets/design-tokens.json`.
- [ ] **Step 3:** Map `--primary` to coral primitives (or document intentional oklch bridge) so `Button` default stays on-brand.
- [ ] **Step 4:** Replace `bg-gray-200` / `bg-gray-100` skeletons in `app/(app)/settings/page.tsx` and `app/(app)/history/page.tsx` with `bg-surface` / `border-border`.
- [ ] **Step 5:** Visual check light + dark on `/settings` and `/history` loading states.
- [ ] **Step 6:** Commit: `fix: align design tokens and skeleton surfaces for audit P0`

**Acceptance criteria:**
- One source of truth for `--text-secondary` across CSS and JSON.
- Settings/History skeletons use surface tokens, not raw gray utilities.
- No animation/effect removed.

**Test checklist:**
- [ ] Light/dark: settings + history Suspense skeletons look on-token
- [ ] Primary buttons still coral-family and readable
- [ ] `npm run lint` on touched files (ignore pre-existing unrelated lint)

---

### Task 1: W-PRIMITIVES-01 — Shared Button / Input / ThemeToggle / focus

**Scope:** Hit targets, `active:scale-[0.96]`, no `transition-all`, unified focus, preserve `btn-shine` + spotlight.

**Effort:** M (~1.5d)  
**Depends on:** Task 0  
**Files:**
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/Input.tsx`
- Modify: `components/ui/ThemeToggle.tsx`
- Modify: `app/globals.css` (focus + `.btn-shine` PRM gate if not in Task 2)

**Steps:**
- [ ] **Step 1:** In `Button.tsx`, replace `transition-all` with explicit properties, e.g. `transition-[transform,opacity,colors,box-shadow,border-color]`.
- [ ] **Step 2:** Replace `active:…translate-y-px` with `active:scale-[0.96]` (keep `static`/disabled paths from shrinking oddly).
- [ ] **Step 3:** Raise default size toward `h-10` / `min-h-11` on touch; keep desktop density reasonable; icon buttons ≥44×44 below `sm`.
- [ ] **Step 4:** ThemeToggle → `h-11 w-11`.
- [ ] **Step 5:** Input label: change `transition-all` to `transition-[top,transform,font-size,color]`.
- [ ] **Step 6:** Standardize focus: prefer coral outline **or** ring — pick one in globals and remove conflicting double treatments on Button/ThemeToggle.
- [ ] **Step 7:** Add/adjust Button unit tests if present; otherwise manual matrix.
- [ ] **Step 8:** Commit: `fix: standardize Button Input ThemeToggle accessibility primitives`

**Acceptance criteria:**
- No `transition-all` on Button or Input label.
- Press feedback is `scale(0.96)`.
- Touch targets meet ≥44px on mobile for default Button and ThemeToggle.
- `btn-shine` and spotlight still present for default users.

**Test checklist:**
- [ ] Click primary/outline/secondary buttons — shine + press scale
- [ ] Keyboard Tab focus visible once (not double ring+outline)
- [ ] iOS/mobile viewport: buttons tappable without mis-hit
- [ ] Floating Input label still animates

---

### Task 2: W-MOTION-01 — Reduced-motion / Zen visibility

**Scope:** Fix invisible hero under PRM; gate SoftAurora on pricing; PRM/Zen for onboarding steps, lesson stagger, ColorBends, grain, GenerationScreen, BlurText, Button spotlight, UpgradePrompt. Keep all effects for default users.

**Effort:** L (~3d)  
**Depends on:** Task 1 (Button spotlight gate)  
**Files:**
- Modify: `app/page.tsx`
- Modify: `features/billing/components/PricingClient.tsx`
- Modify: `app/(auth)/onboarding/OnboardingPage.tsx`
- Modify: `features/lesson/components/LessonView.tsx`
- Modify: `components/backgrounds/ColorBendsWrapper.tsx`
- Modify: `components/animations/GrainOverlayClient.tsx`
- Modify: `components/animations/GenerationScreen.tsx`
- Modify: `components/ui/BlurText.tsx`
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/UpgradePrompt.tsx`
- Modify: `app/globals.css` (`.btn-shine` inside `@media (prefers-reduced-motion: no-preference)`)

**Steps:**
- [ ] **Step 1:** In `app/page.tsx`, initialize `prefersReduced` from `window.matchMedia('(prefers-reduced-motion: reduce)')` synchronously when `typeof window !== 'undefined'`, or set opacity via CSS class when reduced so `[data-animate]` never stays at `opacity: 0`.
- [ ] **Step 2:** When `prefersReduced`, force hero + floating toggle to visible (`opacity: 1`, no animejs).
- [ ] **Step 3:** Pricing: conditionally render `SoftAurora` only when `!prefersReduced` (mirror landing).
- [ ] **Step 4:** Onboarding step animejs: skip translate when PRM (instant show).
- [ ] **Step 5:** LessonView stagger: also skip when Zen Mode is on (`useZenMode`).
- [ ] **Step 6:** ColorBends / grain / GenerationScreen / BlurText / Button mousemove spotlight / UpgradePrompt — add PRM and/or Zen gates per inventory; never unmount brand identity for default users.
- [ ] **Step 7:** Manual QA with OS “Reduce motion” on/off and Zen on/off.
- [ ] **Step 8:** Commit: `fix: gate motion for reduced-motion and Zen without removing effects`

**Acceptance criteria:**
- With reduce-motion: landing hero and theme toggle are fully visible; SoftAurora off on pricing; content readable.
- With motion enabled: SoftAurora, BlurText, GenerationScreen, shine still work.
- Zen Mode still disables ColorBends; other app content remains usable.

**Test checklist:**
- [ ] Chrome DevTools → Rendering → emulate `prefers-reduced-motion: reduce` on `/` and `/pricing`
- [ ] Toggle Zen in Settings; visit dashboard — no ColorBends, app usable
- [ ] Generate flow with motion on — overlay still animates
- [ ] Onboarding Next/Back with motion on — step slide still runs

---

### Task 3: W-AUTH-01 — Sign-up → onboarding / email confirm

**Scope:** Stop sending every signup to `/dashboard`; handle null session (email confirm).

**Effort:** M (~1.5d)  
**Depends on:** — (can parallel with T4/T5 after foundation)  
**Files:**
- Modify: `app/(auth)/sign-up/SignUpPage.tsx` (~line 73 `router.push('/dashboard')`)
- Modify: `app/auth/callback/route.ts` (if post-confirm routing needs onboarding check)
- Read: `app/(auth)/onboarding/OnboardingPage.tsx` / user profile `onboarding_complete` field

**Steps:**
- [ ] **Step 1:** After successful `signUp`, if `session` is null → set UI state `checkEmail` and render in-card success (no redirect).
- [ ] **Step 2:** If session exists → `router.push('/onboarding')` (or `/dashboard` only when profile already `onboarding_complete`).
- [ ] **Step 3:** Ensure auth callback for email confirm sends incomplete users to `/onboarding`.
- [ ] **Step 4:** Add/extend test for routing branches if auth tests exist; otherwise document manual path.
- [ ] **Step 5:** Commit: `fix: route new signups through onboarding and email confirm UI`

**Acceptance criteria:**
- New email signup without session sees “check your email” in the card.
- New signup with session lands on onboarding, not dashboard.
- Returning complete users still reach dashboard.

**Test checklist:**
- [ ] Sign up fresh user (local Supabase auto-confirm) → onboarding
- [ ] If hosted confirm-required: UI shows check-email state
- [ ] Complete onboarding → dashboard
- [ ] Existing user sign-in unchanged

---

### Task 4: W-LESSON-01 — Inline edit continuity

**Scope:** Toolbar clicks must not blur-exit edit; cannot collapse while editing.

**Effort:** M (~1.5d)  
**Depends on:** —  
**Files:**
- Modify: `features/lesson/components/SectionCard.tsx`
- Modify: `features/lesson/components/LessonEditor.tsx`
- Modify: `features/lesson/components/LessonView.tsx` (if edit state owned here)

**Steps:**
- [ ] **Step 1:** On TipTap toolbar buttons, `onMouseDown={(e) => e.preventDefault()}` so editor keeps focus.
- [ ] **Step 2:** Decouple “Done” from raw `onBlur` if blur still fires spuriously — e.g. only call `onDone` from explicit Done or controlled blur-with-relatedTarget check.
- [ ] **Step 3:** Disable accordion toggle while `isEditing` (or force `isOpen` true).
- [ ] **Step 4:** Manual edit: bold/italic/list without exiting; Done still saves + flash.
- [ ] **Step 5:** Commit: `fix: keep lesson section editor open during toolbar use`

**Acceptance criteria:**
- Formatting toolbar clicks do not exit edit mode.
- Collapse control inactive or blocked while editing.
- Save flash still runs on Done.

**Test checklist:**
- [ ] Edit section → use toolbar → still editing
- [ ] Try collapse while editing → blocked
- [ ] Done → view mode + green flash (motion on)

---

### Task 5: W-HISTORY-01 — Touch-safe delete

**Scope:** Delete control always visible on coarse pointers; ≥44×44 hit area; keep hover fade on fine pointers.

**Effort:** S (~0.5d)  
**Depends on:** —  
**Files:**
- Modify: `features/history/components/HistoryClient.tsx` (~line 128 delete button)

**Steps:**
- [ ] **Step 1:** Use `max-md:opacity-100` or `@media (pointer: coarse)` so delete is visible on touch.
- [ ] **Step 2:** `min-h-11 min-w-11` + centered icon; keep `focus:opacity-100`.
- [ ] **Step 3:** Confirm delete dialog unchanged.
- [ ] **Step 4:** Commit: `fix: show history delete control on touch devices`

**Acceptance criteria:**
- Mobile/coarse: delete icon visible without hover.
- Desktop fine pointer: hover/focus reveal still works.
- Hit target ≥44×44.

**Test checklist:**
- [ ] Mobile viewport history card — delete visible and tappable
- [ ] Desktop hover — fade in/out still works
- [ ] Delete confirm still works

---

### Task 6: W-GENERATE-01 — Generation lifecycle

**Scope:** Single state for submit/overlay/error/cancel; clear `isGenerating` on terminal errors; recovery CTAs; cancel via `abortRef`.

**Effort:** L (~3d)  
**Depends on:** Task 1 (button loading patterns); coordinate with Task 7  
**Files:**
- Modify: `features/generate/components/GenerateClient.tsx`
- Modify: `features/generate/components/GenerateForm.tsx`
- Modify: `components/animations/GenerationScreen.tsx`
- Read: `lib/generation/map-error.ts`

**Steps:**
- [ ] **Step 1:** Define explicit states: `idle | generating | error` (and optional `canceling`).
- [ ] **Step 2:** On every terminal stream/HTTP error (including non-402), set generating false and surface error in `GenerationScreen`.
- [ ] **Step 3:** Wire `abortRef` to a Cancel control that aborts fetch and returns to form.
- [ ] **Step 4:** Change `GenerateForm` `onSubmit` contract to `Promise`-aware (parent awaits / parent owns busy flag via `isGenerating`).
- [ ] **Step 5:** Add “Try again” / “Back to form” on error panel; keep animejs entrance on happy path.
- [ ] **Step 6:** Extend `GenerateForm.test.tsx` / client tests for error + cancel paths.
- [ ] **Step 7:** Commit: `fix: repair generation overlay error and cancel lifecycle`

**Acceptance criteria:**
- Failed generation never leaves fullscreen overlay stuck.
- Cancel aborts in-flight request and restores form.
- Submit button busy state matches overlay visibility.
- Happy-path GenerationScreen motion intact.

**Test checklist:**
- [ ] Force API error → overlay shows recovery, dismiss works
- [ ] Cancel mid-generation → form returns, no stuck spinner
- [ ] 402 → UpgradePrompt still works
- [ ] Success → navigates to lesson
- [ ] `npm test -- GenerateForm` (and any GenerateClient tests)

---

### Task 7: W-FEEDBACK-01 — Inline validation / no `alert()`

**Scope:** Replace Generate + Settings `alert()` with inline/`role="status"` feedback; custom duration validation; teacher prompt `text-base`.

**Effort:** M (~1.5d)  
**Depends on:** Task 1; Task 6 for generate busy coupling  
**Files:**
- Modify: `features/generate/components/GenerateForm.tsx` (alert ~line 57; textarea ~198)
- Modify: `app/(app)/settings/SettingsClient.tsx` (alert ~49–52)
- Optionally add: small `components/ui/InlineStatus.tsx` if reuse helps (keep YAGNI — inline markup OK)

**Steps:**
- [ ] **Step 1:** GenerateForm: field errors under Subject/Grade; remove `alert()`.
- [ ] **Step 2:** Validate custom duration when `durationSelect === 'custom'`.
- [ ] **Step 3:** Textarea `text-base` (mobile-safe).
- [ ] **Step 4:** Settings: success/error banner with `role="status"`; auto-clear success ~4s; keep button loading.
- [ ] **Step 5:** Update GenerateForm tests that assumed alert.
- [ ] **Step 6:** Commit: `fix: replace alert feedback with inline validation status`

**Acceptance criteria:**
- No `alert()` in GenerateForm or SettingsClient save path.
- Invalid generate submit shows inline errors and does not submit.
- Settings save announces success/failure inline.

**Test checklist:**
- [ ] Generate with empty subject/grade → inline errors
- [ ] Custom duration empty → inline error
- [ ] Settings save success → banner, no alert dialog
- [ ] `npm test -- GenerateForm`

---

### Task 8: W-SETTINGS-01 — Account context + dirty save

**Scope:** Show email/plan; manage subscription when applicable; dirty Save; legal links same-tab (or labeled).

**Effort:** M (~1.5d)  
**Depends on:** Task 7  
**Files:**
- Modify: `app/(app)/settings/SettingsClient.tsx`
- Modify: `app/(app)/settings/page.tsx` (pass user email/plan props if needed)
- Read: `lib/lemonsqueezy/subscriptions.ts`, `components/ui/TrialBanner.tsx`

**Steps:**
- [ ] **Step 1:** Pass session email + plan/trial fields from server page into client.
- [ ] **Step 2:** Render read-only Account row (email, plan).
- [ ] **Step 3:** If paid/portal URL available, “Manage subscription” button/link.
- [ ] **Step 4:** Track dirty state vs initial defaults; disable Save until dirty; after save reset dirty + status.
- [ ] **Step 5:** Privacy/Terms: same-tab navigation (remove `target="_blank"`) or add `aria-label` “opens in new tab”.
- [ ] **Step 6:** Commit: `feat: add settings account context and dirty save state`

**Acceptance criteria:**
- User sees email and plan on Settings without leaving the page.
- Save disabled until a field changes.
- Legal links behave intentionally.

**Test checklist:**
- [ ] Free user: plan shown, no broken manage link
- [ ] Paid/trial user: manage path present if portal configured
- [ ] Change subject → Save enables → save → banner → Save disables
- [ ] Privacy/Terms navigation works

---

### Task 9: W-HISTORY-02 — Search debounce + empty CTA + type

**Scope:** Debounced search without full-grid skeleton thrash; `text-base` search; readable dates; empty-state Generate CTA.

**Effort:** M (~1.5d)  
**Depends on:** Task 5 optional (same file — land after or combine carefully)  
**Files:**
- Modify: `features/history/components/HistoryClient.tsx`
- Modify: `components/ui/skeleton.tsx` / history page skeleton if needed

**Steps:**
- [ ] **Step 1:** Debounce `search` ~300ms before refetch.
- [ ] **Step 2:** Keep previous results visible while refetching (subtle “Updating…” optional); reserve full pulse skeleton for initial load only.
- [ ] **Step 3:** Search input `text-base md:text-sm`.
- [ ] **Step 4:** Date metadata `text-xs` without excessive `/60` opacity.
- [ ] **Step 5:** Empty unfiltered state: primary link/button to `/generate`.
- [ ] **Step 6:** Commit: `fix: debounce history search and improve empty states`

**Acceptance criteria:**
- Typing search does not flash full-page skeleton every keystroke.
- Empty history offers Generate path.
- Mobile search input ≥16px.

**Test checklist:**
- [ ] Type quickly in search — no full-grid flash each letter
- [ ] Clear all lessons (or empty account) — Generate CTA shown
- [ ] Mobile font size on search field
- [ ] Subject filter still works

---

## P0 exit criteria

- [ ] All Task 0–9 acceptance criteria met
- [ ] No audited effect removed
- [ ] `npm test` for touched suites green
- [ ] Manual smoke: signup→onboarding, generate error/cancel, lesson toolbar edit, history delete on mobile, settings save banner, landing with reduce-motion
- [ ] Update backlog checklist items for completed W-* IDs

## Self-review (plan author)

| Work item | Task |
| --- | --- |
| W-TOKENS-01 (early) | Task 0 |
| W-PRIMITIVES-01 | Task 1 |
| W-MOTION-01 | Task 2 |
| W-AUTH-01 | Task 3 |
| W-LESSON-01 | Task 4 |
| W-HISTORY-01 | Task 5 |
| W-GENERATE-01 | Task 6 |
| W-FEEDBACK-01 | Task 7 |
| W-SETTINGS-01 | Task 8 |
| W-HISTORY-02 | Task 9 |

No TBD placeholders. Product decisions for P1 (Remember me, upload DnD, trial copy) deferred to P1 plan with defaults in the index.

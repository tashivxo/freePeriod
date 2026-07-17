# UI/UX Audit P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve auth recovery and onboarding clarity, marketing/pricing trust, upload honesty, and lesson save/export status — building on P0 primitives, motion gates, and generation lifecycle.

**Architecture:** Auth shell/layering first (Waves visibility), then recovery + form hardening + onboarding chrome. Marketing chrome and pricing trust share P0 Button patterns. Lesson status feedback builds on P0 edit continuity. Upload uses the locked default: **copy change only**.

**Tech Stack:** Same as P0 (Next.js 16, Tailwind v4, Supabase, existing motion, Jest/Testing Library).

**Prerequisites:** P0 Tasks 0–2 and 3, 4, 6, 7 complete (or equivalent).  
**Backlog:** [`../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md`](../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md)  
**Index:** [`2026-07-17-uiux-audit-plans-index.md`](./2026-07-17-uiux-audit-plans-index.md)

**Sequence:**

```text
T1 W-AUTH-04
 → T2 W-AUTH-03
 → T3 W-AUTH-05
 → T4 W-AUTH-02 || T5 W-AUTH-06  (after W-AUTH-01 from P0)
 → T6 W-MARKETING-01
 → T7 W-PRICING-01
 → T8 W-UPLOAD-01
 → T9 W-LESSON-02
```

**Phase effort:** ~13 engineer-days.

**Locked defaults:** Remember-me = honest copy; Upload = “Click to upload”; Trial = “Paid plans include a 30-day free trial.”

**Motion constraint:** Preserve Waves, SoftAurora, MagicCard, onboarding step animejs, loaders, UpgradePrompt entrance.

---

### Task 1: W-AUTH-04 — Waves visibility + stacking

**Scope:** Auth pages must not fully paint over Waves; children need `relative z-10`.

**Effort:** S (~0.5d)  
**Depends on:** P0 W-MOTION-01  
**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `components/animations/AuthBackground.tsx` (PRM static fallback if missing)
- Modify: `app/(auth)/sign-in/SignInPage.tsx`, `SignUpPage.tsx`, `OnboardingPage.tsx` (opaque full-viewport `bg-background` → translucent / transparent)

**Steps:**
- [ ] **Step 1:** Wrap `{children}` in `relative z-10` in auth layout.
- [ ] **Step 2:** Change page roots from solid `bg-background` to `bg-background/80` or transparent so Waves show behind cards.
- [ ] **Step 3:** Ensure cards remain opaque/readable (`Card` surfaces unchanged).
- [ ] **Step 4:** Commit: `fix: restore Waves visibility behind auth cards`

**Acceptance criteria:**
- Waves visible around cards on sign-in/up/onboarding.
- Forms remain readable and above the background.
- Waves animation still runs for default users.

**Test checklist:**
- [ ] `/sign-in`, `/sign-up`, `/onboarding` — Waves visible, form usable
- [ ] Dark + light themes
- [ ] Reduce-motion: background still acceptable (static ok)

---

### Task 2: W-AUTH-03 — Password recovery resilience

**Scope:** Unify forgot/update shells; Suspense fallback; expired session CTA; resend + spam hint; readable password hint.

**Effort:** M (~1.5d)  
**Depends on:** Task 1  
**Files:**
- Modify: `app/(auth)/forgot-password/ForgotPasswordPage.tsx`, `page.tsx`
- Modify: `app/(auth)/update-password/UpdatePasswordPage.tsx`, `page.tsx`
- Modify: `components/ui/Logo.tsx` usage (linked logo)

**Steps:**
- [ ] **Step 1:** Align both pages to shared card shell (Logo link, heading scale, footer “Sign in”).
- [ ] **Step 2:** Add Suspense fallback = auth-card pulse skeleton.
- [ ] **Step 3:** Forgot success: resend with 60s cooldown + spam-folder line.
- [ ] **Step 4:** Update-password: on session/auth error, CTA to `/forgot-password`.
- [ ] **Step 5:** Hint `text-sm`; keep secondary color.
- [ ] **Step 6:** Commit: `fix: harden password recovery UX and shared auth shell`

**Acceptance criteria:**
- Forgot and update-password look like the same product family.
- Expired reset link is recoverable without guessing.
- Success state offers resend guidance.

**Test checklist:**
- [ ] Forgot → success UI → resend disabled briefly
- [ ] Open update-password without session → recovery CTA
- [ ] Suspense flash shows skeleton not blank

---

### Task 3: W-AUTH-05 — Auth form controls + mapped errors

**Scope:** Shared loading for OAuth/magic-link; 44px password toggles + terms hit area; inline terms error; plain-language auth errors.

**Effort:** M (~1.5d)  
**Depends on:** P0 W-PRIMITIVES-01, W-FEEDBACK-01  
**Files:**
- Modify: `app/(auth)/sign-in/SignInPage.tsx`
- Modify: `app/(auth)/sign-up/SignUpPage.tsx`
- Modify: `app/(auth)/update-password/UpdatePasswordPage.tsx`

**Steps:**
- [ ] **Step 1:** Single `authBusy` flag disables email + Google + magic-link while any path runs.
- [ ] **Step 2:** Password reveal controls `min-h-11 min-w-11`.
- [ ] **Step 3:** Terms checkbox row ≥44px; terms error under checkbox (not only banner).
- [ ] **Step 4:** Map common Supabase messages to short copy (invalid credentials, email taken, weak password).
- [ ] **Step 5:** Commit: `fix: harden auth form loading hit areas and error copy`

**Acceptance criteria:**
- No double-submit across auth methods.
- Touch-friendly password toggles and terms control.
- Errors are actionable plain language.

**Test checklist:**
- [ ] Click Google while email submitting — blocked or coordinated busy
- [ ] Mobile password toggle easy to hit
- [ ] Reject terms → inline error
- [ ] Wrong password → friendly message

---

### Task 4: W-AUTH-02 — Remember me honesty

**Scope:** Keep Switch; make copy match actual cookie/session behavior (default). Do not invent long-lived sessions unless product asks.

**Effort:** M (~1d including copy QA)  
**Depends on:** —  
**Files:**
- Modify: `app/(auth)/sign-in/SignInPage.tsx`
- Read: `lib/supabase/client.ts`

**Steps:**
- [ ] **Step 1:** Confirm current Supabase browser client session persistence.
- [ ] **Step 2:** If Switch does nothing: either remove Switch **or** keep it with accurate helper text (preferred default: keep + clarify, e.g. session follows browser sign-in).
- [ ] **Step 3:** If product later wants persistence toggle, wire storage options in a follow-up — out of this task’s default.
- [ ] **Step 4:** Commit: `fix: align Remember me copy with actual session behavior`

**Acceptance criteria:**
- UI does not promise behavior the client does not implement.
- Switch visual treatment preserved if kept.

**Test checklist:**
- [ ] Sign-in with Remember me on/off — behavior matches copy
- [ ] No console errors from unused state

---

### Task 5: W-AUTH-06 — Onboarding structure + finish fallback

**Scope:** Logo + Card + progress segments; in-step errors; `text-base` custom subject; saving/redirect fallback; keep step animejs.

**Effort:** M (~1.5d)  
**Depends on:** P0 W-AUTH-01, W-MOTION-01; Task 1  
**Files:**
- Modify: `app/(auth)/onboarding/OnboardingPage.tsx`
- Modify: `app/(auth)/onboarding/page.tsx` if needed

**Steps:**
- [ ] **Step 1:** Add Logo + short supporting line; wrap steps in `Card`.
- [ ] **Step 2:** Replace `{step} / 3` with 3-segment progress indicator.
- [ ] **Step 3:** Move error alert inside active step above actions.
- [ ] **Step 4:** Custom subject input `text-base`.
- [ ] **Step 5:** On Finish success: show “Saving…” / “Redirecting…”; timeout fallback link to `/dashboard` if navigation stalls.
- [ ] **Step 6:** Commit: `fix: clarify onboarding chrome progress and finish feedback`

**Acceptance criteria:**
- Onboarding matches auth trunk test (brand + card).
- Errors visible in-step.
- Finish never spins forever with no escape.

**Test checklist:**
- [ ] Steps 1–3 UI + progress
- [ ] Force finish error → message in card
- [ ] Successful finish → dashboard
- [ ] Step animation still runs when motion allowed

---

### Task 6: W-MARKETING-01 — Marketing chrome + CTA copy

**Scope:** Unified 44px header/footer links and Sign-in CTA; complete “No credit card required” copy.

**Effort:** S (~0.5d)  
**Depends on:** P0 W-PRIMITIVES-01  
**Files:**
- Modify: `app/page.tsx`
- Modify: `features/billing/components/PricingClient.tsx`
- Modify: `components/legal/MarketingFooter.tsx`

**Steps:**
- [ ] **Step 1:** Align landing + pricing header Sign-in: `rounded-xl min-h-11` + `btn-shine`.
- [ ] **Step 2:** Nav/footer links `min-h-11 inline-flex items-center`.
- [ ] **Step 3:** Expand truncated conversion point to full sentence.
- [ ] **Step 4:** Commit: `fix: normalize marketing nav hit areas and CTA copy`

**Acceptance criteria:**
- Marketing headers match each other.
- Footer/nav tappable on mobile.
- No truncated “No credit” string.

**Test checklist:**
- [ ] `/` and `/pricing` header Sign-in look identical
- [ ] Mobile footer links
- [ ] Landing CTA bullet full sentence

---

### Task 7: W-PRICING-01 — Checkout trust + semantics

**Scope:** Checkout error UI + `aria-busy`; billing toggle roles; tabular nums; tokenized Pro+ text; trial copy; keep MagicCard/spinner/UpgradePrompt motion. Reproduce any `toggleRef` runtime issue first.

**Effort:** L (~3d)  
**Depends on:** P0 W-PRIMITIVES-01; legal default copy approved in index  
**Files:**
- Modify: `features/billing/components/PricingClient.tsx`
- Modify: `components/ui/UpgradePrompt.tsx`
- Modify: `app/pricing/page.tsx` if needed
- Read: `lib/lemonsqueezy/checkout.ts`

**Steps:**
- [ ] **Step 1:** Smoke `/pricing` — fix any leftover runtime errors (e.g. undefined refs) before polish.
- [ ] **Step 2:** On checkout failure, show inline error under cards; `aria-busy` on loading buttons.
- [ ] **Step 3:** Refactor monthly/annual control to `tablist`/`tab` or radiogroup with `aria-selected`.
- [ ] **Step 4:** `tabular-nums` on prices; tokenized Pro+ text color.
- [ ] **Step 5:** Footer trial copy → “Paid plans include a 30-day free trial.”
- [ ] **Step 6:** UpgradePrompt: replace hardcoded hex/`font-nunito` with Manrope + tokens; keep entrance animejs.
- [ ] **Step 7:** Commit: `fix: make pricing checkout and billing toggle trustworthy`

**Acceptance criteria:**
- Failed checkout communicates clearly.
- Billing period control is semantically correct.
- Trial wording does not imply Free tier is a “trial”.
- MagicCard + shine + spinner preserved.

**Test checklist:**
- [ ] `/pricing` loads without console errors
- [ ] Toggle monthly/annual — layout stable (`tabular-nums`)
- [ ] Simulate checkout error — message appears
- [ ] Keyboard tabs through billing control
- [ ] SoftAurora still gated by PRM from P0

---

### Task 8: W-UPLOAD-01 — Honest upload copy

**Scope:** Default — change “Click or drag” to “Click to upload”. Do not implement DnD unless product reverses.

**Effort:** S–M (~0.5–1d)  
**Depends on:** —  
**Files:**
- Modify: `components/forms/DocumentUploadZone.tsx`
- Read: `hooks/useFileUpload.ts`

**Steps:**
- [ ] **Step 1:** Update user-visible copy to “Click to upload”.
- [ ] **Step 2:** Keep existing click/`transition-colors` behavior and 44px affordance.
- [ ] **Step 3:** Commit: `fix: align upload zone copy with click-only behavior`

**Acceptance criteria:**
- Copy matches capability.
- Upload still works via click.
- No motion removed.

**Test checklist:**
- [ ] Generate page upload zones show new copy
- [ ] File picker still works
- [ ] No dead drag handlers claiming support

---

### Task 9: W-LESSON-02 — Save / export status

**Scope:** Autosave status, export errors, back-link hit area, mobile-readable editor prose; keep border flash + export spinners.

**Effort:** M (~1.5d)  
**Depends on:** P0 W-LESSON-01, W-FEEDBACK-01  
**Files:**
- Modify: `features/lesson/components/LessonView.tsx`
- Modify: `features/lesson/components/SectionCard.tsx`
- Modify: `features/lesson/components/LessonEditor.tsx`
- Read: `hooks/useDebouncedLessonSave.ts`, `lib/download-blob.ts`

**Steps:**
- [ ] **Step 1:** Expose saving/saved/error from debounced save to header status text.
- [ ] **Step 2:** Optionally trigger existing green border flash after successful debounced save.
- [ ] **Step 3:** On export `!response.ok`, show inline error (no silent return).
- [ ] **Step 4:** Back link `min-h-11 inline-flex items-center`.
- [ ] **Step 5:** Editor `prose-base sm:prose-sm`.
- [ ] **Step 6:** Commit: `fix: surface lesson autosave and export status`

**Acceptance criteria:**
- User can see save progress without leaving the page.
- Failed export explains failure.
- Mobile editor text ≥16px feel.

**Test checklist:**
- [ ] Edit text → “Saving…” → “Saved”
- [ ] Kill network on export → error message
- [ ] Back link easy to tap on mobile
- [ ] Toolbar edit from P0 still intact

---

## P1 exit criteria

- [ ] All Task 1–9 acceptance criteria met
- [ ] Auth Waves visible; recovery resilient
- [ ] Pricing trustworthy and error-free load
- [ ] Upload copy honest
- [ ] Lesson status visible
- [ ] No audited effect removed

## Self-review coverage

| Work item | Task |
| --- | --- |
| W-AUTH-04 | 1 |
| W-AUTH-03 | 2 |
| W-AUTH-05 | 3 |
| W-AUTH-02 | 4 |
| W-AUTH-06 | 5 |
| W-MARKETING-01 | 6 |
| W-PRICING-01 | 7 |
| W-UPLOAD-01 | 8 |
| W-LESSON-02 | 9 |

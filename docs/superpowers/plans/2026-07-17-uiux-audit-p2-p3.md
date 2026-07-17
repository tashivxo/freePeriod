# UI/UX Audit P2–P3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish token consumer cleanup, legal wayfinding, dashboard discovery, and low-severity effect polish after P0/P1.

**Architecture:** Tokens finalize remaining consumers; legal TOC is presentation-only; dashboard uses shared Button; effects add fallbacks without removing SpotlightCard/MagicCard/HeroPictogram.

**Tech Stack:** Same as P0/P1.

**Prerequisites:** P0 complete; P1 W-PRIMITIVES consumers and W-MOTION-01 complete before W-EFFECTS-01.  
**Backlog:** [`../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md`](../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md)  
**Index:** [`2026-07-17-uiux-audit-plans-index.md`](./2026-07-17-uiux-audit-plans-index.md)

**Sequence:**

```text
T1 W-TOKENS-01 (remaining consumers)
 → T2 W-DASHBOARD-01 || T3 W-LEGAL-01
 → T4 W-EFFECTS-01
```

**Phase effort:** ~5 engineer-days (P2 ~3.5d + P3 ~1.5d).

**Motion constraint:** No flattening; keep skeleton pulse, shine, ambient treatments, pointer gradients (with fallbacks).

---

### Task 1: W-TOKENS-01 — Remaining token consumers

**Scope:** Finish what P0 foundation started — Card/Input borders, any leftover gray skeletons, JSON↔CSS parity audit.

**Effort:** M (~1.5d) if P0 Task 0 already landed foundation; otherwise include P0 Task 0 here first.  
**Depends on:** P0 Task 0 preferred  
**Files:**
- Modify: `app/globals.css`, `assets/design-tokens.json`
- Modify: `components/ui/card.tsx`, `components/ui/Input.tsx`, `components/ui/skeleton.tsx`
- Sweep: history/settings/dashboard skeletons still on gray utilities

**Steps:**
- [ ] **Step 1:** Diff `design-tokens.json` vs `globals.css` — fix remaining drifts (border-coral focus, card ring vs `border-border`).
- [ ] **Step 2:** Update Card/Input to semantic tokens without killing elevation.
- [ ] **Step 3:** Grep `bg-gray-` in `app/` and `features/` — replace loading skeletons.
- [ ] **Step 4:** Commit: `fix: finish design token consumer alignment`

**Acceptance criteria:**
- No orphaned gray skeleton utilities on audited app pages.
- Card/Input match token docs.
- Motion/elevation language unchanged.

**Test checklist:**
- [ ] Grep clean for `bg-gray-200` in app feature UI
- [ ] Light/dark card + input focus look branded
- [ ] Spot-check dashboard/history/settings/generate

---

### Task 2: W-DASHBOARD-01 — History discoverability + Button asChild

**Scope:** Persistent History link when lessons exist; CTAs use `Button asChild` + keep `btn-shine`.

**Effort:** S (~0.5d)  
**Depends on:** P0 W-PRIMITIVES-01  
**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Read: `components/ui/Button.tsx`

**Steps:**
- [ ] **Step 1:** Show History link whenever `lessons.length > 0` (not only ≥9).
- [ ] **Step 2:** Replace raw shinylinks with `<Button asChild className="btn-shine …"><Link/></Button>` (or equivalent).
- [ ] **Step 3:** Commit: `fix: keep dashboard history link and shared Button CTAs`

**Acceptance criteria:**
- Users with 1–8 lessons can reach History from dashboard.
- CTAs get shared press/focus behavior; shine remains.

**Test checklist:**
- [ ] Account with few lessons — History visible
- [ ] Empty dashboard — Generate CTA still primary
- [ ] Button press scale from P0 still applies

---

### Task 3: W-LEGAL-01 — TOC + contrast + single date

**Scope:** Anchored TOC; body `text-text-primary`; one effective-date source. Content wording stays legal-owned.

**Effort:** M (~1.5d)  
**Depends on:** Legal review if changing visible date label  
**Files:**
- Modify: `components/legal/LegalDocumentShell.tsx`
- Modify: `components/legal/PrivacyPolicyContent.tsx`
- Modify: `components/legal/TermsOfServiceContent.tsx`
- Modify: `app/privacy/page.tsx`, `app/terms/page.tsx`
- Read: `lib/legal/config.ts`

**Steps:**
- [ ] **Step 1:** Add `id`s to each major `<h2>`; render compact TOC at top of article.
- [ ] **Step 2:** Body paragraphs/lists use primary text; keep secondary for captions/meta.
- [ ] **Step 3:** Remove duplicate effective-date from content **or** shell — single source via `lib/legal/config.ts`.
- [ ] **Step 4:** Commit: `fix: add legal TOC and unify effective date display`

**Acceptance criteria:**
- Jump links work for major sections.
- Long-form contrast meets reading floor.
- Date appears once.

**Test checklist:**
- [ ] `/privacy` and `/terms` TOC jumps
- [ ] Only one “last updated / effective” line
- [ ] Mobile TOC usable

---

### Task 4: W-EFFECTS-01 — Coarse pointer + will-change

**Scope:** SpotlightCard/MagicCard fallbacks for touch/keyboard; clear HeroPictogram `will-change` after entrance; keep all effects.

**Effort:** M (~1.5d)  
**Depends on:** P0 W-MOTION-01  
**Files:**
- Modify: `components/ui/SpotlightCard.tsx`
- Modify: `components/ui/magic-card.tsx`
- Modify: `components/animations/HeroPictogram.tsx`
- Touch: `app/page.tsx`, `components/animations/GenerationScreen.tsx` if pictogram shared

**Steps:**
- [ ] **Step 1:** SpotlightCard: `pointermove` + `:focus-within` static center glow for keyboard.
- [ ] **Step 2:** MagicCard: coarse-pointer static gradient at rest; keep hover follow on fine pointers.
- [ ] **Step 3:** HeroPictogram: remove persistent `willChange` after entrance completes; keep breathe loop.
- [ ] **Step 4:** Commit: `fix: refine spotlight magic-card and pictogram performance fallbacks`

**Acceptance criteria:**
- Touch/keyboard users get some glow affordance.
- Effects still present for mouse users.
- No permanent `will-change` tax after load.

**Test checklist:**
- [ ] Landing features: tab into card — visible focus glow
- [ ] Pricing cards on touch device — not completely flat
- [ ] Hero pictogram still breathes with motion enabled
- [ ] PRM paths from P0 still hide/soften correctly

---

## P2–P3 exit criteria

- [ ] Token drift closed for audited surfaces
- [ ] Legal navigable
- [ ] Dashboard History always reachable when lessons exist
- [ ] Effect fallbacks landed; no effects removed
- [ ] Full audit backlog W-* items marked done across P0–P3

## Self-review coverage

| Work item | Task |
| --- | --- |
| W-TOKENS-01 | 1 |
| W-DASHBOARD-01 | 2 |
| W-LEGAL-01 | 3 |
| W-EFFECTS-01 | 4 |

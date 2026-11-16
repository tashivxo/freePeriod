# Defect 03 — In-app support & feedback

**Branch:** `feat/support-feedback`  
**PR base:** `dev`  
**Owner:** Arham

**Support email:** `support@freeperiod.co.za` (also default in `lib/legal/config.ts` via `LEGAL_CONTACT_EMAIL`).

---

## Problem statement

Teachers using FreePeriod have no **in-product** way to report bugs, send product feedback, or reach support without leaving the app context. Marketing footers and legal pages are not enough for a SaaS where issues surface during generation, billing, or account management.

---

## Severity

**Medium (retention / ops)** — users may churn or complain publicly when blocked; support lacks structured context (plan, page, user id).

---

## Phase 1 for this ticket (required before heavy build)

1. **Audit** current touchpoints (below).
2. **Propose** one SaaS-appropriate UX + technical approach.
3. **List open questions** for Tashiv.
4. **Implement** only after Tashiv agrees on the proposal (reply in PR or Slack)—unless README explicitly tells you to ship a minimal v1; default: **diagnosis + proposal in PR comment**, then implementation in same branch or follow-up PR.

---

## Current state audit (codebase snapshot)

Fill in “Verified in app?” column during your pass.

| Touchpoint | Location | What it does |
|------------|----------|--------------|
| Contact mailto | `components/legal/MarketingFooter.tsx` | `mailto:${legalConfig.contactEmail}` on marketing pages |
| Legal email links | `components/legal/PrivacyPolicyContent.tsx`, `components/legal/TermsOfServiceContent.tsx` | Mailto to `contactEmail` |
| Config | `lib/legal/config.ts` | `contactEmail: process.env.LEGAL_CONTACT_EMAIL ?? 'support@freeperiod.co.za'` |
| Settings | `app/(app)/settings/SettingsClient.tsx` | Profile, account, legal links — **no support link** |
| App nav | `components/layout/Navbar.tsx` | Dashboard, Generate, History, Settings — **no help** |
| Dedicated routes | _none found_ | No `/help`, `/contact`, or `/support` app routes |
| Error / empty states | e.g. `features/generate/components/GenerateClient.tsx`, `lib/generation/map-error.ts` | User-facing errors — **audit for “contact support” CTA** |

**Investigation steps**

1. Grep: `rg -i "support@|contactEmail|mailto:|feedback|help" app components lib features`
2. Click through logged-in flows: generate failure, billing/checkout error (`PricingClient`), settings, history empty state.
3. Read backlog **W-FEEDBACK-01** / **W-SETTINGS-01** in `docs/superpowers/specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md` for alignment.
4. Document gaps in **Audit additions** below.

### Audit additions (fill in)

| User moment | File / route | Has support path? | Notes |
|-------------|--------------|-------------------|-------|
| | | | |

---

## Options to evaluate

| Option | Pros | Cons | Fit for FreePeriod |
|--------|------|------|---------------------|
| **A. Settings “Help & feedback”** — category select (Bug / Feedback / Billing) + message + optional screenshot later | In-app, authenticated context | Needs delivery mechanism | Strong default for SaaS |
| **B. `mailto:` with structured subject** — e.g. `mailto:support@…?subject=[Bug][FreePeriod][plan]` + body template | Fast, no backend | No guarantee mail client exists; weak on mobile web; no ticket trail | OK as **fallback** only |
| **C. Public `/support` page** | SEO, shareable | Still leaves app; less context | Good supplement, not primary |
| **D. API route + email** — `POST /api/support` using Resend/SendGrid/Postmark | Professional, captures metadata server-side | Requires provider API key, spam/abuse controls | Best long-term if keys available |
| **E. Third-party widget** (Crisp, Intercom, Plain) | Rich inbox | Cost, privacy policy, CSP | Only if product chooses vendor |

**Recommendation template (complete in PR):**

- **Chosen approach:** _A + D_ / _A + B fallback_ / etc.
- **Rationale:** _context capture, eng effort, alignment with stack (Next.js API routes, Supabase session)_
- **v1 scope:** _what you will NOT do yet (attachments, status page, etc.)_

---

## Proposed SaaS-appropriate UX (draft for discussion)

**Primary:** Settings section **Help & feedback**

- Short copy: “We typically reply within X business days.”
- Fields: Category (Bug | Idea | Billing | Account), Message (required), optional “Include diagnostic info” checkbox (app version, plan, locale, current path—no lesson content without consent).
- Submit → success toast; clear error if delivery fails.
- Link visible from:
  - Settings (required for v1)
  - Optional v1.1: footer of generation error panel, checkout error in `PricingClient`

**Secondary:** Keep marketing footer mailto for logged-out users.

**Subject line convention (if using email):**  
`[FreePeriod][Category][plan] User subject` — helps support filter in Gmail.

---

## Technical approach sketch

### If API route (preferred for v1 shippable)

1. `app/api/support/route.ts` — `POST`, require Supabase session (`createClient` server).
2. Validate body with zod (category enum, message min/max length).
3. Rate limit per user id (simple in-memory or DB counter—discuss with Tashiv).
4. Send email via chosen provider **or** forward to `support@freeperiod.co.za` using existing infra if any (grep `.env.local.example` for email vars).
5. Client: small form in `SettingsClient.tsx` or `components/support/SupportFeedbackForm.tsx`.

### If mailto-only v1

- Build form UI that composes `mailto:` URL (encode subject/body).
- Document limitations in PR; still add Settings entry point.

### Security / privacy

- Never put service role keys in client.
- Do not auto-attach lesson text or uploads; optional explicit checkbox for “include last error code”.
- Sanitize user input before email HTML.

---

## Open questions for Tashiv

- [ ] Is there an existing transactional email provider/env var for FreePeriod (Resend, etc.)?
- [ ] Should v1 **require login**, or also support logged-out contact?
- [ ] Preferred categories and SLA copy?
- [ ] Is a public `/support` page in scope for v1 or later?
- [ ] Any compliance constraints (POPIA) on what diagnostic metadata we may attach?

---

## Acceptance criteria — first shippable version

After agreement on approach:

- [ ] Authenticated users can reach **Help & feedback** from **Settings** without hunting marketing pages.
- [ ] Submission includes **category** + **message** and reaches `support@freeperiod.co.za` (via API email or documented mailto flow).
- [ ] Submission includes useful context: user email (from session), plan/tier if available, locale, and page URL/path.
- [ ] Loading, success, and error states follow **W-FEEDBACK-01** (inline / toast—not blocking `alert()`).
- [ ] i18n: at minimum `en.ts`; mirror other locales if settings strings do.
- [ ] Basic abuse protection (auth required + reasonable rate limit or honeypot).
- [ ] Unit test for form validation and/or API route auth rejection.
- [ ] Privacy: no lesson body/content sent by default.

---

## Testing notes

- Manual: submit as Free and Pro (or trial) user; verify email/metadata.
- Unit/API: unauthorized `POST` → 401; invalid payload → 400.
- E2E: optional smoke—“open settings, open help, submit” if stable selectors exist.

---

## Git workflow

```bash
git checkout dev && git pull origin dev
git checkout -b feat/support-feedback
# Phase 1: commit audit + proposal (markdown updates in arham/ optional)
# Phase 2: implementation after approval
gh pr create --base dev --title "feat(support): in-app feedback from settings"
```

---

## Definition of done

- Audit table completed
- Written recommendation + Tashiv sign-off
- Shippable v1 merged to `dev` per acceptance criteria

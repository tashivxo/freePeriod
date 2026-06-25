# FreePeriod — Privacy & Terms Compliance Checklist

Living checklist for privacy policy, terms of service, and related compliance work.  
Last updated: 25 June 2026.

---

## Quick status

| Area | Status |
|------|--------|
| Privacy Policy page (`/privacy`) | Done |
| Terms of Service page (`/terms`) | Done |
| Footer / sign-up links | Done |
| Account deletion flow | Done (needs migration + cron) |
| Legal config / env overrides | Done |
| Build fix (`deletion_scheduled_at` type) | Done |
| Contact email `info@freeperiod.co.za` | Config updated — mailbox still needed |
| Lawyer review | Not done |
| Production env + cron | Not done |

---

## Infrastructure (confirmed)

> Regions confirmed via Supabase / Vercel dashboards (June 2026). Re-verify if you move projects.

- [x] **Supabase region:** `eu-north-1` (Stockholm, EU) — disclose as EU data storage in privacy policy
- [x] **Vercel region:** `iad1` (Washington DC, US East) — disclose as hosting/CDN in privacy policy
- [ ] **Supabase project ref:** confirm active project in dashboard (refs may differ between envs)

---

## Legal identity & contact

Configure via `lib/legal/config.ts` or env vars.

- [ ] **Operator name** — set `LEGAL_OPERATOR_NAME` (e.g. your full name: "FreePeriod, operated by …")
- [x] **Trading name:** FreePeriod
- [x] **Physical address:** 17 San Te Fe, Seaward Estates, Ballito, KwaZulu-Natal, South Africa
- [x] **Contact email in code:** `info@freeperiod.co.za` (default in `legalConfig`)
- [ ] **Set up `info@freeperiod.co.za`** — create mailbox or forwarding to your personal inbox
- [ ] **Registration number:** not yet incorporated — policy notes trading as FreePeriod

---

## Outstanding decisions (blocking final policy sign-off)

- [x] **Data retention:** Option C — 30-day grace period (implemented in code + policies)
- [ ] **Payment processor at launch** — pick and align policy + checkout:
  - [x] Stripe (checkout still live in `app/api/checkout/route.ts`) — **current default in policies**
  - [ ] Lemon Squeezy only (migration in progress — `lib/lemonsqueezy/`, migration `003_lemon_squeezy_subscriptions.sql`)
  - [ ] Both during transition (update `legalConfig.paymentProcessor` and policy copy)
- [ ] **Your full name** for the legal operator field (`LEGAL_OPERATOR_NAME`)

---

## Build & deployment

### TypeScript fix (was blocking Vercel)

**Failed deployment:** commit "privacy policy in progresss"  
**Error:** `deletion_scheduled_at` required on `users` Insert type but missing from `.upsert()` calls.

- [x] **Fixed:** `deletion_scheduled_at` marked optional on Insert in `types/database.ts`
- [ ] **Verify:** run `npm run build` locally and redeploy to Vercel

### Pre-deploy

- [ ] `npm run build` passes
- [ ] `/privacy` and `/terms` render on preview URL
- [ ] Sign-up checkbox works
- [ ] Settings delete-account flow tested on staging

---

## Privacy Policy (`/privacy`)

### Published & linked

- [x] Page at `app/privacy/page.tsx`
- [x] Content in `components/legal/PrivacyPolicyContent.tsx`
- [x] Linked from `MarketingFooter` (home, pricing, legal pages)
- [x] Linked from sign-up checkbox
- [ ] Optional: link from Settings account section

### Content accuracy

- [x] Account, profile, lesson plans, uploads, usage, billing, cookies
- [x] Third parties: Supabase, Anthropic, Google, Stripe, Vercel
- [x] Supabase `eu-north-1` + Vercel `iad1` regional disclosure
- [x] International transfers (EU DB + US hosting/AI/payments)
- [x] No marketing cookies at launch
- [x] 30-day deletion grace (Option C)
- [x] POPIA + GDPR rights
- [x] Contact: `info@freeperiod.co.za`
- [ ] Update if payment processor changes to Lemon Squeezy
- [ ] Lawyer review

---

## Terms of Service (`/terms`)

### Published & linked

- [x] Page at `app/terms/page.tsx`
- [x] Content in `components/legal/TermsOfServiceContent.tsx`
- [x] Linked from footer + sign-up
- [ ] Optional: link from Settings

### Content accuracy

- [x] Service description, eligibility, accounts, subscriptions
- [x] User content ownership + AI disclaimer
- [x] Acceptable use, liability, SA governing law
- [x] Stripe billing disclosure
- [x] 30-day deletion grace
- [x] Contact: `info@freeperiod.co.za`
- [ ] Update billing section if switching to Lemon Squeezy
- [ ] Lawyer review

---

## In-app consent

- [x] Sign-up checkbox: Terms + Privacy (required)
- [x] Google sign-up: "By continuing with Google, you agree…"
- [x] Footer links on marketing pages
- [ ] Cookie consent banner — **not needed** (no analytics/marketing cookies)
- [ ] Optional: policies link in Settings

---

## Account deletion flow

### Implemented

- [x] `POST /api/user/delete` — schedules deletion, cancels Stripe sub, bans auth user
- [x] Settings UI: Delete account + type `DELETE` to confirm
- [x] `deletion_scheduled_at` column — migration `supabase/migrations/004_account_deletion.sql`
- [x] Middleware blocks accounts with scheduled deletion
- [x] `GET /api/cron/purge-deletions` — hard-deletes after grace period
- [x] 30-day grace in `lib/legal/config.ts`

### Still to do

- [ ] **Run migration** `004_account_deletion.sql` in production Supabase
- [ ] Set `CRON_SECRET` in Vercel
- [ ] Schedule daily cron → `/api/cron/purge-deletions` with `Authorization: Bearer <CRON_SECRET>`
- [ ] End-to-end test: user with uploads + active Stripe subscription
- [ ] Process for immediate deletion requests (email to `info@freeperiod.co.za`)
- [ ] Optional: confirmation email on deletion request

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `LEGAL_OPERATOR_NAME` | Optional | Named operator on policies |
| `LEGAL_CONTACT_EMAIL` | Recommended | Default: `info@freeperiod.co.za` |
| `LEGAL_PHYSICAL_ADDRESS` | Optional | Override address |
| `LEGAL_SUPABASE_REGION` | Optional | Default: eu-north-1 (Stockholm, EU) |
| `LEGAL_VERCEL_REGION` | Optional | Default: iad1 (Washington DC, US) |
| `LEGAL_DATA_REGION` | Optional | Override combined transfers text |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical site URL |
| `CRON_SECRET` | Yes (for purge) | Protects deletion purge endpoint |

See `.env.local.example`.

---

## Third-party processors

| Processor | Purpose | Data location | Policy |
|-----------|---------|---------------|--------|
| Supabase | Auth, DB, file storage | eu-north-1 (EU) | Named + region |
| Anthropic | Claude (paid generation) | US | Named |
| Google | Gemini (free) + OAuth | US | Named |
| Stripe | Checkout / subscriptions | US | Named (default) |
| Lemon Squeezy | Checkout (migration) | US | Update when live |
| Vercel | Hosting, CDN, logs | iad1 (US) | Named + region |

- [ ] Confirm Supabase DPA / processor terms in dashboard
- [ ] Confirm Anthropic + Google API terms
- [ ] Confirm Stripe terms; update if switching to Lemon Squeezy

---

## Google OAuth

- [x] Removed unused `drive.readonly` scope from sign-in and sign-up
- [ ] Google Cloud Console: remove Drive scope from OAuth consent screen if added
- [ ] Verify consent screen lists only: email, profile, openid

---

## POPIA security (Condition 7)

- [x] HTTPS (Vercel)
- [x] Supabase RLS on user tables
- [x] Private `uploads` storage bucket
- [ ] Service role key server-only (never in client)
- [ ] Access control on Supabase / Vercel / Stripe dashboards
- [ ] Breach notification plan (POPIA)

---

## App store (when applicable)

- [ ] Apple: Privacy Policy URL `https://freeperiod.co.za/privacy`
- [ ] Apple: Privacy nutrition labels match policy
- [ ] Google Play: Privacy URL + Data safety form

---

## File reference

```
lib/legal/config.ts                    — legal constants + env overrides
components/legal/PrivacyPolicyContent.tsx
components/legal/TermsOfServiceContent.tsx
components/legal/LegalDocumentShell.tsx
components/legal/MarketingFooter.tsx
app/privacy/page.tsx
app/terms/page.tsx
app/api/user/delete/route.ts
app/api/cron/purge-deletions/route.ts
lib/account/delete-user.ts
supabase/migrations/004_account_deletion.sql
types/database.ts                      — User + deletion_scheduled_at types
docs/compliance-checklist.md           — this file
```

---

## Pre-launch gate (minimum)

1. [x] Build error fixed (`deletion_scheduled_at` Insert type)
2. [ ] `npm run build` passes + Vercel deploy green
3. [ ] Operator name set (`LEGAL_OPERATOR_NAME`)
4. [x] Data retention: Option C (30-day grace)
5. [ ] Payment processor confirmed in policy vs checkout
6. [ ] `info@freeperiod.co.za` receiving email
7. [x] `/privacy` and `/terms` implemented
8. [x] Footer + sign-up consent
9. [x] Google Drive OAuth scope removed from code
10. [ ] Migration `004` applied in production
11. [ ] Deletion cron scheduled
12. [ ] Lawyer review (recommended)

---

## Ongoing maintenance

- [ ] Update policies when adding analytics, new AI providers, or mobile app
- [ ] Bump `effectiveDate` in `lib/legal/config.ts` for material changes
- [ ] Annual compliance skim (POPIA; GDPR Art. 27 if EU users grow)

---

## Notes

- Policies are codebase-tailored drafts, not legal advice.
- Primary law: **POPIA** (South Africa). Also **GDPR** (EU users) and **CCPA** (California) as audience grows.
- **Data residency:** user content in Supabase EU (`eu-north-1`); app execution/logs on Vercel US (`iad1`); AI and payments largely US.

# FreePeriod — Privacy & Terms Compliance Checklist

Living checklist for privacy policy, terms of service, and related compliance work.  
Last updated: 22 June 2026.

---

## Quick status

| Area | Status |
|------|--------|
| Privacy Policy page (`/privacy`) | Done |
| Terms of Service page (`/terms`) | Done |
| Footer / sign-up links | Done |
| Account deletion flow | Done (needs migration + cron) |
| Legal config / env overrides | Done |
| Lawyer review | Not done |
| Production env + cron | Not done |

---

## 1. Legal identity & contact details

These appear in both policies. Configure via `lib/legal/config.ts` or env vars.

- [ ] **Operator name** — set `LEGAL_OPERATOR_NAME` if you want a named operator (e.g. your full name). Default: `FreePeriod` trading name only.
- [ ] **Contact email** — set `LEGAL_CONTACT_EMAIL` to a real, monitored inbox. Default: `hello@freeperiod.co.za`.
  - [ ] Optional: set up `privacy@freeperiod.co.za` (forwarding to your inbox is fine).
  - [ ] Optional: set up `support@freeperiod.co.za`.
- [x] **Physical address** — `17 San Te Fe, Seaward Estates, Ballito, KwaZulu-Natal, South Africa` (in config; override with `LEGAL_PHYSICAL_ADDRESS` if needed).
- [ ] **Company registration** — not required yet; add to policies when/if you incorporate (e.g. FreePeriod (Pty) Ltd + reg number).
- [ ] **Effective date** — currently `22 June 2026` in `lib/legal/config.ts`; bump when you materially change policies.

---

## 2. Privacy Policy (`/privacy`)

### Published & linked

- [x] Page at `app/privacy/page.tsx`
- [x] Content in `components/legal/PrivacyPolicyContent.tsx`
- [x] Linked from `MarketingFooter` (home, pricing, legal pages)
- [x] Linked from sign-up checkbox
- [ ] Linked from sign-in page (optional — not required if sign-up covers new users)
- [ ] Linked from app Settings (optional nice-to-have)

### Content accuracy (verify against codebase)

- [x] Account data: email, name, auth credentials, profile preferences
- [x] User content: lesson plans, uploads (PDF/DOCX/XLSX), parsed text, prompts
- [x] Billing metadata via Stripe (no card storage on our servers)
- [x] Third parties: Supabase, Anthropic, Google (Gemini + OAuth), Stripe, Vercel
- [x] No marketing/analytics cookies at launch
- [x] Essential auth cookies (Supabase session)
- [x] 30-day account deletion grace period (Option C)
- [x] POPIA + GDPR rights section
- [x] Children / not directed at under-13s
- [x] Cross-border transfers disclosure
- [ ] **Supabase data region** — check Dashboard → Project Settings → General; set `LEGAL_DATA_REGION` env var and confirm policy wording matches (e.g. `United States (us-east-1)` or `EU (eu-west-1)`).
- [ ] **Payment processor** — policy says Stripe. Update if/when you fully switch to Lemon Squeezy (`lib/legal/config.ts` → `paymentProcessor` + policy copy).
- [ ] **Google OAuth** — policy reflects `openid email profile` only (Drive scope removed from code).

### Review

- [ ] Read full policy on staging/production URL
- [ ] Sanity check with a lawyer (recommended before marketing to EU users at scale)
- [ ] Fix any typos or business-specific gaps

---

## 3. Terms of Service (`/terms`)

### Published & linked

- [x] Page at `app/terms/page.tsx`
- [x] Content in `components/legal/TermsOfServiceContent.tsx`
- [x] Linked from `MarketingFooter`
- [x] Linked from sign-up checkbox (+ Google sign-up notice)
- [ ] Linked from Settings (optional)

### Content accuracy

- [x] Service description (AI lesson planning, uploads, exports)
- [x] Eligibility (18+, educators)
- [x] Subscriptions: Free / Pro / Pro+ aligned with pricing page
- [x] Stripe billing disclosure
- [x] User content ownership + licence to process for the Service
- [x] AI output disclaimer (draft only; teacher responsible)
- [x] Acceptable use
- [x] Account deletion (30-day grace)
- [x] Limitation of liability & disclaimers
- [x] Governing law: Republic of South Africa
- [ ] Update billing section if switching to Lemon Squeezy
- [ ] Confirm refund policy matches what you actually offer

### Review

- [ ] Read full terms on staging/production URL
- [ ] Lawyer review (recommended)

---

## 4. In-app UX & consent

- [x] Sign-up requires checkbox: “I agree to Terms and Privacy Policy”
- [x] Google sign-up shows “By continuing with Google, you agree…”
- [x] Footer links on marketing pages (home, pricing, legal)
- [ ] Cookie consent banner — **not needed at launch** (no GA/Mixpanel). Revisit if you add analytics or ad trackers.
- [ ] Email signup confirmation / welcome email mentioning policies (optional)
- [ ] In-app “Privacy” link in Settings (optional)

---

## 5. Data subject rights & account deletion

### Implemented

- [x] `POST /api/user/delete` — schedules deletion, cancels Stripe sub, bans auth user
- [x] Settings UI: Delete account + type `DELETE` to confirm
- [x] `deletion_scheduled_at` on `users` table (migration `004_account_deletion.sql`)
- [x] Middleware blocks accounts with scheduled deletion
- [x] `GET /api/cron/purge-deletions` — hard-deletes due accounts (storage + auth user)
- [x] 30-day grace period in `lib/legal/config.ts`

### Still to do

- [ ] **Run migration** `supabase/migrations/004_account_deletion.sql` in Supabase SQL editor
- [ ] Set `CRON_SECRET` in Vercel / `.env.local`
- [ ] Schedule daily cron to hit `/api/cron/purge-deletions` with `Authorization: Bearer <CRON_SECRET>`
- [ ] Test full deletion flow on staging:
  - [ ] User with lesson plans + uploads
  - [ ] User with active Stripe subscription
  - [ ] User cannot sign in after deletion request
  - [ ] Data purged after grace period (or manually trigger cron)
- [ ] Document process for **immediate deletion** requests (email to contact address)
- [ ] Document process for **data export** requests before deletion (user can export DOCX from app; formal SAR process via email)
- [ ] Email notification when deletion is requested (not implemented yet — optional)

---

## 6. Environment variables

Add to `.env.local` and Vercel production/preview as needed.

| Variable | Required | Purpose |
|----------|----------|---------|
| `LEGAL_OPERATOR_NAME` | Optional | Named operator on policies |
| `LEGAL_CONTACT_EMAIL` | Recommended | Privacy/legal contact email |
| `LEGAL_PHYSICAL_ADDRESS` | Optional | Override address in policies |
| `LEGAL_DATA_REGION` | Recommended | Supabase hosting region for privacy disclosure |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical site URL in policies |
| `CRON_SECRET` | Yes (for purge) | Protects deletion purge endpoint |

See `.env.local.example` for comments.

---

## 7. Third-party & processor disclosures

Ensure privacy policy stays in sync if any of these change.

| Processor | Data shared | Policy section |
|-----------|-------------|----------------|
| Supabase | Auth, DB, file storage | §4 AI and third-party processors |
| Anthropic | Lesson prompts + curriculum text (paid plans) | §4 |
| Google | Gemini (free tier); OAuth profile (sign-in) | §4 |
| Stripe | Payment processing, subscription metadata | §2 Payment; §4 |
| Vercel | Hosting, server logs | §4 |

- [ ] Confirm Supabase DPA / processor terms accepted in Supabase dashboard
- [ ] Confirm Anthropic API terms allow your use case
- [ ] Confirm Google Cloud / Gemini terms
- [ ] Confirm Stripe terms + privacy policy link in your checkout flow
- [ ] When migrating to Lemon Squeezy: update checkout, webhooks, DB columns, policies, and this checklist

---

## 8. OAuth & permissions

- [x] Removed unused `drive.readonly` Google scope from sign-in and sign-up
- [ ] In Google Cloud Console: remove Drive API scope from OAuth consent screen if it was added
- [ ] Verify OAuth consent screen lists only: email, profile, openid

---

## 9. Security & POPIA conditions (policy claims)

Policy states reasonable measures — ensure reality matches:

- [x] HTTPS (Vercel)
- [x] Supabase RLS on user tables
- [x] Private storage bucket for uploads
- [ ] Service role key only on server (never exposed to client)
- [ ] Regular review of who has Supabase / Vercel / Stripe dashboard access
- [ ] Incident response plan if breach occurs (notify users + regulator where required)

---

## 10. App store & distribution (when applicable)

### Apple App Store

- [ ] Privacy Policy URL: `https://freeperiod.co.za/privacy`
- [ ] App Privacy “nutrition labels” — match data types in §2 of privacy policy
- [ ] Terms URL if required for subscriptions

### Google Play

- [ ] Privacy Policy URL in Play Console
- [ ] Data safety form aligned with privacy policy

### Web launch

- [x] Policies live at public URLs (no auth required)
- [ ] URLs submitted anywhere you list the product (Product Hunt, directories, etc.)

---

## 11. Ongoing maintenance

- [ ] Review policies when you add: analytics, new AI providers, new data fields, mobile app, team features, API access
- [ ] Bump `effectiveDate` and notify users for material changes
- [ ] Keep `docs/compliance-checklist.md` updated when implementation changes
- [ ] Annual compliance skim (POPIA Information Regulator guidance, GDPR if EU users grow)

---

## 12. File reference

| File | Purpose |
|------|---------|
| `lib/legal/config.ts` | Central legal constants + env overrides |
| `components/legal/PrivacyPolicyContent.tsx` | Privacy Policy body |
| `components/legal/TermsOfServiceContent.tsx` | Terms of Service body |
| `components/legal/LegalDocumentShell.tsx` | Shared legal page layout |
| `components/legal/MarketingFooter.tsx` | Footer with policy links |
| `app/privacy/page.tsx` | Privacy route |
| `app/terms/page.tsx` | Terms route |
| `app/api/user/delete/route.ts` | Account deletion API |
| `app/api/cron/purge-deletions/route.ts` | Scheduled purge cron |
| `lib/account/delete-user.ts` | Deletion + purge logic |
| `supabase/migrations/004_account_deletion.sql` | `deletion_scheduled_at` column |
| `lib/supabase/middleware.ts` | Public routes + blocked deleted accounts |

---

## 13. Pre-launch gate (minimum)

Before linking policies in marketing or app stores:

1. [ ] Migration `004` applied in production Supabase
2. [ ] `LEGAL_CONTACT_EMAIL` points to a monitored inbox
3. [ ] `LEGAL_DATA_REGION` set correctly
4. [ ] Deletion flow tested end-to-end on staging
5. [ ] Cron purge scheduled with `CRON_SECRET`
6. [ ] Policies reviewed at `https://freeperiod.co.za/privacy` and `/terms`
7. [ ] Lawyer review (strongly recommended; not a substitute for this checklist)

---

## Notes

- Policies are **drafts tailored to the codebase**, not legal advice.
- Primary law: **POPIA** (South Africa). Also consider **GDPR** (EU users) and **CCPA** (California) as audience grows.
- Default retention: **Option C** — 30-day soft delete, then permanent purge.

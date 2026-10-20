# Arham — FreePeriod defect onboarding

Welcome. This folder is your working area for **four assigned defects** plus a log for anything else you find while shipping fixes.

**Product context:** [FreePeriod](https://freeperiod.co.za) is a Next.js 16 (App Router) AI lesson planner for teachers. Auth and data live in Supabase; billing uses Lemon Squeezy. Local dev: see root [`AGENTS.md`](../AGENTS.md) and `npm run dev` (port 3000).

---

## Your assigned work

| # | Defect | Doc | Suggested branch |
|---|--------|-----|------------------|
| 1 | Auth / logout buttons missing clear loading feedback | [`defect-01-auth-button-loading.md`](./defect-01-auth-button-loading.md) | `fix/auth-button-loading` |
| 2 | Delete account too close to log out in Settings | [`defect-02-settings-danger-zone.md`](./defect-02-settings-danger-zone.md) | `fix/settings-danger-zone` |
| 3 | No in-app support / feedback path to support@freeperiod.co.za | [`defect-03-support-feedback.md`](./defect-03-support-feedback.md) | `feat/support-feedback` |
| 4 | Settings dropdowns misbehave / page scrolls on open | [`defect-04-settings-dropdown-scroll.md`](./defect-04-settings-dropdown-scroll.md) | `fix/settings-dropdown-scroll` |

**Anything else you notice** (typos, broken flows, a11y issues) → add a row in [`noticed-defects.md`](./noticed-defects.md). Do **not** fold unrelated fixes into the assigned PRs above unless Tashiv agrees.

---

## Critical Git workflow

1. **Base branch:** `dev` (not `main`). Tashiv reviews PRs targeting `dev`.
2. **One defect = one branch = one PR.** Never mix defect 1 and 2 in the same PR.
3. **Keep PRs small and reviewable.** Prefer focused commits; write a clear PR description with repro + test notes.

### Suggested flow (per defect)

```bash
# From repo root, with latest dev
git fetch origin
git checkout dev
git pull origin dev

git checkout -b fix/auth-button-loading   # use the branch name from the table above

# … implement, test …

git add <files>
git commit -m "fix(auth): show loading state on sign-out and Google sign-in"

git push -u origin fix/auth-button-loading

gh pr create --base dev --title "fix(auth): consistent button loading on auth actions" --body "$(cat <<'EOF'
## Summary
- …

## Test plan
- [ ] …

EOF
)"
```

### PR checklist (every defect)

- [ ] Branch was cut from up-to-date `dev`
- [ ] PR base is **`dev`**
- [ ] Scope matches **one** defect doc only
- [ ] Manual test steps documented in PR body
- [ ] Relevant unit tests updated or added (see each defect doc)
- [ ] `npm run lint` — note any pre-existing failures called out in `AGENTS.md`

### Commands reference

| Action | Command |
|--------|---------|
| Open PR against `dev` | `gh pr create --base dev` |
| See PR in browser | `gh pr view --web` |
| Run unit tests | `npm run test` |
| Run E2E (local) | `BASE_URL=http://localhost:3000 npm run test:e2e` |

---

## Where to look in the codebase (quick map)

| Area | Paths |
|------|--------|
| Sign in / sign up | `app/(auth)/sign-in/SignInPage.tsx`, `app/(auth)/sign-up/SignUpPage.tsx` |
| Google OAuth button | `components/auth/GoogleContinueButton.tsx` |
| Shared button + spinner | `components/ui/Button.tsx` (`isLoading`, `Loader2`) |
| Settings (logout + delete) | `app/(app)/settings/SettingsClient.tsx`, server page `app/(app)/settings/page.tsx` |
| Settings dropdowns | `AnimatedDropdown` via `components/ui/animated-dropdown.tsx` (used in SettingsClient) |
| Account deletion API | `app/api/user/delete/route.ts`, `lib/account/delete-user.ts` |
| Support email config | `lib/legal/config.ts` (`contactEmail`, default `support@freeperiod.co.za`) |
| Marketing contact link | `components/legal/MarketingFooter.tsx` (`mailto:`) |
| UI backlog (context) | `docs/superpowers/specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md` (e.g. **W-AUTH-05**, **W-FEEDBACK-01**) |

---

## Getting help

- **Product / UX decisions:** comment in the PR or list open questions in the defect doc (especially defect 3 before large implementation).
- **Environment:** `/api/health` shows which env vars are configured (booleans only).
- **Stuck on Supabase locally:** follow [`AGENTS.md`](../AGENTS.md) (schema order, grants, `.env.local`).

Good luck — ship one PR at a time.

# Defect 01 — Auth button loading states

**Branch:** `fix/auth-button-loading`  
**PR base:** `dev`  
**Owner:** Arham

---

## Problem statement

Sign in, sign up, and log out actions should give immediate feedback when the user clicks and the app is waiting on Supabase or navigation. Without a spinner (and disabled / busy semantics), users may click again or assume nothing happened—especially on slower networks.

---

## Severity

**Medium (UX / trust)** — does not block core functionality, but affects first-run conversion (auth) and account actions (settings).

---

## Reproduction (starting points)

1. **Sign in (email/password)** — `/sign-in`  
   - Enter valid credentials → click **Sign in**.  
   - Observe submit control during the async `signInWithPassword` + profile check + redirect.

2. **Sign in (Google)** — `/sign-in`  
   - Click **Continue with Google**.  
   - Observe control while OAuth redirect is prepared.

3. **Sign up** — `/sign-up`  
   - Complete form → submit. Same expectation as sign in.

4. **Log out** — `/settings` (authenticated)  
   - Click **Log out** in the Account section.  
   - Observe control during `signOut()` and redirect to `/sign-in`.

5. **Optional regression spots** — scan for other primary auth-adjacent actions:  
   - `app/(auth)/forgot-password/ForgotPasswordPage.tsx`  
   - `app/(auth)/update-password/UpdatePasswordPage.tsx`  
   - Confirm deletion in settings (uses `deleting` text, not necessarily `Button` `isLoading`)

---

## Your job

### 1. Audit (document findings in this file)

Search the app for async auth/session actions and whether they use a **consistent** loading pattern.

**Suggested investigation steps**

1. Read `components/ui/Button.tsx` — note built-in `isLoading` (spinner + `disabled`).
2. Grep for `isLoading`, `authBusy`, `signOut`, `signInWithPassword`, `signInWithOAuth`:
   ```bash
   rg "isLoading|authBusy|signOut" app components --glob "*.tsx"
   ```
3. Manually test the repro steps above on `npm run dev` (throttle network in DevTools if needed).
4. Compare with an existing “good” pattern: `features/billing/components/PricingClient.tsx` sets `aria-busy` on checkout buttons while loading (see unit test `tests/unit/features/billing/components/PricingClient.test.tsx`).
5. Fill in the **Audit results** section below before coding.

### 2. Fix consistently

- Prefer the shared `Button` `isLoading` prop over one-off spinners.
- If you improve `Button` (e.g. `aria-busy={isLoading}`), update **all** call sites that rely on loading UX—or document why auth-only.
- Wire **Google** through loading state (`GoogleContinueButton` currently only accepts `disabled`).
- Wire **Settings → Log out** with local `loggingOut` (or similar) + `isLoading`.
- Do not remove existing motion on buttons (spotlight / scale) unless required for a11y.

### 3. Tests

- Extend or add tests where the repo already covers these surfaces, e.g.:  
  - `tests/unit/app/(auth)/sign-in/SignInPage.test.tsx`  
  - `tests/unit/app/(app)/settings/SettingsClient.test.tsx`  
- If you add `aria-busy` to `Button`, consider a small unit test in `tests/unit/components/ui/Button.test.tsx` (create if missing).

---

## Audit results (fill in before PR)

| Location | File | Current loading behavior | Gap? |
|----------|------|---------------------------|------|
| Email sign in submit | `app/(auth)/sign-in/SignInPage.tsx` | `authBusy` → `Button isLoading={authBusy}` | _Verify spinner visible in browser; check `aria-busy`_ |
| Google sign in | `components/auth/GoogleContinueButton.tsx` | `disabled={authBusy}` only | _Likely gap: no `isLoading`_ |
| Sign up submit | `app/(auth)/sign-up/SignUpPage.tsx` | `isLoading={authBusy}` | _Verify in browser_ |
| Settings log out | `app/(app)/settings/SettingsClient.tsx` | Inline `onClick` async, no loading state | _Likely gap_ |
| Confirm account deletion | `app/(app)/settings/SettingsClient.tsx` | `deleting` swaps label text | _Optional: align with `isLoading`_ |
| Shared primitive | `components/ui/Button.tsx` | `Loader2` when `isLoading`; disables button | _Check `aria-busy` / accessible name_ |
| Other async buttons | _your findings_ | | |

**Notes:**

- Backlog item **W-AUTH-05** explicitly calls for shared loading on auth forms (`docs/superpowers/specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md`).

---

## Acceptance criteria

- [ ] While a sign-in or sign-up request is in flight, the **primary submit** control shows a visible loading indicator and cannot be double-submitted.
- [ ] **Continue with Google** shows the same loading treatment when OAuth is starting (and stays disabled appropriately).
- [ ] **Log out** in Settings shows loading until redirect completes or errors.
- [ ] Loading controls are **disabled** during pending work (`Button` already disables when `isLoading`).
- [ ] **Accessible busy state:** buttons expose `aria-busy="true"` while loading (either on `Button` globally or on each auth control—document choice in PR).
- [ ] No regression to error handling (`mapAuthError`, server error banners on sign-in).
- [ ] Audit table above is completed in this doc (or summarized in PR if you prefer not to commit audit edits—ask Tashiv).

---

## Testing notes

| Layer | What to run |
|-------|-------------|
| Manual | Repro steps on slow 3G; confirm single click, visible spinner, no double submit |
| Unit | `npm run test -- SignInPage SettingsClient Button` (adjust paths to match files you touch) |
| E2E | `tests/e2e/auth.spec.ts` with `BASE_URL=http://localhost:3000` if you change auth UX materially |

---

## Git workflow

```bash
git checkout dev && git pull origin dev
git checkout -b fix/auth-button-loading
# … work …
git push -u origin fix/auth-button-loading
gh pr create --base dev --title "fix(auth): consistent loading on auth and sign-out actions"
```

**Do not** include settings danger zone or support feedback in this PR.

---

## Definition of done

- Audit section filled in
- Fixes merged via PR to `dev` with test plan checked off
- Tashiv review addressed

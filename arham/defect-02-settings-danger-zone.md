# Defect 02 — Settings danger zone for delete account

**Branch:** `fix/settings-danger-zone`  
**PR base:** `dev`  
**Owner:** Arham

---

## Problem statement

On Settings, **Delete account** sits directly under **Log out** in the same stacked button group. That layout is easy to mis-click and does not match common SaaS patterns where irreversible actions live in a clearly separated **Danger zone**.

Reference pattern: [GitHub → Settings → Danger zone](https://github.com/settings/profile) — separate section, warning copy, visual separation, destructive styling only inside that region.

---

## Severity

**Medium (UX / safety)** — mistaken taps could open the delete confirmation flow; actual deletion still requires typing `DELETE`.

---

## Where the UI lives

| Piece | Path |
|-------|------|
| Settings page (RSC + data) | `app/(app)/settings/page.tsx` |
| Settings UI (client) | `app/(app)/settings/SettingsClient.tsx` |
| Account block (email, plan, logout, delete) | `SettingsClient.tsx` — **Account** section (~lines 402–489) |
| Delete API | `app/api/user/delete/route.ts` |
| Deletion scheduling logic | `lib/account/delete-user.ts` |
| i18n strings | `lib/i18n/messages/en.ts` (and sibling locale files under `settings.*`) |
| Existing tests | `tests/unit/app/(app)/settings/SettingsClient.test.tsx` |

**Navigation:** authenticated app shell uses `components/layout/Navbar.tsx` (`/settings` link). There is no separate logout in the navbar—logout is settings-only today.

---

## Current behavior (baseline)

In the **Account** card, actions are a single `space-y-3` stack:

1. Manage subscription (external link, when URL exists)
2. **Log out** — `Button variant="outline"` → `supabase.auth.signOut()` → `/sign-in`
3. **Delete account** — outline button with error tint, or inline confirmation panel when expanded

Delete confirmation requires typing `DELETE`, then calls `POST /api/user/delete`, signs out, redirects to `/sign-in?deleted=1`.

---

## Your job

**UI/layout only** — improve information architecture and visual separation. **Do not** change deletion business rules, API contract, or grace-period behavior unless Tashiv asks.

### Suggested approach

1. **Split sections**
   - Keep **Account** for identity + subscription + **Log out** only.
   - Add a new **Danger zone** (or localized equivalent) section **below** Account and above **Legal**, or below Legal—pick whichever matches FreePeriod’s visual rhythm; default recommendation: **below Account, above Legal**.

2. **Danger zone content** (GitHub-inspired)
   - Section title + short warning paragraph (use or extend `settings.*` i18n keys).
   - Contained panel: border (`border-destructive/…`), subtle destructive background, ample padding.
   - Primary destructive control: “Delete account” (not full-width ghost next to logout).
   - Keep the existing **expand → type DELETE → confirm/cancel** flow and animations on buttons (`Button` spotlight/scale).

3. **Spacing**
   - Clear vertical gap between Account card and Danger zone (e.g. `mt-8`+), so logout and delete are never adjacent siblings in one button stack.

4. **i18n**
   - Add strings to `lib/i18n/messages/en.ts` and mirror in `es`, `fr`, `ar`, `zh-Hans` if those files already define `settings.*` (match existing project convention).

### Investigation steps

1. Read full `SettingsClient.tsx` layout (Profile defaults, Account, Legal).
2. Skim `SettingsClient.test.tsx` for selectors tied to delete/logout order.
3. Compare surface tokens: `rounded-2xl border border-border bg-surface` used elsewhere—danger zone should feel distinct but on-brand (`destructive` tokens in `Button` variants).
4. Screenshot before/after for PR.

---

## Acceptance criteria

- [ ] **Log out** and **Delete account** are not adjacent controls in the same vertical button list.
- [ ] Delete account lives in a clearly labeled **Danger zone** section with warning copy.
- [ ] Visual separation is obvious (spacing + border/background), similar in intent to GitHub’s danger area.
- [ ] Existing delete flow still works: open confirm → type `DELETE` → success → redirect `/sign-in?deleted=1`; errors still show via `FieldError`.
- [ ] Manage subscription link unchanged when `manageSubscriptionUrl` is present.
- [ ] Button motion/animations preserved on interactive controls.
- [ ] Strings translatable via existing i18n pattern.
- [ ] Unit tests updated if they assert DOM structure/order.

---

## Do not break

- `handleDeleteAccount` fetch to `/api/user/delete` and error handling (`deleteError`, `deleting` state).
- Confirmation gate: `deleteConfirm !== 'DELETE'`.
- `POST` scheduling + sign-out behavior in `app/api/user/delete/route.ts`.
- Legal links section at bottom of settings.

---

## Testing notes

| Type | Action |
|------|--------|
| Manual | Settings → expand delete → cancel → confirm with wrong text → confirm with `DELETE` on a **test account only** |
| Unit | `npm run test -- SettingsClient` |
| Visual | Mobile width: danger zone readable, tap targets ≥ 44px where project already enforces on primary actions |

---

## Git workflow

```bash
git checkout dev && git pull origin dev
git checkout -b fix/settings-danger-zone
gh pr create --base dev --title "fix(settings): move delete account into danger zone"
```

Scope: **only** settings layout/copy/i18n/tests for this defect.

---

## Definition of done

- PR to `dev` with before/after screenshots
- Test plan completed
- No changes to delete API semantics

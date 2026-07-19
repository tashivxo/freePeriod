# Supabase auth email and URL setup (FreePeriod)

Use this guide to configure **password recovery** in the [Supabase Dashboard](https://supabase.com/dashboard) for the FreePeriod project. The app already sends users to `/auth/callback?next=/update-password` via `resetPasswordForEmail` in `ForgotPasswordPage.tsx`.

## 1. Reset Password email template

**Dashboard path:** Authentication → Email Templates → **Reset Password**

### Subject line

```
Reset your FreePeriod password
```

### Body (HTML)

Paste the template below. The button must use Supabase’s built-in `{{ .ConfirmationURL }}` (signed, single-use link). Optional `{{ .Email }}` shows the recipient when the editor supports it.

```html
<h2>Reset your FreePeriod password</h2>

<p>Hi,</p>

<p>We received a request to reset the password for <strong>{{ .Email }}</strong>.</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
    Reset password
  </a>
</p>

<p>This link is single-use and expires after a short time. If you did not request a password reset, you can safely ignore this email—your password will not change.</p>

<p>— The FreePeriod team</p>
```

**Save** the template in the dashboard after pasting.

## 2. URL configuration

**Dashboard path:** Authentication → URL Configuration

| Setting | Value |
|--------|--------|
| **Site URL** | `https://freeperiod.co.za` |

### Redirect URLs (allowlist)

Add these entries (keep any existing preview/staging URLs you still use):

| URL | Purpose |
|-----|---------|
| `https://freeperiod.co.za/auth/callback` | Production auth callback (password reset, OAuth, email confirm) |
| `http://localhost:3000/auth/callback` | Local development |

The forgot-password flow uses:

`{origin}/auth/callback?next=/update-password`

Production therefore resolves to:

`https://freeperiod.co.za/auth/callback?next=/update-password`

Supabase matches allowed redirect URLs by origin and path prefix; the `next` query parameter is handled by the app after redirect.

## 3. Vercel production canonical URL

`NEXT_PUBLIC_APP_URL` must be set **only on Production** (not Preview), so checkout and legal URLs do not point preview deployments at the live domain.

| Variable | Value | Environments |
|----------|--------|----------------|
| `NEXT_PUBLIC_APP_URL` | `https://freeperiod.co.za` | **Production** only |

### CLI commands (team `tashivxos-projects`, project `free-period`)

From the repo root, with Vercel CLI authenticated (`vercel whoami`):

```powershell
# Add or update (if missing)
echo https://freeperiod.co.za | vercel env add NEXT_PUBLIC_APP_URL production --scope tashivxos-projects

# Verify listing (value shown as Encrypted)
vercel env ls production --scope tashivxos-projects

# Optional: confirm decrypted value locally (creates a file—delete after)
vercel env pull .env.vercel-check --environment=production --scope tashivxos-projects --yes
# Check: NEXT_PUBLIC_APP_URL="https://freeperiod.co.za"
```

After changing `NEXT_PUBLIC_*` variables, trigger a **new Production deployment** so the value is baked into the client bundle.

## 4. Manual end-to-end validation

Run these checks on **https://freeperiod.co.za** after Supabase template/URL settings are saved and Production has redeployed.

1. **Request reset** — Open `/forgot-password`, submit an email for a real account.
2. **Email** — Confirm subject is `Reset your FreePeriod password` and the button opens a Supabase-hosted confirmation URL (not a raw app URL without tokens).
3. **Callback** — After confirming, land on `/update-password` (via `/auth/callback?next=/update-password`).
4. **New password** — Set a new password and sign in at `/sign-in`.
5. **Canonical URLs** — On Production, confirm checkout redirect and public/legal links use `https://freeperiod.co.za` (depends on `NEXT_PUBLIC_APP_URL` in the latest build).

## 5. Automated checks (repo)

From the project root:

```powershell
npm test -- --testPathPatterns="(auth/callback/route|forgot-password/ForgotPasswordPage|supabase/middleware)" --passWithNoTests
```

These tests cover:

- `ForgotPasswordPage` — `redirectTo` includes `/auth/callback`
- `GET /auth/callback` — PKCE code and recovery `token_hash` flows redirect to `/update-password`
- Supabase middleware — auth route handling

They do **not** replace the manual email and production E2E steps above.

## What you must do manually in Supabase

No write-capable Supabase MCP is available from this repo. **You** must:

1. Paste the **subject** and **HTML template** (section 1) and save.
2. Set **Site URL** and **Redirect URLs** (section 2) and save.
3. Send a test recovery email and complete section 4 once Vercel Production is redeployed.

Vercel `NEXT_PUBLIC_APP_URL` for Production can be applied via CLI (section 3); Supabase steps cannot.


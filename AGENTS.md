# AGENTS.md

## Cursor Cloud specific instructions

FreePeriod is a single Next.js 16 (App Router) app — an AI lesson planner for teachers.
It is the only service you start locally; it talks to Supabase (auth + Postgres + storage),
Google Gemini / Anthropic (lesson generation), and Lemon Squeezy (billing). Standard commands
live in `package.json` (`dev`, `build`, `start`, `lint`, `test`, `test:e2e`) — use those.

### Running the app
- Requires a `.env.local` (see `.env.local.example`). The dev server (`npm run dev`) runs on
  port `3000`. Env vars are read at startup, so **restart `npm run dev` after editing `.env.local`**.
- `/api/health` reports which env vars are present (booleans only) — handy to confirm config.
- Marketing pages (`/`, `/pricing`, `/privacy`, `/terms`) and `/api/*` render without a Supabase
  session; everything else redirects to `/sign-in` via `proxy.ts` → `lib/supabase/middleware.ts`.

### Supabase for local dev (auth + DB)
There is no committed hosted Supabase config; the base schema is in `lib/supabase/schema.sql`
(NOT in `supabase/migrations/`), and the files in `supabase/migrations/` are incremental
ALTERs that assume that base schema already exists. To run a local stack:
1. Local Supabase needs Docker + the Supabase CLI (`supabase start` pulls containers). These are
   system tools, not npm deps, so they are not installed by the update script — install them if the
   VM snapshot doesn't already have them, then run `dockerd` and `supabase start` from the repo root
   (a `supabase/config.toml` is committed so no `supabase init` is needed).
2. Apply the schema **before** the migrations, and apply migrations in *chronological* (not
   filename-sorted) order — there are duplicate `003_`/`004_` prefixes and `003_stripe_fields.sql`
   predates `003_lemon_squeezy_subscriptions.sql`:
   `schema.sql` → `001` → `002` → `003_stripe_fields` → `003_lemon_squeezy_subscriptions`
   → `004_account_deletion` → `004_add_trial_fields` → `005_add_is_admin` (pipe each into `psql` in the `supabase_db_*` container).
3. **Gotcha (important):** hosted Supabase auto-grants table privileges to the `anon` /
   `authenticated` / `service_role` roles, but tables created by applying `schema.sql` via `psql`
   do NOT get those grants — the app then fails onboarding with `permission denied for table users`.
   After applying schema + migrations, run once:
   `GRANT ALL ON ALL TABLES/SEQUENCES/ROUTINES IN SCHEMA public TO anon, authenticated, service_role;`
   (plus `ALTER DEFAULT PRIVILEGES ... GRANT ALL ...`). RLS still enforces per-row access.
4. Put the local `API_URL` / `ANON_KEY` / `SERVICE_ROLE_KEY` from `supabase start` into `.env.local`
   as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
   Local auth auto-confirms email signups (no email step needed).

Alternatively, point `.env.local` at a real hosted Supabase project via secrets and skip the local stack.

**Admin comp access:** `users.is_admin = true` grants effective Pro+ (unlimited + Quality mode) regardless of billing. Migration `005_add_is_admin.sql` seeds `tashivxo@gmail.com` and `janiestribe@gmail.com`. On hosted Supabase, run that migration in the SQL Editor after both accounts have signed up; verify with `SELECT email, is_admin, plan FROM public.users WHERE is_admin;`.

### AI generation & billing
Lesson generation needs `GOOGLE_GENERATIVE_AI_API_KEY` (free tier) and/or `ANTHROPIC_API_KEY`
(Pro tiers); checkout needs the `LEMONSQUEEZY_*` vars. Without these keys the app runs and all
auth/DB/navigation works, but the "Generate" step will fail — supply them as secrets to exercise it.

### Known quirks (app-level, not environment)
- After completing onboarding, the "Finish" button can spin without auto-redirecting (a stray
  409 from a duplicate profile insert — the DB trigger `handle_new_user` and the client both create
  the `public.users` row). The data still persists; navigating to `/dashboard` shows it saved.
- `npm run lint` currently reports pre-existing errors (e.g. `prefer-const`, missing display name);
  these exist on `main` and are unrelated to environment setup.
- Playwright (`npm run test:e2e`) defaults to the production URL; set `BASE_URL=http://localhost:3000`
  to run against the local dev server.

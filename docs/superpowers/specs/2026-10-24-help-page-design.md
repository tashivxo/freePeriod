# Help & feedback page design

Date: 2026-10-24
Status: Approved by user, pending spec review

## Goal

Move the Help & feedback form out of Settings into its own public page at `/help`. Link to it from Settings (signed-in users) and from the marketing footer (landing, pricing, privacy, terms).

## Decisions

- Access: one public page, `/help`. Works signed out and signed in.
- In-app entry: a small link row in Settings that goes to `/help`. The top nav is unchanged.
- Footer: add a "Help & feedback" link to the shared `MarketingFooter`.
- Implementation split: Sonnet 5.5 plans and reviews, Composer 2.5 implements.

## Design

### 1. Route and access

- New `app/help/page.tsx` (server component).
- Add `/help` to the public-route list in `lib/supabase/middleware.ts`, next to `/pricing`, `/privacy`, `/terms`.
- If a session exists, load the profile and plan the same way Settings does (including trial state) and pass `accountEmail`, `userId`, `plan` to `HelpFeedback`.
- If there is no session, those props are undefined. Diagnostics then include only browser, language and timestamp. The diagnostics hint copy reflects this ("Adds your browser and language...") and does not mention account details.
- `supportEmail` comes from `legalConfig.contactEmail`.

### 2. Page layout

- Shell matches the legal pages: `MarketingHeader`, `max-w-3xl`, `MarketingFooter`.
- Header back link: "Back to dashboard" when signed in, "Back to home" when signed out.
- H1 "Help & feedback" plus one line saying replies come by email (reuse existing copy).
- Below it, the existing form in a single surface. Visual design of the form is unchanged. The page owns the H1, so the form heading becomes an H2 and the section id `help` is kept.
- Register is Read/Operate: existing tokens only, coral focus ring, 44px targets, no new effects, no FAQ or illustration blocks.

### 3. Settings

- Remove the `HelpFeedback` block from `SettingsClient`, and remove the props only it used (`supportEmail`, plus `userId` if nothing else uses it).
- Replace it with a compact card matching the Legal block: title, one-line description, coral link to `/help`.
- Remove `supportEmail` from the `SettingsClient` props passed by `app/(app)/settings/page.tsx` if it becomes unused.

### 4. Footer

- Add `{ href: '/help', label: t('help.footerLabel') }` to `MarketingFooter`.
- Replace the raw `mailto:` "Contact" link with it. The mailto remains available on `/help` as the fallback.

### 5. i18n

- Add `help.*` keys (document title, page title, description, Settings row title and description, footer label, signed-out diagnostics hint) to all five locales: en, fr, es, ar, zh-Hans.
- Existing `settings.help*` form strings are moved or reused so each string has one owner.
- No em-dashes or en-dashes in any new visible string. Use a hyphen, comma or period.

### 6. Tests

New:
- `/help` page: signed-out props, signed-in props.
- `MarketingFooter`: contains the `/help` link.
- Middleware: `/help` is a public route.

Updated:
- `SettingsClient` tests: form gone, link row present with `href="/help"`.
- `HelpFeedback` tests: account props optional, signed-out diagnostics omit account fields.
- Regression: Settings does not render `HelpFeedback`.

### 7. Delivery

- Composer 2.5 tasks: (a) route, middleware, component props; (b) Settings row and footer link; (c) i18n for five locales and tests.
- Sonnet reviews diffs and runs unit tests and lint on touched files, then opens `/help` in the browser for the user to verify before any commit or push.

## Out of scope

- FAQ or knowledge base content.
- In-app ticketing or server-side message sending (the form still opens the user's email app).
- Changes to the top navigation.

# FreePeriod — Copilot Completion Checklist

> Status as of 2026-05-18: T1, T2, T2.5, T3, T4, T5, T6, and T7 are complete. T8 remains partially blocked on external production verification. T9 is partially complete: the new dark-mode ShinyText check passes, but the full Playwright suite still has unrelated generate/settings failures.

## T1 — Landing Page Polish

- [x] Landing page shiny text implemented and visible on the public landing page.
- [x] Landing page browser verification completed.

## T2 — UI Structure Audit

- [x] Shared visual primitives audited and colocated under `components/ui`.
- [x] `BlurText`, `ShinyText`, and `SpotlightCard` imports updated across consumers.
- [x] Production pages verified after the refactor.

Commits:
- `f5d9a8c` `refactor(ui): colocate text effects with shared UI primitives`

## T2.5 — Audit Follow-Ups

- [x] Stale screenshot deletions cleaned up so they no longer contaminate `git status`.
- [x] Pricing animation warning traced to `animejs` target selection in `PricingClient` and fixed.
- [x] Matching landing-page animation warning also fixed.
- [x] Production pages rechecked after the warning fixes.

Commits:
- `a588fb1` `chore(assets): remove stale screenshot artifacts`
- `5217c47` `fix(pricing): guard entrance animations when targets are absent`
- `f90d722` `fix(landing): guard entrance animations when targets are absent`

Pages verified in browser:
- `/`
- `/pricing`
- `/sign-in`

Exact warning traced:
- `No target found. Make sure the element you're trying to animate is accessible before creating your animation.`

## T3 — Brand/Icon Metadata

- [x] `icon`, `apple-icon`, and `opengraph-image` routes exist and build correctly.
- [x] Root metadata wiring verified in the app layout.

Source anchors:
- `app/icon.tsx`
- `app/apple-icon.tsx`
- `app/opengraph-image.tsx`
- `app/layout.tsx`

## T4 — Typography

- [x] Display font switched to Roboto Serif.
- [x] Runtime heading verification completed on landing/history flows.

Commit:
- `aa641cd` `feat(typography): switch display font to Roboto Serif`

## T5 — History Rename

- [x] `Lesson History` renamed to `Lesson Plan History` in source and tests.
- [x] Browser and e2e checks updated to the new label.

Commit:
- `ad16751` `fix(history): rename Lesson History to Lesson Plan History`

## T6 — Structure Refactor

- [x] `GenerateForm` moved into `features/generate/components`.
- [x] `GenerateClient` moved into `features/generate/components`.
- [x] `HistoryClient.tsx` moved into `features/history/components`.
- [x] AI helpers consolidated under `lib/ai`.
- [x] Shared type entrypoint added at `types/index.ts`.

Commits:
- `87147be` `refactor(structure): move GenerateForm.tsx to features/generate/components`
- `b28bfd8` `refactor(structure): move GenerateClient.tsx to features/generate/components`
- `80ecbab` `refactor(structure): move HistoryClient.tsx to features/history/components`

## T7 — Cleanup

- [x] Remaining direct type imports consolidated onto `@/types`.
- [x] Cleanup commit created instead of leaving the work as untracked drift.

Commit:
- `ec71866` `refactor(cleanup): remove dead code and consolidate duplicate types`

## T8 — Production Gemini/Billing Verification

- [ ] End-to-end free-plan production generation fully verified.
- [ ] Vercel env/billing/Google-side checks completed.

Notes:
- This step still depends on external systems that cannot be fully validated from the local repo alone.

## T9 — Manual and Browser Validation

- [x] Landing page shiny text manually verified in dark mode.
- [x] Targeted Playwright coverage added for dark-mode ShinyText rendering.
- [x] Pricing-page console warning added to the checklist and cleared.
- [ ] Full Playwright suite passing on localhost.

Commit:
- `f860425` `fix(ui): improve shiny text visibility in dark mode`

Focused validations completed:
- `npm test components/ui/ShinyText.test.tsx app/page.test.tsx`
- `npm run build`
- `BASE_URL=http://localhost:3000 npm run test:e2e -- --grep "keeps shiny section headings styled in dark mode"`

Full-suite status:
- The new dark-mode ShinyText check passes.
- The full Playwright suite still fails in existing generate/settings flows, primarily dropdown interactions, settings content visibility, and settings navigation assertions.

## Blockers Log

- [resolved] Screenshot-deletion worktree noise cleared by `a588fb1`.
- [resolved] Pricing animation warning cleared by `5217c47`.
- [resolved] Landing-page animation warning cleared by `f90d722`.
- [open] Full Playwright suite still has pre-existing generate/settings failures that need a separate pass before T9 can be fully closed.

# FreePeriod — Implementation Plan (v1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Build a Next.js 15 (App Router) AI lesson planner for teachers — form input → Claude API streaming → structured lesson plan → inline editing → DOCX/PDF/template export.

**Architecture**: Next.js App Router with RSC-first approach. Supabase for auth/DB/storage. Claude API (TypeScript SDK, streaming, adaptive thinking) for generation. anime.js for signature animations. Vercel Edge for deployment.

**Tech Stack**: Next.js 15, TypeScript (strict), Tailwind CSS, Supabase (`@supabase/ssr`), Anthropic SDK (`@anthropic-ai/sdk`), anime.js, Lucide React, docx, @react-pdf/renderer, xlsx (SheetJS), pdf-lib, Tesseract.js, Vercel.

---

## Skills Applied to This Plan

| Skill | How it shapes this plan |
|---|---|
| **writing-plans** | Plan structure: bite-sized tasks, exact file paths, TDD cycle, no placeholders, self-review checklist |
| **create-implementation-plan** | Phase/task structure with TASK IDs, completion tracking, requirements/risks sections |
| **brainstorming** | Design validation before implementation; decomposed into independent subsystems |
| **executing-plans** | Execution workflow: load plan → review → execute per-task → verify → finish branch |
| **subagent-driven-development** | Recommended execution: fresh subagent per task + two-stage review (spec then quality) |
| **claude-api** | Updated Claude integration: Opus 4.6 default (`claude-opus-4-6`), adaptive thinking, streaming with `.get_final_message()`, prompt caching, compaction for long conversations |
| **vercel-react-best-practices** | 65 React/Next.js performance rules: eliminate waterfalls (Promise.all), barrel-import avoidance, next/dynamic for heavy components, server-cache-react, Suspense boundaries, startTransition |
| **frontend-design** | Distinctive UI avoiding "AI slop": bold aesthetic direction (warm/teacher-friendly), characterful font pairing (Nunito + Inter), dominant coral with sharp mustard accent, atmospheric textures |
| **premium-frontend-ui** | Entry sequence (preloader), hero architecture (100dvh, word-by-word reveals), scroll-driven narratives, magnetic micro-interactions, performance guardrails (transform/opacity only) |
| **test-driven-development** | TDD iron law: failing test → minimal code → verify → refactor. No production code without a failing test first |
| **verification-before-completion** | No completion claims without fresh verification evidence. Run commands, read output, then claim |
| **javascript-typescript-jest** | Jest patterns: `.test.ts` files, describe/it structure, mock external deps, React Testing Library, userEvent |
| **finishing-a-development-branch** | Verify tests → present merge/PR/keep/discard options → execute → clean up |
| **copilot-instructions-blueprint-generator** | Structure for `.github/copilot-instructions.md`: version detection, context files, codebase scanning, quality standards |
| **deploy-to-vercel** | Deployment workflow: git-push deploys, vercel link --repo, preview deployments default, --no-wait |
| **agent-customization** | Workspace instructions via `copilot-instructions.md` for persistent project context |
| **context-map** | Pre-implementation context mapping: files to modify, dependencies, test files, reference patterns, risk assessment |

---

## Decisions Log

| Decision | Choice |
|---|---|
| Curricula | Flexible free-text input (all curricula) |
| Grade range | All grades (Pre-K through 12) |
| Demo/unauthenticated access | None — require sign-up |
| Claude model | Configurable per request (Sonnet/Haiku/Opus) |
| Deployment | Vercel |
| OCR | Tesseract.js (server-side) — include in v1 |
| Primary brand color | #FF8BB0 (coral pink) |
| Accent color | #F7C34B (mustard yellow) |
| Display font | Free alternative (Nunito or Quicksand) — not Appco Rounded |
| Body font | Inter |
| Auth providers | Email/password, magic link, Google OAuth (incl. Drive) |
| File storage | Supabase Storage |
| Shareable links | Deferred to v2 |
| Lesson duration | Dropdown presets (30/45/60/90/120 min) + custom input |
| Template fill scope | Full: DOCX + PDF + XLSX |
| Payments (Stripe) | Deferred to v2 — free tier enforced via DB flag only |

---

## Phase 0 — Workspace Configuration

### Step 0A: Create `.github/copilot-instructions.md` (from agent-customization + copilot-instructions-blueprint-generator skills)
- [ ] Create workspace-level instructions file so all future Copilot sessions automatically know project context
- [ ] Follow copilot-instructions-blueprint-generator structure: version detection, context files, codebase scanning, quality standards
- [ ] Contents must encode:
  - **Tech stack**: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, Supabase (`@supabase/ssr`), Anthropic SDK (`@anthropic-ai/sdk`), anime.js, Lucide React icons
  - **Brand tokens**: primary `#FF8BB0` (coral), accent `#F7C34B` (mustard), display font Nunito, body font Inter
  - **Animation rules**: always use anime.js (never Framer Motion or CSS-only transitions); only animate `transform` and `opacity`; always add `prefers-reduced-motion` fallback via `@media (prefers-reduced-motion: reduce)`; max duration 800ms; use `will-change: transform` on particles, remove post-animation; wrap hover animations in `@media (hover: hover) and (pointer: fine)`
  - **Supabase patterns**: use `@supabase/ssr` for client/server helpers; RLS on all tables (`auth.uid() = user_id`); Supabase Storage for file uploads; environment variables in `.env.local`
  - **Folder conventions**: `app/` (routes), `components/` (ui, animations, lesson, forms, layout), `lib/` (supabase, claude, ocr, export, utils), `types/`
  - **Claude API conventions (from claude-api skill)**: default model `claude-opus-4-6`, use `thinking: {type: "adaptive"}` (never budget_tokens), streaming with `@anthropic-ai/sdk` TypeScript SDK, prompt caching with `cache_control: {type: "ephemeral"}` for stable system prompt, structured JSON output (12 lesson sections), store `model_used` per plan
  - **React/Next.js patterns (from vercel-react-best-practices)**: RSC-first (use `'use client'` only when needed), avoid barrel imports (import directly from source), use `next/dynamic` for heavy components (anime.js wrappers, export libraries), use `Promise.all()` for parallel data fetching, Suspense boundaries for streaming, `startTransition` for non-urgent updates
  - **Export libraries**: `docx` for DOCX, `@react-pdf/renderer` for PDF, `xlsx` (SheetJS) for XLSX, `pdf-lib` for PDF form fill, `docx-templates` for DOCX template fill
  - **UX rules**: 44px min touch targets, floating labels (no placeholder-only), inline errors, skeleton loaders, optimistic UI, WCAG AA contrast
  - **Code style**: TypeScript strict, favor named exports, keep files focused (one responsibility), test files adjacent to source (`.test.ts` suffix)
  - **Testing (from TDD + jest skills)**: TDD cycle (red-green-refactor), Jest + React Testing Library, test files with `.test.ts`/`.test.tsx`, describe/it blocks, mock external deps (Supabase, Claude API), userEvent for interactions
  - **Animation performance (from premium-frontend-ui)**: atmospheric grain overlay (`mix-blend-mode: overlay`, opacity 0.02-0.05 for warmth), no layout property animations ever, responsive degradation for touch devices

### Step 0B: Create `AGENTS.md` at project root (from create-agentsmd skill)
- [ ] **Do NOT create both** `copilot-instructions.md` AND `AGENTS.md` — pick one. Since we chose `copilot-instructions.md` in Step 0A, skip this step.
- NOTE: If you later want cross-agent compatibility (Claude Code, Codex, etc.), migrate to `AGENTS.md` instead.

### Step 0C: Set up testing infrastructure
- [ ] Install Jest + React Testing Library + @testing-library/user-event
- [ ] Configure `jest.config.ts` with Next.js transform
- [ ] Create test utilities: `lib/test-utils.tsx` (custom render with providers)
- [ ] Enforce TDD workflow per test-driven-development skill: no production code without failing test first

---

## Phase 1 — Project Scaffold & Auth

### Step 1: Next.js scaffold + testing infrastructure
- [ ] `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, ESLint
- [ ] Configure Tailwind theme with brand tokens: `coral: '#FF8BB0'`, `mustard: '#F7C34B'`, background/surface/text palette
- [ ] Install core deps: `@supabase/supabase-js`, `@supabase/ssr`, `animejs`, `lucide-react`
- [ ] Install test deps: `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`
- [ ] Add font setup: Nunito via `next/font/google` for headings, Inter for body
- [ ] Create `.env.local` schema: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- [ ] Configure `jest.config.ts` with Next.js SWC transform + path aliases
- [ ] Create `lib/test-utils.tsx` — custom render wrapping providers
- [ ] **Performance (vercel-react-best-practices)**: configure `next.config.ts` with `serverExternalPackages: ['tesseract.js']`, `optimizePackageImports: ['lucide-react']`
- [ ] **TDD gate**: write a smoke test for root layout rendering before implementing it
- [ ] Set up folder structure: `app/` (routes), `components/` (ui, animations, lesson, forms, layout), `lib/` (supabase, claude, ocr, export, utils), `types/`

### Step 2: Supabase setup
- [ ] Create Supabase project
- [ ] Define database schema (4 core tables + RLS policies):
  - `users` — id (uuid, ref auth.users), email, name, default_subject, default_grade, default_curriculum, plan (text, default 'free'), generation_count (int), created_at
  - `lesson_plans` — id (uuid), user_id (fk users), title, subject, grade, curriculum, duration_minutes, content (jsonb), model_used (text), **token_count (int)**, created_at, updated_at
  - `uploads` — id (uuid), user_id (fk users), lesson_id (fk lesson_plans, nullable), type (enum: curriculum_doc | template), file_name, storage_path, parsed_content (jsonb), created_at
  - `exports` — id (uuid), lesson_id (fk lesson_plans), format (enum: docx | pdf | xlsx), storage_path, created_at
- [ ] RLS: all tables filtered by `auth.uid() = user_id`
- [ ] Create Supabase Storage bucket: `uploads` (private, 10MB limit per file)
- [ ] Configure auth providers: email/password, magic link, Google OAuth
- [ ] Google OAuth: request `drive.readonly` scope for Drive import
- [ ] **Write RLS integration test**: verify user A cannot SELECT/INSERT/UPDATE/DELETE user B's rows

### Step 3: Auth pages (TDD: test first → implement → pass)
- [ ] **Test first**: write tests for sign-in/sign-up form rendering and validation (Jest + RTL)
- [ ] Sign-in page: email + password form, Google OAuth button, magic link option
- [ ] Sign-up page: name + email + password, Google OAuth
- [ ] Style with brand: coral CTA buttons, warm white (`#FFFBF7`) background, Nunito headings
- [ ] **Middleware tests**: write test for redirect logic before implementing `middleware.ts`
- [ ] Middleware: redirect unauthenticated users to sign-in, redirect authenticated users away from auth pages

### Step 4: Onboarding flow (TDD: test first → implement → pass)
- [ ] **Test first**: write tests for 3-step form navigation, chip selection, save-to-DB mock
- [ ] 3-step form:
  1. Subject selection — multi-select chips (Maths, English, Science, History, etc. + custom free-text)
  2. Grade level — dropdown (Pre-K through 12)
  3. Curriculum type — free-text input with common suggestions (CAPS, UK National, IB, Common Core, Australian)
- [ ] anime.js slide transitions between steps (translateX, 300ms)
- [ ] Save to `users` table (default_subject, default_grade, default_curriculum)
- [ ] Flag `onboarding_complete` in user record; redirect returning users to dashboard

**Verification (Phase 1) — must pass before claiming complete:**
- [ ] `npm test` — all Phase 1 tests pass (auth forms, middleware redirects, onboarding)
- [ ] Sign up with email → lands on onboarding → complete 3 steps → redirected to dashboard
- [ ] Sign in with Google → same flow
- [ ] Unauthenticated visit to /dashboard → redirect to /sign-in
- [ ] RLS: user A cannot read user B's data (verified by test + Supabase SQL editor)
- [ ] `npm run build` completes with zero errors

---

## Phase 2 — Lesson Generation Core

### Step 5: Generation form (`/generate`)
- [ ] Pre-fill subject, grade, curriculum from user defaults
- [ ] Fields: subject (text), grade (dropdown), curriculum (text), duration (dropdown: 30/45/60/90/120 + custom number input)
- [ ] Optional teacher prompt (textarea — "Any specific focus or requirements?")
- [ ] Two file upload zones (drag-and-drop):
  - Curriculum document (PDF, DOCX, XLSX, JPG, PNG) — badge shows file type
  - School template (PDF, DOCX, XLSX) — badge shows file type
- [ ] Google Drive picker button (import doc from Drive)
- [ ] Upload files to Supabase Storage on selection, show preview (file name + type badge + remove button)

### Step 6: Server-side document parsing (`/api/parse-document`)
- [ ] Route accepts uploaded file from Supabase Storage
- [ ] Parsing pipeline by file type:
  - **DOCX**: use `mammoth` to extract text + structure
  - **PDF**: use `pdf-parse` to extract text; if text is empty (scanned), run Tesseract.js OCR
  - **XLSX**: use `xlsx` (SheetJS) to extract cell data, preserve table structure
  - **JPG/PNG**: run Tesseract.js OCR server-side
- [ ] Save parsed content to `uploads.parsed_content` (jsonb)
- [ ] Return parsed text preview to client for confirmation

### Step 7: Claude API integration (`/api/generate`) — updated per claude-api skill
- [ ] Accept: subject, grade, curriculum, duration, teacher_prompt, parsed_curriculum_text, model_preference
- [ ] **Default model**: `claude-opus-4-6` (configurable to `claude-sonnet-4-6` or `claude-haiku-4-5`)
- [ ] System prompt construction:
  - Role: expert lesson planner
  - Include parsed curriculum document text (if provided)
  - Instruction: produce structured JSON with 12 sections (title, objectives, successCriteria, keyConcepts, hook, mainActivities, guidedPractice, independentPractice, formativeAssessment, differentiation, realWorldConnections, plenary)
  - Each section has `heading` and `content` (string or string[])
- [ ] **Prompt caching (claude-api skill)**: mark the system prompt with `cache_control: {type: "ephemeral"}` — the stable lesson planner role + JSON schema instructions are identical across requests, so they benefit from prefix caching (max 4 cache breakpoints)
- [ ] **Adaptive thinking**: use `thinking: {type: "adaptive"}` in API calls — allows Claude to reason through complex curriculum mapping without budget_tokens (which is deprecated)
- [ ] **Streaming**: use TypeScript SDK `client.messages.stream()`, pipe as SSE to client. Call `.get_final_message()` at end for usage stats
- [ ] Save completed plan to `lesson_plans.content` (jsonb)
- [ ] **Store token usage**: save `model_used` + `token_count` (input_tokens + output_tokens from usage) to `lesson_plans` table for cost monitoring
- [ ] Increment `users.generation_count`
- [ ] **Error handling**: catch `overloaded_error` (retry with exponential backoff), `rate_limit_error` (show user-friendly message), `invalid_request_error` (log and surface)

### Step 8: Generation screen (the signature moment)
- [ ] Full-screen takeover on submit: form dissolves (opacity→0, scale→0.96), generation screen fades in (300ms)
- [ ] Center: animated SVG mug with steam (stroke-dashoffset animation, looping)
- [ ] Background: floating particles (small dots in coral + mustard, transform-only, low opacity)
- [ ] Progress steps: streamed status messages ("Analysing curriculum doc…", "Writing objectives…", "Drafting activities…") — typewriter stagger, checkmark animation on complete (scale spring)
- [ ] `prefers-reduced-motion`: disable particles + steam loop, show simple progress bar
- [ ] Cleanup: remove particles from DOM once generation completes

**Verification (Phase 2) — must pass before claiming complete:**
- [ ] `npm test` — all Phase 2 tests pass (form rendering, file upload, API route, Claude mock)
- [ ] Upload a DOCX curriculum doc → parsed text shown in preview
- [ ] Upload a scanned JPG → Tesseract OCR extracts text
- [ ] Fill form → hit Generate → generation animation plays → plan appears
- [ ] Test with Opus, Sonnet, Haiku model selection
- [ ] Check `lesson_plans` table has full JSON content + `model_used` + `token_count`
- [ ] Test with no curriculum doc uploaded → still generates valid plan
- [ ] Verify prompt caching: check API response headers for `cache_creation_input_tokens` or `cache_read_input_tokens`
- [ ] `npm run build` completes with zero errors

---

## Phase 3 — Output, Editing & Export

### Step 9: Lesson output view (`/lesson/[id]`)
- [ ] Render each section as a collapsible card with staggered reveal (y+16, opacity 0→1, 60ms stagger)
- [ ] Each card: heading, content, Edit button, Regenerate button
- [ ] Edit mode: card transforms to inline textarea with floating label, coral border glow
- [ ] Save: brief green flash animation, PATCH to `lesson_plans.content` (update specific section in jsonb)
- [ ] Regenerate single section: call `/api/generate` with section-specific prompt + surrounding context → replace that section only

### Step 10: DOCX export
- [ ] Use `docx` npm package
- [ ] Generate formatted Word document from lesson plan JSON
- [ ] Title heading in coral (#FF8BB0), section headings hierarchical (Heading 2/3)
- [ ] Clean professional formatting: margins, line spacing, page breaks between major sections

### Step 11: PDF export
- [ ] Option A: use `@react-pdf/renderer` to build styled PDF in-browser
- [ ] Option B: use Puppeteer/server-side HTML-to-PDF (heavier but more consistent)
- [ ] Recommendation: `@react-pdf/renderer` for v1 (simpler, no server dependency)
- [ ] Same structural layout as DOCX, brand colors on headings

### Step 12: Template-fill export (hardest feature)
- [ ] When a school template was uploaded alongside the lesson:
  1. Parse template structure (already done in Step 6 — headings, tables, form fields extracted)
  2. Second Claude API call: send template structure + lesson plan JSON → Claude maps lesson sections to template locations
  3. Template reconstruction:
     - **DOCX**: use `docx-templates` or direct Open XML manipulation to fill mapped fields
     - **PDF**: use `pdf-lib` to fill form fields (AcroForm); for non-form PDFs, overlay text at mapped positions
     - **XLSX**: use `xlsx` (SheetJS) to write into mapped cells, handle merged cells
  4. Show preview diff: highlight what was placed where (green = filled, yellow = uncertain mapping, red = unmapped)
  5. Allow user to manually adjust mappings before final download
- [ ] Fallback: if template parsing fails, show the clean export (Step 10/11) and explain that the template couldn't be parsed

**Verification (Phase 3) — must pass before claiming complete:**
- [ ] `npm test` — all Phase 3 tests pass (lesson output rendering, edit save, export generation)
- [ ] Generate a plan → every section renders with stagger animation
- [ ] Edit a section inline → save → refresh → edit persisted
- [ ] Regenerate one section → only that section changes
- [ ] Export DOCX → opens cleanly in Word with brand heading
- [ ] Export PDF → readable, formatted
- [ ] Upload a school DOCX template → generate → template fill preview shows mapping → download filled template
- [ ] Upload template with merged cells → verify merged cells preserved
- [ ] Template parse failure → graceful fallback to clean export
- [ ] `npm run build` completes with zero errors

---

## Phase 4 — Dashboard, History & Settings

### Step 13: Dashboard (`/dashboard`)
- [ ] Grid of recent lesson plan cards (subject, grade, date, truncated objective)
- [ ] Quick-generate shortcut button → navigates to `/generate` with defaults pre-filled
- [ ] Usage stat: "X lessons generated" (no paid tier gating yet, just informational)
- [ ] Skeleton loaders while fetching

### Step 14: Lesson history
- [ ] Full card grid of all past plans
- [ ] Filters: subject, grade, date range
- [ ] Search by keyword in title/content
- [ ] Actions per card: open, edit, duplicate (pre-fill generate form), delete (confirmation modal)
- [ ] Clicking a card: shared-element anime.js transition (card scales/morphs into full lesson view)

### Step 15: Settings (`/settings`)
- [ ] Profile: name, email (read-only from auth)
- [ ] Teaching defaults: subject, grade, curriculum (pre-fill the generate form)
- [ ] Export preferences: default format (DOCX/PDF)
- [ ] Saved templates: list of uploaded school templates with delete option
- [ ] Account deletion: confirmation modal → delete user data + Supabase auth user
- [ ] Danger zone styling with red border

**Verification (Phase 4) — must pass before claiming complete:**
- [ ] `npm test` — all Phase 4 tests pass (dashboard rendering, filters, settings forms)
- [ ] Dashboard shows recent cards, skeleton loads first
- [ ] Click card → shared-element transition to lesson view
- [ ] Filter by subject → only matching cards shown
- [ ] Duplicate a lesson → generate form pre-filled with same inputs
- [ ] Change defaults in settings → generate form pre-filled with new values
- [ ] Delete a saved template → removed from list + Supabase Storage
- [ ] Account deletion → user fully removed
- [ ] `npm run build` completes with zero errors

---

## Phase 5 — Polish & Deploy

### Step 16: Animation polish pass (from frontend-design + premium-frontend-ui skills)
- [ ] **Landing page hero**: mug entrance (staggered scale+opacity 600ms), headline word reveal (40ms stagger), scroll-triggered feature cards (IntersectionObserver, 80ms stagger)
- [ ] **Entry sequence (premium-frontend-ui)**: subtle page preloader with coral-to-white gradient fade, atmospheric grain overlay (mix-blend-mode: overlay, opacity 0.03)
- [ ] Form micro-interactions: floating label on focus (150ms), file upload drop zone (dashed→coral on drag-over, scale pulse on drop)
- [ ] Navigation: crossfade 200ms between pages, shared-element where possible
- [ ] **Hover animations**: wrap in `@media (hover: hover) and (pointer: fine)` — no hover effects on touch devices
- [ ] All animations: `prefers-reduced-motion` fallback (simple fade or instant)
- [ ] Performance: only `transform`/`opacity`, `will-change` on particles, max duration 800ms

### Step 17: Landing page (`/`) — from frontend-design skill
- [ ] **Hero section (100dvh)**: tagline with word-reveal, animated mug, "Get started" coral CTA (→ sign-up)
- [ ] Use Nunito Bold for hero headline — characterful, warm, not generic
- [ ] Feature cards: 3-4 key benefits with scroll-triggered animation
- [ ] No demo — CTA leads to sign-up directly
- [ ] Footer: minimal, links to sign-in
- [ ] **Aesthetic (frontend-design)**: avoid "AI slop" — no gradient meshes, no generic SaaS layouts. Use bold coral-dominant palette, generous whitespace, warm illustrations

### Step 18: Responsive & accessibility pass
- [ ] Mobile-first: test all screens at 375px, 768px, 1024px, 1440px
- [ ] 44px minimum touch targets
- [ ] Keyboard navigation: full tab order, focus rings (coral outline)
- [ ] WCAG AA contrast on all text
- [ ] Form labels always visible (no placeholder-only)
- [ ] Screen reader: aria-labels on icon buttons, live regions for generation progress
- [ ] **Bundle optimisation (vercel-react-best-practices)**: use `next/dynamic` for anime.js wrappers, export libraries (docx, pdf, xlsx), and Tesseract.js; verify no barrel imports pulling in full packages

### Step 19: Deploy to Vercel (from deploy-to-vercel skill)
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- [ ] Configure Supabase redirect URLs for OAuth (add Vercel production + preview URLs)
- [ ] Enable Vercel Analytics for performance monitoring
- [ ] Test full flow in production

**Verification (Phase 5) — must pass before claiming complete:**
- [ ] `npm test` — full test suite passes
- [ ] `npm run build` — zero errors, zero warnings
- [ ] Lighthouse: Performance > 90, Accessibility > 95
- [ ] Mobile: all screens usable at 375px width
- [ ] `prefers-reduced-motion`: verify all animations respect it
- [ ] Full end-to-end test: sign up → onboard → generate → edit → export → dashboard → settings
- [ ] Bundle analysis: no single route JS bundle > 200KB
- [ ] Vercel deployment: production URL loads correctly, auth flow works end-to-end

---

## Relevant Files (to be created)

- `.github/copilot-instructions.md` — workspace Copilot context (Phase 0)
- `jest.config.ts` — Jest configuration with Next.js SWC transform
- `lib/test-utils.tsx` — custom render with providers for testing
- `app/layout.tsx` — root layout with fonts, Supabase provider
- `app/(auth)/sign-in/page.tsx` — sign-in page
- `app/(auth)/sign-up/page.tsx` — sign-up page
- `app/(auth)/onboarding/page.tsx` — 3-step onboarding flow
- `app/(app)/dashboard/page.tsx` — dashboard with lesson cards
- `app/(app)/generate/page.tsx` — lesson generation form
- `app/(app)/lesson/[id]/page.tsx` — lesson output view
- `app/(app)/settings/page.tsx` — settings page
- `app/api/generate/route.ts` — Claude API streaming endpoint (uses `client.messages.stream()`, adaptive thinking, prompt caching)
- `app/api/parse-document/route.ts` — document parsing endpoint
- `app/api/export/route.ts` — export generation endpoint
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server Supabase client
- `lib/supabase/middleware.ts` — auth middleware
- `lib/claude/generate.ts` — Claude API generation logic (model selector, streaming, token tracking)
- `lib/claude/parse-template.ts` — template structure analysis
- `lib/claude/prompts.ts` — system prompt templates (with cache_control breakpoints)
- `lib/ocr/tesseract.ts` — Tesseract.js OCR wrapper
- `lib/export/docx.ts` — DOCX generation
- `lib/export/pdf.ts` — PDF generation
- `lib/export/template-fill.ts` — template-fill logic
- `components/ui/` — reusable UI primitives
- `components/animations/` — anime.js wrappers (dynamically imported via `next/dynamic`)
- `components/lesson/` — lesson-specific components
- `types/lesson.ts` — TypeScript types for lesson plan schema
- `__tests__/` or co-located `.test.tsx` files — test files per step (TDD)

---

## Scope Boundaries

**Included in v1:**
- Full auth (email, magic link, Google OAuth + Drive)
- Onboarding with defaults
- Lesson generation with Claude streaming (model selector)
- Document upload + parsing (DOCX, PDF, XLSX, JPG/PNG with OCR)
- Google Drive doc import
- Inline editing + per-section regeneration
- Export: DOCX, PDF
- Template-fill: DOCX + PDF + XLSX
- Dashboard, history, settings
- anime.js animations with reduced-motion support
- Responsive, accessible, Vercel deployment

**Excluded from v1 (deferred):**
- Stripe payments / paid tier enforcement
- Shareable public links
- Team/org features
- Real-time collaboration
- Curriculum database / pre-built lesson libraries
- Mobile native app
- Analytics dashboard
- Email notifications

---

## Further Considerations

1. **Free tier rate limiting (no Stripe yet)**: The `generation_count` field can enforce a soft limit (e.g. 50/month) checked server-side before calling Claude. This prevents abuse without requiring Stripe. Recommendation: implement this as middleware on `/api/generate`.

2. **Claude API cost management**: With model configurability, users could select Opus for every request. The `token_count` column per plan enables cost monitoring. Consider per-model usage dashboards before adding paid tiers.

3. **Google Drive OAuth complexity**: Requesting `drive.readonly` scope requires Google Cloud Console verification for production. This may slow down the initial launch. Recommendation: implement Google sign-in first, add Drive import as a fast-follow once OAuth verification is approved.

---

## Execution Workflow (from subagent-driven-development + executing-plans skills)

When implementing this plan, follow this workflow per phase:
1. **Context map**: before starting each phase, run context-map to identify all files involved
2. **TDD cycle**: for each step — write failing test → implement minimum to pass → refactor
3. **Fresh subagent per task**: each step should be delegated to a fresh subagent with specific instructions
4. **Two-stage review**: after each step — (a) spec compliance check, (b) code quality check
5. **Verification gate**: run `npm test && npm run build` before claiming any phase complete
6. **Commit per step**: conventional commit after each step passes verification (e.g. `feat(auth): add sign-in page with Google OAuth`)
7. **Branch strategy**: use `feature/phase-N-description` branches, PR per phase

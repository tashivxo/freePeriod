# FreePeriod — Copilot Workspace Instructions

> AI Lesson Planner for Teachers. Form input → Claude API streaming → structured lesson plan → inline editing → DOCX/PDF/template export.

## Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom brand tokens
- **Database/Auth/Storage**: Supabase (`@supabase/ssr` for client and server helpers)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — Claude API
- **Animation**: anime.js (sole animation library — never use Framer Motion or CSS-only transitions)
- **Icons**: Lucide React (`lucide-react`)
- **Fonts**: Nunito (display/headings), Inter (body) — via `next/font/google`
- **Export**: `docx` (DOCX), `@react-pdf/renderer` (PDF), `xlsx`/SheetJS (XLSX), `pdf-lib` (PDF form fill), `docx-templates` (DOCX template fill)
- **OCR**: Tesseract.js (server-side only)
- **Testing**: Jest + React Testing Library + @testing-library/user-event
- **Deployment**: Vercel (git-push deploys)

## Brand Tokens

```
Primary (coral):   #FF8BB0
Accent (mustard):  #F7C34B
Background:        #FFFBF7  (warm white)
Surface:           #FFFFFF
Text primary:      #1A1A2E
Text secondary:    #6B7280
Error:             #EF4444
Success:           #10B981
```

- Display font: **Nunito** (headings, hero text, CTAs)
- Body font: **Inter** (paragraphs, form labels, UI text)
- Icons: Lucide React — consistent 24px stroke, 1.5px weight

## Folder Structure

```
app/                          # Next.js App Router routes
  (auth)/                     # Auth route group (sign-in, sign-up, onboarding)
  (app)/                      # Authenticated route group (dashboard, generate, lesson, settings)
  api/                        # API routes (generate, parse-document, export)
components/
  ui/                         # Reusable UI primitives (Button, Input, Card, Modal)
  animations/                 # anime.js wrappers (dynamically imported via next/dynamic)
  lesson/                     # Lesson-specific components (SectionCard, LessonGrid)
  forms/                      # Form components (GenerateForm, OnboardingForm)
  layout/                     # Layout components (Navbar, Sidebar, Footer)
lib/
  supabase/                   # Supabase client/server/middleware helpers
  claude/                     # Claude API generation, prompts, template parsing
  ocr/                        # Tesseract.js OCR wrapper
  export/                     # DOCX, PDF, XLSX, template-fill logic
  utils/                      # Shared utilities
types/                        # TypeScript type definitions
```

## Code Style

- TypeScript strict mode — no `any`, no implicit returns
- Favor named exports over default exports
- One responsibility per file — keep files focused
- Test files co-located with source: `ComponentName.test.tsx` or `module.test.ts`
- Import directly from source files — never use barrel imports (`index.ts` re-exports)

## React / Next.js Patterns

- **RSC-first**: use Server Components by default. Add `'use client'` only when the component needs browser APIs, state, or event handlers
- **No barrel imports**: import directly from source (`import { Button } from '@/components/ui/Button'`, not `from '@/components/ui'`)
- **Dynamic imports for heavy libs**: use `next/dynamic` for anime.js wrappers, export libraries (docx, pdf, xlsx), and Tesseract.js
- **Parallel data fetching**: use `Promise.all()` for independent data loads — never sequential awaits
- **Suspense boundaries**: wrap async server components in `<Suspense>` with skeleton fallbacks
- **`startTransition`**: use for non-urgent state updates (filters, search, toggles)
- **Optimized imports**: configure `optimizePackageImports` in `next.config.ts` for `lucide-react`
- **Server external packages**: configure `serverExternalPackages` for `tesseract.js`

## Animation Rules (anime.js)

- **Only library**: anime.js — never Framer Motion, GSAP, or CSS-only transition libraries
- **Properties**: only animate `transform` and `opacity` — never animate layout properties (width, height, top, left, margin, padding)
- **Reduced motion**: always provide `@media (prefers-reduced-motion: reduce)` fallback — disable particles, reduce to simple fade or instant
- **Max duration**: 800ms for any single animation
- **Performance**: use `will-change: transform` on particle elements, remove after animation completes
- **Hover animations**: wrap in `@media (hover: hover) and (pointer: fine)` — no hover effects on touch devices
- **Atmospheric grain**: `mix-blend-mode: overlay`, opacity 0.02–0.05 for warmth texture

## Supabase Patterns

- Use `@supabase/ssr` for creating client (browser) and server (route handler/middleware) Supabase instances
- **RLS on all tables**: every table policy must check `auth.uid() = user_id`
- **Storage**: private bucket `uploads`, 10MB file limit
- **Auth providers**: email/password, magic link, Google OAuth (with `drive.readonly` scope)
- **Environment variables** (`.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`

## Claude API Conventions

- **Default model**: `claude-opus-4-6` (configurable per request to `claude-sonnet-4-6` or `claude-haiku-4-5`)
- **Adaptive thinking**: use `thinking: { type: "adaptive" }` — never `budget_tokens`
- **Streaming**: use `client.messages.stream()` from TypeScript SDK, pipe as SSE to client. Call `.get_final_message()` at end for usage stats
- **Prompt caching**: mark stable system prompt with `cache_control: { type: "ephemeral" }` (max 4 cache breakpoints)
- **Structured output**: lesson plans as JSON with 12 sections (title, objectives, successCriteria, keyConcepts, hook, mainActivities, guidedPractice, independentPractice, formativeAssessment, differentiation, realWorldConnections, plenary)
- **Token tracking**: store `model_used` + `token_count` (input + output) per lesson plan
- **Error handling**: catch `overloaded_error` (retry with exponential backoff), `rate_limit_error` (user-friendly message), `invalid_request_error` (log and surface)

## Testing (TDD)

- **Iron law**: no production code without a failing test first
- **Cycle**: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR (clean up, stay green)
- **Framework**: Jest + React Testing Library + @testing-library/user-event
- **File naming**: `*.test.ts` / `*.test.tsx`
- **Structure**: `describe` blocks for component/module, `it` blocks for specific behaviors
- **Mocking**: mock external dependencies (Supabase client, Claude API, fetch) — never mock internal logic
- **User events**: use `userEvent` (not `fireEvent`) for realistic interaction testing

## UX Rules

- 44px minimum touch targets on all interactive elements
- Floating labels on form inputs — never placeholder-only
- Inline validation errors below fields (red text, not alerts)
- Skeleton loaders while fetching data
- Optimistic UI updates where possible
- WCAG AA contrast ratio on all text
- Focus rings: 2px coral (#FF8BB0) outline on keyboard focus
- Full keyboard navigation with logical tab order

## Export Libraries

| Format | Library | Use Case |
|--------|---------|----------|
| DOCX | `docx` | Generate formatted Word documents |
| PDF | `@react-pdf/renderer` | Generate styled PDFs in-browser |
| XLSX | `xlsx` (SheetJS) | Generate spreadsheets |
| PDF form fill | `pdf-lib` | Fill existing PDF form fields |
| DOCX template fill | `docx-templates` | Fill existing DOCX templates |

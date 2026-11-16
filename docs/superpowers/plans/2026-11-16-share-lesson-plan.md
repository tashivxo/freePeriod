# Share Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teachers share a frozen lesson via public `/s/[token]` and a downloadable file from card menus and the lesson toolbar.

**Architecture:** `lesson_shares` table (service role only) stores snapshot JSON + storage path. Owner `POST /api/lessons/[id]/share` freezes content and file; guests use server-rendered public page and `GET /api/share/[token]/download`.

**Tech Stack:** Next.js App Router, Supabase (Postgres + Storage), existing export/fill pipeline, Jest.

**Spec:** `docs/superpowers/specs/2026-11-16-share-lesson-design.md`

**Agents:** Orchestrator Grok 4.6; Implementers Composer 2.5; Reviewer Grok 4.6.

**Branch:** `feat/share_button` from `origin/DEV`; PR base `DEV`.

---

### Task 1: Migration + types

**Files:** `supabase/migrations/015_lesson_shares.sql`, `lib/supabase/schema.sql`, `types/database.ts`

- [x] Add `lesson_shares` table, RLS with no client policies, `service_role` grant

### Task 2: Share file builder + token

**Files:** `lib/share/build-lesson-share-file.ts`, `lib/share/snapshot.ts`, `lib/share/token.ts`

- [x] Mirror export/fill-template logic; DOCX fallback when fill fails

### Task 3: API routes

**Files:** `app/api/lessons/[id]/share/route.ts`, `app/api/share/[token]/download/route.ts`

- [x] Owner POST with upsert stable token; public download stream

### Task 4: Public page

**Files:** `app/s/[token]/page.tsx`, `app/s/[token]/not-found.tsx`, `features/share/components/*`

- [x] Read mode, `noindex`, `SectionValueView` sections

### Task 5: ShareLessonDialog + SendIcon

**Files:** `features/lesson/components/ShareLessonDialog.tsx`, `components/ui/icons/send.tsx`

- [x] Animated SendIcon (plane + trail); copy / send / download actions

### Task 6: Menus + toolbar

**Files:** `LessonPlanCard.tsx`, `LessonView.tsx`

- [x] Share between Rename and Delete; toolbar Share with flush

### Task 7: i18n

**Files:** `lib/i18n/messages/{en,ar,es,fr,zh-Hans}.ts`

- [x] `history.share` + `share.*` keys

### Task 8: Tests

**Files:** unit tests for share API, snapshot, card menu

- [ ] `npm test` green on touched suites
# Filled Template Choice Dialog

## Goal

Let teachers choose how to export from the lesson page: always offer a filled-template path via a modal choice card, with different copy and actions depending on whether they already attached a fillable lesson plan template.

## Approved decisions

- Trigger: always-visible **Download filled template** opens a modal card (Approach 1).
- Keep **Download DOCX** as a direct one-click export.
- No-template path: **Upload one now** attaches a file to the current lesson on the lesson page.
- FreePeriod template / FreePeriod generated lesson plan = existing `/api/export` DOCX.
- Use shared template = existing `/api/export/fill-template`.

## Copy

- Has fillable template: "You have shared a lesson plan template already. Would you like to download a FreePeriod template or use the template you shared?"
- No fillable template: "You did not upload a lesson plan template. Do you want to upload one now or download a FreePeriod generated lesson plan"
- Card layout: dialogue on top, action buttons at bottom.

## Implementation

1. Write and commit design spec to `docs/superpowers/specs/2026-07-28-filled-template-choice-design.md` (user review gate before code if preferred).
2. Add `FilledTemplateChoiceDialog` on Radix Dialog + FreePeriod tokens; transitions.dev modal open/close + reduced motion.
3. Wire in `LessonView.tsx`: always show filled-template button; open dialog; reuse `handleExport` / `handleFillTemplate`.
4. Add `PATCH`/`POST` `/api/lessons/[id]/template` to set `template_path` after `useFileUpload`; flip dialog to has-template variant.
5. PDF/non-fillable: no-template variant + note that filled download needs DOCX/XLSX.
6. Tests: LessonView dialog variants, attach API auth, upload-then-flip.

## Agent workflow

- **Build:** composer-2.5 subagent implements the spec end-to-end (dialog component, LessonView wiring, API route, tests).
- **Frontend review:** kimi-k3-max (medium effort) reviews UI/UX implementation — dialog variants, copy accuracy, Radix + FreePeriod token usage, transitions.dev motion/reduced-motion handling.
- **Backend & logic review:** grok4.5 reviews `/api/lessons/[id]/template` route, auth on the attach endpoint, `template_path` state flip logic, and existing `/api/export` and `/api/export/fill-template` reuse correctness.
- Findings from both reviewers get consolidated and fed back to a composer-2.5 agent to fix.
- Once fixes are applied and re-reviewed clean, composer-2.5 commits and pushes to git.

## Skills to apply

- All skills used in the original planning pass (design spec, Radix/FreePeriod token conventions, transitions.dev modal patterns) carry over to implementation.
- **test-driven-development** skill: write failing tests first for each item in the Tests section (LessonView dialog variants, attach API auth, upload-then-flip) before implementation, then implement to green.

## Out of scope

- PDF filled-template generation
- Changing generate-form upload UX
- Removing Download DOCX

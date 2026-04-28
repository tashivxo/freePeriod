# FreePeriod — Feature Branch Plan (`feature/ai-generation`)

> **Status**: Phases 1–3 complete. Currently debugging Gemini generation on preview deployment.
> **Execution note**: Work phase-by-phase. Commit after each phase passes validation. Do not skip phases.
>
> **Model**: Gemini model string in `lib/gemini/generate.ts` → `'gemini-2.0-flash'`
> **Error**: Preview deployment shows "Generation is busy, please try again in a moment" — under active investigation before Phase 4.

**Goal**: Fix `GenerateForm`, restore missing upload components, wire AI generation end-to-end, add inline rich-text editing, and add Stripe billing.

**Stack**: Next.js ^16.2.1 (App Router, Turbopack), TypeScript strict, Tailwind CSS v4, Supabase (@supabase/ssr ^0.9.0), Anthropic SDK (@anthropic-ai/sdk ^0.80.0), Gemini SDK (@google/generative-ai ^0.24.1), anime.js ^4.3.6, framer-motion ^12.38.0 (already in animated-dropdown — acceptable), Jest ^30.3.0 + React Testing Library.

---

## Current State Audit

### Files that are COMPLETE — do not modify:
- `app/api/generate/route.ts` — SSE streaming, Gemini/Claude routing, DB save. Already reads `curriculumDocPath` and `templatePath` from request body.
- `app/api/parse-document/route.ts` — mammoth/pdf-parse/xlsx/tesseract pipeline. Uses bucket `'uploads'`.
- `app/(app)/generate/GenerateClient.tsx` — SSE client, passes form data via `JSON.stringify`. Once `GenerateFormData` gains `curriculumDocPath`/`templatePath`, they flow through automatically.

### Files that are BROKEN and need fixing:
- `app/(app)/generate/GenerateForm.tsx` — 13 bugs catalogued in Phase 1.
- `lib/utils/grades.ts` — `gradeLabel` returns "Grade 7" but test expects bare `'7'`. Fix in Phase 1.

### Files that DO NOT EXIST and must be created:
- `supabase/migrations/` directory — does not exist (`Test-Path "supabase"` → `False`)
- `lib/hooks/useFileUpload.ts` — upload hook (never committed to git)
- `components/forms/DocumentUploadZone.tsx` — upload UI component (never committed to git)

### Schema gaps identified in `lib/supabase/schema.sql`:
- `lesson_plans` table missing `template_path TEXT` column
- `subscriptions` table does not exist (needed for Phase 4 Stripe billing)

---

## Brand Tokens (Tailwind CSS v4 — CSS variables only, NO hardcoded hex)

| Token | Usage |
|---|---|
| `var(--color-primary)` | Coral — CTAs, focus rings, active states |
| `var(--color-background)` | Warm white — page background |
| `var(--color-surface)` | White — cards, inputs |
| `var(--color-text-primary)` | Dark — headings, body |
| `var(--color-text-secondary)` | Mid-grey — secondary labels |
| `var(--color-border)` | Light grey — input/card borders |

---

## Phase 1 — Form Alignment + Upload Restoration ✅ COMPLETE (`c70ea86`)

All 13 bugs in `GenerateForm.tsx` are catalogued here. The `GenerateForm.test.tsx` is the authoritative spec — every fix must make the test pass.

### 1.1 Create migrations directory

**`supabase/migrations/001_add_template_path.sql`** (NEW):
```sql
-- Add template_path to lesson_plans for tracking which template was used
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS template_path TEXT;
```

**`supabase/migrations/002_create_subscriptions.sql`** (NEW):
```sql
-- Subscriptions table for Stripe billing (consumed in Phase 4)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  plan             TEXT        NOT NULL DEFAULT 'free',
  status           TEXT        NOT NULL DEFAULT 'inactive',
  current_period_end       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX ON public.subscriptions (user_id);
```

### 1.2 Fix `lib/utils/grades.ts`

**Bug**: `gradeLabel` returns `"Grade 7"` for numeric grades and `"Kindergarten"` for `"K"`.
**Test spec**: expects option names `'Pre-K', 'K', '1', '2', ..., '12'` (bare values).

**Change**: Simplify `gradeLabel` to return the raw value for all grades except `"Year N"`:

```ts
// BEFORE:
function gradeLabel(g: string): string {
  if (g === 'Pre-K') return 'Pre-K';
  if (g === 'K') return 'Kindergarten';
  if (/^Year \d+$/.test(g)) return g;
  return `Grade ${g}`;
}

// AFTER:
function gradeLabel(g: string): string {
  // Year groups keep their label; all others display as-is (Pre-K, K, 1, 2 ... 12)
  return g;
}
```

> **Pre-execution requirement — search before touching this file**: Run a full workspace
> search for every reference to `gradeLabel`, `GRADES`, and grade values rendering to the user.
> If any display component relies on `"Grade 7"` / `"Kindergarten"` formatting from `GRADES[n].name`,
> create a separate `formatGradeDisplay(g: string): string` helper in `grades.ts` — **do not
> change `gradeLabel` until the search is complete**.
>
> **Research finding (planning phase)**: `gradeLabel` is NOT exported from `grades.ts` and has
> exactly 2 internal references: definition at line 39 and usage at line 48 (building the `GRADES`
> options array). No display component imports it. Safe to simplify — but verify `GRADES` export
> usages across the codebase before committing.

### 1.3 Create `lib/hooks/useFileUpload.ts` (NEW, `'use client'` hook)

This hook encapsulates the upload→DB-insert→parse pipeline.
The test mocks dictate the exact call shapes:
- `supabase.storage.from('uploads').upload(path, file)` → `{data: {path: '...'}, error: null}`
- `supabase.from('uploads').insert({...}).select('id').single()` → `{data: {id: 'upload-123'}, error: null}`
- `fetch('/api/parse-document', {method:'POST', body: JSON.stringify({storagePath, uploadId})})` → `{ok: true}`
- `supabase.storage.from('uploads').remove([storagePath])` → `{data: null, error: null}`

**Interface:**
```ts
interface UseFileUploadProps {
  bucket?: string;                            // default: 'uploads'
  uploadType: 'curriculum_doc' | 'template';
  onParsed?: (uploadId: string) => void;
}

interface UseFileUploadReturn {
  file: File | null;
  storagePath: string | null;
  uploadId: string | null;
  isUploading: boolean;
  error: string | null;
  handleFile: (file: File) => Promise<void>;
  removeFile: () => Promise<void>;
}
```

**`handleFile(file)` logic:**
1. `setIsUploading(true)`, clear error
2. `const { data: { user } } = await supabase.auth.getUser()`
3. Build storage path: `{user.id}/{uploadType}/{stem}-{Date.now()}.{ext}`
4. `const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(path, file)`
   - On error: set error message, `setIsUploading(false)`, return
5. `const { data: dbData, error: dbError } = await supabase.from('uploads').insert({ user_id: user.id, type: uploadType, file_name: file.name, storage_path: path }).select('id').single()`
   - On error: `await supabase.storage.from(bucket).remove([path])`, set error, return
6. `await fetch('/api/parse-document', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ storagePath: path, uploadId: dbData.id }) })`
7. `setFile(file)`, `setStoragePath(path)`, `setUploadId(dbData.id)`
8. `onParsed?.(dbData.id)`
9. `setIsUploading(false)`

**`removeFile()` logic:**
1. If no `storagePath`, return
2. `await supabase.storage.from(bucket).remove([storagePath])`
3. If `uploadId`: `await supabase.from('uploads').delete().eq('id', uploadId)`
4. Reset: `setFile(null)`, `setStoragePath(null)`, `setUploadId(null)`
5. `onRemove?.()` (optional callback if needed)

### 1.4 Create `components/forms/DocumentUploadZone.tsx` (NEW, `'use client'` component)

**Test expectations that drive the structure:**

| Assertion | Implementation |
|---|---|
| `getByText('Curriculum Document')` | Visible `<p>` heading inside the component |
| `getByLabelText(/upload curriculum document/i)` | `<input type="file" aria-label="Upload curriculum document" className="sr-only" />` |
| `accept=".pdf,.docx,.xlsx,.jpg,.png"` | On the curriculum input |
| `getByText('Lesson Plan Template')` | Visible `<p>` heading for template zone |
| `getByLabelText(/upload lesson plan template/i)` | `<input type="file" aria-label="Upload lesson plan template" className="sr-only" />` |
| `accept=".pdf,.docx,.xlsx"` | On the template input |
| `getByText('syllabus.pdf')` after upload | File name displayed in preview |
| `getByText('PDF')` after upload | Extension badge (uppercase, derived from filename) |
| `getByRole('button', { name: /remove syllabus\.pdf/i })` | `<button aria-label={`remove ${file.name}`}>` |
| Clicking remove → `mockRemove` called | `removeFile()` from hook triggers `supabase.storage.from(...).remove(...)` |

**Props:**
```ts
interface DocumentUploadZoneProps {
  label: string;           // aria-label for the file input (e.g. "Upload curriculum document")
  accept: string;          // file accept string (e.g. ".pdf,.docx,.xlsx,.jpg,.png")
  uploadType: 'curriculum_doc' | 'template';
  onUploadComplete: (storagePath: string) => void;
  onRemove: () => void;
}
```

**Computed values:**
- `sectionHeading`: `uploadType === 'curriculum_doc' ? 'Curriculum Document' : 'Lesson Plan Template'`
- `inputId`: `uploadType === 'curriculum_doc' ? 'curriculum-doc-input' : 'template-input'`
- `extBadge`: `file?.name.split('.').pop()?.toUpperCase() ?? ''` (e.g. `"PDF"`, `"DOCX"`)

**JSX structure:**
```tsx
<div className="space-y-2">
  {/* Visible section heading */}
  <p className="text-sm font-medium text-[var(--color-text-primary)]">{sectionHeading}</p>

  {/* Hidden file input */}
  <input
    type="file"
    id={inputId}
    aria-label={label}
    accept={accept}
    className="sr-only"
    onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
    disabled={isUploading}
  />

  {/* Drag-and-drop zone — clickable label */}
  <label
    htmlFor={inputId}
    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
    className={cn(
      'flex items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer',
      isDragging
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
        : 'border-[var(--color-border)] bg-[var(--color-surface)]',
    )}
  >
    {/* No file state */}
    {!file && !isUploading && (
      <span className="text-sm text-[var(--color-text-secondary)]">
        Click or drag a file here
      </span>
    )}

    {/* Uploading state */}
    {isUploading && (
      <span className="text-sm text-[var(--color-text-secondary)]">Uploading…</span>
    )}

    {/* File preview state */}
    {file && !isUploading && (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm text-[var(--color-text-primary)]">{file.name}</span>
          <span className="shrink-0 rounded-md bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
            {extBadge}
          </span>
        </div>
        <button
          type="button"
          aria-label={`remove ${file.name}`}
          onClick={(e) => { e.preventDefault(); handleRemove(); }}
          className="shrink-0 rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
  </label>

  {/* Error message */}
  {error && (
    <p className="text-xs text-[var(--color-error)]">{error}</p>
  )}
</div>
```

**`handleRemove` inside component:**
```ts
const handleRemove = async () => {
  await removeFile();   // from useFileUpload hook
  onRemove();
};
```

### 1.5 Fix `app/(app)/generate/GenerateForm.tsx` (13 targeted changes)

Each change listed with the exact before/after so no regressions are introduced.

**A — Add import for `DocumentUploadZone`:**
```ts
import { DocumentUploadZone } from '@/components/forms/DocumentUploadZone';
```

**B — Fix `GenerateFormData` interface:**
```ts
// duration: string  →  duration: number
// Add: curriculumDocPath: string | null
// Add: templatePath: string | null
export interface GenerateFormData {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;                       // was: string
  teacherPrompt: string;
  modelPreference?: 'claude-sonnet-4-6';  // hint only — server enforces actual model
  curriculumDocPath: string | null;       // new
  templatePath: string | null;            // new
}

> **Model routing is server-side**: Free users always receive Gemini Flash regardless of this
> field — enforced in `lib/ai/router.ts`. `claude-opus-4-6` and `claude-haiku-4-5` are
> server-internal choices never exposed on the client interface.
```

**C — Add 120 to `DURATION_PRESETS`:**
```ts
// BEFORE: const DURATION_PRESETS = [30, 45, 60, 90];
const DURATION_PRESETS = [30, 45, 60, 90, 120];
```

**D — Add two new state variables** (after existing `useState` declarations):
```ts
const [curriculumDocPath, setCurriculumDocPath] = useState<string | null>(null);
const [templatePath, setTemplatePath] = useState<string | null>(null);
```

**E — Fix `handleSubmit` payload (two bugs):**
```ts
// Bug 1: curriculum incorrectly used durationSelect conditional
// Bug 2: duration was passed as string, not number
const formData: GenerateFormData = {
  subject,
  grade,
  curriculum,    // ← was: curriculum: durationSelect === 'custom' ? customDuration : curriculum
  duration: parseInt(durationSelect === 'custom' ? customDuration : durationSelect, 10),
  teacherPrompt,
  modelPreference,
  curriculumDocPath,   // ← new
  templatePath,        // ← new
};
```

**F — Fix heading text:**
```tsx
// was: <h1>Create Lesson Plan</h1>
// now:
<h1>Generate a Lesson</h1>
```

**G — Fix Grade label:**
```tsx
// was: Grade / Year Group
// now:
<label htmlFor="grade-select">Grade</label>
```

**H — Fix Curriculum label:**
```tsx
// was: Curriculum (optional)
// now:
<label htmlFor="curriculum-select">Curriculum</label>
```

**I — Fix Duration label:**
```tsx
// was: Lesson Duration
// now:
<label htmlFor="duration-select">Duration</label>
```

**J — Fix custom duration Input label:**
```tsx
// was: label="Enter duration (minutes)"
// now:
<Input label="How long is the lesson? (minutes)" ... />
```

**K — Fix teacher prompt label:**
```tsx
// was: Additional Instructions (optional)
// now:
<label htmlFor="teacher-prompt">Any specific focus or requirements?</label>
```

**L — Fix Generate button disabled condition:**
```tsx
// was: disabled={isSubmitting}
// now:
disabled={!subject.trim() || isSubmitting}
```

**M — Add two `DocumentUploadZone` instances in JSX:**
Place these after the teacher prompt field and before the model selector:
```tsx
<DocumentUploadZone
  label="Upload curriculum document"
  accept={CURRICULUM_DOC_ACCEPT}
  uploadType="curriculum_doc"
  onUploadComplete={(p) => setCurriculumDocPath(p)}
  onRemove={() => setCurriculumDocPath(null)}
/>

<DocumentUploadZone
  label="Upload lesson plan template"
  accept={TEMPLATE_ACCEPT}
  uploadType="template"
  onUploadComplete={(p) => setTemplatePath(p)}
  onRemove={() => setTemplatePath(null)}
/>
```

> `CURRICULUM_DOC_ACCEPT` and `TEMPLATE_ACCEPT` are already defined as constants in the file.

### 1.6 Update `lib/supabase/schema.sql` (reference doc only)

Add `template_path TEXT` to the `lesson_plans` CREATE TABLE statement so the schema doc stays
in sync with the migration:
```sql
-- inside lesson_plans definition:
template_path       TEXT,
```

### Phase 1 Validation

```bash
# All GenerateForm tests must pass:
npx jest "app/\(app\)/generate/GenerateForm.test.tsx" --no-coverage

# Zero TypeScript errors:
npx tsc --noEmit
```

**Commit:** `feat(form): fix GenerateForm bugs, restore upload zones (13 changes)`

---

## Phase 2 — AI Generation Wiring ✅ COMPLETE (`6ce8baa`, `c92b344`)

This phase verifies the end-to-end flow and adds E2E test coverage. No new production logic
is required — the API routes are already complete.

### 2.1 Verify data flow (read-only audit, no code changes)

Trace the `curriculumDocPath` / `templatePath` values from form to API:

1. `GenerateForm.tsx` → `onSubmit(formData)` with new fields populated
2. `GenerateClient.tsx` → `JSON.stringify(data)` → `fetch('/api/generate', { body })`
3. `app/api/generate/route.ts` → already destructures `curriculumDocPath` and `templatePath`
   from `req.json()` — **no change needed**

If any step in the chain is missing, fix it. Otherwise, no changes.

### 2.2 Verify `app/(app)/generate/page.tsx`

Current implementation reads `users.plan` for free/pro detection. This is correct for Phase 2.
Phase 4 migrates this to the `subscriptions` table. **No changes needed in this phase.**

### 2.3 Write `tests/e2e/generate-with-upload.spec.ts` (NEW)

Smoke test for the generate page. Full upload tests are skipped in CI unless `E2E_FULL=true`.

```ts
import { test, expect } from '@playwright/test';

test.describe('generate page', () => {
  test.beforeEach(async ({ page }) => {
    // Auth via storage state set up in global-setup.ts
    await page.goto('/generate');
  });

  test('renders generate heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /generate a lesson/i })).toBeVisible();
  });

  test('generate button is disabled when subject is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: /generate/i })).toBeDisabled();
  });

  test('curriculum document upload zone is visible', async ({ page }) => {
    await expect(page.getByText('Curriculum Document')).toBeVisible();
  });

  test('lesson plan template upload zone is visible', async ({ page }) => {
    await expect(page.getByText('Lesson Plan Template')).toBeVisible();
  });
});
```

### Phase 2 Validation

```bash
npx tsc --noEmit
npx jest --no-coverage
npx playwright test tests/e2e/generate-with-upload.spec.ts --project=chromium
```

**Commit:** `test(e2e): add generate page smoke tests`

---

## Phase 3 — Rich Text Editor + Export ✅ COMPLETE (`8974183`, `80371fe`, `65189ec`)

### 3.1 Install Tiptap

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-typography
```

### 3.2 Create `components/lesson/LessonEditor.tsx` (NEW, `'use client'`)

A Tiptap-based rich text editor for editing a single lesson section inline.

**Props:**
```ts
interface LessonEditorProps {
  content: string;              // HTML string from section
  onChange: (html: string) => void;
  onBlur?: () => void;
}
```

**Editor setup:**
```ts
const editor = useEditor({
  extensions: [StarterKit, Typography],
  content,
  onUpdate: ({ editor }) => onChange(editor.getHTML()),
  onBlur: () => onBlur?.(),
});
```

**Toolbar buttons** (use Lucide icons, 44px touch targets):
- Bold (`Bold`), Italic (`Italic`)
- Heading 3 (`Heading3`), Unordered list (`List`), Ordered list (`ListOrdered`)
- Undo (`Undo2`), Redo (`Redo2`)

**Styling rules:**
- Toolbar: `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-t-xl`
- Active button state: `bg-[var(--color-primary)]/15 text-[var(--color-primary)]`
- Editor area: `bg-[var(--color-surface)] border-x border-b border-[var(--color-border)] rounded-b-xl px-4 py-3`

### 3.3 Update `components/lesson/SectionCard.tsx`

Add inline editing support:

```ts
// New props:
interface SectionCardProps {
  title: string;
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (html: string) => void;
}
```

**JSX logic:**
- `isEditing === false`: render static `<p>` with section content + "Edit" button (`aria-label="Edit {title}"`)
- `isEditing === true`: render `<LessonEditor content={content} onChange={onChange} onBlur={onDone} />` + "Done" button (`aria-label="Done editing {title}"`)
- Import `LessonEditor` dynamically: `const LessonEditor = dynamic(() => import('./LessonEditor'), { ssr: false })`

### 3.4 Update `components/lesson/LessonView.tsx`

- Track which section is currently being edited: `const [editingKey, setEditingKey] = useState<string | null>(null)`
- Debounced auto-save (500ms) on content change:
  ```ts
  const debouncedSave = useMemo( 
    () => debounce(async (key: string, html: string) => {
      await supabase.from('lesson_plans')
        .update({ content: { ...content, [key]: html }, updated_at: new Date().toISOString() })
        .eq('id', lessonId);
    }, 30_000), // 30 s — prevents excessive Supabase write traffic on every keystroke
    [lessonId, content]
  );
  ```
- anime.js stagger reveal on mount (sections animate in):
  ```ts
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    anime({
      targets: '.section-card',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(80),
      easing: 'easeOutQuad',
    });
  }, []);
  ```
  Apply `className="section-card"` to each `SectionCard` wrapper. Use `will-change: transform` during animation, remove after via `complete` callback.
- `prefers-reduced-motion`: skip `translateY`, opacity-only fade if media query matches.

### 3.5 Verify export files

**`lib/export/pdf.tsx`** — read current implementation. Ensure:
- JSON lesson plan fields map to `@react-pdf/renderer` `<Text>` elements
- No Tiptap HTML is passed directly — strip tags to plain text per section or use html-react-parser
- If HTML stripping is needed, use a utility: `content.replace(/<[^>]*>/g, '')` or install `html-react-parser`

**`lib/export/docx.ts`** — read current implementation. Ensure:
- JSON content maps to `docx` `Paragraph` elements correctly
- Section titles become `Heading2` or `Heading3`

**`app/api/export/route.ts`** — verify it handles the updated lesson plan JSON structure correctly.

### 3.6 Write `components/lesson/LessonEditor.test.tsx` (NEW)

```ts
describe('LessonEditor', () => {
  it('renders with initial content', ...)
  it('calls onChange when text is typed', ...)
  it('calls onBlur when editor loses focus', ...)
  it('bold button is accessible and toggles bold', ...)
})
```

### Phase 3 Validation

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-typography
npx jest components/lesson/ --no-coverage
npx tsc --noEmit
```

**Commit:** `feat(editor): add Tiptap inline editor with auto-save and section stagger`

---

## Phase 4 — Stripe Billing ⏸ NOT STARTED (blocked: debugging generation error)

### 4.1 Install Stripe SDK

```bash
npm install stripe
```

### 4.2 Create `supabase/migrations/003_stripe_fields.sql` (NEW)

```sql
-- Add Stripe-specific fields to the subscriptions table (created in migration 002)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id         TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end     BOOLEAN NOT NULL DEFAULT false;
```

### 4.3 Create `app/api/webhooks/stripe/route.ts` (NEW)

Stripe webhook handler. **Security**: always verify signature before processing.

```ts
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'checkout.session.completed': { ... }
    case 'customer.subscription.updated': { ... }
    case 'customer.subscription.deleted': { ... }
  }

  return new Response('OK', { status: 200 });
}
```

**Event handling:**
- `checkout.session.completed`: upsert `subscriptions` row, set `plan='pro'`, `status='active'`
- `customer.subscription.updated`: update `plan`, `status`, `current_period_end`, `cancel_at_period_end`
- `customer.subscription.deleted`: set `status='canceled'`, update `users.plan='free'`

### 4.4 Create `components/ui/UpgradePrompt.tsx` (NEW, `'use client'`)

Modal shown when a free user has reached the 5-lesson limit:

```tsx
// Must satisfy:
// getByRole('dialog', { name: /upgrade to pro/i })
// getByRole('button', { name: /upgrade to pro/i }) → navigates to /settings#billing
// getByRole('button', { name: /dismiss/i }) → closes modal
```

### 4.5 Update `app/(app)/generate/page.tsx`

Migrate plan detection from `users.plan` to the `subscriptions` table:

```ts
// BEFORE: reads users.plan
const { data } = await supabase
  .from('users')
  .select('default_subject, default_grade, default_curriculum, plan')
  .eq('id', user.id)
  .single();
userPlan = data?.plan ?? 'free';

// AFTER: parallel fetch, subscriptions is source of truth
const [{ data: userData }, { data: subData }] = await Promise.all([
  supabase
    .from('users')
    .select('default_subject, default_grade, default_curriculum')
    .eq('id', user.id)
    .single(),
  supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle(),
]);

userPlan = subData?.plan === 'pro' ? 'pro' : 'free';
```

### 4.6 Update `app/api/generate/route.ts`

Add free-tier lesson count check (insert before generation starts):

```ts
if (userPlan === 'free') {
  const { count } = await supabase
    .from('lesson_plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'FREE_LIMIT_REACHED' }, { status: 402 });
  }
}
```

In `GenerateClient.tsx`, handle `402` response: show `<UpgradePrompt />`.

### 4.7 Environment variables (document only — never commit secrets)

Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Phase 4 Validation

```bash
npm install stripe
npx tsc --noEmit
npx jest --no-coverage
```

**Commit:** `feat(billing): add Stripe webhook handler and free-tier lesson limit`

---

## Environment Variables Reference

Required for all phases:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

Required for Phase 4:
```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## Files Changed per Phase

| Phase | New Files | Modified Files |
|---|---|---|
| 1 | `supabase/migrations/001_add_template_path.sql`, `supabase/migrations/002_create_subscriptions.sql`, `lib/hooks/useFileUpload.ts`, `components/forms/DocumentUploadZone.tsx` | `lib/utils/grades.ts`, `app/(app)/generate/GenerateForm.tsx`, `lib/supabase/schema.sql` |
| 2 | `tests/e2e/generate-with-upload.spec.ts` | — |
| 3 | `components/lesson/LessonEditor.tsx`, `components/lesson/LessonEditor.test.tsx` | `components/lesson/SectionCard.tsx`, `components/lesson/LessonView.tsx`, `lib/export/pdf.tsx` (if needed), `lib/export/docx.ts` (if needed) |
| 4 | `supabase/migrations/003_stripe_fields.sql`, `app/api/webhooks/stripe/route.ts`, `components/ui/UpgradePrompt.tsx` | `app/(app)/generate/page.tsx`, `app/api/generate/route.ts`, `app/(app)/generate/GenerateClient.tsx` |

---

## Validation Sequence (cumulative)

```bash
# After Phase 1 (must all pass):
npx jest "app/\(app\)/generate/GenerateForm.test.tsx" --no-coverage
npx tsc --noEmit

# After Phase 2 (must all pass):
npx jest --no-coverage
npx tsc --noEmit
npx playwright test tests/e2e/generate-with-upload.spec.ts --project=chromium

# After Phase 3:
npx jest components/lesson/ --no-coverage
npx tsc --noEmit

# After Phase 4:
npx tsc --noEmit
npx jest --no-coverage
```

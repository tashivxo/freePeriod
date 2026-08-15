# Mandarin (Simplified Chinese) Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `zh-Hans` (简体中文) as a fifth coupled locale so hybrid UI, generation, persistence, and DOCX export work at the H1 plumbing bar.

**Architecture:** Reuse the existing one-preference path (`LOCALES` → `LocaleProvider` → generate `locale` → `buildLocaleInstructions`). Do not split UI vs plan language, do not add a lesson `locale` column, do not introduce i18next. CJK UI uses Noto Sans SC when `html[lang="zh-Hans"]`. DOCX sets an east-Asian font so Chinese glyphs resolve in Word without storing locale on the lesson row.

**Tech Stack:** Next.js App Router, custom `lib/i18n`, `next/font/google` (`Noto_Sans_SC`), Gemini/Claude shared prompts in `lib/ai/claude.ts`, `docx` + JSZip export, Supabase CHECK on `users.preferred_locale`.

**Spec:** `docs/superpowers/specs/2026-08-15-mandarin-language-design.md`

**Launch bar (H1 + F2):** locale selectable and persisted; hybrid `Messages` present; generate returns Simplified Chinese values with English JSON/phase labels; DOCX Chinese is not tofu. Not in scope: Traditional, curriculum packs, full-app i18n, H2 quality spot-checks.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/i18n/locales.ts` | Modify | Add `zh-Hans` to `LOCALES` / `LOCALE_LABELS` |
| `lib/i18n/messages/zh-Hans.ts` | Create | Hybrid dictionary typed as `Messages` |
| `lib/i18n/messages/index.ts` | Modify | Register `zh-Hans` |
| `types/lesson.ts` | Modify | Add `zh-Hans` to `GenerationLocale` / `GENERATION_LOCALES` |
| `lib/ai/claude.ts` | Modify | Language name + formal Simplified extras |
| `lib/ai/claude.test.ts` | Modify | `zh-Hans` prompt assertions |
| `app/layout.tsx` | Modify | Load Noto Sans SC CSS variable |
| `app/globals.css` | Modify | `html[lang="zh-Hans"]` body font |
| `lib/supabase/schema.sql` | Modify | Widen `preferred_locale` CHECK |
| `supabase/migrations/008_preferred_locale_zh_hans.sql` | Create | Widen hosted/local CHECK |
| `lib/export/docx.ts` | Modify | East-Asian font on runs |
| `lib/export/docx.test.ts` | Modify | Assert eastAsia font when CJK present |
| `lib/export/fill-generic-template.ts` | Modify | Inject eastAsia `w:rFonts` for CJK fills |
| `providers/locale.test.tsx` | Modify | `zh-Hans` helper + ltr |
| `components/ui/LanguagePicker.test.tsx` | Modify | Type from `Locale`; expect 简体中文 |
| `lib/export/cjk.ts` | Create | Shared CJK detection helper |

**Do not modify:** auth/onboarding/generate field labels, curriculum packs, `isRtl` (Arabic only), lesson_plans schema, marketing-only landing variants.

**Picker/Settings UI:** no component rewrite — they already iterate `LOCALES`.

---

### Task 1: Locale allowlist (TDD)

**Files:**
- Modify: `lib/i18n/locales.ts`
- Modify: `types/lesson.ts`
- Modify: `providers/locale.test.tsx`

- [ ] **Step 1: Extend the existing helper test so `zh-Hans` fails on current code**

In `providers/locale.test.tsx`, add to the `isLocale` example:

```ts
expect(isLocale('zh-Hans')).toBe(true);
expect(isLocale('zh')).toBe(false);
expect(isLocale('zh-Hant')).toBe(false);
```

Add a new case:

```ts
it('getMessages will be registered for zh-Hans in a later task', () => {
  expect(isLocale('zh-Hans')).toBe(true);
});
```

Do **not** call `getMessages('zh-Hans')` until Task 2 (it will throw / type-error).

- [ ] **Step 2: Run the helper test and confirm `zh-Hans` fails**

Run: `npx jest providers/locale.test.tsx --testNamePattern="isLocale"`

Expected: FAIL — `isLocale('zh-Hans')` is false.

- [ ] **Step 3: Add the locale to both allowlists**

`lib/i18n/locales.ts` — replace the file contents with:

```ts
export const LOCALES = ['en', 'ar', 'es', 'fr', 'zh-Hans'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  'zh-Hans': '简体中文',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}
```

`types/lesson.ts` — change:

```ts
export type GenerationLocale = 'en' | 'ar' | 'es' | 'fr' | 'zh-Hans';

export const GENERATION_LOCALES: GenerationLocale[] = ['en', 'ar', 'es', 'fr', 'zh-Hans'];
```

Keep `Locale` and `GenerationLocale` identical member-for-member.

- [ ] **Step 4: Re-run helper tests**

Run: `npx jest providers/locale.test.tsx --testNamePattern="isLocale"`

Expected: PASS for `isLocale('zh-Hans')`. `getMessages` tests that still only use `en`/`fr` keep passing.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/locales.ts types/lesson.ts providers/locale.test.tsx
git commit -m "feat: allow zh-Hans as a fifth app and generation locale"
```

---

### Task 2: Hybrid message dictionary

**Files:**
- Create: `lib/i18n/messages/zh-Hans.ts`
- Modify: `lib/i18n/messages/index.ts`
- Modify: `providers/locale.test.tsx`

- [ ] **Step 1: Write a failing `getMessages` assertion**

Add to `providers/locale.test.tsx`:

```ts
it('getMessages returns the zh-Hans dictionary', () => {
  expect(getMessages('zh-Hans').settings.language).toBe('语言');
  expect(getMessages('zh-Hans').settings.languageDescription).toContain('教案');
});
```

Run: `npx jest providers/locale.test.tsx --testNamePattern="zh-Hans dictionary"`

Expected: FAIL (type error and/or missing key in `MESSAGES`).

- [ ] **Step 2: Create `lib/i18n/messages/zh-Hans.ts`**

```ts
import type { Messages } from './en';

export const zhHans: Messages = {
  nav: {
    dashboard: '控制台',
    generate: '生成',
    history: '历史记录',
    settings: '设置',
    homeAriaLabel: 'FreePeriod 首页',
  },
  settings: {
    title: '设置',
    zenMode: '禅模式',
    zenModeDescription: '彩色背景会不会太花？试试禅模式。',
    language: '语言',
    languageDescription: '网站和新教案都使用此语言。',
    defaultSubject: '默认学科',
    selectSubject: '选择学科',
    enterSubject: '输入学科',
    defaultGrade: '默认年级',
    selectGrade: '选择年级',
    defaultCurriculum: '默认课程纲要',
    selectCurriculum: '选择课程纲要',
    enterCurriculum: '输入课程纲要',
    save: '保存设置',
    saving: '保存中...',
    saved: '设置已保存！',
    saveFailed: '保存设置失败',
    account: '账户',
    email: '邮箱',
    plan: '方案',
    usage: '用量',
    manageSubscription: '管理订阅',
    logOut: '退出登录',
    deleteAccount: '删除账户',
    deleteConfirmDescription:
      '账户将立即停用。个人数据会在 30 天宽限期后永久删除。请先导出需要保留的教案。',
    deleteConfirmLabel: '请输入 "DELETE" 以确认',
    deleting: '删除中...',
    confirmDeletion: '确认删除',
    cancel: '取消',
    legal: '法律信息',
    legalDescription: '我们如何处理你的数据，以及使用 FreePeriod 的规则。',
    privacyPolicy: '隐私政策',
    termsOfService: '服务条款',
  },
  landing: {
    headerPricing: '定价',
    headerSignIn: '登录',
    heroHeadline1: '教案生成只需',
    heroHeadlineHighlight: '几秒，',
    heroHeadline2: '不必花上几小时',
    heroSub:
      '上传课程文件、描述你的需求，FreePeriod 就会生成完整、结构化的教案，可编辑、可导出。',
    heroCtaPrimary: '免费开始',
    heroCtaSecondary: '登录',
    heroStatTime: '平均 15 秒生成',
    heroStatFree: '免费起步',
    featuresTitle: '教师为什么喜欢 FreePeriod',
    featuresSub: '结构可靠，需要时足够快。',
    featureStructuredPlans: '结构化教案',
    featureStructuredPlansDesc:
      '十二个栏目覆盖目标、活动、分层教学与评价，每次结构一致、可放心使用。',
    featureAiPowered: 'AI 驱动',
    featureAiPoweredDesc: '按学科、年级和课程纲要，数秒内量身生成。',
    featureExportAnywhere: '随处导出',
    featureExportAnywhereDesc: '下载为 DOCX 或已填写的模板。导出前可在页面内编辑。',
    ctaHeadline: '准备好把晚上的时间要回来了吗？',
    ctaSub: '加入那些规划更快、却不牺牲结构的教师。',
    ctaBandTitle: '你的教案，按你的方式',
    ctaBandSub: '从空白开始，或上传模板由 AI 填写。',
    conversionPoint1: '每份教案包含 12 个结构化栏目',
    conversionPoint2: '导出前可编辑',
    conversionPoint3: '免费起步。无需信用卡。',
    ctaButton: '免费开始',
    footerNavAriaLabel: '法律与支持',
    footerContact: '联系我们',
    footerTagline: '教师打造，服务教师。',
  },
  generate: {
    planLanguageHint: '新教案将以{language}撰写',
  },
};
```

Keep `"DELETE"` in `deleteConfirmLabel` (same as FR — the confirm token is English).

- [ ] **Step 3: Register the dictionary**

`lib/i18n/messages/index.ts`:

```ts
import type { Locale } from '@/lib/i18n/locales';
import { ar } from './ar';
import { en } from './en';
import type { Messages } from './en';
import { es } from './es';
import { fr } from './fr';
import { zhHans } from './zh-Hans';

export type { Messages };

const MESSAGES: Record<Locale, Messages> = {
  en,
  ar,
  es,
  fr,
  'zh-Hans': zhHans,
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest providers/locale.test.tsx`

Expected: PASS. Also add:

```ts
it('setLocale applies zh-Hans as ltr', () => {
  const { result } = renderHook(() => useLocale(), { wrapper: LocaleProvider });
  act(() => {
    result.current.setLocale('zh-Hans');
  });
  expect(result.current.locale).toBe('zh-Hans');
  expect(result.current.dir).toBe('ltr');
  expect(document.documentElement.lang).toBe('zh-Hans');
  expect(document.documentElement.dir).toBe('ltr');
  expect(localStorage.getItem('fp-locale')).toBe('zh-Hans');
});
```

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/messages/zh-Hans.ts lib/i18n/messages/index.ts providers/locale.test.tsx
git commit -m "feat: add Simplified Chinese hybrid UI messages"
```

---

### Task 3: Generation prompt rules

**Files:**
- Modify: `lib/ai/claude.ts`
- Modify: `lib/ai/claude.test.ts`

- [ ] **Step 1: Add a failing prompt test**

In `lib/ai/claude.test.ts`, inside `adds language instructions for non-English locales`, after the French assertions:

```ts
    const zhSystem = buildSystemPrompt(undefined, 'zh-Hans');
    const zhUser = buildUserPrompt({ ...baseParams, locale: 'zh-Hans' });
    expect(zhSystem).toContain('LANGUAGE OUTPUT REQUIREMENTS');
    expect(zhSystem).toContain('Write ALL human-readable JSON string VALUES in Simplified Chinese');
    expect(zhSystem).toContain('Keep ALL JSON object KEYS in English');
    expect(zhSystem).toContain('"Time:", "Teacher Activity:"');
    expect(zhSystem).toContain('formal written Simplified Chinese');
    expect(zhSystem).toContain('Do not use Traditional characters');
    expect(zhSystem).toContain('Preserve curriculum codes');
    expect(zhUser).toContain('- Output language: Simplified Chinese (zh-Hans)');
```

Run: `npx jest lib/ai/claude.test.ts --testNamePattern="non-English"`

Expected: FAIL — missing language name and extras.

- [ ] **Step 2: Update `LOCALE_LANGUAGE_NAMES` and extras**

In `lib/ai/claude.ts`:

```ts
const LOCALE_LANGUAGE_NAMES: Record<GenerationLocale, string> = {
  en: 'English',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  'zh-Hans': 'Simplified Chinese',
};
```

After the existing `if (locale === 'ar') { ... }` block, add:

```ts
  if (locale === 'zh-Hans') {
    instructions += `\n- Use formal written Simplified Chinese suitable for teacher professional documents (书面语 / 教案用语).
- Do not use Traditional Chinese characters.
- Preserve curriculum codes and standards identifiers untranslated when they are present in the uploaded curriculum document.
- Do not invent, translate, or infer curriculum codes or standards identifiers.
- English proper nouns, product names, and subject terms may remain in English when that is normal in the teaching context.`;
  }
```

Do not translate activity-phase labels. Do not change `ACTIVITY_PHASE_FORMAT` English labels.

- [ ] **Step 3: Re-run prompt tests**

Run: `npx jest lib/ai/claude.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/claude.ts lib/ai/claude.test.ts
git commit -m "feat: generate Simplified Chinese lesson values with English scaffolding"
```

---

### Task 4: UI CJK font

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Load Noto Sans SC beside the existing fonts**

`app/layout.tsx` — extend the google-font import and add a third family:

```ts
import { Manrope, Noto_Sans_Arabic, Noto_Sans_SC } from 'next/font/google';
```

```ts
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin', 'chinese-simplified'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-sc',
  weight: ['400', '500', '600', '700'],
});
```

If `chinese-simplified` is rejected by the installed `next/font` types, drop it and keep `subsets: ['latin']` only after confirming the SC family still emits Chinese files in `.next` (Noto Sans SC is a CJK face). Prefer including `chinese-simplified` when the type allows it.

Apply the variable on `<html>`:

```tsx
<html
  lang="en"
  className={cn(manrope.variable, notoSansArabic.variable, notoSansSC.variable)}
>
```

- [ ] **Step 2: Scope the font to Mandarin documents**

In `app/globals.css`, immediately after the `html[lang="ar"] body` rule:

```css
  html[lang="zh-Hans"] body {
    font-family: var(--font-noto-sans-sc), var(--font-manrope), sans-serif;
  }
```

Do not change `isRtl`. Do not set `dir=rtl` for `zh-Hans`.

- [ ] **Step 3: Typecheck / lint the touched files**

Run: `npx tsc --noEmit --pretty false` (or project’s existing typecheck). If `Noto_Sans_SC` subset enum fails, fix subsets as in Step 1.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: load Noto Sans SC when the UI locale is zh-Hans"
```

---

### Task 5: Database CHECK

**Files:**
- Create: `supabase/migrations/008_preferred_locale_zh_hans.sql`
- Modify: `lib/supabase/schema.sql`

- [ ] **Step 1: Add migration `supabase/migrations/008_preferred_locale_zh_hans.sql`**

```sql
alter table public.users
  drop constraint if exists users_preferred_locale_check;

alter table public.users
  add constraint users_preferred_locale_check
  check (preferred_locale in ('en', 'ar', 'es', 'fr', 'zh-Hans'));
```

- [ ] **Step 2: Mirror in base schema**

In `lib/supabase/schema.sql`, change the `preferred_locale` column to:

```sql
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'ar', 'es', 'fr', 'zh-Hans')),
```

No TypeScript `User` field change — `preferred_locale: Locale` already follows `Locale`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_preferred_locale_zh_hans.sql lib/supabase/schema.sql
git commit -m "feat: allow zh-Hans on users.preferred_locale"
```

After merge to hosted Supabase, run this migration in the SQL Editor (same operational note as other CHECK widenings). Do not invent a lesson-row locale column.

---

### Task 6: DOCX east-Asian font (F2)

**Files:**
- Create: `lib/export/cjk.ts`
- Create: `lib/export/cjk.test.ts`
- Modify: `lib/export/docx.ts`
- Modify: `lib/export/docx.test.ts`
- Modify: `lib/export/fill-generic-template.ts`

Because v1 stores no per-lesson locale, set an east-Asian font on generated runs so CJK never tofu. Latin stays Calibri via `ascii` / `hAnsi`.

- [ ] **Step 1: CJK helper + failing tests**

`lib/export/cjk.ts`:

```ts
const CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

export function containsCjk(text: string): boolean {
  return CJK_RE.test(text);
}

export const DOCX_LATIN_FONT = 'Calibri';
export const DOCX_EAST_ASIA_FONT = 'Microsoft YaHei';

export const DOCX_RUN_FONT = {
  ascii: DOCX_LATIN_FONT,
  hAnsi: DOCX_LATIN_FONT,
  eastAsia: DOCX_EAST_ASIA_FONT,
} as const;

export function ensureEastAsiaRFonts(rPrXml: string): string {
  if (/w:eastAsia=/.test(rPrXml)) {
    return rPrXml.replace(/w:eastAsia="[^"]*"/, `w:eastAsia="${DOCX_EAST_ASIA_FONT}"`);
  }
  if (/<w:rFonts\b[^/]*\/>/.test(rPrXml)) {
    return rPrXml.replace(
      /<w:rFonts\b([^/]*)\/>/,
      `<w:rFonts$1 w:eastAsia="${DOCX_EAST_ASIA_FONT}"/>`,
    );
  }
  if (/<w:rFonts\b[^>]*>/.test(rPrXml)) {
    return rPrXml.replace(
      /<w:rFonts\b([^>]*)>/,
      `<w:rFonts$1 w:eastAsia="${DOCX_EAST_ASIA_FONT}">`,
    );
  }
  return rPrXml.replace(
    /<w:rPr>/,
    `<w:rPr><w:rFonts w:ascii="${DOCX_LATIN_FONT}" w:hAnsi="${DOCX_LATIN_FONT}" w:eastAsia="${DOCX_EAST_ASIA_FONT}"/>`,
  );
}
```

`lib/export/cjk.test.ts`:

```ts
import { containsCjk, ensureEastAsiaRFonts, DOCX_EAST_ASIA_FONT } from './cjk';

describe('CJK export helpers', () => {
  it('detects Simplified Chinese text', () => {
    expect(containsCjk('能量转化')).toBe(true);
    expect(containsCjk('Energy')).toBe(false);
  });

  it('injects eastAsia Microsoft YaHei into empty rPr', () => {
    const out = ensureEastAsiaRFonts('<w:rPr></w:rPr>');
    expect(out).toContain(`w:eastAsia="${DOCX_EAST_ASIA_FONT}"`);
  });
});
```

Run: `npx jest lib/export/cjk.test.ts`

Expected: FAIL until the file exists; then PASS after Step 1 files are added.

- [ ] **Step 2: Wire `docx.ts` run fonts**

Replace `const FONT = 'Calibri';` usage. Keep `FONT_SIZE`. Import `DOCX_RUN_FONT` from `./cjk`.

`textRun`:

```ts
function textRun(text: string, bold = false): TextRun {
  return new TextRun({
    text: prepareCellText(text),
    font: DOCX_RUN_FONT,
    size: FONT_SIZE,
    bold,
  });
}
```

In `generateDocx` styles default:

```ts
        document: {
          run: { font: DOCX_RUN_FONT, size: FONT_SIZE },
        },
```

Remove the unused `FONT` constant.

- [ ] **Step 3: Assert generated XML**

In `lib/export/docx.test.ts`, add a lesson clone whose `content.title` is `'能量转化与守恒'` and:

```ts
    const buffer = await generateDocx(cjkLesson);
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Microsoft YaHei');
    expect(xml).toContain('能量转化与守恒');
```

Use the same JSZip pattern already in `docx-structure.test.ts` if `docx.test.ts` does not import JSZip yet (`import JSZip from 'jszip'`).

Run: `npx jest lib/export/docx.test.ts lib/export/docx-structure.test.ts`

Expected: PASS. Structure tests must still pass (layout unchanged).

- [ ] **Step 4: Filled templates**

In `lib/export/fill-generic-template.ts`, import `containsCjk` and `ensureEastAsiaRFonts`. Inside `buildParagraphsXml`, after choosing `rPrToUse` / `baseRPrNoBold`, if `containsCjk(text)` then run `ensureEastAsiaRFonts` on the rPr strings before emitting `<w:r>`.

If there is an existing fill-generic-template test file, add a case with CJK text expecting `w:eastAsia="Microsoft YaHei"`. If none exists, the `cjk.test.ts` unit test plus a focused test on `buildParagraphsXml` is enough only if you export that helper — otherwise keep the injection local and cover it via any existing fill tests. Prefer exporting `buildParagraphsXml` only if tests already do; otherwise cover through the public fill function.

- [ ] **Step 5: Commit**

```bash
git add lib/export/cjk.ts lib/export/cjk.test.ts lib/export/docx.ts lib/export/docx.test.ts lib/export/fill-generic-template.ts
git commit -m "feat: use Microsoft YaHei for east-Asian text in DOCX exports"
```

---

### Task 7: Picker test typing

**Files:**
- Modify: `components/ui/LanguagePicker.test.tsx`

- [ ] **Step 1: Stop hardcoding the four-locale union**

Change:

```ts
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

let mockLocale: Locale = 'en';
```

Add `zh-Hans` to the mocked `messages` map:

```ts
    'zh-Hans': { 'settings.language': '语言' },
```

- [ ] **Step 2: Run picker tests**

Run: `npx jest components/ui/LanguagePicker.test.tsx`

Expected: PASS. The existing “every LOCALES entry” test now requires a menuitem named `简体中文`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/LanguagePicker.test.tsx
git commit -m "test: expect Simplified Chinese in the language picker"
```

---

### Task 8: H1 plumbing verification

No new product surfaces. Confirm the existing path:

1. `LanguagePicker` / Settings iterate `LOCALES` → 简体中文 appears.
2. Settings `update({ preferred_locale })` accepts `zh-Hans` after migration 008.
3. Generate page hydrates `preferredLocale` via `isLocale`.
4. `GenerateClient` POSTs `locale: generationLocale`.
5. `/api/generate` `resolveLocale` allowlists `GENERATION_LOCALES`.

- [ ] **Step 1: Run the locale-related unit suite**

```bash
npx jest providers/locale.test.tsx lib/ai/claude.test.ts components/ui/LanguagePicker.test.tsx app/(app)/settings/SettingsClient.test.tsx lib/export/cjk.test.ts lib/export/docx.test.ts
```

Expected: PASS.

- [ ] **Step 2: Manual H1 checklist (implementer, not a code task)**

- [ ] Landing: choose 简体中文 → header/hero use Chinese; `<html lang="zh-Hans">`; body uses Noto Sans SC
- [ ] Settings: save → `users.preferred_locale` is `zh-Hans`; reload keeps it
- [ ] Generate: hint shows 简体中文; completed plan values are Simplified Chinese; `Time:` / `Teacher Activity:` labels remain English
- [ ] Export DOCX: open in Word; Chinese glyphs visible (not □)

If generation returns Traditional characters, tighten the `zh-Hans` extra line in `claude.ts` (already “Do not use Traditional Chinese characters”) — do not add a second locale.

- [ ] **Step 3: Final commit only if Step 2 found code fixes**

Otherwise no extra commit.

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| A1 `zh-Hans` / G1 简体中文 | 1, 2, 7 |
| B3 coupled locale | 1 (no second control) |
| C1 hybrid Messages | 2 |
| D1 + D-R1 prompts | 3 |
| E1 no packs | (omitted) |
| F2 UI font | 4 |
| F2 DOCX | 6 |
| H1 persistence / generate | 5, 8 |
| I out of scope | File map “Do not modify” |

## Alternatives rejected

- **`zh` / `zh-CN` instead of `zh-Hans`:** rejected; spec locks BCP-47 `zh-Hans` so Traditional can be `zh-Hant` later without migrating `zh`.
- **Per-lesson locale column:** owner I — out. Export uses east-Asian font on runs instead.
- **i18next:** out; keep custom dictionaries.
- **Always-on Noto Sans SC for every `lang`:** would bloat Latin/Arabic pages; scope with `html[lang="zh-Hans"]`.

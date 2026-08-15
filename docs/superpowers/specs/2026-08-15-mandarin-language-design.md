# Mandarin (Simplified Chinese) Language Support — Design Spec

**Status:** Locked from owner decisions  
**Date:** 2026-08-15  
**Owner:** Jayandree Govender (`janiestribe@gmail.com`)  
**Source:** Completed decision doc returned 2026-08-15 (`Mandarin-Language-Support-Decision-Doc-Completed.docx`, thread *Re: Mandarin integration into FreePeriod*)  
**Prior context:** `docs/superpowers/specs/2026-08-14-mandarin-language-product-decisions.md`

This spec records **accepted options only**. Implementation must not reopen them. Follow-up work (Traditional, split UI/plan language, curriculum packs, H2 quality bar) needs a new owner decision.

---

## 1. Product intent

Add **Simplified Chinese** as a fifth language in the existing one-preference model so a teacher can select it in Settings / the landing picker, see hybrid UI copy in 简体中文, and generate new lesson plans whose human-readable values are in formal Simplified Chinese.

v1 is a **demand test**, not a China go-to-market. Primary customer is **not confirmed** — informal interest from a Chinese-speaking contact, no committed school. Keep the ship small.

---

## 2. Locked decisions

| ID | Choice | Locked meaning |
|----|--------|----------------|
| **A1** | Simplified only | One locale: `zh-Hans`. Label: `简体中文`. No Traditional (`zh-Hant`) in v1. |
| **B3** | Coupled now, split later | Website language and new lesson-plan language stay one setting. No second control. |
| **C1** | Hybrid parity with AR/ES/FR | Translate only the existing `Messages` dictionary surfaces. Do not expand auth/onboarding/generate form/dashboard body. |
| **D1 + D-R1** | ES/FR scaffolding + formal register | Plan **values** in Simplified Chinese. JSON keys and activity-phase labels (`Time:`, `Teacher Activity:`, …) stay **English**. Formal teacher-document Mandarin (parallel to Arabic MSA extras). |
| **E1** | Language only | No new curriculum guideline packs. Existing curricula + uploads still apply. |
| **F2** | UI + export fonts | Load Noto Sans SC for UI when `lang=zh-Hans`. DOCX export must use a CJK-capable font so Chinese is readable in Word. |
| **G1** | Endonym only | Picker/settings row shows `简体中文`, not an English gloss. |
| **H1** | Plumbing launch bar | Ship when locale is selectable, persists, generation returns Simplified Chinese, hybrid strings exist, and F2 export renders Chinese. **Not** a 3–5 subject teacher-quality gate. |
| **I** | Keep extras out | See §4. |

**Must-have for launch** (owner sheet): locale selectable and persists; generation returns Simplified Chinese; DOCX exports render Chinese (F2).

**Nice-to-have later:** fuller UI translation, curriculum packs, H2 spot-checks.

---

## 3. Locale contract

| Field | Value |
|-------|--------|
| Code | `zh-Hans` (BCP-47; not `zh`, not `zh-CN`) |
| `document.documentElement.lang` | `zh-Hans` |
| Direction | `ltr` (`isRtl` stays Arabic-only) |
| UI dictionary | `lib/i18n/messages/zh-Hans.ts` typed as `Messages` |
| Generation name in prompts | `Simplified Chinese` |
| DB `preferred_locale` | Add `zh-Hans` to the CHECK (schema + new migration) |

Keep UI `Locale` and `GenerationLocale` in lockstep, same as today (`en` / `ar` / `es` / `fr`).

---

## 4. Out of scope (v1)

Do **not** implement:

- Traditional Chinese, Cantonese, or a second Chinese picker row
- Full-app string coverage beyond `Messages`
- Decoupled “app language” vs “plan language”
- Mandarin-specific marketing landing or GTM push
- Per-lesson `locale` column on `lesson_plans`
- New curriculum packs or bilingual pedagogy packs
- Switching the i18n system to i18next
- H2 teacher-quality spot-check as a release gate
- YYYY/MM/DD or CNY formatting changes (not in the locked sheet; current app is not currency-dated UI)

---

## 5. UX

- Landing `LanguagePicker` and Settings `AnimatedDropdown` pick up `zh-Hans` from `LOCALES` / `LOCALE_LABELS`. No new control.
- Settings copy stays: *website and new lesson plans use this language* (translated).
- Hybrid surfaces in scope (same as AR/ES/FR): landing header/hero/features/CTA, Navbar, Settings, Generate plan-language hint, MarketingFooter.
- `generate.planLanguageHint` interpolates `LOCALE_LABELS['zh-Hans']` → `新教案将以简体中文撰写` (or equivalent).
- No RTL work. Watch CJK truncation in dropdowns (endonym is short).

---

## 6. Generation / AI

Extend `buildLocaleInstructions` in `lib/ai/claude.ts` (Gemini already reuses these builders).

For `zh-Hans`:

1. Same base non-English rules as ES/FR (values translated, keys and phase labels English).
2. Extra register block, Arabic-style:
   - Use **formal written Simplified Chinese** suitable for teacher professional documents (书面语 / 教案用语).
   - Do **not** use Traditional characters.
   - Preserve curriculum codes and standards identifiers untranslated when present in an uploaded document; do not invent codes.
   - English proper nouns / subject terms may remain in English when that is normal in international-school teaching; do not force-translate codes or product names.

Success criteria may stay as Chinese equivalents of “I can …” **inside the value text**; the label `Learner Activity & Success Criteria:` stays English.

---

## 7. Fonts and export

**UI**

- Add `Noto_Sans_SC` via `next/font/google` (`subsets: ['latin']` is not enough — use the SC font’s Chinese subset as Next documents).
- CSS: `html[lang="zh-Hans"] body { font-family: var(--font-noto-sans-sc), var(--font-manrope), sans-serif; }`
- Apply the CSS variable on `<html>` next to Manrope + Noto Sans Arabic.

**DOCX (`lib/export/docx.ts`)**

- Today every run is `font: 'Calibri'`.
- When exporting a Mandarin plan, set OOXML east-Asian font to a CJK face Word will resolve (primary: `Microsoft YaHei`; latin remains Calibri).
- Because v1 has **no per-lesson locale column**, detect CJK in lesson text **or** pass the exporting user’s `preferred_locale` into `generateDocx`. Prefer: `preferred_locale === 'zh-Hans'` **or** CJK in content → CJK font path (covers “generated in Chinese, user still on zh-Hans”).
- Filled-template export (`fill-generic-template.ts`) must not strip east-Asian font on inserted runs if the filled text contains CJK; inject `w:eastAsia` on those runs when CJK is present.
- H1 does **not** require a Windows+Mac Word screenshot QA bar (that was F3, rejected). Unit-test the font mapping in the generated XML.

---

## 8. Data

New migration `supabase/migrations/008_preferred_locale_zh_hans.sql`:

- Drop `users_preferred_locale_check`
- Recreate CHECK `('en','ar','es','fr','zh-Hans')`
- Mirror the same CHECK in `lib/supabase/schema.sql`

No lesson-row changes. RLS unchanged.

Hosted Supabase: apply this migration in the SQL Editor after merge (same operational pattern as other CHECK widenings).

---

## 9. Testing / H1 done-when

Automated:

- `isLocale('zh-Hans')` true; unknown codes still false
- Message dictionary type-checks; `getMessages('zh-Hans').settings.language` is `语言`
- LocaleProvider sets `lang=zh-Hans`, `dir=ltr`
- Prompt tests: system contains Simplified Chinese + formal-register extras; user prompt contains `Output language: Simplified Chinese (zh-Hans)`; English labels still required
- LanguagePicker lists `简体中文`
- Settings persistence still writes `preferred_locale`
- DOCX XML contains east-Asian font when CJK / `zh-Hans`

Manual plumbing (H1, not H2 quality):

1. Select 简体中文 on landing → chrome in Chinese, `lang=zh-Hans`
2. Settings save → DB `preferred_locale = zh-Hans`, survives refresh
3. Generate a short plan → values in Simplified Chinese, phase labels English
4. Download DOCX → Chinese glyphs visible in Word (not tofu)

---

## 10. Explicit non-goals restated

Do not hire a translation vendor as a v1 blocker (C1 copy can be authored in-repo and revised later). Do not add i18next. Do not build Traditional “while we’re here.”

# Mandarin Language Support — Product Decision Doc

**Status:** Awaiting owner decisions  
**Date:** 2026-08-14  
**Audience:** FreePeriod product owner  
**Purpose:** Decide scope and product rules for adding Mandarin before implementation planning / brainstorming.

**How to use this doc:** For each decision, pick one option (or write a custom choice). Fill in the **Owner decision** boxes at the end of each section, then return the completed doc. We will turn your answers into an implementation plan and brainstorming agenda.

---

## 1. Current state (context for decisions)

FreePeriod already supports **English, Arabic, Spanish, and French** as a single shared preference:

| Area | Behavior today |
|------|----------------|
| Settings / landing picker | One “Language” setting |
| Product promise | *“Website and new lesson plans use this language.”* |
| UI | Partial localization (marketing, nav, settings, some generate chrome). Auth, onboarding, generate form labels, and much of the app remain English. |
| AI generation | Same locale is sent to Gemini/Claude. Human-readable plan **values** are in the target language; JSON keys and activity-phase labels (`Time:`, `Teacher Activity:`, etc.) stay **English**. Arabic also gets Modern Standard Arabic + curriculum-code rules. |
| Fonts | Manrope (Latin) + Noto Sans Arabic (when `lang=ar`). RTL only for Arabic. |
| Export (DOCX) | Hardcoded Calibri (Latin-centric). |
| Database | `users.preferred_locale` constrained to `en` / `ar` / `es` / `fr`. |

There is **no Chinese / Mandarin** support yet. Adding it is not a one-line toggle — it touches locale lists, translations, AI prompts, fonts, export, and a DB constraint.

---

## 2. Decisions needed

### Decision A — Script / market: which Mandarin?

Mandarin is not one written standard for product purposes.

| Option | Code suggestion | Typical markets | Notes |
|--------|-----------------|-----------------|-------|
| **A1. Simplified only** | `zh-Hans` (or `zh-CN`) | Mainland China, Singapore (often), many international schools teaching simplified | Smallest first ship; clearest UI label (“简体中文”) |
| **A2. Traditional only** | `zh-Hant` (or `zh-TW`) | Taiwan, Hong Kong (often), some diaspora | Same complexity as A1, different audience |
| **A3. Both** | `zh-Hans` + `zh-Hant` | Broadest | Two fonts, two message files, two generation variants, two picker rows; roughly ~2× localization + QA |

**Recommendation:** Start with **A1 (Simplified only)** unless you already have Traditional-first customers. Adding Traditional later is straightforward if we use explicit script codes from day one.

**Owner decision A:**  
- [ ] A1 Simplified only  
- [ ] A2 Traditional only  
- [ ] A3 Both  
- [ ] Other: _______________  

**Notes / target markets:**  
_________________________________________________________________

---

### Decision B — UI language vs lesson-plan language

Today these are **coupled** (one setting). Mandarin-speaking teachers often want splits (e.g. English UI + Chinese plans, or Chinese UI + English plans for bilingual schools).

| Option | Meaning | Pros | Cons |
|--------|---------|------|------|
| **B1. Keep coupled** | One language for website + new plans (current model) | Simple UX; matches existing Settings copy; least engineering | Less flexible for bilingual schools |
| **B2. Split controls** | “App language” + “Lesson plan language” | Fits bilingual teaching reality | Settings redesign; generation + UI state diverge; more edge cases |
| **B3. Coupled now, split later** | Ship Mandarin like ES/FR first; revisit split if users ask | Fastest path; learns from real usage | May need a follow-up settings change |

**Recommendation:** **B3** unless bilingual UI/plan split is a known launch requirement for your Mandarin audience.

**Owner decision B:**  
- [ ] B1 Keep coupled  
- [ ] B2 Split now  
- [ ] B3 Coupled now, split later  
- [ ] Other: _______________  

**If B2:** default when only one is set? _______________

---

### Decision C — How complete should Mandarin UI be at launch?

Localization today is **hybrid**: some surfaces translated, many still English (true for AR/ES/FR too).

| Option | Scope | Effort | User experience |
|--------|-------|--------|-----------------|
| **C1. Parity with AR/ES/FR** | Same hybrid surfaces only (landing, nav, settings, footer, generate language hint, etc.) | Lowest | Consistent with current languages; English still appears in auth/onboarding/generate form |
| **C2. Expand hybrid before Mandarin** | Translate more core app surfaces (e.g. generate form, dashboard chrome) for *all* locales including Mandarin | Medium–high | Better for Mandarin launch; also improves AR/ES/FR |
| **C3. Mandarin-complete core app** | Mandarin gets fuller coverage than other locales for launch | Medium | Mandarin feels more polished; other locales stay hybrid (asymmetry) |

**Recommendation:** **C1** for a first Mandarin ship, unless Mandarin is a flagship market that must feel fully native on day one (then **C2** or **C3**).

**Owner decision C:**  
- [ ] C1 Parity with existing hybrid  
- [ ] C2 Expand hybrid for all locales first  
- [ ] C3 Mandarin-complete core app  
- [ ] Other: _______________  

**Must-translate screens (if any beyond C1):**  
_________________________________________________________________

---

### Decision D — Lesson content language rules (AI output)

Non-English plans currently keep **English structural scaffolding** (JSON keys + phase labels like `Time:`, `Teacher Activity:`) while translating the content after those labels. Arabic adds formal MSA + “don’t invent curriculum codes.”

| Option | Plan body language | Structural labels (`Time:`, etc.) | “I can” success criteria / vocab format |
|--------|--------------------|--------------------------------------|----------------------------------------|
| **D1. Match ES/FR pattern** | Mandarin values | Stay English | Keep English patterns (`I can`, `Term — definition`) unless model naturally adapts |
| **D2. Fully Mandarin scaffolding** | Mandarin values | Translate labels too (e.g. 时间 / 教师活动) | Native Chinese pedagogical phrasing |
| **D3. Hybrid bilingual** | Mandarin primary; allow English terms for subject vocabulary where common in international schools | English or bilingual labels | Explicit bilingual vocab rules |

Also decide register:

| Option | Register |
|--------|----------|
| **D-R1. Formal professional** (recommended) | Teacher-document Mandarin (parallel to Arabic الفصحى guidance) |
| **D-R2. Neutral / classroom colloquial** | Closer to spoken classroom language |

**Recommendation:** **D1 + D-R1** for consistency and safer JSON parsing; reconsider **D2** if teacher feedback says English labels feel wrong inside Chinese plans.

**Owner decision D (content):**  
- [ ] D1 Match ES/FR (Mandarin values, English labels)  
- [ ] D2 Fully Mandarin scaffolding  
- [ ] D3 Hybrid bilingual  
- [ ] Other: _______________  

**Owner decision D (register):**  
- [ ] D-R1 Formal professional  
- [ ] D-R2 Classroom colloquial  
- [ ] Other: _______________  

**Special rules (curriculum codes, English subject terms, school names):**  
_________________________________________________________________

---

### Decision E — Curriculum / market packaging

Language support ≠ curriculum support. Generation quality still depends on selected curriculum + optional uploaded docs. Current packs lean heavily toward existing markets (e.g. UAE-oriented and other guideline packs already in product).

| Option | Meaning |
|--------|----------|
| **E1. Language only** | No new curriculum packs; rely on existing curricula + uploads; Mandarin is “output language” |
| **E2. Language + 1–2 target curricula** | Add guideline packs for named Mandarin-market curricula (you specify which) |
| **E3. Language + bilingual pedagogy guidance** | Prompt/pack notes for schools that teach in English but want Mandarin plans (or vice versa) |

**Recommendation:** **E1** for v1 unless you already know the first Mandarin customer segment and their curriculum board.

**Owner decision E:**  
- [ ] E1 Language only  
- [ ] E2 Language + named curricula (list below)  
- [ ] E3 Include bilingual pedagogy guidance  
- [ ] Other: _______________  

**Named curricula / regions to prioritize (if E2/E3):**  
_________________________________________________________________

---

### Decision F — Fonts, layout, and export

Mandarin requires CJK fonts. Arabic already set the precedent of loading a script-specific font when `lang` matches.

| Option | UI font | DOCX export |
|--------|---------|-------------|
| **F1. Minimal** | Add Noto Sans SC and/or TC for UI when Mandarin selected | Keep Calibri; accept weak/broken Chinese in Word exports |
| **F2. UI + export parity** | CJK UI font | Switch export to a CJK-capable font (or embed/fallback strategy) when locale is Mandarin |
| **F3. Export-first quality** | Same as F2, plus explicit QA checklist for DOCX on Windows/Mac Word | Highest confidence for teachers who live in Word |

**Recommendation:** **F2** at minimum — exporting unreadable Chinese lesson plans would undermine the feature. **F3** if Word download is a primary workflow for your teachers.

**Owner decision F:**  
- [ ] F1 UI only  
- [ ] F2 UI + export fonts  
- [ ] F3 UI + export + Word QA bar  
- [ ] Other: _______________  

---

### Decision G — Picker labeling & language name

How Mandarin appears in the landing/settings language menu.

| Option | Example label |
|--------|----------------|
| **G1. Endonym only** | `简体中文` / `繁體中文` |
| **G2. Endonym + English** | `简体中文 (Simplified Chinese)` |
| **G3. English only** | `Simplified Chinese` |

**Recommendation:** **G1** (matches Arabic `العربية`, Spanish `Español`, French `Français`). Use **G2** if your audience is admins who don’t read Chinese but configure accounts for teachers.

**Owner decision G:**  
- [ ] G1 Endonym only  
- [ ] G2 Endonym + English  
- [ ] G3 English only  
- [ ] Other: _______________  

---

### Decision H — Launch bar / success criteria

What must be true before you call Mandarin “shipped”?

| Option | Bar |
|--------|-------|
| **H1. Feature-complete plumbing** | Locale selectable, persists, generate returns Mandarin, UI hybrid strings present |
| **H2. Teacher-ready** | H1 + readable DOCX + spot-checked plan quality on 3–5 real subjects/grades |
| **H3. Market-ready** | H2 + curriculum/pack decisions from E + support/FAQ copy |

**Recommendation:** **H2** as the default launch bar.

**Owner decision H:**  
- [ ] H1 Plumbing  
- [ ] H2 Teacher-ready  
- [ ] H3 Market-ready  
- [ ] Other: _______________  

**Subjects/grades to spot-check (if H2/H3):**  
_________________________________________________________________

---

### Decision I — Out of scope for v1 (confirm)

Please confirm these stay **out** of the first Mandarin release unless you mark otherwise:

| Item | Default | Keep out? |
|------|---------|-----------|
| Separate Traditional + Simplified in v1 (if you chose A1 or A2) | Out if single script | [ ] Yes [ ] No — include both |
| Full-app translation (every string) | Out | [ ] Yes [ ] No |
| Decoupled UI vs plan language (if not B2) | Out | [ ] Yes [ ] No |
| New Mandarin-specific marketing landing | Out | [ ] Yes [ ] No |
| Cantonese / other Chinese varieties as distinct locales | Out | [ ] Yes [ ] No |
| Storing per-lesson locale on lesson rows | Out (today language is implied by content) | [ ] Yes [ ] No — add column |

**Owner notes on scope:**  
_________________________________________________________________

---

## 3. Engineering impact summary (for awareness, not a plan yet)

Once decisions above are locked, implementation will roughly include:

1. Extend locale allowlists (`lib/i18n`, `GenerationLocale`, Settings/picker).  
2. DB migration to widen `preferred_locale` CHECK.  
3. New message dictionary file(s) typed against English messages.  
4. AI prompt language name + Mandarin-specific rules (like Arabic extras).  
5. CJK font loading + `html[lang=…]` CSS.  
6. Export font path for Mandarin.  
7. Tests for prompt locale + Settings persistence.  
8. QA pass against your chosen launch bar (H).

Complexity rises sharply if you choose **both scripts (A3)**, **split languages (B2)**, or **expanded UI coverage (C2/C3)** in the same first release.

---

## 4. Owner response sheet (copy-friendly)

Fill this section and send it back.

| ID | Topic | Your choice | Notes |
|----|-------|-------------|-------|
| A | Script / market | | |
| B | UI vs plan language | | |
| C | UI completeness | | |
| D | AI content rules + register | | |
| E | Curriculum packaging | | |
| F | Fonts / export | | |
| G | Picker label | | |
| H | Launch bar | | |
| I | Out-of-scope confirms | | |

**Primary customer for Mandarin v1 (who is this for?):**  
_________________________________________________________________

**Must-have for launch / nice-to-have later:**  
_________________________________________________________________

**Anything we should explicitly not do?**  
_________________________________________________________________

**Owner name / date:** _______________ / _______________

---

## 5. Next step after you reply

With this sheet returned, we will:

1. Turn your decisions into a short **spec** (accepted options only).  
2. Run a **brainstorming / implementation planning** pass (UX copy, prompt rules, migration, QA checklist).  
3. Produce a sequenced implementation plan with test criteria matched to Decision H.

No Mandarin implementation work should start until Sections 2–4 are decided.

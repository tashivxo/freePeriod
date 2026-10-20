# Defect 04 — Settings dropdowns scroll / misbehave on open

**Branch:** `fix/settings-dropdown-scroll`  
**PR base:** `dev`  
**Owner:** Arham

---

## Problem statement

In **Settings**, the dropdowns (subject, grade, curriculum, country, language, etc.) do not behave like a production SaaS select. Opening a dropdown **makes the page scroll**, which feels jarring and makes it harder to pick an option. Fix so open/close, positioning, and keyboard behavior match solid UI/UX principles without unexpected page motion.

---

## Severity

**High (UX)** — Settings is a core surface; every teacher who changes defaults hits these controls. Unexpected scroll on open erodes trust and can cause mis-clicks.

---

## Where the UI lives

| Piece | Path |
|-------|------|
| Settings client (all defaults dropdowns) | `app/(app)/settings/SettingsClient.tsx` |
| Shared dropdown primitive | `components/ui/animated-dropdown.tsx` (`AnimatedDropdown`) |
| Unit tests (component) | `tests/unit/components/ui/animated-dropdown.test.tsx` |
| Unit tests (settings usage) | `tests/unit/app/(app)/settings/SettingsClient.test.tsx` |
| E2E | `tests/e2e/animated-dropdown.spec.ts` |

Settings uses `AnimatedDropdown` for Language, Subject, Grade, Curriculum, and Country — not native `<select>` elements.

---

## Likely root cause (start here)

In `components/ui/animated-dropdown.tsx`, `openMenu()` intentionally scrolls the page when there is little space below the trigger:

```ts
const OPEN_SCROLL_THRESHOLD_PX = 280;

// inside openMenu:
if (spaceBelowTrigger(trigger) < OPEN_SCROLL_THRESHOLD_PX) {
  trigger.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
}
```

There is also `scrollOptionIntoView` on open / keyboard navigate (`scrollIntoView` on the highlighted option). That can move **document** scroll if the option is not constrained correctly, or compound with the trigger scroll.

The list itself is portaled (`createPortal` → `document.body`) with `position: fixed` — so the intended design is already “overlay,” not “expand the layout.” Page scroll on open is therefore unexpected for users and fights that model.

**Do not assume Settings is the only place.** Grep for `AnimatedDropdown` and verify onboarding / generate / other forms behave the same. Document findings in an **Audit** section at the bottom of this file (or in your PR body).

---

## Your job

1. **Reproduce** on `/settings` (desktop + mobile widths): open each dropdown near the top, middle, and bottom of the viewport. Note when the page jumps.
2. **Analyse** against production patterns (Radix Select, GitHub settings selects, etc.):
   - Menu opens as an overlay; **document scroll should not jump** when opening.
   - Prefer flip / clamp / max-height within the viewport over scrolling the page to “make room.”
   - Escape closes; click-outside closes; focus management stays sane.
   - Long lists scroll **inside** the menu (`overflow-y-auto`), not by shifting the whole page.
3. **Fix** in the shared `AnimatedDropdown` (preferred) so all call sites benefit — unless a Settings-only bug is proven. Preserve existing motion/animation where it still feels good; do not rip out AnimatePresence unless required.
4. **Update tests** — existing unit tests currently expect `scrollIntoView` on the trigger in some cases; change those expectations if you remove auto page scroll. Add coverage that opening does **not** call document/trigger `scrollIntoView` (or only scrolls the listbox itself).

---

## Design principles (acceptance bar)

| Principle | Expectation |
|-----------|-------------|
| No layout surprise | Opening a dropdown must **not** scroll the page under the user |
| Flip / fit | If space below is tight, open upward or shrink `maxHeight` — already partly implemented via `computeListboxPosition`; lean on that instead of `scrollIntoView` on the trigger |
| Contained scroll | Only the listbox scrolls for long option lists |
| Accessibility | `listbox` / `option` semantics, arrow keys, Enter/Space, Escape, focus return to trigger |
| Consistency | Same behavior on Settings and any other `AnimatedDropdown` surfaces |
| Motion | Keep open/close animation polished; no flicker or jump |

---

## Acceptance criteria

- [ ] Opening any Settings dropdown does **not** cause the page to jump/scroll.
- [ ] Near bottom of viewport: menu flips up or clamps height; options remain usable.
- [ ] Near top: menu opens below without pushing content in a jarring way.
- [ ] Keyboard navigation works; highlighted option scrolls **within** the listbox only.
- [ ] Click outside / Escape closes without residual scroll side effects.
- [ ] Unit (+ E2E if practical) cover the no-page-scroll behavior.
- [ ] Audit note: list other pages that use `AnimatedDropdown` and confirm they still feel correct.

---

## Out of scope

- Redesigning Settings layout or copy (see defect 02 for danger zone).
- Replacing `AnimatedDropdown` with a third-party select unless you get explicit approval from Tashiv in the PR.

---

## Suggested investigation steps

1. Read `openMenu`, `computeListboxPosition`, `scrollOptionIntoView` in `animated-dropdown.tsx`.
2. Temporarily comment out the `OPEN_SCROLL_THRESHOLD_PX` / `trigger.scrollIntoView` block and retest — confirm that is the main scroll culprit.
3. Check whether option `scrollIntoView({ block: 'nearest' })` scrolls the window; if so, scroll the listbox container instead (`listRef.scrollTop = …`).
4. Run `npx jest tests/unit/components/ui/animated-dropdown.test.tsx` and update expectations.
5. Manual pass on `/settings` and one other screen that uses the same component.

---

## Testing notes

```bash
npx jest tests/unit/components/ui/animated-dropdown.test.tsx
npx jest tests/unit/app/(app)/settings/SettingsClient.test.tsx
# optional
BASE_URL=http://localhost:3000 npx playwright test tests/e2e/animated-dropdown.spec.ts
```

---

## Audit (fill in while working)

| Surface | Uses AnimatedDropdown? | Page scroll on open? | Notes |
|---------|------------------------|----------------------|-------|
| Settings | yes | | |
| Onboarding | | | |
| Generate / other | | | |

---

## PR checklist

- [ ] Branch cut from up-to-date `dev`
- [ ] PR base is **`dev`**
- [ ] Scope = this defect only
- [ ] Before/after notes (or short screen recording) in PR body
- [ ] Tests updated for new behavior


# UI/UX Audit Implementation Plans — Index

> **For agentic workers:** Implement **one phase plan at a time**, starting with P0. Use subagent-driven-development or executing-plans on the active phase plan only. Do not start coding until the user explicitly chooses a phase and execution mode.

**Specs:**
- Audit findings: [`../specs/2026-07-17-full-site-uiux-audit-design.md`](../specs/2026-07-17-full-site-uiux-audit-design.md)
- Implementation backlog: [`../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md`](../specs/2026-07-17-full-site-uiux-audit-implementation-backlog.md)

**Phase plans:**

| Phase | Plan file | Work items | Est. effort | Status |
| --- | --- | --- | --- | --- |
| P0 | [`2026-07-17-uiux-audit-p0.md`](./2026-07-17-uiux-audit-p0.md) | 9 (+ early token foundation) | ~16d | Ready |
| P1 | [`2026-07-17-uiux-audit-p1.md`](./2026-07-17-uiux-audit-p1.md) | 9 | ~13d | Ready after P0 |
| P2–P3 | [`2026-07-17-uiux-audit-p2-p3.md`](./2026-07-17-uiux-audit-p2-p3.md) | 4 | ~5d | Ready after P0/P1 deps |

## Locked product defaults (for plan authors)

Resolve these without blocking kickoff unless the user overrides:

| Decision | Default in plans |
| --- | --- |
| Remember me (W-AUTH-02) | Keep Switch; update helper copy to match real session cookie behavior (no false “stay signed in forever” claim). Wire only if product later asks for longer persistence. |
| Upload DnD (W-UPLOAD-01) | Change copy to **“Click to upload”** (YAGNI). Do not implement DnD in these plans unless product reverses. |
| Trial wording (W-PRICING-01) | **“Paid plans include a 30-day free trial.”** |
| Motion | **Refine / gate only — never remove** SoftAurora, Iridescence, ColorBends, Waves, BlurText, grain, GenerationScreen, SpotlightCard, MagicCard, `.btn-shine`, etc. |

## Suggested execution order

1. P0 foundation: tokens → primitives → motion PRM fixes  
2. P0 product-critical: auth signup, generate lifecycle, lesson edit, history delete  
3. P0 feedback/settings/history search  
4. P1 auth polish + marketing/pricing + lesson status + upload copy  
5. P2–P3 remaining tokens consumers, legal TOC, dashboard, effects polish  

## Global constraints for every task

- Preserve existing animations and visual effects (refine only).
- Prefer shared primitives over one-off styles.
- Commit after each work item (or logical sub-task).
- Run targeted tests listed in that work item’s checklist before moving on.
- No drive-by refactors outside the work item’s affected files.

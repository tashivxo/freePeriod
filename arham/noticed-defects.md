# Noticed defects (Arham)

Log anything you find while working on assigned defects. **Do not** fix these in the same PR as an assigned defect unless Tashiv approves scope expansion.

---

## How to use

1. Add a new row when you spot a problem.
2. Set **Status** to `open` → `investigating` → `reported` (PR/issue filed) → `won't fix`.
3. If you open a separate PR, link it in **Notes**.

---

## Template (copy for new entries)

```markdown
### [Short title]

| Field | Value |
|-------|--------|
| **Where** | Route / component path |
| **Severity** | Critical / High / Medium / Low |
| **Status** | open |
| **Notes** | Repro steps, screenshot, suggested fix |
| **PR / issue** | _link when exists_ |
```

---

## Log

| Title | Where | Severity | Status | Notes | PR / issue |
|-------|-------|----------|--------|-------|------------|
| _example: Onboarding Finish spinner_ | `app/(auth)/onboarding/OnboardingPage.tsx` | Low | open | Known quirk per AGENTS.md — 409 duplicate profile | — |
| | | | | | |

---

## Severity guide

| Level | When to use |
|-------|-------------|
| **Critical** | Data loss, auth bypass, payment wrong, production down |
| **High** | Core loop blocked (cannot generate, save, or sign in) |
| **Medium** | Confusing UX, missing feedback, layout safety issues |
| **Low** | Copy, minor visual glitches, nice-to-have a11y |

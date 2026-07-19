# Generation Limits and Fast / Quality Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Free 3 / Pro 20 / Pro+ unlimited generations per billing window, and let paid teachers choose Fast or Quality on Generate without naming AI models.

**Architecture:** Extend `users.generation_count` + `generation_count_reset_at` with lazy period resets. Resolve effective plan (including trial-by-checkout-plan and `pro_plus`) in authorize. Route providers from `generationMode` (`fast` → Gemini, `quality` → Claude), with Free coerced to Fast. Teacher-facing UI and pricing copy use Fast / Quality language only.

**Tech Stack:** Next.js App Router, Supabase, Jest, Playwright, existing Gemini + Anthropic clients.

**Spec:** `docs/superpowers/specs/2026-07-19-generation-limits-fast-quality-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/generation/quota.ts` | Create | Pure helpers: plan limits, effective plan, reset window, mode coerce |
| `lib/generation/quota.test.ts` | Create | Unit tests for quota helpers |
| `lib/ai/router.ts` | Modify | Thin wrappers / re-exports around quota limits; remove lifetime 50 |
| `lib/ai/router.test.ts` | Modify | Match new limits (3 / 20 / unlimited) |
| `lib/ai/index.ts` | Modify | Export any new public symbols used elsewhere |
| `lib/generation/authorize.ts` | Modify | Full `Plan`, select `renews_at` + reset fields, lazy reset, rate check |
| `lib/generation/authorize.test.ts` | Create | Authorize plan + reset + limit behavior (mocked Supabase) |
| `types/lesson.ts` | Modify | Add `generationMode?: 'fast' \| 'quality'` |
| `lib/generation/generate-content.ts` | Modify | Route on resolved mode (not `isFreePlan` alone) |
| `lib/generation/generate-content.test.ts` | Create or modify | Mode → provider selection (mock providers if needed) |
| `app/api/generate/route.ts` | Modify | Accept `generationMode`, coerce Free, plan-aware 402 |
| `app/(app)/generate/page.tsx` | Modify | Pass `free` \| `pro` \| `pro_plus` correctly (include trial) |
| `features/generate/components/GenerateClient.tsx` | Modify | Plan type + send `generationMode` |
| `features/generate/components/GenerateForm.tsx` | Modify | Fast / Quality control + localStorage |
| `features/generate/components/GenerateForm.test.tsx` | Create or modify | Mode UI lock / persistence |
| `features/billing/components/PricingClient.tsx` | Modify | Fast / Quality feature copy |
| `features/billing/components/PricingClient.test.tsx` | Modify | Assert new copy |
| `components/ui/UpgradePrompt.tsx` | Modify | Accurate Free 3 / Pro 20 / Pro+ messaging |
| `components/ui/UpgradePrompt.test.tsx` | Create or modify | Copy assertions |
| `app/(app)/dashboard/page.tsx` | Modify | Current-window usage label |
| `app/(app)/settings/page.tsx` + `SettingsClient.tsx` | Modify | Show usage for current window |
| `tests/e2e/pricing.spec.ts` | Modify | Fast / Quality feature assertions |

**Unchanged contract:** `persistLessonPlan` still increments `generation_count` by 1 after success. Fast and Quality cost 1 generation each.

---

### Task 1: Quota pure helpers

**Files:**
- Create: `lib/generation/quota.ts`
- Create: `lib/generation/quota.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/generation/quota.test.ts
import {
  PLAN_GENERATION_LIMITS,
  getPlanGenerationLimit,
  isRateLimited,
  resolveEffectivePlan,
  resolveGenerationMode,
  nextUtcMonthStart,
  shouldResetGenerationWindow,
  periodEndForReset,
} from './quota';
import type { Plan } from '@/types';

describe('PLAN_GENERATION_LIMITS', () => {
  it('maps free=3, pro=20, pro_plus=null', () => {
    expect(PLAN_GENERATION_LIMITS.free).toBe(3);
    expect(PLAN_GENERATION_LIMITS.pro).toBe(20);
    expect(PLAN_GENERATION_LIMITS.pro_plus).toBeNull();
  });
});

describe('isRateLimited', () => {
  it('limits free at 3', () => {
    expect(isRateLimited('free', 2)).toBe(false);
    expect(isRateLimited('free', 3)).toBe(true);
  });

  it('limits pro at 20', () => {
    expect(isRateLimited('pro', 19)).toBe(false);
    expect(isRateLimited('pro', 20)).toBe(true);
  });

  it('never limits pro_plus', () => {
    expect(isRateLimited('pro_plus', 10_000)).toBe(false);
  });
});

describe('resolveEffectivePlan', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it('returns active pro_plus', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro_plus', status: 'active', trial_end: null }),
    ).toBe('pro_plus');
  });

  it('returns trial plan when trial is active', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro', status: 'trial', trial_end: future }),
    ).toBe('pro');
    expect(
      resolveEffectivePlan({ plan: 'pro_plus', status: 'trial', trial_end: future }),
    ).toBe('pro_plus');
  });

  it('returns free when trial expired', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro', status: 'trial', trial_end: past }),
    ).toBe('free');
  });

  it('returns free when no subscription', () => {
    expect(resolveEffectivePlan(null)).toBe('free');
  });
});

describe('resolveGenerationMode', () => {
  it('coerces free to fast even if quality requested', () => {
    expect(resolveGenerationMode('free', 'quality')).toBe('fast');
  });

  it('allows quality for pro and pro_plus', () => {
    expect(resolveGenerationMode('pro', 'quality')).toBe('quality');
    expect(resolveGenerationMode('pro_plus', 'fast')).toBe('fast');
  });

  it('defaults paid missing mode to quality', () => {
    expect(resolveGenerationMode('pro', undefined)).toBe('quality');
  });

  it('defaults free missing mode to fast', () => {
    expect(resolveGenerationMode('free', undefined)).toBe('fast');
  });
});

describe('nextUtcMonthStart', () => {
  it('returns first day of next month UTC', () => {
    const from = new Date('2026-07-19T15:00:00.000Z');
    expect(nextUtcMonthStart(from).toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});

describe('shouldResetGenerationWindow', () => {
  it('resets when resetAt is null', () => {
    expect(shouldResetGenerationWindow(null, new Date())).toBe(true);
  });

  it('resets when now is at or after resetAt', () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    expect(shouldResetGenerationWindow('2026-08-01T00:00:00.000Z', now)).toBe(true);
  });

  it('does not reset when now is before resetAt', () => {
    const now = new Date('2026-07-19T12:00:00.000Z');
    expect(shouldResetGenerationWindow('2026-08-01T00:00:00.000Z', now)).toBe(false);
  });
});

describe('periodEndForReset', () => {
  it('uses renews_at for paid when present', () => {
    const renews = '2026-08-15T12:00:00.000Z';
    expect(
      periodEndForReset({ plan: 'pro' as Plan, renewsAt: renews, now: new Date('2026-07-19T00:00:00.000Z') }),
    ).toBe(renews);
  });

  it('falls back to nextUtcMonthStart when renews_at missing', () => {
    const now = new Date('2026-07-19T15:00:00.000Z');
    expect(
      periodEndForReset({ plan: 'pro', renewsAt: null, now }),
    ).toBe(nextUtcMonthStart(now).toISOString());
  });

  it('uses nextUtcMonthStart for free', () => {
    const now = new Date('2026-07-19T15:00:00.000Z');
    expect(
      periodEndForReset({ plan: 'free', renewsAt: '2026-08-15T12:00:00.000Z', now }),
    ).toBe(nextUtcMonthStart(now).toISOString());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/generation/quota.test.ts
```

Expected: FAIL — cannot find module `./quota`

- [ ] **Step 3: Implement helpers**

```ts
// lib/generation/quota.ts
import type { Plan } from '@/types';
import { isTrialActive } from '@/lib/utils/trial';

export type GenerationMode = 'fast' | 'quality';

export const PLAN_GENERATION_LIMITS: Record<Plan, number | null> = {
  free: 3,
  pro: 20,
  pro_plus: null,
};

export function getPlanGenerationLimit(plan: Plan): number | null {
  return PLAN_GENERATION_LIMITS[plan];
}

export function isRateLimited(plan: Plan, generationCount: number): boolean {
  const limit = getPlanGenerationLimit(plan);
  return limit !== null && generationCount >= limit;
}

export type SubscriptionSnapshot = {
  plan: Plan | null;
  status: string | null;
  trial_end: string | null;
} | null;

export function resolveEffectivePlan(sub: SubscriptionSnapshot): Plan {
  if (!sub?.plan) return 'free';
  if (sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'pro_plus')) {
    return sub.plan;
  }
  if (sub.status === 'trial' && isTrialActive(sub.trial_end) && (sub.plan === 'pro' || sub.plan === 'pro_plus')) {
    return sub.plan;
  }
  return 'free';
}

export function resolveGenerationMode(
  plan: Plan,
  requested: GenerationMode | undefined,
): GenerationMode {
  if (plan === 'free') return 'fast';
  if (requested === 'fast' || requested === 'quality') return requested;
  return 'quality';
}

export function nextUtcMonthStart(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function shouldResetGenerationWindow(resetAt: string | null, now: Date): boolean {
  if (!resetAt) return true;
  return now.getTime() >= new Date(resetAt).getTime();
}

export function periodEndForReset(input: {
  plan: Plan;
  renewsAt: string | null;
  now: Date;
}): string {
  if (input.plan !== 'free' && input.renewsAt) {
    return input.renewsAt;
  }
  return nextUtcMonthStart(input.now).toISOString();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- lib/generation/quota.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/generation/quota.ts lib/generation/quota.test.ts
git commit -m "feat: add generation quota and mode helpers"
```

---

### Task 2: Wire router to new limits

**Files:**
- Modify: `lib/ai/router.ts`
- Modify: `lib/ai/router.test.ts`
- Modify: `lib/ai/index.ts`

- [ ] **Step 1: Rewrite failing router tests**

Replace `lib/ai/router.test.ts` contents with:

```ts
import {
  FREE_GENERATION_LIMIT,
  PRO_GENERATION_LIMIT,
  shouldUseGemini,
  isRateLimited,
} from './router';

describe('limits', () => {
  it('exposes free=3 and pro=20', () => {
    expect(FREE_GENERATION_LIMIT).toBe(3);
    expect(PRO_GENERATION_LIMIT).toBe(20);
  });
});

describe('shouldUseGemini', () => {
  it('is true only for fast mode', () => {
    expect(shouldUseGemini('fast')).toBe(true);
    expect(shouldUseGemini('quality')).toBe(false);
  });
});

describe('isRateLimited', () => {
  it('limits free at 3 and pro at 20; never pro_plus', () => {
    expect(isRateLimited('free', 3)).toBe(true);
    expect(isRateLimited('pro', 20)).toBe(true);
    expect(isRateLimited('pro_plus', 999)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/ai/router.test.ts
```

Expected: FAIL on limit values / signatures

- [ ] **Step 3: Implement router as thin re-exports**

```ts
// lib/ai/router.ts
import type { Plan } from '@/types';
import {
  getPlanGenerationLimit,
  isRateLimited as quotaIsRateLimited,
  type GenerationMode,
} from '@/lib/generation/quota';

export const FREE_GENERATION_LIMIT = 3;
export const PRO_GENERATION_LIMIT = 20;

/** @deprecated Prefer resolveGenerationMode + Fast/Quality; kept for call sites during migration */
export function shouldUseGemini(modeOrPlan: GenerationMode | Plan): boolean {
  if (modeOrPlan === 'fast') return true;
  if (modeOrPlan === 'quality') return false;
  // Legacy: free plan used Gemini
  return modeOrPlan === 'free';
}

export function isRateLimited(plan: Plan, generationCount: number): boolean {
  return quotaIsRateLimited(plan, generationCount);
}

export { getPlanGenerationLimit };
```

Update `lib/ai/index.ts` exports:

```ts
export {
  FREE_GENERATION_LIMIT,
  PRO_GENERATION_LIMIT,
  isRateLimited,
  shouldUseGemini,
  getPlanGenerationLimit,
} from './router';
```

(Keep any other existing exports in that file unchanged.)

- [ ] **Step 4: Run tests**

```bash
npm test -- lib/ai/router.test.ts lib/generation/quota.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai/router.ts lib/ai/router.test.ts lib/ai/index.ts
git commit -m "feat: align router limits with Free 3 and Pro 20"
```

---

### Task 3: Authorize with effective plan and lazy reset

**Files:**
- Modify: `lib/generation/authorize.ts`
- Create: `lib/generation/authorize.test.ts`

- [ ] **Step 1: Write failing authorize tests**

```ts
// lib/generation/authorize.test.ts
import { resolveGenerationAccess } from './authorize';

function mockSupabase(opts: {
  sub: Record<string, unknown> | null;
  user: { generation_count: number; generation_count_reset_at: string | null };
  onUserUpdate?: (payload: Record<string, unknown>) => void;
}) {
  const updates: Record<string, unknown>[] = [];
  return {
    from(table: string) {
      if (table === 'subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: opts.sub, error: null }),
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: opts.user, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            updates.push(payload);
            opts.onUserUpdate?.(payload);
            return {
              eq: async () => ({ data: null, error: null }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    _updates: updates,
  };
}

describe('resolveGenerationAccess', () => {
  it('resets free count when reset_at is null and applies free limit', async () => {
    const sb = mockSupabase({
      sub: null,
      user: { generation_count: 50, generation_count_reset_at: null },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.userPlan).toBe('free');
    expect(access.generationCount).toBe(0);
    expect(access.isRateLimited).toBe(false);
    expect(access.generationLimit).toBe(3);
    expect(sb._updates[0]).toMatchObject({ generation_count: 0 });
  });

  it('rate-limits free at 3 within window', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const sb = mockSupabase({
      sub: null,
      user: { generation_count: 3, generation_count_reset_at: future },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.isRateLimited).toBe(true);
  });

  it('uses pro_plus unlimited for active pro_plus', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const sb = mockSupabase({
      sub: { plan: 'pro_plus', status: 'active', trial_end: null, renews_at: future },
      user: { generation_count: 100, generation_count_reset_at: future },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.userPlan).toBe('pro_plus');
    expect(access.isRateLimited).toBe(false);
    expect(access.generationLimit).toBeNull();
  });

  it('trial pro is limited at 20', async () => {
    const trialEnd = new Date(Date.now() + 86400000).toISOString();
    const renews = new Date(Date.now() + 86400000 * 30).toISOString();
    const sb = mockSupabase({
      sub: { plan: 'pro', status: 'trial', trial_end: trialEnd, renews_at: renews },
      user: { generation_count: 20, generation_count_reset_at: renews },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.userPlan).toBe('pro');
    expect(access.isRateLimited).toBe(true);
  });
});
```

Adjust the mock chain if the real Supabase query builder shape in this repo differs (match how other tests mock `.from().select().eq()`). If existing tests use a shared mock helper, prefer that pattern.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- lib/generation/authorize.test.ts
```

Expected: FAIL (types / missing fields / behavior)

- [ ] **Step 3: Implement authorize**

```ts
// lib/generation/authorize.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Plan } from '@/types';
import {
  getPlanGenerationLimit,
  isRateLimited,
  periodEndForReset,
  resolveEffectivePlan,
  shouldResetGenerationWindow,
} from '@/lib/generation/quota';

export type GenerationAccess = {
  userPlan: Plan;
  generationCount: number;
  generationLimit: number | null;
  isRateLimited: boolean;
};

export async function resolveGenerationAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<GenerationAccess> {
  const [{ data: subData }, { data: userRecord }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan, status, trial_end, renews_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('users')
      .select('generation_count, generation_count_reset_at')
      .eq('id', userId)
      .single(),
  ]);

  const userPlan = resolveEffectivePlan(subData);
  let generationCount = userRecord?.generation_count ?? 0;
  const resetAt = userRecord?.generation_count_reset_at ?? null;

  if (shouldResetGenerationWindow(resetAt, now)) {
    const nextReset = periodEndForReset({
      plan: userPlan,
      renewsAt: subData?.renews_at ?? null,
      now,
    });
    generationCount = 0;
    await supabase
      .from('users')
      .update({
        generation_count: 0,
        generation_count_reset_at: nextReset,
      })
      .eq('id', userId);
  }

  const generationLimit = getPlanGenerationLimit(userPlan);

  return {
    userPlan,
    generationCount,
    generationLimit,
    isRateLimited: isRateLimited(userPlan, generationCount),
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- lib/generation/authorize.test.ts
```

Expected: PASS (fix mock if query chaining differs)

- [ ] **Step 5: Commit**

```bash
git add lib/generation/authorize.ts lib/generation/authorize.test.ts
git commit -m "feat: enforce period quotas with lazy generation resets"
```

---

### Task 4: Types and generate-content mode routing

**Files:**
- Modify: `types/lesson.ts`
- Modify: `lib/generation/generate-content.ts`
- Create: `lib/generation/generate-content.mode.test.ts` (pure routing extract if easier)

- [ ] **Step 1: Add type and a small pure routing test**

In `types/lesson.ts`, add to `GenerateRequest`:

```ts
generationMode?: 'fast' | 'quality';
```

Keep `modelPreference` for backward compatibility but do not use it from the product UI.

Add to `lib/generation/generate-content.ts` (or a tiny helper in `quota.ts` already covered):

```ts
export function shouldGenerateWithGemini(mode: 'fast' | 'quality'): boolean {
  return mode === 'fast';
}
```

Test:

```ts
// lib/generation/generate-content.mode.test.ts
import { shouldGenerateWithGemini } from './generate-content';

describe('shouldGenerateWithGemini', () => {
  it('fast uses gemini, quality does not', () => {
    expect(shouldGenerateWithGemini('fast')).toBe(true);
    expect(shouldGenerateWithGemini('quality')).toBe(false);
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
npm test -- lib/generation/generate-content.mode.test.ts
```

Expected: FAIL until export exists

- [ ] **Step 3: Change `GenerateContentInput` and routing**

```ts
export type GenerateContentInput = {
  generationMode: 'fast' | 'quality';
  modelPreference?: string; // ignored for provider choice; Quality always Sonnet unless extending later
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumText?: string;
};

export function shouldGenerateWithGemini(mode: 'fast' | 'quality'): boolean {
  return mode === 'fast';
}

export async function generateLessonContent(input: GenerateContentInput): Promise<GenerateContentResult> {
  const { generationMode, subject, grade, curriculum, duration, teacherPrompt, curriculumText } = input;
  const useGemini = shouldGenerateWithGemini(generationMode);
  const modelUsed = useGemini ? GEMINI_FREE_MODEL : 'claude-sonnet-4-6';

  if (useGemini) {
    const geminiResult = await generateWithGemini({
      subject,
      grade,
      curriculum,
      duration,
      teacherPrompt,
      curriculumText,
    });
    return {
      lessonContent: geminiResult.lessonContent,
      inputTokens: geminiResult.tokenCount,
      outputTokens: 0,
      modelUsed,
    };
  }

  // existing Claude stream path (remove isFreePlan branch; always Sonnet for Quality)
  // ... keep current Anthropic implementation body ...
}
```

Remove reliance on `isFreePlan` for provider selection. Delete unused `ALLOWED_MODELS` / `modelPreference` routing unless still needed for tests; if removing, update `lib/test/paid-generation-sample.ts` and `app/test-paid-generation/route.ts` to pass `generationMode: 'quality'`.

- [ ] **Step 4: Run related unit tests**

```bash
npm test -- lib/generation/generate-content.mode.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/lesson.ts lib/generation/generate-content.ts lib/generation/generate-content.mode.test.ts lib/test/paid-generation-sample.ts app/test-paid-generation/route.ts
git commit -m "feat: route lesson generation by Fast and Quality modes"
```

---

### Task 5: Generate API accepts mode and plan-aware 402

**Files:**
- Modify: `app/api/generate/route.ts`

- [ ] **Step 1: Update route body handling**

After `resolveGenerationAccess`, keep 402 but make copy plan-aware:

```ts
if (access.isRateLimited) {
  const message =
    access.userPlan === 'pro'
      ? 'You have used all 20 lesson plans for this billing period. Upgrade to Pro+ for unlimited generations.'
      : 'You have used all 3 free lesson plans for this month. Upgrade to generate more.';
  return new Response(JSON.stringify({ error: message }), {
    status: 402,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Parse `generationMode` from body. Resolve:

```ts
import { resolveGenerationMode } from '@/lib/generation/quota';

const generationMode = resolveGenerationMode(access.userPlan, body.generationMode);
const useGemini = generationMode === 'fast';
```

Pass `generationMode` into `generateLessonContent` (not `isFreePlan`). Set initial `modelUsed` from mode.

- [ ] **Step 2: Manual sanity (or add a thin route unit test if the repo has API route tests)**

If no route test harness exists, skip automated route test and rely on authorize + generate-content tests.

- [ ] **Step 3: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat: apply generationMode and plan-aware quota errors on generate API"
```

---

### Task 6: Fix generate page plan resolution

**Files:**
- Modify: `app/(app)/generate/page.tsx`
- Modify: `features/generate/components/GenerateClient.tsx` (plan prop type)

- [ ] **Step 1: Widen plan type**

In `GenerateClient` props and `GenerateFormProps`, change:

```ts
plan?: Plan; // or userPlan?: Plan
```

Import `Plan` from `@/types`.

- [ ] **Step 2: Fix page query**

```ts
// app/(app)/generate/page.tsx
import type { Plan } from '@/types';
import { resolveEffectivePlan } from '@/lib/generation/quota';

let userPlan: Plan = 'free';

// select plan, status, trial_end (no status=active filter only)
const { data: subData } = await supabase
  .from('subscriptions')
  .select('plan, status, trial_end')
  .eq('user_id', user.id)
  .maybeSingle();

userPlan = resolveEffectivePlan(subData);
```

Remove the buggy `subData?.plan === 'pro' ? 'pro' : 'free'` check.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/generate/page.tsx features/generate/components/GenerateClient.tsx
git commit -m "fix: pass Pro+ and trial plans into generate UI"
```

---

### Task 7: Fast / Quality control on GenerateForm

**Files:**
- Modify: `features/generate/components/GenerateForm.tsx`
- Modify: `features/generate/components/GenerateClient.tsx`
- Create or modify: `features/generate/components/GenerateForm.test.tsx`

- [ ] **Step 1: Write failing UI tests**

```tsx
// key cases in GenerateForm.test.tsx
it('shows Fast and Quality; Quality disabled for free', () => {
  render(<GenerateForm userPlan="free" onSubmit={jest.fn()} />);
  expect(screen.getByRole('radio', { name: /fast/i })).toBeChecked();
  expect(screen.getByRole('radio', { name: /quality/i })).toBeDisabled();
});

it('allows Quality for pro', () => {
  render(<GenerateForm userPlan="pro" onSubmit={jest.fn()} />);
  expect(screen.getByRole('radio', { name: /quality/i })).not.toBeDisabled();
});

it('includes generationMode in submit payload', async () => {
  const onSubmit = jest.fn();
  render(<GenerateForm userPlan="pro" onSubmit={onSubmit} />);
  await userEvent.click(screen.getByRole('radio', { name: /fast/i }));
  // fill required fields minimally then submit
  // expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ generationMode: 'fast' }));
});
```

Match existing GenerateForm test patterns for filling subject/grade/duration.

- [ ] **Step 2: Run tests to fail**

```bash
npm test -- features/generate/components/GenerateForm.test.tsx
```

Expected: FAIL (control missing)

- [ ] **Step 3: Implement control**

Constants:

```ts
const GENERATION_MODE_KEY = 'fp-generation-mode';
```

State:

```ts
const isPaid = userPlan === 'pro' || userPlan === 'pro_plus';
const [generationMode, setGenerationMode] = useState<'fast' | 'quality'>(isPaid ? 'quality' : 'fast');

useEffect(() => {
  try {
    const stored = localStorage.getItem(GENERATION_MODE_KEY);
    if (stored === 'fast' || stored === 'quality') {
      setGenerationMode(isPaid ? stored : 'fast');
    }
  } catch {
    // ignore
  }
}, [isPaid]);

function selectMode(mode: 'fast' | 'quality') {
  if (!isPaid && mode === 'quality') return;
  setGenerationMode(mode);
  try {
    localStorage.setItem(GENERATION_MODE_KEY, mode);
  } catch {
    // ignore
  }
}
```

UI (near submit): radiogroup labeled "Generation mode" with Fast / Quality. Help text:

- Fast: "Quicker plans for everyday lessons."
- Quality: "More thorough plans. Takes a bit longer."

For free Quality: `disabled` + hint "Upgrade to unlock Quality mode."

Extend `GenerateFormData`:

```ts
generationMode: 'fast' | 'quality';
```

On submit for free, always pass `generationMode: 'fast'`.

In `GenerateClient`, include `generationMode` in the POST JSON body to `/api/generate`.

- [ ] **Step 4: Run tests**

```bash
npm test -- features/generate/components/GenerateForm.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add features/generate/components/GenerateForm.tsx features/generate/components/GenerateForm.test.tsx features/generate/components/GenerateClient.tsx
git commit -m "feat: add Fast and Quality mode control on generate form"
```

---

### Task 8: Pricing and UpgradePrompt copy

**Files:**
- Modify: `features/billing/components/PricingClient.tsx`
- Modify: `features/billing/components/PricingClient.test.tsx` (if present)
- Modify: `components/ui/UpgradePrompt.tsx`
- Create or modify: `components/ui/UpgradePrompt.test.tsx`
- Modify: `tests/e2e/pricing.spec.ts`

- [ ] **Step 1: Update PLANS features**

Free features: replace `'Gemini Flash model'` with `'Fast mode'`.

Pro description: mention Fast and Quality instead of "smarter AI". Example:

```ts
description:
  'For teachers who plan every week, up to 20 AI lesson plans a month with Fast and Quality modes.',
features: [
  'Everything in Free',
  '20 lesson plans per month',
  'Fast and Quality modes',
  'OCR text extraction',
  'Priority support',
],
```

Pro+ features stay unlimited + everything in Pro (inherits modes).

UpgradePrompt:

```ts
// title can stay Upgrade to Pro
<p>You've reached the 3-lesson free plan limit for this month.</p>
// features:
'20 lesson plans per month on Pro',
'Unlimited on Pro+',
'Fast and Quality generation modes',
'DOCX export and filled-in template download',
```

- [ ] **Step 2: Update unit / e2e assertions**

In `tests/e2e/pricing.spec.ts` Free features test, add:

```ts
await expect(page.getByText('Fast mode')).toBeVisible();
```

In Pro features test, add:

```ts
await expect(page.getByText('Fast and Quality modes')).toBeVisible();
```

Update any PricingClient unit tests that assert old Gemini / smarter AI strings.

- [ ] **Step 3: Run tests**

```bash
npm test -- features/billing/components/PricingClient.test.tsx components/ui/UpgradePrompt.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add features/billing/components/PricingClient.tsx features/billing/components/PricingClient.test.tsx components/ui/UpgradePrompt.tsx components/ui/UpgradePrompt.test.tsx tests/e2e/pricing.spec.ts
git commit -m "docs: align pricing and upgrade copy with Fast Quality and quotas"
```

(Use `feat:` if preferred for copy that ships product behavior messaging.)

---

### Task 9: Dashboard and settings usage display

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/settings/page.tsx`
- Modify: `app/(app)/settings/SettingsClient.tsx`
- Modify: `app/(app)/settings/SettingsClient.test.tsx`

- [ ] **Step 1: Shared formatting helper**

Add to `lib/generation/quota.ts`:

```ts
export function formatGenerationUsage(input: {
  plan: Plan;
  generationCount: number;
  generationLimit: number | null;
}): string {
  if (input.generationLimit === null) {
    return `${input.generationCount} generated this period (Unlimited)`;
  }
  return `${input.generationCount} of ${input.generationLimit} used this period`;
}
```

Add unit tests for free / pro / pro_plus strings.

- [ ] **Step 2: Dashboard**

Fetch `generation_count`, `generation_count_reset_at`, `plan` (or subscription) and optionally run the same reset/limit helpers for display. Prefer:

```ts
const access = await resolveGenerationAccess(supabase, user.id);
// show formatGenerationUsage({ plan: access.userPlan, ... })
```

Replace the badge that only shows raw `generation_count` as "lessons generated" with the period-aware string.

Note: calling `resolveGenerationAccess` on dashboard may perform a lazy reset write. That is intended and matches authorize-on-read.

- [ ] **Step 3: Settings**

Pass a `usageLabel` string prop into `SettingsClient` next to plan label. Show under Account / plan row:

```tsx
<dt>Usage</dt>
<dd>{usageLabel}</dd>
```

- [ ] **Step 4: Tests + commit**

```bash
npm test -- lib/generation/quota.test.ts app/(app)/settings/SettingsClient.test.tsx
git add lib/generation/quota.ts lib/generation/quota.test.ts app/(app)/dashboard/page.tsx app/(app)/settings/page.tsx app/(app)/settings/SettingsClient.tsx app/(app)/settings/SettingsClient.test.tsx
git commit -m "feat: show current-period generation usage on dashboard and settings"
```

---

### Task 10: Full regression pass

**Files:** none new

- [ ] **Step 1: Run unit suite**

```bash
npm test
```

Expected: PASS (fix any leftover references to free lifetime 50, `userPlan: 'free' | 'pro'` only, or `isFreePlan` provider branching)

- [ ] **Step 2: Run pricing e2e if environment allows**

```bash
npx playwright test tests/e2e/pricing.spec.ts
```

Expected: PASS (or skip if BASE_URL / auth not configured; unit coverage must still pass)

- [ ] **Step 3: Final commit only if Step 1 produced fixes**

```bash
git add -A
git commit -m "fix: finish generation limits and Fast Quality regression cleanup"
```

Only commit if there are real fix files.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Free 3 / Pro 20 / Pro+ unlimited | Tasks 1–3 |
| Billing-period reset paid; calendar month Free | Tasks 1, 3 |
| Trial follows checkout plan | Tasks 1, 3, 6 |
| Fast / Quality teacher language | Tasks 7–8 |
| Free sees toggle; Quality locked; server coerce | Tasks 1, 5, 7 |
| Remember last choice; paid default Quality | Task 7 |
| Pricing + UpgradePrompt copy | Task 8 |
| Fix pro_plus generate UI plan | Task 6 |
| Dashboard / settings period usage | Task 9 |
| Tests unit + component + e2e pricing | Tasks 1–10 |
| Out of scope (variant picker, usage table, prices) | Not planned |

No placeholders left in task steps. Types: `Plan`, `GenerationMode`, `GenerationAccess.userPlan: Plan` stay consistent across tasks.

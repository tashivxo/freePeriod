import { resolveGenerationAccess } from './authorize';

function mockSupabase(opts: {
  sub: Record<string, unknown> | null;
  user: { generation_count: number; generation_count_reset_at: string | null; is_admin?: boolean };
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
      user: { generation_count: 50, generation_count_reset_at: null, is_admin: false },
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
      user: { generation_count: 3, generation_count_reset_at: future, is_admin: false },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.isRateLimited).toBe(true);
  });

  it('uses pro_plus unlimited for active pro_plus', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const sb = mockSupabase({
      sub: { plan: 'pro_plus', status: 'active', trial_end: null, renews_at: future },
      user: { generation_count: 100, generation_count_reset_at: future, is_admin: false },
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
      user: { generation_count: 20, generation_count_reset_at: renews, is_admin: false },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.userPlan).toBe('pro');
    expect(access.isRateLimited).toBe(true);
  });

  it('grants pro_plus unlimited when is_admin is true without subscription', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const sb = mockSupabase({
      sub: null,
      user: { generation_count: 500, generation_count_reset_at: future, is_admin: true },
    });
    const access = await resolveGenerationAccess(sb as never, 'user-1');
    expect(access.userPlan).toBe('pro_plus');
    expect(access.isRateLimited).toBe(false);
    expect(access.generationLimit).toBeNull();
  });
});

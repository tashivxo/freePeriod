import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scheduleAccountDeletion } from '@/lib/account/delete-user';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('deletion_scheduled_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.deletion_scheduled_at) {
    return NextResponse.json(
      { error: 'Account deletion is already scheduled' },
      { status: 409 },
    );
  }

  try {
    const result = await scheduleAccountDeletion(user.id);
    await supabase.auth.signOut();

    return NextResponse.json({
      ok: true,
      purgeAt: result.purgeAt,
      graceDays: result.graceDays,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to schedule account deletion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

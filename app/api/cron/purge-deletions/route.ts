import { NextResponse } from 'next/server';
import { purgeDueAccounts } from '@/lib/account/delete-user';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await purgeDueAccounts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purge failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

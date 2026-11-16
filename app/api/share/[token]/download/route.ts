export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { contentDispositionAttachment } from '@/lib/export/content-disposition';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { token } = await context.params;

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: share, error } = await admin
    .from('lesson_shares')
    .select('file_path, file_name, content_type')
    .eq('token', token)
    .maybeSingle();

  if (error || !share) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: fileData, error: downloadError } = await admin.storage
    .from('uploads')
    .download(share.file_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': share.content_type,
      'Content-Disposition': contentDispositionAttachment(share.file_name),
    },
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromImage } from '@/lib/ocr/tesseract';
import { parseDocx } from '@/lib/parse/parse-docx';
import { parsePdf } from '@/lib/parse/parse-pdf';
import { parseXlsx } from '@/lib/parse/parse-xlsx';
import type { ParsedContent } from '@/lib/parse/types';

function getFileType(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

async function parseImage(buffer: Buffer): Promise<ParsedContent> {
  const text = await extractTextFromImage(buffer);
  return { text, type: 'image', metadata: { ocr: true } };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const storagePath: string = body.storagePath;
  const uploadId: string | undefined = body.uploadId;

  if (!storagePath) {
    return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('uploads')
    .download(storagePath);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 404 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const fileName = storagePath.split('/').pop() ?? '';
  const ext = getFileType(fileName);

  let parsed: ParsedContent;

  try {
    switch (ext) {
      case 'docx':
        parsed = await parseDocx(buffer);
        break;
      case 'pdf':
        parsed = await parsePdf(buffer);
        break;
      case 'xlsx':
        parsed = parseXlsx(buffer);
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        parsed = await parseImage(buffer);
        break;
      default:
        return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 });
    }
  } catch {
    const errorMessage = 'Failed to parse document';
    if (uploadId) {
      await supabase
        .from('uploads')
        .update({
          parsed_content: { error: errorMessage } as unknown as Record<string, unknown>,
        })
        .eq('id', uploadId)
        .eq('user_id', user.id);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  if (!parsed.text.trim()) {
    const errorMessage = 'No readable text was found in this document. Please upload a clearer curriculum file.';
    if (uploadId) {
      await supabase
        .from('uploads')
        .update({
          parsed_content: {
            ...parsed,
            error: errorMessage,
          } as unknown as Record<string, unknown>,
        })
        .eq('id', uploadId)
        .eq('user_id', user.id);
    }
    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  if (uploadId) {
    await supabase
      .from('uploads')
      .update({ parsed_content: parsed as unknown as Record<string, unknown> })
      .eq('id', uploadId)
      .eq('user_id', user.id);
  }

  return NextResponse.json({
    text: parsed.text,
    type: parsed.type,
    metadata: parsed.metadata ?? {},
    preview: parsed.text.slice(0, 500),
  });
}

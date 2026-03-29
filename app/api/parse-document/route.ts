import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';
import { extractTextFromImage } from '@/lib/ocr/tesseract';

type ParsedContent = {
  text: string;
  type: 'docx' | 'pdf' | 'xlsx' | 'image';
  metadata?: Record<string, unknown>;
};

function getFileType(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

async function parseDocx(buffer: Buffer): Promise<ParsedContent> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim(), type: 'docx' };
}

async function parsePdf(buffer: Buffer): Promise<ParsedContent> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  let text = result.text.trim();

  if (text.length < 20) {
    text = await extractTextFromImage(buffer);
    return { text, type: 'pdf', metadata: { ocr: true } };
  }

  return { text, type: 'pdf', metadata: { pages: result.total } };
}

function parseXlsx(buffer: Buffer): ParsedContent {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(`--- ${sheetName} ---\n${csv}`);
  }

  return { text: sheets.join('\n\n').trim(), type: 'xlsx', metadata: { sheets: workbook.SheetNames } };
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
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 });
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

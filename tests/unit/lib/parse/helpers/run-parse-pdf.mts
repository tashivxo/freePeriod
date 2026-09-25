import { cleanExtractedText } from '../../../../../lib/parse/filter-visible-text.ts';

function buildMinimalTextPdf(text: string): Buffer {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 18 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefPos = Buffer.byteLength(body);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(body);
}

Reflect.deleteProperty(globalThis, 'DOMMatrix');
await import('../../../../../lib/parse/ensure-pdfjs-dom-polyfill.ts');
const { PDFParse } = await import('pdf-parse');

const parser = new PDFParse({
  data: new Uint8Array(buildMinimalTextPdf('Curriculum photosynthesis lesson for grade 8')),
});
try {
  const result = await parser.getText();
  process.stdout.write(
    JSON.stringify({
      text: cleanExtractedText(result.text),
      pages: result.total,
    }),
  );
} finally {
  await parser.destroy();
}

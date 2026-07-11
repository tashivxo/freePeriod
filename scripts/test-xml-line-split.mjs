import fs from 'fs';
import JSZip from 'jszip';

// Implement the proposed logic inline and test it against the seating arrangements cell
function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function cellPlainText(cellXml) {
  const withLineBreaks = cellXml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\s*\/?>/g, '\n')
    .replace(/<\/w:tc>/g, '\n');
  const decoded = decodeXmlEntities(withLineBreaks.replace(/<[^>]+>/g, ''));
  return decoded
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function splitCheckboxOptions(body) {
  if (body.includes('\n')) {
    return body.split('\n').map((part) => part.trim()).filter(Boolean);
  }
  if (/\d-\s*/.test(body)) {
    return body.split(/,\s*(?=\d-)/).map((part) => part.trim()).filter(Boolean);
  }
  if (body.includes('/')) {
    return body.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  }
  return body.split(/,\s*/).map((part) => part.trim()).filter(Boolean);
}

function optionIsSelected(option, selections) {
  const normalizedOption = option.replace(/^\d-\s*/, '').trim().toLowerCase();
  return selections.some((selection) => {
    const normalizedSelection = selection.trim().toLowerCase();
    if (!normalizedSelection) return false;
    if (
      normalizedOption.includes(normalizedSelection) ||
      normalizedSelection.includes(normalizedOption)
    ) {
      return true;
    }
    const keywords = normalizedSelection.split(/\s+/).filter((word) => word.length > 4);
    return keywords.length > 0 && keywords.filter((word) => normalizedOption.includes(word)).length >= 2;
  });
}

const filePath = 'c:/Users/tashi/Downloads/Science Daily-Weekly Lesson Plan Template.docx';
const buf = fs.readFileSync(filePath);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('string');

const rows = [...xml.matchAll(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g)];
for (const row of rows) {
  const cells = [...row[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map(m => m[0]);
  const label = cells[0] ? cellPlainText(cells[0]) : '';
  if (/Seating Arrangements|Science.*Engineering|Scientific Method|Higher-Order/i.test(label)) {
    console.log('=== TEMPLATE LABEL:', label, '===');
    const plain = cellPlainText(cells[1] || '');
    console.log('PLAIN CELL BODY:\n' + plain);
    
    const prefixMatch = plain.match(/^(Please highlight all that apply:?\s*)/i);
    if (prefixMatch) {
      const body = plain.slice(prefixMatch[1].length);
      const options = splitCheckboxOptions(body);
      console.log('OPTIONS EXTRACTED:');
      options.forEach(o => console.log('  -', JSON.stringify(o)));
    }
  }
}

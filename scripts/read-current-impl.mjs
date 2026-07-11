import fs from 'fs';
import JSZip from 'jszip';

// 1. Let's read the current fill-generic-template.ts and analyze the changes we want to make.
const filePath = 'lib/export/fill-generic-template.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Let's inspect the current implementation of cellPlainText, buildParagraphsXml, splitCheckboxOptions and highlightCheckboxCell in fill-generic-template.ts
console.log('CURRENT cellPlainText:');
const cellPlainTextMatch = code.match(/function cellPlainText[\s\S]*?\}\n/);
if (cellPlainTextMatch) console.log(cellPlainTextMatch[0]);

console.log('CURRENT buildParagraphsXml:');
const buildParagraphsXmlMatch = code.match(/function buildParagraphsXml[\s\S]*?\}\n/);
if (buildParagraphsXmlMatch) console.log(buildParagraphsXmlMatch[0]);

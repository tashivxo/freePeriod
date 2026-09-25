/**
 * Import pdfjs-dist the same way pdf-parse v2 does. Used to prove that
 * missing DOMMatrix crashes at module evaluation, and that our polyfill
 * prevents that crash when @napi-rs/canvas is unavailable.
 */
const mode = process.argv[2] ?? 'polyfill';

Reflect.deleteProperty(globalThis, 'DOMMatrix');

if (mode === 'polyfill') {
  await import('../../../../../lib/parse/ensure-pdfjs-dom-polyfill.ts');
}

await import('pdfjs-dist/legacy/build/pdf.mjs');
process.stdout.write(`pdfjs-loaded:${typeof (globalThis as { DOMMatrix?: unknown }).DOMMatrix}`);

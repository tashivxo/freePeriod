/**
 * @jest-environment node
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ensurePdfJsDomPolyfill } from '@/lib/parse/ensure-pdfjs-dom-polyfill';

const helpersDir = path.join(process.cwd(), 'tests/unit/lib/parse/helpers');
const blockCanvas = path.join(helpersDir, 'block-canvas.cjs');
const importPdfjs = path.join(helpersDir, 'import-pdfjs.mts');
const runParsePdf = path.join(helpersDir, 'run-parse-pdf.mts');

function runNode(script: string, args: string[] = []) {
  return spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--require', blockCanvas, script, ...args],
    {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    },
  );
}

type DomMatrixCtor = {
  new (init?: string | ArrayLike<number>): {
    isIdentity: boolean;
    scaleSelf: (scaleX?: number, scaleY?: number) => {
      translateSelf: (tx?: number, ty?: number) => unknown;
    };
  };
};

function getDomMatrix(): DomMatrixCtor | undefined {
  return (globalThis as { DOMMatrix?: DomMatrixCtor }).DOMMatrix;
}

describe('pdfjs Node polyfill', () => {
  it('defines DOMMatrix so pdfjs can evaluate without a browser or canvas', () => {
    Reflect.deleteProperty(globalThis, 'DOMMatrix');
    expect(getDomMatrix()).toBeUndefined();

    ensurePdfJsDomPolyfill();

    const DOMMatrix = getDomMatrix();
    expect(typeof DOMMatrix).toBe('function');
    const matrix = new DOMMatrix!();
    expect(matrix.isIdentity).toBe(true);
    expect(() => matrix.scaleSelf(1, -1).translateSelf(0, -100)).not.toThrow();
  });

  it('can import parsePdf after DOMMatrix is cleared', async () => {
    Reflect.deleteProperty(globalThis, 'DOMMatrix');
    ensurePdfJsDomPolyfill();
    const loaded = await import('@/lib/parse/parse-pdf');
    expect(typeof loaded.parsePdf).toBe('function');
    expect(typeof getDomMatrix()).toBe('function');
  });
});

describe('pdfjs on a Vercel-like Node runtime (no canvas)', () => {
  it('crashes at module evaluation when DOMMatrix is missing', () => {
    const result = runNode(importPdfjs, ['crash']);
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}\n${result.stdout}`).toMatch(/DOMMatrix is not defined/);
  });

  it('imports pdfjs after the JS DOMMatrix polyfill without requiring canvas', () => {
    const result = runNode(importPdfjs, ['polyfill']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('pdfjs-loaded:function');
  });

  it('extracts readable text from a curriculum PDF without DOMMatrix or canvas', () => {
    const result = runNode(runParsePdf);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout.trim()) as { text: string; pages: number };
    expect(parsed.pages).toBe(1);
    expect(parsed.text.toLowerCase()).toContain('photosynthesis');
  });
});

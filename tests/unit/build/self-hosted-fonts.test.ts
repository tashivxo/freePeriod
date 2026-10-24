import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const layoutSource = readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');

describe('root layout fonts', () => {
  it('never downloads fonts from Google at build time', () => {
    // Google Fonts downloads have failed production builds; fonts are self-hosted.
    expect(layoutSource).not.toMatch(/next\/font\/google/);
  });

  it('ships every font file the layout references', () => {
    const paths = [...layoutSource.matchAll(/path:\s*'(\.\/fonts\/[^']+)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(existsSync(path.join(root, 'app', p))).toBe(true);
    }
  });

  it('keeps the Manrope and Noto Sans Arabic CSS variables', () => {
    expect(layoutSource).toMatch(/--font-manrope/);
    expect(layoutSource).toMatch(/--font-noto-sans-arabic/);
  });
});

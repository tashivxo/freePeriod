import { readFileSync } from 'node:fs';
import path from 'node:path';

const layoutSource = readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8');

describe('root layout fonts', () => {
  it('loads Noto Sans SC from next/font/local so Preview builds do not depend on Google CSS', () => {
    expect(layoutSource).toMatch(/from 'next\/font\/local'/);
    expect(layoutSource).toMatch(/variable:\s*'--font-noto-sans-sc'/);
    expect(layoutSource).not.toMatch(/Noto_Sans_SC/);
  });

  it('still loads Manrope and Noto Sans Arabic from next/font/google', () => {
    expect(layoutSource).toMatch(/from 'next\/font\/google'/);
    expect(layoutSource).toMatch(/\bManrope\b/);
    expect(layoutSource).toMatch(/\bNoto_Sans_Arabic\b/);
  });
});

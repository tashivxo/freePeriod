import { readFileSync } from 'node:fs';
import path from 'node:path';

const appLayoutSource = readFileSync(
  path.join(process.cwd(), 'app/(app)/layout.tsx'),
  'utf8',
);

describe('app layout theme controls', () => {
  it('does not mount a floating theme toggle in the authenticated shell', () => {
    expect(appLayoutSource).not.toMatch(/AppFloatingButton/);
    expect(appLayoutSource).not.toMatch(/ThemeToggle/);
    expect(appLayoutSource).not.toMatch(/app-floating-button/);
  });
});

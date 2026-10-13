import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'components/ui/backgrounds/ColorBends.jsx'),
  'utf8',
);

function emptyColorsBranch(src: string): string {
  const countGuard = src.indexOf('if (uColorCount > 0)');
  expect(countGuard).toBeGreaterThan(-1);
  const elseIdx = src.indexOf('} else {', countGuard);
  expect(elseIdx).toBeGreaterThan(-1);
  const intensityIdx = src.indexOf('col *= uIntensity', elseIdx);
  expect(intensityIdx).toBeGreaterThan(-1);
  return src.slice(elseIdx, intensityIdx);
}

describe('ColorBends empty-colors GLSL path', () => {
  it('renders transparent black so a missing colors prop cannot rainbow', () => {
    const branch = emptyColorsBranch(source);
    expect(branch).toMatch(/col\s*=\s*vec3\(\s*0\.0\s*\)/);
    expect(branch).toMatch(/a\s*=\s*0\.0/);
    expect(branch).not.toMatch(/col\[k\]/);
  });
});

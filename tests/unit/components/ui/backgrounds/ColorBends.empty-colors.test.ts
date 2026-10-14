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

function namedColorsBranch(src: string): string {
  const countGuard = src.indexOf('if (uColorCount > 0)');
  expect(countGuard).toBeGreaterThan(-1);
  const elseIdx = src.indexOf('} else {', countGuard);
  expect(elseIdx).toBeGreaterThan(-1);
  return src.slice(countGuard, elseIdx);
}

describe('ColorBends empty-colors GLSL path', () => {
  it('types colors as string[] so a palette is not inferred as never[]', () => {
    expect(source).toMatch(/@param \{string\[\]\} \[props\.colors\]/);
  });

  it('renders RGB-split bands so a missing colors prop produces rainbow', () => {
    const branch = emptyColorsBranch(source);
    expect(branch).toMatch(/col\[k\]/);
    expect(branch).toMatch(/uBandWidth/);
    expect(branch).not.toMatch(/col\s*=\s*vec3\(\s*0\.0\s*\)/);
    expect(branch).not.toMatch(/a\s*=\s*0\.0/);
  });

  it('keeps the weighted-average mix for named colors', () => {
    expect(namedColorsBranch(source)).toMatch(/sumCol\s*\/\s*max\(sumW/);
  });
});

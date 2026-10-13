import {
  COLOR_BENDS_DEFAULT_OPTION,
  COLOR_BENDS_GOLD,
  COLOR_BENDS_INTENSITY,
  COLOR_BENDS_PALETTE,
  COLOR_BENDS_PALETTES,
  COLOR_BENDS_PEACH,
  COLOR_BENDS_ROSE,
  CORAL,
  CORAL_DARK,
  CORAL_LIGHT,
  MUSTARD,
  MUSTARD_LIGHT,
  PEACH_BRIDGE,
  TEXT_PRIMARY,
} from '@/lib/utils/brand-colors';
import {
  hexToOklch,
  isUaeSafeHue,
  maxSrgbChroma,
  oklchHueSpan,
  oklchToHex,
} from '@/lib/utils/oklch';

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function wcagContrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const FORBIDDEN_MIN = 120;
const FORBIDDEN_MAX = 300;
const MAX_SPAN = 120;

function assertUaeSafePalette(hexes: readonly string[]) {
  const hues = hexes.map((hex) => hexToOklch(hex).h);

  for (const [index, hue] of hues.entries()) {
    expect(isUaeSafeHue(hue)).toBe(true);
    expect(hue >= FORBIDDEN_MIN && hue <= FORBIDDEN_MAX).toBe(false);
    expect(hexes[index]).toMatch(/^#[0-9A-F]{6}$/i);
  }

  expect(oklchHueSpan(hues)).toBeLessThan(MAX_SPAN);
}

describe('COLOR_BENDS_PALETTE', () => {
  it('defaults to option C and is easy to swap', () => {
    expect(COLOR_BENDS_DEFAULT_OPTION).toBe('C');
    expect(COLOR_BENDS_PALETTE).toEqual(COLOR_BENDS_PALETTES.C);
  });

  it('option C is rose, peach bridge, gold, not the CTA 500s', () => {
    expect(COLOR_BENDS_PALETTES.C).toEqual([
      COLOR_BENDS_ROSE,
      COLOR_BENDS_PEACH,
      COLOR_BENDS_GOLD,
    ]);
    expect(COLOR_BENDS_PALETTES.C).not.toContain(CORAL);
    expect(COLOR_BENDS_PALETTES.C).not.toContain(MUSTARD);
    expect(Math.abs(hexToOklch(COLOR_BENDS_PEACH).h - 40)).toBeLessThan(2);
  });

  it('option C stops are mid-high L at a shared share of max chroma', () => {
    const coral = hexToOklch(CORAL);
    const shares = COLOR_BENDS_PALETTES.C.map((hex) => {
      const { l, c, h } = hexToOklch(hex);
      expect(l).toBeGreaterThanOrEqual(0.855);
      expect(l).toBeLessThanOrEqual(0.9);
      expect(c / coral.c).toBeGreaterThan(0.4);
      expect(c / coral.c).toBeLessThan(0.8);
      return c / maxSrgbChroma(l, h);
    });
    for (const share of shares) expect(share).toBeCloseTo(shares[0], 1);
  });

  it('option C keeps primary text above 4.5:1 on every stop', () => {
    for (const hex of COLOR_BENDS_PALETTES.C) {
      expect(wcagContrast(TEXT_PRIMARY, hex)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('light intensity stays at 1 so stops are neither greyed nor clipped', () => {
    expect(COLOR_BENDS_INTENSITY.light).toBe(1);
    expect(COLOR_BENDS_INTENSITY.dark).toBeLessThan(COLOR_BENDS_INTENSITY.light);
  });

  it('option A is coral and mustard only', () => {
    expect(COLOR_BENDS_PALETTES.A).toEqual([
      CORAL_LIGHT,
      CORAL,
      MUSTARD_LIGHT,
      MUSTARD,
    ]);
  });

  it('option B is coral monohue', () => {
    expect(COLOR_BENDS_PALETTES.B).toEqual([CORAL_LIGHT, CORAL, CORAL_DARK]);
  });

  it('derives PEACH_BRIDGE from mustard L/C at hue 40', () => {
    const mustard = hexToOklch(MUSTARD);
    expect(PEACH_BRIDGE).toBe(
      oklchToHex({ l: mustard.l, c: mustard.c, h: 40 }),
    );
    const peach = hexToOklch(PEACH_BRIDGE);
    expect(peach.l).toBeCloseTo(mustard.l, 3);
    expect(Math.abs(peach.h - 40)).toBeLessThan(1);
    // Hue 40 at mustard's C is outside sRGB; chroma is gamut-clipped, not raised.
    expect(peach.c).toBeLessThanOrEqual(mustard.c + 1e-6);
    expect(peach.c).toBeGreaterThan(0.05);
  });

  it.each([
    ['A', () => COLOR_BENDS_PALETTES.A],
    ['B', () => COLOR_BENDS_PALETTES.B],
    ['C', () => COLOR_BENDS_PALETTES.C],
    ['default', () => COLOR_BENDS_PALETTE],
  ] as const)('%s hues sit outside 120-300 and span under 120', (_label, getPalette) => {
    assertUaeSafePalette(getPalette());
  });
});

/**
 * OKLCH conversion for non-CSS contexts (WebGL palettes, unit tests).
 * Ottosson OKLab, sRGB D65. Hue in degrees [0, 360).
 */

export type Oklch = {
  l: number;
  c: number;
  h: number;
};

const FORBIDDEN_HUE_MIN = 120;
const FORBIDDEN_HUE_MAX = 300;

function srgbToLinear(channel: number): number {
  const abs = Math.abs(channel);
  return abs <= 0.04045
    ? channel / 12.92
    : Math.sign(channel) * ((abs + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const abs = Math.abs(channel);
  return abs <= 0.0031308
    ? 12.92 * channel
    : Math.sign(channel) * (1.055 * abs ** (1 / 2.4) - 0.055);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const full =
    h.length === 3 ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function linearSrgbToOklab(r: number, g: number, b: number) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToLinearSrgb(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894789776 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function oklabToOklch(L: number, a: number, b: number): Oklch {
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-8 ? 0 : h };
}

function oklchToOklab(l: number, c: number, h: number) {
  const hr = (h * Math.PI) / 180;
  return {
    L: l,
    a: c * Math.cos(hr),
    b: c * Math.sin(hr),
  };
}

function inSrgbGamut(r: number, g: number, b: number): boolean {
  const epsilon = 1e-6;
  return (
    r >= -epsilon &&
    r <= 1 + epsilon &&
    g >= -epsilon &&
    g <= 1 + epsilon &&
    b >= -epsilon &&
    b <= 1 + epsilon
  );
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = parseHex(hex);
  const lab = linearSrgbToOklab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  return oklabToOklch(lab.L, lab.a, lab.b);
}

function oklchToLinearSrgb(oklch: Oklch) {
  const lab = oklchToOklab(oklch.l, oklch.c, oklch.h);
  return oklabToLinearSrgb(lab.L, lab.a, lab.b);
}

/** Largest sRGB-displayable chroma at this lightness and hue. */
export function maxSrgbChroma(lightness: number, hue: number): number {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    const rgb = oklchToLinearSrgb({ l: lightness, c: mid, h: hue });
    if (inSrgbGamut(rgb.r, rgb.g, rgb.b)) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function oklchToHex(oklch: Oklch): string {
  let c = oklch.c;
  let rgb = oklchToLinearSrgb({ ...oklch, c });

  if (!inSrgbGamut(rgb.r, rgb.g, rgb.b)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      rgb = oklchToLinearSrgb({ ...oklch, c: mid });
      if (inSrgbGamut(rgb.r, rgb.g, rgb.b)) lo = mid;
      else hi = mid;
    }
    c = lo;
    rgb = oklchToLinearSrgb({ ...oklch, c });
  }

  const toByte = (channel: number) => {
    const encoded = linearToSrgb(Math.min(1, Math.max(0, channel)));
    return Math.round(encoded * 255);
  };

  const hex = [toByte(rgb.r), toByte(rgb.g), toByte(rgb.b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return `#${hex}`;
}

/** Smallest arc on the hue circle that covers every stop. */
export function oklchHueSpan(hues: number[]): number {
  if (hues.length === 0) return 0;
  const sorted = hues
    .map((h) => ((h % 360) + 360) % 360)
    .sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    maxGap = Math.max(maxGap, sorted[i + 1] - sorted[i]);
  }
  maxGap = Math.max(maxGap, sorted[0] + 360 - sorted[sorted.length - 1]);
  return 360 - maxGap;
}

/** UAE-safe: hue must sit outside the green-blue-violet arc. */
export function isUaeSafeHue(hue: number): boolean {
  const h = ((hue % 360) + 360) % 360;
  return h < FORBIDDEN_HUE_MIN || h > FORBIDDEN_HUE_MAX;
}

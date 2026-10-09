/** WCAG 2 relative luminance and contrast helpers for token unit tests. */

function hexToSrgbChannel(hexChannel: string): number {
  const value = Number.parseInt(hexChannel, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex colour, received: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  const red = hexToSrgbChannel(toHex(r));
  const green = hexToSrgbChannel(toHex(g));
  const blue = hexToSrgbChannel(toHex(b));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

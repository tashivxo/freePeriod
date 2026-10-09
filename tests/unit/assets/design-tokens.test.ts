import fs from 'node:fs';
import path from 'node:path';
import rawTokens from '@/assets/design-tokens.json';
import { contrastRatio } from '@/tests/helpers/contrast';

type TokenLeaf = { value: string; type?: string; css?: string };
type TokenGroup = { [key: string]: TokenLeaf | TokenGroup | string | undefined };

const tokens = rawTokens as {
  primitive: { color: Record<string, TokenLeaf | undefined> };
  semantic: { color: Record<string, TokenLeaf | undefined> };
  component: { button: Record<string, TokenLeaf | undefined> };
};

const GLOBALS_CSS = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');

function isTokenLeaf(node: unknown): node is TokenLeaf {
  return Boolean(node && typeof node === 'object' && 'value' in node && typeof (node as TokenLeaf).value === 'string');
}

function resolveTokenValue(ref: string): string {
  if (!ref.startsWith('{') || !ref.endsWith('}')) return ref;
  const pathParts = ref.slice(1, -1).split('.');
  let node: unknown = tokens;
  for (const part of pathParts) {
    if (!node || typeof node !== 'object') {
      throw new Error(`Could not resolve token path ${ref}`);
    }
    node = (node as TokenGroup)[part];
  }
  if (isTokenLeaf(node)) return resolveTokenValue(node.value);
  if (typeof node === 'string') return resolveTokenValue(node);
  throw new Error(`Token ${ref} did not resolve to a colour value`);
}

function semanticValue(name: string): string {
  const leaf = tokens.semantic.color[name];
  if (!leaf) throw new Error(`Missing semantic colour token ${name}`);
  return resolveTokenValue(leaf.value);
}

function extractCssBlock(css: string, prelude: string): string {
  const start = css.indexOf(prelude);
  if (start < 0) throw new Error(`Missing CSS block ${prelude}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed CSS block ${prelude}`);
}

function cssCustomProperty(block: string, name: string): string {
  const match = block.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing CSS custom property ${name}`);
  return match[1].trim();
}

describe('export toolbar colour tokens', () => {
  const theme = extractCssBlock(GLOBALS_CSS, '@theme {');
  const themeInline = extractCssBlock(GLOBALS_CSS, '@theme inline {');
  const root = extractCssBlock(GLOBALS_CSS, ':root {');
  const dark = extractCssBlock(GLOBALS_CSS, '.dark {');

  it('adds coral-800 and the soft/hover semantic tokens', () => {
    expect(tokens.primitive.color['coral-800']?.value).toBe('#CA5C81');
    expect(semanticValue('primary-soft')).toBe('#FFE4EE');
    expect(semanticValue('primary-soft-hover')).toBe('#FFB8D0');
    expect(semanticValue('secondary')).toBe('#FEF3C7');
    expect(semanticValue('secondary-hover')).toBe('#FADB8A');

    expect(cssCustomProperty(theme, '--color-coral-800')).toBe('#CA5C81');
    expect(cssCustomProperty(themeInline, '--color-primary-soft')).toBe('var(--primary-soft)');
    expect(cssCustomProperty(themeInline, '--color-primary-soft-hover')).toBe('var(--primary-soft-hover)');
    expect(cssCustomProperty(themeInline, '--color-secondary-hover')).toBe('var(--secondary-hover)');

    expect(cssCustomProperty(root, '--primary-soft')).toMatch(/coral-100|#FFE4EE/);
    expect(cssCustomProperty(root, '--primary-soft-hover')).toMatch(/coral-light|#FFB8D0/);
    expect(cssCustomProperty(root, '--secondary-hover')).toMatch(/mustard-light|#FADB8A/);

    expect(cssCustomProperty(dark, '--primary-soft')).toBe('#40262F');
    expect(cssCustomProperty(dark, '--primary-soft-hover')).toBe('#58333F');
    expect(cssCustomProperty(dark, '--secondary')).toBe('#3E3318');
    expect(cssCustomProperty(dark, '--secondary-hover')).toBe('#56451F');
  });

  it('keeps fill/download pairings above WCAG AA from resolved token values', () => {
    const coral = semanticValue('primary');
    const coralSoft = semanticValue('primary-soft');
    const mustard = semanticValue('accent');
    const secondary = semanticValue('secondary');
    const text = semanticValue('text-primary');

    expect(contrastRatio(text, coral)).toBeGreaterThanOrEqual(7.7);
    expect(contrastRatio(text, mustard)).toBeGreaterThanOrEqual(10.4);
    expect(contrastRatio(text, secondary)).toBeGreaterThanOrEqual(15);
    expect(contrastRatio(text, coralSoft)).toBeGreaterThanOrEqual(14);
  });
});

describe('app-wide primary and focus contrast', () => {
  const root = extractCssBlock(GLOBALS_CSS, ':root {');
  const dark = extractCssBlock(GLOBALS_CSS, '.dark {');
  const base = extractCssBlock(GLOBALS_CSS, '@layer base {');

  it('uses dark text on coral for light primary buttons', () => {
    const primary = semanticValue('primary');
    const primaryTextLeaf = tokens.component.button['primary-text'];
    if (!primaryTextLeaf) throw new Error('Missing component.button.primary-text');
    const primaryText = resolveTokenValue(primaryTextLeaf.value);
    const cssForeground = cssCustomProperty(root, '--primary-foreground');

    expect(primaryText.toUpperCase()).toBe('#1A1A2E');
    expect(cssForeground.toUpperCase()).toBe('#1A1A2E');
    expect(contrastRatio(primaryText, primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(cssForeground, primary)).toBeGreaterThanOrEqual(4.5);

    const darkForeground = cssCustomProperty(dark, '--primary-foreground');
    expect(darkForeground.toUpperCase()).toBe('#060918');
    expect(contrastRatio(darkForeground, primary)).toBeGreaterThanOrEqual(9);
  });

  it('uses coral-800 for the light focus ring against warm white', () => {
    const background = semanticValue('background');
    const focusRing = semanticValue('focus-ring');
    const cssRing = cssCustomProperty(root, '--ring');

    expect(focusRing.toUpperCase()).toBe('#CA5C81');
    expect(cssRing).toMatch(/coral-800|#CA5C81/);
    expect(contrastRatio(focusRing, background)).toBeGreaterThanOrEqual(3);
    expect(base).toMatch(/outline-ring/);
    expect(cssCustomProperty(dark, '--ring')).toMatch(/color-coral(?!-800)/);
  });
});

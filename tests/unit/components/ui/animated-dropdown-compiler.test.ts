import { readFileSync } from 'node:fs';
import path from 'node:path';

const source = readFileSync(
  path.join(process.cwd(), 'components/ui/animated-dropdown.tsx'),
  'utf8',
);

describe('AnimatedDropdown React Compiler constraints', () => {
  it('does not position the listbox in useLayoutEffect', () => {
    expect(source).not.toMatch(/useLayoutEffect/);
  });

  it('wraps the portal with AnimatePresence so the exit animation can play', () => {
    const presenceIndex = source.indexOf('<AnimatePresence');
    const presenceClose = source.indexOf('</AnimatePresence>');
    const portalInPresence = source.indexOf('<MenuPortal', presenceIndex);

    expect(presenceIndex).toBeGreaterThan(-1);
    expect(portalInPresence).toBeGreaterThan(presenceIndex);
    expect(presenceClose).toBeGreaterThan(portalInPresence);
    expect(source).toMatch(/function MenuPortal/);
    expect(source).toMatch(/createPortal\(children, document\.body\)/);
  });
});

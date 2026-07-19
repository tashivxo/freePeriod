import { render, waitFor } from '@/lib/test-utils';
import { HeroPictogram } from './HeroPictogram';

jest.mock('animejs', () => ({
  animate: jest.fn((_targets: unknown, opts: { complete?: () => void }) => {
    opts.complete?.();
    return { pause: jest.fn() };
  }),
}));

describe('HeroPictogram', () => {
  it('clears will-change after entrance completes', async () => {
    const { getByTestId } = render(<HeroPictogram />);
    const wrap = getByTestId('animated-logo') as HTMLElement;

    await waitFor(() => {
      expect(wrap.style.willChange === '' || wrap.style.willChange === 'auto').toBe(true);
    });
  });
});

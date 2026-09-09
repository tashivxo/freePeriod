import { act, render, screen } from '@testing-library/react';

import { TEXT_SWAP } from '@/lib/motion/tokens';
import { TextSwap } from './TextSwap';

describe('TextSwap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps copy visible by default (no opacity:0 rest state)', () => {
    render(<TextSwap swapKey="en">Hello</TextSwap>);
    const node = screen.getByText('Hello');
    expect(node).toBeVisible();
    expect(node).toHaveClass('t-text-swap');
    expect(node).not.toHaveClass('is-exit');
    expect(node).not.toHaveClass('is-enter-start');
    expect(node.style.opacity === '' || node.style.opacity === '1').toBe(true);
  });

  it('exits, swaps text, then enters when swapKey changes', () => {
    const { rerender } = render(<TextSwap swapKey="en">Hello</TextSwap>);
    rerender(<TextSwap swapKey="es">Hola</TextSwap>);

    const exiting = screen.getByText('Hello');
    expect(exiting).toHaveClass('is-exit');

    act(() => {
      jest.advanceTimersByTime(TEXT_SWAP.exitMs);
    });

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toHaveClass('is-enter-start');

    act(() => {
      jest.advanceTimersByTime(16);
    });
    act(() => {
      jest.advanceTimersByTime(16);
    });

    expect(screen.getByText('Hola')).toHaveClass('is-enter');
  });

  it('swaps immediately when reduced motion is preferred', () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    const { rerender } = render(<TextSwap swapKey="en">Hello</TextSwap>);
    rerender(<TextSwap swapKey="ar">مرحبا</TextSwap>);

    expect(screen.getByText('مرحبا')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    expect(screen.getByText('مرحبا')).not.toHaveClass('is-exit');
  });

  it('interrupts an in-flight swap when swapKey changes again', () => {
    const { rerender } = render(<TextSwap swapKey="en">Hello</TextSwap>);
    rerender(<TextSwap swapKey="es">Hola</TextSwap>);
    rerender(<TextSwap swapKey="ar">مرحبا</TextSwap>);

    act(() => {
      jest.advanceTimersByTime(TEXT_SWAP.exitMs);
    });
    act(() => {
      jest.advanceTimersByTime(32);
    });

    expect(screen.getByText('مرحبا')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});

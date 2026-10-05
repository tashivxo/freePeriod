import React from 'react';
import { fireEvent } from '@testing-library/react';
import { render, screen } from '@/tests/helpers';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { getMessages } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { AnimatedIconHandle } from '@/components/ui/icons/types';

let mockLocale: Locale = 'en';
let mockResolvedTheme: 'light' | 'dark' = 'light';
let mockAnimationDisabled = true;
const mockSetTheme = jest.fn();

const sunHandle: AnimatedIconHandle = {
  startAnimation: jest.fn(),
  stopAnimation: jest.fn(),
};
const moonHandle: AnimatedIconHandle = {
  startAnimation: jest.fn(),
  stopAnimation: jest.fn(),
};

const sunRef = { current: null as AnimatedIconHandle | null };
const moonRef = { current: null as AnimatedIconHandle | null };
let nextMotionRef: 'sun' | 'moon' = 'sun';

jest.mock('@/providers/locale', () => {
  const { getMessages: loadMessages } = jest.requireActual('@/lib/i18n') as typeof import('@/lib/i18n');
  const t = (key: string) => {
    const messages = loadMessages(mockLocale);
    const parts = key.split('.');
    let current: unknown = messages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  };
  return {
    useT: () => t,
    useLocale: () => ({ locale: mockLocale, setLocale: jest.fn(), dir: 'ltr', messages: {}, t }),
  };
});

jest.mock('@/providers/theme', () => ({
  useTheme: () => ({
    theme: mockResolvedTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => {
    const ref = nextMotionRef === 'sun' ? sunRef : moonRef;
    nextMotionRef = nextMotionRef === 'sun' ? 'moon' : 'sun';
    return {
      ref,
      animationDisabled: mockAnimationDisabled,
    };
  },
}));

jest.mock('@/components/ui/icons/sun', () => ({
  SunIcon: React.forwardRef(function SunIcon(
    _props: unknown,
    ref: React.Ref<AnimatedIconHandle>,
  ) {
    React.useImperativeHandle(ref, () => sunHandle);
    return <span data-testid="sun-icon" />;
  }),
}));

jest.mock('@/components/ui/icons/moon', () => ({
  MoonIcon: React.forwardRef(function MoonIcon(
    _props: unknown,
    ref: React.Ref<AnimatedIconHandle>,
  ) {
    React.useImperativeHandle(ref, () => moonHandle);
    return <span data-testid="moon-icon" />;
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockLocale = 'en';
    mockResolvedTheme = 'light';
    mockAnimationDisabled = true;
    nextMotionRef = 'sun';
    mockSetTheme.mockClear();
    (sunHandle.startAnimation as jest.Mock).mockClear();
    (sunHandle.stopAnimation as jest.Mock).mockClear();
    (moonHandle.startAnimation as jest.Mock).mockClear();
    (moonHandle.stopAnimation as jest.Mock).mockClear();
    sunRef.current = null;
    moonRef.current = null;
  });

  it('shows English try-dark-mode copy on the landing control', () => {
    render(<ThemeToggle variant="floating-label" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToDarkMode });
    expect(button).toHaveTextContent(getMessages('en').landing.tryDarkMode);
  });

  it('shows Simplified Chinese try-dark-mode copy when locale is zh-Hans', () => {
    mockLocale = 'zh-Hans';
    render(<ThemeToggle variant="floating-label" />);
    const button = screen.getByRole('button', {
      name: getMessages('zh-Hans').landing.switchToDarkMode,
    });
    expect(button).toHaveTextContent(getMessages('zh-Hans').landing.tryDarkMode);
  });

  it('keeps a fixed footprint for the floating-label variant', () => {
    render(<ThemeToggle variant="floating-label" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToDarkMode });
    expect(button).toHaveClass('h-11');
    expect(button).toHaveClass('w-[16rem]');
    expect(button).toHaveClass('shrink-0');
    expect(button).toHaveClass('whitespace-nowrap');
  });

  it('keeps both theme icons mounted for an interruptible swap', () => {
    const { container } = render(<ThemeToggle variant="icon" />);
    const swap = container.querySelector('.t-icon-swap');
    expect(swap).toBeTruthy();
    expect(swap).toHaveAttribute('data-state', 'a');
    expect(swap?.querySelectorAll('.t-icon')).toHaveLength(2);
    expect(swap).toHaveClass('pointer-events-none');
  });

  it('animates the visible moon when the settings icon control is hovered', () => {
    mockAnimationDisabled = false;
    render(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToDarkMode });

    fireEvent.mouseEnter(button);

    expect(moonHandle.startAnimation).toHaveBeenCalled();
    expect(sunHandle.startAnimation).not.toHaveBeenCalled();
  });

  it('animates the visible sun when the settings icon control is hovered in dark mode', () => {
    mockAnimationDisabled = false;
    mockResolvedTheme = 'dark';
    render(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToLightMode });

    fireEvent.mouseEnter(button);

    expect(sunHandle.startAnimation).toHaveBeenCalled();
    expect(moonHandle.startAnimation).not.toHaveBeenCalled();
  });

  it('stops icon animation when the pointer leaves the control', () => {
    mockAnimationDisabled = false;
    render(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToDarkMode });

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(moonHandle.stopAnimation).toHaveBeenCalled();
    expect(sunHandle.stopAnimation).toHaveBeenCalled();
  });

  it('does not attach hover animation when motion is disabled', () => {
    mockAnimationDisabled = true;
    render(<ThemeToggle variant="icon" />);
    const button = screen.getByRole('button', { name: getMessages('en').landing.switchToDarkMode });

    fireEvent.mouseEnter(button);

    expect(moonHandle.startAnimation).not.toHaveBeenCalled();
    expect(sunHandle.startAnimation).not.toHaveBeenCalled();
  });
});

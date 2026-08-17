import React from 'react';
import { render, screen } from '@/lib/test-utils';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { getMessages } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

let mockLocale: Locale = 'en';

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
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => ({
    ref: { current: null },
    animationDisabled: true,
  }),
}));

describe('ThemeToggle', () => {
  afterEach(() => {
    mockLocale = 'en';
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
});

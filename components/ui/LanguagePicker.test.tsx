import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';

const setLocale = jest.fn();
let mockLocale: Locale = 'en';

jest.mock('@/providers/locale', () => {
  const messages: Record<string, Record<string, string>> = {
    en: { 'settings.language': 'Language' },
    ar: { 'settings.language': 'اللغة' },
    es: { 'settings.language': 'Idioma' },
    fr: { 'settings.language': 'Langue' },
    'zh-Hans': { 'settings.language': '语言' },
  };
  const t = (key: string) => messages[mockLocale][key] ?? key;
  return {
    useLocale: () => ({
      locale: mockLocale,
      setLocale,
      dir: mockLocale === 'ar' ? 'rtl' : 'ltr',
      messages: {},
      t,
    }),
    useT: () => t,
  };
});

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => ({
    ref: { current: null },
    animationDisabled: true,
  }),
}));

jest.mock('@/components/ui/icons/languages', () => ({
  LanguagesIcon: () => <span data-testid="languages-icon" />,
}));

jest.mock('@/components/ui/icons/MotionSafeIcon', () => ({
  MotionSafeIcon: ({ icon: Icon, ...props }: { icon: React.ComponentType }) => (
    <Icon {...props} />
  ),
}));

async function openPicker(user: { click: (el: HTMLElement) => Promise<void> }, name: string | RegExp) {
  await user.click(screen.getByRole('button', { name }));
  await waitFor(() => {
    expect(screen.getByRole('menu')).toHaveClass('is-open');
  });
}

describe('LanguagePicker', () => {
  beforeEach(() => {
    setLocale.mockClear();
    mockLocale = 'en';
  });

  it('uses a localized aria-label from settings.language', () => {
    mockLocale = 'ar';
    render(<LanguagePicker variant="icon" />);
    expect(screen.getByRole('button', { name: 'اللغة' })).toBeInTheDocument();
  });

  it('renders native locale names for every LOCALES entry', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    for (const code of LOCALES) {
      expect(screen.getByRole('menuitem', { name: LOCALE_LABELS[code] })).toBeInTheDocument();
    }
  });

  it('marks the selected locale with coral wash classes and a check', async () => {
    mockLocale = 'es';
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Idioma');
    const selected = screen.getByRole('menuitem', { name: LOCALE_LABELS.es });
    expect(selected.className).toMatch(/primary-light/);
    expect(selected.className).toMatch(/text-coral/);
    expect(selected.querySelector('svg')).toBeTruthy();
  });

  it('does not use bg-accent / focus:bg-accent on items', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.className).not.toMatch(/bg-accent/);
      expect(item.className).toMatch(/primary-light/);
    }
  });

  it('calls setLocale once when selecting a different locale', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    await user.click(screen.getByRole('menuitem', { name: LOCALE_LABELS.fr }));
    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith('fr');
  });

  it('opens an origin-aware t-dropdown from the top-right in LTR', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    const menu = screen.getByRole('menu', { name: 'Language' });
    expect(menu).toHaveClass('t-dropdown');
    expect(menu).toHaveAttribute('data-origin', 'top-right');
    expect(menu).toHaveAttribute('data-align', 'end');
    expect(menu.className).not.toMatch(/transition-all/);
  });

  it('opens an origin-aware t-dropdown from the top-left in RTL', async () => {
    mockLocale = 'ar';
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'اللغة');
    const menu = screen.getByRole('menu', { name: 'اللغة' });
    expect(menu).toHaveClass('t-dropdown');
    expect(menu).toHaveAttribute('data-origin', 'top-left');
  });
});

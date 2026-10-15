import React from 'react';
import { render, screen, waitFor } from '@/tests/helpers';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
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

async function openPicker(user: { click: (el: HTMLElement) => Promise<void> }, name: string | RegExp) {
  await user.click(screen.getByRole('button', { name }));
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
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
      expect(screen.getByRole('option', { name: LOCALE_LABELS[code] })).toBeInTheDocument();
    }
  });

  it('marks the selected locale with coral styling', async () => {
    mockLocale = 'es';
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Idioma');
    const selected = screen.getByRole('option', { name: LOCALE_LABELS.es });
    expect(selected.className).toMatch(/text-coral/);
  });

  it('calls setLocale once when selecting a different locale', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    await user.click(screen.getByRole('option', { name: LOCALE_LABELS.fr }));
    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith('fr');
  });

  it('uses AnimatedDropdown listbox semantics instead of a custom menu', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await openPicker(user, 'Language');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Language' })).toBeInTheDocument();
  });

  it('shows the locale label on the default variant trigger', () => {
    mockLocale = 'fr';
    render(<LanguagePicker variant="default" />);
    expect(screen.getByRole('button', { name: /langue/i })).toHaveTextContent('Français');
  });
});

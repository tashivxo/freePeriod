import React from 'react';
import { render, screen, within } from '@/lib/test-utils';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n';

const setLocale = jest.fn();
let mockLocale: 'en' | 'ar' | 'es' | 'fr' = 'en';

jest.mock('@/providers/locale', () => {
  const messages: Record<string, Record<string, string>> = {
    en: { 'settings.language': 'Language' },
    ar: { 'settings.language': 'اللغة' },
    es: { 'settings.language': 'Idioma' },
    fr: { 'settings.language': 'Langue' },
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
    await user.click(screen.getByRole('button', { name: 'Language' }));
    for (const code of LOCALES) {
      expect(screen.getByRole('menuitem', { name: LOCALE_LABELS[code] })).toBeInTheDocument();
    }
  });

  it('marks the selected locale with coral wash classes and a check', async () => {
    mockLocale = 'es';
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Idioma' }));
    const selected = screen.getByRole('menuitem', { name: LOCALE_LABELS.es });
    expect(selected.className).toMatch(/primary-light/);
    expect(selected.className).toMatch(/text-coral/);
    expect(selected.querySelector('svg')).toBeTruthy();
  });

  it('does not use bg-accent / focus:bg-accent on items', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.className).not.toMatch(/bg-accent/);
      expect(item.className).toMatch(/primary-light/);
    }
  });

  it('calls setLocale once when selecting a different locale', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(screen.getByRole('menuitem', { name: LOCALE_LABELS.fr }));
    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith('fr');
  });

  it('overrides content motion to duration-150 and zoom 0.97', async () => {
    const { user } = render(<LanguagePicker variant="icon" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    const content = document.querySelector('[data-slot="dropdown-menu-content"]');
    expect(content).toBeTruthy();
    expect(content!.className).toMatch(/duration-150/);
    expect(content!.className).toMatch(/zoom-in-\[0\.97\]/);
    expect(content!.className).toMatch(/zoom-out-\[0\.97\]/);
    expect(content!.className).not.toMatch(/duration-100/);
    expect(content!.className).not.toMatch(/zoom-in-95/);
    expect(content!.className).not.toMatch(/zoom-out-95/);
  });
});

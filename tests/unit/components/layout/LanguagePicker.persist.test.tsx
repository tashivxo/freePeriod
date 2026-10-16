import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { SettingsClient } from '@/app/(app)/settings/SettingsClient';
import { LocaleProvider } from '@/providers/locale';
import { getMessages } from '@/lib/i18n';
import type { User } from '@/types';

const mockGetUser = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => mockEq(...eqArgs) };
      },
    })),
  })),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: false, setZenMode: jest.fn() }),
}));

jest.mock('@/providers/color-bends-atmosphere', () => ({
  useColorBendsAtmosphere: () => ({
    atmosphere: null,
    setAtmosphere: jest.fn(),
    resolvedAtmosphere: 'rainbow',
    setProfileSignals: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => ({
    ref: { current: null },
    animationDisabled: true,
  }),
}));

const baseUser: User = {
  id: 'user-123',
  email: 'teacher@example.com',
  name: 'Ada Lovelace',
  default_subject: null,
  default_grade: null,
  default_curriculum: null,
  country: null,
  plan: 'free',
  is_admin: false,
  generation_count: 5,
  generation_count_reset_at: null,
  onboarding_complete: true,
  deletion_scheduled_at: null,
  preferred_locale: 'en',
  created_at: '2024-01-01T00:00:00Z',
};

function NavbarAndSettings({ showSettings }: { showSettings: boolean }) {
  return (
    <LocaleProvider>
      <LanguagePicker variant="icon" />
      {showSettings ? (
        <SettingsClient
          user={baseUser}
          email={baseUser.email}
          planLabel="Free"
        />
      ) : null}
    </LocaleProvider>
  );
}

async function chooseArabic(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: getMessages('en').settings.language }));
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
  await user.click(screen.getByRole('option', { name: 'العربية' }));
}

describe('navbar LanguagePicker locale persist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockEq.mockResolvedValue({ error: null });
  });

  it('persists users.preferred_locale with the chosen locale', async () => {
    const user = userEvent.setup({ delay: null });
    render(<NavbarAndSettings showSettings={false} />);

    await chooseArabic(user);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ preferred_locale: 'ar' });
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('surfaces a preferred_locale save error instead of swallowing it', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockEq.mockResolvedValue({ error: { message: 'permission denied' } });
    const user = userEvent.setup({ delay: null });
    render(<NavbarAndSettings showSettings={false} />);

    await chooseArabic(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to save settings|فشل حفظ الإعدادات/i);
    expect(mockUpdate).toHaveBeenCalledWith({ preferred_locale: 'ar' });
    consoleError.mockRestore();
  });

  it('switches RTL and Arabic immediately and Settings keeps that locale while save is in flight', async () => {
    mockEq.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup({ delay: null });

    function Harness() {
      const [showSettings, setShowSettings] = useState(false);
      return (
        <>
          <NavbarAndSettings showSettings={showSettings} />
          <button type="button" onClick={() => setShowSettings(true)}>
            Open settings
          </button>
        </>
      );
    }

    render(<Harness />);
    await chooseArabic(user);

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: 'اللغة' })).toBeInTheDocument();
    expect(localStorage.getItem('fp-locale')).toBe('ar');

    await user.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getAllByRole('button', { name: 'اللغة' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('الإعدادات')).toBeInTheDocument();

    const settingsTrigger = document.getElementById('preferred-locale');
    expect(settingsTrigger).toHaveTextContent('العربية');
    expect(mockUpdate).toHaveBeenCalledWith({ preferred_locale: 'ar' });
    expect(mockUpdate).not.toHaveBeenCalledWith({ preferred_locale: 'en' });
  });
});

import React from 'react';
import { render, screen } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import { getMessages } from '@/lib/i18n';
import { SettingsClient } from '@/app/(app)/settings/SettingsClient';
import type { User } from '@/types';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
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
  default_grade: '4',
  default_curriculum: null,
  country: null,
  plan: 'free',
  is_admin: false,
  generation_count: 5,
  generation_count_reset_at: null,
  onboarding_complete: true,
  deletion_scheduled_at: null,
  preferred_locale: 'ar',
  created_at: '2024-01-01T00:00:00Z',
};

describe('SettingsClient leftover English in Arabic', () => {
  beforeEach(() => {
    document.title = '';
    localStorage.setItem('fp-locale', 'ar');
    document.cookie = 'fp-locale=ar; path=/';
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    localStorage.clear();
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('sets the Arabic browser document title instead of leftover English', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <SettingsClient
          user={baseUser}
          email={baseUser.email}
          usagePlan="free"
          generationCount={0}
          generationLimit={3}
        />
      </LocaleProvider>,
    );

    expect(document.title).toBe('الإعدادات | FreePeriod');
    expect(document.title).not.toBe('Settings | FreePeriod');
  });

  it('shows the localized Free plan name instead of leftover English', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <SettingsClient
          user={baseUser}
          email={baseUser.email}
          usagePlan="free"
          generationCount={0}
          generationLimit={3}
        />
      </LocaleProvider>,
    );

    expect(screen.queryByText('Free')).not.toBeInTheDocument();
    expect(screen.getByText('مجاني')).toBeInTheDocument();
  });

  it('shows a bidi-safe Arabic Grade 4 instead of leftover English', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="ar">
        <SettingsClient
          user={baseUser}
          email={baseUser.email}
          usagePlan="free"
          generationCount={0}
          generationLimit={3}
        />
      </LocaleProvider>,
    );

    const grade = screen.getByLabelText(getMessages('ar').settings.defaultGrade);
    expect(grade.textContent).not.toContain('Grade 4');
    expect(grade.textContent).toMatch(/الصف/);
    expect(grade.textContent).toContain('\u2068');
    expect(grade.textContent).toContain('4');
    expect(grade.textContent).toContain('\u2069');

    await user.click(grade);
    expect(screen.queryByRole('option', { name: 'Grade 4' })).not.toBeInTheDocument();
    const gradeFour = screen.getByRole('option', {
      name: (accessibleName) =>
        accessibleName.includes('الصف') &&
        accessibleName.includes('4') &&
        accessibleName.includes('\u2068'),
    });
    expect(gradeFour).toBeInTheDocument();
  });
});

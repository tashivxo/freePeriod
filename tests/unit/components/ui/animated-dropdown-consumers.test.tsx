import React from 'react';
import { render, screen } from '@/tests/helpers';
import { SettingsClient } from '@/app/(app)/settings/SettingsClient';
import { OnboardingPage } from '@/app/(auth)/onboarding/OnboardingPage';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { GenerateForm } from '@/features/generate/components/GenerateForm';
import { GenerationModePicker } from '@/features/generate/components/GenerationModePicker';
import { HistoryClient } from '@/features/history/components/HistoryClient';
import type { User } from '@/types';

const historyLessons = [
  {
    id: '1',
    title: 'A',
    subject: 'Mathematics',
    grade: 'Grade 5',
    duration_minutes: 45,
    created_at: '2026-01-01',
  },
  {
    id: '2',
    title: 'B',
    subject: 'Science',
    grade: 'Grade 6',
    duration_minutes: 45,
    created_at: '2026-01-02',
  },
];

function createQueryMock() {
  const chain = {
    select: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    ilike: jest.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.ilike.mockResolvedValue({ data: historyLessons });
  chain.order.mockResolvedValue({ data: historyLessons });
  return chain;
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: jest.fn(() => ({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      ...createQueryMock(),
    })),
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('animejs', () => ({
  __esModule: true,
  default: jest.fn(() => ({ finished: Promise.resolve() })),
  animate: jest.fn(() => ({ finished: Promise.resolve() })),
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

jest.mock('@/providers/locale', () => {
  const t = (key: string) => key;
  return {
    useLocale: () => ({ locale: 'en', setLocale: jest.fn(), dir: 'ltr', messages: {}, t }),
    useT: () => t,
  };
});

jest.mock('@/hooks/useMotionSafeIconRef', () => ({
  useMotionSafeIconRef: () => ({ ref: { current: null }, animationDisabled: true }),
}));

jest.mock('@/components/ui/icons/languages', () => ({
  LanguagesIcon: () => <span data-testid="languages-icon" />,
}));

const baseUser: User = {
  id: 'user-1',
  email: 'teacher@example.com',
  default_subject: null,
  default_grade: null,
  default_curriculum: null,
  country: null,
  preferred_locale: 'en',
  plan: 'free',
  created_at: '',
  updated_at: '',
};

function expectNoNativeSelects() {
  expect(document.querySelector('select')).toBeNull();
}

describe('AnimatedDropdown consumers', () => {
  it('SettingsClient uses listbox triggers instead of native selects', () => {
    render(
      <SettingsClient user={baseUser} email="teacher@example.com" planLabel="Free" />,
    );

    expectNoNativeSelects();
    expect(screen.getByLabelText(/settings.language/i)).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByLabelText(/settings.country/i)).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('GenerateForm uses listbox triggers for field dropdowns', () => {
    render(<GenerateForm onSubmit={jest.fn()} />);
    expectNoNativeSelects();
    expect(screen.getAllByRole('button', { expanded: false }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[aria-haspopup="listbox"]').length).toBeGreaterThanOrEqual(4);
  });

  it('GenerationModePicker uses AnimatedDropdown listbox semantics', () => {
    render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="fast"
        onChange={jest.fn()}
        qualityUnlocked={false}
      />,
    );
    expectNoNativeSelects();
    expect(screen.getByRole('button', { name: /generation mode/i })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
  });

  it('HistoryClient filter uses a listbox trigger when subjects exist', async () => {
    render(<HistoryClient />);
    expectNoNativeSelects();
    await screen.findByRole('button', { name: /all subjects/i });
    expect(screen.getByRole('button', { name: /all subjects/i })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
  });

  it('OnboardingPage country step uses a listbox trigger', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('radio', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    expectNoNativeSelects();
    expect(screen.getByLabelText(/where do you teach/i)).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('LanguagePicker uses a listbox trigger', () => {
    render(<LanguagePicker variant="icon" />);
    expectNoNativeSelects();
    expect(screen.getByRole('button', { name: /settings.language/i })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
  });
});

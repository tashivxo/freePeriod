import { render, screen, waitFor } from '@/tests/helpers';
import { stripBidiIsolates, visibleName } from '@/tests/helpers/bidi';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null });
const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    }),
  }),
});
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      update: mockUpdate,
      insert: mockInsert,
    })),
  })),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock anime.js (avoid DOM animation issues in test)
jest.mock('animejs', () => ({
  __esModule: true,
  default: jest.fn(() => ({ finished: Promise.resolve() })),
  animate: jest.fn(() => ({ finished: Promise.resolve() })),
}));

import { OnboardingPage } from '@/app/(auth)/onboarding/OnboardingPage';
import { LocaleProvider } from '@/providers/locale';

const SUBJECTS = [
  'Mathematics',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
];

type OnboardingUser = ReturnType<typeof userEvent.setup>;

function countryTrigger() {
  return screen.getByLabelText(/where do you teach/i);
}

function countrySelect() {
  return screen.getByRole('button', { name: /where do you teach/i });
}

async function chooseCountryOption(user: OnboardingUser, code = 'AE') {
  const labelByCode: Record<string, string> = {
    AE: 'United Arab Emirates',
    GB: 'United Kingdom',
  };
  await user.click(countryTrigger());
  await user.click(
    screen.getAllByRole('option', { name: labelByCode[code] ?? code })[0]!,
  );
}

async function chooseSubject(user: OnboardingUser) {
  await user.click(screen.getByRole('radio', { name: /mathematics/i }));
  await user.click(screen.getByRole('button', { name: /next/i }));
}

async function chooseGrade(user: OnboardingUser) {
  await waitFor(() => {
    expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
  });
  await user.click(screen.getByLabelText(/grade level/i));
  await user.click(screen.getByRole('option', { name: visibleName('Grade 9') }));
  await user.click(screen.getByRole('button', { name: /next/i }));
}

async function chooseCountry(user: OnboardingUser, code = 'AE') {
  await waitFor(() => {
    expect(countryTrigger()).toBeInTheDocument();
  });
  await chooseCountryOption(user, code);
  await user.click(screen.getByRole('button', { name: /next/i }));
}

async function reachCurriculum(user: OnboardingUser) {
  await chooseSubject(user);
  await chooseGrade(user);
  await chooseCountry(user);
  await waitFor(() => {
    expect(screen.getByLabelText(/curriculum/i)).toBeInTheDocument();
  });
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    // Restore return values cleared by clearAllMocks
    mockMaybeSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    });
    mockInsert.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders step 1 heading', () => {
    render(<OnboardingPage />);
    expect(
      screen.getByRole('heading', { name: /what do you teach/i }),
    ).toBeInTheDocument();
  });

  it('renders subject chips', () => {
    render(<OnboardingPage />);
    for (const subject of SUBJECTS) {
      expect(
        screen.getByRole('radio', { name: new RegExp(subject, 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('allows selecting a single subject chip', async () => {
    const { user } = render(<OnboardingPage />);
    const mathChip = screen.getByRole('radio', { name: /mathematics/i });
    const historyChip = screen.getByRole('radio', { name: /history/i });

    await user.click(mathChip);
    await user.click(historyChip);

    expect(mathChip).toHaveAttribute('aria-checked', 'false');
    expect(historyChip).toHaveAttribute('aria-checked', 'true');
  });

  it('allows deselecting a subject chip', async () => {
    const { user } = render(<OnboardingPage />);
    const mathChip = screen.getByRole('radio', { name: /mathematics/i });

    await user.click(mathChip);
    expect(mathChip).toHaveAttribute('aria-checked', 'true');

    await user.click(mathChip);
    expect(mathChip).toHaveAttribute('aria-checked', 'false');
  });

  it('clears the chip when typing a custom subject', async () => {
    const { user } = render(<OnboardingPage />);
    const mathChip = screen.getByRole('radio', { name: /mathematics/i });

    await user.click(mathChip);
    expect(mathChip).toHaveAttribute('aria-checked', 'true');

    await user.type(screen.getByPlaceholderText(/other subject/i), 'Drama');
    expect(mathChip).toHaveAttribute('aria-checked', 'false');
  });

  it('renders custom subject input', () => {
    render(<OnboardingPage />);
    expect(screen.getByPlaceholderText(/other subject/i)).toBeInTheDocument();
  });

  it('shows next button and navigates to step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /what grade do you teach/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders grade dropdown on step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
  });

  it('navigates from step 2 to the country step', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /where do you teach/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('progressbar', { name: /step 3 of 4/i })).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
  });

  it('renders a country AnimatedDropdown named by the heading', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    const trigger = await screen.findByLabelText(/where do you teach/i);
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByText(/you can change this in settings/i)).toBeInTheDocument();
    expect(document.querySelector('select')).toBeNull();

    await user.click(trigger);
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('All countries')).toBeInTheDocument();
    expect(
      screen.getAllByRole('option', { name: 'United Arab Emirates' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders country AnimatedDropdown with Common and All countries groups', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    const trigger = await screen.findByRole('button', { name: /where do you teach/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('id', 'country-select');
    expect(document.querySelector('select#country-select')).toBeNull();
    expect(screen.getByText(/you can change this in settings/i)).toBeInTheDocument();

    await user.click(trigger);
    const commonHeader = screen.getByText('Common');
    const allHeader = screen.getByText('All countries');
    expect(commonHeader.className).toMatch(/italic/);
    expect(commonHeader.className).toMatch(/text-coral/);
    expect(allHeader.className).toMatch(/italic/);
    expect(allHeader.className).toMatch(/text-coral/);
    expect(screen.getAllByRole('option', { name: 'United Arab Emirates' }).length).toBeGreaterThan(
      0,
    );
    for (const countryName of [
      'Saudi Arabia',
      'United Kingdom',
      'United States',
      'India',
      'Australia',
      'South Africa',
    ]) {
      expect(screen.getAllByRole('option', { name: countryName }).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole('option', { name: 'Afghanistan' })).toBeInTheDocument();
  });

  it('opens Country from the keyboard and Escape in search returns focus to the trigger', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    const trigger = await screen.findByLabelText(/where do you teach/i);
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const search = screen.getByRole('searchbox');
    expect(search).toHaveFocus();
    expect(search.getAttribute('aria-activedescendant')).toBeTruthy();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('closes Grade on Tab and moves focus to Back', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    const grade = await screen.findByLabelText(/grade level/i);
    await user.click(grade);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.tab();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /back/i })).toHaveFocus();
  });

  it('selects a Grade option on click and unmounts the list', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    const grade = await screen.findByLabelText(/grade level/i);
    await user.click(grade);
    await user.click(screen.getByRole('option', { name: visibleName('Grade 9') }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(stripBidiIsolates(grade.textContent ?? '')).toContain('Grade 9');
  });

  it('closes Country on Tab from search and keeps it open when clicking the search box', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    const trigger = await screen.findByLabelText(/where do you teach/i);
    await user.click(trigger);
    const search = screen.getByRole('searchbox');
    expect(search).toHaveFocus();

    await user.click(search);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(search).toHaveFocus();

    fireEvent.keyDown(search, { key: 'Tab' });
    expect(trigger).toHaveFocus();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    await user.tab();
    expect(screen.getByRole('button', { name: /back/i })).toHaveFocus();
  });

  it('selects a Country option on click and unmounts the list', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    const trigger = await screen.findByLabelText(/where do you teach/i);
    await user.click(trigger);
    await user.click(screen.getAllByRole('option', { name: 'United Arab Emirates' })[0]!);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveTextContent('United Arab Emirates');
  });

  it('disables Next on the country step until a country is chosen', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);
    await chooseGrade(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    await chooseCountryOption(user, 'GB');
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  it('renders curriculum AnimatedDropdown on step 4', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    expect(screen.getByRole('progressbar', { name: /step 4 of 4/i })).toHaveAttribute(
      'aria-valuemax',
      '4',
    );

    const curriculumTrigger = screen.getByLabelText(/curriculum/i);
    expect(curriculumTrigger).toHaveAttribute('aria-haspopup', 'listbox');

    await user.click(curriculumTrigger);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'UAE MOE' })).toBeInTheDocument();
    });
  });

  it('allows going back from step 2 to step 1', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /what do you teach/i }),
      ).toBeInTheDocument();
    });
  });

  it('goes back from curriculum to the country step', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /where do you teach/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: /what curriculum/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /select your curriculum/i }),
    ).not.toBeInTheDocument();
    expect(countryTrigger()).toHaveTextContent('United Arab Emirates');
    expect(countrySelect()).toHaveTextContent('United Arab Emirates');
  });

  it('step 4 heading and curriculum dropdown use Select your curriculum copy', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    expect(
      screen.getByRole('heading', { name: 'Select your curriculum' }),
    ).toBeInTheDocument();

    const curriculumTrigger = screen.getByLabelText(/curriculum/i);
    expect(curriculumTrigger).toHaveTextContent(/select your curriculum/i);

    await user.click(curriculumTrigger);
    expect(screen.getByRole('listbox', { name: /select your curriculum/i })).toBeInTheDocument();
  });

  it('submits onboarding data and redirects to dashboard', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          default_subject: 'Mathematics',
          default_grade: '9',
          default_curriculum: 'IB',
          country: 'AE',
          onboarding_complete: true,
        }),
      );
      const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('id');
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('is_admin');
      expect(payload).not.toHaveProperty('plan');
      expect(payload).not.toHaveProperty('generation_count');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('inserts a profile without plan, quota, or deletion fields when no row exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          default_subject: 'Mathematics',
          default_grade: '9',
          default_curriculum: 'IB',
          country: 'AE',
          onboarding_complete: true,
        }),
      );
      const payload = mockInsert.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('plan');
      expect(payload).not.toHaveProperty('is_admin');
      expect(payload).not.toHaveProperty('generation_count');
      expect(payload).not.toHaveProperty('generation_count_reset_at');
      expect(payload).not.toHaveProperty('deletion_scheduled_at');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders logo and supporting line above the card', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('FreePeriod')).toBeInTheDocument();
    expect(screen.getByText(/set up your teaching profile/i)).toBeInTheDocument();
  });

  it('renders a 4-segment progress indicator for step 1', () => {
    render(<OnboardingPage />);
    const progress = screen.getByRole('progressbar', { name: /step 1 of 4/i });
    expect(progress).toHaveAttribute('aria-valuenow', '1');
    expect(progress).toHaveAttribute('aria-valuemax', '4');
  });

  it('updates progress indicator when advancing to step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await chooseSubject(user);

    await waitFor(() => {
      expect(screen.getByRole('progressbar', { name: /step 2 of 4/i })).toHaveAttribute(
        'aria-valuenow',
        '2',
      );
    });
  });

  it('selecting Custom curriculum reveals text input on step 4', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'Custom' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/enter curriculum/i)).toBeInTheDocument();
    });
  });

  it('shows finish errors inside the card above actions', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Database error');
    expect(alert.compareDocumentPosition(screen.getByRole('button', { name: /finish/i }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('shows saving then redirecting feedback on successful finish', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /redirecting/i })).toBeInTheDocument();
      expect(screen.getByText(/redirecting to your dashboard/i)).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows dashboard fallback link if redirect stalls', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<OnboardingPage />);
    await reachCurriculum(user);

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    jest.useRealTimers();
  });

  it('translates onboarding headings and country group labels in Arabic', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="ar">
        <OnboardingPage />
      </LocaleProvider>,
    );

    expect(screen.getByRole('heading', { name: 'ماذا تُدرّس؟' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('مادة أخرى...')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: 'التالي' }));

    expect(await screen.findByRole('heading', { name: 'أي صف تُدرّس؟' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('المستوى الدراسي'));
    await user.click(screen.getByRole('option', { name: visibleName('الصف 9') }));
    await user.click(screen.getByRole('button', { name: 'التالي' }));

    expect(await screen.findByRole('heading', { name: 'أين تُدرّس؟' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('أين تُدرّس؟'));
    expect(screen.getByText('شائع')).toBeInTheDocument();
    expect(screen.getByText('كل البلدان')).toBeInTheDocument();
    await user.click(screen.getAllByRole('option', { name: 'United Arab Emirates' })[0]!);
    await user.click(screen.getByRole('button', { name: 'التالي' }));

    expect(await screen.findByRole('heading', { name: 'اختر منهجك' })).toBeInTheDocument();
  });

  it('Finish button is disabled until a curriculum is selected on step 4', async () => {
    const { user } = render(<OnboardingPage />);
    await reachCurriculum(user);

    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled();

    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'IB' }));

    expect(screen.getByRole('button', { name: /finish/i })).not.toBeDisabled();
  });
});

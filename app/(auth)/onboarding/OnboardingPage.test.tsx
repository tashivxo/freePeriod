import { render, screen, waitFor } from '@/lib/test-utils';

// Mock the Supabase client module
const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ error: null }),
});
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      update: mockUpdate,
      upsert: mockUpsert,
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

import { OnboardingPage } from './OnboardingPage';

const SUBJECTS = [
  'Mathematics',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
];

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore return values cleared by clearAllMocks
    mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mockUpsert.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
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
        screen.getByRole('button', { name: new RegExp(subject, 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('allows selecting multiple subject chips', async () => {
    const { user } = render(<OnboardingPage />);
    const mathChip = screen.getByRole('button', { name: /mathematics/i });
    const historyChip = screen.getByRole('button', { name: /history/i });

    await user.click(mathChip);
    await user.click(historyChip);

    expect(mathChip).toHaveAttribute('aria-pressed', 'true');
    expect(historyChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows deselecting a subject chip', async () => {
    const { user } = render(<OnboardingPage />);
    const mathChip = screen.getByRole('button', { name: /mathematics/i });

    await user.click(mathChip);
    expect(mathChip).toHaveAttribute('aria-pressed', 'true');

    await user.click(mathChip);
    expect(mathChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders custom subject input', () => {
    render(<OnboardingPage />);
    expect(screen.getByPlaceholderText(/other subject/i)).toBeInTheDocument();
  });

  it('shows next button and navigates to step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /what grade level/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders grade dropdown on step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
  });

  it('navigates from step 2 to step 3', async () => {
    const { user } = render(<OnboardingPage />);
    // Step 1: select subject
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: select grade
    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /what curriculum/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders curriculum AnimatedDropdown on step 3', async () => {
    const { user } = render(<OnboardingPage />);
    // Navigate to step 3
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/curriculum/i)).toBeInTheDocument();
    });

    // Step 3 uses AnimatedDropdown (not pill buttons)
    const curriculumTrigger = screen.getByLabelText(/curriculum/i);
    expect(curriculumTrigger).toHaveAttribute('aria-haspopup', 'listbox');

    // Open dropdown and verify preset options including UAE MOE
    await user.click(curriculumTrigger);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'UAE MOE' })).toBeInTheDocument();
    });
  });

  it('allows going back from step 2 to step 1', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

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

  it('submits onboarding data and redirects to dashboard', async () => {
    const { user } = render(<OnboardingPage />);

    // Step 1: select subjects
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: select grade
    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: select curriculum from dropdown and finish
    await waitFor(() => {
      expect(screen.getByLabelText(/curriculum/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'IB' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders step indicators', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('selecting Custom curriculum reveals text input on step 3', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument());
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByLabelText(/curriculum/i)).toBeInTheDocument());
    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'Custom' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/enter curriculum/i)).toBeInTheDocument();
    });
  });

  it('Finish button is disabled until a curriculum is selected on step 3', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /mathematics/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument());
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled();

    // Select a curriculum
    await user.click(screen.getByLabelText(/curriculum/i));
    await waitFor(() => expect(screen.getByRole('option', { name: 'IB' })).toBeInTheDocument());
    await user.click(screen.getByRole('option', { name: 'IB' }));

    expect(screen.getByRole('button', { name: /finish/i })).not.toBeDisabled();
  });
});

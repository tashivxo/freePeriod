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
  'Maths',
  'English',
  'Science',
  'History',
  'Geography',
  'Art',
  'Music',
  'PE',
  'ICT',
  'Languages',
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
    const mathsChip = screen.getByRole('button', { name: /maths/i });
    const scienceChip = screen.getByRole('button', { name: /science/i });

    await user.click(mathsChip);
    await user.click(scienceChip);

    expect(mathsChip).toHaveAttribute('aria-pressed', 'true');
    expect(scienceChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows deselecting a subject chip', async () => {
    const { user } = render(<OnboardingPage />);
    const mathsChip = screen.getByRole('button', { name: /maths/i });

    await user.click(mathsChip);
    expect(mathsChip).toHaveAttribute('aria-pressed', 'true');

    await user.click(mathsChip);
    expect(mathsChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders custom subject input', () => {
    render(<OnboardingPage />);
    expect(screen.getByPlaceholderText(/other subject/i)).toBeInTheDocument();
  });

  it('shows next button and navigates to step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /maths/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /what grade level/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders grade dropdown on step 2', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /maths/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
  });

  it('navigates from step 2 to step 3', async () => {
    const { user } = render(<OnboardingPage />);
    // Step 1: select subject
    await user.click(screen.getByRole('button', { name: /maths/i }));
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

  it('renders curriculum suggestions on step 3', async () => {
    const { user } = render(<OnboardingPage />);
    // Navigate to step 3
    await user.click(screen.getByRole('button', { name: /maths/i }));
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

    // Check suggestion buttons exist
    for (const curriculum of ['CAPS', 'UK National', 'IB', 'Common Core', 'Australian']) {
      expect(
        screen.getByRole('button', { name: new RegExp(curriculum, 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('allows going back from step 2 to step 1', async () => {
    const { user } = render(<OnboardingPage />);
    await user.click(screen.getByRole('button', { name: /maths/i }));
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
    await user.click(screen.getByRole('button', { name: /maths/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: select grade
    await waitFor(() => {
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/grade level/i));
    await user.click(screen.getByRole('option', { name: 'Grade 9' }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: enter curriculum and finish
    await waitFor(() => {
      expect(screen.getByLabelText(/curriculum/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/curriculum/i), 'CAPS');
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
});

import { render, screen } from '@/lib/test-utils';
import { UpgradePrompt } from './UpgradePrompt';
import { useZenMode } from '@/providers/zen-mode';

const mockPush = jest.fn();
const mockOnDismiss = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: jest.fn(() => ({ zenMode: false, setZenMode: jest.fn() })),
}));

const mockedUseZenMode = jest.mocked(useZenMode);

describe('UpgradePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseZenMode.mockReturnValue({ zenMode: false, setZenMode: jest.fn() });
  });

  it('renders upgrade heading with design-system typography', () => {
    render(<UpgradePrompt open onDismiss={mockOnDismiss} />);

    const heading = screen.getByRole('heading', { name: /upgrade to pro/i });
    expect(heading).toHaveClass('font-display');
    expect(heading).toHaveClass('text-text-primary');
    expect(heading).not.toHaveClass('font-nunito');
  });

  it('uses tokenized colors instead of hardcoded hex classes', () => {
    render(<UpgradePrompt open onDismiss={mockOnDismiss} />);

    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    expect(dismiss.className).toMatch(/text-text-secondary/);
    expect(dismiss.className).not.toMatch(/#6B7280|#1A1A2E|#FF8BB0/);
  });

  it('navigates to billing settings on upgrade', async () => {
    const { user } = render(<UpgradePrompt open onDismiss={mockOnDismiss} />);

    await user.click(screen.getByRole('button', { name: /^upgrade to pro$/i }));

    expect(mockOnDismiss).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings#billing');
  });
});

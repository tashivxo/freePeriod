import { render, screen, waitFor } from '@/lib/test-utils';
import { useTheme } from '@/providers/theme';
import { PricingClient } from './PricingClient';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/providers/theme');
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock('@/components/ui/magic-card', () => ({
  MagicCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="magic-card" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/Logo', () => ({
  Logo: () => <div>FreePeriod</div>,
}));

jest.mock('@/components/legal/MarketingFooter', () => ({
  MarketingFooter: () => <footer>Marketing footer</footer>,
}));

const mockGetSession = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

const mockedUseTheme = jest.mocked(useTheme);

describe('PricingClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    global.fetch = jest.fn();
  });

  it('renders billing period as a tablist with monthly and annual tabs', () => {
    render(<PricingClient />);

    expect(screen.getByRole('tablist', { name: 'Billing period' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Annual/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches billing period tabs and updates aria-selected', async () => {
    const { user } = render(<PricingClient />);

    await user.click(screen.getByRole('tab', { name: /Annual/i }));

    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /Annual/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows paid-plan trial copy without implying Free is a trial', () => {
    render(<PricingClient />);

    expect(
      screen.getByText('Paid plans include a 30-day free trial. Cancel anytime. No hidden fees.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/all plans include a 30-day free trial/i)).not.toBeInTheDocument();
  });

  it('applies tabular-nums to paid plan prices', () => {
    render(<PricingClient />);

    const proPrice = screen.getByText('$9');
    expect(proPrice).toHaveClass('tabular-nums');
  });

  it('shows inline checkout error when checkout fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Checkout service unavailable' }),
    });

    const { user } = render(<PricingClient />);
    await user.click(screen.getByRole('button', { name: 'Start Pro' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Checkout service unavailable');
    });
  });

  it('sets aria-busy on checkout button while loading', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { user } = render(<PricingClient />);
    const startPro = screen.getByRole('button', { name: 'Start Pro' });
    await user.click(startPro);

    await waitFor(() => {
      expect(startPro).toHaveAttribute('aria-busy', 'true');
    });

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.example.com' }),
    });
  });

  it('redirects unauthenticated users to sign-up', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { user } = render(<PricingClient />);
    await user.click(screen.getByRole('button', { name: 'Start Pro' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sign-up?plan=pro');
    });
  });
});

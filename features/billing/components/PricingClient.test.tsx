import { render, screen, waitFor } from '@/lib/test-utils';
import { getMessages, isRtl, type Locale } from '@/lib/i18n';
import { useTheme } from '@/providers/theme';
import { LocaleProvider, useLocale } from '@/providers/locale';
import { PricingClient } from './PricingClient';

const en = getMessages('en');

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/providers/theme');
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock('@/components/ui/effects/magic-card', () => ({
  MagicCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="magic-card" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/branding/Logo', () => ({
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

function renderPricing(locale: Locale = 'en') {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';

  return render(
    <LocaleProvider>
      <PricingClient />
    </LocaleProvider>,
  );
}

function LocaleControls() {
  const { setLocale } = useLocale();
  return <button onClick={() => setLocale('ar')}>Set Arabic</button>;
}

describe('PricingClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
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
    renderPricing();

    expect(screen.getByRole('tablist', { name: en.pricing.billingPeriodAria })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: en.pricing.monthly })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: new RegExp(en.pricing.annual, 'i') })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('switches billing period tabs and updates aria-selected', async () => {
    const { user } = renderPricing();

    await user.click(screen.getByRole('tab', { name: new RegExp(en.pricing.annual, 'i') }));

    expect(screen.getByRole('tab', { name: en.pricing.monthly })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByRole('tab', { name: new RegExp(en.pricing.annual, 'i') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('shows paid-plan trial copy without implying Free is a trial', () => {
    renderPricing();

    expect(screen.getByText(en.pricing.trustFooter)).toBeInTheDocument();
    expect(screen.queryByText(/all plans include a 30-day free trial/i)).not.toBeInTheDocument();
  });

  it('applies tabular-nums to paid plan prices', () => {
    renderPricing();

    const proPrice = screen.getByText('$9');
    expect(proPrice).toHaveClass('tabular-nums');
  });

  it('shows inline checkout error when checkout fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Checkout service unavailable' }),
    });

    const { user } = renderPricing();
    await user.click(screen.getByRole('button', { name: en.pricing.plans.pro.cta }));

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

    const { user } = renderPricing();
    const startPro = screen.getByRole('button', { name: en.pricing.plans.pro.cta });
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

    const { user } = renderPricing();
    await user.click(screen.getByRole('button', { name: en.pricing.plans.pro.cta }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sign-up?plan=pro');
    });
  });

  it('shows Fast mode on Free and Fast and Quality modes on Pro', () => {
    renderPricing();

    expect(screen.getByText(en.pricing.plans.free.feature2)).toBeInTheDocument();
    expect(screen.getByText(en.pricing.plans.pro.feature3)).toBeInTheDocument();
    expect(screen.getByText(en.pricing.plans.pro.description)).toBeInTheDocument();
  });

  it('renders the French pricing heading and CTAs', () => {
    const fr = getMessages('fr');
    renderPricing('fr');

    expect(screen.getByRole('heading', { level: 1, name: fr.pricing.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fr.pricing.plans.free.cta })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: fr.pricing.plans.pro.cta })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: fr.pricing.plans.pro_plus.cta })).toBeInTheDocument();
  });

  it('renders Arabic heading and sets rtl on the document', () => {
    const ar = getMessages('ar');
    renderPricing('ar');

    expect(screen.getByRole('heading', { level: 1, name: ar.pricing.title })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('applies rtl document direction after selecting Arabic', async () => {
    const { user } = render(
      <LocaleProvider>
        <LocaleControls />
        <PricingClient />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set Arabic' }));

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});

import { render, screen, waitFor } from '@/tests/helpers';
import { PlanUsageSection } from '@/features/billing/components/PlanUsageSection';

const LABELS: Record<string, string> = {
  'settings.planFree': 'Free',
  'settings.planPro': 'Pro',
  'settings.planProPlus': 'Pro+',
  'settings.planUsage.title': 'Plan & Usage',
  'settings.planUsage.currentPlanEyebrow': 'Current plan',
  'settings.planUsage.upgradeAvailableEyebrow': 'Upgrade available',
  'settings.planUsage.adjustPlan': 'Adjust plan',
  'settings.planUsage.comparePlans': 'Compare plans',
  'settings.planUsage.upgradeNow': 'Upgrade now',
  'settings.planUsage.reasonRecommended': 'Pro is recommended for weekly planning.',
  'settings.planUsage.reasonNearLimit':
    "You've used most of this month's lesson plans. Upgrade to keep generating.",
  'settings.planUsage.reasonProPlus': 'Unlimited lesson plans, no monthly cap.',
  'settings.planUsage.proFeature1': '20 lesson plans a month',
  'settings.planUsage.proFeature2': 'Fast and Quality modes',
  'settings.planUsage.proFeature3': 'OCR text extraction',
  'settings.planUsage.proPlusFeature1': 'Unlimited lesson plans',
  'settings.planUsage.proPlusFeature2': 'Everything in Pro',
  'settings.planUsage.proPlusFeature3': 'No monthly cap',
  'settings.planUsage.lessonPlans': 'Lesson plans',
  'settings.planUsage.usageBarAria': 'Lesson plan usage this period',
  'settings.planUsage.resetsOn': 'Usage resets on {date}',
  'settings.usageThisPeriod': '{used} of {limit} used this period',
  'settings.usageUnlimited': '{used} generated this period (Unlimited)',
  'pricing.freePrice': '$0',
  'pricing.perMonth': '/month',
  'pricing.checkoutRedirecting': 'Opening checkout…',
  'pricing.checkoutError': "Couldn't open checkout, try again",
};

function t(key: string, vars?: Record<string, string>) {
  let value = LABELS[key] ?? key;
  if (vars) {
    value = value.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  }
  return value;
}

jest.mock('@/providers/locale', () => ({
  useLocale: () => ({ locale: 'en' }),
  useT: () => t,
}));

describe('PlanUsageSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('exposes id=billing for hash navigation', () => {
    render(
      <PlanUsageSection plan="free" generationCount={1} generationLimit={3} />,
    );
  expect(document.getElementById('billing')).toBeInTheDocument();
  });

  it('starts Pro checkout for free users', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ url: 'https://checkout.example' }),
    });

    const { user } = render(
      <PlanUsageSection plan="free" generationCount={1} generationLimit={3} />,
    );

    await user.click(screen.getByRole('button', { name: /upgrade now/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkout?plan=pro&interval=monthly',
        { method: 'POST' },
      );
    });
  });

  it('shows near-limit copy at 90% usage', () => {
    render(
      <PlanUsageSection plan="free" generationCount={3} generationLimit={3} />,
    );

    expect(
      screen.getByText(/you've used most of this month's lesson plans/i),
    ).toBeInTheDocument();
  });

  it('does not start checkout for Pro users (portal path)', async () => {
    const { user } = render(
      <PlanUsageSection
        plan="pro"
        generationCount={5}
        generationLimit={20}
        manageSubscriptionUrl="https://portal.example"
      />,
    );

    await user.click(screen.getByRole('button', { name: /upgrade now/i }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText('Pro+', { exact: false })).toBeInTheDocument();
  });

  it('hides upgrade tile on Pro+', () => {
    render(
      <PlanUsageSection plan="pro_plus" generationCount={40} generationLimit={null} />,
    );

    expect(screen.queryByText('Upgrade available')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upgrade now/i })).not.toBeInTheDocument();
  });

  it('shows checkout error and allows retry', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({}),
    });

    const { user } = render(
      <PlanUsageSection plan="free" generationCount={0} generationLimit={3} />,
    );

    await user.click(screen.getByRole('button', { name: /upgrade now/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't open checkout/i);

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ url: 'https://checkout.example' }),
    });
    await user.click(screen.getByRole('button', { name: /upgrade now/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledTimes(2),
    );
  });
});

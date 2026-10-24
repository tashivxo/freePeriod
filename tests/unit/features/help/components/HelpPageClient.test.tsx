import { render, screen } from '@/tests/helpers';
import { HelpPageClient } from '@/features/help/components/HelpPageClient';

jest.mock('next/navigation', () => ({
  usePathname: () => '/help',
}));

describe('HelpPageClient', () => {
  it('uses the marketing home link when signed out and does not send account props into the form', () => {
    render(
      <HelpPageClient
        signedIn={false}
        supportEmail="support@freeperiod.co.za"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: /help & feedback/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /include browser details/i })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /include account and browser details/i })).not.toBeInTheDocument();
  });

  it('uses the dashboard back link when signed in and shows account diagnostics', () => {
    render(
      <HelpPageClient
        signedIn
        supportEmail="support@freeperiod.co.za"
        accountEmail="teacher@example.com"
        userId="user-123"
        plan="pro"
      />,
    );

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /include account and browser details/i })).toBeInTheDocument();
  });
});

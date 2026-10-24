import { render, screen } from '@/tests/helpers';
import { MarketingFooter } from '@/components/legal/MarketingFooter';

describe('MarketingFooter', () => {
  it('links to /help instead of a raw mailto contact address', () => {
    render(<MarketingFooter />);

    const help = screen.getByRole('link', { name: /help & feedback/i });
    expect(help).toHaveAttribute('href', '/help');
    expect(help.getAttribute('href')).not.toMatch(/^mailto:/);

    const nav = screen.getByRole('navigation', { name: /legal and support/i });
    expect(nav).toContainElement(help);
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('link', { name: /^contact$/i })).not.toBeInTheDocument();
  });
});

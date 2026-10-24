import { render, screen } from '@/tests/helpers';
import { MarketingFooter } from '@/components/legal/MarketingFooter';

const mockPathname = jest.fn(() => '/');

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('MarketingFooter', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/');
  });

  it('links to /help instead of a raw mailto contact address', () => {
    render(<MarketingFooter />);

    const help = screen.getByRole('link', { name: /help & feedback/i });
    expect(help).toHaveAttribute('href', '/help');
    expect(help.getAttribute('href')).not.toMatch(/^mailto:/);
    expect(help).not.toHaveAttribute('aria-current');

    const nav = screen.getByRole('navigation', { name: /legal and support/i });
    expect(nav).toContainElement(help);
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('link', { name: /^contact$/i })).not.toBeInTheDocument();
  });

  it('marks the Help link as the current page on /help', () => {
    mockPathname.mockReturnValue('/help');
    render(<MarketingFooter />);

    expect(screen.getByRole('link', { name: /help & feedback/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /privacy policy/i })).not.toHaveAttribute('aria-current');
  });
});

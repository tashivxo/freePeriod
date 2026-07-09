import { render, screen, waitFor } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import { useTheme } from '@/lib/theme';
import HomePage from './page';

jest.mock('@/lib/theme');
jest.mock('@/components/backgrounds/CtaIridescenceBackground', () => ({
  CtaIridescenceBackground: ({ prefersReduced }: { prefersReduced: boolean }) =>
    prefersReduced ? null : <div data-testid="cta-iridescence" aria-hidden="true" />,
}));
jest.mock('@/components/ui/SpotlightCard', () => ({
  SpotlightCard: ({ children, className, ...rest }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  ),
}));

const mockSetTheme = jest.fn();
const mockedUseTheme = jest.mocked(useTheme);

describe('HomePage', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockedUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });
  });

  it('renders the hero heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lesson plans in seconds, not hours');
  });

  it('renders the hero description', () => {
    render(<HomePage />);
    expect(screen.getByText(/generates a complete, structured lesson plan/)).toBeInTheDocument();
  });

  describe('floating dark mode toggle', () => {
    it('renders "Try dark mode" button in light mode', () => {
      render(<HomePage />);
      const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveTextContent('Try dark mode');
    });

    it('renders "Try light mode" button when in dark mode', () => {
      mockedUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });
      render(<HomePage />);
      const toggle = screen.getByRole('button', { name: /switch to light mode/i });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveTextContent('Try light mode');
    });

    it('calls setTheme("dark") when clicked in light mode', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('toggle button has fixed positioning', () => {
      render(<HomePage />);
      const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(toggle.className).toMatch(/fixed/);
    });
  });

  describe('CTA iridescence background', () => {
    it('renders iridescence behind CTA when motion is allowed', async () => {
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByTestId('cta-iridescence')).toBeInTheDocument();
      });
    });

    it('hides iridescence when reduced motion is preferred', async () => {
      window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }));

      render(<HomePage />);
      await waitFor(() => {
        expect(screen.queryByTestId('cta-iridescence')).not.toBeInTheDocument();
      });
    });
  });

  describe('feature card hover effects', () => {
    it('feature cards have transition-all class for hover animation', () => {
      const { container } = render(<HomePage />);
      const featureCards = container.querySelectorAll('[data-feature]');
      expect(featureCards).toHaveLength(3);
      featureCards.forEach((card) => {
        expect(card.className).toMatch(/transition/);
      });
    });
  });
});

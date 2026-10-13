import { render, screen } from '@/tests/helpers';
import { useTheme } from '@/providers/theme';
import { useZenMode } from '@/providers/zen-mode';
import { ColorBendsBackground } from '@/components/ui/backgrounds/ColorBendsWrapper';
import { COLOR_BENDS_INTENSITY, COLOR_BENDS_PALETTE } from '@/lib/utils/brand-colors';

jest.mock('next/dynamic', () => {
  const React = require('react') as typeof import('react');
  return () =>
    function MockColorBends(props: { colors?: string[]; intensity?: number }) {
      return React.createElement('div', {
        'data-testid': 'color-bends',
        'data-colors': JSON.stringify(props.colors ?? []),
        'data-intensity': String(props.intensity ?? ''),
      });
    };
});

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: jest.fn(),
}));

jest.mock('@/providers/theme', () => ({
  useTheme: jest.fn(),
}));

const mockUseZenMode = useZenMode as jest.MockedFunction<typeof useZenMode>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

function setTheme(resolvedTheme: 'light' | 'dark') {
  mockUseTheme.mockReturnValue({
    theme: resolvedTheme,
    setTheme: jest.fn(),
    resolvedTheme,
  });
}

describe('ColorBendsBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseZenMode.mockReturnValue({ zenMode: false, setZenMode: jest.fn() });
    setTheme('light');
  });

  it('renders ColorBends when zenMode is false', () => {
    render(<ColorBendsBackground />);

    expect(screen.getByTestId('color-bends')).toBeInTheDocument();
  });

  it('renders nothing when zenMode is true', () => {
    mockUseZenMode.mockReturnValue({ zenMode: true, setZenMode: jest.fn() });

    const { container } = render(<ColorBendsBackground />);

    expect(screen.queryByTestId('color-bends')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('passes a non-empty COLOR_BENDS_PALETTE as colors', () => {
    render(<ColorBendsBackground />);

    const node = screen.getByTestId('color-bends');
    const colors = JSON.parse(node.getAttribute('data-colors') ?? '[]') as string[];

    expect(colors.length).toBeGreaterThan(0);
    expect(colors).toEqual([...COLOR_BENDS_PALETTE]);
  });

  it('passes theme-aware intensity in light mode', () => {
    setTheme('light');
    render(<ColorBendsBackground />);

    expect(screen.getByTestId('color-bends').getAttribute('data-intensity')).toBe(
      String(COLOR_BENDS_INTENSITY.light),
    );
  });

  it('passes theme-aware intensity in dark mode', () => {
    setTheme('dark');
    render(<ColorBendsBackground />);

    expect(screen.getByTestId('color-bends').getAttribute('data-intensity')).toBe(
      String(COLOR_BENDS_INTENSITY.dark),
    );
  });
});

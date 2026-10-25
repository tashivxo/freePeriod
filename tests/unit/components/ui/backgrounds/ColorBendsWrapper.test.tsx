import { render, screen } from '@/tests/helpers';
import { useTheme } from '@/providers/theme';
import { useZenMode } from '@/providers/zen-mode';
import { useColorBendsAtmosphere } from '@/providers/color-bends-atmosphere';
import { ColorBendsBackground } from '@/components/ui/backgrounds/ColorBendsWrapper';
import { COLOR_BENDS_INTENSITY, COLOR_BENDS_PALETTE } from '@/lib/utils/brand-colors';
import type { ColorBendsAtmosphere } from '@/lib/utils/brand-colors';

jest.mock('next/dynamic', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return () =>
    function MockColorBends(props: { colors?: string[]; intensity?: number }) {
      return createElement('div', {
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

jest.mock('@/providers/color-bends-atmosphere', () => ({
  useColorBendsAtmosphere: jest.fn(),
}));

const mockUseZenMode = useZenMode as jest.MockedFunction<typeof useZenMode>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseColorBendsAtmosphere = useColorBendsAtmosphere as jest.MockedFunction<
  typeof useColorBendsAtmosphere
>;

function setTheme(resolvedTheme: 'light' | 'dark') {
  mockUseTheme.mockReturnValue({
    theme: resolvedTheme,
    setTheme: jest.fn(),
    resolvedTheme,
  });
}

function setResolvedAtmosphere(resolvedAtmosphere: ColorBendsAtmosphere) {
  mockUseColorBendsAtmosphere.mockReturnValue({
    atmosphere: resolvedAtmosphere,
    setAtmosphere: jest.fn(),
    resolvedAtmosphere,
    setProfileSignals: jest.fn(),
  });
}

describe('ColorBendsBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseZenMode.mockReturnValue({ zenMode: false, setZenMode: jest.fn() });
    setTheme('light');
    setResolvedAtmosphere('brand');
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

  it('passes COLOR_BENDS_PALETTE when resolved atmosphere is brand', () => {
    setResolvedAtmosphere('brand');
    render(<ColorBendsBackground />);

    const colors = JSON.parse(
      screen.getByTestId('color-bends').getAttribute('data-colors') ?? '[]',
    ) as string[];

    expect(colors).toEqual([...COLOR_BENDS_PALETTE]);
  });

  it('passes an empty colors array when resolved atmosphere is rainbow', () => {
    setResolvedAtmosphere('rainbow');
    render(<ColorBendsBackground />);

    const colors = JSON.parse(
      screen.getByTestId('color-bends').getAttribute('data-colors') ?? '[]',
    ) as string[];

    expect(colors).toEqual([]);
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

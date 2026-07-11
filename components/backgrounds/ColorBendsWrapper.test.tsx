import { render, screen } from '@/lib/test-utils';
import { useZenMode } from '@/lib/zen-mode';
import { ColorBendsBackground } from './ColorBendsWrapper';

jest.mock('next/dynamic', () => () => () => <div data-testid="color-bends" />);

jest.mock('@/lib/zen-mode', () => ({
  useZenMode: jest.fn(),
}));

const mockUseZenMode = useZenMode as jest.MockedFunction<typeof useZenMode>;

describe('ColorBendsBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ColorBends when zenMode is false', () => {
    mockUseZenMode.mockReturnValue({ zenMode: false, setZenMode: jest.fn() });

    render(<ColorBendsBackground />);

    expect(screen.getByTestId('color-bends')).toBeInTheDocument();
  });

  it('renders nothing when zenMode is true', () => {
    mockUseZenMode.mockReturnValue({ zenMode: true, setZenMode: jest.fn() });

    const { container } = render(<ColorBendsBackground />);

    expect(screen.queryByTestId('color-bends')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});

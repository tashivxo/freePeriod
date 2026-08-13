import { render, screen } from '@/lib/test-utils';
import {
  GenerationModePicker,
  GENERATION_MODE_OPTIONS,
} from '@/features/generate/components/GenerationModePicker';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: jest.fn(() => ({ zenMode: false, setZenMode: jest.fn() })),
}));

describe('GenerationModePicker', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it('renders the selected mode label on the trigger', () => {
    render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="quality"
        onChange={onChange}
        qualityUnlocked
      />,
    );

    expect(screen.getByRole('button', { name: /generation mode: quality/i })).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('More thorough plans. Takes a bit longer.')).toBeInTheDocument();
  });

  it('calls onChange when a different mode is selected', async () => {
    const { user } = render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="quality"
        onChange={onChange}
        qualityUnlocked
      />,
    );

    await user.click(screen.getByRole('button', { name: /generation mode: quality/i }));
    await user.click(screen.getByRole('option', { name: /fast/i }));

    expect(onChange).toHaveBeenCalledWith('fast');
  });

  it('shows a lock on Quality for free users and opens UpgradePrompt on click', async () => {
    const { user } = render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="fast"
        onChange={onChange}
        qualityUnlocked={false}
      />,
    );

    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toHaveAttribute(
      'href',
      '/pricing',
    );

    await user.click(screen.getByRole('button', { name: /generation mode: fast/i }));

    const qualityOption = screen.getByRole('option', { name: /quality/i });
    expect(qualityOption).toHaveAttribute('aria-disabled', 'true');
    expect(qualityOption.querySelector('[data-testid="quality-lock-icon"]')).toBeTruthy();
    expect(qualityOption).toHaveAccessibleName(/quality.*pro only/i);

    await user.click(qualityOption);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /upgrade to pro/i })).toBeInTheDocument();
    expect(
      screen.getByText(/quality mode is available on pro and pro\+/i),
    ).toBeInTheDocument();
  });

  it('allows Quality for paid users without a lock', async () => {
    const { user } = render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="fast"
        onChange={onChange}
        qualityUnlocked
      />,
    );

    await user.click(screen.getByRole('button', { name: /generation mode: fast/i }));
    const qualityOption = screen.getByRole('option', { name: /quality/i });
    expect(qualityOption).not.toHaveAttribute('aria-disabled');
    expect(qualityOption.querySelector('[data-testid="quality-lock-icon"]')).toBeNull();

    await user.click(qualityOption);
    expect(onChange).toHaveBeenCalledWith('quality');
    expect(screen.queryByRole('dialog', { name: /upgrade to pro/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/upgrade to pro/i)).not.toBeInTheDocument();
  });

  it('exports mode options with labels and descriptions', () => {
    expect(GENERATION_MODE_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'fast', label: 'Fast' }),
        expect.objectContaining({ value: 'quality', label: 'Quality' }),
      ]),
    );
  });
});

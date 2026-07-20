import { render, screen } from '@/lib/test-utils';
import {
  GenerationModePicker,
  GENERATION_MODE_OPTIONS,
} from '@/features/generate/components/GenerationModePicker';

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
    await user.click(screen.getByRole('menuitemradio', { name: /fast/i }));

    expect(onChange).toHaveBeenCalledWith('fast');
  });

  it('disables Quality for free users and shows upgrade hint', async () => {
    const { user } = render(
      <GenerationModePicker
        id="generation-mode-picker"
        value="fast"
        onChange={onChange}
        qualityUnlocked={false}
      />,
    );

    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toHaveAttribute('href', '/pricing');

    await user.click(screen.getByRole('button', { name: /generation mode: fast/i }));
    expect(screen.getByRole('menuitemradio', { name: /quality/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
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

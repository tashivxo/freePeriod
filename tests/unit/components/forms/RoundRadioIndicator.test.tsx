import { render, screen } from '@/tests/helpers';
import { RoundRadioIndicator } from '@/components/forms/RoundRadioIndicator';

describe('RoundRadioIndicator', () => {
  it('hides the inner dot when not selected', () => {
    const { container } = render(<RoundRadioIndicator selected={false} />);
    expect(container.querySelector('.scale-100')).toBeNull();
  });

  it('shows the inner dot when selected', () => {
    const { container } = render(<RoundRadioIndicator selected />);
    expect(container.querySelector('.scale-100')).not.toBeNull();
  });
});

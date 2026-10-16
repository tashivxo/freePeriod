import { render, screen } from '@/tests/helpers';
import { Input } from '@/components/ui/Input';
import { expectErrorXIcon } from '@/tests/helpers/error-icon';

describe('Input field error', () => {
  it('shows the animated X icon with the shared field error', () => {
    render(<Input label="Email" error="Email is required" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email is required');
    expect(alert).toHaveClass('text-error');
    expectErrorXIcon(alert);
  });
});

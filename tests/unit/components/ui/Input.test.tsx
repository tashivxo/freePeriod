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

describe('Input theme tokens', () => {
  it('uses theme background and text tokens and does not transition color or background', () => {
    render(<Input label="Email" />);
    const input = document.querySelector('input');
    expect(input).toHaveClass('bg-background');
    expect(input).toHaveClass('text-text-primary');
    expect(input?.className ?? '').not.toMatch(/transition-colors/);
    expect(input?.className ?? '').not.toMatch(/background-color/);
    expect(input?.className ?? '').not.toMatch(/transition-\[.*color/);
  });
});

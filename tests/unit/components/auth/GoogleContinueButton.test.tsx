import { render, screen } from '@/tests/helpers';
import { GoogleContinueButton } from '@/components/auth/GoogleContinueButton';

describe('GoogleContinueButton', () => {
  it('renders Continue with Google with the Google mark', () => {
    render(<GoogleContinueButton onClick={jest.fn()} />);

    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeInTheDocument();
    expect(button.className).not.toContain('bg-primary');

    const img = button.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img?.getAttribute('src')).toMatch(/brand(\/|%2F)google-g\.png/);
  });

  it('forwards click and disabled state', async () => {
    const onClick = jest.fn();
    const { user, rerender } = render(
      <GoogleContinueButton onClick={onClick} />,
    );

    await user.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<GoogleContinueButton onClick={onClick} disabled />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled();
  });
});

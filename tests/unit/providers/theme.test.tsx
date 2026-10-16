import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '@/providers/theme';

function Probe() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme}
    </button>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('applies the dark class on html in the same turn as setTheme', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { LocaleProvider } from '@/providers/locale';

function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return {
    user: userEvent.setup({ delay: null }),
    ...render(ui, { wrapper: LocaleProvider, ...options }),
  };
}

export { renderWithProviders as render };
export { screen, within, waitFor } from '@testing-library/react';
export { userEvent };

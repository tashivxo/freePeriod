import { render, waitFor } from '@testing-library/react';
import { SeedPreferredLocale } from '@/components/layout/SeedPreferredLocale';
import { useLocale } from '@/providers/locale';

const mockSetLocale = jest.fn();

jest.mock('@/providers/locale', () => ({
  useLocale: jest.fn(() => ({ locale: 'en', setLocale: mockSetLocale })),
}));

describe('SeedPreferredLocale', () => {
  beforeEach(() => {
    mockSetLocale.mockReset();
    mockSetLocale.mockResolvedValue(undefined);
    localStorage.clear();
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    (useLocale as jest.Mock).mockReturnValue({ locale: 'en', setLocale: mockSetLocale });
  });

  it('applies preferred_locale on mount only when no client locale is stored', async () => {
    render(<SeedPreferredLocale locale="fr" />);

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith('fr');
    });
  });

  it('does not override an existing client locale', () => {
    localStorage.setItem('fp-locale', 'ar');
    document.cookie = 'fp-locale=ar; path=/';

    render(<SeedPreferredLocale locale="en" />);

    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it('does not call setLocale when the stored-less current locale already matches', () => {
    render(<SeedPreferredLocale locale="en" />);

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});

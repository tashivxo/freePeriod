import { render, screen } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import { CurriculumAccuracyNotice } from '@/components/curriculum/CurriculumAccuracyNotice';
import { getMessages } from '@/lib/i18n';

describe('CurriculumAccuracyNotice', () => {
  it('uses English alignment copy by default', () => {
    render(<CurriculumAccuracyNotice curriculum="IB" />);
    expect(screen.getByRole('note', { name: /curriculum accuracy notice/i })).toHaveTextContent(
      /curriculum alignment notice for IB/i,
    );
  });

  it('translates the IB alignment notice in Arabic', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <CurriculumAccuracyNotice curriculum="IB" />
      </LocaleProvider>,
    );

    expect(screen.queryByText(/curriculum alignment notice/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verify the plan against your official requirements/i)).not.toBeInTheDocument();
    const ar = getMessages('ar').generate as Record<string, string>;
    expect(ar.alignmentTitle).toMatch(/[\u0600-\u06FF]/);
    expect(screen.getByRole('note')).toHaveTextContent(/IB/);
    expect(screen.getByRole('note')).toHaveTextContent(ar.alignmentBody);
  });
});

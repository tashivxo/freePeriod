import { render, screen } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import { LessonPlanCard } from '@/features/lesson/components/LessonPlanCard';

const lesson = {
  id: 'lesson-1',
  title: 'Fractions',
  subject: 'Mathematics',
  grade: '8',
  duration_minutes: 60,
  created_at: '2026-03-01T12:00:00.000Z',
};

describe('LessonPlanCard locale meta', () => {
  it('shows English Grade and compact duration in LTR', () => {
    render(<LessonPlanCard lesson={lesson} />);
    expect(screen.getByText('Grade 8')).toBeInTheDocument();
    expect(screen.getByText(/60m/)).toBeInTheDocument();
  });

  it('localizes History card grade and duration in Arabic with a bidi-safe duration', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <LessonPlanCard lesson={lesson} />
      </LocaleProvider>,
    );

    expect(screen.queryByText('Grade 8')).not.toBeInTheDocument();
    expect(screen.queryByText('60m')).not.toBeInTheDocument();
    expect(screen.getByText(/الصف 8/)).toBeInTheDocument();
    const duration = screen.getByText((_, node) => {
      const text = node?.textContent ?? '';
      return node?.tagName === 'SPAN' && text.includes('60') && text.includes('\u2068') && text.includes('\u2069');
    });
    expect(duration).toBeTruthy();
  });
});

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
    expect(
      screen.getByText((_, node) => {
        const text = (node?.textContent ?? '').replace(/[\u2068\u2069]/g, '');
        return node?.tagName === 'SPAN' && text === 'Grade 8';
      }),
    ).toBeInTheDocument();
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
    const grade = screen.getByText((_, node) => {
      const text = node?.textContent ?? '';
      return node?.tagName === 'SPAN' && text.includes('الصف') && text.includes('8') && text.includes('\u2068') && text.includes('\u2069');
    });
    expect(grade).toBeTruthy();
    const duration = screen.getByText((_, node) => {
      const text = node?.textContent ?? '';
      return node?.tagName === 'SPAN' && text.includes('60') && text.includes('\u2068') && text.includes('\u2069');
    });
    expect(duration).toBeTruthy();
  });

  it('uses an English Delete aria-label that includes the lesson title', () => {
    render(<LessonPlanCard lesson={lesson} onDelete={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete Fractions' })).toBeInTheDocument();
  });

  it('localizes the History delete aria-label in Arabic', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <LessonPlanCard lesson={lesson} onDelete={jest.fn()} />
      </LocaleProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Delete Fractions' })).not.toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: (accessibleName) => accessibleName.includes('حذف') && accessibleName.includes('Fractions'),
    });
    expect(deleteButton).toHaveAttribute('aria-label');
    expect(deleteButton.getAttribute('aria-label')).toMatch(/[\u0600-\u06FF]/);
  });
});

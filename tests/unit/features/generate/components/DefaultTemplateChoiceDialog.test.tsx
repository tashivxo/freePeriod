/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultTemplateChoiceDialog } from '@/features/generate/components/DefaultTemplateChoiceDialog';
import { LocaleProvider } from '@/providers/locale';

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: false }),
}));

describe('DefaultTemplateChoiceDialog', () => {
  it('shows title and both actions', () => {
    render(
      <LocaleProvider initialLocale="en">
        <DefaultTemplateChoiceDialog
          open
          onOpenChange={jest.fn()}
          onThisLessonOnly={jest.fn()}
          onEveryNewLesson={jest.fn()}
        />
      </LocaleProvider>,
    );

    expect(
      screen.getByText('Use this as your default template?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'This lesson only' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'This lesson and every new one' }),
    ).toBeInTheDocument();
  });

  it('calls this-lesson-only on escape via onOpenChange handler', async () => {
    const onThisLessonOnly = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <LocaleProvider initialLocale="en">
        <DefaultTemplateChoiceDialog
          open
          onOpenChange={onOpenChange}
          onThisLessonOnly={onThisLessonOnly}
          onEveryNewLesson={jest.fn()}
        />
      </LocaleProvider>,
    );

    await userEvent.keyboard('{Escape}');
    expect(onThisLessonOnly).toHaveBeenCalled();
  });
});

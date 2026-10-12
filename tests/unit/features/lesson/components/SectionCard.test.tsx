import { render, screen } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { ReactElement } from 'react';

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const { LessonEditor } = jest.requireMock('@/features/lesson/components/LessonEditor') as {
      LessonEditor: (props: {
        content: string;
        onChange: (html: string) => void;
        onBlur?: () => void;
      }) => ReactElement;
    };
    return LessonEditor;
  },
}));

jest.mock('@/features/lesson/components/LessonEditor', () => ({
  LessonEditor: ({
    content,
    onChange,
    onBlur,
  }: {
    content: string;
    onChange: (html: string) => void;
    onBlur?: () => void;
  }) => (
    <textarea
      data-testid="lesson-editor"
      defaultValue={content}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => onBlur?.()}
    />
  ),
}));

import { SectionCard } from '@/features/lesson/components/SectionCard';

function renderCard(ui: ReactElement) {
  return render(<LocaleProvider initialLocale="en">{ui}</LocaleProvider>);
}

const baseProps = {
  title: 'Hook Activity',
  content: 'Leaf observation',
  onEdit: () => {},
  onDone: () => {},
  onCancel: () => {},
  onChange: () => {},
};

describe('SectionCard', () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('shows an Edited tag when the section has saved edits', () => {
    renderCard(
      <SectionCard
        {...baseProps}
        isEditing={false}
        isEdited
        editedLabel="Edited"
      />,
    );

    const tag = screen.getByText('Edited');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveClass('bg-primary-soft', 'text-foreground');
    expect(tag).not.toHaveClass('text-coral');
  });

  it('does not show an Edited tag when the section has not been saved as edited', () => {
    renderCard(
      <SectionCard
        {...baseProps}
        isEditing={false}
      />,
    );

    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });

  it('does not offer a Restore action', () => {
    renderCard(
      <SectionCard
        {...baseProps}
        isEditing={false}
        isEdited
        editedLabel="Edited"
      />,
    );

    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/restore/i)).not.toBeInTheDocument();
  });

  it('calls onBlur when the editor loses focus', async () => {
    const onBlur = jest.fn();
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onBlur={onBlur}
      />,
    );

    await user.click(screen.getByTestId('lesson-editor'));
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
  });

  it('hides the pencil and the green tick while editing', () => {
    renderCard(
      <SectionCard
        {...baseProps}
        isEditing
      />,
    );

    expect(screen.queryByRole('button', { name: 'Edit Hook Activity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done editing Hook Activity' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Done editing Hook Activity')).not.toBeInTheDocument();
  });

  it('shows a right-aligned Save and Cancel row under the editor', () => {
    renderCard(
      <SectionCard
        {...baseProps}
        isEditing
      />,
    );

    const save = screen.getByRole('button', { name: 'Save' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const row = save.parentElement;

    expect(row).toBe(cancel.parentElement);
    expect(row).toHaveClass('justify-end');
    expect(cancel.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(save).toHaveAttribute('data-variant', 'default');
    expect(cancel).toHaveAttribute('data-variant', 'ghost');
    expect(save).toHaveClass('min-h-11');
    expect(cancel).toHaveClass('min-h-11');
    expect(save).toHaveClass('flex-1');
    expect(cancel).toHaveClass('flex-1');
  });

  it('saves with the Save button and with Cmd or Ctrl+Enter', async () => {
    const onDone = jest.fn().mockResolvedValue(true);
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onDone).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('lesson-editor'));
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onDone).toHaveBeenCalledTimes(2);

    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onDone).toHaveBeenCalledTimes(3);
  });

  it('cancels with the Cancel button and with Escape', async () => {
    const onCancel = jest.fn();
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('lesson-editor'));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('asks to discard edits before cancel restores the original text', async () => {
    const onCancel = jest.fn();
    const onChange = jest.fn();
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onCancel={onCancel}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByTestId('lesson-editor'), ' changed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(confirmSpy).toHaveBeenCalledWith('Discard your edits?');
    expect(onCancel).toHaveBeenCalledWith('Leaf observation');
  });

  it('keeps the editor open when the teacher declines discard', async () => {
    confirmSpy.mockReturnValue(false);
    const onCancel = jest.fn();
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onCancel={onCancel}
      />,
    );

    await user.type(screen.getByTestId('lesson-editor'), ' changed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId('lesson-editor')).toBeInTheDocument();
  });

  it('shows a red save error under the buttons and keeps the editor open', async () => {
    const onDone = jest.fn().mockResolvedValue(false);
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const error = await screen.findByText("Couldn't save, try again");
    expect(error).toHaveClass('text-red-700', 'dark:text-red-300');
    expect(error).toHaveAttribute('id');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'aria-describedby',
      error.id,
    );
    expect(screen.getByTestId('lesson-editor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('returns focus to the edit control after leaving edit mode', () => {
    const { rerender } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
      />,
    );

    rerender(
      <LocaleProvider initialLocale="en">
        <SectionCard
          {...baseProps}
          isEditing={false}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole('button', { name: 'Edit Hook Activity' })).toHaveFocus();
  });

  it('keeps the editor open after a blur save', async () => {
    const onBlur = jest.fn();
    const { user } = renderCard(
      <SectionCard
        {...baseProps}
        isEditing
        onBlur={onBlur}
      />,
    );

    await user.click(screen.getByTestId('lesson-editor'));
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
    expect(screen.getByTestId('lesson-editor')).toBeInTheDocument();
  });
});

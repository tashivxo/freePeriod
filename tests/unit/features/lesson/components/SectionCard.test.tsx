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

describe('SectionCard', () => {
  it('shows an Edited tag when the section has saved edits', () => {
    renderCard(
      <SectionCard
        title="Hook Activity"
        content="Leaf observation"
        isEditing={false}
        isEdited
        editedLabel="Edited"
        onEdit={() => {}}
        onDone={() => {}}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText('Edited')).toBeInTheDocument();
  });

  it('does not show an Edited tag when the section has not been saved as edited', () => {
    renderCard(
      <SectionCard
        title="Hook Activity"
        content="Leaf observation"
        isEditing={false}
        onEdit={() => {}}
        onDone={() => {}}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });

  it('does not offer a Restore action', () => {
    renderCard(
      <SectionCard
        title="Hook Activity"
        content="Leaf observation"
        isEditing={false}
        isEdited
        editedLabel="Edited"
        onEdit={() => {}}
        onDone={() => {}}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/restore/i)).not.toBeInTheDocument();
  });

  it('calls onBlur when the editor loses focus', async () => {
    const onBlur = jest.fn();
    const { user } = renderCard(
      <SectionCard
        title="Hook Activity"
        content="Leaf observation"
        isEditing
        onEdit={() => {}}
        onDone={() => {}}
        onChange={() => {}}
        onBlur={onBlur}
      />,
    );

    await user.click(screen.getByTestId('lesson-editor'));
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
  });
});

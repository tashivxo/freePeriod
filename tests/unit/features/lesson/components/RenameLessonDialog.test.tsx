import { render, screen } from '@/tests/helpers';
import { RenameLessonDialog } from '@/features/lesson/components/RenameLessonDialog';

const savingRef = { current: false };

function renderDialog({
  onSave = jest.fn().mockResolvedValue(undefined),
  lessonTitle = 'Fractions',
  open = true,
}: {
  onSave?: (title: string) => void | Promise<void>;
  lessonTitle?: string;
  open?: boolean;
} = {}) {
  const onOpenChange = jest.fn();
  const onCloseAutoFocus = jest.fn();
  return {
    onSave,
    onOpenChange,
    ...render(
      <RenameLessonDialog
        open={open}
        onOpenChange={onOpenChange}
        lessonTitle={lessonTitle}
        onSave={onSave}
        onCloseAutoFocus={onCloseAutoFocus}
        savingRef={savingRef}
      />,
    ),
  };
}

describe('RenameLessonDialog', () => {
  beforeEach(() => {
    savingRef.current = false;
  });

  it('disables Save when the title is unchanged or blank', async () => {
    const { user } = renderDialog();
    const save = screen.getByRole('button', { name: 'Save' });
    const input = screen.getByRole('textbox', { name: 'Lesson title' });

    expect(save).toBeDisabled();

    await user.clear(input);
    expect(save).toBeDisabled();

    await user.type(input, 'Ratios');
    expect(save).toBeEnabled();
  });

  it('calls onSave with the trimmed title on submit', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { user } = renderDialog({ onSave });
    const input = screen.getByRole('textbox', { name: 'Lesson title' });

    await user.clear(input);
    await user.type(input, '  Ratios  {Enter}');

    expect(onSave).toHaveBeenCalledWith('Ratios');
  });

  it('keeps the dialog open with the typed title when saving fails', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('network'));
    const { user } = renderDialog({ onSave });
    const input = screen.getByRole('textbox', { name: 'Lesson title' });

    await user.clear(input);
    await user.type(input, 'Ratios');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't rename. Try again.");
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input).toHaveValue('Ratios');
  });

  it('accepts Arabic lesson titles', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { user } = renderDialog({ onSave, lessonTitle: 'الكسور' });
    const input = screen.getByRole('textbox', { name: 'Lesson title' });

    await user.clear(input);
    await user.type(input, '  نسب  {Enter}');

    expect(onSave).toHaveBeenCalledWith('نسب');
  });
});
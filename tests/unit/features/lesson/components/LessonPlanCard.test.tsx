import { fireEvent } from '@testing-library/react';
import { render, screen, waitFor } from '@/tests/helpers';
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

  it('uses an English actions aria-label that includes the lesson title', () => {
    render(<LessonPlanCard lesson={lesson} onDelete={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Actions for Fractions' })).toBeInTheDocument();
  });

  it('localizes the actions aria-label in Arabic', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <LessonPlanCard lesson={lesson} onDelete={jest.fn()} />
      </LocaleProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Actions for Fractions' })).not.toBeInTheDocument();
    const actionsButton = screen.getByRole('button', {
      name: (accessibleName) => /[\u0600-\u06FF]/.test(accessibleName) && accessibleName.includes('Fractions'),
    });
    expect(actionsButton.getAttribute('aria-label')).toMatch(/[\u0600-\u06FF]/);
  });
});

describe('LessonPlanCard actions menu', () => {
  it('shows Rename and Delete on right-click', async () => {
    render(<LessonPlanCard lesson={lesson} onDelete={jest.fn()} onRename={jest.fn()} />);

    fireEvent.contextMenu(screen.getByText('Fractions'));

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders no menu affordance when no handlers are provided', () => {
    render(<LessonPlanCard lesson={lesson} />);

    fireEvent.contextMenu(screen.getByText('Fractions'));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
  });

  it('opens the same menu from the always-visible actions button', async () => {
    const { user } = render(
      <LessonPlanCard lesson={lesson} onDelete={jest.fn()} onRename={jest.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions for Fractions' }));

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('offers only Rename when onDelete is missing', async () => {
    const { user } = render(<LessonPlanCard lesson={lesson} onRename={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Actions for Fractions' }));

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });
});

describe('LessonPlanCard rename', () => {
  async function openRename(onRename: jest.Mock) {
    const utils = render(<LessonPlanCard lesson={lesson} onRename={onRename} />);
    await utils.user.click(screen.getByRole('button', { name: 'Actions for Fractions' }));
    await utils.user.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const input = await screen.findByRole('textbox', { name: 'Lesson title' });
    return { ...utils, input };
  }

  it('opens a dialog prefilled with the current title', async () => {
    const { input } = await openRename(jest.fn());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input).toHaveValue('Fractions');
  });

  it('saves the trimmed title on Enter', async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    const { user, input } = await openRename(onRename);

    await user.clear(input);
    await user.type(input, '  Ratios  {Enter}');

    expect(onRename).toHaveBeenCalledWith('lesson-1', 'Ratios');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels on Escape without saving', async () => {
    const onRename = jest.fn();
    const { user, input } = await openRename(onRename);

    await user.type(input, ' extra');
    await user.keyboard('{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('disables Save while the title is unchanged or blank', async () => {
    const { user, input } = await openRename(jest.fn());
    const save = screen.getByRole('button', { name: 'Save' });

    expect(save).toBeDisabled();

    await user.clear(input);
    expect(save).toBeDisabled();
    expect(screen.getByText('Enter a title')).toBeInTheDocument();

    await user.type(input, 'Ratios');
    expect(save).toBeEnabled();
  });

  it('keeps the dialog and input open with an inline error when saving fails', async () => {
    const onRename = jest.fn().mockRejectedValue(new Error('network'));
    const { user, input } = await openRename(onRename);

    await user.clear(input);
    await user.type(input, 'Ratios');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't rename. Try again.");
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input).toHaveValue('Ratios');
  });

  it('announces the blank-title error to assistive tech', async () => {
    const { user, input } = await openRename(jest.fn());

    await user.clear(input);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title');
  });

  it('cannot be dismissed with Escape while a save is in flight', async () => {
    let finish!: () => void;
    const onRename = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { user, input } = await openRename(onRename);

    await user.clear(input);
    await user.type(input, 'Ratios{Enter}');
    await user.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('limits the title length to 200 characters', async () => {
    const { input } = await openRename(jest.fn());

    expect(input).toHaveAttribute('maxLength', '200');
  });

  it('returns focus to the actions button after the dialog closes', async () => {
    const { user } = await openRename(jest.fn());

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Actions for Fractions' })).toHaveFocus(),
    );
  });
});

describe('LessonPlanCard delete from menu', () => {
  async function openDelete(onDelete: jest.Mock) {
    const utils = render(<LessonPlanCard lesson={lesson} onDelete={onDelete} />);
    fireEvent.contextMenu(screen.getByText('Fractions'));
    await utils.user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    return utils;
  }

  it('asks for confirmation with Cancel focused', async () => {
    await openDelete(jest.fn());

    expect(screen.getByText('Delete "Fractions"? This can\'t be undone.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('deletes only after confirming', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { user } = await openDelete(onDelete);

    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith('lesson-1');
  });

  it('keeps the confirmation open with an inline error when deleting fails', async () => {
    const onDelete = jest.fn().mockRejectedValue(new Error('network'));
    const { user } = await openDelete(onDelete);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't delete. Try again.");
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('ignores a second Delete click while the first is still running', async () => {
    let finish!: () => void;
    const onDelete = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { user } = await openDelete(onDelete);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    finish();
  });

  it('cancels the confirmation on Escape', async () => {
    const onDelete = jest.fn();
    const { user } = await openDelete(onDelete);

    await user.keyboard('{Escape}');

    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('does not reopen the menu on right-click inside the confirmation', async () => {
    await openDelete(jest.fn());

    fireEvent.contextMenu(screen.getByRole('alertdialog'));

    await waitFor(() => expect(screen.queryByRole('menuitem')).not.toBeInTheDocument());
  });

  it('makes the lesson link inert while confirming', async () => {
    await openDelete(jest.fn());

    expect(screen.getByText('Fractions').closest('a')).toHaveAttribute('inert');
  });

  it('dismisses the confirmation on Cancel', async () => {
    const onDelete = jest.fn();
    const { user } = await openDelete(onDelete);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/This can't be undone/)).not.toBeInTheDocument();
  });
});

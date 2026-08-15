import { render, screen } from '@/lib/test-utils';
import { act } from '@testing-library/react';

jest.mock('animejs', () => ({
  __esModule: true,
  default: jest.fn(() => ({ finished: Promise.resolve() })),
  animate: jest.fn(() => ({ finished: Promise.resolve() })),
  remove: jest.fn(),
}));

import { GenerationScreen, WRITING_WAIT_CYCLE_MS, WRITING_WAIT_MESSAGES } from './GenerationScreen';

describe('GenerationScreen', () => {
  it('renders the full-screen loading overlay users see while generating', () => {
    render(<GenerationScreen events={[]} onComplete={jest.fn()} />);

    expect(
      screen.getByRole('status', { name: /generating lesson plan/i }),
    ).toBeInTheDocument();
  });

  it('shows the animated brand logo', () => {
    render(<GenerationScreen events={[]} onComplete={jest.fn()} />);

    expect(screen.getByTestId('animated-logo')).toBeInTheDocument();
  });

  it('shows a default loading message before stream events arrive', () => {
    render(<GenerationScreen events={[]} onComplete={jest.fn()} />);

    expect(screen.getByText(/generating your lesson plan/i)).toBeInTheDocument();
  });

  it('displays status messages from stream events', () => {
    render(
      <GenerationScreen
        events={[{ type: 'status', message: 'Starting generation…' }]}
        onComplete={jest.fn()}
      />,
    );

    expect(screen.getByText('Starting generation…')).toBeInTheDocument();
  });

  it('cycles writing-wait copy while Claude is still generating', () => {
    jest.useFakeTimers();

    render(
      <GenerationScreen
        events={[
          { type: 'status', message: 'Starting generation…' },
          { type: 'status', message: 'Writing lesson plan…' },
        ]}
        onComplete={jest.fn()}
      />,
    );

    expect(screen.getByText(WRITING_WAIT_MESSAGES[0], { selector: '[aria-hidden="true"]' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(WRITING_WAIT_CYCLE_MS);
    });

    expect(screen.getByText(WRITING_WAIT_MESSAGES[1], { selector: '[aria-hidden="true"]' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(WRITING_WAIT_CYCLE_MS);
    });

    expect(screen.getByText(WRITING_WAIT_MESSAGES[2], { selector: '[aria-hidden="true"]' })).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('does not cycle writing-wait copy after sections start arriving', () => {
    jest.useFakeTimers();

    render(
      <GenerationScreen
        events={[
          { type: 'status', message: 'Writing lesson plan…' },
          { type: 'section', key: 'title', data: 'My Lesson' },
        ]}
        onComplete={jest.fn()}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(WRITING_WAIT_CYCLE_MS * 3);
    });

    expect(screen.queryByText(WRITING_WAIT_MESSAGES[1])).not.toBeInTheDocument();
    expect(screen.getByText(/1 of \d+ sections ready/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows section progress as sections stream in', () => {
    render(
      <GenerationScreen
        events={[
          { type: 'status', message: 'Writing lesson plan…' },
          { type: 'section', key: 'title', data: 'My Lesson' },
        ]}
        onComplete={jest.fn()}
      />,
    );

    expect(screen.getByText(/1 of \d+ sections ready/i)).toBeInTheDocument();
  });

  it('calls onComplete when generation finishes', () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();

    render(
      <GenerationScreen
        events={[
          {
            type: 'complete',
            lessonId: 'lesson-abc',
            usage: { inputTokens: 100, outputTokens: 500 },
          },
        ]}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByText(/lesson plan complete/i)).toBeInTheDocument();

    jest.advanceTimersByTime(600);
    expect(onComplete).toHaveBeenCalledWith('lesson-abc');

    jest.useRealTimers();
  });

  it('displays error messages from the stream', () => {
    render(
      <GenerationScreen
        events={[{ type: 'error', message: 'Something went wrong' }]}
        onComplete={jest.fn()}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

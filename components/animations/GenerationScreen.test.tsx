import { render, screen } from '@/lib/test-utils';

jest.mock('animejs', () => ({
  __esModule: true,
  default: jest.fn(() => ({ finished: Promise.resolve() })),
  animate: jest.fn(() => ({ finished: Promise.resolve() })),
  remove: jest.fn(),
}));

import { GenerationScreen } from './GenerationScreen';

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

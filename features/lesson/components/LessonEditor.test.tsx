/**
 * LessonEditor — Tiptap rich-text editor wrapper
 * TDD: this file is written BEFORE the implementation (RED).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Tiptap requires a real browser environment; mock for jest/jsdom ───────
const mockGetHTML = jest.fn<string, []>(() => '<p>initial content</p>');
const mockRun = jest.fn();

interface MockChainResult {
  focus: jest.Mock<MockChainResult, []>;
  toggleBold: jest.Mock<MockChainResult, []>;
  toggleItalic: jest.Mock<MockChainResult, []>;
  toggleHeading: jest.Mock<MockChainResult, [Record<string, unknown>?]>;
  toggleBulletList: jest.Mock<MockChainResult, []>;
  toggleOrderedList: jest.Mock<MockChainResult, []>;
  undo: jest.Mock<MockChainResult, []>;
  redo: jest.Mock<MockChainResult, []>;
  run: jest.Mock;
}

const mockChainResult: MockChainResult = {
  focus: jest.fn(() => mockChainResult),
  toggleBold: jest.fn(() => mockChainResult),
  toggleItalic: jest.fn(() => mockChainResult),
  toggleHeading: jest.fn(() => mockChainResult),
  toggleBulletList: jest.fn(() => mockChainResult),
  toggleOrderedList: jest.fn(() => mockChainResult),
  undo: jest.fn(() => mockChainResult),
  redo: jest.fn(() => mockChainResult),
  run: mockRun,
};
const mockChain = jest.fn(() => mockChainResult);
const mockIsActive = jest.fn<boolean, [string] | [string, Record<string, unknown>]>(() => false);

const mockEditor = {
  getHTML: mockGetHTML,
  chain: mockChain,
  isActive: mockIsActive,
  can: jest.fn(() => ({
    chain: jest.fn(() => ({
      focus: jest.fn(() => ({
        undo: jest.fn(() => ({ run: jest.fn(() => true) })),
        redo: jest.fn(() => ({ run: jest.fn(() => true) })),
      })),
    })),
  })),
};

// Capture Tiptap lifecycle callbacks so tests can trigger them manually
let capturedOnUpdate: ((props: { editor: typeof mockEditor }) => void) | null = null;
let capturedOnBlur: (() => void) | null = null;

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(
    (options: {
      content?: string;
      onUpdate?: (props: { editor: typeof mockEditor }) => void;
      onBlur?: () => void;
    }) => {
      capturedOnUpdate = options?.onUpdate ?? null;
      capturedOnBlur = options?.onBlur ?? null;
      return mockEditor;
    },
  ),
  EditorContent: jest.fn(({ editor: _editor }: { editor: typeof mockEditor | null }) => (
    <div data-testid="editor-content" />
  )),
}));

jest.mock('@tiptap/starter-kit', () => ({ default: {} }));
jest.mock('@tiptap/extension-typography', () => ({ default: {} }));

// Import AFTER mocks are registered
import { LessonEditor } from './LessonEditor';

describe('LessonEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHTML.mockReturnValue('<p>initial content</p>');
    mockIsActive.mockReturnValue(false);
  });

  it('renders the editor content area', () => {
    render(<LessonEditor content="initial content" onChange={() => {}} />);
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('calls onChange when the editor updates', () => {
    const onChange = jest.fn();
    render(<LessonEditor content="initial content" onChange={onChange} />);
    mockGetHTML.mockReturnValue('<p>updated content</p>');
    capturedOnUpdate?.({ editor: mockEditor });
    expect(onChange).toHaveBeenCalledWith('<p>updated content</p>');
  });

  it('calls onBlur when the editor loses focus', () => {
    const onBlur = jest.fn();
    render(<LessonEditor content="initial content" onChange={() => {}} onBlur={onBlur} />);
    capturedOnBlur?.();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('renders Bold toolbar button with accessible label', () => {
    render(<LessonEditor content="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
  });

  it('renders Italic toolbar button with accessible label', () => {
    render(<LessonEditor content="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
  });

  it('clicking Bold button calls chain().focus().toggleBold().run()', async () => {
    render(<LessonEditor content="" onChange={() => {}} />);
    const boldButton = screen.getByRole('button', { name: /bold/i });
    await userEvent.click(boldButton);
    expect(mockChain).toHaveBeenCalled();
    expect(mockChainResult.focus).toHaveBeenCalled();
    expect(mockChainResult.toggleBold).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });

  it('all toolbar buttons have a minimum accessible name', () => {
    render(<LessonEditor content="" onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      const label = btn.getAttribute('aria-label') ?? btn.textContent ?? '';
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });
});

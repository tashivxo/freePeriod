import {
  contentToEditorHtml,
  contentToString,
  editTextToContent,
  stripHtml,
} from '@/lib/lesson/content';

const TWO_PARA_LIST_HTML =
  '<p>Para one</p><p>Para two</p><ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>';
const TWO_PARA_LIST_TEXT = 'Para one\n\nPara two\n- Item A\n- Item B';
const LINE_BREAK_HTML = '<p>Line one<br>Line two</p>';
const ORDERED_LIST_HTML = '<ol><li><p>First</p></li><li><p>Second</p></li></ol>';

describe('stripHtml', () => {
  it('keeps two paragraphs and a list as separate lines instead of concatenating', () => {
    expect(stripHtml(TWO_PARA_LIST_HTML)).toBe(TWO_PARA_LIST_TEXT);
    expect(stripHtml(TWO_PARA_LIST_HTML)).not.toBe('Para onePara twoItem AItem B');
  });

  it('preserves hard line breaks', () => {
    expect(stripHtml(LINE_BREAK_HTML)).toBe('Line one\nLine two');
  });

  it('preserves numbered lists', () => {
    expect(stripHtml(ORDERED_LIST_HTML)).toBe('1. First\n2. Second');
  });

  it('does not turn an unchanged paragraph into concatenated text', () => {
    expect(stripHtml('<p>Leaf observation</p>')).toBe('Leaf observation');
  });
});

describe('edit round-trip', () => {
  it('saves then reopens two paragraphs and a list identically', () => {
    const stored = editTextToContent(stripHtml(TWO_PARA_LIST_HTML), '');
    expect(stored).toBe(TWO_PARA_LIST_TEXT);

    const reopened = contentToEditorHtml(stored);
    const savedAgain = editTextToContent(stripHtml(reopened), stored);
    expect(savedAgain).toBe(TWO_PARA_LIST_TEXT);
    expect(savedAgain).toBe(stored);
  });

  it('is a no-op when the editor HTML of existing structured text is saved unchanged', () => {
    const original = TWO_PARA_LIST_TEXT;
    const editorHtml = contentToEditorHtml(original);
    const afterSave = editTextToContent(stripHtml(editorHtml), original);
    expect(afterSave).toBe(original);
  });

  it('round-trips line breaks exactly', () => {
    const stored = editTextToContent(stripHtml(LINE_BREAK_HTML), '');
    expect(stored).toBe('Line one\nLine two');
    expect(editTextToContent(stripHtml(contentToEditorHtml(stored)), stored)).toBe(stored);
  });

  it('round-trips numbered lists exactly', () => {
    const stored = editTextToContent(stripHtml(ORDERED_LIST_HTML), '');
    expect(stored).toBe('1. First\n2. Second');
    expect(editTextToContent(stripHtml(contentToEditorHtml(stored)), stored)).toBe(stored);
  });

  it('round-trips array sections without storing typed bullet glyphs', () => {
    const original = ['Item A', 'Item B'];
    const html = contentToEditorHtml(original);
    expect(html).toMatch(/<(ul|ol|p)\b/i);

    const saved = editTextToContent(stripHtml(html), original);
    expect(saved).toEqual(['Item A', 'Item B']);
    expect(saved).not.toEqual(['- Item A', '- Item B']);
    expect(saved).not.toEqual(['• Item A', '• Item B']);
  });

  it('strips list markers when an array section is saved from a bullet list', () => {
    const original = ['Understand light reactions'];
    const saved = editTextToContent(stripHtml(TWO_PARA_LIST_HTML), original);
    expect(saved).toEqual(['Para one', 'Para two', 'Item A', 'Item B']);
  });
});

describe('contentToEditorHtml', () => {
  it('turns stored paragraphs and markdown-like lists into HTML the editor can keep', () => {
    const html = contentToEditorHtml(TWO_PARA_LIST_TEXT);
    expect(html).toContain('<p>Para one</p>');
    expect(html).toContain('<p>Para two</p>');
    expect(html).toMatch(/<ul[\s>][\s\S]*Item A[\s\S]*Item B[\s\S]*<\/ul>/);
    expect(html).not.toBe(contentToString(TWO_PARA_LIST_TEXT));
  });
});

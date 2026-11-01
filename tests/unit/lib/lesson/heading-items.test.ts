import { contentToEditorHtml } from '@/lib/lesson/content';
import { splitBoldLabelItem } from '@/lib/lesson/heading-items';

describe('splitBoldLabelItem', () => {
  it.each([
    ['**Prior knowledge:**', 'Prior knowledge:', ''],
    ['- **Prior knowledge:**', 'Prior knowledge:', ''],
    ['* **Working At Mastery (most):**', 'Working At Mastery (most):', ''],
    ['**Prior knowledge**:', 'Prior knowledge:', ''],
    ['**Extension:** Students build a model.', 'Extension:', 'Students build a model.'],
    ['- **Extension:** Students build a model.', 'Extension:', 'Students build a model.'],
    ['**Objectif :** comprendre', 'Objectif :', 'comprendre'],
    ['**\u6807\u9898\uff1a**', '\u6807\u9898\uff1a', ''],
  ])('treats %j as a heading', (input, label, rest) => {
    expect(splitBoldLabelItem(input)).toEqual({ label, rest });
  });

  it.each([
    'Plain point',
    'Use **bold** words inside a point',
    '**Important** point without a colon',
    'Prior knowledge:',
    '**Bold start:** then **more bold** text with a trailing sentence that is long enough to be prose, not a label of any kind at all',
  ])('keeps %j as a normal point', (input) => {
    expect(splitBoldLabelItem(input)).toBeNull();
  });
});

describe('contentToEditorHtml bold label items', () => {
  it('renders a bold label item as a heading paragraph and keeps points bulleted', () => {
    const html = contentToEditorHtml([
      '- **Working Towards Mastery (all):**',
      'Provide a glossary',
      'Offer sentence frames',
    ]);
    expect(html).toBe(
      '<p><strong>Working Towards Mastery (all):</strong></p>' +
        '<ul><li><p>Provide a glossary</p></li><li><p>Offer sentence frames</p></li></ul>',
    );
  });

  it('splits a label with inline text into a heading and a bullet, nothing merged', () => {
    const html = contentToEditorHtml(['**Extension:** Build a model', 'Second point']);
    expect(html).toBe(
      '<p><strong>Extension:</strong></p>' +
        '<ul><li><p>Build a model</p></li><li><p>Second point</p></li></ul>',
    );
  });

  it('starts a new list after each heading', () => {
    const html = contentToEditorHtml(['**A:**', 'a1', '**B:**', 'b1']);
    expect(html).toBe(
      '<p><strong>A:</strong></p><ul><li><p>a1</p></li></ul>' +
        '<p><strong>B:</strong></p><ul><li><p>b1</p></li></ul>',
    );
  });

  it('handles markdown text blocks as well as arrays', () => {
    const html = contentToEditorHtml('- **Prior knowledge:**\n- point one\n- point two');
    expect(html).toBe(
      '<p><strong>Prior knowledge:</strong></p><ul><li><p>point one</p></li><li><p>point two</p></li></ul>',
    );
  });

  it('keeps ordinary bullets bulleted', () => {
    expect(contentToEditorHtml(['one', 'two'])).toBe(
      '<ul><li><p>one</p></li><li><p>two</p></li></ul>',
    );
    expect(contentToEditorHtml('- one\n- two')).toBe('<ul><li><p>one</p></li><li><p>two</p></li></ul>');
  });
});

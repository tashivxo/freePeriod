export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function sanitiseCellContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s/gm, '')
    .replace(/^\s*[-*•]\s/gm, '')
    .trim();
}

export function prepareCellText(text: string): string {
  return sanitiseCellContent(stripHtmlTags(text));
}

export function formatICanStatements(criteria: string[]): string {
  return criteria
    .map((criterion) => {
      const text = prepareCellText(criterion);
      if (/^i can\b/i.test(text)) return text;
      const stripped = text.replace(/^students?\s+(can|will|demonstrate)\s+/i, '').trim();
      if (!stripped) return '';
      return `I can ${stripped.charAt(0).toLowerCase()}${stripped.slice(1)}`;
    })
    .filter(Boolean)
    .join('\n');
}

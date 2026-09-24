export type ParsedContent = {
  text: string;
  type: 'docx' | 'pdf' | 'xlsx' | 'image';
  metadata?: Record<string, unknown>;
};

/** Curriculum docs must yield readable text. Templates may be blank shells. */
export function requiresExtractedText(uploadType: string | undefined): boolean {
  return uploadType !== 'template';
}

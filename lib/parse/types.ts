export type ParsedContent = {
  text: string;
  type: 'docx' | 'pdf' | 'xlsx' | 'image';
  metadata?: Record<string, unknown>;
};

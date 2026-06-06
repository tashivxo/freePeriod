jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({ body, init })),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('docx-templates', () => jest.fn());
jest.mock('xlsx', () => ({
  read: jest.fn(),
  write: jest.fn(),
}));
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn(),
  },
}));

import { buildTemplateData } from '@/lib/lesson/template-data';
describe('template fill data', () => {
  it('maps formal lesson fields to placeholders for uploaded templates', () => {
    const data = buildTemplateData({
      title: 'Story Elements',
      essentialQuestion: 'What makes a story feel real?',
      objectives: ['Identify elements'],
      successCriteria: ['I can identify character and setting'],
      keyConcepts: ['character'],
      vocabulary: ['theme', 'conflict'],
      hook: 'Opening image prompt',
      mainActivities: ['Read a passage'],
      guidedPractice: ['Shared story map'],
      independentPractice: ['Individual annotation'],
      formativeAssessment: ['Exit ticket'],
      differentiation: {
        support: ['Sentence starters'],
        extension: ['Implicit theme analysis'],
      },
      realWorldConnections: ['Film storytelling'],
      plenary: 'Share learning',
    });

    expect(data).toMatchObject({
      essentialQuestion: 'What makes a story feel real?',
      vocabulary: 'theme\nconflict',
    });
  });
});

export type CurriculumPack = {
  id: string;
  curriculumValues: string[];
  authority:
    | 'UAE_MOE'
    | 'ADEK'
    | 'CAMBRIDGE'
    | 'CAPS'
    | 'COMMON_CORE'
    | 'GCSE'
    | 'AQA'
    | 'EDEXCEL'
    | 'OCR';
  displayName: string;
  coverage: 'guideline';
  lastReviewed: string;
  sourceNotes: string[];
  applicability: string[];
  uiHelperText: string;
  terminology: string[];
  assessmentStyle: string[];
  lessonExpectations: string[];
  subjectNotes?: Record<string, string[]>;
};

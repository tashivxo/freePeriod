export type CurriculumPack = {
  id: string; // 'uae-moe' | 'adek'
  curriculumValues: string[]; // dropdown values this pack matches
  authority: 'UAE_MOE' | 'ADEK';
  displayName: string;
  coverage: 'guideline';
  lastReviewed: string; // ISO date YYYY-MM-DD
  sourceNotes: string[];
  applicableEmirates: string[];
  terminology: string[];
  assessmentStyle: string[];
  lessonExpectations: string[];
  subjectNotes?: Record<string, string[]>;
};

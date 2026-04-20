export const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Biology',
  'Chemistry',
  'Physics',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
  'Social Studies',
  'Economics',
  'Religious Education',
  'Design & Technology',
  'Drama',
] as const;

export type Subject = (typeof SUBJECTS)[number];

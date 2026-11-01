import type { LessonSection } from '@/types';
import { stripAdaptiveSelfPointers } from '@/lib/lesson/adaptive-self-reference';

function joinField(value: unknown): string {
  if (Array.isArray(value)) return value.join('\n');
  if (typeof value === 'string') return value;
  return '';
}

export function buildTemplateData(sourceContent: LessonSection): Record<string, string> {
  const content = stripAdaptiveSelfPointers(sourceContent);
  const { differentiation } = content;

  return {
    title: joinField(content.title),
    essentialQuestion: joinField(content.essentialQuestion),
    objectives: joinField(content.objectives),
    successCriteria: joinField(content.successCriteria),
    priorKnowledge: joinField(content.priorKnowledge),
    performanceExpectations: joinField(content.performanceExpectations),
    misconceptions: joinField(content.misconceptions),
    sciencePractices: joinField(content.sciencePractices),
    keyConcepts: joinField(content.keyConcepts),
    vocabulary: joinField(content.vocabulary),
    hook: joinField(content.hook),
    mainActivities: joinField(content.mainActivities),
    guidedPractice: joinField(content.guidedPractice),
    independentPractice: joinField(content.independentPractice),
    formativeAssessment: joinField(content.formativeAssessment),
    differentiationSupport: joinField(differentiation?.support),
    differentiationExtension: joinField(differentiation?.extension),
    realWorldConnections: joinField(content.realWorldConnections),
    plenary: joinField(content.plenary),
  };
}

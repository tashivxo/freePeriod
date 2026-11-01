import {
  isAdaptiveSelfPointer,
  stripAdaptiveSelfPointers,
  withoutAdaptiveSelfPointers,
} from '@/lib/lesson/adaptive-self-reference';
import {
  REAL_EXTENSION,
  REAL_SUCCESS_AT,
  REAL_SUPPORT,
  SELF_POINTER_AT,
  SELF_POINTER_DEPTH,
  SELF_POINTER_TOWARDS,
  selfReferentialLesson,
} from '@/tests/helpers/adaptive-self-reference';

describe('isAdaptiveSelfPointer', () => {
  it('matches a pointer only when it names the band it sits in', () => {
    expect(isAdaptiveSelfPointer(SELF_POINTER_AT, 'at')).toBe(true);
    expect(isAdaptiveSelfPointer(SELF_POINTER_TOWARDS, 'towards')).toBe(true);
    expect(isAdaptiveSelfPointer(SELF_POINTER_DEPTH, 'depth')).toBe(true);

    expect(isAdaptiveSelfPointer(SELF_POINTER_TOWARDS, 'at')).toBe(false);
    expect(isAdaptiveSelfPointer(SELF_POINTER_DEPTH, 'at')).toBe(false);
    expect(isAdaptiveSelfPointer(SELF_POINTER_AT, 'towards')).toBe(false);
    expect(isAdaptiveSelfPointer('See Adaptive Teaching.', 'at')).toBe(false);
  });

  it('tolerates bullets, case, spacing, and a missing full stop', () => {
    expect(isAdaptiveSelfPointer('• See Adaptive Teaching: Working At Mastery.', 'at')).toBe(true);
    expect(isAdaptiveSelfPointer('- see adaptive teaching:  working at mastery', 'at')).toBe(true);
    expect(isAdaptiveSelfPointer('**See Adaptive Teaching: Working at Mastery.**', 'at')).toBe(true);
  });

  it('keeps real sentences that merely mention the heading', () => {
    expect(
      isAdaptiveSelfPointer('Students at Working At Mastery complete the task. See Adaptive Teaching.', 'at'),
    ).toBe(false);
    expect(isAdaptiveSelfPointer(REAL_SUCCESS_AT, 'at')).toBe(false);
  });
});

describe('withoutAdaptiveSelfPointers', () => {
  it('drops self-pointer lines and keeps the rest in order', () => {
    expect(withoutAdaptiveSelfPointers([REAL_SUCCESS_AT, SELF_POINTER_AT], 'at')).toEqual([
      REAL_SUCCESS_AT,
    ]);
    expect(withoutAdaptiveSelfPointers([SELF_POINTER_AT], 'at')).toEqual([]);
  });

  it('drops a self-pointer line inside a multi-line item', () => {
    expect(withoutAdaptiveSelfPointers([`${REAL_SUCCESS_AT}\n${SELF_POINTER_AT}`], 'at')).toEqual([
      REAL_SUCCESS_AT,
    ]);
  });

  it('keeps pointers to other sections', () => {
    expect(withoutAdaptiveSelfPointers([SELF_POINTER_TOWARDS, SELF_POINTER_DEPTH], 'at')).toEqual([
      SELF_POINTER_TOWARDS,
      SELF_POINTER_DEPTH,
    ]);
  });
});

describe('stripAdaptiveSelfPointers', () => {
  it('removes each band pointer from its own list and leaves real content', () => {
    const cleaned = stripAdaptiveSelfPointers(selfReferentialLesson.content);

    expect(cleaned.successCriteria).toEqual([REAL_SUCCESS_AT]);
    expect(cleaned.differentiation.support).toEqual([REAL_SUPPORT]);
    expect(cleaned.differentiation.extension).toEqual([REAL_EXTENSION]);
    expect(cleaned.title).toBe(selfReferentialLesson.content.title);
  });

  it('does not mutate its input and leaves clean content untouched', () => {
    const before = JSON.stringify(selfReferentialLesson.content);
    stripAdaptiveSelfPointers(selfReferentialLesson.content);
    expect(JSON.stringify(selfReferentialLesson.content)).toBe(before);

    const clean = {
      ...selfReferentialLesson.content,
      successCriteria: [REAL_SUCCESS_AT],
      differentiation: { support: [REAL_SUPPORT], extension: [REAL_EXTENSION] },
    };
    expect(stripAdaptiveSelfPointers(clean)).toEqual(clean);
  });

  it('keeps a pointer to another band in a list', () => {
    const content = {
      ...selfReferentialLesson.content,
      differentiation: { support: [REAL_SUPPORT, SELF_POINTER_AT], extension: [] },
    };
    expect(stripAdaptiveSelfPointers(content).differentiation.support).toEqual([
      REAL_SUPPORT,
      SELF_POINTER_AT,
    ]);
  });

  it('writes no em dashes in the helper copy', () => {
    for (const text of [SELF_POINTER_TOWARDS, SELF_POINTER_AT, SELF_POINTER_DEPTH]) {
      expect(text).not.toContain('\u2014');
    }
  });
});

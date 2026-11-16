export function canUseNativeWebShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  );
}

export function canShareLessonFile(fileName: string, contentType: string): boolean {
  if (!canUseNativeWebShare()) return false;
  try {
    const testFile = new File([''], fileName, { type: contentType });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}
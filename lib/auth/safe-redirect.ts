export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  try {
    const decoded = decodeURIComponent(path);
    return decoded.startsWith('/') && !decoded.startsWith('//');
  } catch {
    return false;
  }
}

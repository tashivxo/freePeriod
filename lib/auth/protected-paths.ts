const PROTECTED_APP_PREFIXES = [
  '/dashboard',
  '/generate',
  '/history',
  '/lesson',
  '/settings',
  '/onboarding',
] as const;

export function isProtectedAppPath(pathname: string): boolean {
  return PROTECTED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

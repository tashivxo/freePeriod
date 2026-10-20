export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = 'message' in err && typeof err.message === 'string' ? err.message.toLowerCase() : '';
  const name = 'name' in err && typeof err.name === 'string' ? err.name.toLowerCase() : '';
  const status = 'status' in err && typeof err.status === 'number' ? err.status : undefined;
  return (
    name.includes('retryable') ||
    name.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network error') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('offline') ||
    status === 0
  );
}

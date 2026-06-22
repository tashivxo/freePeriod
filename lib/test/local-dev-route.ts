import type { NextRequest } from 'next/server';

/** Routes that must never run outside local development. */
export function isLocalDevRouteAllowed(request?: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  if (request) {
    const host = request.headers.get('host') ?? '';
    const isLocalHost =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('[::1]');
    if (!isLocalHost) {
      return false;
    }
  }

  return true;
}

export function localDevRouteBlockedResponse(): Response {
  return new Response('Not found', { status: 404 });
}

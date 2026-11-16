import { randomBytes } from 'crypto';

/** 128-bit URL-safe token for public share links. */
export function generateShareToken(): string {
  return randomBytes(16).toString('base64url');
}
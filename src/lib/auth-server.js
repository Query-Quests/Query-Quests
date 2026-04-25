/**
 * Server-side helper for resolving the current user from cookies.
 *
 * The auth-token cookie is set by `src/app/api/auth/route.js` as
 * `user-${user.id}` (httpOnly). Until tokens are properly signed (a
 * separate project), this still raises the bar over reading
 * `user_id` from the request body, which lets anyone submit as
 * anyone.
 */

import { prisma } from './prisma';

/**
 * @param {{ get: (name: string) => { value?: string } | undefined }} cookies
 *   The `cookies` helper from a NextRequest (`request.cookies`).
 * @returns {Promise<import('@prisma/client').User | null>}
 */
export async function getUserFromCookies(cookies) {
  const userId = userIdFromCookies(cookies);
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

/**
 * Cheaper variant when the caller only needs the id (no DB hit).
 *
 * @param {{ get: (name: string) => { value?: string } | undefined }} cookies
 * @returns {string | null}
 */
export function userIdFromCookies(cookies) {
  const token = cookies?.get?.('auth-token')?.value;
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('user-')) return null;
  const id = token.slice('user-'.length);
  return id || null;
}

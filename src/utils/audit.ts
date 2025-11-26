/**
 * Audit utilities
 *
 * Generic helper to build the "{id}-{email}" actor string
 * from the authenticated user (decoded from the JWT token).
 */

import type { AuthenticatedUser } from '../middlewares/auth.middleware';

export function getActorFromUser(user?: AuthenticatedUser | null): string | undefined {
  if (!user) return undefined;
  return `${user.id}-${user.email}`;
}



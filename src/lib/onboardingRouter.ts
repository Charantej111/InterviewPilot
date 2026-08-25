/**
 * Centralized Post-Authentication Destination & Onboarding Router
 * Deterministically determines whether an authenticated user should be directed to:
 * - '/dashboard' (for candidates with configured target profile or past sessions)
 * - '/setup' (for brand new candidates with incomplete onboarding)
 */

import { UserProfile } from '../types/user';

export function isOnboardingComplete(profile: Partial<UserProfile> | null | undefined): boolean {
  if (!profile) return false;

  // If candidate has completed at least 1 interview session, onboarding is complete
  if (profile.interviewsCompleted && profile.interviewsCompleted > 0) {
    return true;
  }

  // If candidate has configured target role or target companies, onboarding is complete
  if (profile.targetRole && profile.targetRole.trim().length > 0) {
    return true;
  }

  return false;
}

export function getPostAuthDestination(
  profile: Partial<UserProfile> | null | undefined,
  requestedFromPath?: string
): string {
  // If user specifically requested an authenticated path (e.g. /settings, /profile, /interview/123), preserve it
  if (
    requestedFromPath &&
    requestedFromPath !== '/login' &&
    requestedFromPath !== '/signup' &&
    requestedFromPath !== '/'
  ) {
    return requestedFromPath;
  }

  return isOnboardingComplete(profile) ? '/dashboard' : '/setup';
}

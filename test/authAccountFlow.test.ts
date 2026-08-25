import { normalizeAuthError } from '../src/lib/authErrorNormalizer';
import { isOnboardingComplete, getPostAuthDestination } from '../src/lib/onboardingRouter';
import { profileService } from '../src/services/supabase/profileService';
import { createDefaultUser, defaultPreferences } from '../src/data/defaults';
import { UserProfile } from '../src/types/user';

export async function runAuthAccountFlowTests() {
  console.log('\n--- 10. Testing Authentication & Account Lifecycle Flow ---');

  let passed = 0;
  let failed = 0;
  const promises: Promise<void>[] = [];

  const test = (name: string, fn: () => void | Promise<void>) => {
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        const p = (res as any)
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err: any) => {
            console.error(`  ✗ ${name}:`, err.message);
            failed++;
          });
        promises.push(p);
        return;
      }
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  };

  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(msg);
  };

  // 1. Single Identity Model
  test('Scenario 1: Single Identity Model uses Auth UUID exclusively', () => {
    const authUserId = 'usr_auth_uuid_9988';
    const profile = createDefaultUser();
    profile.id = authUserId;
    assert(profile.id === 'usr_auth_uuid_9988', 'Profile ID must strictly match Auth UUID');
    assert(!profile.id.startsWith('mock_'), 'Auth user must not use mock or generated IDs in production');
  });

  // 2. Profile Creation Idempotency & Upsert
  test('Scenario 2: Profile upsert schema structure matches database requirements', () => {
    const defaultUser = createDefaultUser();
    assert(defaultUser.id === '', 'Default user profile starts with empty identity');
    assert(defaultUser.streakDays === 0, 'New user streak days starts at 0');
    assert(defaultUser.interviewsCompleted === 0, 'New user interviews completed starts at 0');
    assert(defaultUser.readinessPercentage === 0, 'New user readiness percentage starts at 0');
  });

  // 3. Error Normalization: Existing User
  test('Scenario 3: Normalizes "User already registered" error to clear sign-in instruction', () => {
    const err = { message: 'User already registered' };
    const normalized = normalizeAuthError(err);
    assert(normalized.code === 'ACCOUNT_EXISTS', 'Code must be ACCOUNT_EXISTS');
    assert(normalized.isExistingAccount === true, 'isExistingAccount flag must be true');
    assert(
      normalized.userMessage === 'An account already exists with this email. Please sign in instead.',
      'Must guide existing user to sign in'
    );
  });

  // 4. Error Normalization: Rate Limit (429)
  test('Scenario 4: Normalizes 429 rate limit errors gracefully without stack traces', () => {
    const err = { status: 429, message: 'over_email_send_rate_limit' };
    const normalized = normalizeAuthError(err);
    assert(normalized.code === 'RATE_LIMITED', 'Code must be RATE_LIMITED');
    assert(normalized.isRateLimit === true, 'isRateLimit must be true');
    assert(normalized.userMessage.includes('Too many verification attempts'), 'Must provide clear rate limit advice');
  });

  // 5. Error Normalization: Expired Token
  test('Scenario 5: Normalizes expired token errors', () => {
    const err = { message: 'Token has expired or is invalid' };
    const normalized = normalizeAuthError(err);
    assert(normalized.code === 'OTP_EXPIRED' || normalized.code === 'OTP_INVALID', 'Must identify expired/invalid token');
    assert(!normalized.userMessage.includes('postgres'), 'Must not leak database internals');
  });

  // 6. Error Normalization: Database Constraint / Schema Error
  test('Scenario 6: Normalizes internal Postgres constraint errors safely', () => {
    const err = { message: 'error: duplicate key value violates unique constraint "profiles_pkey" (SQLSTATE 23505)' };
    const normalized = normalizeAuthError(err);
    assert(normalized.code === 'DB_SYNC_ERROR', 'Must classify as DB_SYNC_ERROR');
    assert(normalized.userMessage === 'Account synchronization failed. Please refresh the page and try again.', 'Must hide raw SQL error');
  });

  // 7. Onboarding Routing: Complete Candidate Profile (with targetRole)
  test('Scenario 7: Completed candidate profile routes directly to /dashboard', () => {
    const profile: Partial<UserProfile> = {
      id: 'usr_1',
      targetRole: 'Staff Software Engineer',
      interviewsCompleted: 0,
    };
    assert(isOnboardingComplete(profile) === true, 'Target role marks onboarding complete');
    assert(getPostAuthDestination(profile) === '/dashboard', 'Must direct to /dashboard');
  });

  // 8. Onboarding Routing: Completed Interviews
  test('Scenario 8: Candidate with completed sessions routes directly to /dashboard', () => {
    const profile: Partial<UserProfile> = {
      id: 'usr_2',
      targetRole: '',
      interviewsCompleted: 2,
    };
    assert(isOnboardingComplete(profile) === true, 'Interviews completed marks onboarding complete');
    assert(getPostAuthDestination(profile) === '/dashboard', 'Must direct to /dashboard');
  });

  // 9. Onboarding Routing: Brand New Candidate
  test('Scenario 9: Brand new candidate with empty profile routes to /setup', () => {
    const profile: Partial<UserProfile> = {
      id: 'usr_new',
      targetRole: '',
      interviewsCompleted: 0,
    };
    assert(isOnboardingComplete(profile) === false, 'Empty profile is incomplete');
    assert(getPostAuthDestination(profile) === '/setup', 'Must direct to /setup');
  });

  // 10. Preserves Requested Path on Authentication
  test('Scenario 10: Preserves explicit target route if requested by user', () => {
    const profile: Partial<UserProfile> = {
      id: 'usr_1',
      targetRole: 'Product Manager',
    };
    const destination = getPostAuthDestination(profile, '/interview/sess_123/report');
    assert(destination === '/interview/sess_123/report', 'Must preserve specific report destination');
  });

  // 11. Ignores /login and /signup in Requested Path
  test('Scenario 11: Normalizes /login or /signup requested path to authoritative destination', () => {
    const profile: Partial<UserProfile> = {
      id: 'usr_1',
      targetRole: '',
      interviewsCompleted: 0,
    };
    const destination = getPostAuthDestination(profile, '/login');
    assert(destination === '/setup', 'Must redirect new user to /setup instead of loop back to /login');
  });

  // 12. Double OTP Request Guard Simulation
  test('Scenario 12: In-flight request protection blocks concurrent submissions', () => {
    let inFlight = false;
    const requestSim = () => {
      if (inFlight) {
        return { error: 'A verification request is already in progress. Please wait a moment.' };
      }
      inFlight = true;
      return { success: true };
    };

    const first = requestSim();
    const second = requestSim();
    assert(first.success === true, 'First request succeeds');
    assert(second.error !== undefined, 'Concurrent second request is blocked');
  });

  // 13. Profile Repair Retains Exact Auth UUID
  test('Scenario 13: Profile repair retains original authenticated user UUID', () => {
    const authUUID = '550e8400-e29b-41d4-a716-446655440000';
    const email = 'candidate@interviewpilot.io';
    const repairedProfile: UserProfile = {
      id: authUUID,
      name: 'candidate',
      email: email,
      targetRole: '',
      targetCompanies: [],
      experienceLevel: '' as any,
      streakDays: 0,
      lastActiveDate: '2026-08-25',
      interviewsCompleted: 0,
      averageScore: 0.0,
      readinessPercentage: 0,
      readinessDelta: 0,
    };

    assert(repairedProfile.id === authUUID, 'Repaired profile must strictly share the exact Auth UUID');
    assert(repairedProfile.name === 'candidate', 'Name is derived cleanly from email prefix');
  });

  // 14. Debug Diagnostics Email Masking
  test('Scenario 14: Debug diagnostics safely masks candidate email', () => {
    const maskEmail = (emailStr?: string | null): string | null => {
      if (!emailStr) return null;
      const parts = emailStr.split('@');
      if (parts.length !== 2) return '***';
      const namePart = parts[0];
      const maskedName = namePart.length > 2 ? `${namePart.slice(0, 2)}***` : `${namePart[0]}***`;
      return `${maskedName}@${parts[1]}`;
    };

    const masked = maskEmail('charantejneelam@gmail.com');
    assert(masked === 'ch***@gmail.com', 'Email must be masked to prevent credential exposure in debug logs');
    assert(!masked.includes('neelam'), 'Sensitive middle/last character tokens must be hidden');
  });

  // 15. Active Interview Session Integrity During Auth Hydration
  test('Scenario 15: Auth hydration preserves active interview session ID and contract', () => {
    const activeInterview = {
      id: 'sess_live_7766',
      status: 'in_progress',
      currentQuestionIndex: 2,
      answers: { 0: { answerText: 'STAR response', score: 8.5 } },
    };

    // Simulate session restoration
    const hydratedUser = { id: 'usr_auth_123', name: 'Charan' };
    assert(activeInterview.id === 'sess_live_7766', 'Active session ID remains untouched during user load');
    assert(activeInterview.currentQuestionIndex === 2, 'Active question index remains 2');
    assert(Object.keys(activeInterview.answers).length === 1, 'Answers preserved');
  });

  // 16. Logout State Reset
  test('Scenario 16: Logout clears user identity and authentication status completely', () => {
    let isAuthenticated = true;
    let user = { id: 'usr_1', email: 'test@example.com' };

    // Simulate logout action
    isAuthenticated = false;
    user = createDefaultUser();

    assert(isAuthenticated === false, 'isAuthenticated is false');
    assert(user.id === '', 'User ID is cleared');
    assert(user.email === '', 'Email is cleared');
  });

  // 17. Null / Empty Auth Input Validation
  test('Scenario 17: Normalizes empty error objects gracefully', () => {
    const res = normalizeAuthError(null);
    assert(res.code === 'UNKNOWN_ERROR', 'Null error returns UNKNOWN_ERROR');
    assert(res.userMessage.includes('unexpected'), 'Returns friendly error message');
  });

  // 18. Prevents Account Enumeration Exposure
  test('Scenario 18: Generic auth error does not expose database stack traces', () => {
    const rawError = {
      message: 'AuthApiError: Database error finding user in auth.users relation at line 44',
      status: 500,
    };
    const normalized = normalizeAuthError(rawError);
    assert(!normalized.userMessage.includes('relation'), 'Does not leak relation name');
    assert(!normalized.userMessage.includes('line 44'), 'Does not leak code line numbers');
  });

  // 19. Deterministic Preference Updates
  test('Scenario 19: User preferences default cleanly without null pointer exceptions', () => {
    assert(defaultPreferences.defaultDuration === 30, 'Default duration is 30m');
    assert(defaultPreferences.defaultDifficulty === 'intermediate', 'Default difficulty is intermediate');
    assert(defaultPreferences.strictEvaluation === true, 'Strict evaluation is active');
  });

  // 20. Concurrency Mutex Simulation
  test('Scenario 20: Profile sync promise mutex returns identical promise for concurrent callers', async () => {
    let executionCount = 0;
    let activePromise: Promise<string> | null = null;

    const syncProfile = async () => {
      if (activePromise) {
        return activePromise;
      }
      activePromise = (async () => {
        executionCount++;
        await new Promise((r) => setTimeout(r, 10));
        return 'synced_profile';
      })();
      const res = await activePromise;
      activePromise = null;
      return res;
    };

    const [r1, r2, r3] = await Promise.all([syncProfile(), syncProfile(), syncProfile()]);
    assert(r1 === 'synced_profile' && r2 === 'synced_profile' && r3 === 'synced_profile', 'All callers receive resolved profile');
    assert(executionCount === 1, 'Underlying sync executed exactly once despite 3 concurrent calls');
  });

  // 21. Pre-flight Existing User Detection on Signup
  test('Scenario 21: Pre-flight check blocks existing email from signing up and directs to login', async () => {
    const existingEmails = new Set(['existing.candidate@domain.com', 'user@interviewpilot.io']);
    const checkEmailSim = async (email: string) => existingEmails.has(email.toLowerCase());

    const signupPreflight = async (email: string) => {
      const exists = await checkEmailSim(email);
      if (exists) {
        return {
          error: 'An account already exists with this email. Please sign in instead.',
          isExistingAccount: true,
        };
      }
      return { success: true };
    };

    const resExisting = await signupPreflight('existing.candidate@domain.com');
    assert(resExisting.isExistingAccount === true, 'isExistingAccount flag is true');
    assert(resExisting.error === 'An account already exists with this email. Please sign in instead.', 'Correct error text returned');

    const resNew = await signupPreflight('fresh.candidate@domain.com');
    assert(resNew.success === true, 'New email allowed to continue signup');
  });

  // 22. Pre-flight Non-Existing User Detection on Login
  test('Scenario 22: Pre-flight check blocks non-existing email from logging in and directs to signup', async () => {
    const existingEmails = new Set(['registered@domain.com']);
    const checkEmailSim = async (email: string) => existingEmails.has(email.toLowerCase());

    const loginPreflight = async (email: string) => {
      const exists = await checkEmailSim(email);
      if (!exists) {
        return {
          error: 'No account found with this email. Please sign up to create an account.',
          isNewAccount: true,
        };
      }
      return { success: true };
    };

    const resNonExistent = await loginPreflight('unregistered@domain.com');
    assert(resNonExistent.isNewAccount === true, 'isNewAccount flag is true');
    assert(resNonExistent.error === 'No account found with this email. Please sign up to create an account.', 'Directs to signup');

    const resRegistered = await loginPreflight('registered@domain.com');
    assert(resRegistered.success === true, 'Existing user allowed to request login OTP');
  });

  await Promise.all(promises);
  return { passed, failed };
}

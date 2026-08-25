/**
 * Authentication Error Normalizer
 * Converts raw Supabase / Postgres / Network errors into clean, secure, user-friendly messages.
 * Prevents leaking raw internal Postgres stack traces or database schema internals.
 */

export interface NormalizedAuthError {
  userMessage: string;
  code: string;
  isExistingAccount?: boolean;
  isRateLimit?: boolean;
}

export function normalizeAuthError(error: any): NormalizedAuthError {
  if (!error) {
    return {
      userMessage: 'An unexpected authentication issue occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
    };
  }

  const rawMsg = (typeof error === 'string' ? error : error.message || error.error_description || '').toLowerCase();
  const status = error.status || (error.response && error.response.status);

  // 1. Existing Account / User already registered
  if (
    rawMsg.includes('user already registered') ||
    rawMsg.includes('email already in use') ||
    rawMsg.includes('already exists') ||
    rawMsg.includes('user_already_exists')
  ) {
    return {
      userMessage: 'An account already exists with this email. Please sign in instead.',
      code: 'ACCOUNT_EXISTS',
      isExistingAccount: true,
    };
  }

  // 2. Rate Limiting / Too Many Attempts
  if (
    status === 429 ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('over_email_send_rate_limit') ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('security purposes')
  ) {
    return {
      userMessage: 'Too many verification attempts. Please wait a minute before requesting another code.',
      code: 'RATE_LIMITED',
      isRateLimit: true,
    };
  }

  // 3. Invalid or Incorrect OTP Token
  if (
    rawMsg.includes('invalid') ||
    rawMsg.includes('incorrect') ||
    rawMsg.includes('wrong') ||
    rawMsg.includes('token is invalid') ||
    rawMsg.includes('token has expired or is invalid') ||
    rawMsg.includes('bad_jwt') ||
    rawMsg.includes('otp_invalid')
  ) {
    return {
      userMessage: 'Incorrect verification code. Please check the 6-digit code and try again.',
      code: 'OTP_INVALID',
    };
  }

  // 4. Specifically Expired OTP Token
  if (
    rawMsg.includes('expired') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('token has expired') ||
    rawMsg.includes('otp_expired')
  ) {
    return {
      userMessage: 'The verification code has expired. Please request a fresh one-time code.',
      code: 'OTP_EXPIRED',
    };
  }

  // 4. Invalid Email / Empty Email
  if (rawMsg.includes('invalid email') || rawMsg.includes('unable to validate email address')) {
    return {
      userMessage: 'Please provide a valid, well-formatted email address.',
      code: 'INVALID_EMAIL',
    };
  }

  // 5. SMTP / Email Delivery
  if (status === 500 || rawMsg.includes('error sending') || rawMsg.includes('smtp')) {
    return {
      userMessage: 'Failed to deliver verification email. Please verify email delivery settings or try again.',
      code: 'DELIVERY_FAILED',
    };
  }

  // 6. Network / Offline
  if (rawMsg.includes('network') || rawMsg.includes('fetch') || rawMsg.includes('failed to fetch')) {
    return {
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // 7. Database / Postgres Constraint
  if (rawMsg.includes('postgres') || rawMsg.includes('schema') || rawMsg.includes('23505') || rawMsg.includes('violates foreign key')) {
    return {
      userMessage: 'Account synchronization failed. Please refresh the page and try again.',
      code: 'DB_SYNC_ERROR',
    };
  }

  return {
    userMessage: error.message || 'Authentication failed. Please verify your credentials and try again.',
    code: 'AUTH_GENERIC',
  };
}

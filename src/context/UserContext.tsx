import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserPreferences } from '../types/user';
import { createDefaultUser, defaultPreferences } from '../data/defaults';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/supabase/profileService';
import { storage } from '../lib/storage';
import { normalizeAuthError } from '../lib/authErrorNormalizer';
import { isOnboardingComplete } from '../lib/onboardingRouter';

export interface AuthDiagnosticsData {
  authStatus: 'initializing' | 'authenticated' | 'unauthenticated';
  authUserId: string | null;
  maskedEmail: string | null;
  profileExists: boolean;
  profileId: string | null;
  onboardingComplete: boolean;
  profileSyncState: 'synced' | 'repairing' | 'idle' | 'failed';
  lastAuthEvent: string;
}

export interface UserContextType {
  user: UserProfile;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authStatus: 'initializing' | 'authenticated' | 'unauthenticated';
  isRequestingOtp: boolean;
  isVerifyingOtp: boolean;
  cooldownRemaining: number;
  onboardingComplete: boolean;
  diagnostics: AuthDiagnosticsData;
  requestOtp: (email: string, name?: string) => Promise<{ error?: string; isExistingAccount?: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string; user?: UserProfile }>;
  resendOtp: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (newProfile: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => storage.get('user_profile', createDefaultUser()));
  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    storage.get('user_preferences', defaultPreferences)
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    storage.get('is_authenticated', false)
  );
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<'initializing' | 'authenticated' | 'unauthenticated'>('initializing');
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [profileSyncState, setProfileSyncState] = useState<'synced' | 'repairing' | 'idle' | 'failed'>('idle');
  const [lastAuthEvent, setLastAuthEvent] = useState<string>('INIT');

  const cooldownExpiresAtRef = useRef<number>(0);
  const inFlightRequestRef = useRef<boolean>(false);
  const inFlightVerifyRef = useRef<boolean>(false);
  const profileSyncPromiseRef = useRef<Promise<UserProfile | null> | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Authoritative Single Profile Fetcher / Upserter with Mutex Guard
  const fetchUserProfile = async (userId: string, email?: string): Promise<UserProfile | null> => {
    if (!userId) return null;

    // If an identical sync is already in flight, await it instead of executing duplicate API calls
    if (profileSyncPromiseRef.current) {
      await profileSyncPromiseRef.current;
      return user;
    }

    const syncPromise = (async () => {
      setProfileSyncState('repairing');
      try {
        const data = await profileService.getProfile(userId, email);
        if (data) {
          setUser(data.profile);
          setPreferences(data.preferences);
          setIsAuthenticated(true);
          setAuthStatus('authenticated');
          setProfileSyncState('synced');
          storage.set('user_profile', data.profile);
          storage.set('user_preferences', data.preferences);
          storage.set('is_authenticated', true);
          return data.profile;
        }
        return null;
      } catch (err) {
        console.error('[UserContext] Profile synchronization error:', err);
        setProfileSyncState('failed');
        return null;
      } finally {
        profileSyncPromiseRef.current = null;
      }
    })();

    profileSyncPromiseRef.current = syncPromise;
    const result = await syncPromise;
    return result;
  };

  // Cooldown countdown interval runner
  const startCooldownTimer = (durationSeconds = 60) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    const expiresAt = Date.now() + durationSeconds * 1000;
    cooldownExpiresAtRef.current = expiresAt;
    setCooldownRemaining(durationSeconds);

    cooldownTimerRef.current = setInterval(() => {
      const left = Math.ceil((cooldownExpiresAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setCooldownRemaining(0);
        cooldownExpiresAtRef.current = 0;
        if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
      } else {
        setCooldownRemaining(left);
      }
    }, 1000);
  };

  // Main Auth Lifecycle Listener
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setLastAuthEvent('INITIAL_SESSION');
          await fetchUserProfile(session.user.id, session.user.email);
        } else if (isMounted) {
          setIsAuthenticated(false);
          setAuthStatus('unauthenticated');
          storage.set('is_authenticated', false);
        }
      } catch (err) {
        console.error('[UserContext] Initial session check failed:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthStatus('unauthenticated');
        }
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setLastAuthEvent(event);

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAuthStatus('unauthenticated');
        const emptyUser = createDefaultUser();
        setUser(emptyUser);
        storage.set('is_authenticated', false);
        storage.set('user_profile', emptyUser);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  /**
   * Request email OTP for login or signup with app-level rate-limit guards.
   */
  const requestOtp = async (
    email: string,
    name?: string
  ): Promise<{ error?: string; isExistingAccount?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { error: 'Please provide a valid email address.' };
    }

    // 1. In-flight guard: prevent concurrent or double-click requests
    if (inFlightRequestRef.current || isRequestingOtp) {
      return { error: 'A verification request is already in progress. Please wait a moment.' };
    }

    // 2. Cooldown guard: prevent request if 60-second cooldown is still active
    const now = Date.now();
    if (cooldownExpiresAtRef.current > now) {
      const remaining = Math.ceil((cooldownExpiresAtRef.current - now) / 1000);
      return { error: `Please wait ${remaining} seconds before requesting another code.` };
    }

    inFlightRequestRef.current = true;
    setIsRequestingOtp(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          data: name?.trim()
            ? {
                full_name: name.trim(),
                name: name.trim(),
              }
            : undefined,
        },
      });

      if (error) {
        const normalized = normalizeAuthError(error);
        return {
          error: normalized.userMessage,
          isExistingAccount: normalized.isExistingAccount,
        };
      }

      // Start 60-second cooldown only after a successful request
      startCooldownTimer(60);
      return {};
    } catch (err: any) {
      const normalized = normalizeAuthError(err);
      return {
        error: normalized.userMessage,
        isExistingAccount: normalized.isExistingAccount,
      };
    } finally {
      inFlightRequestRef.current = false;
      setIsRequestingOtp(false);
    }
  };

  /**
   * Resend OTP for the provided email address.
   */
  const resendOtp = async (email: string): Promise<{ error?: string }> => {
    return requestOtp(email);
  };

  /**
   * Verify the 6-digit email OTP.
   */
  const verifyOtp = async (
    email: string,
    token: string
  ): Promise<{ error?: string; user?: UserProfile }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail) {
      return { error: 'Email is required for verification.' };
    }
    if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8) {
      return { error: 'Please enter the complete verification code.' };
    }

    if (inFlightVerifyRef.current || isVerifyingOtp) {
      return { error: 'Verification is in progress. Please wait a moment.' };
    }

    inFlightVerifyRef.current = true;
    setIsVerifyingOtp(true);

    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error && (error.message.toLowerCase().includes('type') || error.message.toLowerCase().includes('invalid otp type'))) {
        const signupRes = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'signup',
        });
        if (!signupRes.error) {
          data = signupRes.data;
          error = null;
        }
      }

      if (error) {
        const normalized = normalizeAuthError(error);
        return { error: normalized.userMessage };
      }

      let profileResult: UserProfile | null = null;
      if (data?.user) {
        profileResult = await fetchUserProfile(data.user.id, data.user.email);
      }

      return { user: profileResult || undefined };
    } catch (err: any) {
      const normalized = normalizeAuthError(err);
      return { error: normalized.userMessage };
    } finally {
      inFlightVerifyRef.current = false;
      setIsVerifyingOtp(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[UserContext] Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAuthStatus('unauthenticated');
      const emptyUser = createDefaultUser();
      setUser(emptyUser);
      storage.set('is_authenticated', false);
      storage.set('user_profile', emptyUser);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    storage.set('user_preferences', updated);

    if (isAuthenticated && user.id && !user.id.startsWith('mock_')) {
      try {
        await profileService.updatePreferences(user.id, updated);
      } catch (err) {
        console.error('[UserContext] Failed to sync preferences to Supabase:', err);
      }
    }
  };

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    const updated = { ...user, ...newProfile };
    setUser(updated);
    storage.set('user_profile', updated);

    if (isAuthenticated && user.id && !user.id.startsWith('mock_')) {
      try {
        await profileService.updateProfile(user.id, updated);
      } catch (err) {
        console.error('[UserContext] Failed to sync profile to Supabase:', err);
      }
    }
  };

  const refreshProfile = async () => {
    if (isAuthenticated && user.id) {
      await fetchUserProfile(user.id, user.email);
    }
  };

  const onboardingComplete = isOnboardingComplete(user);

  // Masked email for debug diagnostics
  const maskEmail = (emailStr?: string | null): string | null => {
    if (!emailStr) return null;
    const parts = emailStr.split('@');
    if (parts.length !== 2) return '***';
    const namePart = parts[0];
    const maskedName = namePart.length > 2 ? `${namePart.slice(0, 2)}***` : `${namePart[0]}***`;
    return `${maskedName}@${parts[1]}`;
  };

  const diagnostics: AuthDiagnosticsData = {
    authStatus,
    authUserId: user.id || null,
    maskedEmail: maskEmail(user.email),
    profileExists: Boolean(user.id),
    profileId: user.id || null,
    onboardingComplete,
    profileSyncState,
    lastAuthEvent,
  };

  return (
    <UserContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated,
        isLoadingAuth,
        authStatus,
        isRequestingOtp,
        isVerifyingOtp,
        cooldownRemaining,
        onboardingComplete,
        diagnostics,
        requestOtp,
        verifyOtp,
        resendOtp,
        logout,
        updatePreferences,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

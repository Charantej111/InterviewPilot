import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserPreferences } from '../types/user';
import { createDefaultUser, defaultPreferences } from '../data/defaults';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/supabase/profileService';
import { storage } from '../lib/storage';

interface UserContextType {
  user: UserProfile;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isRequestingOtp: boolean;
  cooldownRemaining: number;
  requestOtp: (email: string, name?: string) => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
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
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const cooldownExpiresAtRef = useRef<number>(0);
  const inFlightRequestRef = useRef<boolean>(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch or create profile idempotently
  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const data = await profileService.getProfile(userId, email);
      if (data) {
        setUser(data.profile);
        setPreferences(data.preferences);
        setIsAuthenticated(true);
        storage.set('user_profile', data.profile);
        storage.set('user_preferences', data.preferences);
        storage.set('is_authenticated', true);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
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

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else if (isMounted) {
          setIsAuthenticated(false);
          storage.set('is_authenticated', false);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
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
  const requestOtp = async (email: string, name?: string): Promise<{ error?: string }> => {
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
        const errorMsg = error.message.toLowerCase();
        const status = (error as any).status;
        if (status === 429 || errorMsg.includes('rate limit') || errorMsg.includes('over_email_send_rate_limit')) {
          return { error: 'Too many verification attempts. Please wait before requesting another code.' };
        }
        if (status === 500 || errorMsg.includes('error sending') || errorMsg.includes('smtp')) {
          return { error: 'Failed to deliver verification email. Please verify that your Supabase SMTP sender email matches your provider configuration (e.g. onboarding@resend.dev for Resend).' };
        }
        return { error: error.message };
      }

      // Start 60-second cooldown only after a successful request
      startCooldownTimer(60);
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to send verification code. Please try again.' };
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
  const verifyOtp = async (email: string, token: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail) {
      return { error: 'Email is required for verification.' };
    }
    if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8) {
      return { error: 'Please enter the complete verification code.' };
    }

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
        const msg = error.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('timeout')) {
          return { error: 'The verification code has expired. Please request a new one.' };
        }
        if (msg.includes('invalid') || msg.includes('incorrect')) {
          return { error: 'Invalid verification code. Please check and try again.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, data.user.email);
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Verification failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
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
        console.error('Failed to sync preferences to Supabase:', err);
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
        console.error('Failed to sync profile to Supabase:', err);
      }
    }
  };

  const refreshProfile = async () => {
    if (isAuthenticated && user.id) {
      await fetchUserProfile(user.id, user.email);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated,
        isLoadingAuth,
        isRequestingOtp,
        cooldownRemaining,
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

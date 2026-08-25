import { supabase } from '../../lib/supabase';
import { UserProfile, UserPreferences } from '../../types/user';
import { defaultPreferences } from '../../data/defaults';
import { Database, Json } from '../../types/database.types';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  /**
   * Authoritative, idempotent profile loader.
   * If a profile row does not exist for the authenticated userId, it initializes a clean default row using upsert.
   */
  async getProfile(userId: string, authEmail?: string): Promise<{ profile: UserProfile; preferences: UserPreferences } | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile from Supabase:', error);
      throw error;
    }

    if (!data) {
      // If profile does not exist yet, create initial profile idempotently using upsert
      return this.repairProfile(userId, authEmail);
    }

    const prefs = (data.preferences as unknown as UserPreferences) || defaultPreferences;

    return {
      profile: {
        id: data.id,
        name: data.full_name || (authEmail ? authEmail.split('@')[0] : 'Candidate'),
        email: authEmail || '',
        avatarUrl: data.avatar_url || undefined,
        targetRole: data.target_role || '',
        targetCompanies: data.target_companies || [],
        experienceLevel: (data.experience_level as UserProfile['experienceLevel']) || '',
        streakDays: data.streak_days || 0,
        lastActiveDate: data.last_active_date || new Date().toISOString().split('T')[0],
        interviewsCompleted: data.interviews_completed || 0,
        averageScore: Number(data.average_score) || 0.0,
        readinessPercentage: data.readiness_percentage || 0,
        readinessDelta: data.readiness_delta || 0,
      },
      preferences: prefs,
    };
  },

  /**
   * Safely repairs or initializes a missing profile for an existing authenticated Supabase user.
   * Uses ON CONFLICT (id) DO NOTHING/UPDATE to guarantee idempotency under concurrent invocations.
   */
  async repairProfile(userId: string, authEmail?: string): Promise<{ profile: UserProfile; preferences: UserPreferences }> {
    const defaultName = authEmail ? authEmail.split('@')[0] : 'Candidate';
    const newProfile: ProfileInsert = {
      id: userId,
      full_name: defaultName,
      target_role: '',
      target_companies: [],
      experience_level: '',
      streak_days: 0,
      last_active_date: new Date().toISOString().split('T')[0],
      interviews_completed: 0,
      average_score: 0.0,
      readiness_percentage: 0,
      readiness_delta: 0,
      preferences: defaultPreferences as unknown as Json,
    };

    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      // If the error is foreign key violation (23503), it means userId is not present in auth.users
      if ((upsertError as any).code === '23503') {
        console.warn('[profileService] User ID is not present in auth.users (foreign key 23503):', userId);
        return {
          profile: {
            id: userId,
            name: defaultName,
            email: authEmail || '',
            avatarUrl: undefined,
            targetRole: '',
            targetCompanies: [],
            experienceLevel: '' as any,
            streakDays: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
            interviewsCompleted: 0,
            averageScore: 0.0,
            readinessPercentage: 0,
            readinessDelta: 0,
          },
          preferences: defaultPreferences,
        };
      }

      // In case of race condition where another concurrent worker completed upsert, re-query once
      const { data: retryData, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (retryError || !retryData) {
        console.error('Error repairing/upserting profile row:', upsertError);
        throw upsertError;
      }

      return {
        profile: {
          id: retryData.id,
          name: retryData.full_name || defaultName,
          email: authEmail || '',
          avatarUrl: retryData.avatar_url || undefined,
          targetRole: retryData.target_role || '',
          targetCompanies: retryData.target_companies || [],
          experienceLevel: (retryData.experience_level as UserProfile['experienceLevel']) || '',
          streakDays: retryData.streak_days || 0,
          lastActiveDate: retryData.last_active_date || new Date().toISOString().split('T')[0],
          interviewsCompleted: retryData.interviews_completed || 0,
          averageScore: Number(retryData.average_score) || 0.0,
          readinessPercentage: retryData.readiness_percentage || 0,
          readinessDelta: retryData.readiness_delta || 0,
        },
        preferences: (retryData.preferences as unknown as UserPreferences) || defaultPreferences,
      };
    }

    return {
      profile: {
        id: upserted.id,
        name: upserted.full_name || defaultName,
        email: authEmail || '',
        avatarUrl: upserted.avatar_url || undefined,
        targetRole: upserted.target_role || '',
        targetCompanies: upserted.target_companies || [],
        experienceLevel: (upserted.experience_level as UserProfile['experienceLevel']) || '',
        streakDays: upserted.streak_days || 0,
        lastActiveDate: upserted.last_active_date || new Date().toISOString().split('T')[0],
        interviewsCompleted: upserted.interviews_completed || 0,
        averageScore: Number(upserted.average_score) || 0.0,
        readinessPercentage: upserted.readiness_percentage || 0,
        readinessDelta: upserted.readiness_delta || 0,
      },
      preferences: (upserted.preferences as unknown as UserPreferences) || defaultPreferences,
    };
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const dbUpdates: ProfileUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.targetRole !== undefined) dbUpdates.target_role = updates.targetRole;
    if (updates.targetCompanies !== undefined) dbUpdates.target_companies = updates.targetCompanies;
    if (updates.experienceLevel !== undefined) dbUpdates.experience_level = updates.experienceLevel;
    if (updates.streakDays !== undefined) dbUpdates.streak_days = updates.streakDays;
    if (updates.interviewsCompleted !== undefined) dbUpdates.interviews_completed = updates.interviewsCompleted;
    if (updates.averageScore !== undefined) dbUpdates.average_score = updates.averageScore;
    if (updates.readinessPercentage !== undefined) dbUpdates.readiness_percentage = updates.readinessPercentage;
    if (updates.readinessDelta !== undefined) dbUpdates.readiness_delta = updates.readinessDelta;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: preferences as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating preferences in Supabase:', error);
      throw error;
    }
  },

  /**
   * Checks whether an account exists in the database for the given email address via secure RPC.
   * Never leaks user tokens, passwords, or personal details.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;

    try {
      const { data, error } = await (supabase.rpc as any)('check_user_exists', {
        lookup_email: cleanEmail,
      });

      if (error) {
        console.warn('[profileService] check_user_exists warning:', error);
        return false;
      }

      return Boolean(data);
    } catch (err) {
      console.warn('[profileService] check_user_exists exception:', err);
      return false;
    }
  },
};

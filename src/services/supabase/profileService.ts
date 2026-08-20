import { supabase } from '../../lib/supabase';
import { UserProfile, UserPreferences } from '../../types/user';
import { defaultPreferences } from '../../data/defaults';
import { Database, Json } from '../../types/database.types';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  async getProfile(userId: string, authEmail?: string): Promise<{ profile: UserProfile; preferences: UserPreferences } | null> {
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
      // If profile does not exist yet, create initial empty profile
      const newProfile: ProfileInsert = {
        id: userId,
        full_name: authEmail ? authEmail.split('@')[0] : 'Candidate',
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

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile row:', insertError);
        throw insertError;
      }

      return {
        profile: {
          id: inserted.id,
          name: inserted.full_name || (authEmail ? authEmail.split('@')[0] : 'Candidate'),
          email: authEmail || '',
          avatarUrl: inserted.avatar_url || undefined,
          targetRole: inserted.target_role || '',
          targetCompanies: inserted.target_companies || [],
          experienceLevel: (inserted.experience_level as UserProfile['experienceLevel']) || '',
          streakDays: inserted.streak_days || 0,
          lastActiveDate: inserted.last_active_date || new Date().toISOString().split('T')[0],
          interviewsCompleted: inserted.interviews_completed || 0,
          averageScore: Number(inserted.average_score) || 0.0,
          readinessPercentage: inserted.readiness_percentage || 0,
          readinessDelta: inserted.readiness_delta || 0,
        },
        preferences: (inserted.preferences as unknown as UserPreferences) || defaultPreferences,
      };
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
};

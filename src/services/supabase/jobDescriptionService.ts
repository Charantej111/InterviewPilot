import { supabase } from '../../lib/supabase';
import { JobProfile, JobDescriptionRecord } from '../../types/jobDescription';
import { Json } from '../../types/database.types';

export const jobDescriptionService = {
  /**
   * Creates or updates a job description record for the authenticated user.
   */
  async saveJobDescription(params: {
    id?: string;
    title: string;
    company: string;
    rawDescription: string;
    parsedRequirements?: JobProfile | null;
    processingStatus?: 'draft' | 'analyzing' | 'completed' | 'failed';
  }): Promise<JobDescriptionRecord> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required to save job description.');
    }

    const jdId = params.id || crypto.randomUUID();
    const status = params.processingStatus || 'completed';

    const { data, error } = await supabase
      .from('job_descriptions')
      .upsert({
        id: jdId,
        user_id: user.id,
        title: params.title.trim(),
        company: params.company.trim(),
        raw_description: params.rawDescription.trim(),
        parsed_requirements: (params.parsedRequirements as unknown as Json) || null,
        processing_status: status,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving job description:', error);
      throw new Error(`Failed to save job description: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      company: data.company,
      rawDescription: data.raw_description,
      parsedRequirements: data.parsed_requirements as unknown as JobProfile | null,
      processingStatus: (data.processing_status as JobDescriptionRecord['processingStatus']) || 'completed',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Retrieves a job description by ID.
   */
  async getJobDescription(id: string): Promise<JobDescriptionRecord | null> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching job description:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      company: data.company,
      rawDescription: data.raw_description,
      parsedRequirements: data.parsed_requirements as unknown as JobProfile | null,
      processingStatus: (data.processing_status as JobDescriptionRecord['processingStatus']) || 'completed',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Retrieves all job descriptions for the authenticated user.
   */
  async getUserJobDescriptions(): Promise<JobDescriptionRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user job descriptions:', error);
      return [];
    }

    return (data || []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      company: d.company,
      rawDescription: d.raw_description,
      parsedRequirements: d.parsed_requirements as unknown as JobProfile | null,
      processingStatus: (d.processing_status as JobDescriptionRecord['processingStatus']) || 'completed',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },
};

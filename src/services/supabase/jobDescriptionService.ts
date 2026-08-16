import { supabase } from '../../lib/supabase';

export interface JobDescriptionRecord {
  id: string;
  userId: string;
  title: string;
  company: string;
  rawDescription: string;
  parsedRequirements: {
    role?: string;
    company?: string;
    level?: string;
    keyResponsibilities?: string[];
    requiredSkills?: string[];
    interviewFocusAreas?: string[];
  } | null;
  processingStatus: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  processingError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const jobDescriptionService = {
  async createJobDescription(
    userId: string,
    title: string,
    company: string,
    rawDescription: string,
    parsedRequirements?: Record<string, unknown>
  ): Promise<JobDescriptionRecord> {
    const defaultParsed = parsedRequirements || {
      role: title || 'Product Manager Intern',
      company: company || 'Acme Corp',
      level: 'Entry / Intern',
      keyResponsibilities: [
        'Drive product discovery through qualitative interviews and quantitative funnel analysis',
        'Partner with engineering & design leads on weekly sprint priorities and PRD specifications',
        'Define experiment goals, hypothesis frameworks, and monitor key launch metrics',
      ],
      requiredSkills: [
        'Product Strategy & User Empathy',
        'Data Analysis & SQL',
        'A/B Experimentation Design',
        'Cross-functional Communication',
      ],
      interviewFocusAreas: [
        'Product Thinking & Problem Decomposition',
        'Analytical Reasoning & Guardrail Metrics',
        'Cross-Functional Conflict & Leadership',
        'Resume Deep Dive on Prior Deliverables',
      ],
    };

    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: userId,
        title: title || 'Target Role',
        company: company || 'Target Company',
        raw_description: rawDescription || '',
        parsed_requirements: defaultParsed as unknown as import('../../types/database.types').Json,
        processing_status: 'completed',
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job description in Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      company: data.company,
      rawDescription: data.raw_description,
      parsedRequirements: data.parsed_requirements as JobDescriptionRecord['parsedRequirements'],
      processingStatus: data.processing_status as JobDescriptionRecord['processingStatus'],
      processingStartedAt: data.processing_started_at,
      processingCompletedAt: data.processing_completed_at,
      processingError: data.processing_error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getJobDescriptionById(id: string): Promise<JobDescriptionRecord | null> {
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
      parsedRequirements: data.parsed_requirements as JobDescriptionRecord['parsedRequirements'],
      processingStatus: data.processing_status as JobDescriptionRecord['processingStatus'],
      processingStartedAt: data.processing_started_at,
      processingCompletedAt: data.processing_completed_at,
      processingError: data.processing_error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

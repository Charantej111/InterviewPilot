import { supabase } from '../../lib/supabase';
import { ResumeData } from '../../types/resume';
import { sampleResume } from '../../data/mockResume';

export interface ResumeRecord {
  id: string;
  userId: string;
  originalFilename: string;
  storagePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  parsedData: Record<string, unknown> | null;
  processingStatus: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  processingError?: string | null;
  createdAt: string;
}

export const resumeService = {
  /**
   * Uploads resume file to Supabase Storage and creates a tracking row in resumes table.
   */
  async uploadAndCreateResume(userId: string, file: File): Promise<ResumeRecord> {
    const resumeId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${resumeId}/${sanitizedFilename}`;
    const fileSizeFormatted = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Failed to upload resume file: ${uploadError.message}`);
    }

    // 2. Insert record into resumes table
    const { data: dbRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        id: resumeId,
        user_id: userId,
        original_filename: file.name,
        storage_path: storagePath,
        file_size_bytes: file.size,
        file_size_formatted: fileSizeFormatted,
        processing_status: 'completed', // For Phase 1, extracted profile is ready
        parsed_data: sampleResume.extractedInfo as unknown as import('../../types/database.types').Json,
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error for resume:', dbError);
      throw new Error(`Failed to save resume record: ${dbError.message}`);
    }

    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      originalFilename: dbRecord.original_filename,
      storagePath: dbRecord.storage_path,
      fileSizeBytes: dbRecord.file_size_bytes || file.size,
      fileSizeFormatted: dbRecord.file_size_formatted || fileSizeFormatted,
      parsedData: dbRecord.parsed_data as Record<string, unknown> | null,
      processingStatus: dbRecord.processing_status as ResumeRecord['processingStatus'],
      processingStartedAt: dbRecord.processing_started_at,
      processingCompletedAt: dbRecord.processing_completed_at,
      processingError: dbRecord.processing_error,
      createdAt: dbRecord.created_at,
    };
  },

  /**
   * Retrieves a resume record by ID.
   */
  async getResumeById(resumeId: string): Promise<ResumeRecord | null> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching resume by ID:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      originalFilename: data.original_filename,
      storagePath: data.storage_path,
      fileSizeBytes: data.file_size_bytes || 0,
      fileSizeFormatted: data.file_size_formatted || '0 KB',
      parsedData: data.parsed_data as Record<string, unknown> | null,
      processingStatus: data.processing_status as ResumeRecord['processingStatus'],
      processingStartedAt: data.processing_started_at,
      processingCompletedAt: data.processing_completed_at,
      processingError: data.processing_error,
      createdAt: data.created_at,
    };
  },

  /**
   * Retrieves all resumes uploaded by a user.
   */
  async getUserResumes(userId: string): Promise<ResumeRecord[]> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user resumes:', error);
      throw error;
    }

    return (data || []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      originalFilename: d.original_filename,
      storagePath: d.storage_path,
      fileSizeBytes: d.file_size_bytes || 0,
      fileSizeFormatted: d.file_size_formatted || '0 KB',
      parsedData: d.parsed_data as Record<string, unknown> | null,
      processingStatus: d.processing_status as ResumeRecord['processingStatus'],
      processingStartedAt: d.processing_started_at,
      processingCompletedAt: d.processing_completed_at,
      processingError: d.processing_error,
      createdAt: d.created_at,
    }));
  },

  /**
   * Helper to format UI ResumeData object from Supabase record or sample.
   */
  toResumeData(record: ResumeRecord): ResumeData {
    return {
      fileName: record.originalFilename,
      fileSize: record.fileSizeFormatted,
      uploadDate: record.createdAt.split('T')[0],
      parsingStatus: record.processingStatus === 'error' ? 'error' : 'completed',
      extractedInfo: (record.parsedData as unknown as ResumeData['extractedInfo']) || sampleResume.extractedInfo,
    };
  }
};

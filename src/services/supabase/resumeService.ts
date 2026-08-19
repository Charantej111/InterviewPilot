import { supabase } from '../../lib/supabase';
import { Json } from '../../types/database.types';

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  originalFilename: string;
  storagePath: string;
  fileType: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  extractedProfile: Json | null;
  parsedData: Json | null;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  processingError?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const resumeService = {
  /**
   * Validates resume file format and file size.
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided.' };
    }

    const lowerName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type);

    if (!hasValidExtension || !hasValidMime) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload a PDF, DOC, or DOCX resume document.',
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`,
      };
    }

    return { valid: true };
  },

  /**
   * Converts file to Base64 data URL / raw base64 string for direct multimodal Gemini parsing.
   */
  async extractFileBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g. "data:application/pdf;base64,")
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Extracts readable text content from an uploaded resume file.
   */
  async extractTextFromFile(file: File): Promise<string> {
    try {
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        return await file.text();
      }
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = textDecoder.decode(uint8);
      
      // Extract text content from PDF text streams if present
      const pdfTextMatches = rawString.match(/\(([^()]+)\)\s*T[jJ]/g);
      if (pdfTextMatches && pdfTextMatches.length > 5) {
        const extracted = pdfTextMatches
          .map((m) => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, ''))
          .join(' ');
        if (extracted.length > 50) {
          return extracted;
        }
      }

      const cleanChars = rawString.replace(/[^\x20-\x7E\t\n\r]/g, ' ');
      const words = cleanChars.split(/\s+/).filter((w) => w.length > 1 && !w.startsWith('/') && !w.includes('obj') && !w.includes('endobj'));
      if (words.length > 15) {
        return words.join(' ');
      }
      return '';
    } catch (err) {
      console.warn('Could not extract raw text from file, using fallback extraction:', err);
      return '';
    }
  },

  /**
   * Uploads a resume to the private 'resumes' Supabase Storage bucket
   * and creates a record in the public.resumes database table.
   */
  async uploadResume(file: File): Promise<ResumeRecord> {
    // 1. Client-side validation
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Obtain current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required. Please sign in to upload your resume.');
    }

    const resumeId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${resumeId}/${sanitizedFilename}`;
    const fileSizeFormatted =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const fileType = file.type || file.name.split('.').pop() || 'application/pdf';

    // 3. Upload file to Supabase private Storage bucket
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Failed to upload resume to storage: ${uploadError.message}`);
    }

    // 4. Create database row in public.resumes
    try {
      const { data: dbRecord, error: dbError } = await supabase
        .from('resumes')
        .insert({
          id: resumeId,
          user_id: user.id,
          file_name: file.name,
          original_filename: file.name,
          storage_path: storagePath,
          file_type: fileType,
          file_size_bytes: file.size,
          file_size_formatted: fileSizeFormatted,
          processing_status: 'uploaded', // Initial status before AI parsing
          extracted_profile: null,
          parsed_data: null,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error for resume:', dbError);
        // Rollback storage upload on database error to avoid orphaned storage files
        await supabase.storage.from('resumes').remove([storagePath]);
        throw new Error(`Failed to create resume database record: ${dbError.message}`);
      }

      return {
        id: dbRecord.id,
        userId: dbRecord.user_id,
        fileName: dbRecord.file_name || dbRecord.original_filename,
        originalFilename: dbRecord.original_filename,
        storagePath: dbRecord.storage_path,
        fileType: dbRecord.file_type || fileType,
        fileSizeBytes: dbRecord.file_size_bytes || file.size,
        fileSizeFormatted: dbRecord.file_size_formatted || fileSizeFormatted,
        processingStatus: (dbRecord.processing_status as ResumeRecord['processingStatus']) || 'uploaded',
        extractedProfile: dbRecord.extracted_profile,
        parsedData: dbRecord.parsed_data,
        processingStartedAt: dbRecord.processing_started_at,
        processingCompletedAt: dbRecord.processing_completed_at,
        processingError: dbRecord.processing_error,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
      };
    } catch (err: any) {
      // Ensure storage rollback on any unhandled failure
      await supabase.storage.from('resumes').remove([storagePath]).catch(() => {});
      throw err;
    }
  },

  /**
   * Retrieves all resumes uploaded by the current authenticated user.
   */
  async getUserResumes(): Promise<ResumeRecord[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required.');
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user resumes:', error);
      throw new Error(`Failed to fetch resumes: ${error.message}`);
    }

    return (data || []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      fileName: d.file_name || d.original_filename,
      originalFilename: d.original_filename,
      storagePath: d.storage_path,
      fileType: d.file_type || 'application/pdf',
      fileSizeBytes: d.file_size_bytes || 0,
      fileSizeFormatted: d.file_size_formatted || '0 KB',
      processingStatus: (d.processing_status as ResumeRecord['processingStatus']) || 'uploaded',
      extractedProfile: d.extracted_profile,
      parsedData: d.parsed_data,
      processingStartedAt: d.processing_started_at,
      processingCompletedAt: d.processing_completed_at,
      processingError: d.processing_error,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },

  /**
   * Retrieves a single resume by its ID.
   */
  async getResume(resumeId: string): Promise<ResumeRecord | null> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching resume by ID:', error);
      throw new Error(`Failed to fetch resume: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      fileName: data.file_name || data.original_filename,
      originalFilename: data.original_filename,
      storagePath: data.storage_path,
      fileType: data.file_type || 'application/pdf',
      fileSizeBytes: data.file_size_bytes || 0,
      fileSizeFormatted: data.file_size_formatted || '0 KB',
      processingStatus: (data.processing_status as ResumeRecord['processingStatus']) || 'uploaded',
      extractedProfile: data.extracted_profile,
      parsedData: data.parsed_data,
      processingStartedAt: data.processing_started_at,
      processingCompletedAt: data.processing_completed_at,
      processingError: data.processing_error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Deletes a resume from Storage and the database.
   */
  async deleteResume(resumeId: string): Promise<void> {
    const resume = await this.getResume(resumeId);
    if (!resume) return;

    // 1. Delete from Supabase Storage
    if (resume.storagePath) {
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.storagePath]);

      if (storageError) {
        console.warn('Could not remove file from storage:', storageError);
      }
    }

    // 2. Delete from public.resumes
    const { error: dbError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (dbError) {
      console.error('Error deleting resume from database:', dbError);
      throw new Error(`Failed to delete resume: ${dbError.message}`);
    }
  },

  /**
   * Generates a signed download URL for private resume files.
   */
  async getResumeDownloadUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed download URL: ${error?.message}`);
    }

    return data.signedUrl;
  },
};

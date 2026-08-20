import { supabase } from '../../lib/supabase';
import { Json } from '../../types/database.types';
import type {
  DocumentClassification,
  DocumentType,
  DocumentQuality,
  CandidateEvidenceModel,
  CandidateProfile,
} from '../../types/resume';

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
   * Converts file to Base64 data URL / raw base64 string.
   */
  async extractFileBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Step 2 of extraction pipeline:
   * Normalize raw extracted text — strip control characters, collapse whitespace.
   */
  normalizeText(rawText: string): string {
    return rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')  // strip control chars
      .replace(/\r\n|\r/g, '\n')                             // normalize line endings
      .replace(/[ \t]+/g, ' ')                               // collapse horizontal whitespace
      .replace(/\n{3,}/g, '\n\n')                           // collapse excessive blank lines
      .trim();
  },

  /**
   * Step 3 of extraction pipeline:
   * Detect common resume section headers and insert labels.
   * Output: Gemini-ready text with [SECTION: X] markers.
   */
  detectSectionsAndLabel(normalizedText: string): string {
    // 1. Separate inline headers and bullets
    const text = normalizedText
      .replace(/\b(PROFILE\s*SUMMARY|PROFESSIONAL\s*SUMMARY|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|KEY\s*PROJECTS|PROJECTS|WORK\s*EXPERIENCE|EXPERIENCE|ACHIEVEMENTS(?:\s*\/\s*CERTIFICATIONS)?|CERTIFICATIONS|EDUCATION|ACADEMIC\s*BACKGROUND)\b/gi, '\n$1\n')
      .replace(/([•\u2022\u25cf\u25cb\u25aa])/g, '\n$1 ');

    const sectionPatterns: [RegExp, string][] = [
      [/^(work\s*experience|experience|employment|work\s*history)/im, 'EXPERIENCE'],
      [/^(education|academic|qualifications)/im,                       'EDUCATION'],
      [/^(projects?|personal\s*projects?|key\s*projects?)/im,         'PROJECTS'],
      [/^(skills?|technical\s*skills?|core\s*competencies)/im,        'SKILLS'],
      [/^(certifications?|certificates?|licenses?)/im,                 'CERTIFICATIONS'],
      [/^(achievements?|awards?|honors?|achievements\s*\/\s*certifications)/im, 'ACHIEVEMENTS'],
      [/^(summary|profile|profile\s*summary|professional\s*summary|objective|about)/im, 'SUMMARY'],
    ];

    const lines = text.split('\n');
    const labeled: string[] = [];
    let currentSection = 'HEADER';
    labeled.push(`[SECTION: ${currentSection}]`);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let matched = false;
      for (const [pattern, sectionName] of sectionPatterns) {
        if (pattern.test(trimmed) && trimmed.length < 60) {
          currentSection = sectionName;
          labeled.push(`\n[SECTION: ${sectionName}]`);
          matched = true;
          break;
        }
      }
      if (!matched) labeled.push(trimmed);
    }

    return labeled.join('\n');
  },

  /**
   * Step 4 of extraction pipeline:
   * Deterministic document classification gate — no AI call.
   * Returns DocumentClassification with canProceed flag.
   */
  classifyDocument(labeledText: string, rawTextLength: number): DocumentClassification {
    const lower = labeledText.toLowerCase();
    const sectionsDetected: string[] = [];

    if (lower.includes('[section: experience]')) sectionsDetected.push('EXPERIENCE');
    if (lower.includes('[section: education]'))  sectionsDetected.push('EDUCATION');
    if (lower.includes('[section: projects]'))   sectionsDetected.push('PROJECTS');
    if (lower.includes('[section: skills]'))     sectionsDetected.push('SKILLS');

    // Quality gate
    if (rawTextLength < 150) {
      return {
        documentType: 'unknown',
        documentQuality: 'unreadable',
        extractedTextLength: rawTextLength,
        sectionsDetected,
        canProceed: false,
        rejectionReason: 'Too little text could be extracted from this document. It may be image-based or corrupted.',
      };
    }

    // Academic document patterns
    const academicPatterns = [
      /semester|grade\s*card|marks\s*sheet|transcript|gpa|cgpa|subject\s*code|examination/i,
      /roll\s*no|register\s*number|university\s*exam/i,
    ];
    const isAcademic = academicPatterns.some((p) => p.test(lower));
    if (isAcademic && !sectionsDetected.includes('EXPERIENCE') && !sectionsDetected.includes('PROJECTS')) {
      return {
        documentType: 'academic_document',
        documentQuality: 'good',
        extractedTextLength: rawTextLength,
        sectionsDetected,
        canProceed: false,
        rejectionReason: 'This appears to be an academic document (marks sheet or transcript), not a resume.',
      };
    }

    // Certificate patterns
    const certPatterns = [/this\s*is\s*to\s*certify|certificate\s*of\s*completion|awarded\s*to/i];
    const isCert = certPatterns.some((p) => p.test(lower));
    if (isCert && sectionsDetected.length === 0) {
      return {
        documentType: 'certificate',
        documentQuality: 'good',
        extractedTextLength: rawTextLength,
        sectionsDetected,
        canProceed: false,
        rejectionReason: 'This appears to be a certificate, not a resume.',
      };
    }

    // Document quality
    const hasExperience = sectionsDetected.includes('EXPERIENCE');
    const hasProjects   = sectionsDetected.includes('PROJECTS');
    const hasSkills     = sectionsDetected.includes('SKILLS');

    let documentQuality: DocumentQuality = 'poor';
    if ((hasExperience || hasProjects) && hasSkills) documentQuality = 'good';
    else if (hasExperience || hasProjects || hasSkills) documentQuality = 'partial';

    const documentType: DocumentType = 'resume';

    return {
      documentType,
      documentQuality,
      extractedTextLength: rawTextLength,
      sectionsDetected,
      canProceed: true,
      warningMessage: documentQuality === 'poor'
        ? 'Resume content seems sparse. Consider uploading a more complete resume for better results.'
        : undefined,
    };
  },

  /**
   * Derives a flat CandidateProfile from CandidateEvidenceModel.
   * Used for backward compatibility with report rendering.
   * Never an AI output — always deterministically derived from confirmed evidence.
   */
  deriveProfileFromEvidence(model: CandidateEvidenceModel): CandidateProfile {
    if (!model) {
      return {
        name: 'Candidate',
        summary: '',
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: [],
        achievements: [],
        strengths: [],
        potentialGaps: [],
      };
    }

    const techSkills = (model.skills?.technical || []).map((s) => s?.value || String(s)).filter(Boolean);
    const prodSkills = (model.skills?.product || []).map((s) => s?.value || String(s)).filter(Boolean);
    const domainSkills = (model.skills?.domain || []).map((s) => s?.value || String(s)).filter(Boolean);
    const allSkills = [...techSkills, ...prodSkills, ...domainSkills];

    const candidateName = (model.identity?.name?.value || 'Candidate')
      .replace(/\[SECTION:[^\]]*\]/gi, '')
      .replace(/\[PAGE\s*\d+\]/gi, '')
      .trim() || 'Candidate';
    const primaryRole = model.workExperience?.[0]?.role?.value;
    const primaryCompany = model.workExperience?.[0]?.company?.value;
    const summary = primaryRole && primaryCompany
      ? `${primaryRole} at ${primaryCompany}`
      : (model.identity?.role?.value || '').replace(/\[SECTION:[^\]]*\]/gi, '').replace(/\[PAGE\s*\d+\]/gi, '').trim();

    return {
      name: candidateName,
      summary,
      education: (model.education || []).map((e) => ({
        degree: e?.degree?.value || '',
        institution: e?.institution?.value || '',
        year: e?.year?.value || '',
      })),
      experience: (model.workExperience || []).map((w) => ({
        role: w?.role?.value || '',
        company: w?.company?.value || '',
        duration: `${w?.startDate?.value || ''} – ${w?.endDate?.value || ''}`.replace(/^ – $/, ''),
        highlights: (w?.bullets || []).map((b) => b?.value || String(b)).filter(Boolean),
      })),
      projects: (model.projects || []).map((p) => ({
        name: p?.name?.value || 'Project',
        description: p?.contribution?.value || p?.problem?.value || '',
        technologies: (p?.technologies || []).map((t) => t?.value || String(t)).filter(Boolean),
        metrics: p?.outcomes?.[0]?.value || '',
      })),
      skills: [...new Set(allSkills)],
      certifications: (model.certifications || []).map((c) => c?.value || String(c)).filter(Boolean),
      achievements: (model.achievements || []).map((a) => a?.value || String(a)).filter(Boolean),
      strengths: prodSkills.slice(0, 5),
      potentialGaps: (model.unclear || []).map((u) => u?.text || String(u)).filter(Boolean),
    };
  },


  /**
   * Extracts readable text content from an uploaded resume file.
   * Uses Mozilla PDF.js for 100% full-text extraction of multi-column, designer, and compressed PDFs.
   */
  async extractTextFromFile(file: File): Promise<string> {
    // 1. Text or Markdown files
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    }

    // 2. PDF Files — Use PDF.js engine
    if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Dynamically load PDF.js from CDN if not already in window
        const pdfjsLib = (window as any).pdfjsLib || await (async () => {
          if (!(window as any).pdfjsLib) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              script.onload = () => {
                if ((window as any).pdfjsLib) {
                  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                resolve();
              };
              script.onerror = () => reject(new Error('Failed to load PDF parser.'));
              document.head.appendChild(script);
            });
          }
          return (window as any).pdfjsLib;
        })().catch(() => null);

        if (pdfjsLib) {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let extractedPagesText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            let lastY: number | null = null;
            let pageText = '';

            for (const item of (textContent.items as any[])) {
              const str = (item.str || '').trim();
              if (!str) continue;

              const currentY = item.transform ? item.transform[5] : null;
              const hasEOL = Boolean(item.hasEOL);

              // Detect significant vertical displacement (new line in document layout)
              if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
                pageText += '\n' + str;
              } else if (hasEOL) {
                pageText += (pageText.endsWith(' ') || pageText.endsWith('\n') ? '' : ' ') + str + '\n';
              } else {
                pageText += (pageText.endsWith(' ') || pageText.endsWith('\n') || pageText.length === 0 ? '' : ' ') + str;
              }

              if (currentY !== null) {
                lastY = currentY;
              }
            }

            extractedPagesText += `\n[PAGE ${pageNum}]\n` + pageText;
          }

          const cleanExtracted = extractedPagesText.trim();
          if (cleanExtracted.length > 50) {
            return cleanExtracted;
          }
        }
      } catch (pdfErr) {
        console.warn('PDF.js engine extraction warning, trying raw stream decoder fallback:', pdfErr);
      }
    }

    // 3. Fallback: Raw byte stream decoder
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = textDecoder.decode(uint8);

      const pdfTextMatches = rawString.match(/\(([^()]+)\)\s*T[jJ]/g);
      if (pdfTextMatches && pdfTextMatches.length > 5) {
        const extracted = pdfTextMatches
          .map((m) => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, ''))
          .filter((t) => t.length > 1 && !/^\\[0-9]/.test(t))
          .join(' ');
        if (extracted.length > 50) {
          return extracted;
        }
      }

      const cleanChars = rawString.replace(/[^\x20-\x7E\t\n\r]/g, ' ');
      const words = cleanChars
        .split(/\s+/)
        .filter((w) => w.length > 2 && !w.startsWith('/') && !w.includes('obj') && !w.includes('endobj') && !w.includes('stream') && !/^[0-9]+$/.test(w));
      if (words.length > 15) {
        return words.join(' ');
      }
      return '';
    } catch (err) {
      console.warn('Fallback stream text decoder failed:', err);
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

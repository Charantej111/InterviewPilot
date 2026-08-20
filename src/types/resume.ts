// ─── Evidence Infrastructure ─────────────────────────────────────────────────

/**
 * Confidence is CALCULATED from evidence quality and verification — not copied verbatim from AI output.
 *
 * high     : Exact source phrase + clear section + unambiguous meaning + verified in document
 * medium   : Source exists + meaning requires interpretation / fuzzy matched
 * low      : Weak source + ambiguous interpretation / minor discrepancy
 * inferred : No explicit statement — AI inference only (MUST be confirmed by candidate)
 */
export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'inferred';

export interface EvidenceItem {
  value: string;
  sourceText: string;       // exact supporting phrase or sentence from the resume
  sourceLocation: {
    section: string;        // e.g. 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'EDUCATION' | 'HEADER' | 'ACHIEVEMENTS'
    approximateLine?: number;
  };
  confidence: EvidenceConfidence;
}

// ─── Document Extraction & Section Types ──────────────────────────────────────

export interface ExtractedSection {
  name: string;
  normalizedName:
    | 'header'
    | 'summary'
    | 'experience'
    | 'projects'
    | 'education'
    | 'skills'
    | 'certifications'
    | 'achievements'
    | 'other';
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface ExtractedDocument {
  rawText: string;
  normalizedText: string;
  sections: ExtractedSection[];
  pageCount?: number;
  characterCount: number;
  documentType: DocumentType;
  documentQuality: DocumentQuality;
  extractionWarnings: string[];
}

// ─── Document Classification Gate (deterministic — no AI call) ────────────────

export type DocumentType =
  | 'resume'
  | 'cv'
  | 'portfolio'
  | 'academic_document'   // marks sheet, transcript, grade card
  | 'certificate'
  | 'unknown';

export type DocumentQuality =
  | 'good'        // name + experience/projects + skills present
  | 'partial'     // some sections missing but usable (e.g. student resume with projects + education)
  | 'poor'        // minimal content
  | 'unreadable'; // <150 chars extracted, scanned image, or corrupted

export interface DocumentClassification {
  documentType: DocumentType;
  documentQuality: DocumentQuality;
  extractedTextLength: number;
  sectionsDetected: string[];
  rejectionReason?: string;   // set when documentType is not resume/cv
  canProceed: boolean;
  warningMessage?: string;    // non-blocking warning shown to user
}

// ─── Candidate Evidence Model ─────────────────────────────────────────────────

export interface WorkExperienceEvidence {
  company: EvidenceItem;
  role: EvidenceItem;
  startDate?: EvidenceItem;
  endDate?: EvidenceItem;
  bullets: EvidenceItem[];  // each bullet individually extracted with sourceText
}

export interface ProjectEvidence {
  name: EvidenceItem;
  problem?: EvidenceItem;        // null/undefined if not found in resume
  contribution?: EvidenceItem;   // null/undefined if not found
  technologies: EvidenceItem[];
  outcomes: EvidenceItem[];      // metrics, results — often missing → []
}

export interface CandidateEvidenceModel {
  identity: {
    name?: EvidenceItem;
    email?: EvidenceItem;
    phone?: EvidenceItem;
    role?: EvidenceItem;         // current/target role if explicitly stated
  };
  education: {
    degree?: EvidenceItem;
    institution?: EvidenceItem;
    year?: EvidenceItem;
  }[];
  workExperience: WorkExperienceEvidence[];
  projects: ProjectEvidence[];
  skills: {
    technical: EvidenceItem[];
    product: EvidenceItem[];
    domain: EvidenceItem[];
  };
  certifications: EvidenceItem[];
  achievements: EvidenceItem[];
  /**
   * Text found in resume that could not be confidently categorized.
   * Shown to candidate during review step for clarification.
   */
  unclear: {
    text: string;
    reason: string;
  }[];
}

// ─── Evidence Validation Types ────────────────────────────────────────────────

export interface ValidationIssue {
  type:
    | 'missing_source'
    | 'unsupported_value'
    | 'duplicate'
    | 'invalid_date'
    | 'conflicting_evidence'
    | 'low_confidence';
  severity: 'warning' | 'error';
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  model: CandidateEvidenceModel;
  issues: ValidationIssue[];
  repairedFields: string[];
  evidenceQualitySummary: {
    totalItems: number;
    supportedCount: number;
    partiallySupportedCount: number;
    unsupportedCount: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    inferredCount: number;
  };
}

export type ExtractionErrorCode =
  | 'AI_REQUEST_FAILED'
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_OUTPUT'
  | 'INSUFFICIENT_CONTEXT'
  | 'DOCUMENT_UNREADABLE'
  | 'DOCUMENT_NOT_RESUME'
  | 'EVIDENCE_VALIDATION_FAILED';

// ─── Locked Candidate Context ────────────────────────────────────────────────

/**
 * Immutable snapshot created after candidate confirms their evidence.
 * AI cannot introduce claims not present in this snapshot.
 * Every downstream stage (match, question generation, evaluation) ONLY
 * references this locked context — never re-reads from AI output.
 */
export interface LockedCandidateContext {
  sessionId: string;
  lockedAt: string;              // ISO timestamp
  evidenceModel: CandidateEvidenceModel;
  /**
   * Flat derived view — used for backward compatibility with report rendering
   * and legacy components. Always derived deterministically from confirmedEvidence.
   */
  derivedProfile: CandidateProfile;
}

// ─── Candidate Profile (Flat Derived View — Backward Compat) ─────────────────

/**
 * Derived deterministically from CandidateEvidenceModel after human confirmation.
 * Never an AI output. Use CandidateEvidenceModel for intelligence decisions.
 */
export interface CandidateEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface CandidateExperience {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface CandidateProject {
  name: string;
  description: string;
  technologies?: string[];
  metrics?: string;
}

export interface CandidateProfile {
  name: string;
  summary: string;
  education: CandidateEducation[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  skills: string[];
  certifications?: string[];
  achievements?: string[];
  strengths: string[];
  potentialGaps: string[];
}

// ─── Resume Storage Record ────────────────────────────────────────────────────

export interface ResumeData {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  parsingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  extractedInfo?: CandidateProfile;
  evidenceModel?: CandidateEvidenceModel;
}

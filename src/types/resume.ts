// ─── Evidence Infrastructure ─────────────────────────────────────────────────

/**
 * Confidence is CALCULATED from evidence quality — not copied verbatim from AI output.
 *
 * high     : Exact source phrase + clear section + unambiguous meaning
 * medium   : Source exists + meaning requires interpretation
 * low      : Weak source + ambiguous interpretation
 * inferred : No explicit statement — AI inference only (Level 5 in source hierarchy)
 */
export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'inferred';

export interface EvidenceItem {
  value: string;
  sourceText: string;       // exact phrase or sentence from the resume
  sourceLocation: {
    section: string;        // e.g. 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'EDUCATION'
    approximateLine?: number;
  };
  confidence: EvidenceConfidence;
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
  | 'partial'     // some sections missing but usable
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
  startDate: EvidenceItem;
  endDate: EvidenceItem;
  bullets: EvidenceItem[];  // each bullet individually extracted with sourceText
}

export interface ProjectEvidence {
  name: EvidenceItem;
  problem: EvidenceItem | null;        // null if not found in resume
  contribution: EvidenceItem | null;   // null if not found
  technologies: EvidenceItem[];
  outcomes: EvidenceItem[];            // metrics, results — often missing → []
}

export interface CandidateEvidenceModel {
  identity: {
    name: EvidenceItem;
    email?: EvidenceItem;
    role?: EvidenceItem;   // current/target role if explicitly stated
  };
  education: {
    degree: EvidenceItem;
    institution: EvidenceItem;
    year: EvidenceItem;
  }[];
  workExperience: WorkExperienceEvidence[];
  projects: ProjectEvidence[];
  skills: {
    technical: EvidenceItem[];
    product: EvidenceItem[];
    domain: EvidenceItem[];
  };
  certifications: EvidenceItem[];
  /**
   * Text found in resume that could not be confidently categorized.
   * Shown to candidate during review step for clarification.
   */
  unclear: {
    text: string;
    reason: string;
  }[];
}

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
}

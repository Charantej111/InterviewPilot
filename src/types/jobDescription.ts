// ─── JD Evidence Model Standard ───────────────────────────────────────────────

export type RequirementStrength =
  | 'explicit'
  | 'preferred'
  | 'inferred';

export type RequirementCategory =
  | 'skill'
  | 'responsibility'
  | 'competency'
  | 'technical'
  | 'domain'
  | 'behavioral'
  | 'experience'
  | 'education'
  | 'certification'
  | 'other';

export interface JDRequirement {
  id: string;
  requirement: string;
  sourceText: string;
  category: RequirementCategory;
  strength: RequirementStrength;
  competencySignal?: string;
  confidence: 'high' | 'medium' | 'low';
  critical: boolean;
}

export interface JDEvidenceModel {
  role: string | null;
  company?: string | null;
  seniority:
    | 'intern'
    | 'junior'
    | 'mid'
    | 'senior'
    | 'lead'
    | 'principal'
    | 'unknown';
  requiredSkills: JDRequirement[];
  preferredSkills: JDRequirement[];
  responsibilities: JDRequirement[];
  competencies: JDRequirement[];
  technicalRequirements: JDRequirement[];
  domainKnowledge: JDRequirement[];
  behavioralSignals: JDRequirement[];
  experienceRequirements: JDRequirement[];
  educationRequirements: JDRequirement[];
  certificationRequirements: JDRequirement[];
  hiringSignals: string[];
  criticalCompetencies?: string[];
  domainKeywords?: string[];
  roleKeywords?: string[];
  redFlags?: string[];
  extractionWarnings: string[];
}

// ─── JobProfile (Flat Derived View — Backward Compat) ────────────────────────

/**
 * Kept for backward compatibility with existing report rendering and legacy
 * match display. Always derived from JDEvidenceModel — never an AI output directly.
 */
export interface JobProfile {
  role: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: string;
  competencies: string[];
  keywords: string[];
  interviewSignals: string[];
}

export interface JobDescriptionRecord {
  id: string;
  userId: string;
  title: string;
  company: string;
  rawDescription: string;
  parsedRequirements: JobProfile | null;
  processingStatus: 'draft' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

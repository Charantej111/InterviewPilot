// ─── JD Evidence Model ───────────────────────────────────────────────────────

/**
 * How explicitly a requirement appears in the JD.
 * explicit  = stated directly ("Must have threat modeling experience")
 * preferred = stated as optional ("Nice to have SIEM knowledge")
 * inferred  = implied by context ("Works across engineering and business teams")
 */
export type RequirementStrength = 'explicit' | 'preferred' | 'inferred';

export interface JDRequirement {
  requirement: string;
  sourceText: string;            // exact sentence or phrase from the JD
  strength: RequirementStrength;
  competencySignal: string;      // maps to competency model (e.g. 'analytics')
  confidence: 'high' | 'medium' | 'low';
}

export interface JDEvidenceModel {
  role: string;
  company?: string;
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'unknown';
  requiredSkills: JDRequirement[];
  preferredSkills: JDRequirement[];
  responsibilities: JDRequirement[];
  criticalCompetencies: string[];       // ordered by importance
  behavioralSignals: JDRequirement[];   // e.g. "works cross-functionally"
  technicalRequirements: JDRequirement[];
  domainKnowledge: JDRequirement[];     // cybersecurity, fintech, edtech, etc.
  hiringSignals: string[];              // what a strong hire looks like
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

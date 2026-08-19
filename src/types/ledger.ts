export type EvidenceSourceType = 'resume' | 'interview' | 'job_description' | 'company_research' | 'external';
export type EvidenceConfidenceLevel = 'high' | 'medium' | 'low';
export type ClaimSupportStatus = 'supported' | 'unverified_by_submitted_resume' | 'contradicted';
export type RequirementCriticality = 'critical' | 'important' | 'nice_to_have';
export type RequirementEvidenceType = 'direct_experience' | 'transferable' | 'theoretical';
export type AssessmentMethodType = 'technical_question' | 'case' | 'behavioral' | 'gap_probe' | 'resume_deep_dive';

export interface EvidenceFact {
  id: string;
  claim: string;
  source: EvidenceSourceType;
  reference: string;
  confidence: EvidenceConfidenceLevel;
  recency?: string;
  rawSnippet?: string;
}

export interface CompetencyInference {
  competency: string;
  basis: string;
  confidence: 'medium' | 'low';
  sourceReferences: string[];
}

export interface UnprovenClaim {
  id: string;
  claim: string;
  source: string;
  note: string;
  status: 'unverified_by_submitted_resume';
}

export interface EvidenceContradiction {
  id: string;
  claim: string;
  statedIn: string;
  contradictedBy: string;
  severity: 'high' | 'medium';
}

export interface CandidateEvidenceLedger {
  candidateName?: string;
  facts: EvidenceFact[];
  inferences: CompetencyInference[];
  unprovenClaims: UnprovenClaim[];
  contradictions: EvidenceContradiction[];
  verifiedTenureMonths?: number;
  primaryDomain?: string;
}

export interface JDRequirementItem {
  id: string;
  category: 'skill' | 'responsibility' | 'competency' | 'domain' | 'seniority';
  title: string;
  description?: string;
  criticality: RequirementCriticality;
  seniorityRequiredYears?: number;
  evidenceRequired: RequirementEvidenceType;
  assessmentMethod: AssessmentMethodType;
  sourceReference: string;
}

export interface JDRequirementLedger {
  role: string;
  company: string;
  seniorityLevel: string;
  requirements: JDRequirementItem[];
  criticalRequirementsCount: number;
}

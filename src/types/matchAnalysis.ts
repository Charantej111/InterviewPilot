import type { EvidenceItem } from './resume';
import type { JDRequirement } from './jobDescription';

// ─── Match Verdicts ───────────────────────────────────────────────────────────

/**
 * Five distinct match verdicts. 'contradicted' is not the same as 'unproven'.
 *
 * direct       : Resume explicitly demonstrates the requirement
 * transferable : Related evidence exists but not a direct match
 * missing      : No evidence found anywhere
 * unproven     : Candidate claims it but no sourceText backs it up
 * contradicted : Available evidence conflicts with the claim
 */
export type MatchVerdict = 'direct' | 'transferable' | 'missing' | 'unproven' | 'contradicted';

export type GapPriority = 'high' | 'medium' | 'low' | 'excluded';
export type QualificationConfidence = 'high' | 'medium' | 'low';

// ─── Requirement-Level Match ──────────────────────────────────────────────────

/**
 * Every JD requirement is individually matched against locked candidate evidence.
 * Weight formula: requirementImportance × evidenceStrength × matchQuality
 *
 * Importance weights:
 *   explicit + critical competency  = 3.0×
 *   explicit + required skill       = 2.0×
 *   preferred skill                 = 1.0×
 *   inferred competency             = 0.5×
 */
export interface RequirementMatch {
  jdRequirement: JDRequirement;
  verdict: MatchVerdict;
  candidateEvidence?: EvidenceItem;     // only set for direct/transferable/unproven
  weightedContribution: number;         // points this requirement contributes to overall score
  explanation: string;                  // one human-readable sentence explaining the verdict
}

// ─── Match Assessment (Primary Intelligence Object) ───────────────────────────

/**
 * MatchAssessment is the primary concept — not the percentage.
 * The percentage is a secondary visualization derived from this object.
 * Use requirementMatches to explain every verdict to the user.
 */
export interface MatchAssessment {
  /** Secondary display value — not the intelligence. Derived from requirement weights. */
  overallMatchPercent: number;
  verdict: 'strong' | 'moderate' | 'low' | 'mismatched';
  confidence: QualificationConfidence;
  evidenceCoverage: number;             // 0.0–1.0 ratio of requirements with any evidence
  requirementMatches: RequirementMatch[];
  directMatches: RequirementMatch[];
  transferableMatches: RequirementMatch[];
  missingRequirements: RequirementMatch[];
  unprovenClaims: RequirementMatch[];
  contradictedClaims: RequirementMatch[];
  criticalGaps: string[];               // missing or contradicted explicit requirements
}

export type MatchStatusState = 'not_ready' | 'analyzing' | 'ready' | 'failed';

export interface MatchStateModel {
  status: MatchStatusState;
  overallMatchPercent: number | null;
  requirementMatches: RequirementMatch[];
  reason?: 'JOB_DESCRIPTION_REQUIRED' | 'RESUME_REQUIRED' | 'ANALYSIS_FAILED';
  matchAssessment?: MatchAssessment | null;
}

// ─── Legacy Types (Backward Compat) ──────────────────────────────────────────

export type MatchStatus = 'strong_match' | 'partial_match' | 'transferable_match' | 'weak_match' | 'unproven' | 'missing';
export type EvidenceStrength = 'confirmed' | 'partial' | 'weak' | 'unverified';

export interface EvidenceProvenance {
  source: 'resume' | 'job_description' | 'company_research' | 'interview';
  reference: string;
  snippet?: string;
}

export interface MatchingStrength {
  competency: string;
  evidence: string;
  relevanceScore: number;
  classification: 'direct_match' | 'transferable_match';
  evidenceStrength: EvidenceStrength;
  provenance: EvidenceProvenance;
}

export interface ActionableGap {
  gapId: string;
  requirement: string;
  status: MatchStatus;
  evidenceStrength: EvidenceStrength;
  criticality: 'blocking' | 'important' | 'nice_to_have';
  recommendation: string;
  targetedProbeOpportunity: string;
  priority: GapPriority;
  provenance: EvidenceProvenance;
}

export interface DeterministicScoreBreakdown {
  requiredSkillsCoverage: number;
  experienceAlignment: number;
  competenciesMatch: number;
  rawScore: number;
  blockingPenaltyMultiplier: number;
  totalScore: number;
  confidenceInterval: [number, number];
}

/**
 * Full result object. matchAssessment is the authoritative intelligence output.
 * All other fields kept for backward compat with existing report rendering.
 */
export interface MatchAnalysisResult {
  matchAssessment: MatchAssessment;        // NEW — primary intelligence object
  matchPercentage: number;                 // derived from matchAssessment.overallMatchPercent
  rawMatchPercentage: number;
  qualificationConfidence: QualificationConfidence;
  evidenceCoverage: number;
  criticalRequirementCoverage: number;
  deterministicBreakdown: DeterministicScoreBreakdown;
  directMatches: MatchingStrength[];
  transferableMatches: MatchingStrength[];
  matchingStrengths: MatchingStrength[];
  gaps: ActionableGap[];
  blockingGaps: ActionableGap[];
  actionableGaps: ActionableGap[];
  companyAlignmentSummary: string;
}


export interface EvidenceProvenance {
  source: 'resume' | 'job_description' | 'company_research' | 'interview';
  reference: string;
  snippet?: string;
}

export interface MatchingStrength {
  competency: string;
  evidence: string;
  relevanceScore: number;
  classification: 'direct_match' | 'transferable_match';
  evidenceStrength: EvidenceStrength;
  provenance: EvidenceProvenance;
}

export interface ActionableGap {
  gapId: string;
  requirement: string;
  status: MatchStatus;
  evidenceStrength: EvidenceStrength;
  criticality: 'blocking' | 'important' | 'nice_to_have';
  recommendation: string;
  targetedProbeOpportunity: string;
  priority: GapPriority;
  provenance: EvidenceProvenance;
}

export interface DeterministicScoreBreakdown {
  requiredSkillsCoverage: number; // e.g. 0 to 45
  experienceAlignment: number;    // e.g. 0 to 30
  competenciesMatch: number;      // e.g. 0 to 25
  rawScore: number;               // 0 to 100
  blockingPenaltyMultiplier: number; // 0.2 to 1.0
  totalScore: number;             // final adjusted score 0 to 100
  confidenceInterval: [number, number]; // e.g. [14, 22]
}

export interface MatchAnalysisResult {
  matchPercentage: number; // Final adjusted deterministic score (0 - 100)
  rawMatchPercentage: number;
  qualificationConfidence: QualificationConfidence;
  evidenceCoverage: number; // 0.0 to 1.0
  criticalRequirementCoverage: number; // 0.0 to 1.0
  deterministicBreakdown: DeterministicScoreBreakdown;
  directMatches: MatchingStrength[];
  transferableMatches: MatchingStrength[];
  matchingStrengths: MatchingStrength[]; // Combined for UI backward compatibility
  gaps: ActionableGap[];
  blockingGaps: ActionableGap[];
  actionableGaps: ActionableGap[]; // Combined for UI backward compatibility
  companyAlignmentSummary: string;
}

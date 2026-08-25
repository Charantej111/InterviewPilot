import type { EvidenceItem } from './resume';
import type { JDRequirement } from './jobDescription';

// ─── Match Verdicts ───────────────────────────────────────────────────────────

/**
 * Four distinct match verdicts for Phase 2:
 *
 * direct       : Resume explicitly demonstrates the requirement with verified source evidence
 * transferable : Related evidence exists in adjacent skills or domains
 * missing      : No evidence found anywhere in candidate profile
 * unproven     : Claimed by candidate but no supporting source text found
 */
export type MatchVerdict = 'direct' | 'transferable' | 'missing' | 'unproven';

export type GapPriority = 'high' | 'medium' | 'low' | 'excluded';
export type QualificationConfidence = 'high' | 'medium' | 'low';

// ─── Requirement-Level Match & Score Trace ─────────────────────────────────────

export interface RequirementScoreTrace {
  weight: number;
  multiplier: number;
  earnedPoints: number;
  possiblePoints: number;
}

/**
 * Every JD requirement is individually matched against locked candidate evidence.
 * Weight formula: importanceWeight × matchMultiplier × confidenceFactor
 *
 * Importance weights:
 *   explicit + critical = 3.0×
 *   explicit + standard = 2.0×
 *   preferred           = 1.0×
 *   inferred            = 0.5×
 *
 * Multipliers:
 *   direct       = 1.0
 *   transferable = 0.6
 *   missing      = 0.0
 *   unproven     = 0.0
 */
export interface RequirementMatch {
  jdRequirement: JDRequirement;
  verdict: MatchVerdict;
  candidateEvidence?: EvidenceItem;     // only set for direct / transferable / unproven
  weightedContribution: number;         // rounded points earned
  scoreTrace: RequirementScoreTrace;    // mathematical trace for full explainability
  explanation: string;                  // human-readable sentence referencing source quotes
}

// ─── Match Assessment (Primary Intelligence Object) ───────────────────────────

/**
 * MatchAssessment is the primary deterministic intelligence object.
 * Every field is calculated 100% in TypeScript from requirement matches.
 */
export interface MatchAssessment {
  overallMatchPercent: number;          // (earnedWeight / possibleWeight) * 100
  verdict: 'strong' | 'moderate' | 'low' | 'mismatched';
  confidence: QualificationConfidence;
  evidenceCoverage: number;             // 0.0–1.0 ratio of requirements with verified evidence
  requirementMatches: RequirementMatch[];
  directMatches: RequirementMatch[];
  transferableMatches: RequirementMatch[];
  missingRequirements: RequirementMatch[];
  unprovenClaims: RequirementMatch[];
  criticalGaps: string[];               // missing explicit/critical requirements
  resumeExtractionId: string;           // version tracking
  jdContentHash: string;                // version tracking
  createdAt: string;
}

export type MatchStatusState = 'not_ready' | 'analyzing' | 'ready' | 'failed';

export interface MatchStateModel {
  status: MatchStatusState;
  overallMatchPercent: number | null;
  requirementMatches: RequirementMatch[];
  reason?: 'JOB_DESCRIPTION_REQUIRED' | 'RESUME_REQUIRED' | 'INTEGRITY_CHECK_FAILED' | 'ANALYSIS_FAILED';
  matchAssessment?: MatchAssessment | null;
  resumeExtractionId?: string;
  jdContentHash?: string;
}

// ─── Legacy Types (Backward Compat Adapter) ────────────────────────────────────

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
 * Full result object for backward compatibility with existing report rendering.
 */
export interface MatchAnalysisResult {
  matchAssessment: MatchAssessment;
  matchPercentage: number;
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

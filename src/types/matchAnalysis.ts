export type GapPriority = 'high' | 'medium' | 'low' | 'excluded';
export type MatchStatus = 'strong_match' | 'partial_match' | 'transferable_match' | 'weak_match' | 'unproven' | 'missing';
export type EvidenceStrength = 'confirmed' | 'partial' | 'weak' | 'unverified';
export type QualificationConfidence = 'high' | 'medium' | 'low';

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

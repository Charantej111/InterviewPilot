export type GapPriority = 'high' | 'medium' | 'low' | 'excluded';

export interface MatchingStrength {
  competency: string;
  evidence: string;
  relevanceScore: number;
}

export interface ActionableGap {
  gapId: string;
  requirement: string;
  status: 'unproven_on_resume' | 'partial_match' | 'growth_opportunity';
  recommendation: string;
  targetedProbeOpportunity: string;
  priority: GapPriority;
}

export interface DeterministicScoreBreakdown {
  requiredSkillsCoverage: number; // e.g. 40 / 45
  experienceAlignment: number;    // e.g. 25 / 30
  competenciesMatch: number;      // e.g. 17 / 25
  totalScore: number;             // e.g. 82 / 100
}

export interface MatchAnalysisResult {
  matchPercentage: number; // Calculated strictly via deterministic scoring formula
  deterministicBreakdown: DeterministicScoreBreakdown;
  matchingStrengths: MatchingStrength[];
  actionableGaps: ActionableGap[];
  companyAlignmentSummary: string;
}

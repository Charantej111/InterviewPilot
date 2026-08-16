export interface RubricDimensions {
  relevance: number;      // 25% weight
  structure: number;      // 20% weight
  clarity: number;        // 15% weight
  depth: number;          // 15% weight
  evidence: number;       // 15% weight
  roleAlignment: number;  // 10% weight
}

export const RUBRIC_WEIGHTS = {
  relevance: 0.25,
  structure: 0.20,
  clarity: 0.15,
  depth: 0.15,
  evidence: 0.15,
  roleAlignment: 0.10,
} as const;

/**
 * Deterministically calculates the weighted overall score (1.0 - 10.0) based on the rubric.
 * Do NOT use LLM for overall score calculation.
 */
export function calculateOverallScore(dimensions: RubricDimensions): number {
  const clamp = (val: number) => Math.min(10, Math.max(1, val || 1));

  const weightedSum =
    clamp(dimensions.relevance) * RUBRIC_WEIGHTS.relevance +
    clamp(dimensions.structure) * RUBRIC_WEIGHTS.structure +
    clamp(dimensions.clarity) * RUBRIC_WEIGHTS.clarity +
    clamp(dimensions.depth) * RUBRIC_WEIGHTS.depth +
    clamp(dimensions.evidence) * RUBRIC_WEIGHTS.evidence +
    clamp(dimensions.roleAlignment) * RUBRIC_WEIGHTS.roleAlignment;

  return Math.round(weightedSum * 10) / 10;
}

/**
 * Calculates interview readiness percentage from an overall score.
 */
export function calculateReadinessPercentage(score: number): number {
  return Math.min(100, Math.max(0, Math.round((score / 10) * 100)));
}

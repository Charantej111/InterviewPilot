/**
 * Deterministic Answer Score Engine — Mathematical Scoring & Confidence Layer
 *
 * Implements strict, auditable numeric score computation from structured evaluation evidence.
 * Gemini produces observations and evidence; this engine produces the final numeric scores.
 *
 * Zero LLM calls in numeric calculations. 100% deterministic TypeScript.
 */

import type {
  AnswerEvaluation,
  DeterministicScoreResult,
} from '../../types/interview';

export const DIMENSION_WEIGHTS: Record<
  'relevance' | 'depth' | 'evidence' | 'roleAlignment' | 'structure' | 'clarity',
  number
> = {
  relevance: 0.25,
  depth: 0.20,
  evidence: 0.20,
  roleAlignment: 0.15,
  structure: 0.10,
  clarity: 0.10,
};

/**
 * Calculates deterministic overall score and confidence from dimension results.
 * Excludes null dimensions without treating them as zero or skewing the denominator.
 */
export function calculateDeterministicScore(
  evaluation: Partial<AnswerEvaluation>
): DeterministicScoreResult {
  const classification = evaluation.answerClassification || 'answered';

  // ─── 1. Gated Special Classifications ─────────────────────────────────────

  if (classification === 'irrelevant') {
    return {
      score: 0.0,
      scoreInterval: [0.0, 0.5],
      assessedDimensions: 4,
      excludedDimensions: ['clarity', 'structure'],
      scoreConfidence: 'high',
    };
  }

  if (classification === 'refusal') {
    return {
      score: 0.0,
      scoreInterval: [0.0, 0.5],
      assessedDimensions: 4,
      excludedDimensions: ['clarity', 'structure'],
      scoreConfidence: 'high',
    };
  }

  if (classification === 'repeat_request' || classification === 'clarification_request') {
    // No penalty, neutral holding score
    return {
      score: 5.0,
      scoreInterval: [5.0, 5.0],
      assessedDimensions: 0,
      excludedDimensions: ['relevance', 'depth', 'evidence', 'roleAlignment', 'structure', 'clarity'],
      scoreConfidence: 'high',
    };
  }

  if (classification === 'uncertain' || classification === 'not_answered') {
    return {
      score: 2.5,
      scoreInterval: [2.0, 3.0],
      assessedDimensions: 4,
      excludedDimensions: ['structure'],
      scoreConfidence: 'high',
    };
  }

  // ─── 2. Dimensional Weighted Scoring ──────────────────────────────────────

  const dims = evaluation.dimensions || {
    relevance: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
    structure: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
    clarity: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
    depth: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
    evidence: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
    roleAlignment: { score: 5.0, assessmentStatus: 'assessed', reason: '' },
  };

  let weightedSum = 0;
  let totalWeightAssessed = 0;
  let assessedCount = 0;
  const excludedDims: string[] = [];

  for (const [dimKey, weight] of Object.entries(DIMENSION_WEIGHTS) as [keyof typeof DIMENSION_WEIGHTS, number][]) {
    const dimResult = dims[dimKey];
    if (dimResult && dimResult.score !== null && dimResult.score !== undefined) {
      weightedSum += dimResult.score * weight;
      totalWeightAssessed += weight;
      assessedCount++;
    } else {
      excludedDims.push(dimKey);
    }
  }

  // Normalize score against sum of assessed weights
  const rawScore = totalWeightAssessed > 0 ? weightedSum / totalWeightAssessed : 5.0;
  const clampedScore = Math.min(10.0, Math.max(0.0, Math.round(rawScore * 10) / 10));

  // Score interval [score - 0.4, score + 0.4] clamped to [0, 10]
  const lowerInterval = Math.max(0.0, Math.round((clampedScore - 0.4) * 10) / 10);
  const upperInterval = Math.min(10.0, Math.round((clampedScore + 0.4) * 10) / 10);

  // ─── 3. Score Confidence Determination ────────────────────────────────────

  let scoreConfidence: 'low' | 'medium' | 'high' = 'medium';
  const hasDirectEvidence = (evaluation.positiveObservations && evaluation.positiveObservations.length > 0);

  if (assessedCount === 6 && (hasDirectEvidence || clampedScore >= 7.5)) {
    scoreConfidence = 'high';
  } else if (assessedCount >= 4) {
    scoreConfidence = 'medium';
  } else {
    scoreConfidence = 'low';
  }

  return {
    score: clampedScore,
    scoreInterval: [lowerInterval, upperInterval],
    assessedDimensions: assessedCount,
    excludedDimensions: excludedDims,
    scoreConfidence,
  };
}

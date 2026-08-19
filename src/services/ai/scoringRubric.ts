import {
  AnswerClassification,
  RelevanceGateResult,
  ProfessionalismResult,
  CompletenessMapResult,
  DimensionScoreDetail,
  UnverifiedClaimResult,
  Question,
} from '../../types/interview';

export type RubricDimensions = {
  relevance: number;
  structure: number;
  clarity: number;
  depth: number;
  evidence: number;
  roleAlignment: number;
};

export interface RawEvaluationProposal {
  answerClassification?: AnswerClassification;
  relevanceGate?: RelevanceGateResult;
  professionalism?: ProfessionalismResult;
  completenessMap?: CompletenessMapResult;
  unverifiedClaims?: UnverifiedClaimResult[];
  breakdown?: {
    relevance?: number;
    structure?: number;
    clarity?: number;
    depth?: number;
    evidence?: number;
    roleAlignment?: number;
  };
  dimensionDetails?: {
    relevance?: Partial<DimensionScoreDetail>;
    structure?: Partial<DimensionScoreDetail>;
    clarity?: Partial<DimensionScoreDetail>;
    depth?: Partial<DimensionScoreDetail>;
    evidence?: Partial<DimensionScoreDetail>;
    roleAlignment?: Partial<DimensionScoreDetail>;
  };
  whatWorked?: string[];
  whatHeldYouBack?: string[];
  tryThisNextTime?: {
    framework?: string;
    suggestion?: string;
    promptToImprove?: string;
    examplePhrasing?: string;
  };
  shouldFollowUp?: boolean;
  followUpReasonCode?: any;
}

export interface ConstrainedEvaluationResult {
  overallScore: number;
  scoreInterval: [number, number];
  answerClassification: AnswerClassification;
  relevanceGate: RelevanceGateResult;
  professionalism: ProfessionalismResult;
  completenessMap: CompletenessMapResult;
  breakdown: {
    relevance: number;
    structure: number;
    clarity: number;
    depth: number;
    evidence: number;
    roleAlignment: number;
  };
  dimensionDetails: {
    relevance: DimensionScoreDetail;
    structure: DimensionScoreDetail;
    clarity: DimensionScoreDetail;
    depth: DimensionScoreDetail;
    evidence: DimensionScoreDetail;
    roleAlignment: DimensionScoreDetail;
  };
  unverifiedClaims: UnverifiedClaimResult[];
  whatWorked: string[];
  whatHeldYouBack: string[];
  tryThisNextTime: {
    framework: string;
    suggestion: string;
    promptToImprove: string;
    examplePhrasing?: string;
  };
  deterministicConstraintsApplied: string[];
  shouldFollowUp: boolean;
  followUpReasonCode?: any;
}

/**
 * Server-side / Client-side Deterministic Rule and Dimension Ceiling Engine.
 * The LLM proposal is never taken blindly. Hard score ceilings and dimension bounds are enforced here.
 */
export function applyDeterministicConstraints(
  proposal: RawEvaluationProposal,
  question: Question,
  candidateAnswerText: string
): ConstrainedEvaluationResult {
  const constraintsApplied: string[] = [];
  const cleanAnswer = (candidateAnswerText || '').trim();

  // 1. Determine Relevance & Classification Preprocessing
  let classification: AnswerClassification = proposal.answerClassification || 'adequate';
  let relevanceStatus: 'answered' | 'partially_answered' | 'not_answered' = proposal.relevanceGate?.status || 'answered';
  let relevanceScore = proposal.breakdown?.relevance ?? proposal.dimensionDetails?.relevance?.score ?? 6.0;

  // Check for empty or trivial answers
  if (cleanAnswer.length < 5) {
    classification = 'not_answered';
    relevanceStatus = 'not_answered';
    relevanceScore = 0;
    constraintsApplied.push('EMPTY_ANSWER_FORCED_NOT_ANSWERED');
  } else if (/^(i don't know|idk|no idea|pass|no clue|not sure)\.?$/i.test(cleanAnswer)) {
    classification = 'weak';
    relevanceStatus = 'partially_answered';
    relevanceScore = 2.0;
    constraintsApplied.push('HONEST_UNCERTAINTY_ACKNOWLEDGED');
  }

  // Check for professionalism issues (rude / abusive language)
  let professionalismStatus: 'acceptable' | 'concerning' | 'poor' = proposal.professionalism?.status || 'acceptable';
  if (/stupid question|dumb question|i don't care|whatever just give me|waste of time/i.test(cleanAnswer)) {
    professionalismStatus = 'poor';
    if (classification !== 'irrelevant' && classification !== 'not_answered') {
      classification = 'unprofessional';
    }
    constraintsApplied.push('RUDE_LANGUAGE_FLAGGED_PROFESSIONALISM_POOR');
  }

  // Extract initial dimension scores
  let structure = proposal.breakdown?.structure ?? proposal.dimensionDetails?.structure?.score ?? 6.0;
  let clarity = proposal.breakdown?.clarity ?? proposal.dimensionDetails?.clarity?.score ?? 6.0;
  let depth = proposal.breakdown?.depth ?? proposal.dimensionDetails?.depth?.score ?? 6.0;
  let evidence = proposal.breakdown?.evidence ?? proposal.dimensionDetails?.evidence?.score ?? 5.0;
  let roleAlignment = proposal.breakdown?.roleAlignment ?? proposal.dimensionDetails?.roleAlignment?.score ?? 6.0;

  // Completeness Map Evaluation
  const expectedChars = question.expectedAnswerCharacteristics || [];
  const observedChars = proposal.completenessMap?.observedCharacteristics || [];
  const missingChars = expectedChars.filter((c) => !observedChars.includes(c));
  const coverageRatio = proposal.completenessMap !== undefined
    ? (expectedChars.length > 0 ? Math.round((observedChars.length / expectedChars.length) * 100) / 100 : 1.0)
    : 0.8;

  const completenessMap: CompletenessMapResult = {
    requiredCharacteristics: expectedChars,
    observedCharacteristics: observedChars,
    missingCharacteristics: missingChars,
    coverageRatio,
  };

  // 2. HARD DETERMINISTIC OVERRIDES

  // Overrides for IRRELEVANT
  if (classification === 'irrelevant' || relevanceStatus === 'not_answered') {
    relevanceScore = 0;
    roleAlignment = 0;
    depth = Math.min(2.0, depth);
    evidence = Math.min(2.0, evidence);
    constraintsApplied.push('IRRELEVANT_OVERRIDE_RELEVANCE_ZERO');
    constraintsApplied.push('IRRELEVANT_OVERRIDE_ROLE_ALIGNMENT_ZERO');
    constraintsApplied.push('IRRELEVANT_OVERRIDE_DEPTH_EVIDENCE_CEILING');
  }

  // Overrides for NOT_ANSWERED
  if (classification === 'not_answered') {
    relevanceScore = 0;
    depth = 0;
    evidence = 0;
    roleAlignment = 0;
    structure = Math.min(2.0, structure);
    constraintsApplied.push('NOT_ANSWERED_OVERRIDE_ALL_ZERO');
  }

  // Overrides for SEVERELY EVASIVE
  if (classification === 'evasive') {
    relevanceScore = Math.min(3.0, relevanceScore);
    depth = Math.min(3.0, depth);
    evidence = Math.min(3.0, evidence);
    roleAlignment = Math.min(3.0, roleAlignment);
    constraintsApplied.push('EVASIVE_OVERRIDE_DIMENSIONS_CAPPED_AT_3');
  }

  // Overrides for UNSUPPORTED MAJOR CLAIMS
  const unverifiedClaims = proposal.unverifiedClaims || [];
  if (classification === 'unsupported_claim' || unverifiedClaims.length > 0) {
    evidence = Math.min(3.0, evidence);
    constraintsApplied.push('UNVERIFIED_CLAIM_EVIDENCE_CAPPED_AT_3');
  }

  // Disagreement Detection: LLM proposes high score (> 7.5) but completeness coverage is < 0.35
  if (relevanceScore > 7.5 && coverageRatio < 0.35 && expectedChars.length >= 3) {
    relevanceScore = 5.0;
    depth = Math.min(4.5, depth);
    constraintsApplied.push('DISAGREEMENT_DETECTION_COMPLETENESS_GATE_OVERRIDE');
  }

  // 3. SERVER-SIDE DETERMINISTIC OVERALL SCORE CALCULATION
  // Formula: relevance (25%) + structure (20%) + clarity (15%) + depth (15%) + evidence (15%) + roleAlignment (10%)
  const calculatedOverall = 
    (relevanceScore * 0.25) +
    (structure * 0.20) +
    (clarity * 0.15) +
    (depth * 0.15) +
    (evidence * 0.15) +
    (roleAlignment * 0.10);

  let finalOverall = Math.round(calculatedOverall * 10) / 10;

  // Enforce Hard Ceilings on Final Score
  if (classification === 'irrelevant' && finalOverall > 2.5) {
    finalOverall = 2.5;
    constraintsApplied.push('IRRELEVANT_OVERALL_CEILING_2_5');
  }
  if (classification === 'not_answered' && finalOverall > 2.0) {
    finalOverall = 1.0;
    constraintsApplied.push('NOT_ANSWERED_OVERALL_CEILING_2_0');
  }
  if (classification === 'evasive' && finalOverall > 4.0) {
    finalOverall = 4.0;
    constraintsApplied.push('EVASIVE_OVERALL_CEILING_4_0');
  }

  finalOverall = Math.min(10.0, Math.max(0.0, finalOverall));

  const scoreInterval: [number, number] = [
    Math.max(0.0, Math.round((finalOverall - 0.4) * 10) / 10),
    Math.min(10.0, Math.round((finalOverall + 0.4) * 10) / 10),
  ];

  // 4. Clean Evidence-Grounded Feedback (Zero Positive Bias)
  let whatWorked = proposal.whatWorked || [];
  let whatHeldYouBack = proposal.whatHeldYouBack || [];

  if (classification === 'irrelevant') {
    whatWorked = [];
    whatHeldYouBack = [
      'The response did not address the primary question asked.',
      'No relevant decision-making, trade-off, or domain context was provided.',
    ];
  } else if (classification === 'not_answered') {
    whatWorked = [];
    whatHeldYouBack = ['The question was left unanswered or skipped.'];
  } else if (classification === 'evasive') {
    whatWorked = whatWorked.filter((w) => !/great|excellent|impressive/i.test(w));
    whatHeldYouBack = [
      'The response relied on general statements rather than specific deliverables or decisions.',
      ...whatHeldYouBack,
    ];
  }

  // 5. Adaptive Follow-up Decision
  let shouldFollowUp = proposal.shouldFollowUp ?? false;
  let followUpReasonCode = proposal.followUpReasonCode;

  if (evidence < 4.0 && !followUpReasonCode && finalOverall >= 4.0) {
    shouldFollowUp = true;
    followUpReasonCode = 'missing_metric';
  } else if (depth < 4.0 && !followUpReasonCode && finalOverall >= 4.0) {
    shouldFollowUp = true;
    followUpReasonCode = 'shallow_reasoning';
  } else if (classification === 'irrelevant' || classification === 'not_answered') {
    shouldFollowUp = false; // Progress cleanly rather than looping on non-answers
  }

  // Assemble Detailed Dimension Breakdowns
  const dimensionDetails = {
    relevance: {
      score: relevanceScore,
      reason: proposal.dimensionDetails?.relevance?.reason || 'Directness in answering the core prompt.',
      evidence: proposal.dimensionDetails?.relevance?.evidence || 'Observable answer statements.',
      missing: proposal.dimensionDetails?.relevance?.missing || '',
    },
    structure: {
      score: structure,
      reason: proposal.dimensionDetails?.structure?.reason || 'Logical narrative organization and flow.',
      evidence: proposal.dimensionDetails?.structure?.evidence || '',
      missing: proposal.dimensionDetails?.structure?.missing || '',
    },
    clarity: {
      score: clarity,
      reason: proposal.dimensionDetails?.clarity?.reason || 'Articulate delivery and concise expression.',
      evidence: proposal.dimensionDetails?.clarity?.evidence || '',
      missing: proposal.dimensionDetails?.clarity?.missing || '',
    },
    depth: {
      score: depth,
      reason: proposal.dimensionDetails?.depth?.reason || 'First-principles reasoning and technical/strategic granularity.',
      evidence: proposal.dimensionDetails?.depth?.evidence || '',
      missing: proposal.dimensionDetails?.depth?.missing || '',
    },
    evidence: {
      score: evidence,
      reason: proposal.dimensionDetails?.evidence?.reason || 'Concrete metrics, verified deliverables, and baseline numbers.',
      evidence: proposal.dimensionDetails?.evidence?.evidence || '',
      missing: proposal.dimensionDetails?.evidence?.missing || '',
    },
    roleAlignment: {
      score: roleAlignment,
      reason: proposal.dimensionDetails?.roleAlignment?.reason || 'Tailoring to target role responsibilities and hiring bar.',
      evidence: proposal.dimensionDetails?.roleAlignment?.evidence || '',
      missing: proposal.dimensionDetails?.roleAlignment?.missing || '',
    },
  };

  return {
    overallScore: finalOverall,
    scoreInterval,
    answerClassification: classification,
    relevanceGate: {
      status: relevanceStatus,
      score: relevanceScore,
      reason: proposal.relevanceGate?.reason || (relevanceStatus === 'answered' ? 'Addressed core prompt.' : 'Did not address core prompt.'),
    },
    professionalism: {
      status: professionalismStatus,
      note: proposal.professionalism?.note,
    },
    completenessMap,
    breakdown: {
      relevance: relevanceScore,
      structure,
      clarity,
      depth,
      evidence,
      roleAlignment,
    },
    dimensionDetails,
    unverifiedClaims,
    whatWorked,
    whatHeldYouBack,
    tryThisNextTime: {
      framework: proposal.tryThisNextTime?.framework || 'STAR with Metric Guardrails',
      suggestion: proposal.tryThisNextTime?.suggestion || 'State your baseline metric and explicit personal decision.',
      promptToImprove: proposal.tryThisNextTime?.promptToImprove || 'State your hypothesis and quantifiable outcome.',
      examplePhrasing: proposal.tryThisNextTime?.examplePhrasing,
    },
    deterministicConstraintsApplied: constraintsApplied,
    shouldFollowUp,
    followUpReasonCode,
  };
}

export function calculateOverallScore(breakdown: {
  relevance: number;
  structure: number;
  clarity: number;
  depth: number;
  evidence: number;
  roleAlignment: number;
}): number {
  const calculated = 
    (breakdown.relevance * 0.25) +
    (breakdown.structure * 0.20) +
    (breakdown.clarity * 0.15) +
    (breakdown.depth * 0.15) +
    (breakdown.evidence * 0.15) +
    (breakdown.roleAlignment * 0.10);
  return Math.min(10.0, Math.max(0.0, Math.round(calculated * 10) / 10));
}

export function calculateReadinessPercentage(overallScore: number): number {
  return Math.min(100, Math.max(0, Math.round(overallScore * 10)));
}

export interface RawEvaluationProposal {
  answerClassification?: string;
  relevanceGate?: { status: string; score: number; reason: string };
  professionalism?: { status: string; note?: string };
  completenessMap?: { requiredCharacteristics: string[]; observedCharacteristics: string[]; coverageRatio: number };
  unverifiedClaims?: { claim: string; resumeSupport: string; note: string }[];
  breakdown?: {
    relevance?: number;
    structure?: number;
    clarity?: number;
    depth?: number;
    evidence?: number;
    roleAlignment?: number;
  };
  dimensionDetails?: any;
  whatWorked?: string[];
  whatHeldYouBack?: string[];
  tryThisNextTime?: any;
  shouldFollowUp?: boolean;
  followUpReasonCode?: string;
}

export function applyDeterministicConstraints(
  proposal: RawEvaluationProposal,
  question: any,
  candidateAnswerText: string
) {
  const constraintsApplied: string[] = [];
  const cleanAnswer = (candidateAnswerText || '').trim();

  let classification = proposal.answerClassification || 'adequate';
  let relevanceStatus = proposal.relevanceGate?.status || 'answered';
  let relevanceScore = proposal.breakdown?.relevance ?? proposal.dimensionDetails?.relevance?.score ?? 6.0;

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

  let professionalismStatus = proposal.professionalism?.status || 'acceptable';
  if (/stupid question|dumb question|i don't care|whatever just give me|waste of time/i.test(cleanAnswer)) {
    professionalismStatus = 'poor';
    if (classification !== 'irrelevant' && classification !== 'not_answered') {
      classification = 'unprofessional';
    }
    constraintsApplied.push('RUDE_LANGUAGE_FLAGGED_PROFESSIONALISM_POOR');
  }

  let structure = proposal.breakdown?.structure ?? proposal.dimensionDetails?.structure?.score ?? 6.0;
  let clarity = proposal.breakdown?.clarity ?? proposal.dimensionDetails?.clarity?.score ?? 6.0;
  let depth = proposal.breakdown?.depth ?? proposal.dimensionDetails?.depth?.score ?? 6.0;
  let evidence = proposal.breakdown?.evidence ?? proposal.dimensionDetails?.evidence?.score ?? 5.0;
  let roleAlignment = proposal.breakdown?.roleAlignment ?? proposal.dimensionDetails?.roleAlignment?.score ?? 6.0;

  const expectedChars = question?.expectedAnswerCharacteristics || [];
  const observedChars = proposal.completenessMap?.observedCharacteristics || [];
  const missingChars = expectedChars.filter((c: string) => !observedChars.includes(c));
  const coverageRatio = proposal.completenessMap !== undefined
    ? (expectedChars.length > 0 ? Math.round((observedChars.length / expectedChars.length) * 100) / 100 : 1.0)
    : 0.8;

  const completenessMap = {
    requiredCharacteristics: expectedChars,
    observedCharacteristics: observedChars,
    missingCharacteristics: missingChars,
    coverageRatio,
  };

  // HARD OVERRIDES
  if (classification === 'irrelevant' || relevanceStatus === 'not_answered') {
    relevanceScore = 0;
    roleAlignment = 0;
    depth = Math.min(2.0, depth);
    evidence = Math.min(2.0, evidence);
    constraintsApplied.push('IRRELEVANT_OVERRIDE_RELEVANCE_ZERO');
    constraintsApplied.push('IRRELEVANT_OVERRIDE_ROLE_ALIGNMENT_ZERO');
    constraintsApplied.push('IRRELEVANT_OVERRIDE_DEPTH_EVIDENCE_CEILING');
  }

  if (classification === 'not_answered') {
    relevanceScore = 0;
    depth = 0;
    evidence = 0;
    roleAlignment = 0;
    structure = Math.min(2.0, structure);
    constraintsApplied.push('NOT_ANSWERED_OVERRIDE_ALL_ZERO');
  }

  if (classification === 'evasive') {
    relevanceScore = Math.min(3.0, relevanceScore);
    depth = Math.min(3.0, depth);
    evidence = Math.min(3.0, evidence);
    roleAlignment = Math.min(3.0, roleAlignment);
    constraintsApplied.push('EVASIVE_OVERRIDE_DIMENSIONS_CAPPED_AT_3');
  }

  const unverifiedClaims = proposal.unverifiedClaims || [];
  if (classification === 'unsupported_claim' || unverifiedClaims.length > 0) {
    evidence = Math.min(3.0, evidence);
    constraintsApplied.push('UNVERIFIED_CLAIM_EVIDENCE_CAPPED_AT_3');
  }

  if (relevanceScore > 7.5 && coverageRatio < 0.35 && expectedChars.length >= 3) {
    relevanceScore = 5.0;
    depth = Math.min(4.5, depth);
    constraintsApplied.push('DISAGREEMENT_DETECTION_COMPLETENESS_GATE_OVERRIDE');
  }

  const calculatedOverall = 
    (relevanceScore * 0.25) +
    (structure * 0.20) +
    (clarity * 0.15) +
    (depth * 0.15) +
    (evidence * 0.15) +
    (roleAlignment * 0.10);

  let finalOverall = Math.round(calculatedOverall * 10) / 10;

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

  const scoreInterval = [
    Math.max(0.0, Math.round((finalOverall - 0.4) * 10) / 10),
    Math.min(10.0, Math.round((finalOverall + 0.4) * 10) / 10),
  ];

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
    whatWorked = whatWorked.filter((w: string) => !/great|excellent|impressive/i.test(w));
    whatHeldYouBack = [
      'The response relied on general statements rather than specific deliverables or decisions.',
      ...whatHeldYouBack,
    ];
  }

  let shouldFollowUp = proposal.shouldFollowUp ?? false;
  let followUpReasonCode = proposal.followUpReasonCode;

  if (evidence < 4.0 && !followUpReasonCode && finalOverall >= 4.0) {
    shouldFollowUp = true;
    followUpReasonCode = 'missing_metric';
  } else if (depth < 4.0 && !followUpReasonCode && finalOverall >= 4.0) {
    shouldFollowUp = true;
    followUpReasonCode = 'shallow_reasoning';
  } else if (classification === 'irrelevant' || classification === 'not_answered') {
    shouldFollowUp = false;
  }

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

export function computeDeterministicMatchScore(
  requiredSkillsPoints: number,
  experiencePoints: number,
  competencyPoints: number
) {
  const rawScore = Math.min(100, Math.max(0, Math.round(requiredSkillsPoints + experiencePoints + competencyPoints)));
  return {
    requiredSkillsCoverage: Math.round(requiredSkillsPoints),
    experienceAlignment: Math.round(experiencePoints),
    competenciesMatch: Math.round(competencyPoints),
    totalScore: rawScore,
  };
}

export function calculateReadinessPercentage(overallScore: number): number {
  return Math.min(100, Math.max(0, Math.round(overallScore * 10)));
}

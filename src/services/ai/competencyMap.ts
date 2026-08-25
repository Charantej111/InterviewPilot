/**
 * Competency Map & Evidence Engine — Deterministic State Tracking
 *
 * Tracks granular assessment status and evidence reliability per competency.
 * Distinguishes "Question Asked" from "Competency Assessed".
 *
 * Zero AI calls. 100% deterministic TypeScript evaluation.
 */

import type {
  InterviewContract,
  CompetencyMap,
  CompetencyState,
  CompetencyEvidence,
  QuestionFeedback,
  InterviewObjective,
} from '../../types/interview';
import type { LockedCandidateContext } from '../../types/resume';
import type { JDEvidenceModel } from '../../types/jobDescription';

/**
 * Initializes the clean CompetencyMap at interview start.
 */
export function initializeCompetencyMap(
  contract: InterviewContract,
  _candidateContext?: LockedCandidateContext | null,
  _jdEvidenceModel?: JDEvidenceModel | null
): CompetencyMap {
  const map: CompetencyMap = {};

  for (const comp of contract.criticalCompetencies) {
    if (!comp) continue;
    map[comp] = {
      status: 'untested',
      confidence: 'none',
      evidence: [],
      missingSignals: [],
      questionsAsked: 0,
      followUpsUsed: 0,
      assessmentReliability: 'insufficient',
      importance: 'critical',
    };
  }

  for (const comp of contract.optionalCompetencies) {
    if (!comp || map[comp]) continue;
    map[comp] = {
      status: 'untested',
      confidence: 'none',
      evidence: [],
      missingSignals: [],
      questionsAsked: 0,
      followUpsUsed: 0,
      assessmentReliability: 'insufficient',
      importance: 'optional',
    };
  }

  return map;
}

/**
 * Expected evidence signals based on question type.
 */
export function getExpectedSignalsForType(questionType: InterviewObjective['questionType']): string[] {
  switch (questionType) {
    case 'behavioral':
      return ['situation context', 'personal action', 'decision rationale', 'measurable outcome'];
    case 'product_sense':
      return ['user framing', 'prioritization criteria', 'alternative options', 'trade-off analysis', 'concrete recommendation'];
    case 'analytical':
      return ['problem decomposition', 'hypothesis formulation', 'metric selection', 'cohort segmentation', 'investigation sequence'];
    case 'system_design':
      return ['requirements & constraints', 'high-level architecture', 'component trade-offs', 'scalability & failure modes'];
    case 'resume_deep_dive':
      return ['individual ownership', 'technical decision', 'concrete contribution', 'impact/result'];
    case 'execution':
      return ['roadblock mitigation', 'agile delivery', 'risk mitigation', 'velocity/metric lift'];
    case 'case':
      return ['structured framework', 'business model awareness', 'first-principles analysis', 'strategic trade-off'];
    default:
      return ['direct answer', 'reasoning clarity', 'specific evidence'];
  }
}

/**
 * Updates a competency's evidence state based on answer evaluation and objective context.
 */
export function updateCompetencyState(
  currentState: CompetencyState,
  evaluation: QuestionFeedback,
  objective: InterviewObjective,
  answerText: string
): CompetencyState {
  const questionsAsked = currentState.questionsAsked + 1;
  const followUpsUsed = objective.isFollowUp ? currentState.followUpsUsed + 1 : currentState.followUpsUsed;

  const textLower = (answerText || '').trim().toLowerCase();

  // 1. Handle special non-penalized responses
  const isDontKnow = /^(i don'?t know|not sure|i am not familiar|i haven'?t worked with)/i.test(textLower) || textLower === "i don't know";
  const isClarification = /^(could you clarify|can you repeat|what do you mean by|could you rephrase)/i.test(textLower);

  if (isClarification) {
    // Clarification request does not penalize competency
    return {
      ...currentState,
      questionsAsked: currentState.questionsAsked, // do not consume question count
      missingSignals: ['Awaiting question clarification.'],
    };
  }

  if (isDontKnow) {
    // Honest "I don't know" is not marked evasive; marks status partial with insufficient reliability
    return {
      ...currentState,
      status: 'partial',
      confidence: 'none',
      assessmentReliability: 'insufficient',
      missingSignals: ['Candidate acknowledged lack of direct experience in this area.'],
      questionsAsked,
      followUpsUsed,
    };
  }

  // 2. Extract expected signals for this objective
  const expectedSignals = objective.expectedSignals && objective.expectedSignals.length > 0
    ? objective.expectedSignals
    : getExpectedSignalsForType(objective.questionType);

  const observedSignals = evaluation.observedSignals || evaluation.whatWorked || [];
  const missingSignals: string[] = [];

  // Determine missing signals: check if expected signals were demonstrated
  for (const exp of expectedSignals) {
    const expLower = exp.toLowerCase();
    const isObserved = observedSignals.some((obs) => obs.toLowerCase().includes(expLower) || expLower.includes(obs.toLowerCase()));
    
    // Check specific signal requirements:
    // Only flag missing metric if the question/objective actually expected a metric
    const isMetricSignal = expLower.includes('metric') || expLower.includes('outcome') || expLower.includes('result');
    if (isMetricSignal) {
      const hasNumbers = /\d+%?|\b(increased|decreased|reduced|boosted|grew|lifted)\b/i.test(textLower);
      if (!hasNumbers && !isObserved) {
        missingSignals.push(exp);
      }
      continue;
    }

    if (!isObserved && evaluation.overallScore < 7.5) {
      missingSignals.push(exp);
    }
  }

  // 3. New evidence items from evaluation
  const newEvidence: CompetencyEvidence[] = [...currentState.evidence];
  if (evaluation.overallScore >= 6.0 && evaluation.whatWorked && evaluation.whatWorked.length > 0) {
    for (const item of evaluation.whatWorked) {
      newEvidence.push({
        signal: item,
        strength: evaluation.overallScore >= 8.0 ? 'strong' : 'moderate',
        sourceText: answerText.slice(0, 200),
      });
    }
  }

  // 4. Handle contradiction penalty
  const hasContradiction = evaluation.unverifiedClaims?.some((c) => c.resumeSupport === 'contradicted');

  // 5. Determine new AssessmentStatus, Confidence, and AssessmentReliability
  let status: CompetencyState['status'] = currentState.status;
  let confidence: CompetencyState['confidence'] = currentState.confidence;
  let assessmentReliability: CompetencyState['assessmentReliability'] = currentState.assessmentReliability;

  const score = evaluation.overallScore;
  const isDirectlyAnswered = evaluation.relevanceGate?.status === 'answered';

  if (hasContradiction) {
    status = 'partial';
    confidence = 'low';
    assessmentReliability = 'insufficient';
  } else if (score >= 7.5 && isDirectlyAnswered && missingSignals.length === 0) {
    status = 'assessed';
    confidence = 'high';
    assessmentReliability = 'reliable';
  } else if (score >= 6.0 && isDirectlyAnswered && missingSignals.length <= 1) {
    status = 'partial';
    confidence = 'medium';
    assessmentReliability = 'provisional';
  } else if (score >= 4.5) {
    status = 'partial';
    confidence = 'low';
    assessmentReliability = 'insufficient';
  } else {
    // Low score / weak / evasive answer
    status = 'partial';
    confidence = 'low';
    assessmentReliability = 'insufficient';
  }

  // If already reliable, keep reliable unless contradicted
  if (currentState.assessmentReliability === 'reliable' && !hasContradiction && score >= 6.0) {
    assessmentReliability = 'reliable';
    status = 'assessed';
    confidence = 'high';
  }

  return {
    status,
    confidence,
    evidence: newEvidence,
    missingSignals,
    questionsAsked,
    followUpsUsed,
    assessmentReliability,
    importance: currentState.importance,
  };
}

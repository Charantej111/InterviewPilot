/**
 * Deterministic Answer Evaluator — Pre-Flight & Fallback Engine
 *
 * Implements rule-based evaluation, classification gating, and evidence extraction.
 * Extracts genuine candidate evidence quotes; zero generic praise without evidence.
 *
 * 100% deterministic TypeScript.
 */

import type {
  Question,
  QuestionFeedback,
  AnswerEvaluation,
  AnswerEvaluationClassification,
  PositiveObservation,
  GapObservation,
  CompetencySignalExtracted,
} from '../../types/interview';
import { calculateDeterministicScore } from './answerScoreEngine';
import { getExpectedSignalsForType } from './competencyMap';

export interface DeterministicEvaluationInput {
  question: Question;
  answerText: string;
  role: string;
  company: string;
  difficulty?: string;
}

export function evaluateAnswerDeterministically(
  input: DeterministicEvaluationInput
): QuestionFeedback & { followUpNeeded: boolean; followUpTriggerReason?: string } {
  const { question, answerText, role, company } = input;
  const cleanAnswer = (answerText || '').trim();
  const lowerAnswer = cleanAnswer.toLowerCase();

  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const targetCompetency = question.targetCompetency || question.category || 'Domain Competency';
  const expectedSignals = question.expectedSignals && question.expectedSignals.length > 0
    ? question.expectedSignals
    : getExpectedSignalsForType(question.questionType || 'product_sense');

  // ─── 1. Detect Special Conversational Patterns ────────────────────────────

  const isRepeat = /(could you (please )?repeat|can you repeat|please repeat|repeat the question|say that again)/i.test(lowerAnswer);
  const isClarify = /(could you (please )?clarify|can you clarify|what do you mean by|could you rephrase)/i.test(lowerAnswer);
  const isRefusal = /(i['’]?d\s+rather\s+not|i\s+would\s+rather\s+not|i\s+refuse\s+to\s+answer|rather\s+not\s+answer|skip\s+this\s+question|next\s+question\s+please|prefer\s+not\s+to\s+answer)/i.test(lowerAnswer);
  const isDontKnow = /(i['’]?d?\s*don['’]?t\s*know|not\s+sure|i\s*am\s*not\s*familiar|i\s*haven['’]?t\s*worked|don['’]?t\s*have\s*experience|no\s+experience)/i.test(lowerAnswer);

  let classification: AnswerEvaluationClassification = 'answered';

  if (isRepeat) {
    classification = 'repeat_request';
  } else if (isClarify) {
    classification = 'clarification_request';
  } else if (isRefusal) {
    classification = 'refusal';
  } else if (isDontKnow) {
    classification = 'uncertain';
  } else if (wordCount < 4) {
    classification = 'not_answered';
  }

  // 3. Question Relevance & Domain Keyword Overlap (include 3-letter domain terms like dau, app, api, sql, kpi)
  const questionWords = (question.text || '')
    .toLowerCase()
    .split(/[\s,?.!-]+/)
    .filter((w) => w.length >= 3 && !['what', 'when', 'where', 'which', 'how', 'describe', 'tell', 'explain', 'walk', 'your', 'with', 'about', 'this', 'that', 'have', 'from', 'into', 'would', 'could', 'should', 'for', 'the', 'and'].includes(w));

  const matchedQuestionKeywords = questionWords.filter((kw) => lowerAnswer.includes(kw));
  const isIrrelevantKeyword = /\b(cricket|ipl|football|movie|weather|dinner|pizza|burger|swimming|beach)\b/i.test(lowerAnswer) && matchedQuestionKeywords.length === 0;

  if (isIrrelevantKeyword && classification === 'answered') {
    classification = 'irrelevant';
  }

  // ─── 2. Handle Irrelevant / Gated Classifications ─────────────────────────

  if (classification === 'irrelevant' || classification === 'refusal') {
    const evaluation: AnswerEvaluation = {
      questionId: question.id,
      answerClassification: classification,
      relevanceGate: {
        status: 'not_answered',
        reason: classification === 'irrelevant' ? 'Candidate response was completely off-topic.' : 'Candidate declined to answer.',
      },
      positiveObservations: [],
      gaps: expectedSignals.map((sig) => ({ missingSignal: sig, expectedSignal: sig })),
      dimensions: {
        relevance: { score: 0.0, assessmentStatus: 'assessed', reason: 'Zero relevance to the prompt.' },
        roleAlignment: { score: 0.0, assessmentStatus: 'assessed', reason: 'Did not align with role requirements.' },
        depth: { score: 0.0, assessmentStatus: 'assessed', reason: 'No domain depth provided.' },
        evidence: { score: 0.0, assessmentStatus: 'assessed', reason: 'No evidence provided.' },
        clarity: { score: null, assessmentStatus: 'not_assessable', reason: 'Not assessable on off-topic answer.' },
        structure: { score: null, assessmentStatus: 'not_assessable', reason: 'Not assessable on off-topic answer.' },
      },
      competencySignalsExtracted: [],
      expectedSignals,
      demonstratedSignals: [],
      missingSignals: expectedSignals,
    };

    const detScore = calculateDeterministicScore(evaluation);

    return {
      questionId: question.id,
      overallScore: detScore.score,
      scoreInterval: detScore.scoreInterval,
      answerClassification: classification,
      relevanceGate: { ...evaluation.relevanceGate, score: detScore.score },
      professionalism: { status: classification === 'refusal' ? 'acceptable' : 'poor' },
      breakdown: {
        relevance: 0,
        structure: 0,
        clarity: 0,
        depth: 0,
        evidence: 0,
        roleAlignment: 0,
      },
      whatWorked: [],
      whatHeldYouBack: [classification === 'irrelevant' ? 'The answer was unrelated to the question asked.' : 'The question was declined.'],
      tryThisNextTime: {
        framework: 'Domain Focus',
        suggestion: `Please address the specific scenario for ${role} at ${company}.`,
        promptToImprove: 'What is your direct experience or structured approach to this problem?',
      },
      followUpNeeded: true,
      followUpTriggerReason: 'irrelevant_answer',
      missingSignals: expectedSignals,
      observedSignals: [],
      answerEvaluation: evaluation,
      deterministicScore: detScore,
    };
  }

  // ─── 3. Handle Special Non-Penalized Classifications ──────────────────────

  if (classification === 'repeat_request' || classification === 'clarification_request' || classification === 'uncertain') {
    const evaluation: AnswerEvaluation = {
      questionId: question.id,
      answerClassification: classification,
      relevanceGate: {
        status: classification === 'uncertain' ? 'not_answered' : 'partially_answered',
        reason: classification === 'uncertain' ? 'Candidate acknowledged lack of experience.' : 'Clarification / repeat requested.',
      },
      positiveObservations: [],
      gaps: expectedSignals.map((sig) => ({ missingSignal: sig, expectedSignal: sig })),
      dimensions: {
        relevance: { score: classification === 'uncertain' ? 3.0 : 5.0, assessmentStatus: 'assessed', reason: 'Conversational response.' },
        roleAlignment: { score: classification === 'uncertain' ? 2.0 : 5.0, assessmentStatus: 'assessed', reason: 'Awaiting substantive technical evidence.' },
        depth: { score: classification === 'uncertain' ? 1.0 : null, assessmentStatus: classification === 'uncertain' ? 'assessed' : 'not_assessable', reason: 'No depth demonstrated.' },
        evidence: { score: classification === 'uncertain' ? 1.0 : null, assessmentStatus: classification === 'uncertain' ? 'assessed' : 'not_assessable', reason: 'No evidence demonstrated.' },
        clarity: { score: 7.0, assessmentStatus: 'assessed', reason: 'Direct communication.' },
        structure: { score: null, assessmentStatus: 'not_assessable', reason: 'Conversational inquiry.' },
      },
      competencySignalsExtracted: [],
      expectedSignals,
      demonstratedSignals: [],
      missingSignals: expectedSignals,
    };

    const detScore = calculateDeterministicScore(evaluation);

    return {
      questionId: question.id,
      overallScore: detScore.score,
      scoreInterval: detScore.scoreInterval,
      answerClassification: classification,
      relevanceGate: { ...evaluation.relevanceGate, score: detScore.score },
      professionalism: { status: 'acceptable' },
      breakdown: {
        relevance: classification === 'uncertain' ? 3 : 5,
        structure: 5,
        clarity: 7,
        depth: classification === 'uncertain' ? 1 : 5,
        evidence: classification === 'uncertain' ? 1 : 5,
        roleAlignment: classification === 'uncertain' ? 2 : 5,
      },
      whatWorked: [],
      whatHeldYouBack: classification === 'uncertain' ? ['Candidate stated unfamiliarity with this area.'] : [],
      tryThisNextTime: {
        framework: 'Growth Mindset',
        suggestion: 'Consider related principles or first-principles reasoning if unfamiliar with exact tooling.',
        promptToImprove: 'How would you approach learning or decomposing this problem from first principles?',
      },
      followUpNeeded: false,
      missingSignals: expectedSignals,
      observedSignals: [],
      answerEvaluation: evaluation,
      deterministicScore: detScore,
    };
  }

  // ─── 4. Substantive Answer Evidence Extraction & Dimension Scoring ────────

  const positiveObservations: PositiveObservation[] = [];
  const gaps: GapObservation[] = [];
  const demonstratedSignals: string[] = [];
  const missingSignals: string[] = [];
  const competencySignalsExtracted: CompetencySignalExtracted[] = [];

  // Check metrics / numbers
  const hasNumbers = /\b(\d+%|\d+x|\$\d+|\d+\s*(?:users|ms|seconds|minutes|hours|days|weeks|months|years|kb|mb|gb|tb|engineers|customers|qps))\b/i.test(cleanAnswer);
  
  // Check action verbs & analytical verbs
  const actionVerbs = [
    'analyzed', 'analyze', 'designed', 'design', 'built', 'build', 'implemented', 'implement',
    'led', 'architected', 'optimized', 'optimize', 'reduced', 'reduce', 'increased', 'increase',
    'prioritized', 'prioritize', 'shipped', 'measured', 'measure', 'decompose', 'decomposed',
    'investigate', 'investigated', 'formulate', 'formulated', 'check', 'checked', 'segment', 'segmented',
  ];
  const matchedActions = actionVerbs.filter((v) => lowerAnswer.includes(v));

  // Check trade-offs
  const hasTradeoffs = /\b(trade-off|tradeoff|versus|compromise|alternative|option a|option b|drawback|downside|latency vs|cost vs)\b/i.test(lowerAnswer);

  for (const sig of expectedSignals) {
    const sigLower = sig.toLowerCase();
    const isMetricSig = sigLower.includes('metric') || sigLower.includes('outcome') || sigLower.includes('result');
    const isTradeoffSig = sigLower.includes('trade-off') || sigLower.includes('alternative') || sigLower.includes('decision');

    if (isMetricSig && hasNumbers) {
      demonstratedSignals.push(sig);
      positiveObservations.push({
        observation: `Quantified outcome and metrics demonstrated`,
        evidenceText: cleanAnswer.slice(0, 150),
      });
      competencySignalsExtracted.push({
        competency: targetCompetency,
        signalStrength: 'strong',
        evidenceText: cleanAnswer.slice(0, 150),
      });
    } else if (isTradeoffSig && hasTradeoffs) {
      demonstratedSignals.push(sig);
      positiveObservations.push({
        observation: `Articulated strategic trade-offs and alternatives`,
        evidenceText: cleanAnswer.slice(0, 150),
      });
      competencySignalsExtracted.push({
        competency: targetCompetency,
        signalStrength: 'strong',
        evidenceText: cleanAnswer.slice(0, 150),
      });
    } else if (matchedQuestionKeywords.length >= 2 || matchedActions.length >= 2) {
      demonstratedSignals.push(sig);
      positiveObservations.push({
        observation: `Direct application of ${sig}`,
        evidenceText: cleanAnswer.slice(0, 120),
      });
    } else {
      missingSignals.push(sig);
      gaps.push({ missingSignal: sig, expectedSignal: sig });
    }
  }

  // Dimension scoring based on demonstrated evidence
  const relevanceScore = Math.min(10.0, 5.0 + matchedQuestionKeywords.length * 1.5);
  const depthScore = Math.min(10.0, 5.0 + (hasTradeoffs ? 2.5 : 0) + (matchedActions.length >= 2 ? 2.0 : 0) + (wordCount > 20 ? 1.0 : 0));
  const evidenceScore = Math.min(10.0, 4.5 + (hasNumbers ? 4.0 : matchedActions.length >= 2 ? 2.5 : 1.0));
  const structureScore = hasTradeoffs || matchedActions.length >= 2 ? 8.0 : 6.0;
  const clarityScore = wordCount >= 15 && wordCount <= 200 ? 8.5 : 7.0;
  const roleAlignmentScore = Math.min(10.0, 5.0 + matchedQuestionKeywords.length * 1.2);

  const dimensions: AnswerEvaluation['dimensions'] = {
    relevance: { score: relevanceScore, assessmentStatus: 'assessed', reason: `Matched ${matchedQuestionKeywords.length} question keywords.` },
    depth: { score: depthScore, assessmentStatus: 'assessed', reason: hasTradeoffs ? 'Analyzed trade-offs.' : 'General explanation.' },
    evidence: { score: evidenceScore, assessmentStatus: 'assessed', reason: hasNumbers ? 'Quantified metrics provided.' : 'Qualitative explanation.' },
    structure: { score: structureScore, assessmentStatus: 'assessed', reason: 'Structured narrative.' },
    clarity: { score: clarityScore, assessmentStatus: 'assessed', reason: 'Clear articulation.' },
    roleAlignment: { score: roleAlignmentScore, assessmentStatus: 'assessed', reason: `Aligned with ${role} expectations.` },
  };

  const evaluation: AnswerEvaluation = {
    questionId: question.id,
    answerClassification: demonstratedSignals.length >= expectedSignals.length ? 'strong' : missingSignals.length > 1 ? 'partially_answered' : 'answered',
    relevanceGate: {
      status: relevanceScore >= 5.0 ? 'answered' : 'partially_answered',
      reason: `Directly addressed core scenario.`,
    },
    positiveObservations,
    gaps,
    dimensions,
    competencySignalsExtracted,
    expectedSignals,
    demonstratedSignals,
    missingSignals,
  };

  const detScore = calculateDeterministicScore(evaluation);
  const isWeak = detScore.score < 5.5;

  return {
    questionId: question.id,
    overallScore: detScore.score,
    scoreInterval: detScore.scoreInterval,
    answerClassification: isWeak ? 'weak' : detScore.score >= 8.0 ? 'strong' : 'adequate',
    relevanceGate: { ...evaluation.relevanceGate, score: detScore.score },
    professionalism: { status: 'acceptable' },
    breakdown: {
      relevance: dimensions.relevance.score || 0,
      structure: dimensions.structure.score || 0,
      clarity: dimensions.clarity.score || 0,
      depth: dimensions.depth.score || 0,
      evidence: dimensions.evidence.score || 0,
      roleAlignment: dimensions.roleAlignment.score || 0,
    },
    whatWorked: positiveObservations.map((p) => p.observation),
    whatHeldYouBack: gaps.map((g) => `Missing evidence on: ${g.missingSignal}`),
    tryThisNextTime: {
      framework: 'STAR / Evidence Framework',
      suggestion: `Include specific trade-offs and metrics for ${role}.`,
      promptToImprove: 'What exact metrics or technical trade-offs were measured?',
    },
    shouldFollowUp: isWeak && missingSignals.length > 0,
    followUpReasonCode: isWeak ? 'missing_evidence' : undefined,
    followUpNeeded: isWeak && missingSignals.length > 0,
    followUpTriggerReason: isWeak ? 'missing_evidence' : undefined,
    observedSignals: demonstratedSignals,
    missingSignals,
    answerEvaluation: evaluation,
    deterministicScore: detScore,
  };
}

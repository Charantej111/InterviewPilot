import { Question, QuestionFeedback, ConversationTurn } from '../../types/interview';

export type FollowUpReasonCode = 
  | 'missing_evidence'
  | 'missing_metric'
  | 'unclear_decision'
  | 'missing_tradeoff'
  | 'shallow_reasoning'
  | 'unsupported_claim'
  | 'partial_answer'
  | 'technical_gap';

export interface FollowUpDecision {
  shouldProbe: boolean;
  reasonCode?: FollowUpReasonCode;
  probePrompt?: string;
  rationale: string;
}

export function evaluateFollowUpStrategy(
  question: Question,
  feedback: QuestionFeedback,
  followUpsUsedForQuestion: number,
  _recentTurns: ConversationTurn[] = []
): FollowUpDecision {
  // 1. Budget Enforcer: Max 1 follow-up by default, max 2 in exceptional cases
  if (followUpsUsedForQuestion >= 2) {
    return {
      shouldProbe: false,
      rationale: 'Maximum follow-up probe budget (2) reached for this question. Progressing to next anchor.',
    };
  }

  // 2. Non-answers or irrelevant answers should NOT loop endlessly
  if (
    feedback.answerClassification === 'not_answered' ||
    feedback.answerClassification === 'irrelevant'
  ) {
    return {
      shouldProbe: false,
      rationale: 'Answer classified as irrelevant or unanswered. Progressing to next competency anchor.',
    };
  }

  // 3. Complete answers with strong evidence should progress
  if (
    feedback.overallScore >= 7.5 &&
    feedback.breakdown.evidence >= 7.0 &&
    feedback.breakdown.depth >= 7.0
  ) {
    return {
      shouldProbe: false,
      rationale: 'Strong evidence and depth established. No additional probe required.',
    };
  }

  // 4. Determine Specific Reason Code
  let reasonCode: FollowUpReasonCode | undefined = feedback.followUpReasonCode;
  let probePrompt: string | undefined;

  if (!reasonCode) {
    if (feedback.breakdown.evidence < 5.0) {
      reasonCode = 'missing_metric';
    } else if (feedback.breakdown.depth < 5.0) {
      reasonCode = 'shallow_reasoning';
    } else if (feedback.unverifiedClaims && feedback.unverifiedClaims.length > 0) {
      reasonCode = 'unsupported_claim';
    } else if (feedback.relevanceGate.status === 'partially_answered') {
      reasonCode = 'partial_answer';
    }
  }

  // If after 1 follow-up the score is already satisfactory (>= 6.5) and no major gap remains, do not force a second probe
  if (followUpsUsedForQuestion >= 1 && feedback.overallScore >= 6.5) {
    return {
      shouldProbe: false,
      rationale: 'Sufficient competency evidence gathered after 1 follow-up. Progressing session.',
    };
  }

  if (reasonCode) {
    switch (reasonCode) {
      case 'missing_metric':
        probePrompt = `Could you share the specific quantitative baseline or impact metrics you measured to evaluate success?`;
        break;
      case 'shallow_reasoning':
        probePrompt = `What were the alternative approaches you considered before choosing this direction, and what key trade-offs guided your decision?`;
        break;
      case 'unsupported_claim':
        probePrompt = `Could you walk me through your specific personal contribution and hands-on decisions in that project?`;
        break;
      case 'missing_tradeoff':
        probePrompt = `What were the biggest risks or counter-arguments you faced, and how did you mitigate them?`;
        break;
      case 'unclear_decision':
        probePrompt = `What was the exact decision framework or criteria you used to make the final call?`;
        break;
      case 'partial_answer':
        probePrompt = `To make sure we cover the entire scope, could you address how you handled ${question.targetCompetency || 'the implementation constraints'}?`;
        break;
      default:
        probePrompt = `Could you elaborate on the key challenges you encountered during execution and how you resolved them?`;
    }

    return {
      shouldProbe: true,
      reasonCode,
      probePrompt,
      rationale: `Targeted follow-up probe triggered for ${reasonCode}.`,
    };
  }

  return {
    shouldProbe: false,
    rationale: 'No qualifying competency gap requiring follow-up.',
  };
}

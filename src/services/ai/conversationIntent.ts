/**
 * Conversation Intent Engine — Deterministic Interview Flow Coordinator
 *
 * Implements the deterministic state layer that decides WHAT conversational action happens next.
 * The LLM only receives this intent and generates the natural phrasing — it does NOT decide strategy.
 *
 * Zero LLM calls in intent determination. 100% deterministic TypeScript.
 */

import type {
  AnswerEvaluation,
  ConversationIntent,
  InterviewObjective,
  Question,
} from '../../types/interview';

export function deriveConversationIntent(
  evaluation: Partial<AnswerEvaluation>,
  nextObjective: InterviewObjective,
  currentQuestion?: Question,
  isTimeClosing = false
): ConversationIntent {
  const classification = evaluation.answerClassification;

  // 1. Repeat Request
  if (classification === 'repeat_request') {
    return {
      action: 'acknowledge_repeat_request',
      tone: 'neutral',
      reason: 'Candidate asked to repeat or rephrase the question',
      repeatOriginalQuestion: currentQuestion?.text,
    };
  }

  // 2. Candidate Uncertainty / "I don't know"
  if (classification === 'uncertain') {
    return {
      action: 'acknowledge_uncertainty',
      tone: 'empathetic',
      reason: 'Candidate acknowledged lack of direct experience in this specific area',
    };
  }

  // 3. Irrelevant Answer
  if (classification === 'irrelevant') {
    return {
      action: 'reask',
      tone: 'firm',
      reason: 'irrelevant_answer',
      repeatOriginalQuestion: currentQuestion?.text,
    };
  }

  // 4. Candidate Refusal
  if (classification === 'refusal') {
    return {
      action: 'transition',
      tone: 'neutral',
      reason: 'Candidate declined to answer previous prompt; advancing to next assessment topic',
    };
  }

  // 5. Time Closing or Complete Evidence
  if (isTimeClosing || nextObjective.questionType === 'closing') {
    return {
      action: 'close',
      tone: 'encouraging',
      reason: 'Interview session concluding based on time budget or complete evidence collection',
    };
  }

  // 6. Targeted Follow-Up Probe
  if (nextObjective.isFollowUp) {
    return {
      action: 'probe',
      tone: 'neutral',
      reason: nextObjective.followUpReason || 'Probing specific missing evidence signal',
    };
  }

  // 7. Strong Answer Transition
  if (classification === 'strong' || classification === 'answered') {
    return {
      action: 'transition',
      tone: 'encouraging',
      reason: 'Sufficient evidence collected; transitioning to next competency objective',
    };
  }

  // 8. General Question Progression
  return {
    action: 'ask_question',
    tone: 'neutral',
    reason: 'Advancing to next scheduled assessment objective',
  };
}

import { InterviewObjective, InterviewContract, CompetencyMap, InterviewSessionStatus } from '../../types/interview';

export interface ShouldCompleteParams {
  remainingSeconds: number;
  currentObjective?: InterviewObjective;
  contract?: InterviewContract;
  competencyMap?: CompetencyMap;
  questionsAskedCount: number;
  isExplicitExit?: boolean;
  closingTurnCompleted?: boolean;
}

/**
 * Single authoritative completion gate for adaptive interview sessions.
 */
export function shouldCompleteInterview(params: ShouldCompleteParams): {
  shouldComplete: boolean;
  reason?: 'TIME_EXPIRED' | 'BRAIN_CLOSING' | 'CONTRACT_COMPLETED' | 'EXPLICIT_EXIT' | null;
} {
  // A. Explicit exit
  if (params.isExplicitExit) {
    return { shouldComplete: true, reason: 'EXPLICIT_EXIT' };
  }

  // B. Time expiry
  if (params.remainingSeconds <= 0) {
    return { shouldComplete: true, reason: 'TIME_EXPIRED' };
  }

  // C. Brain closing decision & closing interaction complete
  if (params.currentObjective?.questionType === 'closing') {
    if (params.closingTurnCompleted) {
      return { shouldComplete: true, reason: 'BRAIN_CLOSING' };
    }
  }

  // D. Contract completion
  if (params.contract && params.competencyMap) {
    const minQ = params.contract.minQuestions || 4;
    const maxQ = params.contract.maxQuestions || 15;

    // Hard ceiling
    if (params.questionsAskedCount >= maxQ) {
      return { shouldComplete: true, reason: 'CONTRACT_COMPLETED' };
    }

    // Minimum met + critical competencies reliable
    if (params.questionsAskedCount >= minQ) {
      const criticalComps = params.contract.criticalCompetencies || [];
      const allCriticalReliable = criticalComps.every((compName) => {
        const compState = params.competencyMap?.[compName];
        return compState && (compState.assessmentReliability === 'reliable' || compState.assessmentReliability === 'provisional');
      });

      if (allCriticalReliable) {
        return { shouldComplete: true, reason: 'CONTRACT_COMPLETED' };
      }
    }
  }

  return { shouldComplete: false, reason: null };
}

/**
 * Validates session status transitions.
 */
export function validateSessionTransition(
  from: InterviewSessionStatus,
  to: InterviewSessionStatus
): boolean {
  const transitions: Record<InterviewSessionStatus, InterviewSessionStatus[]> = {
    not_started: ['starting', 'failed'],
    starting: ['active', 'failed'],
    active: ['evaluating', 'closing', 'completed', 'paused', 'failed'],
    evaluating: ['generating_next', 'closing', 'completed', 'failed'],
    generating_next: ['active', 'closing', 'completed', 'failed'],
    closing: ['completed', 'failed'],
    completed: [],
    failed: [],
    paused: ['active', 'failed']
  };

  return (transitions[from] || []).includes(to);
}

export interface SpeechState {
  finalTranscript: string;
  interimTranscript: string;
  displayTranscript: string;
}

/**
 * Deterministic speech recognition result reducer.
 * isFinal === true  -> append to finalTranscript, clear interimTranscript.
 * isFinal === false -> replace interimTranscript.
 */
export function reduceSpeechRecognitionResult(
  previousState: SpeechState,
  event: { isFinal: boolean; transcript: string }
): SpeechState {
  const cleanTranscript = (event.transcript || '').trim();
  let finalTranscript = previousState.finalTranscript || '';
  let interimTranscript = '';

  if (event.isFinal) {
    if (cleanTranscript) {
      if (finalTranscript && !finalTranscript.endsWith(' ')) {
        finalTranscript += ' ';
      }
      finalTranscript += cleanTranscript;
    }
  } else {
    interimTranscript = cleanTranscript;
  }

  let display = finalTranscript;
  if (interimTranscript) {
    if (display && !display.endsWith(' ')) {
      display += ' ';
    }
    display += interimTranscript;
  }

  return {
    finalTranscript: finalTranscript.trim(),
    interimTranscript: interimTranscript.trim(),
    displayTranscript: display.trim(),
  };
}

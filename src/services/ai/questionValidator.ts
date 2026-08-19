import { Question, AnswerabilityStatus } from '../../types/interview';

export interface QuestionValidationResult {
  isValid: boolean;
  validatedQuestions: Question[];
  rejectedQuestions: { questionText: string; reason: string }[];
  errors: string[];
}

export function validateSingleQuestion(
  question: Partial<Question>,
  idx: number,
  existingTexts: Set<string>,
  candidateFullText?: string,
  _jdFullText?: string
): { isValid: boolean; reason?: string; validated?: Question } {
  const text = (question.text || '').trim();
  if (!text || text.length < 15) {
    return { isValid: false, reason: `Question ${idx + 1} text is empty or too short.` };
  }

  // Check for duplicates
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (existingTexts.has(normalizedText)) {
    return { isValid: false, reason: `Question ${idx + 1} is a duplicate of a previous question.` };
  }

  // Determine Answerability
  let answerabilityStatus: AnswerabilityStatus = 'general_competency';
  const candTextLower = (candidateFullText || '').toLowerCase();

  // If question references a specific resume deliverable/project
  if (question.source === 'resume' && question.sourceReference) {
    const refWord = question.sourceReference.toLowerCase();
    if (candTextLower.includes(refWord) || candTextLower.length < 20) {
      answerabilityStatus = 'grounded_answerable';
    } else {
      answerabilityStatus = 'grounded_gap_probe';
    }
  } else if (question.source === 'gap_analysis') {
    answerabilityStatus = 'grounded_gap_probe';
  } else if (question.source === 'job_description') {
    answerabilityStatus = 'grounded_answerable';
  }

  const expectedCharacteristics = question.expectedAnswerCharacteristics && question.expectedAnswerCharacteristics.length >= 3
    ? question.expectedAnswerCharacteristics
    : [
        'States clear problem context and initial assumptions',
        'Explains decision-making criteria and alternatives considered',
        'Identifies trade-offs and mitigation strategies',
        'Provides measurable outcome or concrete recommendation',
      ];

  const validated: Question = {
    id: question.id || `q_${idx + 1}`,
    order: idx + 1,
    type: question.type || 'initial',
    questionType: question.questionType || 'product_sense',
    source: question.source || 'competency',
    sourceReference: question.sourceReference || 'Job Description Requirements',
    targetCompetency: question.targetCompetency || 'Problem Solving',
    jdRequirement: question.jdRequirement || undefined,
    intent: question.intent || `Assess candidate's ability in ${question.targetCompetency || 'problem solving'}.`,
    expectedAnswerCharacteristics: expectedCharacteristics,
    category: question.category || question.targetCompetency || 'Core Competency',
    text,
    contextExplanation: question.contextExplanation || undefined,
    recommendedDurationSeconds: question.recommendedDurationSeconds || 180,
    expectedSignals: question.expectedSignals || expectedCharacteristics,
    redFlags: question.redFlags || ['Vague buzzwords without substance', 'Avoiding trade-offs', 'Unsubstantiated claims'],
    answerabilityStatus,
  };

  existingTexts.add(normalizedText);
  return { isValid: true, validated };
}

export function validateQuestionSet(
  questions: Partial<Question>[],
  candidateFullText?: string,
  jdFullText?: string
): QuestionValidationResult {
  const existingTexts = new Set<string>();
  const validatedQuestions: Question[] = [];
  const rejectedQuestions: { questionText: string; reason: string }[] = [];
  const errors: string[] = [];

  if (!questions || questions.length === 0) {
    return {
      isValid: false,
      validatedQuestions: [],
      rejectedQuestions: [],
      errors: ['No questions provided for validation.'],
    };
  }

  questions.forEach((q, idx) => {
    const res = validateSingleQuestion(q, idx, existingTexts, candidateFullText, jdFullText);
    if (res.isValid && res.validated) {
      validatedQuestions.push(res.validated);
    } else {
      rejectedQuestions.push({
        questionText: q.text || `Question ${idx + 1}`,
        reason: res.reason || 'Failed pre-flight quality checks.',
      });
      errors.push(res.reason || `Question ${idx + 1} validation failed.`);
    }
  });

  return {
    isValid: validatedQuestions.length >= 2,
    validatedQuestions,
    rejectedQuestions,
    errors,
  };
}

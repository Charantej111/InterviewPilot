export interface QuestionValidationResult {
  isValid: boolean;
  validatedQuestions: any[];
  rejectedQuestions: { questionText: string; reason: string }[];
  errors: string[];
}

export function validateQuestionSet(
  questions: any[],
  candidateFullText?: string,
  _jdFullText?: string
): QuestionValidationResult {
  const existingTexts = new Set<string>();
  const validatedQuestions: any[] = [];
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

  const candTextLower = (candidateFullText || '').toLowerCase();

  questions.forEach((q: any, idx: number) => {
    const text = (q.text || '').trim();
    if (!text || text.length < 15) {
      rejectedQuestions.push({ questionText: text || `Q${idx + 1}`, reason: 'Question text is empty or too short.' });
      return;
    }

    const normalizedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (existingTexts.has(normalizedText)) {
      rejectedQuestions.push({ questionText: text, reason: 'Duplicate question detected.' });
      return;
    }

    let answerabilityStatus = 'general_competency';
    if (q.source === 'resume' && q.sourceReference) {
      const refWord = q.sourceReference.toLowerCase();
      if (candTextLower.includes(refWord) || candTextLower.length < 20) {
        answerabilityStatus = 'grounded_answerable';
      } else {
        answerabilityStatus = 'grounded_gap_probe';
      }
    } else if (q.source === 'gap_analysis') {
      answerabilityStatus = 'grounded_gap_probe';
    } else if (q.source === 'job_description') {
      answerabilityStatus = 'grounded_answerable';
    }

    const expectedCharacteristics = q.expectedAnswerCharacteristics && q.expectedAnswerCharacteristics.length >= 3
      ? q.expectedAnswerCharacteristics
      : [
          'States clear problem context and initial assumptions',
          'Explains decision-making criteria and alternatives considered',
          'Identifies trade-offs and mitigation strategies',
          'Provides measurable outcome or concrete recommendation',
        ];

    const validated = {
      id: q.id || `q_${idx + 1}`,
      order: idx + 1,
      type: q.type || 'initial',
      questionType: q.questionType || 'product_sense',
      source: q.source || 'competency',
      sourceReference: q.sourceReference || 'Job Description Requirements',
      targetCompetency: q.targetCompetency || 'Problem Solving',
      jdRequirement: q.jdRequirement || undefined,
      intent: q.intent || `Assess candidate's ability in ${q.targetCompetency || 'problem solving'}.`,
      expectedAnswerCharacteristics: expectedCharacteristics,
      category: q.category || q.targetCompetency || 'Core Competency',
      text,
      contextExplanation: q.contextExplanation || undefined,
      recommendedDurationSeconds: q.recommendedDurationSeconds || 180,
      expectedSignals: q.expectedSignals || expectedCharacteristics,
      redFlags: q.redFlags || ['Vague buzzwords without substance', 'Avoiding trade-offs', 'Unsubstantiated claims'],
      answerabilityStatus,
    };

    existingTexts.add(normalizedText);
    validatedQuestions.push(validated);
  });

  return {
    isValid: validatedQuestions.length >= 2,
    validatedQuestions,
    rejectedQuestions,
    errors,
  };
}

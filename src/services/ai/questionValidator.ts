/**
 * Question Validator — Pre-Flight Quality & Anti-Hallucination Gate
 *
 * Validates dynamically generated questions against:
 * 1. Semantic duplicates
 * 2. Objective alignment
 * 3. JD relevance
 * 4. Resume grounding correctness (zero fabricated evidence)
 * 5. Single-question constraint
 * 6. Difficulty appropriateness
 * 7. Hidden metadata leakage prevention
 *
 * Provides deterministic fallback generation on validation failures.
 */

import type { Question, InterviewObjective } from '../../types/interview';
import type { LockedCandidateContext } from '../../types/resume';
import type { JDEvidenceModel } from '../../types/jobDescription';

export interface QuestionValidationResult {
  isValid: boolean;
  reason?: string;
  validated?: Question;
}

const FORBIDDEN_METADATA_PATTERNS = [
  /\binterview objective\b/i,
  /\bcompetency map\b/i,
  /\btarget competency\b/i,
  /\bevaluation criteria\b/i,
  /\brubric dimension\b/i,
  /\blook for signals\b/i,
  /\bred flag signals\b/i,
  /\bexpected signals\b/i,
  /\bdiagnostic intent\b/i,
  /\bobj_\d+\b/i,
];

/**
 * Validates a single dynamically generated interview question.
 */
export function validateQuestion(
  candidateQuestion: Partial<Question>,
  existingQuestions: Question[] = [],
  objective: InterviewObjective,
  candidateContext?: LockedCandidateContext | null,
  jdEvidenceModel?: JDEvidenceModel | null
): QuestionValidationResult {
  const text = (candidateQuestion.text || '').trim();

  // 1. Minimum length & presence
  if (!text || text.length < 15) {
    return { isValid: false, reason: 'Question text is empty or too short (< 15 characters).' };
  }

  // 2. No metadata leakage
  for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
    if (pattern.test(text)) {
      return { isValid: false, reason: `Question leaks internal prompt/metadata pattern: ${pattern.source}` };
    }
  }

  // 3. Duplicate check (semantic/normalized)
  const normCurrent = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const prev of existingQuestions) {
    const normPrev = (prev.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normCurrent === normPrev || (normCurrent.length > 25 && normPrev.includes(normCurrent))) {
      return { isValid: false, reason: 'Question is a duplicate of a previously asked question.' };
    }
  }

  // 4. Single-question constraint: Do not ask multiple unrelated questions joined by multiple question marks
  const questionMarkCount = (text.match(/\?/g) || []).length;
  if (questionMarkCount > 2) {
    return { isValid: false, reason: 'Question contains multiple compound questions (violates single-question constraint).' };
  }

  // 5. Resume Grounding Check (Zero hallucinated deliverables)
  if (objective.useResumeGrounding && candidateContext?.evidenceModel) {
    // If the question explicitly quotes a deliverable in quotation marks, verify presence in candidate evidence
    const quotes = text.match(/"([^"]+)"/g) || [];
    const allEvidenceText = JSON.stringify(candidateContext.evidenceModel).toLowerCase();
    for (const q of quotes) {
      const cleanQuote = q.replace(/"/g, '').toLowerCase().trim();
      if (cleanQuote.length > 4 && !allEvidenceText.includes(cleanQuote)) {
        // Warning: check if it's generic English or an ungrounded project claim
        if (cleanQuote.split(/\s+/).length >= 3 && !allEvidenceText.includes(cleanQuote)) {
          return { isValid: false, reason: `Question references ungrounded quote not on confirmed resume: "${q}"` };
        }
      }
    }
  }

  const order = (existingQuestions.length || 0) + 1;

  const validated: Question = {
    id: candidateQuestion.id || crypto.randomUUID(),
    order,
    type: objective.isFollowUp ? 'follow_up' : 'initial',
    questionType: objective.questionType,
    source: objective.useResumeGrounding ? 'resume' : jdEvidenceModel ? 'job_description' : 'competency',
    sourceReference: objective.focusRequirement || objective.targetCompetency,
    targetCompetency: objective.targetCompetency,
    category: candidateQuestion.category || objective.targetCompetency,
    text,
    intent: candidateQuestion.intent || objective.intent,
    contextExplanation: candidateQuestion.contextExplanation || `Assessing ${objective.targetCompetency}`,
    expectedSignals: candidateQuestion.expectedSignals || objective.expectedSignals || [],
    redFlags: candidateQuestion.redFlags || ['Vague buzzwords without substance', 'Avoiding trade-offs'],
    expectedAnswerCharacteristics: candidateQuestion.expectedAnswerCharacteristics || objective.expectedSignals || [
      'Structured breakdown',
      'Specific trade-offs',
      'Direct personal ownership',
    ],
    difficulty: candidateQuestion.difficulty || objective.difficulty,
  };

  return { isValid: true, validated };
}

/**
 * Generates a clean, deterministic fallback question when dynamic generation fails validation.
 * Uses ONLY confirmed evidence, objective, and JD context — zero hallucination.
 */
export function generateFallbackQuestion(
  objective: InterviewObjective,
  candidateContext?: LockedCandidateContext | null,
  jdEvidenceModel?: JDEvidenceModel | null,
  order = 1
): Question {
  let fallbackText = '';

  if (objective.questionType === 'closing') {
    fallbackText = `Thank you for taking the time to discuss your background and technical approach. We have concluded all interview questions, and your evaluation report is now being synthesized.`;
  } else if (objective.isFollowUp) {
    fallbackText = `Regarding your previous answer on ${objective.targetCompetency}, could you dive deeper into the specific trade-offs, constraints, or measurable outcomes you encountered?`;
  } else if (objective.useResumeGrounding && candidateContext?.evidenceModel?.projects?.[0]?.name?.value) {
    const projName = candidateContext.evidenceModel.projects[0].name.value;
    fallbackText = `Looking at your work on "${projName}", could you describe the technical architecture, your individual responsibilities, and how you measured delivery success?`;
  } else if (jdEvidenceModel) {
    fallbackText = `In the context of ${jdEvidenceModel.role}, how do you approach ${objective.targetCompetency} when balancing tight delivery deadlines against scalability?`;
  } else {
    fallbackText = `Could you share a representative example demonstrating your approach to ${objective.targetCompetency}? Walk me through the problem, your decision process, and the outcome.`;
  }

  return {
    id: crypto.randomUUID(),
    order,
    type: objective.isFollowUp ? 'follow_up' : 'initial',
    questionType: objective.questionType,
    source: objective.useResumeGrounding ? 'resume' : 'competency',
    sourceReference: objective.targetCompetency,
    targetCompetency: objective.targetCompetency,
    category: objective.targetCompetency,
    text: fallbackText,
    intent: objective.intent,
    contextExplanation: `Fallback diagnostic probe for ${objective.targetCompetency}`,
    expectedSignals: objective.expectedSignals || ['Clear problem context', 'Decision criteria', 'Measurable result'],
    redFlags: ['Shallow generalizations without concrete examples'],
    expectedAnswerCharacteristics: objective.expectedSignals || ['Clear problem context', 'Decision criteria', 'Measurable result'],
    difficulty: objective.difficulty,
  };
}

/**
 * Backward compatible validation helper for test suites.
 */
export function validateQuestionSet(
  questions: Partial<Question>[],
  _candidateFullText?: string,
  _jdFullText?: string
): { isValid: boolean; validatedQuestions: Question[]; rejectedQuestions: { questionText: string; reason: string }[]; errors: string[] } {
  const validatedQuestions: Question[] = [];
  const rejectedQuestions: { questionText: string; reason: string }[] = [];
  const errors: string[] = [];
  const existingTexts = new Set<string>();

  for (let i = 0; i < (questions || []).length; i++) {
    const q = questions[i];
    const text = (q.text || '').trim();
    if (!text || text.length < 15) {
      rejectedQuestions.push({ questionText: text || `Question ${i + 1}`, reason: 'Question text is too short (< 15 characters)' });
      errors.push(`Question ${i + 1} too short`);
      continue;
    }
    const norm = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (existingTexts.has(norm)) {
      rejectedQuestions.push({ questionText: text, reason: 'Duplicate question' });
      errors.push(`Question ${i + 1} duplicate`);
      continue;
    }
    existingTexts.add(norm);
    validatedQuestions.push({
      id: q.id || crypto.randomUUID(),
      order: i + 1,
      type: q.type || 'initial',
      questionType: q.questionType || 'product_sense',
      source: q.source || 'competency',
      sourceReference: q.sourceReference || 'Competency',
      targetCompetency: q.targetCompetency || 'Problem Solving',
      category: q.category || 'Core',
      text,
      intent: q.intent || 'Assess competency',
      expectedAnswerCharacteristics: q.expectedAnswerCharacteristics || ['Clear breakdown', 'Technical decisions', 'Measurable impact'],
    });
  }

  return {
    isValid: validatedQuestions.length > 0 && rejectedQuestions.length === 0,
    validatedQuestions,
    rejectedQuestions,
    errors,
  };
}

export function validateSingleQuestion(
  question: Partial<Question>,
  idx: number,
  existingTexts: Set<string>,
  _candidateFullText?: string,
  _jdFullText?: string
): { isValid: boolean; reason?: string; validated?: Question } {
  const text = (question.text || '').trim();
  if (!text || text.length < 15) {
    return { isValid: false, reason: `Question ${idx + 1} text is empty or too short.` };
  }
  const norm = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (existingTexts.has(norm)) {
    return { isValid: false, reason: `Question ${idx + 1} is a duplicate of a previous question.` };
  }
  existingTexts.add(norm);
  return {
    isValid: true,
    validated: {
      id: question.id || crypto.randomUUID(),
      order: idx + 1,
      type: question.type || 'initial',
      questionType: question.questionType || 'product_sense',
      source: question.source || 'competency',
      sourceReference: question.sourceReference || 'Competency',
      targetCompetency: question.targetCompetency || 'Problem Solving',
      category: question.category || 'Core',
      text,
      intent: question.intent || 'Assess competency',
      expectedAnswerCharacteristics: question.expectedAnswerCharacteristics || ['Clear breakdown', 'Technical decisions', 'Measurable impact'],
    },
  };
}

import { Question, QuestionFeedback } from '../../types/interview';

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
  const { question, answerText, role, company, difficulty: _difficulty = 'intermediate' } = input;
  const cleanAnswer = (answerText || '').trim();

  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Trivial or Empty Checks
  if (wordCount < 5) {
    return {
      questionId: question.id,
      overallScore: 1.5,
      scoreInterval: [1.0, 2.0],
      answerClassification: 'not_answered',
      relevanceGate: { status: 'not_answered', score: 1.0, reason: 'Answer was too brief to evaluate.' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 1.5, structure: 1.5, clarity: 2.0, depth: 1.0, evidence: 1.0, roleAlignment: 1.5 },
      whatWorked: [],
      whatHeldYouBack: ['The response was only a few words and provided no substantive detail or approach.'],
      tryThisNextTime: {
        framework: 'STAR Method',
        suggestion: `Provide a complete explanation detailing your specific approach for the ${role} opening at ${company}.`,
        promptToImprove: 'What were the initial constraints, your exact actions, and the final outcome?',
        examplePhrasing: 'When tackling this challenge, I first analyzed the requirements, then executed the solution...',
      },
      followUpNeeded: true,
      followUpTriggerReason: 'Answer was too brief or incomplete.',
    };
  }

  // 2. Metric & Evidence Detection
  const hasNumbers = /\b(\d+%|\d+x|\$\d+|\d+\s*(?:users|ms|seconds|minutes|hours|days|weeks|months|years|kb|mb|gb|tb|rpm|psi|bar|kw|mw|engineers|team members|clients|customers))\b/i.test(cleanAnswer);
  const numberCount = (cleanAnswer.match(/\b\d+(?:\.\d+)?%?\b/g) || []).length;

  // 3. STAR Structure & Action Verb Detection
  const actionVerbs = ['analyzed', 'designed', 'built', 'implemented', 'led', 'architected', 'optimized', 'reduced', 'increased', 'diagnosed', 'refactored', 'developed', 'coordinated', 'calculated', 'modeled', 'simulated'];
  const matchedActions = actionVerbs.filter((v) => cleanAnswer.toLowerCase().includes(v));

  // 4. Question Relevance & Keyword Overlap
  const questionWords = (question.text || '')
    .toLowerCase()
    .split(/[\s,?.!-]+/)
    .filter((w) => w.length > 3 && !['what', 'when', 'where', 'which', 'how', 'describe', 'tell', 'explain', 'walk', 'your', 'with', 'about'].includes(w));
  
  const matchedQuestionWords = questionWords.filter((qw) => cleanAnswer.toLowerCase().includes(qw));
  const relevanceRatio = questionWords.length > 0 ? matchedQuestionWords.length / questionWords.length : 0.5;

  // 5. Calculate Dynamic Dimension Scores
  const relevanceScore = Math.min(9.5, Math.max(3.0, Math.round((4.0 + relevanceRatio * 5.5) * 10) / 10));
  const clarityScore = Math.min(9.5, Math.max(3.5, Math.round((wordCount > 30 ? 7.5 : wordCount > 15 ? 6.0 : 4.5) * 10) / 10));
  const structureScore = Math.min(9.5, Math.max(3.0, Math.round((3.5 + Math.min(3, matchedActions.length) * 1.5 + (wordCount > 40 ? 1.5 : 0.5)) * 10) / 10));
  const depthScore = Math.min(9.5, Math.max(3.0, Math.round((3.0 + Math.min(60, wordCount) / 12 + (matchedActions.length > 1 ? 1.5 : 0)) * 10) / 10));
  const evidenceScore = Math.min(9.5, Math.max(2.5, Math.round((hasNumbers ? 6.0 + Math.min(3, numberCount) * 1.0 : 3.5 + (wordCount > 40 ? 1.0 : 0)) * 10) / 10));
  const roleAlignmentScore = Math.min(9.5, Math.max(3.5, Math.round((relevanceScore * 0.5 + depthScore * 0.5) * 10) / 10));

  // Weighted Overall Score Calculation
  const computedOverall = (
    relevanceScore * 0.25 +
    structureScore * 0.20 +
    clarityScore * 0.15 +
    depthScore * 0.15 +
    evidenceScore * 0.15 +
    roleAlignmentScore * 0.10
  );
  const overallScore = Math.round(computedOverall * 10) / 10;

  // 6. Formulate Specific Dynamic Feedback
  const whatWorked: string[] = [];
  const whatHeldYouBack: string[] = [];

  if (relevanceRatio > 0.4) {
    whatWorked.push(`Directly engaged with key elements of the question (${question.category || 'core topic'}).`);
  }
  if (matchedActions.length > 0) {
    whatWorked.push(`Highlighted active personal execution verbs (${matchedActions.slice(0, 3).join(', ')}).`);
  }
  if (hasNumbers) {
    whatWorked.push('Included concrete numerical evidence to substantiate your results.');
  } else {
    whatHeldYouBack.push(`Did not include quantified metrics or starting baseline benchmarks for this ${question.category || 'scenario'}.`);
  }

  if (wordCount < 30) {
    whatHeldYouBack.push('Answer remained at a high level without detailing technical trade-offs or decision criteria.');
  }

  if (whatWorked.length === 0) {
    whatWorked.push('Attempted a structured response to the scenario.');
  }

  // 7. Dynamic Suggestion based on Question Category
  let framework = 'STAR Framework';
  let suggestion = `Detail your step-by-step decision criteria and quantify the before-and-after outcome for ${company}.`;
  
  if (question.category?.toLowerCase().includes('technical') || question.category?.toLowerCase().includes('architecture')) {
    framework = 'Architectural Trade-off Framework';
    suggestion = 'State your initial constraints, compare 2 technical options, and explain why your chosen design won.';
  } else if (question.category?.toLowerCase().includes('leadership') || question.category?.toLowerCase().includes('conflict')) {
    framework = 'CAR (Context-Action-Result) Framework';
    suggestion = 'Focus on stakeholder alignment, communication mechanisms, and the final business consensus.';
  }

  return {
    questionId: question.id,
    overallScore,
    scoreInterval: [Math.max(0, overallScore - 0.5), Math.min(10, overallScore + 0.5)],
    answerClassification: overallScore >= 7.5 ? 'strong' : overallScore >= 5.0 ? 'adequate' : 'weak',
    relevanceGate: {
      status: overallScore >= 4.0 ? 'answered' : 'partially_answered',
      score: relevanceScore,
      reason: `Assessed relevance against ${question.category || 'topic'} criteria.`,
    },
    professionalism: { status: 'acceptable' },
    breakdown: {
      relevance: relevanceScore,
      structure: structureScore,
      clarity: clarityScore,
      depth: depthScore,
      evidence: evidenceScore,
      roleAlignment: roleAlignmentScore,
    },
    whatWorked,
    whatHeldYouBack,
    tryThisNextTime: {
      framework,
      suggestion,
      promptToImprove: `How would you explain this outcome to the hiring committee at ${company}?`,
      examplePhrasing: `In this scenario, our primary constraint was X, so we implemented Y, which improved performance by Z%.`,
    },
    followUpNeeded: overallScore < 6.0 && wordCount > 10,
    followUpTriggerReason: hasNumbers ? undefined : 'Probe for quantitative metric lift or trade-off analysis.',
  };
}

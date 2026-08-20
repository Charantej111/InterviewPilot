import { Question, QuestionFeedback } from '../../types/interview';

export interface DeterministicEvaluationInput {
  question: Question;
  answerText: string;
  role: string;
  company: string;
  difficulty?: string;
}

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
  const { question, answerText, role, company, difficulty = 'intermediate' } = input;
  const cleanAnswer = (answerText || '').trim();

  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Check for Empty or Extremely Short Input
  if (wordCount < 8) {
    const isVirtuallyEmpty = wordCount < 3;
    const score = isVirtuallyEmpty ? 0.5 : 1.5;
    return {
      questionId: question.id,
      overallScore: score,
      scoreInterval: [0.5, 2.0],
      answerClassification: 'not_answered',
      relevanceGate: { status: 'not_answered', score: 1.0, reason: 'Answer is too brief to demonstrate competency.' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 1.0, structure: 1.0, clarity: 1.5, depth: 0.5, evidence: 0.5, roleAlignment: 1.0 },
      whatWorked: [],
      whatHeldYouBack: ['The answer contained fewer than 8 words and provided no actionable context, strategy, or outcome.'],
      tryThisNextTime: {
        framework: 'STAR Method',
        suggestion: `Provide a substantive explanation detailing your specific approach for the ${role} opening at ${company}.`,
        promptToImprove: 'What were the initial constraints, your exact actions, and the final outcome?',
        examplePhrasing: 'When tackling this challenge, I first identified the root constraint, engineered the solution, and validated results.',
      },
      followUpNeeded: true,
      followUpTriggerReason: 'Answer was too brief to evaluate.',
    };
  }

  // 2. Check for Gibberish, Keyboard Mash, or Non-word Patterns
  const vowelsRegex = /[aeiouy]/i;
  const hasRepeatingChars = /(.)\1{4,}/i.test(cleanAnswer);
  const wordsWithoutVowels = words.filter((w) => w.length > 3 && !vowelsRegex.test(w));
  const isGibberish = hasRepeatingChars || (wordsWithoutVowels.length / words.length > 0.4);

  if (isGibberish) {
    return {
      questionId: question.id,
      overallScore: 0.5,
      scoreInterval: [0.0, 1.0],
      answerClassification: 'irrelevant',
      relevanceGate: { status: 'not_answered', score: 0.5, reason: 'Response contained incoherent or invalid text.' },
      professionalism: { status: 'poor' },
      breakdown: { relevance: 0.5, structure: 0.5, clarity: 0.5, depth: 0.5, evidence: 0.5, roleAlignment: 0.5 },
      whatWorked: [],
      whatHeldYouBack: ['The submitted response was incoherent or contained keyboard smash patterns.'],
      tryThisNextTime: {
        framework: 'Professional Articulation',
        suggestion: 'Please provide genuine technical reasoning and domain-specific context for this interview.',
        promptToImprove: 'What is your actual hands-on experience solving this scenario?',
        examplePhrasing: 'I approach this problem by first decomposing the architecture into core components.',
      },
      followUpNeeded: true,
      followUpTriggerReason: 'Incoherent or invalid response provided.',
    };
  }

  // 3. Question Relevance & Domain Keyword Overlap
  const questionWords = (question.text || '')
    .toLowerCase()
    .split(/[\s,?.!-]+/)
    .filter((w) => w.length > 3 && !['what', 'when', 'where', 'which', 'how', 'describe', 'tell', 'explain', 'walk', 'your', 'with', 'about', 'this', 'that', 'have', 'from', 'into', 'would', 'could', 'should'].includes(w));
  
  const categoryWords = (question.category || '')
    .toLowerCase()
    .split(/[\s,?.!-]+/)
    .filter((w) => w.length > 3);

  const targetKeywords = Array.from(new Set([...questionWords, ...categoryWords]));
  const matchedKeywords = targetKeywords.filter((kw) => cleanAnswer.toLowerCase().includes(kw));
  const relevanceRatio = targetKeywords.length > 0 ? matchedKeywords.length / targetKeywords.length : 0.3;

  // 4. Action Verbs & STAR Structural Signatures
  const actionVerbs = [
    'analyzed', 'designed', 'built', 'implemented', 'led', 'architected', 'optimized',
    'reduced', 'increased', 'diagnosed', 'refactored', 'developed', 'coordinated',
    'calculated', 'modeled', 'simulated', 'spearheaded', 'automated', 'deployed',
    'migrated', 'scaled', 'benchmarked', 'identified', 'resolved', 'negotiated',
  ];
  const matchedActions = actionVerbs.filter((v) => cleanAnswer.toLowerCase().includes(v));

  // 5. Numerical Metrics & Quantified Evidence
  const hasNumbers = /\b(\d+%|\d+x|\$\d+|\d+\s*(?:users|ms|seconds|minutes|hours|days|weeks|months|years|kb|mb|gb|tb|rpm|psi|bar|kw|mw|engineers|team members|clients|customers|rps|qps))\b/i.test(cleanAnswer);
  const numberCount = (cleanAnswer.match(/\b\d+(?:\.\d+)?%?\b/g) || []).length;

  // 6. Strict Off-Topic / Irrelevant Detection
  if (relevanceRatio < 0.12 && matchedActions.length === 0 && !hasNumbers) {
    return {
      questionId: question.id,
      overallScore: 1.5,
      scoreInterval: [1.0, 2.0],
      answerClassification: 'irrelevant',
      relevanceGate: {
        status: 'partially_answered',
        score: 1.5,
        reason: 'Response did not directly address the prompt or technical question requirements.',
      },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 1.5, structure: 2.0, clarity: 3.0, depth: 1.0, evidence: 0.5, roleAlignment: 1.0 },
      whatWorked: wordCount > 20 ? ['Spoke in complete sentences with standard vocabulary.'] : [],
      whatHeldYouBack: [
        `The response did not engage with the primary subject (${question.category || 'target competency'}) or core question requirements.`,
        'No technical trade-offs, architecture, or actionable steps were provided.',
      ],
      tryThisNextTime: {
        framework: 'Direct Answering Framework',
        suggestion: `Directly address the question prompt before sharing adjacent background context.`,
        promptToImprove: `How does your answer resolve the core problem: "${question.text.slice(0, 80)}..."?`,
        examplePhrasing: `To address ${question.category || 'this challenge'}, the primary objective is to...`,
      },
      followUpNeeded: true,
      followUpTriggerReason: 'Candidate response was off-topic or lacked relevance.',
    };
  }

  // 7. Dynamic Dimension Scoring for Relevant Answers
  // Relevance (1.5 - 9.5)
  const relevanceScore = Math.min(9.5, Math.max(2.0, Math.round((2.0 + relevanceRatio * 6.5 + (matchedActions.length > 0 ? 1.0 : 0)) * 10) / 10));

  // Clarity & Articulation (2.0 - 9.5)
  const clarityScore = Math.min(9.5, Math.max(2.5, Math.round((
    (wordCount >= 60 ? 8.5 : wordCount >= 35 ? 7.0 : wordCount >= 18 ? 5.5 : 3.5)
  ) * 10) / 10));

  // Structure & STAR (1.5 - 9.5)
  const structureScore = Math.min(9.5, Math.max(2.0, Math.round((
    2.0 + Math.min(4, matchedActions.length) * 1.5 + (wordCount > 40 ? 1.5 : 0.5)
  ) * 10) / 10));

  // Technical Depth & First Principles (1.5 - 9.5)
  const depthScore = Math.min(9.5, Math.max(1.5, Math.round((
    1.5 + Math.min(80, wordCount) / 16 + (matchedActions.length > 1 ? 1.5 : 0) + (relevanceRatio > 0.3 ? 1.5 : 0)
  ) * 10) / 10));

  // Evidence & Quantitative Metrics (1.0 - 9.5)
  const evidenceScore = Math.min(9.5, Math.max(1.0, Math.round((
    hasNumbers ? 5.5 + Math.min(3, numberCount) * 1.2 : 2.0 + (wordCount > 50 ? 1.0 : 0)
  ) * 10) / 10));

  // Role & Level Alignment (2.0 - 9.5)
  const roleAlignmentScore = Math.min(9.5, Math.max(2.0, Math.round((
    relevanceScore * 0.4 + depthScore * 0.3 + structureScore * 0.3
  ) * 10) / 10));

  // Weighted Overall Score
  const rawWeighted = (
    relevanceScore * 0.30 +
    structureScore * 0.20 +
    depthScore * 0.20 +
    clarityScore * 0.15 +
    evidenceScore * 0.10 +
    roleAlignmentScore * 0.05
  );

  // Apply difficulty calibration penalty
  const difficultyModifier = difficulty === 'advanced' ? 0.9 : difficulty === 'beginner' ? 1.05 : 1.0;
  const overallScore = Math.min(9.8, Math.max(1.5, Math.round(rawWeighted * difficultyModifier * 10) / 10));

  // 8. Specific Feedback Generation
  const whatWorked: string[] = [];
  const whatHeldYouBack: string[] = [];

  if (relevanceRatio > 0.3) {
    whatWorked.push(`Directly addressed core competencies in ${question.category || 'the scenario'}.`);
  }
  if (matchedActions.length >= 2) {
    whatWorked.push(`Used strong proactive action verbs (${matchedActions.slice(0, 3).join(', ')}).`);
  }
  if (hasNumbers) {
    whatWorked.push('Included concrete numerical evidence to quantify business or technical results.');
  } else {
    whatHeldYouBack.push(`Did not include quantified metrics or baseline-to-outcome deltas for this ${question.category || 'scenario'}.`);
  }

  if (wordCount < 40) {
    whatHeldYouBack.push('Answer lacked technical depth and did not compare alternative trade-offs.');
  }

  if (whatWorked.length === 0) {
    whatWorked.push('Provided a structured initial attempt to answer the question.');
  }

  // Framework recommendation based on category
  let framework = 'STAR Framework';
  let suggestion = `Detail your step-by-step decision criteria and quantify the before-and-after outcome for ${company}.`;

  if (question.category?.toLowerCase().includes('technical') || question.category?.toLowerCase().includes('architecture') || question.category?.toLowerCase().includes('system')) {
    framework = 'Architectural Trade-off Framework';
    suggestion = 'State initial constraints, compare 2 technical options, and explain why your chosen design won.';
  } else if (question.category?.toLowerCase().includes('leadership') || question.category?.toLowerCase().includes('conflict')) {
    framework = 'CAR (Context-Action-Result) Framework';
    suggestion = 'Focus on stakeholder alignment, communication mechanisms, and final business consensus.';
  }

  return {
    questionId: question.id,
    overallScore,
    scoreInterval: [Math.max(0, overallScore - 0.5), Math.min(10, overallScore + 0.5)],
    answerClassification: overallScore >= 7.5 ? 'strong' : overallScore >= 5.0 ? 'adequate' : overallScore >= 3.0 ? 'weak' : 'irrelevant',
    relevanceGate: {
      status: overallScore >= 4.0 ? 'answered' : 'partially_answered',
      score: relevanceScore,
      reason: `Assessed relevance against ${question.category || 'domain'} hiring bar criteria.`,
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
    followUpNeeded: overallScore < 5.5 && wordCount > 12,
    followUpTriggerReason: hasNumbers ? undefined : 'Probe for quantitative metric lift or trade-off analysis.',
  };
}

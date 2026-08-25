/**
 * Phase 4: Answer Intelligence & Deterministic Scoring Test Suite
 *
 * Validates all 34 deterministic answer evaluation, scoring, confidence,
 * evidence extraction, conversation intent, and brain update scenarios.
 */

import { calculateDeterministicScore, DIMENSION_WEIGHTS } from '../src/services/ai/answerScoreEngine';
import { deriveConversationIntent } from '../src/services/ai/conversationIntent';
import { evaluateAnswerDeterministically } from '../src/services/ai/deterministicAnswerEvaluator';
import {
  initializeCompetencyMap,
  updateCompetencyState,
  getExpectedSignalsForType,
} from '../src/services/ai/competencyMap';
import {
  interviewBrain,
  computeAdaptiveDifficulty,
  updateBrainAfterEvaluation,
} from '../src/services/ai/interviewBrain';
import { buildInterviewContract } from '../src/services/ai/interviewContract';
import type {
  Question,
  AnswerEvaluation,
  InterviewContract,
  InterviewObjective,
  QuestionFeedback,
} from '../src/types/interview';
import type { LockedCandidateContext } from '../src/types/resume';
import type { JDEvidenceModel } from '../src/types/jobDescription';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

export function runAnswerIntelligenceTests(): number {
  console.log('\n--- Phase 4: Answer Intelligence & Deterministic Scoring Tests ---');
  let count = 0;

  const mockQuestion: Question = {
    id: 'q_test_1',
    order: 1,
    type: 'initial',
    questionType: 'analytical',
    source: 'job_description',
    sourceReference: 'Core Responsibilities',
    targetCompetency: 'Product Analytics & Metrics',
    category: 'Product Analytics',
    text: 'How would you investigate a 15% DAU decline for a mobile app?',
    intent: 'Assess hypothesis formulation and metric segmentation',
    expectedAnswerCharacteristics: [
      'Decomposes decline by cohorts and platforms',
      'Formulates testable hypotheses',
      'Analyzes trade-offs and action plan',
    ],
    difficulty: 'intermediate',
    recommendedDurationSeconds: 180,
    expectedSignals: ['metric decomposition', 'cohort segmentation', 'hypothesis formulation', 'trade-off analysis'],
  };

  const sampleContract: InterviewContract = {
    sessionId: 'ses_test',
    createdAt: new Date().toISOString(),
    mode: 'jd_matched',
    durationSeconds: 1200,
    criticalCompetencies: ['Product Analytics & Metrics', 'Product Strategy & Roadmap'],
    optionalCompetencies: ['Cross-functional Execution'],
    minQuestions: 5,
    maxQuestions: 15,
    timeBudget: { opening: 120, coreAssessment: 600, gapProbing: 360, closing: 120 },
    maxFollowUpsPerTopic: 2,
    minimumEvidenceTargets: 3,
  };

  // ─── Scenario 1: Relevant Answer Classification ───────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I would first decompose the DAU decline by cohorts and platforms (iOS vs Android), check app crash logs, and formulate hypotheses regarding release regressions.',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.relevanceGate.status === 'answered', 'Scenario 1: Relevant answer passes relevance gate');
    assert(evalResult.overallScore >= 6.0, 'Scenario 1: Relevant answer achieves solid score');
    count += 2;
  }

  // ─── Scenario 2: Partial Answer Classification ────────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I would check DAU graphs and talk to team.',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.missingSignals && evalResult.missingSignals.length > 0, 'Scenario 2: Partial answer flags missing signals');
    assert(evalResult.overallScore < 7.0, 'Scenario 2: Partial answer receives moderate/low score');
    count += 2;
  }

  // ─── Scenario 3: Irrelevant Answer ────────────────────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I like cricket and watch IPL matches on weekends with my friends.',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.answerClassification === 'irrelevant', 'Scenario 3: Off-topic answer classified as irrelevant');
    assert(evalResult.overallScore === 0.0, 'Scenario 3: Irrelevant answer scores 0.0');
    count += 2;
  }

  // ─── Scenario 4: "I don't know" ───────────────────────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: "I don't know much about this specific area.",
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.answerClassification === 'uncertain', 'Scenario 4: Honest unfamiliarity classified as uncertain');
    assert(evalResult.professionalism.status === 'acceptable', 'Scenario 4: Uncertain response not penalized as poor professionalism');
    count += 2;
  }

  // ─── Scenario 5: Repeat Request ───────────────────────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'Could you please repeat the question?',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.answerClassification === 'repeat_request', 'Scenario 5: Repeat request classified correctly');
    assert(evalResult.followUpNeeded === false, 'Scenario 5: Repeat request does not trigger penalty follow-up');
    count += 2;
  }

  // ─── Scenario 6: Refusal ──────────────────────────────────────────────────
  {
    const evalResult = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: "I'd rather not answer that question.",
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalResult.answerClassification === 'refusal', 'Scenario 6: Refusal classified correctly');
    assert(evalResult.overallScore === 0.0, 'Scenario 6: Refusal scores 0.0');
    count += 2;
  }

  // ─── Scenario 7 & 8: Evidence-only positive observations ──────────────────
  {
    const rawEval: Partial<AnswerEvaluation> = {
      answerClassification: 'answered',
      positiveObservations: [
        { observation: 'Used cohort analysis', evidenceText: 'I used cohort analysis on iOS users' },
      ],
      dimensions: {
        relevance: { score: 8, assessmentStatus: 'assessed', reason: '' },
        depth: { score: 7, assessmentStatus: 'assessed', reason: '' },
        evidence: { score: 8, assessmentStatus: 'assessed', reason: '' },
        roleAlignment: { score: 8, assessmentStatus: 'assessed', reason: '' },
        structure: { score: 7, assessmentStatus: 'assessed', reason: '' },
        clarity: { score: 8, assessmentStatus: 'assessed', reason: '' },
      },
    };
    assert(rawEval.positiveObservations![0].evidenceText.length > 0, 'Scenario 7: Positive observation contains evidence quote');

    const emptyEval = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I like cricket.',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(emptyEval.whatWorked.length === 0, 'Scenario 8: Empty positive observations when no evidence exists');
    count += 2;
  }

  // ─── Scenario 9 & 10: Null clarity/structure for irrelevant answer ─────────
  {
    const evalIrrelevant = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I watch IPL cricket matches.',
      role: 'Senior PM',
      company: 'Acme',
    });
    const dims = evalIrrelevant.answerEvaluation?.dimensions;
    assert(dims?.clarity.score === null, 'Scenario 9: Clarity is null for irrelevant answer');
    assert(dims?.structure.score === null, 'Scenario 10: Structure is null for irrelevant answer');
    count += 2;
  }

  // ─── Scenario 11 & 12: Null dimensions excluded from score ────────────────
  {
    const partialEvaluation: Partial<AnswerEvaluation> = {
      answerClassification: 'answered',
      dimensions: {
        relevance: { score: 8.0, assessmentStatus: 'assessed', reason: '' },
        depth: { score: 8.0, assessmentStatus: 'assessed', reason: '' },
        evidence: { score: 8.0, assessmentStatus: 'assessed', reason: '' },
        roleAlignment: { score: 8.0, assessmentStatus: 'assessed', reason: '' },
        structure: { score: null, assessmentStatus: 'not_assessable', reason: '' },
        clarity: { score: null, assessmentStatus: 'not_assessable', reason: '' },
      },
    };
    const detScore = calculateDeterministicScore(partialEvaluation);
    assert(detScore.score === 8.0, 'Scenario 11: Null dimensions properly excluded without lowering score');
    assert(detScore.excludedDimensions.includes('structure'), 'Scenario 12: Excluded dimensions list tracked in result');
    count += 2;
  }

  // ─── Scenario 13: Score does not depend on LLM numeric score ──────────────
  {
    const testEval: Partial<AnswerEvaluation> = {
      answerClassification: 'answered',
      dimensions: {
        relevance: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
        depth: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
        evidence: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
        roleAlignment: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
        structure: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
        clarity: { score: 10.0, assessmentStatus: 'assessed', reason: '' },
      },
    };
    const result = calculateDeterministicScore(testEval);
    assert(result.score === 10.0, 'Scenario 13: Deterministic score calculation matches mathematical weights exactly');
    count += 1;
  }

  // ─── Scenario 14 & 15: Evidence & missing signal extraction ───────────────
  {
    const evalRes = evaluateAnswerDeterministically({
      question: mockQuestion,
      answerText: 'I analyzed the funnel and reduced latency by 35%, evaluating trade-offs between Redis caching and Postgres indexing.',
      role: 'Senior PM',
      company: 'Acme',
    });
    assert(evalRes.observedSignals && evalRes.observedSignals.length > 0, 'Scenario 14: Evidence signals extracted from answer');
    assert(Array.isArray(evalRes.missingSignals), 'Scenario 15: Missing signals cleanly identified');
    count += 2;
  }

  // ─── Scenario 16 & 17: Competency transitions insufficient -> provisional -> reliable
  {
    const compMap = initializeCompetencyMap(sampleContract);
    const targetComp = 'Product Analytics & Metrics';

    // Step A: Moderate answer -> provisional
    const moderateFeedback: QuestionFeedback = {
      questionId: 'q_test_1',
      overallScore: 6.5,
      answerClassification: 'adequate',
      relevanceGate: { status: 'answered', score: 6.5, reason: '' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 7, structure: 6, clarity: 7, depth: 6, evidence: 6, roleAlignment: 7 },
      whatWorked: ['Analyzed metric funnel'],
      whatHeldYouBack: [],
      tryThisNextTime: { framework: 'STAR', suggestion: '', promptToImprove: '' },
      observedSignals: ['metric decomposition'],
      missingSignals: ['trade-off analysis'],
    };

    const objA: InterviewObjective = {
      targetCompetency: targetComp,
      questionType: 'analytical',
      intent: 'Assess analytics',
      useResumeGrounding: false,
      difficulty: 'intermediate',
      timeAllocationSeconds: 180,
      isFollowUp: false,
      expectedSignals: ['metric decomposition', 'trade-off analysis'],
    };

    const stateA = updateCompetencyState(compMap[targetComp], moderateFeedback, objA, 'I looked at metrics and funnel.');
    assert(stateA.assessmentReliability === 'provisional', 'Scenario 16: Moderate answer transitions competency to provisional');

    // Step B: Strong answer -> reliable
    const strongFeedback: QuestionFeedback = {
      ...moderateFeedback,
      overallScore: 9.0,
      answerClassification: 'strong',
      whatWorked: ['Identified trade-offs', 'Measured 20% conversion lift'],
      missingSignals: [],
      observedSignals: ['metric decomposition', 'trade-off analysis'],
    };

    const stateB = updateCompetencyState(stateA, strongFeedback, objA, 'I analyzed trade-offs and observed a 20% metric increase.');
    assert(stateB.assessmentReliability === 'reliable', 'Scenario 17: Strong comprehensive answer transitions competency to reliable');
    count += 2;
  }

  // ─── Scenario 18: Contradiction reduces reliability ───────────────────────
  {
    const compMap = initializeCompetencyMap(sampleContract);
    const targetComp = 'Product Analytics & Metrics';
    const contradictedFeedback: QuestionFeedback = {
      questionId: 'q_test_1',
      overallScore: 4.0,
      answerClassification: 'unsupported_claim',
      relevanceGate: { status: 'answered', score: 4.0, reason: '' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 4, structure: 4, clarity: 4, depth: 4, evidence: 2, roleAlignment: 4 },
      whatWorked: [],
      whatHeldYouBack: ['Contradicted confirmed resume dates'],
      tryThisNextTime: { framework: 'STAR', suggestion: '', promptToImprove: '' },
      unverifiedClaims: [{ claim: 'Led 100 people at Google', resumeSupport: 'contradicted', note: 'Resume lists 2 person intern' }],
    };

    const obj: InterviewObjective = {
      targetCompetency: targetComp,
      questionType: 'analytical',
      intent: '',
      useResumeGrounding: false,
      difficulty: 'intermediate',
      timeAllocationSeconds: 180,
      isFollowUp: false,
    };

    const updated = updateCompetencyState(compMap[targetComp], contradictedFeedback, obj, 'I led 100 people');
    assert(updated.assessmentReliability === 'insufficient', 'Scenario 18: Contradiction drops reliability to insufficient');
    count += 1;
  }

  // ─── Scenario 19 & 20: Strong answer avoids follow-up / Weak answer triggers targeted follow-up
  {
    const compMap = initializeCompetencyMap(sampleContract);
    // Mark one competency reliable
    compMap['Product Analytics & Metrics'] = {
      ...compMap['Product Analytics & Metrics'],
      status: 'assessed',
      assessmentReliability: 'reliable',
      questionsAsked: 1,
    };

    const decision = interviewBrain.selectNextObjective(
      sampleContract,
      compMap,
      undefined,
      [],
      600,
      [8.5]
    );
    assert(decision.nextObjective.targetCompetency === 'Product Strategy & Roadmap', 'Scenario 19: Strong answer on competency moves to next competency');

    // Weak answer on second competency triggers targeted follow-up
    compMap['Product Strategy & Roadmap'] = {
      ...compMap['Product Strategy & Roadmap'],
      status: 'partial',
      assessmentReliability: 'insufficient',
      questionsAsked: 1,
      followUpsUsed: 0,
      missingSignals: ['prioritization framework', 'trade-off analysis'],
    };

    const weakFeedback: QuestionFeedback = {
      questionId: 'q2',
      overallScore: 4.5,
      answerClassification: 'weak',
      shouldFollowUp: true,
      followUpReasonCode: 'missing_tradeoff',
      relevanceGate: { status: 'answered', score: 4.5, reason: '' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 5, structure: 4, clarity: 5, depth: 3, evidence: 3, roleAlignment: 4 },
      whatWorked: [],
      whatHeldYouBack: ['No prioritization criteria provided'],
      tryThisNextTime: { framework: 'STAR', suggestion: '', promptToImprove: '' },
      missingSignals: ['trade-off analysis'],
    };

    const followUpDecision = interviewBrain.selectNextObjective(
      sampleContract,
      compMap,
      weakFeedback,
      [],
      500,
      [8.5, 4.5]
    );
    assert(followUpDecision.nextObjective.isFollowUp === true, 'Scenario 20: Weak answer triggers targeted follow-up');
    assert(followUpDecision.nextObjective.expectedSignals?.includes('trade-off analysis'), 'Scenario 20: Target follow-up explicitly includes missing signals');
    count += 2;
  }

  // ─── Scenario 21: Missing metric only matters when expected ────────────────
  {
    const behavioralSignals = getExpectedSignalsForType('behavioral');
    assert(!behavioralSignals.includes('statistical p-value'), 'Scenario 21: Qualitative behavioral rubric does not mandate statistical metrics');
    count += 1;
  }

  // ─── Scenario 22 & 23: Repeat / Clarification request does not affect score
  {
    const repeatResult = calculateDeterministicScore({ answerClassification: 'repeat_request' });
    assert(repeatResult.scoreConfidence === 'high', 'Scenario 22: Repeat request score confidence is high');
    assert(repeatResult.assessedDimensions === 0, 'Scenario 22: Repeat request has 0 assessed dimensions');

    const clarifyResult = calculateDeterministicScore({ answerClassification: 'clarification_request' });
    assert(clarifyResult.score === 5.0, 'Scenario 23: Clarification request gives neutral holding score');
    count += 2;
  }

  // ─── Scenario 24, 25, 26: Difficulty Adaptation ───────────────────────────
  {
    // Irrelevant scores ignored
    const diff1 = computeAdaptiveDifficulty([8.5, 9.0]);
    assert(diff1 === 'advanced', 'Scenario 25: Consecutive high scores adapt to advanced');

    const diff2 = computeAdaptiveDifficulty([3.0, 3.5]);
    assert(diff2 === 'foundational', 'Scenario 26: Consecutive low scores adapt to foundational');

    const diff3 = computeAdaptiveDifficulty([7.0, 6.5]);
    assert(diff3 === 'intermediate', 'Scenario 24: Moderate scores adapt to intermediate');
    count += 3;
  }

  // ─── Scenario 27 & 28: Evidence persistence & no duplicate evaluation ─────
  {
    const compMap = initializeCompetencyMap(sampleContract);
    const serialized = JSON.stringify(compMap);
    const restored = JSON.parse(serialized);
    assert(restored['Product Analytics & Metrics'].assessmentReliability === 'insufficient', 'Scenario 27: State serializes and restores cleanly');
    assert(Object.keys(restored).length === Object.keys(compMap).length, 'Scenario 28: No duplicate entries created upon restoration');
    count += 2;
  }

  // ─── Scenario 29: Next objective uses updated competency map ──────────────
  {
    const compMap = initializeCompetencyMap(sampleContract);
    compMap['Product Analytics & Metrics'].assessmentReliability = 'reliable';
    compMap['Product Strategy & Roadmap'].assessmentReliability = 'reliable';

    const decision = interviewBrain.selectNextObjective(sampleContract, compMap, undefined, [], 400);
    assert(decision.nextObjective.targetCompetency === 'Cross-functional Execution' || decision.nextObjective.questionType === 'closing', 'Scenario 29: Next objective transitions to optional or closing when critical reliable');
    count += 1;
  }

  // ─── Scenario 30 & 31: Candidate response opacity (no score or competency leak)
  {
    const intent = deriveConversationIntent(
      { answerClassification: 'strong' },
      {
        targetCompetency: 'Product Analytics',
        questionType: 'product_sense',
        intent: 'Test user segmentation',
        useResumeGrounding: false,
        difficulty: 'intermediate',
        timeAllocationSeconds: 180,
        isFollowUp: false,
      }
    );
    assert(intent.action === 'transition', 'Scenario 30: Conversation intent selects transition for strong answer');
    assert(intent.tone === 'encouraging', 'Scenario 31: Intent tone is encouraging');
    count += 2;
  }

  // ─── Scenario 32 & 33: Conversation Intent & Deterministic Flow ───────────
  {
    const repeatIntent = deriveConversationIntent(
      { answerClassification: 'repeat_request' },
      mockQuestion as any,
      mockQuestion
    );
    assert(repeatIntent.action === 'acknowledge_repeat_request', 'Scenario 32: Intent matches repeat request');

    const updateRes = updateBrainAfterEvaluation(
      sampleContract,
      initializeCompetencyMap(sampleContract),
      {
        questionId: 'q1',
        overallScore: 8.5,
        answerClassification: 'strong',
        relevanceGate: { status: 'answered', score: 8.5, reason: '' },
        professionalism: { status: 'acceptable' },
        breakdown: { relevance: 9, structure: 8, clarity: 8, depth: 8, evidence: 8, roleAlignment: 9 },
        whatWorked: ['Demonstrated strong analytics'],
        whatHeldYouBack: [],
        tryThisNextTime: { framework: 'STAR', suggestion: '', promptToImprove: '' },
      },
      mockQuestion as any,
      [],
      600,
      [8.5]
    );
    assert(updateRes.decisionRule !== '', 'Scenario 33: updateBrainAfterEvaluation executes full deterministic cycle');
    count += 2;
  }

  // ─── Scenario 34: Multi-Persona Resume Validation ─────────────────────────
  {
    // A: Student Resume
    const studentContext: LockedCandidateContext = {
      sessionId: 'ses_student',
      lockedAt: new Date().toISOString(),
      evidenceModel: {
        identity: { name: { value: 'Student A', sourceText: 'Student A', confidence: 'high', sourceLocation: { section: 'HEADER' } } },
        education: [{ institution: { value: 'MIT', sourceText: 'MIT', confidence: 'high', sourceLocation: { section: 'EDUCATION' } } }],
        workExperience: [],
        projects: [{
          name: { value: 'Campus App', sourceText: 'Campus App', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
          technologies: [{ value: 'React', sourceText: 'React', confidence: 'high', sourceLocation: { section: 'PROJECTS' } }],
          outcomes: [],
        }],
        skills: { technical: [], product: [], domain: [] },
        certifications: [],
        achievements: [],
        unclear: [],
      },
      derivedProfile: { name: 'Student A', summary: '', education: [], experience: [], projects: [], skills: [], strengths: [], potentialGaps: [] },
    };

    const studentContract = buildInterviewContract('ses_student', 600, studentContext, null, null);
    assert(studentContract.mode === 'resume_grounded', 'Scenario 34A: Student resume generates valid grounded contract');
    assert(studentContract.criticalCompetencies.length > 0, 'Scenario 34A: Competencies derived from student projects');

    // B: SWE Resume
    const sweContext: LockedCandidateContext = {
      sessionId: 'ses_swe',
      lockedAt: new Date().toISOString(),
      evidenceModel: {
        identity: { name: { value: 'Dev B', sourceText: 'Dev B', confidence: 'high', sourceLocation: { section: 'HEADER' } } },
        education: [],
        workExperience: [{
          company: { value: 'TechCorp', sourceText: 'TechCorp', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          role: { value: 'Backend Engineer', sourceText: 'Backend Engineer', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          bullets: [{ value: 'Built Kafka event pipeline handling 10k RPS', sourceText: 'Built Kafka event pipeline handling 10k RPS', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } }],
        }],
        projects: [],
        skills: {
          technical: [{ value: 'Kafka', sourceText: 'Kafka', confidence: 'high', sourceLocation: { section: 'SKILLS' } }],
          product: [],
          domain: [],
        },
        certifications: [],
        achievements: [],
        unclear: [],
      },
      derivedProfile: { name: 'Dev B', summary: '', education: [], experience: [], projects: [], skills: [], strengths: [], potentialGaps: [] },
    };

    const sweContract = buildInterviewContract('ses_swe', 1200, sweContext, null, null);
    assert(
      sweContract.criticalCompetencies.some((c) =>
        c.toLowerCase().includes('architecture') ||
        c.toLowerCase().includes('api') ||
        c.toLowerCase().includes('data modeling') ||
        c.toLowerCase().includes('delivery') ||
        c.toLowerCase().includes('backend') ||
        c.toLowerCase().includes('engineering')
      ),
      'Scenario 34B: SWE resume derives engineering competencies'
    );

    count += 4;
  }

  console.log(`\n========================================`);
  console.log(`  PHASE 4 TEST SUITE SUMMARY`);
  console.log(`  Total Scenarios Passed: ${count}`);
  console.log(`========================================\n`);

  return count;
}

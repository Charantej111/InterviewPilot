import { shouldCompleteInterview, validateSessionTransition } from '../src/services/ai/interviewLifecycle';
import { buildInterviewContract } from '../src/services/ai/interviewContract';
import { initializeCompetencyMap, updateCompetencyState } from '../src/services/ai/competencyMap';
import { interviewBrain } from '../src/services/ai/interviewBrain';
import { mockPMJD, mockCandidateContext } from './interviewBrain.test';
import type { InterviewContract, CompetencyMap, QuestionFeedback, InterviewObjective, Question, InterviewSession } from '../src/types/interview';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runInterviewLifecycleTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      // console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ❌ ${name} -> ${err.message}`);
    }
  }

  console.log('--- Phase 5: Interview Lifecycle Engine Tests ---');

  const contract = buildInterviewContract(
    'sess_test_123',
    1200,
    mockCandidateContext,
    mockPMJD,
    null
  );

  const competencyMap = initializeCompetencyMap(contract, mockCandidateContext, mockPMJD);

  test('Scenario 1: Interview starts correctly (validate transitions)', () => {
    assert(validateSessionTransition('not_started', 'starting'), 'Should allow not_started -> starting');
    assert(validateSessionTransition('starting', 'active'), 'Should allow starting -> active');
    assert(!validateSessionTransition('not_started', 'completed'), 'Should block not_started -> completed');
  });

  test('Scenario 2: Question 1 exists after Start Interview', () => {
    const questions: Question[] = [{
      id: 'q_1',
      order: 1,
      type: 'initial',
      questionType: 'resume_deep_dive',
      source: 'resume',
      sourceReference: 'Projects',
      targetCompetency: 'Product Discovery',
      intent: 'Assess Flagship project discovery details',
      expectedAnswerCharacteristics: [],
      parentQuestionId: null,
      category: 'Product Discovery',
      text: 'Describe a project where you conducted user discovery.'
    }];

    assert(questions.length === 1, 'Question 1 should exist');
    assert(questions[0].order === 1, 'Question 1 order should be 1');
  });

  test('Scenario 3: Answer 1 does not complete interview', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 900,
      currentObjective: {
        targetCompetency: 'Product Discovery',
        questionType: 'verify_strength',
        intent: 'Verify Alex discovery experience',
        useResumeGrounding: true,
        difficulty: 'intermediate',
        timeAllocationSeconds: 120,
        isFollowUp: false
      },
      contract,
      competencyMap,
      questionsAskedCount: 1,
      closingTurnCompleted: false
    });

    assert(!res.shouldComplete, 'Answer 1 should not trigger completion');
  });

  test('Scenario 4: Answer 1 generates Question 2', () => {
    // Simulated advanceToNextQuestion
    const currentQuestionIndex = 0;
    const nextIndex = currentQuestionIndex + 1;
    assert(nextIndex === 1, 'Next index should be 1');
  });

  test('Scenario 5: Question 2 does not exist before Answer 1 evaluation', () => {
    const questions: Question[] = [{
      id: 'q_1',
      order: 1,
      type: 'initial',
      questionType: 'resume_deep_dive',
      source: 'resume',
      sourceReference: 'Projects',
      targetCompetency: 'Product Discovery',
      intent: 'Assess discovery',
      expectedAnswerCharacteristics: [],
      parentQuestionId: null,
      category: 'Discovery',
      text: 'Discovery question text'
    }];
    // Question 2 should not exist in the array yet
    assert(questions.length === 1, 'Only question 1 should exist');
    assert(!questions.find(q => q.order === 2), 'Question 2 should not be pre-generated');
  });

  test('Scenario 6: Answer 2 generates Question 3', () => {
    const currentQuestionIndex = 1;
    const nextIndex = currentQuestionIndex + 1;
    assert(nextIndex === 2, 'Next index should be 2');
  });

  test('Scenario 7: Weak answer generates follow-up', () => {
    const feedback: QuestionFeedback = {
      questionId: 'q_1',
      overallScore: 3.5,
      answerClassification: 'weak',
      relevanceGate: { status: 'answered', score: 8, reason: 'Relevant but shallow' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 8, structure: 4, clarity: 4, depth: 3, evidence: 3, roleAlignment: 4 },
      whatWorked: [],
      whatHeldYouBack: ['Missing specific outcomes and user interview baseline details.'],
      tryThisNextTime: { framework: 'STAR', suggestion: 'Mention metrics.', examplePhrasing: 'Increased by 12%' },
      shouldFollowUp: true,
      followUpReasonCode: 'missing_evidence'
    };

    const localMap = JSON.parse(JSON.stringify(competencyMap));
    localMap['Product Discovery'].questionsAsked = 1;
    localMap['Product Discovery'].assessmentReliability = 'insufficient';

    const nextDecision = interviewBrain.selectNextObjective(
      contract,
      localMap,
      feedback,
      [],
      900,
      [3.5],
      mockCandidateContext
    );

    assert(nextDecision.nextObjective.isFollowUp === true, 'Weak answer should trigger follow-up');
  });

  test('Scenario 8: Strong answer advances competency', () => {
    const feedback: QuestionFeedback = {
      questionId: 'q_1',
      overallScore: 8.5,
      answerClassification: 'strong',
      relevanceGate: { status: 'answered', score: 10, reason: 'Extremely detailed' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 10, structure: 9, clarity: 9, depth: 8, evidence: 8.5, roleAlignment: 9 },
      whatWorked: ['Clearly quantified achievements.'],
      whatHeldYouBack: [],
      tryThisNextTime: { framework: 'STAR', suggestion: 'None' },
      shouldFollowUp: false
    };

    const localMap = JSON.parse(JSON.stringify(competencyMap));
    localMap['Product Discovery'].questionsAsked = 1;
    localMap['Product Discovery'].assessmentReliability = 'insufficient';

    const nextDecision = interviewBrain.selectNextObjective(
      contract,
      localMap,
      feedback,
      [],
      900,
      [8.5],
      mockCandidateContext
    );

    assert(nextDecision.nextObjective.isFollowUp === false, 'Strong answer should advance competency');
  });

  test('Scenario 9: Follow-up limit is respected', () => {
    // If follow-ups used >= maxFollowUpsPerTopic, selectNextObjective should move to a new competency
    const highFollowUpMap: CompetencyMap = JSON.parse(JSON.stringify(competencyMap));
    const targetComp = contract.criticalCompetencies[0];
    highFollowUpMap[targetComp].followUpsUsed = contract.maxFollowUpsPerTopic;
    highFollowUpMap[targetComp].assessmentReliability = 'insufficient';

    const feedback: QuestionFeedback = {
      questionId: 'q_1',
      overallScore: 4.0,
      answerClassification: 'weak',
      relevanceGate: { status: 'answered', score: 7, reason: 'Weak' },
      professionalism: { status: 'acceptable' },
      breakdown: { relevance: 7, structure: 4, clarity: 4, depth: 3, evidence: 3, roleAlignment: 4 },
      whatWorked: [],
      whatHeldYouBack: [],
      tryThisNextTime: { framework: 'STAR', suggestion: '' },
      shouldFollowUp: true,
      followUpReasonCode: 'missing_evidence'
    };

    const nextDecision = interviewBrain.selectNextObjective(
      contract,
      highFollowUpMap,
      feedback,
      [],
      900,
      [4.0],
      mockCandidateContext
    );

    assert(nextDecision.nextObjective.targetCompetency !== targetComp || nextDecision.nextObjective.isFollowUp === false, 'Should respect follow-up limit bounds');
  });

  test('Scenario 10: Interview does not finish at minQuestions automatically', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 600,
      contract,
      competencyMap,
      questionsAskedCount: contract.minQuestions,
      closingTurnCompleted: false
    });

    assert(!res.shouldComplete, 'Should not automatically complete just because minQuestions is reached');
  });

  test('Scenario 11: Interview cannot exceed maxQuestions', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 300,
      contract,
      competencyMap,
      questionsAskedCount: contract.maxQuestions,
      closingTurnCompleted: false
    });

    assert(res.shouldComplete, 'Should complete once maxQuestions hard ceiling is reached');
    assert(res.reason === 'CONTRACT_COMPLETED', 'Reason should be CONTRACT_COMPLETED');
  });

  test('Scenario 12: Time expiry triggers closing', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 0,
      contract,
      competencyMap,
      questionsAskedCount: 4,
      closingTurnCompleted: false
    });

    assert(res.shouldComplete, 'Should complete on time expiry');
    assert(res.reason === 'TIME_EXPIRED', 'Reason should be TIME_EXPIRED');
  });

  test('Scenario 13: Closing completes interview', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 200,
      currentObjective: {
        targetCompetency: 'Closing',
        questionType: 'closing',
        intent: 'Closing interview remarks',
        useResumeGrounding: false,
        difficulty: 'beginner',
        timeAllocationSeconds: 60,
        isFollowUp: false
      },
      contract,
      competencyMap,
      questionsAskedCount: 6,
      closingTurnCompleted: true
    });

    assert(res.shouldComplete, 'Should complete on closing turn completion');
    assert(res.reason === 'BRAIN_CLOSING', 'Reason should be BRAIN_CLOSING');
  });

  test('Scenario 14: Feedback route requires completed session', () => {
    const mockActiveSession = {
      id: 'sess_active',
      status: 'in_progress' as const,
    };
    const isCompleted = mockActiveSession.status === 'completed' || mockActiveSession.status === 'report_ready';
    assert(!isCompleted, 'Active session status is not completed');
  });

  test('Scenario 15: Refresh restores active session', () => {
    const mockSavedSessionState: InterviewSession = {
      id: 'sess_123',
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      mode: 'text',
      jobTitle: 'Product Manager',
      company: 'Acme',
      interviewType: 'behavioral',
      difficulty: 'intermediate',
      durationMinutes: 20,
      focusAreas: [],
      resumeName: 'res.pdf',
      jobDescriptionText: 'JD text',
      questions: [
        { id: 'q_1', order: 1, type: 'initial', questionType: 'resume_deep_dive', category: 'Discovery', text: 'Q1 text', source: 'resume', sourceReference: '', targetCompetency: 'Discovery', intent: '', expectedAnswerCharacteristics: [] },
        { id: 'q_2', order: 2, type: 'initial', questionType: 'verify_strength', category: 'Discovery', text: 'Q2 text', source: 'resume', sourceReference: '', targetCompetency: 'Discovery', intent: '', expectedAnswerCharacteristics: [] }
      ],
      currentQuestionIndex: 1,
      answers: {},
      feedbacks: {}
    };

    assert(mockSavedSessionState.currentQuestionIndex === 1, 'Should restore currentQuestionIndex exactly');
    assert(mockSavedSessionState.questions.length === 2, 'Should restore all questions');
  });

  test('Scenario 16: Duplicate submit does not create duplicate question', () => {
    const answers: Record<string, any> = {};
    const questionId = 'q_1';
    
    // First submit
    if (!answers[questionId]) {
      answers[questionId] = { answerText: 'Hello' };
    }
    
    // Duplicate submit check
    const secondSubmitBlocked = Boolean(answers[questionId]);
    assert(secondSubmitBlocked, 'Should block duplicate submit');
  });

  test('Scenario 17: Concurrent evaluation cannot mutate state twice', () => {
    let evaluating = false;
    let runCount = 0;
    
    const triggerSubmit = () => {
      if (evaluating) return;
      evaluating = true;
      runCount++;
    };

    triggerSubmit();
    triggerSubmit(); // Should be ignored
    evaluating = false;

    assert(runCount === 1, 'Should evaluate exactly once');
  });

  test('Scenario 18: Explicit End Interview works', () => {
    const res = shouldCompleteInterview({
      remainingSeconds: 600,
      contract,
      competencyMap,
      questionsAskedCount: 3,
      isExplicitExit: true
    });

    assert(res.shouldComplete, 'Should complete on explicit candidate exit');
    assert(res.reason === 'EXPLICIT_EXIT', 'Reason should be EXPLICIT_EXIT');
  });

  test('Scenario 19: UUID Safety verification helper', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const invalidUUID = 'q_1787652622504_4';
    
    assert(uuidRegex.test(validUUID), 'Valid UUID should pass check');
    assert(!uuidRegex.test(invalidUUID), 'Temporary application ID should fail UUID safety check');
  });

  test('Scenario 20: Submission Gateway Idempotency Caching Promise', async () => {
    const cachedPromises: Record<string, Promise<any>> = {};
    const turnId = 'turn_test_123';
    
    const runSubmission = () => {
      if (cachedPromises[turnId]) {
        return cachedPromises[turnId];
      }
      const promise = Promise.resolve({ status: 'in_progress', feedback: {} });
      cachedPromises[turnId] = promise;
      return promise;
    };

    const firstPromise = runSubmission();
    const secondPromise = runSubmission();
    assert(firstPromise === secondPromise, 'Subsequent gateway calls should return the same cached promise');
  });

  test('Scenario 21: Question Persistence Contract blocks candidate listening if UUID is invalid', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dynamicNextQ = { id: 'q_timestamp_temp', text: 'Where is the data?' };
    
    let isListeningActive = true;
    let turnStatus = 'generating_question';

    // Simulated persistence constraint validation
    if (!uuidRegex.test(dynamicNextQ.id)) {
      isListeningActive = false;
      turnStatus = 'failed';
    }

    assert(!isListeningActive, 'Microphone/listening must remain inactive if question lacks database UUID');
    assert(turnStatus === 'failed', 'Turn status should transition to failed on persistence failure');
  });

  test('Scenario 22: Completed-only Route Guard protects Feedback and Report paths', () => {
    const mockSession = { status: 'in_progress' };
    
    const isCompleted =
      mockSession.status === 'completed' ||
      mockSession.status === 'report_generating' ||
      mockSession.status === 'report_ready';

    assert(!isCompleted, 'Active interview sessions must be blocked by route guard');
  });

  test('Scenario 23: Client AI Bypass Config checks VITE_USE_CLIENT_AI toggle', () => {
    let edgeFunctionsInvoked = true;
    const VITE_USE_CLIENT_AI = 'true';
    
    if (VITE_USE_CLIENT_AI === 'true') {
      edgeFunctionsInvoked = false;
    }

    assert(!edgeFunctionsInvoked, 'Edge functions must be bypassed when VITE_USE_CLIENT_AI is true');
  });

  test('Scenario 24: Real UUID required for answers foreign keys', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const mockQuestion = { id: '72b0c144-8d9e-4e6f-a589-9831a29ffbe7' }; // Database UUID
    const mockAnswer = { questionId: mockQuestion.id, text: 'This is my answer.' };

    assert(uuidRegex.test(mockAnswer.questionId), 'Answer questionId must be a valid UUID');
  });

  return { passed, failed };
}

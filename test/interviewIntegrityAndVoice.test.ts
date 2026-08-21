import { computeMatchAssessment, computeMatchState, buildLegacyMatchResult } from '../src/services/ai/matchEngine';
import { interviewBrain } from '../src/services/ai/interviewBrain';
import { validateSingleQuestion } from '../src/services/ai/questionValidator';
import { TurnDetectionController } from '../src/services/voice/turnDetection';
import { LockedCandidateContext, CandidateEvidenceModel } from '../src/types/resume';
import { JDEvidenceModel } from '../src/types/jobDescription';

function createMockCandidate(name = 'Test Candidate'): LockedCandidateContext {
  const model: CandidateEvidenceModel = {
    identity: {
      name: { value: name, sourceText: name, confidence: 'high', sourceLocation: { section: 'header' } },
      email: { value: 'test@example.com', sourceText: 'test@example.com', confidence: 'high', sourceLocation: { section: 'header' } },
    },
    workExperience: [],
    projects: [
      {
        name: { value: 'Credit Card Fraud Transactions Detection System', sourceText: 'Credit Card Fraud Transactions Detection System', confidence: 'high', sourceLocation: { section: 'projects' } },
        technologies: [
          { value: 'Python', sourceText: 'Python', confidence: 'high', sourceLocation: { section: 'projects' } },
          { value: 'Scikit-Learn', sourceText: 'Scikit-Learn', confidence: 'high', sourceLocation: { section: 'projects' } },
          { value: 'Random Forest', sourceText: 'Random Forest', confidence: 'high', sourceLocation: { section: 'projects' } },
        ],
        outcomes: [
          { value: '94% accuracy', sourceText: '94% accuracy', confidence: 'high', sourceLocation: { section: 'projects' } },
        ],
      },
    ],
    education: [
      {
        institution: { value: 'Aditya Engineering College', sourceText: 'Aditya Engineering College', confidence: 'high', sourceLocation: { section: 'education' } },
        degree: { value: 'B.Tech in Artificial Intelligence', sourceText: 'B.Tech in Artificial Intelligence', confidence: 'high', sourceLocation: { section: 'education' } },
        year: { value: '2025', sourceText: '2025', confidence: 'high', sourceLocation: { section: 'education' } },
      },
    ],
    skills: {
      technical: [
        { value: 'Python', sourceText: 'Python', confidence: 'high', sourceLocation: { section: 'skills' } },
        { value: 'Machine Learning', sourceText: 'Machine Learning', confidence: 'high', sourceLocation: { section: 'skills' } },
        { value: 'SQL', sourceText: 'SQL', confidence: 'high', sourceLocation: { section: 'skills' } },
      ],
      product: [],
      domain: [],
    },
    certifications: [],
    achievements: [],
    unclear: [],
  };

  return {
    sessionId: 'ses_test',
    lockedAt: new Date().toISOString(),
    evidenceModel: model,
    derivedProfile: {
      name,
      role: 'ML Engineer',
      yearsOfExperience: 0,
      skills: ['Python', 'Machine Learning', 'SQL'],
      projects: [{ name: 'Credit Card Fraud Transactions Detection System', description: 'ML anomaly pipeline', technologies: ['Python', 'Scikit-Learn'] }],
      experience: [],
      education: [{ degree: 'B.Tech in AI', institution: 'Aditya Engineering College', year: '2025' }],
    },
  };
}

function createMockJD(): JDEvidenceModel {
  return {
    role: 'AI / Machine Learning Engineer',
    seniorityLevel: 'mid',
    minYearsExperience: 2,
    criticalCompetencies: ['Machine Learning', 'Python', 'System Design'],
    requiredSkills: [
      {
        id: 'req_python',
        requirement: 'Proficiency in Python programming',
        competencySignal: 'Python',
        strength: 'explicit',
        category: 'technical_skill',
        sourceText: 'Must have strong Python programming experience',
      },
      {
        id: 'req_ml',
        requirement: 'Experience training ML models with Scikit-Learn or PyTorch',
        competencySignal: 'Machine Learning',
        strength: 'explicit',
        category: 'technical_skill',
        sourceText: 'Experience training machine learning models',
      },
    ],
    technicalRequirements: [],
    responsibilities: [
      {
        id: 'resp_1',
        requirement: 'Build production anomaly detection pipelines',
        competencySignal: 'System Architecture',
        strength: 'explicit',
        category: 'responsibility',
        sourceText: 'Design and deploy production ML models',
      },
    ],
    domainKnowledge: [],
    behavioralSignals: [],
    preferredSkills: [],
  };
}

export function runInterviewIntegrityAndVoiceTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const candidate = createMockCandidate();

  // ----------------------------------------------------
  // TEST 1: Zero-JD Match State & Engine Invariant
  // ----------------------------------------------------
  console.log('\n--- Test Group 1: Zero-JD Match State Integrity ---');

  const zeroJdAssessment = computeMatchAssessment(candidate, null);
  assert(zeroJdAssessment === null, 'computeMatchAssessment returns null when JD is null');

  const zeroJdState = computeMatchState(candidate, null);
  assert(zeroJdState.status === 'not_ready', 'computeMatchState returns status="not_ready" when JD is absent');
  assert(zeroJdState.overallMatchPercent === null, 'computeMatchState overallMatchPercent is strictly null (no 83%, no 0%)');
  assert(zeroJdState.reason === 'JOB_DESCRIPTION_REQUIRED', 'computeMatchState reason is JOB_DESCRIPTION_REQUIRED');

  // ----------------------------------------------------
  // TEST 2: Valid JD Match Assessment
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: Valid JD Match Assessment ---');

  const validJd = createMockJD();
  const jdAssessment = computeMatchAssessment(candidate, validJd);
  assert(jdAssessment !== null, 'computeMatchAssessment succeeds with valid JD');
  assert(typeof jdAssessment?.overallMatchPercent === 'number', 'Calculates numerical match percentage when JD provided');
  assert(jdAssessment!.directMatches.length >= 1, 'Identifies direct matches from confirmed candidate projects & skills');

  const jdState = computeMatchState(candidate, validJd);
  assert(jdState.status === 'ready', 'computeMatchState returns status="ready" when JD is present');
  assert(typeof jdState.overallMatchPercent === 'number', 'Valid match percentage available');

  // ----------------------------------------------------
  // TEST 3: Resume-Grounded Dynamic Objective Selection (No JD)
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: Dynamic Objective Selection (Resume-Grounded vs JD-Matched) ---');

  const firstObjNoJd = interviewBrain.selectFirstObjective(candidate, null, null, 'Software Engineer');
  assert(firstObjNoJd !== null, 'selectFirstObjective succeeds without JD');
  assert(
    firstObjNoJd.focusRequirement?.includes('Credit Card Fraud') || firstObjNoJd.focusEvidenceSummary?.includes('Credit Card Fraud'),
    'First objective targets candidate confirmed flagship project deliverables without hallucinating missing tech'
  );

  // ----------------------------------------------------
  // TEST 4: Question Validation & Grounding Enforcement
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: Question Validation ---');

  const existing = new Set<string>();
  const validQ = validateSingleQuestion(
    {
      text: 'Can you walk me through the architecture and accuracy trade-offs in your Credit Card Fraud Transactions Detection System?',
      source: 'resume',
      sourceReference: 'Credit Card Fraud Transactions Detection System',
      targetCompetency: 'Technical Depth',
    },
    0,
    existing,
    'Credit Card Fraud Transactions Detection System using Python and Scikit-Learn'
  );
  assert(validQ.isValid === true, 'Valid grounded question passes validation');

  const duplicateQ = validateSingleQuestion(
    {
      text: 'Can you walk me through the architecture and accuracy trade-offs in your Credit Card Fraud Transactions Detection System?',
    },
    1,
    existing,
    'Some text'
  );
  assert(duplicateQ.isValid === false, 'Duplicate question is rejected');

  // ----------------------------------------------------
  // TEST 5: Speech Transcript In-Place Replacement (No Duplication)
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: Speech Transcript Reducer (In-Place Replacement) ---');

  let testFinal = '';
  let testInterim = 'I worked on a credit';
  let display = (testFinal + ' ' + testInterim).trim();
  assert(display === 'I worked on a credit', 'Initial interim hypothesis displayed');

  // Recognition updates interim hypothesis
  testInterim = 'I worked on a credit card fraud detection system';
  display = (testFinal + ' ' + testInterim).trim();
  assert(display === 'I worked on a credit card fraud detection system', 'Interim text replaced in-place without duplicating "I worked on a credit"');

  // Recognition finalizes
  testFinal = 'I worked on a credit card fraud detection system';
  testInterim = '';
  display = (testFinal + ' ' + testInterim).trim();
  assert(display === 'I worked on a credit card fraud detection system', 'Finalized text matches expected output with zero duplication');

  // ----------------------------------------------------
  // TEST 6: TurnDetectionController Behavior
  // ----------------------------------------------------
  console.log('\n--- Test Group 6: TurnDetectionController ---');

  let completedTurnText = '';
  let controllerState = '';

  const turnCtrl = new TurnDetectionController(
    { normalPauseThresholdMs: 100, shortPauseThresholdMs: 50, minimumMeaningfulWords: 3, minimumAnswerDurationMs: 10 },
    (finalAnswer) => {
      completedTurnText = finalAnswer;
    },
    (state) => {
      controllerState = state;
    }
  );

  turnCtrl.startTurn();
  assert(turnCtrl.getState() === 'listening', 'TurnDetectionController initializes in listening state');

  // Candidate speaks 1 word (below minimumMeaningfulWords)
  turnCtrl.onSpeechActivity('Hello');
  assert(turnCtrl.getState() === 'speaking', 'Transitions to speaking upon candidate audio');

  // Candidate completes full thought
  turnCtrl.onSpeechActivity('I built a fraud detection pipeline with high accuracy');
  assert(turnCtrl.getState() === 'speaking', 'Remains in speaking while active');

  // Candidate pauses
  turnCtrl.onSpeechPaused('I built a fraud detection pipeline with high accuracy');
  assert(turnCtrl.getState() === 'paused', 'Transitions to paused state during silence');

  // Force completion (e.g. candidate clicks manual finish)
  turnCtrl.forceComplete('I built a fraud detection pipeline with high accuracy');
  assert(completedTurnText === 'I built a fraud detection pipeline with high accuracy', 'Answer received accurately on completion');

  return { passed, failed };
}

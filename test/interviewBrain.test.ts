import {
  buildInterviewContract,
  getQuestionBounds,
  calculateTimeBudget,
  deriveJDCompetencies,
  deriveResumeCompetencies,
} from '../src/services/ai/interviewContract';
import {
  initializeCompetencyMap,
  updateCompetencyState,
  getExpectedSignalsForType,
} from '../src/services/ai/competencyMap';
import {
  interviewBrain,
  calculateInformationGain,
  computeAdaptiveDifficulty,
  hasConfirmedResumeEvidence,
} from '../src/services/ai/interviewBrain';
import {
  validateQuestion,
  generateFallbackQuestion,
} from '../src/services/ai/questionValidator';
import type {
  InterviewContract,
  CompetencyMap,
  QuestionFeedback,
  InterviewObjective,
  Question,
} from '../src/types/interview';
import type { LockedCandidateContext } from '../src/types/resume';
import type { JDEvidenceModel } from '../src/types/jobDescription';
import type { MatchAssessment } from '../src/types/matchAnalysis';

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

export const mockPMJD: JDEvidenceModel = {
  role: 'Lead Product Manager',
  seniority: 'Senior',
  coreFocus: 'Growth & Core Product Strategy',
  criticalCompetencies: ['Product Discovery', 'Data-Driven Experimentation'],
  requiredSkills: [
    {
      id: 'req_1',
      category: 'requiredSkills',
      requirement: 'A/B Testing & Conversion Funnels',
      strength: 'explicit',
      sourceText: 'Demonstrated experience running A/B tests and optimizing funnels.',
      critical: true,
      competencySignal: 'Experimentation & Metrics',
    },
    {
      id: 'req_2',
      category: 'requiredSkills',
      requirement: 'Stakeholder Alignment',
      strength: 'explicit',
      sourceText: 'Align cross-functional executive stakeholders.',
      critical: true,
      competencySignal: 'Executive Stakeholder Management',
    },
  ],
  technicalRequirements: [
    {
      id: 'req_3',
      category: 'technicalRequirements',
      requirement: 'SQL and cohort analytics',
      strength: 'explicit',
      sourceText: 'Proficiency in SQL.',
      critical: false,
      competencySignal: 'Data Analytics',
    },
  ],
  responsibilities: [],
  preferredSkills: [
    {
      id: 'pref_1',
      category: 'preferredSkills',
      requirement: 'B2B SaaS Growth',
      strength: 'preferred',
      sourceText: 'Experience in B2B SaaS preferred.',
      critical: false,
      competencySignal: 'B2B Domain Knowledge',
    },
  ],
  competencies: [],
  domainKeywords: ['Product Management', 'A/B Testing', 'B2B SaaS'],
  roleKeywords: ['Product Manager'],
  redFlags: [],
};

export const mockCandidateContext: LockedCandidateContext = {
  id: 'ctx_alex_chen_123',
  parsedResumeId: 'res_alex_chen',
  timestamp: '2026-08-25T00:00:00Z',
  derivedProfile: {
    name: 'Alex Chen',
    email: 'alex@example.com',
    targetRole: 'Product Manager',
    totalYearsExperience: 6,
  },
  evidenceModel: {
    candidateName: { value: 'Alex Chen', confidence: 'high', sourceSection: 'header', rawTextSnippet: 'Alex Chen' },
    workExperience: [
      {
        company: { value: 'Acme Growth Labs', confidence: 'high', sourceSection: 'experience', rawTextSnippet: 'Acme Growth Labs' },
        role: { value: 'Senior PM', confidence: 'high', sourceSection: 'experience', rawTextSnippet: 'Senior PM' },
        duration: { value: '2022 - Present', confidence: 'high', sourceSection: 'experience', rawTextSnippet: '2022 - Present' },
        bullets: [
          { value: 'Led onboarding redesign increasing conversion by 24%', confidence: 'high', sourceSection: 'experience', rawTextSnippet: 'Led onboarding redesign' },
          { value: 'Executed 40+ A/B tests across web and mobile funnels', confidence: 'high', sourceSection: 'experience', rawTextSnippet: 'Executed 40+ A/B tests' },
        ],
      },
    ],
    projects: [
      {
        name: { value: 'Self-Serve Onboarding Revamp', confidence: 'high', sourceSection: 'projects', rawTextSnippet: 'Self-Serve Onboarding Revamp' },
        technologies: [{ value: 'Mixpanel', confidence: 'high', sourceSection: 'projects', rawTextSnippet: 'Mixpanel' }],
        bullets: [{ value: 'Reduced drop-off by 18% in checkout funnel', confidence: 'high', sourceSection: 'projects', rawTextSnippet: 'Reduced drop-off' }],
      },
    ],
    skills: {
      technical: [{ value: 'SQL', confidence: 'high', sourceSection: 'skills', rawTextSnippet: 'SQL' }],
      product: [
        { value: 'A/B Testing', confidence: 'high', sourceSection: 'skills', rawTextSnippet: 'A/B Testing' },
        { value: 'Funnel Optimization', confidence: 'high', sourceSection: 'skills', rawTextSnippet: 'Funnel Optimization' },
      ],
      domain: [{ value: 'B2B SaaS', confidence: 'high', sourceSection: 'skills', rawTextSnippet: 'B2B SaaS' }],
    },
    education: [],
    certifications: [],
  },
  systemIntegrityHash: 'hash_alex_123',
};

export const mockMatchAssessment: MatchAssessment = {
  resumeExtractionId: 'ctx_alex_chen_123',
  jdContentHash: 'hash_jd_456',
  matchScore: 88,
  confidenceInterval: [85, 91],
  overallVerdict: 'strong_match',
  directMatches: [
    {
      jdRequirement: mockPMJD.requiredSkills[0],
      candidateEvidence: {
        sourceText: 'Executed 40+ A/B tests across web and mobile funnels',
        sourceLocation: { section: 'experience' },
        confidence: 'high',
        verifiedDeliverable: true,
      },
      verdict: 'direct',
      scoreTrace: { requirementId: 'req_1', weight: 1.5, multiplier: 1.0, earnedPoints: 15, possiblePoints: 15 },
      reasoning: 'Directly verified A/B testing experience.',
    },
  ],
  transferableMatches: [],
  missingRequirements: [],
  unprovenRequirements: [],
  criticalGaps: ['Executive Stakeholder Management'],
  timestamp: '2026-08-25T00:00:00Z',
};

// ─── Test Suite Execution Function ─────────────────────────────────────────────

export function runInterviewBrainTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('\n--- Phase 3: Interview Contract & Competency Map Engine Tests ---');

  // Test 1: Contract from PM JD
  const contract1 = buildInterviewContract('sess_1', 1200, mockCandidateContext, mockPMJD, mockMatchAssessment);
  assert(contract1.mode === 'jd_matched', 'Scenario 1: Contract from PM JD is jd_matched');
  assert(contract1.durationSeconds === 1200, 'Scenario 1: Contract duration is 1200s');
  assert(contract1.minQuestions === 5 && contract1.maxQuestions === 15, 'Scenario 1: Bounded questions 5..15');
  assert(
    contract1.timeBudget.opening + contract1.timeBudget.coreAssessment + contract1.timeBudget.gapProbing + contract1.timeBudget.closing === 1200,
    'Scenario 1: Time budget sums to 1200'
  );
  assert(contract1.criticalCompetencies.includes('Product Discovery'), 'Scenario 1: Contains Product Discovery');

  // Test 2: Contract without JD
  const contract2 = buildInterviewContract('sess_2', 600, mockCandidateContext, null, null);
  assert(contract2.mode === 'resume_grounded', 'Scenario 2: Mode is resume_grounded without JD');
  assert(contract2.minQuestions === 4 && contract2.maxQuestions === 9, 'Scenario 2: 10m bounded questions 4..9');

  // Test 3: JD critical competency derivation
  const { criticalCompetencies, optionalCompetencies } = deriveJDCompetencies(mockPMJD, mockMatchAssessment);
  assert(criticalCompetencies.includes('Product Discovery'), 'Scenario 3: Derived critical competencies');
  assert(optionalCompetencies.includes('B2B Domain Knowledge'), 'Scenario 3: Preferred skill is optional');

  // Test 4: Resume-grounded competency derivation
  const resumeComps = deriveResumeCompetencies(mockCandidateContext);
  assert(resumeComps.criticalCompetencies.some((c) => c.includes('Self-Serve Onboarding Revamp')), 'Scenario 4: Grounded in project');

  // Test 5: No JD => zero fabricated JD requirements
  assert(contract2.criticalCompetencies.every((c) => !c.includes('Lead Product Manager')), 'Scenario 5: Zero JD requirement fabrication');

  // Test 6: Competency map initialization
  const map6 = initializeCompetencyMap(contract1, mockCandidateContext, mockPMJD);
  assert(map6[contract1.criticalCompetencies[0]].status === 'untested', 'Scenario 6: Initial status is untested');
  assert(map6[contract1.criticalCompetencies[0]].assessmentReliability === 'insufficient', 'Scenario 6: Initial reliability is insufficient');

  // Test 7: Untested critical competency prioritized
  const gain7 = calculateInformationGain(contract1.criticalCompetencies[0], map6);
  assert(gain7 > 100, 'Scenario 7: Untested critical information gain > 100');

  // Test 8: Insufficient prioritized over reliable
  map6[contract1.criticalCompetencies[0]].assessmentReliability = 'reliable';
  map6[contract1.criticalCompetencies[0]].status = 'assessed';
  const dec8 = interviewBrain.selectNextObjective(contract1, map6, null, [], 600, [8.0], mockCandidateContext);
  assert(dec8.ruleTriggered === 'RULE_2_CRITICAL_INSUFFICIENT', 'Scenario 8: Rule 2 prioritizes insufficient');
  assert(dec8.nextObjective.targetCompetency !== contract1.criticalCompetencies[0], 'Scenario 8: Skips reliable');

  // Test 9: Reliable competency skipped
  for (const c of contract1.criticalCompetencies) {
    map6[c].assessmentReliability = 'reliable';
    map6[c].status = 'assessed';
  }
  const dec9 = interviewBrain.selectNextObjective(contract1, map6, null, [], 600, [8.5], mockCandidateContext);
  assert(dec9.ruleTriggered === 'RULE_5_OPTIONAL_COMPETENCY', 'Scenario 9: Moves to optional when critical reliable');

  // Test 10: Weak answer follow-up
  const map10 = initializeCompetencyMap(contract1, mockCandidateContext, mockPMJD);
  const targetComp10 = contract1.criticalCompetencies[0];
  map10[targetComp10].questionsAsked = 1;
  map10[targetComp10].followUpsUsed = 0;
  map10[targetComp10].assessmentReliability = 'insufficient';
  map10[targetComp10].missingSignals = ['measurable outcome'];

  const feedback10: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 4.0,
    answerClassification: 'weak',
    shouldFollowUp: true,
    followUpReasonCode: 'missing_evidence',
    relevanceGate: { status: 'partially_answered', score: 4.0, reason: 'Weak' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 4, structure: 4, clarity: 4, depth: 3, evidence: 2, roleAlignment: 4 },
    whatWorked: [],
    whatHeldYouBack: ['No concrete metrics'],
    tryThisNextTime: { framework: 'STAR', suggestion: 'Provide metrics', promptToImprove: 'Include numbers' },
  };
  const dec10 = interviewBrain.selectNextObjective(contract1, map10, feedback10, [], 800, [4.0], mockCandidateContext);
  assert(dec10.ruleTriggered === 'RULE_3_WEAK_ANSWER_FOLLOW_UP', 'Scenario 10: Rule 3 triggers follow-up');
  assert(dec10.nextObjective.isFollowUp === true, 'Scenario 10: isFollowUp is true');

  // Test 11: Follow-up budget cap
  map10[targetComp10].followUpsUsed = 2;
  const dec11 = interviewBrain.selectNextObjective(contract1, map10, feedback10, [], 700, [3.5], mockCandidateContext);
  assert(dec11.nextObjective.targetCompetency !== targetComp10, 'Scenario 11: Follow-up budget respected');

  // Test 12: Missing expected signal probe
  map10[targetComp10].followUpsUsed = 0;
  map10[targetComp10].missingSignals = ['cohort segmentation', 'hypothesis formation'];
  const dec12 = interviewBrain.selectNextObjective(contract1, map10, feedback10, [], 800, [4.5], mockCandidateContext);
  assert(dec12.nextObjective.expectedSignals?.includes('cohort segmentation') === true, 'Scenario 12: Missing signal included');

  // Test 13: Strong candidate difficulty adaptation
  assert(computeAdaptiveDifficulty([8.5, 9.0]) === 'advanced', 'Scenario 13: Difficulty adapts to advanced');

  // Test 14: Weak candidate difficulty adaptation
  assert(computeAdaptiveDifficulty([3.5, 3.0]) === 'foundational', 'Scenario 14: Difficulty adapts to foundational');

  // Test 15: Critical competencies -> optional
  const map15 = initializeCompetencyMap(contract1, mockCandidateContext, mockPMJD);
  for (const c of contract1.criticalCompetencies) {
    map15[c].assessmentReliability = 'provisional';
    map15[c].status = 'partial';
    map15[c].questionsAsked = 1;
  }
  const dec15 = interviewBrain.selectNextObjective(contract1, map15, null, [], 600, [6.5], mockCandidateContext);
  assert(dec15.ruleTriggered === 'RULE_5_OPTIONAL_COMPETENCY', 'Scenario 15: Moves to optional');

  // Test 16: Reliable competencies -> closing
  const map16 = initializeCompetencyMap(contract1, mockCandidateContext, mockPMJD);
  for (const c of [...contract1.criticalCompetencies, ...contract1.optionalCompetencies]) {
    map16[c].assessmentReliability = 'reliable';
    map16[c].status = 'assessed';
    map16[c].questionsAsked = 1;
  }
  const dec16 = interviewBrain.selectNextObjective(contract1, map16, null, [], 500, [8.5], mockCandidateContext);
  assert(dec16.ruleTriggered === 'RULE_6_EVIDENCE_COMPLETE_CLOSING', 'Scenario 16: Rule 6 closes without filler');

  // Test 17: <=90 sec -> closing
  const dec17 = interviewBrain.selectNextObjective(contract1, map15, null, [], 75, [7.0], mockCandidateContext);
  assert(dec17.ruleTriggered === 'RULE_1_TIME_EXPIRY', 'Scenario 17: Rule 1 closes at <=90s');

  // Test 18: Zero filler questions
  assert(dec16.nextObjective.questionType === 'closing', 'Scenario 18: No filler questions created');

  // Test 19: Opening objective creation
  const openObj19 = interviewBrain.selectOpeningObjective(contract1, mockCandidateContext, mockPMJD, mockMatchAssessment);
  assert(openObj19.targetCompetency !== undefined, 'Scenario 19: Opening objective created');

  // Test 20: Question 2 generated after Answer 1
  const map20 = initializeCompetencyMap(contract1, mockCandidateContext, mockPMJD);
  const comp20 = contract1.criticalCompetencies[0];
  const strongFeedback: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 8.5,
    answerClassification: 'strong',
    relevanceGate: { status: 'answered', score: 9.0, reason: 'Strong' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 9, structure: 9, clarity: 8, depth: 8, evidence: 9, roleAlignment: 8 },
    whatWorked: ['Demonstrated A/B test lift of 24%'],
    whatHeldYouBack: [],
    tryThisNextTime: { framework: 'Praise', suggestion: 'Maintain clarity', promptToImprove: 'Keep going' },
  };
  const updated20 = updateCompetencyState(map20[comp20], strongFeedback, openObj19, 'I ran 40+ A/B tests and improved conversion by 24%.');
  map20[comp20] = updated20;
  assert(map20[comp20].assessmentReliability === 'reliable', 'Scenario 20: Competency updated to reliable');

  // Test 21: Duplicate question rejected
  const dupCheck = validateQuestion(
    { text: 'How do you prioritize your A/B testing hypotheses when resources are constrained?' },
    [{ id: 'q_1', order: 1, type: 'initial', questionType: 'product_sense', source: 'competency', sourceReference: 'Test', targetCompetency: 'Test', category: 'Test', text: 'How do you prioritize your A/B testing hypotheses when resources are constrained?', intent: 'Test', expectedAnswerCharacteristics: [] }],
    openObj19,
    mockCandidateContext,
    mockPMJD
  );
  assert(dupCheck.isValid === false, 'Scenario 21: Semantic duplicate rejected');

  // Test 22: Metadata leakage rejected
  const leakCheck = validateQuestion(
    { text: 'According to our interview objective and target competency, can you explain your architecture?' },
    [],
    openObj19,
    mockCandidateContext,
    mockPMJD
  );
  assert(leakCheck.isValid === false, 'Scenario 22: Metadata leakage rejected');

  // Test 23: Fallback generation
  const fallback23 = generateFallbackQuestion(openObj19, mockCandidateContext, mockPMJD, 2);
  assert(fallback23.text.length > 20, 'Scenario 23: Fallback generates clean question');

  // Test 24: Resume grounding requires confirmed evidence
  assert(hasConfirmedResumeEvidence('A/B Testing', mockCandidateContext).hasEvidence === true, 'Scenario 24: Confirmed evidence verified');
  assert(hasConfirmedResumeEvidence('Quantum Cryptography Blockchain', mockCandidateContext).hasEvidence === false, 'Scenario 24: Unverified claim rejected');

  // Test 25: Derive resume competencies uses only verified resume data
  const resumeOnlyComps = deriveResumeCompetencies(mockCandidateContext);
  assert(resumeOnlyComps.criticalCompetencies.every((c) => !c.includes('Enterprise Sales Quota')), 'Scenario 25: Zero unverified data');

  // Test 26: State restoration
  const serialized = JSON.stringify({ contract: contract1, map: map6 });
  const restored = JSON.parse(serialized);
  assert(restored.contract.sessionId === 'sess_1', 'Scenario 26: State survives serialization');

  // Test 27: Completed session
  assert(dec17.nextObjective.questionType === 'closing', 'Scenario 27: Session completes at closing');

  // Test 28: Contradictory evidence lowers reliability
  const feedbackContradiction: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 6.0,
    answerClassification: 'unsupported_claim',
    unverifiedClaims: [{ claim: 'Invented Kubernetes', resumeSupport: 'contradicted', note: 'Not on resume' }],
    relevanceGate: { status: 'answered', score: 6.0, reason: 'Answered' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 6, structure: 6, clarity: 6, depth: 4, evidence: 3, roleAlignment: 5 },
    whatWorked: ['Clear tone'],
    whatHeldYouBack: ['Contradicted claim'],
    tryThisNextTime: { framework: 'Honesty', suggestion: 'Honesty', promptToImprove: 'Honesty' },
  };
  const updated28 = updateCompetencyState(map6[comp20], feedbackContradiction, openObj19, 'I single-handedly invented Kubernetes.');
  assert(updated28.assessmentReliability === 'insufficient', 'Scenario 28: Contradiction drops reliability to insufficient');

  // Test 29: "I don't know" is not marked evasive
  const feedbackDontKnow: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 3.0,
    answerClassification: 'not_answered',
    relevanceGate: { status: 'not_answered', score: 3.0, reason: 'Stated lack of experience' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 3, structure: 3, clarity: 5, depth: 1, evidence: 1, roleAlignment: 2 },
    whatWorked: ['Honest response'],
    whatHeldYouBack: ['No experience in domain'],
    tryThisNextTime: { framework: 'Growth', suggestion: 'Growth', promptToImprove: 'Growth' },
  };
  const updated29 = updateCompetencyState(map6[comp20], feedbackDontKnow, openObj19, "I don't know. I haven't worked with that specific tool yet.");
  assert(updated29.status === 'partial' && updated29.confidence === 'none', 'Scenario 29: "I don\'t know" marks partial without penalty');

  // Test 30: Clarification request causes no penalty
  const updated30 = updateCompetencyState(map6[comp20], feedback10, openObj19, 'Could you clarify if you mean consumer mobile or enterprise web?');
  assert(updated30.questionsAsked === map6[comp20].questionsAsked, 'Scenario 30: Clarification causes no penalty');

  // Test 31: Short complete answer reaches reliable status
  const feedback31: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 8.5,
    answerClassification: 'strong',
    relevanceGate: { status: 'answered', score: 9.0, reason: 'Concise and precise' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 9, structure: 9, clarity: 9, depth: 8, evidence: 8, roleAlignment: 9 },
    whatWorked: ['Direct, concise, and gave exact trade-off criteria'],
    whatHeldYouBack: [],
    tryThisNextTime: { framework: 'Praise', suggestion: 'Excellent', promptToImprove: 'Keep going' },
    observedSignals: ['user framing', 'prioritization criteria', 'alternative options', 'trade-off analysis', 'concrete recommendation'],
  };
  const updated31 = updateCompetencyState(map6[comp20], feedback31, {
    targetCompetency: comp20,
    questionType: 'product_sense',
    intent: 'Assess prioritization',
    useResumeGrounding: false,
    difficulty: 'intermediate',
    timeAllocationSeconds: 180,
    isFollowUp: false,
    expectedSignals: ['user framing', 'prioritization criteria', 'trade-off analysis'],
  }, 'We prioritized latency over features because p99 dropped 300ms.');
  assert(updated31.assessmentReliability === 'reliable', 'Scenario 31: Short complete answer reaches reliable');

  // Test 32: Long answer with weak evidence flags missing signals
  const verboseAnswer = 'Well, when we looked at the project we talked to a lot of people and had many meetings with leadership and everyone agreed it was super important to do something and we collaborated widely across many squads for months.';
  const updated32 = updateCompetencyState(map6[comp20], feedback10, {
    targetCompetency: comp20,
    questionType: 'product_sense',
    intent: 'Assess trade-offs',
    useResumeGrounding: false,
    difficulty: 'intermediate',
    timeAllocationSeconds: 180,
    isFollowUp: false,
    expectedSignals: ['trade-off analysis', 'concrete recommendation'],
  }, verboseAnswer);
  assert(updated32.missingSignals.length > 0, 'Scenario 32: Long verbose answer with weak evidence flags missing signals');

  // Test 33: System design expected signals
  const sdSignals = getExpectedSignalsForType('system_design');
  assert(sdSignals.includes('high-level architecture') && sdSignals.includes('component trade-offs'), 'Scenario 33: System design expects architecture and trade-offs');

  // Test 34: Missing metric only matters when metric is expected
  const feedback34: QuestionFeedback = {
    questionId: 'q_1',
    overallScore: 8.0,
    answerClassification: 'strong',
    relevanceGate: { status: 'answered', score: 8.5, reason: 'Great alignment' },
    professionalism: { status: 'acceptable' },
    breakdown: { relevance: 8, structure: 8, clarity: 8, depth: 8, evidence: 8, roleAlignment: 8 },
    whatWorked: ['Excellent explanation of conflict resolution and executive consensus'],
    whatHeldYouBack: [],
    tryThisNextTime: { framework: 'Praise', suggestion: 'Good', promptToImprove: 'Good' },
    observedSignals: ['situation context', 'personal action', 'decision rationale'],
  };
  const updated34 = updateCompetencyState(map6[comp20], feedback34, {
    targetCompetency: comp20,
    questionType: 'behavioral',
    intent: 'Assess executive consensus',
    useResumeGrounding: false,
    difficulty: 'intermediate',
    timeAllocationSeconds: 180,
    isFollowUp: false,
    expectedSignals: ['situation context', 'personal action', 'decision rationale'],
  }, 'I scheduled 1:1 syncs with the VP of Sales and VP of Eng to align on our roadmap milestone.');
  assert(updated34.assessmentReliability === 'reliable', 'Scenario 34: Missing metric does not penalize qualitative behavioral question');

  return { passed, failed };
}

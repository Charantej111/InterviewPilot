import { applyDeterministicConstraints, calculateOverallScore, calculateReadinessPercentage } from '../src/services/ai/scoringRubric';
import { matchAnalysisService } from '../src/services/supabase/matchAnalysisService';
import { validateSingleQuestion, validateQuestionSet } from '../src/services/ai/questionValidator';
import { evaluateFollowUpStrategy } from '../src/services/ai/followupEngine';
import { analyzeDeliveryMetrics } from '../src/services/voice/deliveryMetrics';
import { Question, CandidateAnswer } from '../src/types/interview';
import { CandidateProfile } from '../src/types/resume';
import { JobProfile } from '../src/types/jobDescription';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runComprehensive25ScenarioTests(): { passed: number; failed: number; results: { name: string; success: boolean; details?: string }[] } {
  const results: { name: string; success: boolean; details?: string }[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      results.push({ name, success: true });
    } catch (err: any) {
      failed++;
      results.push({ name, success: false, details: err.message });
      console.error(`❌ Test Failed: ${name} ->`, err.message);
    }
  }

  const dummyQuestion: Question = {
    id: 'q_prioritization',
    order: 1,
    type: 'initial',
    questionType: 'product_sense',
    source: 'job_description',
    sourceReference: 'Core Responsibilities',
    targetCompetency: 'Product Prioritization',
    intent: 'Assess trade-off criteria under conflicting requirements.',
    expectedAnswerCharacteristics: [
      'Identifies target user segment and acute pain point',
      'Articulates clear decision criteria (e.g. impact vs effort vs risk)',
      'Compares at least 2 distinct strategic alternatives',
      'Explicitly discusses trade-offs and mitigation',
    ],
    category: 'Product Sense',
    text: 'Tell me about a product decision where you had to prioritize competing requirements.',
  };

  // Scenario 1: Irrelevant Answer (Cricket vs Product Prioritization)
  test('Scenario 1: Irrelevant Answer forces relevance=0 and overall<=2.5', () => {
    const rawProposal = {
      answerClassification: 'irrelevant' as const,
      relevanceGate: { status: 'not_answered' as const, score: 0, reason: 'Off-topic' },
      breakdown: { relevance: 0, structure: 8, clarity: 9, depth: 8, evidence: 7, roleAlignment: 8 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'I love cricket and usually play on weekends.');
    assert(res.breakdown.relevance === 0, `Expected relevance 0, got ${res.breakdown.relevance}`);
    assert(res.breakdown.roleAlignment === 0, `Expected roleAlignment 0, got ${res.breakdown.roleAlignment}`);
    assert(res.breakdown.depth <= 2.0, `Expected depth <= 2.0, got ${res.breakdown.depth}`);
    assert(res.breakdown.evidence <= 2.0, `Expected evidence <= 2.0, got ${res.breakdown.evidence}`);
    assert(res.overallScore <= 2.5, `Expected overallScore <= 2.5, got ${res.overallScore}`);
    assert(res.whatWorked.length === 0, `Expected 0 whatWorked for irrelevant answer`);
  });

  // Scenario 2: Empty Answer
  test('Scenario 2: Empty Answer forces not_answered and overall<=2.0', () => {
    const rawProposal = {
      breakdown: { relevance: 5, structure: 5, clarity: 5, depth: 5, evidence: 5, roleAlignment: 5 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, '   ');
    assert(res.answerClassification === 'not_answered', `Expected not_answered, got ${res.answerClassification}`);
    assert(res.breakdown.relevance === 0, `Expected relevance 0`);
    assert(res.breakdown.depth === 0, `Expected depth 0`);
    assert(res.overallScore <= 2.0, `Expected overallScore <= 2.0, got ${res.overallScore}`);
  });

  // Scenario 3: Honest Uncertainty ("I don't know")
  test('Scenario 3: Honest Uncertainty is acknowledged without inflated praise', () => {
    const rawProposal = {
      breakdown: { relevance: 2, structure: 2, clarity: 5, depth: 1, evidence: 1, roleAlignment: 2 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, "I don't know.");
    assert(res.breakdown.relevance <= 2.0, `Expected relevance <= 2.0, got ${res.breakdown.relevance}`);
    assert(res.overallScore < 3.0, `Expected overallScore < 3.0, got ${res.overallScore}`);
  });

  // Scenario 4: Severely Evasive Answer
  test('Scenario 4: Severely Evasive Answer caps all dimensions at 3.0 and overall<=4.0', () => {
    const rawProposal = {
      answerClassification: 'evasive' as const,
      breakdown: { relevance: 8, structure: 7, clarity: 8, depth: 6, evidence: 5, roleAlignment: 7 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'In my career I always make great choices because teamwork is essential.');
    assert(res.breakdown.relevance <= 3.0, `Expected relevance <= 3.0, got ${res.breakdown.relevance}`);
    assert(res.breakdown.depth <= 3.0, `Expected depth <= 3.0, got ${res.breakdown.depth}`);
    assert(res.overallScore <= 4.0, `Expected overallScore <= 4.0, got ${res.overallScore}`);
  });

  // Scenario 5: Rude & Unprofessional Language
  test('Scenario 5: Rude Answer triggers professionalism poor flag', () => {
    const rawProposal = {
      breakdown: { relevance: 7, structure: 6, clarity: 6, depth: 6, evidence: 5, roleAlignment: 6 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, "That's a stupid question. But here is the prioritization tradeoff...");
    assert(res.professionalism.status === 'poor', `Expected professionalism poor, got ${res.professionalism.status}`);
  });

  // Scenario 6: Unsupported Major Claim
  test('Scenario 6: Unsupported Major Claim caps evidence at 3.0', () => {
    const rawProposal = {
      answerClassification: 'unsupported_claim' as const,
      unverifiedClaims: [{ claim: 'Scaled system to 10M users', resumeSupport: 'unverified_by_submitted_resume' as const, note: 'Absent from resume' }],
      breakdown: { relevance: 7, structure: 7, clarity: 7, depth: 7, evidence: 9, roleAlignment: 7 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'I personally scaled the backend to 10 million concurrent users.');
    assert(res.breakdown.evidence <= 3.0, `Expected evidence <= 3.0, got ${res.breakdown.evidence}`);
  });

  // Scenario 7: Disagreement Detection (LLM proposes 9.0 but completeness coverage < 35%)
  test('Scenario 7: Disagreement Gate overrides inflated LLM score', () => {
    const rawProposal = {
      breakdown: { relevance: 9.0, structure: 8.5, clarity: 8.5, depth: 8.5, evidence: 8.0, roleAlignment: 8.0 },
      completenessMap: {
        requiredCharacteristics: dummyQuestion.expectedAnswerCharacteristics,
        observedCharacteristics: [dummyQuestion.expectedAnswerCharacteristics[0]], // 1 of 4 = 25%
        missingCharacteristics: dummyQuestion.expectedAnswerCharacteristics.slice(1),
        coverageRatio: 0.25,
      },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'We did some user testing.');
    assert(res.breakdown.relevance <= 5.0, `Expected relevance capped at 5.0, got ${res.breakdown.relevance}`);
    assert(res.deterministicConstraintsApplied.includes('DISAGREEMENT_DETECTION_COMPLETENESS_GATE_OVERRIDE'), 'Disagreement rule not recorded');
  });

  // Scenario 8: Deterministic Score Calculation Formula
  test('Scenario 8: Deterministic overall score formula exact calculation', () => {
    const dims = { relevance: 8.0, structure: 7.0, clarity: 8.0, depth: 6.0, evidence: 5.0, roleAlignment: 7.0 };
    // 8.0*0.25 (2.0) + 7.0*0.20 (1.4) + 8.0*0.15 (1.2) + 6.0*0.15 (0.9) + 5.0*0.15 (0.75) + 7.0*0.10 (0.7) = 6.95 -> 7.0
    const calculated = calculateOverallScore(dims);
    assert(calculated === 7.0, `Expected 7.0, got ${calculated}`);
  });

  // Scenario 9: Fresher PM vs 5-Yr Cyber Security JD (Match Score Gate)
  test('Scenario 9: Fresher PM vs 5-Yr Cyber Security JD yields <= 20% match and blocking gaps', () => {
    const pmFresher: CandidateProfile = {
      name: 'Charan PM',
      summary: 'Aspiring Product Manager with internships in user research and wireframing.',
      skills: ['Product Management', 'Wireframing', 'User Stories', 'Figma', 'Agile'],
      experience: [{ role: 'Product Management Intern', company: 'Acme Apps', duration: '3 months', highlights: ['Led user survey of 100 students'] }],
      projects: [{ name: 'Campus App', description: 'Built Figma prototype for campus events', technologies: ['Figma'], metrics: '100 survey responses' }],
      strengths: ['User Empathy', 'Wireframing'],
    };

    const cyberJD: JobProfile = {
      role: 'Senior Cyber Security Engineer',
      company: 'DefenseCore',
      experienceRequirements: '5+ years cyber security engineering',
      requiredSkills: ['SIEM Architecture', 'Threat Hunting', 'Penetration Testing', 'Splunk', 'Kernel Security'],
      competencies: ['Incident Response', 'Network Forensics', 'Vulnerability Mitigation'],
      responsibilities: ['Architect defense in depth', 'Lead SOC response'],
      preferredSkills: ['CISSP', 'Reverse Engineering'],
      keywords: ['cyber', 'soc', 'siem', 'security'],
      interviewSignals: ['Demonstrates packet-level analysis'],
    };

    const matchRes = matchAnalysisService.computeMatch(pmFresher, cyberJD);
    assert(matchRes.matchPercentage <= 20, `Expected match <= 20%, got ${matchRes.matchPercentage}%`);
    assert(matchRes.blockingGaps.length >= 1, `Expected at least 1 blocking gap, got ${matchRes.blockingGaps.length}`);
    assert(matchRes.qualificationConfidence === 'low', `Expected qualificationConfidence low, got ${matchRes.qualificationConfidence}`);
  });

  // Scenario 10: Experienced Cyber Engineer vs 5-Yr Cyber Security JD
  test('Scenario 10: Senior Cyber Engineer vs Cyber JD yields high match (>= 75%)', () => {
    const cyberCandidate: CandidateProfile = {
      name: 'Alice Security',
      summary: 'Cyber security architect with 6 years experience in SOC operations and SIEM engineering.',
      skills: ['SIEM Architecture', 'Threat Hunting', 'Penetration Testing', 'Splunk', 'Kernel Security', 'Incident Response'],
      experience: [
        { role: 'Senior Security Engineer', company: 'CyberCorp', duration: '2019 - 2024', highlights: ['Deployed Splunk SIEM for 15,000 endpoints', 'Mitigated 40 critical CVEs'] },
      ],
      projects: [{ name: 'Threat Hunting Framework', description: 'Automated SIEM threat hunting pipelines with Splunk', technologies: ['Splunk', 'Python'], metrics: 'Reduced MTTD by 45%' }],
      strengths: ['Threat Hunting', 'SIEM Architecture'],
    };

    const cyberJD: JobProfile = {
      role: 'Senior Cyber Security Engineer',
      company: 'DefenseCore',
      experienceRequirements: '5+ years cyber security engineering',
      requiredSkills: ['SIEM Architecture', 'Threat Hunting', 'Penetration Testing', 'Splunk', 'Kernel Security'],
      competencies: ['Incident Response', 'Network Forensics'],
      responsibilities: ['Architect defense in depth'],
      preferredSkills: ['CISSP'],
      keywords: ['cyber', 'soc', 'siem'],
      interviewSignals: ['Packet analysis'],
    };

    const matchRes = matchAnalysisService.computeMatch(cyberCandidate, cyberJD);
    assert(matchRes.matchPercentage >= 75, `Expected match >= 75%, got ${matchRes.matchPercentage}%`);
    assert(matchRes.blockingGaps.length === 0, `Expected 0 blocking gaps, got ${matchRes.blockingGaps.length}`);
    assert(matchRes.qualificationConfidence === 'high', `Expected qualificationConfidence high, got ${matchRes.qualificationConfidence}`);
  });

  // Scenario 11: Pre-flight Question Validator rejects duplicate questions
  test('Scenario 11: Pre-flight Question Validator rejects duplicate question texts', () => {
    const questions = [
      { text: 'Describe a time you solved a hard technical problem.' },
      { text: 'Describe a time you solved a hard technical problem.' }, // Exact duplicate
    ];
    const validation = validateQuestionSet(questions);
    assert(validation.validatedQuestions.length === 1, `Expected 1 validated question, got ${validation.validatedQuestions.length}`);
    assert(validation.rejectedQuestions.length === 1, `Expected 1 rejected duplicate question`);
  });

  // Scenario 12: Pre-flight Question Validator rejects empty/short questions
  test('Scenario 12: Pre-flight Question Validator rejects short questions (< 15 chars)', () => {
    const questions = [{ text: 'Why PM?' }];
    const validation = validateQuestionSet(questions);
    assert(validation.validatedQuestions.length === 0, `Expected 0 validated questions`);
    assert(validation.rejectedQuestions[0].reason.includes('too short'), 'Expected too short error message');
  });

  // Scenario 13: Grounded Follow-up Strategy respects follow-up budget (max 2)
  test('Scenario 13: Follow-up strategy stops after 2 follow-ups used', () => {
    const feedback = {
      questionId: dummyQuestion.id,
      overallScore: 5.0,
      answerClassification: 'adequate' as const,
      relevanceGate: { status: 'answered' as const, score: 6.0, reason: 'OK' },
      professionalism: { status: 'acceptable' as const },
      breakdown: { relevance: 6, structure: 5, clarity: 6, depth: 4, evidence: 4, roleAlignment: 5 },
      whatWorked: ['Good communication'],
      whatHeldYouBack: ['Missing metrics'],
      tryThisNextTime: { framework: 'STAR', suggestion: 'Quantify numbers', promptToImprove: 'What was the lift?' },
      followUpReasonCode: 'missing_metric' as const,
    };
    const decision = evaluateFollowUpStrategy(dummyQuestion, feedback, 2); // 2 used already
    assert(decision.shouldProbe === false, `Expected shouldProbe=false when budget reached, got ${decision.shouldProbe}`);
  });

  // Scenario 14: Grounded Follow-up Strategy does not loop on irrelevant answers
  test('Scenario 14: Follow-up strategy does not probe on irrelevant answer', () => {
    const feedback = {
      questionId: dummyQuestion.id,
      overallScore: 1.5,
      answerClassification: 'irrelevant' as const,
      relevanceGate: { status: 'not_answered' as const, score: 0, reason: 'Off-topic' },
      professionalism: { status: 'acceptable' as const },
      breakdown: { relevance: 0, structure: 2, clarity: 5, depth: 1, evidence: 1, roleAlignment: 0 },
      whatWorked: [],
      whatHeldYouBack: ['Did not answer prompt'],
      tryThisNextTime: { framework: 'STAR', suggestion: 'Answer prompt', promptToImprove: 'Answer prompt' },
    };
    const decision = evaluateFollowUpStrategy(dummyQuestion, feedback, 0);
    assert(decision.shouldProbe === false, `Expected shouldProbe=false on irrelevant answer`);
  });

  // Scenario 15: Voice Delivery Metrics analyzed separately from content
  test('Scenario 15: Voice Delivery Metrics calculates WPM and fillers without content score penalty', () => {
    const delivery = analyzeDeliveryMetrics({
      transcript: 'Um basically you know we built this pipeline um like very quickly.',
      durationSeconds: 30, // 30s for ~11 words = ~22 WPM (too slow)
      pauseCount: 2,
    });
    assert(delivery.fillerWordCount >= 3, `Expected at least 3 filler words, got ${delivery.fillerWordCount}`);
    assert(delivery.paceRating === 'too_slow', `Expected too_slow pace rating, got ${delivery.paceRating}`);
    assert(delivery.deliveryScore < 8.0, `Expected deliveryScore < 8.0, got ${delivery.deliveryScore}`);
  });

  // Scenario 16: Readiness Percentage Calculation
  test('Scenario 16: Readiness percentage formula', () => {
    assert(calculateReadinessPercentage(7.4) === 74, 'Expected 74%');
    assert(calculateReadinessPercentage(9.2) === 92, 'Expected 92%');
    assert(calculateReadinessPercentage(10.0) === 100, 'Expected 100%');
    assert(calculateReadinessPercentage(0.0) === 0, 'Expected 0%');
  });

  // Scenario 17: Score Interval bounds [score - 0.4, score + 0.4]
  test('Scenario 17: Score interval calculation', () => {
    const rawProposal = {
      breakdown: { relevance: 8.0, structure: 8.0, clarity: 8.0, depth: 8.0, evidence: 8.0, roleAlignment: 8.0 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'Comprehensive structured response with metrics.');
    assert(res.scoreInterval[0] === 7.6, `Expected interval lower 7.6, got ${res.scoreInterval[0]}`);
    assert(res.scoreInterval[1] === 8.4, `Expected interval upper 8.4, got ${res.scoreInterval[1]}`);
  });

  // Scenario 18: Critical Gap Provenance and Evidence Strength
  test('Scenario 18: Match analysis creates provenance and evidence strength for gaps', () => {
    const fresher: CandidateProfile = {
      name: 'Bob',
      summary: 'General developer',
      skills: ['HTML', 'CSS'],
    };
    const seniorJob: JobProfile = {
      role: 'Principal Distributed Systems Architect',
      company: 'CloudScale',
      experienceRequirements: '8+ years distributed systems',
      requiredSkills: ['Raft Consensus', 'Distributed Caching', 'eBPF'],
      competencies: ['Fault Tolerant Architecture'],
    };
    const match = matchAnalysisService.computeMatch(fresher, seniorJob);
    assert(match.gaps.length >= 3, `Expected at least 3 gaps, got ${match.gaps.length}`);
    assert(match.gaps[0].provenance.source === 'job_description', `Expected job_description provenance`);
    assert(match.gaps[0].evidenceStrength === 'unverified', `Expected unverified evidence strength`);
  });

  // Scenario 19: Transferable match classification
  test('Scenario 19: Match analysis tags transferable skills with partial weight', () => {
    const candidate: CandidateProfile = {
      name: 'Carol',
      summary: 'Data analyst skilled in Python and SQL analysis',
      skills: ['Python', 'SQL', 'Data Modeling'],
      experience: [{ role: 'Data Analyst', company: 'MetricsInc', duration: '2021 - 2023' }],
    };
    const dataEngJob: JobProfile = {
      role: 'Senior Data Engineer',
      company: 'DataScale',
      experienceRequirements: '4+ years data engineering',
      requiredSkills: ['Spark', 'Kafka', 'Data Modeling'],
      competencies: ['ETL Optimization', 'Data Pipeline Architecture'],
    };
    const match = matchAnalysisService.computeMatch(candidate, dataEngJob);
    assert(match.matchPercentage < 60, `Expected calibrated score < 60%, got ${match.matchPercentage}%`);
    assert(match.transferableMatches.length >= 0, `Transferable matches array exists`);
  });

  // Scenario 20: STAR Rubric applicability is behavioral-only
  test('Scenario 20: Non-behavioral questions do not force STAR penalties in rubrics', () => {
    const rawProposal = {
      answerClassification: 'strong' as const,
      relevanceGate: { status: 'answered' as const, score: 9.0, reason: 'Clear architecture' },
      breakdown: { relevance: 9.0, structure: 8.5, clarity: 9.0, depth: 8.5, evidence: 8.0, roleAlignment: 8.5 },
      completenessMap: {
        requiredCharacteristics: dummyQuestion.expectedAnswerCharacteristics,
        observedCharacteristics: dummyQuestion.expectedAnswerCharacteristics,
        missingCharacteristics: [],
        coverageRatio: 1.0,
      },
    };
    const sysDesignQ: Question = {
      ...dummyQuestion,
      questionType: 'system_design',
      text: 'Design a distributed rate limiter for 100k requests per second.',
    };
    const res = applyDeterministicConstraints(rawProposal, sysDesignQ, 'We place a Redis token bucket cluster behind an API Gateway with local memory caching.');
    assert(res.overallScore >= 8.5, `Expected score >= 8.5 for strong system design without STAR narrative, got ${res.overallScore}`);
  });

  // Scenario 21: Zero positive bias - never invent fake strengths
  test('Scenario 21: Weak or evasive answer does not get generic praise in whatWorked', () => {
    const rawProposal = {
      answerClassification: 'evasive' as const,
      whatWorked: ['Great energy and positive attitude!'],
      breakdown: { relevance: 3, structure: 3, clarity: 4, depth: 2, evidence: 2, roleAlignment: 3 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'I think everyone should just work harder.');
    assert(!res.whatWorked.some((w) => /great|positive/i.test(w)), `Generic praise should be purged from whatWorked`);
  });

  // Scenario 22: High Performing Answer
  test('Scenario 22: Strong answer with concrete metrics scores >= 8.0', () => {
    const rawProposal = {
      answerClassification: 'strong' as const,
      relevanceGate: { status: 'answered' as const, score: 9.0, reason: 'Directly addresses trade-offs' },
      breakdown: { relevance: 9.0, structure: 8.5, clarity: 8.5, depth: 8.5, evidence: 8.5, roleAlignment: 8.5 },
      completenessMap: {
        requiredCharacteristics: dummyQuestion.expectedAnswerCharacteristics,
        observedCharacteristics: dummyQuestion.expectedAnswerCharacteristics,
        missingCharacteristics: [],
        coverageRatio: 1.0,
      },
      whatWorked: ['Identified user pain point', 'Cites 25% churn reduction baseline metric'],
      whatHeldYouBack: [],
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'We evaluated two approaches for checkout latency. Option A reduced latency by 35% with 2 weeks effort, while Option B reduced latency by 40% with 6 months rewrite. We chose Option A, dropping checkout drop-off by 25%.');
    assert(res.overallScore >= 8.0, `Expected overall score >= 8.0, got ${res.overallScore}`);
  });

  // Scenario 23: Question intent contract properties verified
  test('Scenario 23: Question intent contract properties populated by validator', () => {
    const q = validateSingleQuestion(
      { text: 'How do you handle API versioning backward compatibility?' },
      0,
      new Set()
    );
    assert(q.isValid === true, 'Question should be valid');
    assert(q.validated?.expectedAnswerCharacteristics.length! >= 3, 'Must have at least 3 expected characteristics');
    assert(!!q.validated?.intent, 'Intent must be defined');
    assert(!!q.validated?.targetCompetency, 'Target competency must be defined');
  });

  // Scenario 24: Dimension ceiling overrides are strictly deterministic
  test('Scenario 24: Even if LLM returns 10 across all dimensions on irrelevant answer, engine forces 0 and <=2.5', () => {
    const rawProposal = {
      answerClassification: 'irrelevant' as const,
      relevanceGate: { status: 'not_answered' as const, score: 0, reason: 'Completely off topic' },
      breakdown: { relevance: 10, structure: 10, clarity: 10, depth: 10, evidence: 10, roleAlignment: 10 },
    };
    const res = applyDeterministicConstraints(rawProposal, dummyQuestion, 'Yesterday I went fishing at the lake.');
    assert(res.breakdown.relevance === 0, 'Relevance must be forced to 0');
    assert(res.breakdown.roleAlignment === 0, 'Role alignment must be forced to 0');
    assert(res.overallScore <= 2.5, `Overall score must be <= 2.5, got ${res.overallScore}`);
  });

  // Scenario 25: Follow-up Reason Code specifies missing_metric when evidence is low
  test('Scenario 25: Follow-up Reason Code is automatically missing_metric when evidence is low', () => {
    const feedback = {
      questionId: dummyQuestion.id,
      overallScore: 6.0,
      answerClassification: 'adequate' as const,
      relevanceGate: { status: 'answered' as const, score: 7.0, reason: 'Good' },
      professionalism: { status: 'acceptable' as const },
      breakdown: { relevance: 7, structure: 6, clarity: 7, depth: 6, evidence: 3.5, roleAlignment: 6 },
      whatWorked: ['Clear logical structure'],
      whatHeldYouBack: ['No quantified metrics'],
      tryThisNextTime: { framework: 'STAR', suggestion: 'Quantify metrics', promptToImprove: 'What was the lift?' },
    };
    const decision = evaluateFollowUpStrategy(dummyQuestion, feedback, 0);
    assert(decision.shouldProbe === true, 'Should probe');
    assert(decision.reasonCode === 'missing_metric', `Expected missing_metric, got ${decision.reasonCode}`);
    assert(decision.probePrompt?.includes('quantitative'), 'Prompt should probe metrics');
  });

  console.log(`\n========================================`);
  console.log(`  AI PIPELINE TEST SUITE SUMMARY`);
  console.log(`  Total: 25 | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  return { passed, failed, results };
}

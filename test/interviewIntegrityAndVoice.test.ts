import { computeMatchAssessment, computeMatchState, buildLegacyMatchResult, verifyMatchIntegrity } from '../src/services/ai/matchEngine';
import { validateJDEvidenceModel, computeJDHash } from '../src/services/ai/jdValidator';
import { LockedCandidateContext, CandidateEvidenceModel } from '../src/types/resume';
import { JDEvidenceModel } from '../src/types/jobDescription';

// ─── Test Fixture Generators ──────────────────────────────────────────────────

export function createPMMockCandidate(): LockedCandidateContext {
  const model: CandidateEvidenceModel = {
    identity: {
      name: { value: 'Priya Sharma', sourceText: 'Priya Sharma', confidence: 'high', sourceLocation: { section: 'HEADER' } },
      email: { value: 'priya@example.com', sourceText: 'priya@example.com', confidence: 'high', sourceLocation: { section: 'HEADER' } },
      phone: null,
      role: { value: 'Associate Product Manager', sourceText: 'Associate Product Manager', confidence: 'high', sourceLocation: { section: 'HEADER' } },
    },
    workExperience: [
      {
        company: { value: 'FinTech Stream', sourceText: 'FinTech Stream', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        role: { value: 'Associate Product Manager', sourceText: 'Associate Product Manager', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        startDate: null,
        endDate: null,
        bullets: [
          { value: 'Authored PRDs for payment checkout redesign boosting conversion by 14%', sourceText: 'Authored PRDs for payment checkout redesign boosting conversion by 14%', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          { value: 'Led sprint planning and agile grooming across 8 engineers and 2 UX designers', sourceText: 'Led sprint planning and agile grooming across 8 engineers and 2 UX designers', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          { value: 'Conducted 25+ customer discovery interviews to define quarterly roadmap', sourceText: 'Conducted 25+ customer discovery interviews to define quarterly roadmap', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        ],
      },
    ],
    projects: [
      {
        name: { value: 'SaaS Churn Analytics Dashboard', sourceText: 'SaaS Churn Analytics Dashboard', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        problem: { value: 'High customer churn in self-serve tier', sourceText: 'High customer churn in self-serve tier', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        contribution: { value: 'Designed metrics framework and SQL cohort models', sourceText: 'Designed metrics framework and SQL cohort models', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        technologies: [
          { value: 'SQL', sourceText: 'SQL', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
          { value: 'Mixpanel', sourceText: 'Mixpanel', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
          { value: 'Figma', sourceText: 'Figma', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        ],
        outcomes: [
          { value: 'Decreased 30-day churn by 18%', sourceText: 'Decreased 30-day churn by 18%', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        ],
      },
    ],
    education: [
      {
        institution: { value: 'National Institute of Technology', sourceText: 'National Institute of Technology', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
        degree: { value: 'B.Tech in Computer Science', sourceText: 'B.Tech in Computer Science', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
        year: { value: '2023', sourceText: '2023', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
      },
    ],
    skills: {
      technical: [
        { value: 'SQL', sourceText: 'SQL', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'A/B Testing', sourceText: 'A/B Testing', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
      ],
      product: [
        { value: 'Product Management', sourceText: 'Product Management', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'Roadmap Prioritization', sourceText: 'Roadmap Prioritization', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'Stakeholder Management', sourceText: 'Stakeholder Management', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'User Research', sourceText: 'User Research', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
      ],
      domain: [
        { value: 'Fintech Payments', sourceText: 'Fintech Payments', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
      ],
    },
    certifications: [],
    achievements: [],
    unclear: [],
  };

  return {
    sessionId: 'ses_pm_priya_101',
    lockedAt: new Date().toISOString(),
    evidenceModel: model,
    derivedProfile: {
      name: 'Priya Sharma',
      role: 'Associate Product Manager',
      yearsOfExperience: 2,
      skills: ['Product Management', 'Roadmap Prioritization', 'SQL', 'A/B Testing', 'Stakeholder Management'],
      projects: [{ name: 'SaaS Churn Analytics Dashboard', description: 'Metrics & cohort model', technologies: ['SQL', 'Mixpanel'] }],
      experience: [{ role: 'Associate Product Manager', company: 'FinTech Stream', duration: '2023 - Present' }],
      education: [{ degree: 'B.Tech in Computer Science', institution: 'NIT', year: '2023' }],
    },
  };
}

export function createSWEMockCandidate(): LockedCandidateContext {
  const model: CandidateEvidenceModel = {
    identity: {
      name: { value: 'Alex Chen', sourceText: 'Alex Chen', confidence: 'high', sourceLocation: { section: 'HEADER' } },
      email: { value: 'alex@example.com', sourceText: 'alex@example.com', confidence: 'high', sourceLocation: { section: 'HEADER' } },
      phone: null,
      role: { value: 'Senior Software Engineer', sourceText: 'Senior Software Engineer', confidence: 'high', sourceLocation: { section: 'HEADER' } },
    },
    workExperience: [
      {
        company: { value: 'CloudScale Inc', sourceText: 'CloudScale Inc', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        role: { value: 'Senior Backend Engineer', sourceText: 'Senior Backend Engineer', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        startDate: null,
        endDate: null,
        bullets: [
          { value: 'Designed distributed event-streaming microservices handling 50k RPS with Go and Kafka', sourceText: 'Designed distributed event-streaming microservices handling 50k RPS with Go and Kafka', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          { value: 'Optimized PostgreSQL queries reducing p99 database latency from 420ms to 45ms', sourceText: 'Optimized PostgreSQL queries reducing p99 database latency from 420ms to 45ms', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
          { value: 'Architected Kubernetes deployment topologies on AWS EKS with zero-downtime rollouts', sourceText: 'Architected Kubernetes deployment topologies on AWS EKS with zero-downtime rollouts', confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
        ],
      },
    ],
    projects: [
      {
        name: { value: 'Distributed Key-Value Store', sourceText: 'Distributed Key-Value Store', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        problem: { value: 'Raft consensus replication under network partitions', sourceText: 'Raft consensus replication under network partitions', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        contribution: { value: 'Implemented Raft log replication and leader election in Go', sourceText: 'Implemented Raft log replication and leader election in Go', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        technologies: [
          { value: 'Go', sourceText: 'Go', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
          { value: 'gRPC', sourceText: 'gRPC', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
          { value: 'Docker', sourceText: 'Docker', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        ],
        outcomes: [
          { value: 'Validated 99.999% consistency across Jepsen partition tests', sourceText: 'Validated 99.999% consistency across Jepsen partition tests', confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
        ],
      },
    ],
    education: [
      {
        institution: { value: 'University of Washington', sourceText: 'University of Washington', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
        degree: { value: 'B.S. in Computer Engineering', sourceText: 'B.S. in Computer Engineering', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
        year: { value: '2020', sourceText: '2020', confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
      },
    ],
    skills: {
      technical: [
        { value: 'Go', sourceText: 'Go', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'Distributed Systems', sourceText: 'Distributed Systems', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'PostgreSQL', sourceText: 'PostgreSQL', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'Kubernetes', sourceText: 'Kubernetes', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
        { value: 'System Design', sourceText: 'System Design', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
      ],
      product: [],
      domain: [
        { value: 'Cloud Infrastructure', sourceText: 'Cloud Infrastructure', confidence: 'high', sourceLocation: { section: 'SKILLS' } },
      ],
    },
    certifications: [],
    achievements: [],
    unclear: [],
  };

  return {
    sessionId: 'ses_swe_alex_202',
    lockedAt: new Date().toISOString(),
    evidenceModel: model,
    derivedProfile: {
      name: 'Alex Chen',
      role: 'Senior Software Engineer',
      yearsOfExperience: 5,
      skills: ['Go', 'Distributed Systems', 'PostgreSQL', 'Kubernetes', 'System Design'],
      projects: [{ name: 'Distributed Key-Value Store', description: 'Raft consensus in Go', technologies: ['Go', 'gRPC'] }],
      experience: [{ role: 'Senior Backend Engineer', company: 'CloudScale Inc', duration: '2020 - Present' }],
      education: [{ degree: 'B.S. in Computer Engineering', institution: 'UW', year: '2020' }],
    },
  };
}

export function createCybersecurityJD(): JDEvidenceModel {
  const rawText = `
Role: Senior Cyber Security Engineer
Company: CyberDefense Dynamics
Requirements:
- Must have 5+ years experience in SIEM Architecture and Splunk deployment.
- Must possess deep hands-on expertise in Threat Hunting, Packet Forensics, and SOC Incident Response.
- Required: Kernel security exploit mitigation and penetration testing.
- Must hold active CISSP or OSCP certification.
- Lead cross-functional CSIRT response during active malware intrusions.
- Nice to have: Reverse engineering with Ghidra or IDA Pro.
`;

  const validated = validateJDEvidenceModel(
    {
      role: 'Senior Cyber Security Engineer',
      company: 'CyberDefense Dynamics',
      seniority: 'senior',
      requiredSkills: [
        {
          id: 'req_siem',
          requirement: 'SIEM Architecture and Splunk deployment',
          sourceText: 'Must have 5+ years experience in SIEM Architecture and Splunk deployment.',
          category: 'technical',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
        {
          id: 'req_hunting',
          requirement: 'Threat Hunting and Packet Forensics',
          sourceText: 'Must possess deep hands-on expertise in Threat Hunting, Packet Forensics, and SOC Incident Response.',
          category: 'technical',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
        {
          id: 'req_kernel',
          requirement: 'Kernel security exploit mitigation and penetration testing',
          sourceText: 'Required: Kernel security exploit mitigation and penetration testing.',
          category: 'technical',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      preferredSkills: [
        {
          id: 'pref_reverse',
          requirement: 'Reverse engineering with Ghidra or IDA Pro',
          sourceText: 'Nice to have: Reverse engineering with Ghidra or IDA Pro.',
          category: 'skill',
          strength: 'preferred',
          critical: false,
          confidence: 'high',
        },
      ],
      responsibilities: [
        {
          id: 'resp_csirt',
          requirement: 'Lead cross-functional CSIRT response during active malware intrusions',
          sourceText: 'Lead cross-functional CSIRT response during active malware intrusions.',
          category: 'responsibility',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      competencies: [
        {
          id: 'comp_incident',
          requirement: 'Incident Response and Network Forensics',
          sourceText: 'SOC Incident Response and network forensics under active threats.',
          category: 'competency',
          strength: 'explicit',
          critical: false,
          confidence: 'high',
        },
      ],
      technicalRequirements: [],
      domainKnowledge: [
        {
          id: 'dom_cyber',
          requirement: 'Cybersecurity Operations and Threat Intelligence',
          sourceText: 'Hands-on expertise in Threat Hunting, Packet Forensics, and SOC Incident Response.',
          category: 'domain',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      behavioralSignals: [],
      experienceRequirements: [
        {
          id: 'exp_5yr',
          requirement: '5+ years experience in cybersecurity engineering',
          sourceText: 'Must have 5+ years experience in SIEM Architecture and Splunk deployment.',
          category: 'experience',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      educationRequirements: [],
      certificationRequirements: [
        {
          id: 'cert_cissp',
          requirement: 'Active CISSP or OSCP certification',
          sourceText: 'Must hold active CISSP or OSCP certification.',
          category: 'certification',
          strength: 'explicit',
          critical: false,
          confidence: 'high',
        },
      ],
      hiringSignals: ['Demonstrates deep kernel packet mitigation under active breach'],
    },
    rawText,
    'Senior Cyber Security Engineer',
    'CyberDefense Dynamics'
  );

  return validated.jdModel;
}

export function createPMJobDescription(): JDEvidenceModel {
  const rawText = `
Role: Senior Product Manager
Company: Stripe
Requirements:
- Must have proven experience in Product Management and Roadmap Prioritization.
- Must have strong track record in User Research, customer discovery, and authoring PRDs.
- Experience with A/B testing methodologies and SQL data analytics.
- Proven leadership in Stakeholder Management across engineering and design teams.
- Nice to have: Background in Fintech payments or SaaS platforms.
`;

  const validated = validateJDEvidenceModel(
    {
      role: 'Senior Product Manager',
      company: 'Stripe',
      seniority: 'senior',
      requiredSkills: [
        {
          id: 'req_pm',
          requirement: 'Product Management and Roadmap Prioritization',
          sourceText: 'Must have proven experience in Product Management and Roadmap Prioritization.',
          category: 'skill',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
        {
          id: 'req_user_res',
          requirement: 'User Research and PRD authoring',
          sourceText: 'Must have strong track record in User Research, customer discovery, and authoring PRDs.',
          category: 'skill',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
        {
          id: 'req_analytics',
          requirement: 'A/B testing and SQL data analytics',
          sourceText: 'Experience with A/B testing methodologies and SQL data analytics.',
          category: 'technical',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      preferredSkills: [
        {
          id: 'pref_fintech',
          requirement: 'Fintech payments or SaaS platforms experience',
          sourceText: 'Nice to have: Background in Fintech payments or SaaS platforms.',
          category: 'domain',
          strength: 'preferred',
          critical: false,
          confidence: 'high',
        },
      ],
      responsibilities: [
        {
          id: 'resp_stakeholder',
          requirement: 'Lead stakeholder management across engineering and UX design',
          sourceText: 'Proven leadership in Stakeholder Management across engineering and design teams.',
          category: 'responsibility',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      competencies: [
        {
          id: 'comp_prioritization',
          requirement: 'Roadmap Prioritization and Product Strategy',
          sourceText: 'Must have proven experience in Product Management and Roadmap Prioritization.',
          category: 'competency',
          strength: 'explicit',
          critical: true,
          confidence: 'high',
        },
      ],
      technicalRequirements: [],
      domainKnowledge: [],
      behavioralSignals: [],
      experienceRequirements: [],
      educationRequirements: [],
      certificationRequirements: [],
      hiringSignals: ['Demonstrates crisp metric attribution and first-principles trade-offs'],
    },
    rawText,
    'Senior Product Manager',
    'Stripe'
  );

  return validated.jdModel;
}

// ─── Test Suite Execution ─────────────────────────────────────────────────────

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

  const pmCandidate = createPMMockCandidate();
  const sweCandidate = createSWEMockCandidate();
  const cyberJD = createCybersecurityJD();
  const pmJD = createPMJobDescription();

  // ----------------------------------------------------
  // TEST GROUP 1: FINAL ACCEPTANCE TEST — PM Candidate + Cyber JD
  // ----------------------------------------------------
  console.log('\n--- Test Group 1: PM Candidate vs Cybersecurity JD (Mismatch Hardness) ---');

  const cyberAssessment = computeMatchAssessment(pmCandidate, cyberJD);
  assert(cyberAssessment !== null, 'Match assessment runs without throwing');
  assert(cyberAssessment!.overallMatchPercent < 25, `Expected low match (<25%), got ${cyberAssessment!.overallMatchPercent}%`);
  assert(cyberAssessment!.verdict === 'low' || cyberAssessment!.verdict === 'mismatched', `Expected verdict low/mismatched, got ${cyberAssessment!.verdict}`);

  // Invariant: Missing core cyber requirements
  const missingReqs = cyberAssessment!.missingRequirements.map((m) => m.jdRequirement.requirement.toLowerCase());
  assert(missingReqs.some((r) => r.includes('siem')), 'SIEM Architecture is marked missing');
  assert(missingReqs.some((r) => r.includes('kernel')), 'Kernel security is marked missing');
  assert(missingReqs.some((r) => r.includes('hunting')), 'Threat Hunting is marked missing');

  // Invariant: Zero fabricated cyber evidence
  for (const match of cyberAssessment!.directMatches) {
    assert(!match.jdRequirement.requirement.toLowerCase().includes('kernel'), 'Kernel security is NOT direct match');
    assert(!match.jdRequirement.requirement.toLowerCase().includes('siem'), 'SIEM is NOT direct match');
  }

  // Invariant: Every match references real sourceText
  for (const match of cyberAssessment!.requirementMatches) {
    assert(Boolean(match.jdRequirement.sourceText), `JD requirement ${match.jdRequirement.requirement} has valid sourceText`);
    if (match.candidateEvidence) {
      assert(Boolean(match.candidateEvidence.sourceText), `Candidate evidence has valid sourceText quote`);
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Zero-JD Behavior & State Machine
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: Zero-JD State Invariant (Strict Null, No 83%) ---');

  const zeroJdAssessment = computeMatchAssessment(pmCandidate, null);
  assert(zeroJdAssessment === null, 'computeMatchAssessment returns null when JD is null');

  const zeroJdState = computeMatchState(pmCandidate, null);
  assert(zeroJdState.status === 'not_ready', 'computeMatchState returns status="not_ready"');
  assert(zeroJdState.overallMatchPercent === null, 'computeMatchState overallMatchPercent is strictly null (no 83%, no 0%)');
  assert(zeroJdState.reason === 'JOB_DESCRIPTION_REQUIRED', 'computeMatchState reason is JOB_DESCRIPTION_REQUIRED');

  // ----------------------------------------------------
  // TEST GROUP 3: PM Candidate + PM JD (Strong Grounded Fit)
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: PM Candidate vs PM JD (Grounded Alignment) ---');

  const pmAssessment = computeMatchAssessment(pmCandidate, pmJD);
  assert(pmAssessment !== null, 'computeMatchAssessment succeeds with valid PM JD');
  assert(pmAssessment!.overallMatchPercent >= 65, `Expected strong match (>=65%), got ${pmAssessment!.overallMatchPercent}%`);
  assert(pmAssessment!.directMatches.length >= 2, `Expected >= 2 direct matches, got ${pmAssessment!.directMatches.length}`);
  assert(pmAssessment!.verdict === 'strong', `Expected verdict strong, got ${pmAssessment!.verdict}`);

  // Invariant: Score trace mathematical reproducibility
  let manualEarned = 0;
  let manualPossible = 0;
  for (const match of pmAssessment!.requirementMatches) {
    manualEarned += match.scoreTrace.earnedPoints;
    manualPossible += match.scoreTrace.possiblePoints;
  }
  const calculatedPercent = Math.round((manualEarned / manualPossible) * 100);
  assert(
    Math.abs(pmAssessment!.overallMatchPercent - calculatedPercent) <= 1,
    `Score trace matches overall percentage (${pmAssessment!.overallMatchPercent}% vs ${calculatedPercent}%)`
  );

  // ----------------------------------------------------
  // TEST GROUP 4: SWE Candidate + Cyber JD vs PM Candidate
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: SWE Candidate Multi-Persona Test ---');

  const sweCyberAssessment = computeMatchAssessment(sweCandidate, cyberJD);
  assert(sweCyberAssessment !== null, 'SWE vs Cyber JD runs');
  // SWE has distributed systems and Linux/Go background, should have transferable but still missing pure SOC SIEM
  assert(sweCyberAssessment!.missingRequirements.length >= 2, 'SWE is missing SOC SIEM and Kernel exploit specific tools');

  // ----------------------------------------------------
  // TEST GROUP 5: Version Tracking & Match Invalidation
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: Version Tracking & Hash Invalidation ---');

  const initialHash = computeJDHash('PM JD text', 'Senior Product Manager', 'Stripe');
  const validState = computeMatchState(pmCandidate, pmJD, pmCandidate.sessionId, initialHash);
  assert(validState.status === 'ready', 'Match state is ready with matching IDs');

  // Candidate swap test: expected resume ID mismatch
  const staleResumeState = computeMatchState(pmCandidate, pmJD, 'ses_other_resume_999', initialHash);
  assert(staleResumeState.status === 'not_ready', 'Stale resume ID rejected by integrity gate');
  assert(staleResumeState.overallMatchPercent === null, 'Stale resume overallMatchPercent is null');

  // JD hash computation changes when text changes
  const modifiedHash = computeJDHash('Completely different JD text', 'Senior Product Manager', 'Stripe');
  assert(initialHash !== modifiedHash, 'JD content hash changes when text changes');

  // ----------------------------------------------------
  // TEST GROUP 6: Match Input Integrity Gate Rejection
  // ----------------------------------------------------
  console.log('\n--- Test Group 6: Input Integrity Gate Rejections ---');

  const nullCandGate = verifyMatchIntegrity(null, pmJD);
  assert(nullCandGate.valid === false && nullCandGate.reason === 'RESUME_REQUIRED', 'Rejects missing candidate context');

  const nullJdGate = verifyMatchIntegrity(pmCandidate, null);
  assert(nullJdGate.valid === false && nullJdGate.reason === 'JOB_DESCRIPTION_REQUIRED', 'Rejects missing JD model');

  const emptyReqJd: JDEvidenceModel = {
    ...pmJD,
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    competencies: [],
    technicalRequirements: [],
    domainKnowledge: [],
    experienceRequirements: [],
    educationRequirements: [],
    certificationRequirements: [],
    behavioralSignals: [],
  };
  const emptyJdGate = verifyMatchIntegrity(pmCandidate, emptyReqJd);
  assert(emptyJdGate.valid === false, 'Rejects empty requirement JD');

  return { passed, failed };
}

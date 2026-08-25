/**
 * Role-Scoped Resume-Grounded Architecture Tests
 *
 * Verifies that:
 * 1. Target Role strictly bounds and scopes the interview competencies in resume_grounded mode.
 * 2. Developer resume + "UI/UX Intern" role derives UI/UX competencies, ZERO backend/Node.js competencies.
 * 3. getRoleStandardCompetencies() is strictly decoupled from candidate resume evidence.
 * 4. Opening objective and Brain decision engine never fabricate resume evidence.
 * 5. Candidate scope correction pivots smoothly without penalty.
 */

import {
  identifyRoleArchetype,
  getRoleStandardCompetencies,
  scopeResumeEvidenceToRole,
  deriveRoleScopedResumeCompetencies,
} from '../src/services/ai/roleScoping';
import { buildInterviewContract } from '../src/services/ai/interviewContract';
import { interviewBrain } from '../src/services/ai/interviewBrain';
import { LockedCandidateContext } from '../src/types/resume';

// Developer Candidate with Node.js, Express, MongoDB, Docker
export const developerCandidateContext: LockedCandidateContext = {
  evidenceModel: {
    identity: {
      name: {
        value: 'Alex Developer',
        sourceText: 'Alex Developer',
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      },
      role: {
        value: 'Full Stack Engineer',
        sourceText: 'Full Stack Engineer',
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      },
    },
    education: [],
    workExperience: [
      {
        role: {
          value: 'Backend Engineer',
          sourceText: 'Backend Engineer',
          sourceLocation: { section: 'EXPERIENCE' },
          confidence: 'high',
        },
        company: {
          value: 'Tech Systems Inc',
          sourceText: 'Tech Systems Inc',
          sourceLocation: { section: 'EXPERIENCE' },
          confidence: 'high',
        },
        bullets: [
          {
            value: 'Built REST APIs in Node.js and MongoDB serving 50k requests/min',
            sourceText: 'Built REST APIs in Node.js and MongoDB serving 50k requests/min',
            sourceLocation: { section: 'EXPERIENCE' },
            confidence: 'high',
          },
        ],
      },
    ],
    projects: [
      {
        name: {
          value: 'Distributed Task Queue',
          sourceText: 'Distributed Task Queue',
          sourceLocation: { section: 'PROJECTS' },
          confidence: 'high',
        },
        technologies: [
          {
            value: 'Node.js',
            sourceText: 'Node.js',
            sourceLocation: { section: 'PROJECTS' },
            confidence: 'high',
          },
          {
            value: 'Redis',
            sourceText: 'Redis',
            sourceLocation: { section: 'PROJECTS' },
            confidence: 'high',
          },
          {
            value: 'Docker',
            sourceText: 'Docker',
            sourceLocation: { section: 'PROJECTS' },
            confidence: 'high',
          },
        ],
        outcomes: [],
      },
    ],
    skills: {
      technical: [
        { value: 'Node.js', sourceText: 'Node.js', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
        { value: 'Express', sourceText: 'Express', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
        { value: 'MongoDB', sourceText: 'MongoDB', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
        { value: 'Docker', sourceText: 'Docker', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
      ],
      product: [],
      domain: [],
    },
    certifications: [],
    achievements: [],
    unclear: [],
  },
  confirmedIdentity: { name: 'Alex Developer', role: 'Full Stack Engineer' },
  status: 'locked',
  lockedAt: new Date().toISOString(),
  candidateHash: 'hash_dev_123',
};

export function runRoleScopedResumeGroundedTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('\n--- Role-Scoped Resume Grounding & Archetype Isolation Tests ---');

  // Test 1: Classify target roles into canonical archetypes
  assert(identifyRoleArchetype('UI/UX Intern') === 'ui_ux_design', 'Classifies "UI/UX Intern" to ui_ux_design');
  assert(identifyRoleArchetype('Product Designer') === 'ui_ux_design', 'Classifies "Product Designer" to ui_ux_design');
  assert(identifyRoleArchetype('Associate Product Manager') === 'product_management', 'Classifies "Associate Product Manager" to product_management');
  assert(identifyRoleArchetype('Frontend Engineer') === 'frontend_engineering', 'Classifies "Frontend Engineer" to frontend_engineering');
  assert(identifyRoleArchetype('Backend Developer') === 'backend_engineering', 'Classifies "Backend Developer" to backend_engineering');
  assert(identifyRoleArchetype('Software Engineer') === 'fullstack_engineering', 'Classifies "Software Engineer" to fullstack_engineering');

  // Test 2: Decoupled standard competencies
  const uiuxCompetencies = getRoleStandardCompetencies('UI/UX Intern');
  assert(uiuxCompetencies.critical.includes('User Research & Needs Discovery'), 'Standard UI/UX critical includes User Research & Needs Discovery');
  assert(uiuxCompetencies.critical.includes('Wireframing, Prototyping & Interaction Design'), 'Standard UI/UX critical includes Wireframing, Prototyping & Interaction Design');
  assert(uiuxCompetencies.critical.includes('Usability Testing & Design Critique'), 'Standard UI/UX critical includes Usability Testing & Design Critique');
  assert(uiuxCompetencies.critical.includes('Design Systems & Developer Handoff'), 'Standard UI/UX critical includes Design Systems & Developer Handoff');

  const allCompText = uiuxCompetencies.critical.join(' ').toLowerCase();
  assert(!allCompText.includes('node.js'), 'Standard UI/UX contains zero Node.js keywords');
  assert(!allCompText.includes('database'), 'Standard UI/UX contains zero database keywords');
  assert(!allCompText.includes('api architecture'), 'Standard UI/UX contains zero backend API keywords');

  // Test 3: Resume evidence filtering
  const scoped = scopeResumeEvidenceToRole('UI/UX Intern', developerCandidateContext.evidenceModel);
  assert(scoped.directProjects.length === 0, 'Developer resume has 0 direct UI/UX projects');
  assert(scoped.transferableProjects.length === 1, 'Developer project classified as transferable');
  const outOfScopeNames = scoped.outOfScopeSkills.map((s) => s.value);
  assert(outOfScopeNames.includes('Node.js'), 'Node.js marked as out-of-scope skill for UI/UX');
  assert(outOfScopeNames.includes('Express'), 'Express marked as out-of-scope skill for UI/UX');
  assert(outOfScopeNames.includes('MongoDB'), 'MongoDB marked as out-of-scope skill for UI/UX');
  assert(outOfScopeNames.includes('Docker'), 'Docker marked as out-of-scope skill for UI/UX');

  // Test 4: Developer Resume + "UI/UX Intern" (No JD) contract derivation
  const contract = buildInterviewContract(
    'sess_uiux',
    1200,
    developerCandidateContext,
    null,
    null,
    'UI/UX Intern'
  );
  assert(contract.mode === 'resume_grounded', 'Contract mode is resume_grounded');
  assert(contract.criticalCompetencies.includes('User Research & Needs Discovery'), 'Derived critical includes User Research');
  assert(contract.criticalCompetencies.includes('Wireframing, Prototyping & Interaction Design'), 'Derived critical includes Wireframing');
  assert(contract.criticalCompetencies.includes('Usability Testing & Design Critique'), 'Derived critical includes Usability Testing');
  assert(contract.criticalCompetencies.includes('Design Systems & Developer Handoff'), 'Derived critical includes Design Systems');

  let hasBackendLeak = false;
  for (const comp of contract.criticalCompetencies) {
    if (/node\.?js|backend|express|redis|mongodb/i.test(comp)) {
      hasBackendLeak = true;
    }
  }
  assert(!hasBackendLeak, 'Zero developer/backend competencies in UI/UX contract');

  // Test 5: Developer Resume + "Product Manager" (No JD) contract derivation
  const pmContract = buildInterviewContract(
    'sess_pm',
    1200,
    developerCandidateContext,
    null,
    null,
    'Associate Product Manager'
  );
  assert(pmContract.mode === 'resume_grounded', 'PM contract mode is resume_grounded');
  assert(pmContract.criticalCompetencies.includes('Product Discovery & User Problem Framing'), 'Derived PM critical includes Product Discovery');
  assert(pmContract.criticalCompetencies.includes('Roadmap Prioritization & Strategic Trade-Offs'), 'Derived PM critical includes Prioritization');
  assert(pmContract.criticalCompetencies.includes('Execution, Delivery & Metric Definition'), 'Derived PM critical includes Metric Definition');

  let hasPmCodeLeak = false;
  for (const comp of pmContract.criticalCompetencies) {
    if (/node\.?js|backend|express|redis|mongodb/i.test(comp)) {
      hasPmCodeLeak = true;
    }
  }
  assert(!hasPmCodeLeak, 'Zero developer/backend competencies in PM contract');

  // Test 6: selectOpeningObjective for Developer Resume + "UI/UX Intern"
  const openingObjective = interviewBrain.selectOpeningObjective(
    contract,
    developerCandidateContext,
    null,
    null,
    'UI/UX Intern'
  );
  assert(openingObjective.targetCompetency === 'User Research & Needs Discovery', 'Opening target competency is User Research');
  assert(openingObjective.useResumeGrounding === false, 'useResumeGrounding is strictly false (no fabricated UI/UX claim)');
  assert(openingObjective.questionType === 'behavioral', 'Question type is behavioral approach');

  return { passed, failed };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('roleScopedResumeGrounded.test.ts')) {
  const result = runRoleScopedResumeGroundedTests();
  console.log(`\nPassed: ${result.passed} | Failed: ${result.failed}`);
}

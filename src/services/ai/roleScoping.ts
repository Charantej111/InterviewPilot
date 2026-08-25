/**
 * Role Scoping & Competency Taxonomy Engine — Deterministic Role-Based Grounding
 *
 * Implements strict separation:
 * 1. Role Archetype & Standard Competencies: Defines WHAT TO ASSESS for the target role.
 * 2. Resume Evidence Scoping: Evaluates WHAT VERIFIED EVIDENCE the candidate actually has.
 *
 * Prevents out-of-scope technical questions (e.g., Node.js/Backend for UI/UX Intern)
 * while maintaining 100% anti-hallucination verification.
 */

import type { CandidateEvidenceModel, LockedCandidateContext } from '../../types/resume';

export type RoleArchetype =
  | 'ui_ux_design'
  | 'frontend_engineering'
  | 'backend_engineering'
  | 'fullstack_engineering'
  | 'mobile_engineering'
  | 'product_management'
  | 'data_science_ml'
  | 'devops_cloud_sre'
  | 'cybersecurity'
  | 'qa_testing'
  | 'engineering_leadership'
  | 'general_technology';

/**
 * Deterministically classifies a target role string into a standard RoleArchetype.
 */
export function identifyRoleArchetype(targetRole: string): RoleArchetype {
  const role = (targetRole || '').trim().toLowerCase();

  // 1. UI/UX & Product Design
  if (
    /(\bui\b|\bux\b|user experience|user interface|product design|visual design|interaction design|graphic design|web design|designer|figma|uxr|user research)\b/i.test(
      role
    )
  ) {
    return 'ui_ux_design';
  }

  // 2. Product Management
  if (/(\bproduct manager\b|\bpm\b|associate product manager|\bapm\b|product owner|technical product manager|\btpm\b)\b/i.test(role)) {
    return 'product_management';
  }

  // 3. Frontend Engineering
  if (/(\bfrontend\b|\bfront-end\b|\bui developer\b|\bui engineer\b|\breact developer\b|\bangular\b|\bvue\b|\bweb developer\b)\b/i.test(role)) {
    return 'frontend_engineering';
  }

  // 4. Backend / Systems Engineering
  if (/(\bbackend\b|\bback-end\b|\bsystems engineer\b|\bdistributed systems\b|\bapi engineer\b|\bdatabase engineer\b|\bserver engineer\b)\b/i.test(role)) {
    return 'backend_engineering';
  }

  // 5. Mobile Engineering
  if (/(\bmobile\b|\bios\b|\bandroid\b|\bflutter\b|\breact native\b|\bswift developer\b|\bkotlin developer\b)\b/i.test(role)) {
    return 'mobile_engineering';
  }

  // 6. Data Science / AI / ML
  if (/(\bdata scientist\b|\bmachine learning\b|\bml engineer\b|\bai engineer\b|\bdeep learning\b|\bdata analyst\b|\bnlp\b|\bcomputer vision\b|\bdata engineer\b)\b/i.test(role)) {
    return 'data_science_ml';
  }

  // 7. DevOps / SRE / Cloud
  if (/(\bdevops\b|\bsre\b|site reliability|cloud engineer|\baws\b|infrastructure engineer|\bkubernetes\b|\bplatform engineer\b)\b/i.test(role)) {
    return 'devops_cloud_sre';
  }

  // 8. Cybersecurity
  if (/(\bsecurity\b|\bcyber\b|infosec|penetration tester|\bsoc\b|threat hunter|appsec|incident response)\b/i.test(role)) {
    return 'cybersecurity';
  }

  // 9. QA / Testing
  if (/(\bqa\b|quality assurance|test engineer|\bsdet\b|automation tester|testing)\b/i.test(role)) {
    return 'qa_testing';
  }

  // 10. Engineering Leadership
  if (/(engineering manager|\bem\b|tech lead|director of engineering|\bvp engineering\b|cto|head of engineering)\b/i.test(role)) {
    return 'engineering_leadership';
  }

  // 11. Fullstack Engineering
  if (/(\bfullstack\b|\bfull-stack\b|\bsoftware engineer\b|\bswe\b|\bsoftware developer\b|\bprogrammer\b)\b/i.test(role)) {
    return 'fullstack_engineering';
  }

  return 'general_technology';
}

/**
 * Returns canonical standard competencies for a target role archetype.
 * Completely DECOUPLED from candidate resume evidence — defines WHAT TO ASSESS.
 */
export function getRoleStandardCompetencies(targetRole: string): {
  critical: string[];
  optional: string[];
} {
  const archetype = identifyRoleArchetype(targetRole);

  switch (archetype) {
    case 'ui_ux_design':
      return {
        critical: [
          'User Research & Needs Discovery',
          'Wireframing, Prototyping & Interaction Design',
          'Usability Testing & Design Critique',
          'Design Systems & Developer Handoff',
        ],
        optional: [
          'Information Architecture & Navigation Flows',
          'Accessibility & Visual Hierarchy',
          'Cross-Functional Stakeholder Alignment',
        ],
      };

    case 'product_management':
      return {
        critical: [
          'Product Discovery & User Problem Framing',
          'Roadmap Prioritization & Strategic Trade-Offs',
          'Execution, Delivery & Metric Definition',
          'Stakeholder & Cross-Functional Leadership',
        ],
        optional: [
          'Go-to-Market Strategy & Launch Planning',
          'Competitive Landscape & Market Analysis',
          'Technical Feasibility & Engineering Collaboration',
        ],
      };

    case 'frontend_engineering':
      return {
        critical: [
          'UI Architecture & Component Modularization',
          'Client State Management & Performance Optimization',
          'Web Accessibility & Responsive Layout Engineering',
          'API Integration, Data Fetching & Error Handling',
        ],
        optional: [
          'Build Tooling, Bundling & Testing Automation',
          'Design System Tokenization & CSS Architecture',
          'Cross-Browser Compatibility & Web Vitals',
        ],
      };

    case 'backend_engineering':
      return {
        critical: [
          'API Architecture & REST/gRPC Contract Design',
          'Data Modeling, Indexing & Storage Systems',
          'System Scalability, Concurrency & Distributed Trade-offs',
          'Reliability, Error Handling & Fault Tolerance',
        ],
        optional: [
          'Distributed Caching & Invalidation Strategies',
          'Observability, Telemetry & Root Cause Debugging',
          'Security, Authentication & Authorization Architecture',
        ],
      };

    case 'fullstack_engineering':
      return {
        critical: [
          'Full-Stack Architecture & Feature Decomposition',
          'API Design & Client-Server Contract Engineering',
          'Data Modeling, Database Integrity & Performance',
          'End-to-End Delivery, Testing & Problem Solving',
        ],
        optional: [
          'Frontend UI/State Optimization',
          'Backend Concurrency & Caching',
          'CI/CD & Cloud Deployment Pipelines',
        ],
      };

    case 'mobile_engineering':
      return {
        critical: [
          'Mobile Architecture & State Management',
          'Offline Storage, Caching & Network Synchronization',
          'UI Rendering Performance, Animations & Memory Management',
          'Platform Guidelines, App Lifecycle & Store Deployment',
        ],
        optional: [
          'Native Bridge/Interoperability',
          'Crash Analytics & Telemetry',
          'Accessibility & Localization',
        ],
      };

    case 'data_science_ml':
      return {
        critical: [
          'Data Exploration, Cleaning & Feature Engineering',
          'Model Architecture Selection & Algorithmic Trade-offs',
          'Evaluation Metrics, Validation & Statistical Rigor',
          'Production Inference, Latency & Pipeline Architecture',
        ],
        optional: [
          'Data Drift, Retraining & MLOps Pipelines',
          'Explainability & Business Stakeholder Framing',
          'Scalable Distributed Compute (Spark/Ray)',
        ],
      };

    case 'devops_cloud_sre':
      return {
        critical: [
          'Infrastructure as Code & Cloud Architecture',
          'CI/CD Pipeline Design & Release Orchestration',
          'System Observability, Telemetry & SLI/SLO Engineering',
          'Incident Response, High Availability & Disaster Recovery',
        ],
        optional: [
          'Container Security & Network Policy Enforcement',
          'Cloud Cost Optimization & Capacity Planning',
          'Configuration Management & Automation Tooling',
        ],
      };

    case 'cybersecurity':
      return {
        critical: [
          'Threat Modeling & Attack Surface Analysis',
          'Security Architecture, Authentication & Encryption',
          'Incident Response, Forensics & CSIRT Playbooks',
          'Vulnerability Mitigation & Secure Coding Practices',
        ],
        optional: [
          'SIEM Architecture & Telemetry Logging',
          'Penetration Testing & Exploit Mitigation',
          'Compliance, Risk Governance & Audit Readiness',
        ],
      };

    case 'qa_testing':
      return {
        critical: [
          'Test Strategy, Test Plan Design & Coverage Analysis',
          'End-to-End Automation Framework Architecture',
          'Edge Case Identification & Defect Root Cause Analysis',
          'API Testing & Regression Pipeline Integration',
        ],
        optional: [
          'Performance & Load Testing Methodologies',
          'CI/CD Quality Gates & Release Verification',
          'Security & Vulnerability Test Cases',
        ],
      };

    case 'engineering_leadership':
      return {
        critical: [
          'Engineering Strategy & System Architecture Ownership',
          'Team Execution, Delivery Velocity & Roadmapping',
          'Mentorship, Hiring & Performance Development',
          'Cross-Functional Stakeholder Negotiation',
        ],
        optional: [
          'Technical Debt Governance & Legacy Modernization',
          'Incident Post-Mortems & Engineering Culture',
          'Budget & Resource Allocation',
        ],
      };

    default:
      return {
        critical: [
          'Domain Problem Solving & Technical Ownership',
          'Architecture Decomposition & Trade-off Analysis',
          'Execution Rigor, Deliverables & Impact',
          'Cross-Functional Collaboration & Communication',
        ],
        optional: [
          'Continuous Learning & Adaptability',
          'Operational Quality & Risk Mitigation',
        ],
      };
  }
}

/**
 * Scopes resume evidence specifically against the target role.
 * Identifies what verified evidence the candidate actually possesses for this role.
 */
export function scopeResumeEvidenceToRole(
  targetRole: string,
  evidenceModel?: CandidateEvidenceModel | null
): {
  directProjects: import('../../types/resume').ProjectEvidence[];
  directSkills: import('../../types/resume').EvidenceItem[];
  transferableProjects: import('../../types/resume').ProjectEvidence[];
  outOfScopeSkills: import('../../types/resume').EvidenceItem[];
} {
  if (!evidenceModel) {
    return {
      directProjects: [],
      directSkills: [],
      transferableProjects: [],
      outOfScopeSkills: [],
    };
  }

  const archetype = identifyRoleArchetype(targetRole);
  const projects = evidenceModel.projects || [];
  const skills = evidenceModel.skills || ({} as any);
  const allSkills = [
    ...(Array.isArray(skills.technical) ? skills.technical : []),
    ...(Array.isArray(skills.product) ? skills.product : []),
    ...(Array.isArray(skills.domain) ? skills.domain : []),
  ];

  const isUiUx = archetype === 'ui_ux_design';
  const isPm = archetype === 'product_management';
  const isFrontend = archetype === 'frontend_engineering';

  const directProjects: import('../../types/resume').ProjectEvidence[] = [];
  const transferableProjects: import('../../types/resume').ProjectEvidence[] = [];
  const directSkills: import('../../types/resume').EvidenceItem[] = [];
  const outOfScopeSkills: import('../../types/resume').EvidenceItem[] = [];

  for (const p of projects) {
    const pName = (p.name?.value || '').toLowerCase();
    const pTechs = (p.technologies || []).map((t) => (t.value || '').toLowerCase());
    const pSummary = `${pName} ${pTechs.join(' ')}`;

    if (isUiUx) {
      // Direct UI/UX projects: mentions design, ui, ux, wireframes, figma, user, website, interface
      const isDesignProject = /(design|ui|ux|wireframe|figma|user|interface|frontend|web|portfolio|redesign|landing|dashboard)/i.test(
        pSummary
      );
      if (isDesignProject) {
        directProjects.push(p);
      } else {
        transferableProjects.push(p);
      }
    } else if (isPm) {
      // Direct PM projects: mentions product, discovery, launch, roadmapping, growth, users, metrics
      const isProductProject = /(product|growth|user|metric|launch|platform|market|strategy|feature|customer|portal)/i.test(
        pSummary
      );
      if (isProductProject) {
        directProjects.push(p);
      } else {
        transferableProjects.push(p);
      }
    } else if (isFrontend) {
      const isFeProject = /(react|vue|angular|frontend|web|ui|html|css|javascript|typescript|nextjs|tailwind)/i.test(
        pSummary
      );
      if (isFeProject) {
        directProjects.push(p);
      } else {
        transferableProjects.push(p);
      }
    } else {
      directProjects.push(p);
    }
  }

  for (const s of allSkills) {
    const val = (s.value || '').toLowerCase();

    if (isUiUx) {
      const isDesignSkill = /(figma|sketch|adobe|wirefram|prototyp|user research|usability|css|html|ui|ux|design system|interaction design|visual design|responsive)/i.test(
        val
      );
      const isHeavyBackendSkill = /(node\.?js|express|mongodb|docker|kubernetes|aws|sql|c\+\+|java|golang|rust|redis|microservices|backend|django|flask|spring)/i.test(
        val
      );

      if (isDesignSkill) {
        directSkills.push(s);
      } else if (isHeavyBackendSkill) {
        outOfScopeSkills.push(s);
      } else {
        // neutral skill
      }
    } else if (isPm) {
      const isPmSkill = /(product management|roadmapping|user research|analytics|a\/b test|sql|metrics|agile|scrum|jira|market research|kpi)/i.test(
        val
      );
      const isDeepCodingSkill = /(c\+\+|compiler|assembly|kernel|driver|embedded)/i.test(val);

      if (isPmSkill) {
        directSkills.push(s);
      } else if (isDeepCodingSkill) {
        outOfScopeSkills.push(s);
      }
    } else {
      directSkills.push(s);
    }
  }

  return {
    directProjects,
    directSkills,
    transferableProjects,
    outOfScopeSkills,
  };
}

/**
 * Derives the role-scoped interview competencies for a resume-grounded interview contract.
 *
 * Guaranteed:
 * 1. Critical competencies are strictly drawn from the Target Role's standard competencies.
 * 2. Resume evidence grounds appropriate topics if verified direct evidence exists.
 * 3. Out-of-scope skills (e.g., Node.js for a UI/UX role) are NEVER derived as critical competencies.
 */
export function deriveRoleScopedResumeCompetencies(
  targetRole: string,
  candidateContext?: LockedCandidateContext | null
): {
  criticalCompetencies: string[];
  optionalCompetencies: string[];
} {
  const roleStandard = getRoleStandardCompetencies(targetRole || 'Software Engineer');
  const scopedEvidence = scopeResumeEvidenceToRole(targetRole, candidateContext?.evidenceModel);

  const criticalList: string[] = [];
  const optionalList: string[] = [];

  // 1. Take the canonical critical competencies for the target role
  for (const comp of roleStandard.critical) {
    criticalList.push(comp);
  }

  // 2. Add any direct role-relevant projects or skills as optional or sub-grounding topics
  if (scopedEvidence.directProjects.length > 0) {
    for (const proj of scopedEvidence.directProjects.slice(0, 2)) {
      const projName = proj.name?.value;
      if (projName && !criticalList.some((c) => c.includes(projName))) {
        optionalList.push(`Project Review: ${projName}`);
      }
    }
  }

  // 3. Populate optional competencies from role standard
  for (const opt of roleStandard.optional) {
    if (!criticalList.includes(opt) && !optionalList.includes(opt)) {
      optionalList.push(opt);
    }
  }

  return {
    criticalCompetencies: criticalList,
    optionalCompetencies: optionalList,
  };
}

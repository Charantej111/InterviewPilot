/**
 * Match Engine — Requirement-Level Deterministic Match
 *
 * Architecture:
 *   LockedCandidateContext + JDEvidenceModel
 *   → Match Input Integrity Gate
 *   → Per-requirement verdict (direct / transferable / missing / unproven)
 *   → Traceable score computation: (earnedPoints / possiblePoints) * 100
 *   → MatchAssessment (primary object) with full scoreTrace
 *   → Version tracking: resumeExtractionId + jdContentHash
 *
 * Zero AI hallucination in scoring. 100% deterministic TypeScript computation.
 * All evidence quotations strictly reference existing stored source evidence.
 */

import type { LockedCandidateContext, EvidenceItem, CandidateEvidenceModel } from '../../types/resume';
import type { JDEvidenceModel, JDRequirement } from '../../types/jobDescription';
import type {
  MatchAssessment,
  MatchVerdict,
  RequirementMatch,
  MatchStateModel,
  MatchAnalysisResult,
  MatchingStrength,
  ActionableGap,
  DeterministicScoreBreakdown,
  QualificationConfidence,
} from '../../types/matchAnalysis';
import { computeJDHash } from './jdValidator';

// ─── Importance Weights & Multipliers ─────────────────────────────────────────

export const WEIGHTS = {
  explicit_critical: 3.0,
  explicit_standard: 2.0,
  preferred:         1.0,
  inferred:          0.5,
} as const;

export const MULTIPLIERS = {
  direct:       1.0,
  transferable: 0.6,
  missing:      0.0,
  unproven:     0.0,
} as const;

export function getRequirementWeight(req: JDRequirement): number {
  if (req.strength === 'explicit') {
    return req.critical ? WEIGHTS.explicit_critical : WEIGHTS.explicit_standard;
  }
  if (req.strength === 'preferred') return WEIGHTS.preferred;
  return WEIGHTS.inferred;
}

// ─── Canonical Skill Aliases & Token Matcher ──────────────────────────────────

const STOP_WORDS = new Set([
  'and', 'for', 'the', 'with', 'role', 'using', 'from', 'into', 'under', 'over', 'both', 'across', 'must', 'have', 'experience'
]);

const ALIASES: Record<string, string[]> = {
  'product management': ['product manager', 'product management', 'pm', 'product strategy', 'prd', 'prds'],
  'roadmap prioritization': ['roadmap prioritization', 'roadmap', 'product prioritization', 'feature prioritization'],
  'stakeholder management': ['stakeholder management', 'cross-functional leadership', 'stakeholder collaboration', 'stakeholder'],
  'data analysis': ['data analysis', 'sql analytics', 'data analytics', 'metrics analytics', 'a/b testing', 'cohort analysis', 'sql', 'analytics'],
  'agile': ['agile', 'scrum', 'sprint planning', 'kanban', 'sprint'],
  'ux': ['user experience', 'ux design', 'figma', 'user research', 'user interviews', 'wireframing', 'wireframes'],
  'python': ['python', 'python programming', 'django', 'fastapi', 'flask'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'scikit-learn', 'pytorch', 'tensorflow'],
  'distributed systems': ['distributed systems', 'distributed caching', 'event streaming', 'raft consensus', 'kafka'],
  'cloud infrastructure': ['cloud infrastructure', 'aws', 'gcp', 'azure', 'kubernetes', 'docker'],
  'cybersecurity': ['cybersecurity', 'siem', 'splunk', 'threat hunting', 'soc operations', 'packet forensics', 'penetration testing', 'kernel security', 'incident response', 'cissp', 'oscp', 'network forensics'],
};

function normalizeToken(t: string): string {
  return t.toLowerCase().trim();
}

function getCanonical(term: string): string {
  const n = normalizeToken(term);
  for (const [canon, variants] of Object.entries(ALIASES)) {
    if (variants.some((v) => n === v || n === `${v}s`)) {
      return canon;
    }
  }
  return n;
}

// ─── Evidence Pool Construction ────────────────────────────────────────────────

function buildEvidencePool(model: CandidateEvidenceModel): EvidenceItem[] {
  const skills = model.skills || ({} as any);
  const technical = Array.isArray(skills.technical) ? skills.technical : [];
  const product = Array.isArray(skills.product) ? skills.product : [];
  const domain = Array.isArray(skills.domain) ? skills.domain : [];
  const soft = Array.isArray((skills as any).soft) ? (skills as any).soft : [];
  const tools = Array.isArray((skills as any).tools) ? (skills as any).tools : [];
  const workExp = Array.isArray(model.workExperience) ? model.workExperience : [];
  const projects = Array.isArray(model.projects) ? model.projects : [];
  const certifications = Array.isArray(model.certifications) ? model.certifications : [];
  const education = Array.isArray(model.education) ? model.education : [];
  const summary = (model as any).summary ? [(model as any).summary] : [];

  const pool: EvidenceItem[] = [
    ...technical,
    ...product,
    ...domain,
    ...soft,
    ...tools,
    ...summary,
    ...workExp.flatMap((w) => [
      w.role,
      w.company,
      ...(w.bullets || []),
      w.startDate && w.endDate ? { value: `${w.role} ${w.startDate} - ${w.endDate}`, sourceText: `${w.role} from ${w.startDate} to ${w.endDate}`, confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } } : null,
    ]),
    ...projects.flatMap((p) => [
      p.name,
      ...(p.contribution ? [p.contribution] : []),
      ...(p.problem ? [p.problem] : []),
      ...(p.technologies || []),
      ...(p.outcomes || []),
    ]),
    ...certifications,
    ...education.flatMap((e) => [e.degree, e.institution, e.year].filter(Boolean) as EvidenceItem[]),
  ].filter(Boolean) as EvidenceItem[];

  return pool;
}

// ─── Per-Requirement Matching Algorithm ───────────────────────────────────────

/**
 * Searches the candidate's locked evidence pool for the best grounding match for a JD requirement.
 * Strictly references stored source evidence — never fabricates any quote.
 */
function findBestMatch(
  requirement: JDRequirement,
  evidencePool: EvidenceItem[]
): { verdict: MatchVerdict; candidateEvidence?: EvidenceItem; matchConfidence: number } {
  const reqCanon = getCanonical(requirement.requirement);
  
  // Extract significant words from requirement
  const reqWords = reqCanon
    .split(/[\s/,-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  let directEvidence: EvidenceItem | undefined;
  let directScore = 0;

  let transferableEvidence: EvidenceItem | undefined;
  let transferableScore = 0;

  for (const item of evidencePool) {
    if (!item?.value) continue;
    const itemCanon = getCanonical(item.value);
    const itemSourceLower = (item.sourceText || '').toLowerCase();
    const itemConfidenceWeight = item.confidence === 'high' ? 1.0 : item.confidence === 'medium' ? 0.8 : 0.5;

    // 1. Direct match: Exact canonical match or exact term inclusion
    if (
      itemCanon === reqCanon ||
      (reqCanon.length >= 4 && itemCanon === reqCanon) ||
      (itemCanon.length >= 4 && reqCanon.includes(itemCanon) && itemCanon.length >= 5) ||
      (itemCanon.length >= 4 && itemSourceLower.includes(reqCanon) && !STOP_WORDS.has(reqCanon))
    ) {
      if (itemConfidenceWeight > directScore) {
        directScore = itemConfidenceWeight;
        directEvidence = item;
      }
      continue;
    }

    // Token overlap comparison
    const itemWords = itemCanon
      .split(/[\s/,-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (reqWords.length > 0 && itemWords.length > 0) {
      const exactWordMatches = reqWords.filter((w) => itemWords.includes(w) || itemSourceLower.includes(w));
      const matchRatio = exactWordMatches.length / reqWords.length;

      // Direct match if all or majority of words match
      const isDirectMatch = (reqWords.length === 1 && exactWordMatches.length === 1) ||
                            (reqWords.length >= 2 && matchRatio >= 0.7 && exactWordMatches.length >= 2);

      if (isDirectMatch) {
        if (itemConfidenceWeight > directScore) {
          directScore = itemConfidenceWeight;
          directEvidence = item;
        }
        continue;
      }

      // Transferable match if partial overlap
      if (matchRatio >= 0.4 && exactWordMatches.length >= 1) {
        const score = matchRatio * itemConfidenceWeight;
        if (score > transferableScore) {
          transferableScore = score;
          transferableEvidence = item;
        }
      }
    }
  }

  if (directEvidence && directScore >= 0.5) {
    return { verdict: 'direct', candidateEvidence: directEvidence, matchConfidence: directScore };
  }

  if (transferableEvidence && transferableScore >= 0.3) {
    return { verdict: 'transferable', candidateEvidence: transferableEvidence, matchConfidence: transferableScore };
  }

  return { verdict: 'missing', matchConfidence: 0 };
}

function buildExplanation(req: JDRequirement, verdict: MatchVerdict, evidence?: EvidenceItem): string {
  switch (verdict) {
    case 'direct':
      return `Directly matched with confirmed resume evidence: "${evidence?.sourceText}" (${evidence?.sourceLocation.section})`;
    case 'transferable':
      return `Transferable baseline observed via "${evidence?.sourceText}" (${evidence?.sourceLocation.section})`;
    case 'missing':
      return `Not found on resume. JD requirement: "${req.sourceText}"`;
    case 'unproven':
      return `Claimed in summary but lacks verifiable deliverable source text on resume.`;
  }
}

// ─── Match Input Integrity Gate ───────────────────────────────────────────────

export function verifyMatchIntegrity(
  lockedContext?: LockedCandidateContext | null,
  jdModel?: JDEvidenceModel | null
): { valid: boolean; reason?: MatchStateModel['reason'] } {
  if (!lockedContext || !lockedContext.evidenceModel) {
    return { valid: false, reason: 'RESUME_REQUIRED' };
  }

  if (!jdModel) {
    return { valid: false, reason: 'JOB_DESCRIPTION_REQUIRED' };
  }

  const allReqs = [
    ...(jdModel.requiredSkills || []),
    ...(jdModel.technicalRequirements || []),
    ...(jdModel.responsibilities || []),
    ...(jdModel.competencies || []),
    ...(jdModel.domainKnowledge || []),
    ...(jdModel.experienceRequirements || []),
    ...(jdModel.educationRequirements || []),
    ...(jdModel.certificationRequirements || []),
    ...(jdModel.behavioralSignals || []),
    ...(jdModel.preferredSkills || []),
  ];

  if (allReqs.length === 0) {
    return { valid: false, reason: 'JOB_DESCRIPTION_REQUIRED' };
  }

  return { valid: true };
}

// ─── Core Deterministic Match Assessment ──────────────────────────────────────

/**
 * Computes the 100% deterministic requirement-level MatchAssessment.
 * Gemini never produces the overallMatchPercent.
 */
export function computeMatchAssessment(
  lockedContext?: LockedCandidateContext | null,
  jdModel?: JDEvidenceModel | null,
  providedJdHash?: string
): MatchAssessment | null {
  const integrity = verifyMatchIntegrity(lockedContext, jdModel);
  if (!integrity.valid || !lockedContext || !jdModel) {
    return null;
  }

  const evidencePool = buildEvidencePool(lockedContext.evidenceModel);

  // Gather all requirements from all categories
  const allRequirements: JDRequirement[] = [
    ...(jdModel.requiredSkills || []),
    ...(jdModel.technicalRequirements || []),
    ...(jdModel.responsibilities || []),
    ...(jdModel.competencies || []),
    ...(jdModel.domainKnowledge || []),
    ...(jdModel.experienceRequirements || []),
    ...(jdModel.educationRequirements || []),
    ...(jdModel.certificationRequirements || []),
    ...(jdModel.behavioralSignals || []),
    ...(jdModel.preferredSkills || []),
  ];

  // Deduplicate by sourceText + requirement to prevent double-counting identical lines
  const seen = new Set<string>();
  const deduplicated: JDRequirement[] = [];
  for (const req of allRequirements) {
    const key = `${req.requirement.toLowerCase().trim()}|${req.sourceText.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(req);
    }
  }

  if (deduplicated.length === 0) {
    return null;
  }

  const requirementMatches: RequirementMatch[] = [];
  let totalPossibleWeight = 0;
  let totalEarnedWeight = 0;

  for (const req of deduplicated) {
    const weight = getRequirementWeight(req);
    totalPossibleWeight += weight;

    const { verdict, candidateEvidence, matchConfidence } = findBestMatch(req, evidencePool);
    const multiplier = MULTIPLIERS[verdict];
    const earnedPoints = weight * multiplier * (verdict === 'direct' ? matchConfidence : verdict === 'transferable' ? 1.0 : 0);

    totalEarnedWeight += earnedPoints;

    requirementMatches.push({
      jdRequirement: req,
      verdict,
      candidateEvidence,
      weightedContribution: Math.round(earnedPoints * 10) / 10,
      scoreTrace: {
        weight,
        multiplier,
        earnedPoints: Math.round(earnedPoints * 10) / 10,
        possiblePoints: weight,
      },
      explanation: buildExplanation(req, verdict, candidateEvidence),
    });
  }

  const overallMatchPercent = totalPossibleWeight > 0
    ? Math.min(100, Math.max(0, Math.round((totalEarnedWeight / totalPossibleWeight) * 100)))
    : 0;

  const directMatches       = requirementMatches.filter((m) => m.verdict === 'direct');
  const transferableMatches = requirementMatches.filter((m) => m.verdict === 'transferable');
  const missingRequirements = requirementMatches.filter((m) => m.verdict === 'missing');
  const unprovenClaims      = requirementMatches.filter((m) => m.verdict === 'unproven');

  const criticalGaps = missingRequirements
    .filter((m) => m.jdRequirement.critical || m.jdRequirement.strength === 'explicit')
    .map((m) => m.jdRequirement.requirement);

  const evidenceCoverage = deduplicated.length > 0
    ? Math.round(((directMatches.length + transferableMatches.length) / deduplicated.length) * 100) / 100
    : 0;

  let verdict: MatchAssessment['verdict'];
  if (overallMatchPercent >= 65) verdict = 'strong';
  else if (overallMatchPercent >= 40) verdict = 'moderate';
  else if (overallMatchPercent >= 20) verdict = 'low';
  else verdict = 'mismatched';

  const confidence: QualificationConfidence =
    evidenceCoverage > 0.6 ? 'high'
    : evidenceCoverage > 0.3 ? 'medium'
    : 'low';

  const resumeExtractionId = lockedContext.sessionId || `ses_${Date.now()}`;
  const jdContentHash = providedJdHash || computeJDHash(
    allRequirements.map((r) => r.sourceText).join(' '),
    jdModel.role,
    jdModel.company
  );

  return {
    overallMatchPercent,
    verdict,
    confidence,
    evidenceCoverage,
    requirementMatches,
    directMatches,
    transferableMatches,
    missingRequirements,
    unprovenClaims,
    criticalGaps,
    resumeExtractionId,
    jdContentHash,
    createdAt: new Date().toISOString(),
  };
}

// ─── Match State Machine ──────────────────────────────────────────────────────

/**
 * Computes explicit MatchStateModel for state management.
 * Returns status 'not_ready' with null percentage when JD or Resume is missing or invalid.
 */
export function computeMatchState(
  lockedContext?: LockedCandidateContext | null,
  jdModel?: JDEvidenceModel | null,
  expectedResumeId?: string,
  expectedJdHash?: string
): MatchStateModel {
  const integrity = verifyMatchIntegrity(lockedContext, jdModel);
  if (!integrity.valid || !lockedContext || !jdModel) {
    return {
      status: 'not_ready',
      overallMatchPercent: null,
      requirementMatches: [],
      reason: integrity.reason || 'JOB_DESCRIPTION_REQUIRED',
      matchAssessment: null,
    };
  }

  // Version tracking verification: if IDs mismatch, reject as stale
  if (expectedResumeId && lockedContext.sessionId && expectedResumeId !== lockedContext.sessionId) {
    return {
      status: 'not_ready',
      overallMatchPercent: null,
      requirementMatches: [],
      reason: 'INTEGRITY_CHECK_FAILED',
      matchAssessment: null,
    };
  }

  const assessment = computeMatchAssessment(lockedContext, jdModel, expectedJdHash);
  if (!assessment) {
    return {
      status: 'failed',
      overallMatchPercent: null,
      requirementMatches: [],
      reason: 'ANALYSIS_FAILED',
      matchAssessment: null,
    };
  }

  return {
    status: 'ready',
    overallMatchPercent: assessment.overallMatchPercent,
    requirementMatches: assessment.requirementMatches,
    matchAssessment: assessment,
    resumeExtractionId: assessment.resumeExtractionId,
    jdContentHash: assessment.jdContentHash,
  };
}

// ─── Backward-Compat Adapter ──────────────────────────────────────────────────

/**
 * Wraps MatchAssessment into legacy MatchAnalysisResult shape for backward compatibility.
 */
export function buildLegacyMatchResult(assessment: MatchAssessment): MatchAnalysisResult {
  const directMatches: MatchingStrength[] = assessment.directMatches.map((m) => ({
    competency: m.jdRequirement.competencySignal || m.jdRequirement.requirement,
    evidence: m.candidateEvidence?.sourceText || m.jdRequirement.requirement,
    relevanceScore: Math.round(m.weightedContribution * 10),
    classification: 'direct_match',
    evidenceStrength: 'confirmed',
    provenance: {
      source: 'resume',
      reference: m.candidateEvidence?.sourceLocation.section || 'RESUME',
      snippet: m.candidateEvidence?.sourceText,
    },
  }));

  const transferableMatches: MatchingStrength[] = assessment.transferableMatches.map((m) => ({
    competency: m.jdRequirement.competencySignal || m.jdRequirement.requirement,
    evidence: m.candidateEvidence?.sourceText || m.jdRequirement.requirement,
    relevanceScore: Math.round(m.weightedContribution * 10),
    classification: 'transferable_match',
    evidenceStrength: 'partial',
    provenance: {
      source: 'resume',
      reference: m.candidateEvidence?.sourceLocation.section || 'RESUME',
      snippet: m.candidateEvidence?.sourceText,
    },
  }));

  const gaps: ActionableGap[] = assessment.missingRequirements.map((m, i) => ({
    gapId: m.jdRequirement.id || `gap_${i}`,
    requirement: m.jdRequirement.requirement,
    status: 'missing',
    evidenceStrength: 'unverified',
    criticality: m.jdRequirement.critical ? 'blocking' : 'important',
    recommendation: `Demonstrate capability in ${m.jdRequirement.requirement}.`,
    targetedProbeOpportunity: `Probe practical experience and trade-offs regarding ${m.jdRequirement.requirement}.`,
    priority: m.jdRequirement.critical ? 'high' : 'medium',
    provenance: {
      source: 'job_description',
      reference: `${m.jdRequirement.category.toUpperCase()} → ${m.jdRequirement.requirement}`,
      snippet: m.jdRequirement.sourceText,
    },
  }));

  const blockingGaps = gaps.filter((g) => g.criticality === 'blocking');

  const breakdown: DeterministicScoreBreakdown = {
    requiredSkillsCoverage: Math.round(
      (assessment.directMatches.length / Math.max(1, assessment.requirementMatches.length)) * 45
    ),
    experienceAlignment: Math.round(
      (assessment.transferableMatches.length / Math.max(1, assessment.requirementMatches.length)) * 30
    ),
    competenciesMatch: Math.round(assessment.evidenceCoverage * 25),
    rawScore: assessment.overallMatchPercent,
    blockingPenaltyMultiplier: 1.0,
    totalScore: assessment.overallMatchPercent,
    confidenceInterval: [
      Math.max(0, assessment.overallMatchPercent - 4),
      Math.min(100, assessment.overallMatchPercent + 4),
    ],
  };

  const directCount = assessment.directMatches.length;
  const transCount = assessment.transferableMatches.length;
  const gapCount = assessment.missingRequirements.length;

  return {
    matchAssessment: assessment,
    matchPercentage: assessment.overallMatchPercent,
    rawMatchPercentage: assessment.overallMatchPercent,
    qualificationConfidence: assessment.confidence,
    evidenceCoverage: assessment.evidenceCoverage,
    criticalRequirementCoverage: assessment.requirementMatches.length > 0
      ? Math.round(
          (assessment.directMatches.filter((m) => m.jdRequirement.critical).length /
            Math.max(1, assessment.requirementMatches.filter((m) => m.jdRequirement.critical).length)) * 100
        ) / 100
      : 1.0,
    deterministicBreakdown: breakdown,
    directMatches,
    transferableMatches,
    matchingStrengths: [...directMatches, ...transferableMatches],
    gaps,
    blockingGaps,
    actionableGaps: gaps,
    companyAlignmentSummary: `${directCount} direct verified match${directCount === 1 ? '' : 'es'}, ${transCount} transferable skill${transCount === 1 ? '' : 's'}, ${gapCount} open requirement gap${gapCount === 1 ? '' : 's'}.`,
  };
}

/**
 * Match Engine — Requirement-Level Deterministic Match
 *
 * Architecture:
 *   LockedCandidateContext + JDEvidenceModel
 *   → per-requirement verdict (direct / transferable / missing / unproven / contradicted)
 *   → weighted contribution
 *   → MatchAssessment (primary object) + backward-compat MatchAnalysisResult
 *
 * No AI call. Fully deterministic. Every verdict is traceable to sourceText.
 */

import type { LockedCandidateContext, EvidenceItem, CandidateEvidenceModel } from '../../types/resume';
import type { JDEvidenceModel, JDRequirement } from '../../types/jobDescription';
import type {
  MatchAssessment,
  MatchVerdict,
  RequirementMatch,
  MatchAnalysisResult,
  MatchingStrength,
  ActionableGap,
  DeterministicScoreBreakdown,
} from '../../types/matchAnalysis';

// ─── Importance Weights ───────────────────────────────────────────────────────

const WEIGHT = {
  explicit_critical: 3.0,
  explicit_required: 2.0,
  preferred:         1.0,
  inferred:          0.5,
};

function getRequirementWeight(req: JDRequirement, isCritical: boolean): number {
  if (req.strength === 'explicit') {
    return isCritical ? WEIGHT.explicit_critical : WEIGHT.explicit_required;
  }
  if (req.strength === 'preferred') return WEIGHT.preferred;
  return WEIGHT.inferred;
}

// ─── Skill Alias Normalization ─────────────────────────────────────────────────

const ALIASES: Record<string, string[]> = {
  'product management': ['product manager', 'pm', 'product management'],
  'stakeholder management': ['stakeholder', 'cross-functional', 'cross functional'],
  'data analysis': ['analytics', 'data analysis', 'sql', 'metrics'],
  'agile': ['agile', 'scrum', 'sprint', 'kanban'],
  'ux': ['user experience', 'ux', 'figma', 'design thinking', 'user research'],
  'python': ['python', 'py'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'ai'],
};

function normalizeToken(t: string): string {
  return t.toLowerCase().trim();
}

function getCanonical(term: string): string {
  const n = normalizeToken(term);
  for (const [canon, variants] of Object.entries(ALIASES)) {
    if (variants.some((v) => n.includes(v))) return canon;
  }
  return n;
}

// ─── Match Scoring ────────────────────────────────────────────────────────────

/**
 * Given a JD requirement token, search the locked candidate evidence model.
 * Returns { verdict, candidateEvidence, matchQuality }
 */
function findBestMatch(
  requirement: JDRequirement,
  model: CandidateEvidenceModel
): { verdict: MatchVerdict; candidateEvidence?: EvidenceItem; matchQuality: number } {
  const reqCanon = getCanonical(requirement.requirement);
  const reqSourceLower = requirement.sourceText.toLowerCase();

  // Flatten all candidate evidence items into searchable pool
  const evidencePool: EvidenceItem[] = [
    ...model.skills.technical,
    ...model.skills.product,
    ...model.skills.domain,
    ...model.workExperience.flatMap((w) => [w.role, w.company, ...w.bullets]),
    ...model.projects.flatMap((p) => [
      p.name,
      ...(p.contribution ? [p.contribution] : []),
      ...(p.problem ? [p.problem] : []),
      ...p.technologies,
      ...p.outcomes,
    ]),
    ...model.certifications,
  ].filter(Boolean) as EvidenceItem[];

  let bestMatch: EvidenceItem | undefined;
  let bestScore = 0;
  let isDirect = false;

  for (const item of evidencePool) {
    const itemCanon = getCanonical(item.value);
    const sourceLower = item.sourceText.toLowerCase();

    // Direct match: canonical tokens match
    if (itemCanon === reqCanon || sourceLower.includes(reqCanon) || reqSourceLower.includes(itemCanon)) {
      const score = item.confidence === 'high' ? 1.0
                  : item.confidence === 'medium' ? 0.8
                  : item.confidence === 'low' ? 0.5
                  : 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
        isDirect = true;
      }
      continue;
    }

    // Transferable: partial overlap in source text words
    const reqWords = reqCanon.split(/\s+/).filter((w) => w.length > 3);
    const itemWords = itemCanon.split(/\s+/).filter((w) => w.length > 3);
    const overlap = reqWords.filter((w) => itemWords.includes(w) || sourceLower.includes(w));
    if (overlap.length > 0) {
      const score = (overlap.length / Math.max(reqWords.length, 1)) * 0.5;
      if (score > bestScore && !isDirect) {
        bestScore = score;
        bestMatch = item;
      }
    }
  }

  if (!bestMatch) {
    return { verdict: 'missing', matchQuality: 0 };
  }

  if (isDirect || bestScore >= 0.7) {
    return { verdict: 'direct', candidateEvidence: bestMatch, matchQuality: bestScore };
  }

  if (bestScore >= 0.3) {
    return { verdict: 'transferable', candidateEvidence: bestMatch, matchQuality: bestScore };
  }

  return { verdict: 'missing', matchQuality: 0 };
}

function evidenceStrengthFromItem(item?: EvidenceItem): number {
  if (!item) return 0;
  return item.confidence === 'high' ? 1.0
       : item.confidence === 'medium' ? 0.75
       : item.confidence === 'low' ? 0.4
       : 0.2;
}

function buildExplanation(req: JDRequirement, verdict: MatchVerdict, evidence?: EvidenceItem): string {
  switch (verdict) {
    case 'direct':
      return `Directly matched: "${evidence?.sourceText}"`;
    case 'transferable':
      return `Transferable via "${evidence?.sourceText}" (${evidence?.sourceLocation.section})`;
    case 'missing':
      return `Not found in resume. JD requires: "${req.sourceText}"`;
    case 'unproven':
      return `Claimed but no source text found in resume.`;
    case 'contradicted':
      return `Available evidence conflicts with this claim.`;
  }
}

// ─── Core Match Function ──────────────────────────────────────────────────────

export function computeMatchAssessment(
  lockedContext: LockedCandidateContext,
  jdModel: JDEvidenceModel
): MatchAssessment {
  const model = lockedContext.evidenceModel;
  const criticalSet = new Set(jdModel.criticalCompetencies.map((c) => c.toLowerCase()));

  // Gather all requirements from all categories
  const allRequirements: JDRequirement[] = [
    ...jdModel.requiredSkills,
    ...jdModel.technicalRequirements,
    ...jdModel.responsibilities.slice(0, 5),  // top 5 responsibilities
    ...jdModel.domainKnowledge,
    ...jdModel.behavioralSignals.slice(0, 3),
    ...jdModel.preferredSkills,
  ];

  // Deduplicate by sourceText
  const seen = new Set<string>();
  const deduplicated = allRequirements.filter((r) => {
    if (seen.has(r.sourceText)) return false;
    seen.add(r.sourceText);
    return true;
  });

  const requirementMatches: RequirementMatch[] = [];
  let totalPossibleWeight = 0;
  let totalEarnedWeight = 0;

  for (const req of deduplicated) {
    const isCritical = criticalSet.has(req.competencySignal.toLowerCase());
    const importanceWeight = getRequirementWeight(req, isCritical);
    totalPossibleWeight += importanceWeight;

    const { verdict, candidateEvidence, matchQuality } = findBestMatch(req, model);
    const evidenceStrength = evidenceStrengthFromItem(candidateEvidence);

    let contribution = 0;
    if (verdict === 'direct') {
      contribution = importanceWeight * evidenceStrength * matchQuality;
    } else if (verdict === 'transferable') {
      contribution = importanceWeight * evidenceStrength * matchQuality * 0.6;
    }
    // missing / unproven / contradicted = 0 contribution

    totalEarnedWeight += contribution;

    requirementMatches.push({
      jdRequirement: req,
      verdict,
      candidateEvidence,
      weightedContribution: Math.round(contribution * 10) / 10,
      explanation: buildExplanation(req, verdict, candidateEvidence),
    });
  }

  const overallMatchPercent = totalPossibleWeight > 0
    ? Math.round((totalEarnedWeight / totalPossibleWeight) * 100)
    : 0;

  const directMatches      = requirementMatches.filter((m) => m.verdict === 'direct');
  const transferableMatches = requirementMatches.filter((m) => m.verdict === 'transferable');
  const missingRequirements = requirementMatches.filter((m) => m.verdict === 'missing');
  const unprovenClaims      = requirementMatches.filter((m) => m.verdict === 'unproven');
  const contradictedClaims  = requirementMatches.filter((m) => m.verdict === 'contradicted');

  const criticalGaps = missingRequirements
    .filter((m) => m.jdRequirement.strength === 'explicit')
    .map((m) => m.jdRequirement.requirement);

  const evidenceCoverage = deduplicated.length > 0
    ? (directMatches.length + transferableMatches.length) / deduplicated.length
    : 0;

  let verdict: MatchAssessment['verdict'];
  if (overallMatchPercent >= 60) verdict = 'strong';
  else if (overallMatchPercent >= 35) verdict = 'moderate';
  else if (overallMatchPercent >= 15) verdict = 'low';
  else verdict = 'mismatched';

  const confidence: MatchAssessment['confidence'] =
    deduplicated.length >= 8 ? 'high'
    : deduplicated.length >= 4 ? 'medium'
    : 'low';

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
    contradictedClaims,
    criticalGaps,
  };
}

// ─── Backward-Compat Adapter ──────────────────────────────────────────────────

/**
 * Wraps the new MatchAssessment into the legacy MatchAnalysisResult shape
 * for backward compatibility with existing report rendering components.
 */
export function buildLegacyMatchResult(assessment: MatchAssessment): MatchAnalysisResult {
  const matchingStrengths: MatchingStrength[] = assessment.directMatches.map((m) => ({
    competency: m.jdRequirement.competencySignal,
    evidence: m.candidateEvidence?.sourceText || m.jdRequirement.requirement,
    relevanceScore: m.weightedContribution,
    classification: 'direct_match',
    evidenceStrength: 'confirmed',
    provenance: {
      source: 'resume',
      reference: m.candidateEvidence?.sourceLocation.section || 'UNKNOWN',
      snippet: m.candidateEvidence?.sourceText,
    },
  }));

  const transferableStrengths: MatchingStrength[] = assessment.transferableMatches.map((m) => ({
    competency: m.jdRequirement.competencySignal,
    evidence: m.candidateEvidence?.sourceText || m.jdRequirement.requirement,
    relevanceScore: m.weightedContribution * 0.6,
    classification: 'transferable_match',
    evidenceStrength: 'partial',
    provenance: {
      source: 'resume',
      reference: m.candidateEvidence?.sourceLocation.section || 'UNKNOWN',
      snippet: m.candidateEvidence?.sourceText,
    },
  }));

  const gaps: ActionableGap[] = assessment.missingRequirements.map((m, i) => ({
    gapId: `gap_${i}`,
    requirement: m.jdRequirement.requirement,
    status: 'missing',
    evidenceStrength: 'unverified',
    criticality: m.jdRequirement.strength === 'explicit' ? 'blocking' : 'important',
    recommendation: `Gain experience with ${m.jdRequirement.requirement}`,
    targetedProbeOpportunity: `Ask about ${m.jdRequirement.requirement} experience`,
    priority: m.jdRequirement.strength === 'explicit' ? 'high' : 'medium',
    provenance: {
      source: 'job_description',
      reference: 'JD requirement',
      snippet: m.jdRequirement.sourceText,
    },
  }));

  const blockingGaps = gaps.filter((g) => g.criticality === 'blocking');

  const breakdown: DeterministicScoreBreakdown = {
    requiredSkillsCoverage: assessment.directMatches.length * 5,
    experienceAlignment: assessment.transferableMatches.length * 3,
    competenciesMatch: Math.round(assessment.evidenceCoverage * 25),
    rawScore: assessment.overallMatchPercent,
    blockingPenaltyMultiplier: blockingGaps.length > 3 ? 0.5 : blockingGaps.length > 1 ? 0.7 : 1.0,
    totalScore: assessment.overallMatchPercent,
    confidenceInterval: [
      Math.max(0, assessment.overallMatchPercent - 8),
      Math.min(100, assessment.overallMatchPercent + 8),
    ],
  };

  return {
    matchAssessment: assessment,
    matchPercentage: assessment.overallMatchPercent,
    rawMatchPercentage: assessment.overallMatchPercent,
    qualificationConfidence: assessment.confidence,
    evidenceCoverage: assessment.evidenceCoverage,
    criticalRequirementCoverage:
      assessment.directMatches.filter((m) => m.jdRequirement.strength === 'explicit').length /
      Math.max(1, assessment.requirementMatches.filter((m) => m.jdRequirement.strength === 'explicit').length),
    deterministicBreakdown: breakdown,
    directMatches: matchingStrengths,
    transferableMatches: transferableStrengths,
    matchingStrengths: [...matchingStrengths, ...transferableStrengths],
    gaps,
    blockingGaps,
    actionableGaps: gaps,
    companyAlignmentSummary: `${assessment.directMatches.length} direct matches, ${assessment.transferableMatches.length} transferable, ${assessment.criticalGaps.length} critical gaps.`,
  };
}

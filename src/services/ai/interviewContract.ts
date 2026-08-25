/**
 * Interview Contract Engine — Deterministic Simulation Boundary
 *
 * Builds the immutable contract for an interview session before it begins.
 * Sets bounded question ranges, time budgets, and extracts critical/optional
 * competencies directly from confirmed candidate evidence and JD requirements.
 *
 * Zero AI calls. 100% deterministic TypeScript.
 */

import type { LockedCandidateContext } from '../../types/resume';
import type { JDEvidenceModel } from '../../types/jobDescription';
import type { MatchAssessment } from '../../types/matchAnalysis';
import type { InterviewContract } from '../../types/interview';
import { deriveRoleScopedResumeCompetencies } from './roleScoping';

export function getQuestionBounds(durationSeconds: number): { minQuestions: number; maxQuestions: number } {
  const durationMinutes = Math.round(durationSeconds / 60);
  if (durationMinutes <= 10) {
    return { minQuestions: 4, maxQuestions: 9 };
  }
  if (durationMinutes <= 15) {
    return { minQuestions: 4, maxQuestions: 12 };
  }
  if (durationMinutes <= 20) {
    return { minQuestions: 5, maxQuestions: 15 };
  }
  if (durationMinutes <= 30) {
    return { minQuestions: 6, maxQuestions: 20 };
  }
  return { minQuestions: 8, maxQuestions: 25 };
}

export function calculateTimeBudget(durationSeconds: number): {
  opening: number;
  coreAssessment: number;
  gapProbing: number;
  closing: number;
} {
  const opening = Math.round(durationSeconds * 0.1);
  const coreAssessment = Math.round(durationSeconds * 0.5);
  const gapProbing = Math.round(durationSeconds * 0.3);
  const closing = durationSeconds - (opening + coreAssessment + gapProbing);

  return {
    opening,
    coreAssessment,
    gapProbing,
    closing,
  };
}

export function deriveJDCompetencies(
  jdEvidenceModel: JDEvidenceModel,
  matchAssessment?: MatchAssessment | null
): { criticalCompetencies: string[]; optionalCompetencies: string[] } {
  const criticalSet = new Set<string>();
  const optionalSet = new Set<string>();

  // 1. Critical competencies explicitly defined in JD
  for (const c of jdEvidenceModel.criticalCompetencies || []) {
    if (c.trim()) criticalSet.add(c.trim());
  }

  // 2. Explicit critical skills from JD
  for (const req of jdEvidenceModel.requiredSkills || []) {
    const label = req.competencySignal || req.requirement;
    if (!label) continue;
    if (req.critical || req.strength === 'explicit') {
      criticalSet.add(label.trim());
    } else {
      optionalSet.add(label.trim());
    }
  }

  // 3. Technical requirements & responsibilities
  for (const req of jdEvidenceModel.technicalRequirements || []) {
    const label = req.competencySignal || req.requirement;
    if (label && (req.critical || req.strength === 'explicit')) {
      criticalSet.add(label.trim());
    }
  }
  for (const resp of jdEvidenceModel.responsibilities || []) {
    const label = resp.competencySignal || resp.requirement;
    if (label && (resp.critical || resp.strength === 'explicit')) {
      criticalSet.add(label.trim());
    }
  }

  // 4. Critical gaps identified by match engine
  if (matchAssessment?.criticalGaps) {
    for (const gap of matchAssessment.criticalGaps) {
      if (gap.trim()) criticalSet.add(gap.trim());
    }
  }

  // 5. Preferred skills become optional competencies
  for (const pref of jdEvidenceModel.preferredSkills || []) {
    const label = pref.competencySignal || pref.requirement;
    if (label && !criticalSet.has(label.trim())) {
      optionalSet.add(label.trim());
    }
  }

  for (const comp of jdEvidenceModel.competencies || []) {
    const label = comp.competencySignal || comp.requirement;
    if (label && !criticalSet.has(label.trim())) {
      optionalSet.add(label.trim());
    }
  }

  // Remove overlap
  for (const c of Array.from(criticalSet)) {
    optionalSet.delete(c);
  }

  return {
    criticalCompetencies: Array.from(criticalSet),
    optionalCompetencies: Array.from(optionalSet),
  };
}

export function deriveResumeCompetencies(
  candidateContext?: LockedCandidateContext | null,
  targetRole?: string
): { criticalCompetencies: string[]; optionalCompetencies: string[] } {
  const roleName = targetRole || candidateContext?.evidenceModel?.identity?.role?.value || 'Software Engineer';
  return deriveRoleScopedResumeCompetencies(roleName, candidateContext);
}

/**
 * Builds the complete deterministic InterviewContract.
 */
export function buildInterviewContract(
  sessionId: string,
  durationSeconds: number,
  candidateContext?: LockedCandidateContext | null,
  jdEvidenceModel?: JDEvidenceModel | null,
  matchAssessment?: MatchAssessment | null,
  targetRole?: string
): InterviewContract {
  const isJdMatched = Boolean(
    jdEvidenceModel &&
    ((jdEvidenceModel.requiredSkills && jdEvidenceModel.requiredSkills.length > 0) ||
      (jdEvidenceModel.technicalRequirements && jdEvidenceModel.technicalRequirements.length > 0) ||
      (jdEvidenceModel.responsibilities && jdEvidenceModel.responsibilities.length > 0) ||
      (jdEvidenceModel.criticalCompetencies && jdEvidenceModel.criticalCompetencies.length > 0))
  );

  const mode: 'jd_matched' | 'resume_grounded' = isJdMatched ? 'jd_matched' : 'resume_grounded';

  const { criticalCompetencies, optionalCompetencies } = isJdMatched && jdEvidenceModel
    ? deriveJDCompetencies(jdEvidenceModel, matchAssessment)
    : deriveResumeCompetencies(candidateContext, targetRole);

  const { minQuestions, maxQuestions } = getQuestionBounds(durationSeconds);
  const timeBudget = calculateTimeBudget(durationSeconds);

  return {
    sessionId,
    mode,
    durationSeconds,
    criticalCompetencies,
    optionalCompetencies,
    minQuestions,
    maxQuestions,
    maxFollowUpsPerTopic: 2,
    minimumEvidenceTargets: Math.max(3, minQuestions - 1),
    timeBudget,
    createdAt: new Date().toISOString(),
  };
}

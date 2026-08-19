/**
 * Interview Brain — Deterministic Orchestrator
 *
 * Directs the interview strategy by:
 * 1. Selecting high-information-gain objectives (first objective, next objective).
 * 2. Maintaining the candidate's verified competency map across questions.
 * 3. Deciding when to probe deeper vs. transition to a new objective.
 *
 * Deterministic — LLM only handles conversational phrasing, not interview decisions.
 */

import type { LockedCandidateContext } from '../../types/resume';
import type { JDEvidenceModel } from '../../types/jobDescription';
import type { MatchAssessment } from '../../types/matchAnalysis';
import type { InterviewObjective, QuestionFeedback } from '../../types/interview';

export interface BrainState {
  currentObjective: InterviewObjective | null;
  completedObjectives: InterviewObjective[];
  testedCompetencies: Record<string, { score: number; signalsObserved: string[] }>;
  remainingGaps: string[];
  turnsRemaining: number;
}

export const interviewBrain = {
  /**
   * Deterministically selects the opening interview objective.
   *
   * Strategy:
   * 1. If candidate has confirmed recent work experience or flagship projects matching JD competencies,
   *    target 'verify_strength' to calibrate actual ownership, depth, and metrics.
   * 2. Otherwise, target the top explicit competency from the JD as 'test_critical_competency'.
   */
  selectFirstObjective(
    lockedContext: LockedCandidateContext,
    jdModel?: JDEvidenceModel | null,
    matchAssessment?: MatchAssessment | null,
    targetRole?: string
  ): InterviewObjective {
    const evidence = lockedContext.evidenceModel;
    const directMatches = matchAssessment?.directMatches || [];
    const criticalCompetencies = jdModel?.criticalCompetencies || [];
    const topRole = targetRole || jdModel?.role || 'the position';

    // 1. Check if candidate has a strong direct match project or work experience
    if (directMatches.length > 0) {
      const topMatch = directMatches[0];
      const matchEvidence = topMatch.candidateEvidence;
      const competency = topMatch.jdRequirement.competencySignal || topMatch.jdRequirement.requirement;

      return {
        id: 'obj_1',
        order: 1,
        type: 'verify_strength',
        targetCompetency: competency,
        focusRequirement: topMatch.jdRequirement.requirement,
        focusEvidenceSummary: matchEvidence ? `"${matchEvidence.value}" (${matchEvidence.sourceLocation.section})` : undefined,
        reasoning: `Candidate's confirmed resume contains direct evidence for ${competency}. Probe depth, specific contributions, and outcomes.`,
        lookForSignals: [
          'Quantified impact and clear ownership boundaries',
          'Technical/architectural or strategic rationale behind decisions',
          'Concrete problem solving without generalities',
        ],
        redFlagSignals: [
          'Vague descriptions of team achievements without personal contribution',
          'Inability to recall specific constraints or metrics',
          'Contradictions with confirmed resume text',
        ],
      };
    }

    // 2. Check candidate projects
    if (evidence.projects.length > 0) {
      const topProject = evidence.projects[0];
      const projTech = topProject.technologies.map(t => t.value).join(', ');

      return {
        id: 'obj_1',
        order: 1,
        type: 'verify_strength',
        targetCompetency: criticalCompetencies[0] || 'Technical & Project Execution',
        focusRequirement: `Flagship project: ${topProject.name.value}`,
        focusEvidenceSummary: `Project "${topProject.name.value}" using ${projTech || 'core technologies'}`,
        reasoning: `Explore candidate's flagship project to understand their engineering/product execution bar.`,
        lookForSignals: [
          'Clear articulation of the problem and technical architecture',
          'Measurable outcomes and trade-offs made during delivery',
        ],
        redFlagSignals: [
          'Surface-level overview without architectural depth',
          'Missing explanation of personal technical responsibilities',
        ],
      };
    }

    // 3. Fallback: First critical competency from JD
    const primaryCompetency = criticalCompetencies[0] || 'Core Domain Competency';
    return {
      id: 'obj_1',
      order: 1,
      type: 'test_critical_competency',
      targetCompetency: primaryCompetency,
      focusRequirement: jdModel?.requiredSkills[0]?.requirement || `Core competencies for ${topRole}`,
      reasoning: `Assess candidate's fundamental approach to ${primaryCompetency} required for ${topRole}.`,
      lookForSignals: [
        'Structured problem-solving framework',
        'Demonstrated domain best practices',
      ],
      redFlagSignals: [
        'Generic textbook answers with no practical grounding',
      ],
    };
  },

  /**
   * Deterministically decides the next objective after an answer is evaluated.
   */
  selectNextObjective(
    previousObjective: InterviewObjective,
    latestFeedback: QuestionFeedback,
    _lockedContext: LockedCandidateContext,
    jdModel?: JDEvidenceModel | null,
    matchAssessment?: MatchAssessment | null,
    allObjectivesCompleted: InterviewObjective[] = []
  ): { nextObjective: InterviewObjective; isFollowUp: boolean } {

    // 1. If previous answer had critical information gaps or unverified claims, issue an immediate follow-up probe
    if (latestFeedback.shouldFollowUp && latestFeedback.followUpReasonCode) {
      return {
        isFollowUp: true,
        nextObjective: {
          id: `obj_${previousObjective.order}_probe`,
          order: previousObjective.order,
          type: 'clarify_evidence',
          targetCompetency: previousObjective.targetCompetency,
          focusRequirement: previousObjective.focusRequirement,
          reasoning: `Candidate's answer was incomplete (${latestFeedback.followUpReasonCode}). Follow up to get concrete data or verify depth.`,
          lookForSignals: [
            'Direct clarification of the previous missing signal',
            'Specific metrics or architectural details',
          ],
          redFlagSignals: [
            'Continued evasion or repeating the same vague summary',
          ],
        },
      };
    }

    // 2. Next: Probe a critical gap if one exists in MatchAssessment
    const criticalGaps = matchAssessment?.criticalGaps || [];
    const usedCompetencies = new Set(allObjectivesCompleted.map(o => o.targetCompetency.toLowerCase()));
    usedCompetencies.add(previousObjective.targetCompetency.toLowerCase());

    const unaddressedGap = criticalGaps.find(gap => !usedCompetencies.has(gap.toLowerCase()));
    if (unaddressedGap) {
      const nextOrder = previousObjective.order + 1;
      return {
        isFollowUp: false,
        nextObjective: {
          id: `obj_${nextOrder}`,
          order: nextOrder,
          type: 'probe_gap',
          targetCompetency: unaddressedGap,
          focusRequirement: unaddressedGap,
          reasoning: `Resume lacks evidence for required qualification "${unaddressedGap}". Probe transferable experience or conceptual depth.`,
          lookForSignals: [
            'Transferable knowledge from adjacent domains',
            'Solid theoretical understanding and structured thinking',
          ],
          redFlagSignals: [
            'Unfounded claims not backed by practical knowledge',
          ],
        },
      };
    }

    // 3. Next: Test remaining critical competencies from JD
    const jdCompetencies = jdModel?.criticalCompetencies || [];
    const remainingCompetency = jdCompetencies.find(c => !usedCompetencies.has(c.toLowerCase()));
    const nextOrder = previousObjective.order + 1;

    if (remainingCompetency) {
      return {
        isFollowUp: false,
        nextObjective: {
          id: `obj_${nextOrder}`,
          order: nextOrder,
          type: 'test_critical_competency',
          targetCompetency: remainingCompetency,
          focusRequirement: remainingCompetency,
          reasoning: `Evaluate candidate proficiency in core requirement: ${remainingCompetency}.`,
          lookForSignals: [
            'Senior-level technical or strategic decision making',
            'Demonstrated cross-functional leadership and execution',
          ],
          redFlagSignals: [
            'Narrow tactical view missing business or engineering trade-offs',
          ],
        },
      };
    }

    // 4. Default: Synthesize / Case / System Level Probe
    return {
      isFollowUp: false,
      nextObjective: {
        id: `obj_${nextOrder}`,
        order: nextOrder,
        type: 'explore_domain',
        targetCompetency: 'End-to-End System & Cross-Functional Alignment',
        reasoning: `Assess candidate's ability to operate at scale, handle ambiguity, and manage stakeholder trade-offs.`,
        lookForSignals: [
          'High agency and structured communication under pressure',
        ],
        redFlagSignals: [
          'Blaming external constraints without proposing solutions',
        ],
      },
    };
  },
};

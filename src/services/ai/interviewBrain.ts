/**
 * Interview Brain — Deterministic Orchestrator & Objective Decision Engine
 *
 * Implements the core intelligence layer:
 *   "What does InterviewPilot need to learn next?"
 *
 * Decision rules:
 *   Rule 1: Remaining time <= 90s -> Closing
 *   Rule 2: Critical competency with insufficient evidence -> Prioritize highest information gain
 *   Rule 3: Weak / incomplete answer AND follow-up budget available -> Probe same competency
 *   Rule 4: Specific missing signals -> Targeted evidence objective
 *   Rule 5: All critical competencies >= provisional -> Highest-priority optional competency
 *   Rule 6: All important competencies reliable -> Move to closing (Zero filler questions)
 *
 * Zero AI calls in strategy decisions. 100% deterministic TypeScript computation.
 */

import type {
  InterviewContract,
  CompetencyMap,
  QuestionFeedback,
  InterviewObjective,
  ConversationTurn,
} from '../../types/interview';
import type { LockedCandidateContext } from '../../types/resume';
import type { JDEvidenceModel } from '../../types/jobDescription';
import type { MatchAssessment } from '../../types/matchAnalysis';
import { getExpectedSignalsForType, updateCompetencyState } from './competencyMap';
import { deriveConversationIntent } from './conversationIntent';
import { scopeResumeEvidenceToRole } from './roleScoping';

export interface BrainDecisionResult {
  nextObjective: InterviewObjective;
  ruleTriggered: string;
  reason: string;
}

/**
 * Deterministically checks if candidate has confirmed resume evidence for a given competency.
 */
export function hasConfirmedResumeEvidence(
  competency: string,
  candidateContext?: LockedCandidateContext | null
): { hasEvidence: boolean; snippet?: string } {
  if (!candidateContext?.evidenceModel) return { hasEvidence: false };

  const compLower = competency.toLowerCase();
  const model = candidateContext.evidenceModel;

  // Check projects
  for (const p of model.projects || []) {
    const pName = (p.name?.value || '').toLowerCase();
    const pTech = (p.technologies || []).map((t) => (t.value || '').toLowerCase()).join(' ');
    if (pName.includes(compLower) || compLower.includes(pName) || pTech.includes(compLower)) {
      return {
        hasEvidence: true,
        snippet: `Project: ${p.name?.value || ''} (${p.technologies?.map((t) => t.value).join(', ')})`,
      };
    }
  }

  // Check work experience
  for (const exp of model.workExperience || []) {
    const role = (exp.role?.value || '').toLowerCase();
    const bullets = (exp.bullets || []).map((b) => (b.value || '').toLowerCase()).join(' ');
    if (role.includes(compLower) || bullets.includes(compLower)) {
      return {
        hasEvidence: true,
        snippet: `Experience: ${exp.role?.value || ''} at ${exp.company?.value || ''}`,
      };
    }
  }

  // Check skills
  const skills = model.skills || ({} as any);
  const allSkills = [
    ...(Array.isArray(skills.technical) ? skills.technical : []),
    ...(Array.isArray(skills.product) ? skills.product : []),
    ...(Array.isArray(skills.domain) ? skills.domain : []),
  ];

  for (const s of allSkills) {
    const val = (s.value || '').toLowerCase();
    if (val === compLower || (compLower.length > 4 && val.includes(compLower))) {
      return { hasEvidence: true, snippet: `Skill: ${s.value}` };
    }
  }

  return { hasEvidence: false };
}

/**
 * Deterministic difficulty adaptation based on evaluation score history.
 */
export function computeAdaptiveDifficulty(
  consecutiveScores: number[] = []
): 'foundational' | 'intermediate' | 'advanced' {
  if (consecutiveScores.length >= 2) {
    const lastTwo = consecutiveScores.slice(-2);
    if (lastTwo.every((s) => s >= 8.0)) return 'advanced';
    if (lastTwo.every((s) => s < 4.0)) return 'foundational';
  }
  return 'intermediate';
}

/**
 * Calculates Information Gain score for candidate competencies.
 */
export function calculateInformationGain(
  competencyName: string,
  map: CompetencyMap
): number {
  const state = map[competencyName];
  if (!state) return 0;

  let score = 0;

  // 1. Criticality weight
  score += state.importance === 'critical' ? 100 : 40;

  // 2. Assessment deficit
  if (state.status === 'untested') score += 80;
  else if (state.assessmentReliability === 'insufficient') score += 60;
  else if (state.assessmentReliability === 'provisional') score += 20;
  else score -= 100; // already reliable -> penalize

  // 3. Missing signals boost
  score += state.missingSignals.length * 15;

  // 4. Repeated questions penalty
  score -= state.questionsAsked * 30;

  return score;
}

export const interviewBrain = {
  /**
   * Deterministically selects the opening interview objective (Question 1).
   */
  selectOpeningObjective(
    contract: InterviewContract,
    candidateContext?: LockedCandidateContext | null,
    jdEvidenceModel?: JDEvidenceModel | null,
    matchAssessment?: MatchAssessment | null,
    targetRole?: string
  ): InterviewObjective {
    const criticalCompetencies = contract.criticalCompetencies || [];
    const directMatches = matchAssessment?.directMatches || [];

    // 1. If candidate has a verified direct match, start with resume deep dive
    if (directMatches.length > 0 && candidateContext) {
      const topMatch = directMatches[0];
      const comp = topMatch.jdRequirement.competencySignal || topMatch.jdRequirement.requirement;
      const evidence = topMatch.candidateEvidence;

      return {
        targetCompetency: comp,
        questionType: 'resume_deep_dive',
        intent: `Assess candidate's flagship ownership, technical decisions, and deliverable metrics grounded in confirmed experience.`,
        useResumeGrounding: true,
        difficulty: 'intermediate',
        timeAllocationSeconds: Math.round(contract.timeBudget.opening),
        isFollowUp: false,
        expectedSignals: getExpectedSignalsForType('resume_deep_dive'),
        focusRequirement: topMatch.jdRequirement.requirement,
        focusEvidenceSummary: evidence ? `"${evidence.sourceText}" (${evidence.sourceLocation.section})` : undefined,
      };
    }

    // 2. If candidate has confirmed direct projects in the target role scope, ground in top direct project
    const scopedEvidence = candidateContext?.evidenceModel && targetRole
      ? scopeResumeEvidenceToRole(targetRole, candidateContext.evidenceModel)
      : null;

    const directProjects = scopedEvidence
      ? scopedEvidence.directProjects
      : (candidateContext?.evidenceModel.projects || []);

    if (directProjects.length > 0 && candidateContext) {
      const topProj = directProjects[0];
      const targetComp = criticalCompetencies[0] || 'Technical & Domain Execution';

      return {
        targetCompetency: targetComp,
        questionType: 'resume_deep_dive',
        intent: `Assess individual ownership, execution decomposition, and trade-offs for project ${topProj.name?.value || ''}.`,
        useResumeGrounding: true,
        difficulty: 'intermediate',
        timeAllocationSeconds: Math.round(contract.timeBudget.opening),
        isFollowUp: false,
        expectedSignals: getExpectedSignalsForType('resume_deep_dive'),
        focusRequirement: `Flagship project: ${topProj.name?.value || ''}`,
        focusEvidenceSummary: `Project "${topProj.name?.value || ''}"`,
      };
    }

    // 3. Fallback: First critical competency for target role (behavioral / exploratory approach without assuming experience)
    const firstComp = criticalCompetencies[0] || 'Core Domain Competency';
    const hasEvidence = hasConfirmedResumeEvidence(firstComp, candidateContext);

    return {
      targetCompetency: firstComp,
      questionType: jdEvidenceModel ? 'product_sense' : 'behavioral',
      intent: `Assess candidate approach, foundational principles, and methodologies regarding ${firstComp}.`,
      useResumeGrounding: hasEvidence.hasEvidence,
      difficulty: 'intermediate',
      timeAllocationSeconds: Math.round(contract.timeBudget.opening),
      isFollowUp: false,
      expectedSignals: getExpectedSignalsForType(jdEvidenceModel ? 'product_sense' : 'behavioral'),
      focusRequirement: firstComp,
      focusEvidenceSummary: hasEvidence.snippet,
    };
  },

  /**
   * Deterministically selects the next interview objective following an answer evaluation.
   */
  selectNextObjective(
    contract: InterviewContract,
    competencyMap: CompetencyMap,
    lastEvaluation?: QuestionFeedback | null,
    _recentTurns: ConversationTurn[] = [],
    remainingSeconds = 600,
    consecutiveScores: number[] = [],
    candidateContext?: LockedCandidateContext | null
  ): BrainDecisionResult {
    const difficulty = computeAdaptiveDifficulty(consecutiveScores);

    // ─── RULE 1: Time Limit Expiry (<= 90 seconds) ───────────────────────────
    if (remainingSeconds <= 90) {
      return {
        ruleTriggered: 'RULE_1_TIME_EXPIRY',
        reason: `Remaining session time is ${remainingSeconds}s (<= 90s). Concluding interview.`,
        nextObjective: {
          targetCompetency: 'Interview Wrap-Up & Synthesis',
          questionType: 'closing',
          intent: 'Deliver a gracious closing thanking candidate and transitioning to evaluation report synthesis.',
          useResumeGrounding: false,
          difficulty,
          timeAllocationSeconds: remainingSeconds,
          isFollowUp: false,
          expectedSignals: ['closing'],
        },
      };
    }

    // ─── RULE 3 & 4: Weak / Incomplete Answer Follow-Up Probe ────────────────
    if (lastEvaluation) {
      // Find which competency this question addressed
      let targetCompName: string | undefined;
      for (const [comp, state] of Object.entries(competencyMap)) {
        if (state.questionsAsked > 0 && state.assessmentReliability !== 'reliable') {
          targetCompName = comp;
          break;
        }
      }

      if (targetCompName) {
        const state = competencyMap[targetCompName];
        const canFollowUp = state && state.followUpsUsed < contract.maxFollowUpsPerTopic;
        const isWeakOrPartial =
          lastEvaluation.shouldFollowUp ||
          lastEvaluation.answerClassification === 'partially_answered' ||
          lastEvaluation.answerClassification === 'weak' ||
          lastEvaluation.relevanceGate?.status === 'partially_answered' ||
          state.missingSignals.length > 0;

        if (canFollowUp && isWeakOrPartial && state.assessmentReliability === 'insufficient') {
          const missingSnippet = state.missingSignals.length > 0
            ? state.missingSignals.join(', ')
            : lastEvaluation.followUpReasonCode || 'measurable outcome or trade-off context';

          const hasEvidence = hasConfirmedResumeEvidence(targetCompName, candidateContext);

          return {
            ruleTriggered: 'RULE_3_WEAK_ANSWER_FOLLOW_UP',
            reason: `Previous answer for ${targetCompName} had insufficient evidence (missing: ${missingSnippet}). Follow-up probe used ${state.followUpsUsed + 1}/${contract.maxFollowUpsPerTopic}.`,
            nextObjective: {
              targetCompetency: targetCompName,
              questionType: 'clarification',
              intent: `Probe specifically for missing evidence (${missingSnippet}) regarding ${targetCompName}.`,
              useResumeGrounding: hasEvidence.hasEvidence,
              difficulty,
              timeAllocationSeconds: 120,
              isFollowUp: true,
              followUpReason: `Missing: ${missingSnippet}`,
              expectedSignals: state.missingSignals.length > 0 ? state.missingSignals : ['decision rationale', 'metric lift'],
              focusEvidenceSummary: hasEvidence.snippet,
            },
          };
        }
      }
    }

    // ─── RULE 2: Critical Competencies with Insufficient Evidence ────────────
    const criticalCandidates = Object.entries(competencyMap)
      .filter(([_, state]) => state.importance === 'critical' && state.assessmentReliability === 'insufficient')
      .map(([comp, _]) => ({
        competency: comp,
        infoGain: calculateInformationGain(comp, competencyMap),
      }))
      .sort((a, b) => b.infoGain - a.infoGain);

    if (criticalCandidates.length > 0 && criticalCandidates[0].infoGain > 0) {
      const topComp = criticalCandidates[0].competency;
      const state = competencyMap[topComp];
      const hasEvidence = hasConfirmedResumeEvidence(topComp, candidateContext);

      const qType = hasEvidence.hasEvidence
        ? 'resume_deep_dive'
        : topComp.toLowerCase().includes('data') || topComp.toLowerCase().includes('metric')
        ? 'analytical'
        : topComp.toLowerCase().includes('system') || topComp.toLowerCase().includes('architect')
        ? 'system_design'
        : contract.mode === 'jd_matched'
        ? 'product_sense'
        : 'behavioral';

      return {
        ruleTriggered: 'RULE_2_CRITICAL_INSUFFICIENT',
        reason: `Critical competency ${topComp} is ${state.status} with reliability ${state.assessmentReliability} (InfoGain: ${criticalCandidates[0].infoGain}).`,
        nextObjective: {
          targetCompetency: topComp,
          questionType: qType,
          intent: `Assess ${topComp} to collect reliable evidence because current assessment is ${state.assessmentReliability}.`,
          useResumeGrounding: hasEvidence.hasEvidence,
          difficulty,
          timeAllocationSeconds: 180,
          isFollowUp: false,
          expectedSignals: getExpectedSignalsForType(qType),
          focusRequirement: topComp,
          focusEvidenceSummary: hasEvidence.snippet,
        },
      };
    }

    // ─── RULE 5: Optional Competencies ───────────────────────────────────────
    const optionalCandidates = Object.entries(competencyMap)
      .filter(([_, state]) => state.importance === 'optional' && state.status === 'untested')
      .map(([comp, _]) => ({
        competency: comp,
        infoGain: calculateInformationGain(comp, competencyMap),
      }))
      .sort((a, b) => b.infoGain - a.infoGain);

    if (optionalCandidates.length > 0) {
      const topOpt = optionalCandidates[0].competency;
      const hasEvidence = hasConfirmedResumeEvidence(topOpt, candidateContext);

      return {
        ruleTriggered: 'RULE_5_OPTIONAL_COMPETENCY',
        reason: `All critical competencies are at least provisional. Testing optional competency ${topOpt}.`,
        nextObjective: {
          targetCompetency: topOpt,
          questionType: 'case',
          intent: `Assess secondary competency ${topOpt}.`,
          useResumeGrounding: hasEvidence.hasEvidence,
          difficulty,
          timeAllocationSeconds: 150,
          isFollowUp: false,
          expectedSignals: getExpectedSignalsForType('case'),
          focusRequirement: topOpt,
          focusEvidenceSummary: hasEvidence.snippet,
        },
      };
    }

    // ─── RULE 6: All Important Competencies Reliable -> Conclude ─────────────
    return {
      ruleTriggered: 'RULE_6_EVIDENCE_COMPLETE_CLOSING',
      reason: 'All critical competencies have reliable evidence. Concluding interview early without filler questions.',
      nextObjective: {
        targetCompetency: 'Interview Wrap-Up & Synthesis',
        questionType: 'closing',
        intent: 'Deliver gracious interview closing and conclude.',
        useResumeGrounding: false,
        difficulty,
        timeAllocationSeconds: Math.min(90, remainingSeconds),
        isFollowUp: false,
        expectedSignals: ['closing'],
      },
    };
  },
};

/**
 * Phase 4: Master Brain Updater after Candidate Answer Evaluation.
 * Deterministically applies evidence to competency map, updates score history,
 * derives conversational intent, and generates next objective.
 */
export interface BrainUpdateResult {
  updatedCompetencyMap: CompetencyMap;
  nextObjective: InterviewObjective;
  intent: import('../../types/interview').ConversationIntent;
  decisionRule: string;
  decisionReason: string;
  meaningfulScores: number[];
}

export function updateBrainAfterEvaluation(
  contract: InterviewContract,
  competencyMap: CompetencyMap,
  evaluation: QuestionFeedback,
  currentObjective: InterviewObjective,
  recentTurns: ConversationTurn[] = [],
  remainingSeconds = 600,
  scoreHistory: number[] = [],
  candidateContext?: LockedCandidateContext | null,
  currentQuestion?: import('../../types/interview').Question
): BrainUpdateResult {
  const classification = (evaluation.answerClassification || '') as string;
  let updatedCompetencyMap = { ...competencyMap };
  const meaningfulScores = [...scoreHistory];

  // 1. Handle non-assessable conversational requests
  if (classification === 'repeat_request') {
    const intent = deriveConversationIntent(evaluation, currentObjective, currentQuestion);
    return {
      updatedCompetencyMap,
      nextObjective: currentObjective,
      intent,
      decisionRule: 'REPEAT_REQUEST_HOLD',
      decisionReason: 'Candidate requested question repetition. Maintaining current objective without score impact.',
      meaningfulScores,
    };
  }

  // 2. Update competency map for substantive or attempted responses
  const targetComp = currentObjective.targetCompetency;
  if (targetComp && updatedCompetencyMap[targetComp]) {
    updatedCompetencyMap[targetComp] = updateCompetencyState(
      updatedCompetencyMap[targetComp],
      evaluation,
      currentObjective,
      evaluation.whatWorked?.join(' ') || ''
    );
  }

  // 3. Track meaningful score history (ignore irrelevant, uncertain, refusal, repeat, clarification)
  const isIgnoredFromDifficulty =
    classification === 'repeat_request' ||
    classification === 'clarification_request' ||
    classification === 'irrelevant' ||
    classification === 'uncertain' ||
    classification === 'refusal';

  if (!isIgnoredFromDifficulty && evaluation.overallScore !== undefined) {
    meaningfulScores.push(evaluation.overallScore);
  }

  // 4. Query InterviewBrain for next objective
  const brainDecision = interviewBrain.selectNextObjective(
    contract,
    updatedCompetencyMap,
    evaluation,
    recentTurns,
    remainingSeconds,
    meaningfulScores,
    candidateContext
  );

  const intent = deriveConversationIntent(
    evaluation,
    brainDecision.nextObjective,
    currentQuestion,
    remainingSeconds <= 90
  );

  return {
    updatedCompetencyMap,
    nextObjective: brainDecision.nextObjective,
    intent,
    decisionRule: brainDecision.ruleTriggered,
    decisionReason: brainDecision.reason,
    meaningfulScores,
  };
}

import { CandidateProfile } from '../../types/resume';
import { JobProfile } from '../../types/jobDescription';
import { CompanyResearchData } from '../../types/companyResearch';
import { MatchAnalysisResult, MatchingStrength, ActionableGap } from '../../types/matchAnalysis';

export const matchAnalysisService = {
  /**
   * Computes deterministic match score, matching strengths, and actionable gap probe opportunities.
   */
  computeMatch(
    candidate: CandidateProfile,
    job: JobProfile,
    company?: CompanyResearchData | null
  ): MatchAnalysisResult {
    const candidateSkillsLower = (candidate.skills || []).map((s) => s.toLowerCase());
    const candidateFullText = [
      candidate.summary || '',
      ...(candidate.skills || []),
      ...(candidate.strengths || []),
      ...(candidate.experience || []).flatMap((e) => [e.role, e.company, ...(e.highlights || [])]),
      ...(candidate.projects || []).flatMap((p) => [p.name, p.description, ...(p.technologies || [])]),
    ]
      .join(' ')
      .toLowerCase();

    const requiredSkills = job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : ['Core Problem Solving', 'Communication'];
    const competencies = job.competencies && job.competencies.length > 0 ? job.competencies : ['Cross-functional Leadership', 'Execution'];

    const matchingStrengths: MatchingStrength[] = [];
    const actionableGaps: ActionableGap[] = [];

    // 1. Evaluate Required Skills (45 points max)
    let matchedSkillsCount = 0;
    requiredSkills.forEach((skill, idx) => {
      const skillLower = skill.toLowerCase();
      const directMatch = candidateSkillsLower.some((cs) => cs.includes(skillLower) || skillLower.includes(cs));
      const textMatch = candidateFullText.includes(skillLower);

      if (directMatch || textMatch) {
        matchedSkillsCount++;
        // Find evidence
        const matchedProject = candidate.projects?.find((p) =>
          (p.description + (p.technologies || []).join(' ')).toLowerCase().includes(skillLower)
        );
        const evidence = matchedProject
          ? `Demonstrated in ${matchedProject.name}: ${matchedProject.description.slice(0, 80)}...`
          : `Directly evidenced in skills profile and past experience highlights.`;

        matchingStrengths.push({
          competency: skill,
          evidence,
          relevanceScore: 90,
        });
      } else {
        actionableGaps.push({
          gapId: `gap_req_${idx}`,
          requirement: skill,
          status: 'unproven_on_resume',
          recommendation: `Assess candidate's practical familiarity with ${skill} and related domain trade-offs.`,
          targetedProbeOpportunity: `Ask candidate how they have approached ${skill} in past initiatives and how they handle related failure modes.`,
          priority: 'high',
        });
      }
    });

    const requiredSkillsCoverage = Math.round((matchedSkillsCount / Math.max(1, requiredSkills.length)) * 45);

    // 2. Evaluate Experience Depth (30 points max)
    const experienceCount = candidate.experience?.length || 0;
    const projectsCount = candidate.projects?.length || 0;
    const experienceAlignment = Math.min(30, Math.round(15 + Math.min(experienceCount * 4, 10) + Math.min(projectsCount * 3, 5)));

    // 3. Evaluate Competencies (25 points max)
    let matchedCompetenciesCount = 0;
    competencies.forEach((comp, idx) => {
      const compLower = comp.toLowerCase();
      const words = compLower.split(' ').filter((w) => w.length > 3);
      const isMatched = words.some((w) => candidateFullText.includes(w));

      if (isMatched) {
        matchedCompetenciesCount++;
        matchingStrengths.push({
          competency: comp,
          evidence: `Evidenced across project deliverables and leadership deliverables.`,
          relevanceScore: 85,
        });
      } else {
        actionableGaps.push({
          gapId: `gap_comp_${idx}`,
          requirement: comp,
          status: 'growth_opportunity',
          recommendation: `Evaluate ${comp} through an open-ended situational scenario.`,
          targetedProbeOpportunity: `Present a live case evaluating ${comp} under resource constraints.`,
          priority: 'medium',
        });
      }
    });

    const competenciesMatch = Math.round((matchedCompetenciesCount / Math.max(1, competencies.length)) * 25);
    const totalScore = Math.min(96, Math.max(45, requiredSkillsCoverage + experienceAlignment + competenciesMatch));

    // Company alignment summary
    const companyAlignmentSummary = company?.companyName
      ? `Candidate brings strong foundation for ${company.companyName}'s ${job.role} opening. Key verified focus is connecting past deliverables to ${company.products?.[0] || 'core platforms'}.`
      : `Candidate demonstrates solid technical and strategic baseline for the ${job.role} position.`;

    return {
      matchPercentage: totalScore,
      deterministicBreakdown: {
        requiredSkillsCoverage,
        experienceAlignment,
        competenciesMatch,
        totalScore,
      },
      matchingStrengths: matchingStrengths.slice(0, 5),
      actionableGaps,
      companyAlignmentSummary,
    };
  },
};

import { CandidateProfile } from '../../types/resume';
import { JobProfile } from '../../types/jobDescription';
import { CompanyResearchData } from '../../types/companyResearch';
import { MatchAnalysisResult, MatchingStrength, ActionableGap, QualificationConfidence } from '../../types/matchAnalysis';

function parseRequiredYears(expReqText?: string): number {
  if (!expReqText) return 2;
  const match = expReqText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (match) return parseInt(match[1], 10);
  if (/senior|lead|staff|principal/i.test(expReqText)) return 5;
  if (/entry|junior|fresher|graduate|intern/i.test(expReqText)) return 0;
  return 2;
}

function parseCandidateYears(candidate: CandidateProfile): number {
  const experiences = candidate.experience || [];
  if (experiences.length === 0) return 0;

  let totalMonths = 0;
  for (const exp of experiences) {
    const duration = exp.duration || '';
    if (/intern/i.test(exp.role) || /intern/i.test(duration)) {
      totalMonths += 3;
      continue;
    }

    const yearMatches = duration.match(/\b(20\d\d|19\d\d)\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const y1 = parseInt(yearMatches[0], 10);
      const y2 = parseInt(yearMatches[1], 10);
      totalMonths += Math.max(6, (y2 - y1) * 12);
    } else if (yearMatches && yearMatches.length === 1 && /present|current/i.test(duration)) {
      const y1 = parseInt(yearMatches[0], 10);
      const currentYear = new Date().getFullYear();
      totalMonths += Math.max(6, (currentYear - y1) * 12);
    } else {
      totalMonths += 12;
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

function calculateDomainRelevance(candidate: CandidateProfile, targetRole: string): number {
  const targetLower = (targetRole || '').toLowerCase();
  const targetWords = targetLower.split(/[\s/,-]+/).filter((w) => w.length > 2);

  const candidateText = [
    candidate.summary || '',
    ...(candidate.experience || []).map((e) => e.role),
    ...(candidate.skills || []),
    ...(candidate.projects || []).map((p) => p.name),
  ].join(' ').toLowerCase();

  const isSecurityRole = /cyber|security|soc|infosec|penetration|siem|vulnerability/i.test(targetLower);
  const isProductRole = /product\s+manager|pm|product\s+owner/i.test(targetLower);

  const candidateIsPM = /product\s+manager|associate\s+pm|product\s+management|user\s+stories|wireframing|figma/i.test(candidateText);
  const candidateIsSecurity = /security|cyber|penetration|firewall|siem|splunk|soc|vulnerability/i.test(candidateText);

  if (isSecurityRole && candidateIsPM && !candidateIsSecurity) {
    return 0.05;
  }
  if (isProductRole && !candidateIsPM && candidateIsSecurity) {
    return 0.15;
  }

  let matchedWordCount = 0;
  for (const word of targetWords) {
    if (candidateText.includes(word)) {
      matchedWordCount++;
    }
  }

  return Math.min(1.0, Math.max(0.1, matchedWordCount / Math.max(1, targetWords.length)));
}

export const matchAnalysisService = {
  /**
   * Computes evidence-grounded 45/30/25 match score with Critical Requirement Blocking Gates.
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
      ...(candidate.certifications || []),
      ...(candidate.achievements || []),
      ...(candidate.experience || []).flatMap((e) => [e.role, e.company, ...(e.highlights || [])]),
      ...(candidate.projects || []).flatMap((p) => [p.name, p.description, ...(p.technologies || [])]),
    ]
      .join(' ')
      .toLowerCase();

    const requiredSkills = job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : ['Core Technical Problem Solving'];
    const competencies = job.competencies && job.competencies.length > 0 ? job.competencies : ['Domain Execution'];
    const reqYears = parseRequiredYears(job.experienceRequirements);
    const candidateYears = parseCandidateYears(candidate);
    const domainRelevance = calculateDomainRelevance(candidate, job.role);

    const directMatches: MatchingStrength[] = [];
    const transferableMatches: MatchingStrength[] = [];
    const gaps: ActionableGap[] = [];
    const blockingGaps: ActionableGap[] = [];

    // 1. Evaluate Hard Skills (45 max points)
    let matchedSkillsCount = 0;
    requiredSkills.forEach((skill, idx) => {
      const skillLower = skill.toLowerCase().trim();
      const directMatch = candidateSkillsLower.some((cs) => cs === skillLower || (cs.length > 3 && skillLower.includes(cs)));
      const textMatch = candidateFullText.includes(skillLower);

      if (directMatch || textMatch) {
        matchedSkillsCount++;
        const matchedProject = candidate.projects?.find((p) =>
          (p.description + ' ' + (p.technologies || []).join(' ')).toLowerCase().includes(skillLower)
        );
        const evidence = matchedProject
          ? `Evidenced in project ${matchedProject.name}: ${matchedProject.description.slice(0, 80)}...`
          : `Directly evidenced in verified skills profile.`;

        directMatches.push({
          competency: skill,
          evidence,
          relevanceScore: 90,
          classification: 'direct_match',
          evidenceStrength: matchedProject ? 'confirmed' : 'partial',
          provenance: {
            source: 'resume',
            reference: matchedProject ? `Projects → ${matchedProject.name}` : 'Skills Profile',
            snippet: skill,
          },
        });
      } else {
        const isCriticalHardSkill = idx < 2 || /security|siem|kernel|architecture|algorithm/i.test(skillLower);
        const gapItem: ActionableGap = {
          gapId: `gap_req_${idx}`,
          requirement: skill,
          status: 'missing',
          evidenceStrength: 'unverified',
          criticality: isCriticalHardSkill ? 'blocking' : 'important',
          recommendation: `Assess candidate's practical familiarity with ${skill} and domain trade-offs.`,
          targetedProbeOpportunity: `Ask candidate if they have any unlisted hands-on experience or coursework in ${skill}.`,
          priority: isCriticalHardSkill ? 'high' : 'medium',
          provenance: {
            source: 'job_description',
            reference: `Required Skills → Item ${idx + 1}`,
            snippet: skill,
          },
        };

        gaps.push(gapItem);
        if (isCriticalHardSkill && domainRelevance < 0.3) {
          blockingGaps.push(gapItem);
        }
      }
    });

    const requiredSkillsCoverage = Math.round((matchedSkillsCount / Math.max(1, requiredSkills.length)) * 45);

    // 2. Evaluate Experience & Seniority (30 max points)
    let rawExpPoints = 0;
    if (reqYears <= 1) {
      rawExpPoints = candidateYears >= 1 ? 30 : candidateYears > 0 ? 22 : 15;
    } else {
      const yearsRatio = Math.min(1.0, candidateYears / reqYears);
      rawExpPoints = yearsRatio * 30;
    }

    const experienceAlignment = Math.min(30, Math.max(0, Math.round(rawExpPoints * domainRelevance)));

    if (candidateYears < reqYears || domainRelevance < 0.3) {
      const seniorityGap: ActionableGap = {
        gapId: 'gap_seniority_domain',
        requirement: `${reqYears}+ Years Relevant Experience in ${job.role}`,
        status: 'missing',
        evidenceStrength: 'unverified',
        criticality: 'blocking',
        recommendation: `Target role requires ${reqYears}+ years in ${job.role}; candidate profile demonstrates ~${candidateYears} years.`,
        targetedProbeOpportunity: `Evaluate candidate's ability to handle ${job.role} responsibilities under scale.`,
        priority: 'high',
        provenance: {
          source: 'job_description',
          reference: 'Experience Requirements',
          snippet: job.experienceRequirements || `${reqYears}+ years`,
        },
      };
      gaps.push(seniorityGap);
      blockingGaps.push(seniorityGap);
    }

    // 3. Evaluate Competencies & Responsibilities (25 max points)
    let matchedCompetenciesCount = 0;
    competencies.forEach((comp, idx) => {
      const compLower = comp.toLowerCase().trim();
      const compWords = compLower.split(/\s+/).filter((w) => w.length > 3);
      const matchedWords = compWords.filter((w) => candidateFullText.includes(w));
      const isDirectMatch = compWords.length > 0 && (matchedWords.length / compWords.length) >= 0.7;
      const isTransferable = compWords.length > 0 && matchedWords.length > 0 && !isDirectMatch;

      if (isDirectMatch) {
        matchedCompetenciesCount += 1.0;
        directMatches.push({
          competency: comp,
          evidence: `Evidenced across project deliverables and leadership narratives.`,
          relevanceScore: 85,
          classification: 'direct_match',
          evidenceStrength: 'confirmed',
          provenance: { source: 'resume', reference: 'Experience Highlights', snippet: comp },
        });
      } else if (isTransferable && domainRelevance >= 0.2) {
        matchedCompetenciesCount += 0.4;
        transferableMatches.push({
          competency: comp,
          evidence: `Transferable baseline observed across general problem solving and execution.`,
          relevanceScore: 60,
          classification: 'transferable_match',
          evidenceStrength: 'partial',
          provenance: { source: 'resume', reference: 'Transferable Experience', snippet: comp },
        });
      } else {
        gaps.push({
          gapId: `gap_comp_${idx}`,
          requirement: comp,
          status: 'missing',
          evidenceStrength: 'unverified',
          criticality: 'important',
          recommendation: `Evaluate ${comp} through an open-ended situational scenario.`,
          targetedProbeOpportunity: `Present a scenario evaluating ${comp} under resource constraints.`,
          priority: 'medium',
          provenance: { source: 'job_description', reference: `Competencies → Item ${idx + 1}`, snippet: comp },
        });
      }
    });

    const competenciesMatch = Math.round(Math.min(25, (matchedCompetenciesCount / Math.max(1, competencies.length)) * 25));

    // Raw Score (0 - 100)
    const rawScore = Math.min(100, Math.max(0, requiredSkillsCoverage + experienceAlignment + competenciesMatch));

    // Blocking Gate Penalty Calculation
    let blockingPenaltyMultiplier = 1.0;
    if (blockingGaps.length >= 2 || (blockingGaps.length >= 1 && domainRelevance <= 0.1)) {
      blockingPenaltyMultiplier = 0.35; // Severe blocking reduction for complete domain mismatches (PM vs Security)
    } else if (blockingGaps.length === 1) {
      blockingPenaltyMultiplier = 0.65;
    }

    const finalTotalScore = Math.min(100, Math.max(0, Math.round(rawScore * blockingPenaltyMultiplier)));
    const confidenceInterval: [number, number] = [
      Math.max(0, finalTotalScore - 4),
      Math.min(100, finalTotalScore + 4)
    ];

    // Evidence Coverage Calculation
    const totalAssessedItems = requiredSkills.length + 1 + competencies.length;
    const verifiedItems = directMatches.length + (candidateYears >= 1 ? 1 : 0);
    const evidenceCoverage = Math.round((verifiedItems / Math.max(1, totalAssessedItems)) * 100) / 100;
    const criticalRequirementCoverage = Math.round(
      Math.max(0, 1.0 - (blockingGaps.length / Math.max(1, blockingGaps.length + directMatches.length))) * 100
    ) / 100;

    const qualificationConfidence: QualificationConfidence = 
      evidenceCoverage > 0.6 ? 'high' : evidenceCoverage > 0.3 ? 'medium' : 'low';

    // Summary description
    const companyName = company?.companyName || job.company || 'the target company';
    let companyAlignmentSummary = '';
    if (blockingGaps.length > 0 && finalTotalScore < 30) {
      companyAlignmentSummary = `Candidate demonstrates a critical domain qualification gap (${finalTotalScore}% adjusted match) for the ${job.role} opening at ${companyName}. Key missing blocking qualifications: ${blockingGaps.slice(0, 2).map((g) => g.requirement).join(', ')}.`;
    } else if (finalTotalScore < 65) {
      companyAlignmentSummary = `Candidate demonstrates moderate cross-functional alignment (${finalTotalScore}%) with transferable competencies for the ${job.role} position at ${companyName}. Key growth areas in core technical requirements.`;
    } else {
      companyAlignmentSummary = `Candidate demonstrates strong technical and domain alignment (${finalTotalScore}%) for the ${job.role} position at ${companyName}.`;
    }

    const allStrengths = [...directMatches, ...transferableMatches];
    const allGaps = [...blockingGaps, ...gaps.filter((g) => !blockingGaps.some((bg) => bg.gapId === g.gapId))];

    return {
      matchPercentage: finalTotalScore,
      rawMatchPercentage: rawScore,
      qualificationConfidence,
      evidenceCoverage,
      criticalRequirementCoverage,
      deterministicBreakdown: {
        requiredSkillsCoverage,
        experienceAlignment,
        competenciesMatch,
        rawScore,
        blockingPenaltyMultiplier,
        totalScore: finalTotalScore,
        confidenceInterval,
      },
      directMatches,
      transferableMatches,
      matchingStrengths: allStrengths.slice(0, 5),
      gaps,
      blockingGaps,
      actionableGaps: allGaps,
      companyAlignmentSummary,
    };
  },
};

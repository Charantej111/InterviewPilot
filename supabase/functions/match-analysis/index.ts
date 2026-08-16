import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { candidateProfile, jobProfile, companyResearch } = await req.json();

    const candidateSkillsLower = (candidateProfile?.skills || []).map((s: string) => s.toLowerCase());
    const candidateFullText = [
      candidateProfile?.summary || '',
      ...(candidateProfile?.skills || []),
      ...(candidateProfile?.strengths || []),
      ...(candidateProfile?.experience || []).flatMap((e: any) => [e.role, e.company, ...(e.highlights || [])]),
      ...(candidateProfile?.projects || []).flatMap((p: any) => [p.name, p.description, ...(p.technologies || [])]),
    ]
      .join(' ')
      .toLowerCase();

    const requiredSkills: string[] = jobProfile?.requiredSkills && jobProfile.requiredSkills.length > 0
      ? jobProfile.requiredSkills
      : ['Core Problem Solving', 'Communication'];
    const competencies: string[] = jobProfile?.competencies && jobProfile.competencies.length > 0
      ? jobProfile.competencies
      : ['Cross-functional Leadership', 'Execution'];

    const matchingStrengths: any[] = [];
    const actionableGaps: any[] = [];

    // 1. Required Skills (45 max)
    let matchedSkillsCount = 0;
    requiredSkills.forEach((skill: string, idx: number) => {
      const skillLower = skill.toLowerCase();
      const directMatch = candidateSkillsLower.some((cs: string) => cs.includes(skillLower) || skillLower.includes(cs));
      const textMatch = candidateFullText.includes(skillLower);

      if (directMatch || textMatch) {
        matchedSkillsCount++;
        matchingStrengths.push({
          competency: skill,
          evidence: `Evidenced in candidate profile projects and experience.`,
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

    // 2. Experience Depth (30 max)
    const expCount = candidateProfile?.experience?.length || 0;
    const projCount = candidateProfile?.projects?.length || 0;
    const experienceAlignment = Math.min(30, Math.round(15 + Math.min(expCount * 4, 10) + Math.min(projCount * 3, 5)));

    // 3. Competencies (25 max)
    let matchedCompCount = 0;
    competencies.forEach((comp: string, idx: number) => {
      const compLower = comp.toLowerCase();
      const words = compLower.split(' ').filter((w: string) => w.length > 3);
      const isMatched = words.some((w: string) => candidateFullText.includes(w));

      if (isMatched) {
        matchedCompCount++;
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

    const competenciesMatch = Math.round((matchedCompCount / Math.max(1, competencies.length)) * 25);
    const totalScore = Math.min(96, Math.max(45, requiredSkillsCoverage + experienceAlignment + competenciesMatch));

    const companyName = companyResearch?.companyName || jobProfile?.company || 'Target Company';
    const companyAlignmentSummary = `Candidate demonstrates solid technical and strategic baseline for the ${jobProfile?.role || 'Target'} position at ${companyName}.`;

    const matchResult = {
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

    return new Response(JSON.stringify({ matchResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in match-analysis Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

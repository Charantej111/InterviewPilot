import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { computeDeterministicMatchScore } from '../_shared/scoring.ts';

serve(async (req: Request) => {
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
      ...(candidateProfile?.certifications || []),
      ...(candidateProfile?.achievements || []),
      ...(candidateProfile?.experience || []).flatMap((e: any) => [e.role, e.company, ...(e.highlights || [])]),
      ...(candidateProfile?.projects || []).flatMap((p: any) => [p.name, p.description, ...(p.technologies || [])]),
    ]
      .join(' ')
      .toLowerCase();

    const requiredSkills: string[] = jobProfile?.requiredSkills && jobProfile.requiredSkills.length > 0
      ? jobProfile.requiredSkills
      : ['Core Problem Solving', 'Communication & Collaboration', 'Execution Discipline'];
    const competencies: string[] = jobProfile?.competencies && jobProfile.competencies.length > 0
      ? jobProfile.competencies
      : ['First-Principles Thinking', 'Stakeholder Management', 'System Scalability'];

    const matchingStrengths: any[] = [];
    const actionableGaps: any[] = [];

    // 1. Required Skills (45 max deterministic points)
    let matchedSkillsCount = 0;
    requiredSkills.forEach((skill: string, idx: number) => {
      const skillLower = skill.toLowerCase();
      const directMatch = candidateSkillsLower.some((cs: string) => cs.includes(skillLower) || skillLower.includes(cs));
      const textMatch = candidateFullText.includes(skillLower);

      if (directMatch || textMatch) {
        matchedSkillsCount++;
        matchingStrengths.push({
          competency: skill,
          evidence: `Evidenced in candidate profile projects and experience highlights.`,
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

    const requiredCoveragePoints = (matchedSkillsCount / Math.max(1, requiredSkills.length)) * 45;

    // 2. Experience Depth & Alignment (30 max deterministic points)
    const expCount = candidateProfile?.experience?.length || 0;
    const projCount = candidateProfile?.projects?.length || 0;
    const expPoints = Math.min(30, 14 + Math.min(expCount * 4, 10) + Math.min(projCount * 3, 6));

    // 3. Competencies & Preferred Alignment (25 max deterministic points)
    let matchedCompCount = 0;
    competencies.forEach((comp: string, idx: number) => {
      const compLower = comp.toLowerCase();
      const words = compLower.split(' ').filter((w: string) => w.length > 3);
      const isMatched = words.some((w: string) => candidateFullText.includes(w));

      if (isMatched) {
        matchedCompCount++;
        matchingStrengths.push({
          competency: comp,
          evidence: `Evidenced across project deliverables and leadership narratives.`,
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

    const compPoints = (matchedCompCount / Math.max(1, competencies.length)) * 25;

    // Deterministic combination:
    const deterministicBreakdown = computeDeterministicMatchScore(
      requiredCoveragePoints,
      expPoints,
      compPoints
    );

    const companyName = companyResearch?.companyName || jobProfile?.company || 'Target Company';
    const companyAlignmentSummary = `Candidate demonstrates a ${deterministicBreakdown.totalScore}% quantitative alignment baseline for the ${jobProfile?.role || 'Target'} position at ${companyName}, with strong competencies in core technical deliverables and identified focal areas for interview probing.`;

    const matchResult = {
      matchPercentage: deterministicBreakdown.totalScore,
      deterministicBreakdown,
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

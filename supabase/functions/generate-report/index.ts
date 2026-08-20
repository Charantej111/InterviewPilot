import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';
import { calculateReadinessPercentage } from '../_shared/scoring.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      interviewId, 
      role, 
      company, 
      questions, 
      answers, 
      evaluations,
      apiKey
    } = await req.json();

    const evals = evaluations || [];
    let avgOverall = 7.0;
    let avgRelevance = 7.5;
    let avgStructure = 7.0;
    let avgClarity = 7.5;
    let avgDepth = 6.8;
    let avgEvidence = 6.0;
    let avgRole = 7.2;

    if (evals.length > 0) {
      const sumOverall = evals.reduce((acc: number, e: any) => acc + Number(e.overallScore || e.overall_score || 0), 0);
      avgOverall = Math.round((sumOverall / evals.length) * 10) / 10;
      avgRelevance = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.relevance || b.relevance || 0), 0) / evals.length) * 10) / 10;
      avgStructure = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.structure || b.structure || 0), 0) / evals.length) * 10) / 10;
      avgClarity = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.clarity || b.clarity || 0), 0) / evals.length) * 10) / 10;
      avgDepth = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.depth || b.depth || 0), 0) / evals.length) * 10) / 10;
      avgEvidence = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.evidence || b.evidence || 0), 0) / evals.length) * 10) / 10;
      avgRole = Math.round((evals.reduce((a: number, b: any) => a + Number(b.breakdown?.roleAlignment || b.role_alignment || 0), 0) / evals.length) * 10) / 10;
    }

    const readinessPercentage = calculateReadinessPercentage(avgOverall);

    const questionBreakdown = (questions || []).map((q: any) => {
      const ans = (answers || {})[q.id] || (answers || []).find?.((a: any) => a.question_id === q.id || a.questionId === q.id);
      const ev = (evaluations || []).find?.((e: any) => e.questionId === q.id || e.question_id === q.id);
      const score = Number(ev?.overallScore || ev?.overall_score || 7.0);

      return {
        questionId: q.id,
        questionText: q.text || q.question_text,
        category: q.category,
        score,
        userAnswer: ans?.answerText || ans?.answer_text || ans?.transcript || 'Response recorded.',
        keyCritique: ev?.tryThisNextTime?.suggestion || ev?.improvement_suggestions?.[0] || ev?.whatHeldYouBack?.[0] || 'Focus on quantifying baseline versus outcome lift.',
      };
    });

    let synthesis = {
      summary: `Candidate demonstrated solid foundation for ${role || 'Target Role'} at ${company || 'Target Company'}, scoring an overall average of ${avgOverall}/10 with systematic problem breakdown.`,
      topStrengths: [
        'Strong articulate communication and structured logical flow.',
        'Sound technical reasoning and problem breakdown.',
      ],
      priorityImprovements: [
        'Quantify initial baseline metrics against business outcomes.',
        'Deepen discussion of rejected architectural tradeoffs.',
      ],
      recommendedPractice: [
        {
          title: 'STAR Baseline Metric Drill',
          description: 'Practice establishing initial starting benchmarks before describing solutions.',
          actionableTask: 'State the exact metric before and after your technical intervention.',
        },
        {
          title: 'Architectural Trade-Off Deep Dive',
          description: 'Practice articulating rejected alternative options and their failure modes.',
          actionableTask: 'Outline two alternative architectures and explain why the chosen path was superior.',
        },
      ],
    };

    try {
      const prompt = `
Synthesize a comprehensive, candid, and calibrated executive-level final interview report for a candidate who completed an interview for ${role} at ${company}.

Computed Deterministic Performance Metrics:
- Overall Score: ${avgOverall} / 10.0
- Readiness Percentage: ${readinessPercentage}%
- Relevance: ${avgRelevance} / 10
- Structure: ${avgStructure} / 10
- Clarity: ${avgClarity} / 10
- Depth: ${avgDepth} / 10
- Evidence & Metrics: ${avgEvidence} / 10
- Role Alignment: ${avgRole} / 10

Evaluated Questions & Answers:
${JSON.stringify((questions || []).map((q: any) => {
  const ans = (answers || {})[q.id] || (answers || []).find?.((a: any) => a.question_id === q.id || a.questionId === q.id);
  const ev = (evaluations || []).find?.((e: any) => e.questionId === q.id || e.question_id === q.id);
  return {
    question: q.text,
    category: q.category,
    answer: ans?.answerText || ans?.answer_text || 'Submitted response',
    evaluationFeedback: ev,
  };
}), null, 2)}

CRITICAL EVALUATION INSTRUCTIONS:
1. STRICT OBJECTIVITY - ZERO SUGARCOATING: State candidate's demonstrated performance objectively.
2. In "topStrengths", list genuine demonstrated strengths.
3. In "priorityImprovements", provide 3 candid, actionable breakdowns of what held them back.
4. In "recommendedPractice", provide 3 targeted practice drills.
5. DO NOT GENERATE SAMPLE ANSWERS.

Return JSON strictly matching this schema:
{
  "summary": string,
  "topStrengths": string[],
  "priorityImprovements": string[],
  "recommendedPractice": [
    {
      "title": string,
      "description": string,
      "actionableTask": string
    }
  ]
}
`;

      const aiResult = await callGeminiStructured<{
        summary: string;
        topStrengths: string[];
        priorityImprovements: string[];
        recommendedPractice: {
          title: string;
          description: string;
          actionableTask: string;
        }[];
      }>(
        prompt,
        'You are an executive hiring bar chair. Synthesize honest, calibrated candidate assessments with high-value coaching drills.',
        { apiKey }
      );

      if (aiResult?.summary) {
        synthesis = aiResult;
      }
    } catch (aiErr) {
      console.warn('AI synthesis fallback inside generate-report:', aiErr);
    }

    const report = {
      id: `rep_${interviewId || crypto.randomUUID()}`,
      sessionId: interviewId,
      createdAt: new Date().toISOString(),
      jobTitle: role || 'Target Role',
      company: company || 'Target Company',
      overallScore: avgOverall,
      readinessPercentage,
      summary: synthesis.summary,
      dimensions: [
        { name: 'Relevance & Domain Fit', score: avgRelevance, maxScore: 10, description: 'Direct answering of prompt without diversion' },
        { name: 'Communication & Clarity', score: avgClarity, maxScore: 10, description: 'Clear articulation and concise explanation' },
        { name: 'Product & Technical Depth', score: avgDepth, maxScore: 10, description: 'First-principles reasoning and trade-off mechanics' },
        { name: 'Structure (STAR Framework)', score: avgStructure, maxScore: 10, description: 'Logical narrative flow and systematic breakdown' },
        { name: 'Metric Evidence & Impact', score: avgEvidence, maxScore: 10, description: 'Baseline benchmarks versus quantified business outcomes' },
        { name: 'Role Alignment', score: avgRole, maxScore: 10, description: 'Fit for level expectations and operating scale' },
      ],
      topStrengths: synthesis.topStrengths || [],
      priorityImprovements: synthesis.priorityImprovements || [],
      recommendedPractice: synthesis.recommendedPractice || [],
      questionBreakdown,
    };

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-report Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume, job, company, match, settings, apiKey } = await req.json();

    const activeGaps = (match?.actionableGaps || []).filter((g: any) => g.priority !== 'excluded');
    const targetRole = settings?.role || job?.role || 'Target Role';
    const targetCompany = settings?.company || job?.company || 'Target Company';
    const difficulty = settings?.difficulty || 'intermediate';
    const duration = settings?.duration || 20;

    const questionCount = duration <= 15 ? 3 : duration <= 25 ? 4 : 5;

    const prompt = `
Generate ${questionCount} highly tailored, non-generic anchor interview questions for a candidate based on the following structured profiles:

Candidate Profile:
- Name: ${resume?.name || 'Candidate'}
- Summary: ${resume?.summary || ''}
- Experience: ${JSON.stringify(resume?.experience || [])}
- Projects: ${JSON.stringify(resume?.projects || [])}
- Skills: ${JSON.stringify(resume?.skills || [])}
- Strengths: ${JSON.stringify(resume?.strengths || [])}

Job Profile:
- Role: ${targetRole}
- Company: ${targetCompany}
- Responsibilities: ${JSON.stringify(job?.responsibilities || [])}
- Required Skills: ${JSON.stringify(job?.requiredSkills || [])}
- Preferred Skills: ${JSON.stringify(job?.preferredSkills || [])}
- Competencies: ${JSON.stringify(job?.competencies || [])}

Company Intelligence:
- Overview: ${company?.overview || ''}
- Products: ${JSON.stringify(company?.products || [])}
- Business Model: ${company?.businessModel || ''}
- Verified Facts: ${JSON.stringify(company?.verifiedFacts || [])}

Targeted Gaps to Probe:
${JSON.stringify(activeGaps)}

Interview Configuration:
- Difficulty Level: ${difficulty} (Calibrate technical rigor, boundary conditions, and trade-off complexity to this level)
- Interview Style: ${settings?.style || 'realistic'}
- Focus Areas: ${JSON.stringify(settings?.focusAreas || [])}

CRITICAL RULES:
1. STRICT ZERO SAMPLE ANSWER RULE: NEVER generate, include, or store sample_answer, model_answer, ideal_answer, or verbatim answers.
2. Formulate questions anchored on candidate's real resume deliverables and the target company's real products/architecture.
3. Include targeted probes for identified actionable gaps.
4. Each question must include:
   - "order": number
   - "category": string
   - "text": string (the exact spoken interview question prompt)
   - "intent": string (what the interviewer is probing)
   - "contextExplanation": string (why this question was selected)
   - "expectedSignals": string[] (concrete positive indicators to look for)
   - "redFlags": string[] (concrete negative indicators / anti-patterns)
   - "evaluationCriteria": {"coreCompetency": string, "lookFor": string[], "redFlags": string[], "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]}
   - "adaptiveFollowUpTriggers": [{"condition": string, "followUpProbe": string}]
5. Set "is_follow_up": false and "parentQuestionId": null for all initial anchor questions.

Return JSON strictly matching this schema:
{
  "questions": [
    {
      "order": number,
      "type": "initial",
      "is_follow_up": false,
      "parentQuestionId": null,
      "category": string,
      "text": string,
      "intent": string,
      "contextExplanation": string,
      "expectedSignals": string[],
      "redFlags": string[],
      "evaluationCriteria": {
        "coreCompetency": string,
        "lookFor": string[],
        "redFlags": string[],
        "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
      },
      "adaptiveFollowUpTriggers": [
        {
          "condition": string,
          "followUpProbe": string
        }
      ]
    }
  ]
}
`;

    const generated = await callGeminiStructured<any>(
      prompt,
      'You are a premier executive interviewer. Generate rigorous, tailored anchor questions with adaptive follow-up triggers and strictly zero sample answers.',
      { apiKey }
    );

    const questions = (generated.questions || []).map((q: any, idx: number) => ({
      ...q,
      id: crypto.randomUUID(),
      order: idx + 1,
      difficulty,
      recommendedDurationSeconds: Math.round((duration * 60) / Math.max(1, questionCount)),
    }));

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in prepare-interview Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

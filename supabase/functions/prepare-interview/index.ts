import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume, job, company, match, settings } = await req.json();

    const activeGaps = (match?.actionableGaps || []).filter((g: any) => g.priority !== 'excluded');

    const prompt = `
Generate 4 highly tailored, non-generic interview questions for a candidate based on the following structured profiles:

Candidate Profile:
- Name: ${resume?.name}
- Summary: ${resume?.summary}
- Projects: ${JSON.stringify(resume?.projects || [])}
- Skills: ${JSON.stringify(resume?.skills || [])}
- Strengths: ${JSON.stringify(resume?.strengths || [])}

Job Profile:
- Role: ${settings?.role || job?.role}
- Company: ${settings?.company || job?.company}
- Responsibilities: ${JSON.stringify(job?.responsibilities || [])}
- Required Skills: ${JSON.stringify(job?.requiredSkills || [])}

Company Intelligence:
- Overview: ${company?.overview || ''}
- Products: ${JSON.stringify(company?.products || [])}
- Business Model: ${company?.businessModel || ''}
- Verified Facts: ${JSON.stringify(company?.verifiedFacts || [])}

Actionable Gap Probes:
${JSON.stringify(activeGaps)}

Interview Settings:
- Difficulty: ${settings?.difficulty} (Calibrate rigor and trade-off complexity to this level)
- Interview Style: ${settings?.style}
- Focus Areas: ${JSON.stringify(settings?.focusAreas || [])}

CRITICAL RULES:
1. DO NOT GENERATE OR STORE sample_answer.
2. Formulate questions anchored on candidate's real resume projects and the company's real products.
3. Every question must include:
   - "intent": What the interviewer is assessing
   - "contextExplanation": Why this question was chosen
   - "expectedSignals": Concrete positive indicators to look for
   - "redFlags": Concrete negative signals
   - "evaluationCriteria": {"coreCompetency": string, "lookFor": string[], "redFlags": string[], "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]}
   - "adaptiveFollowUpTriggers": [{"condition": string, "followUpProbe": string}]
4. Set "is_follow_up": false and "parentQuestionId": null for initial anchor slots.

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
      'You are a premier executive interviewer. Generate tailored anchor questions with adaptive follow-up triggers and zero sample answers.'
    );

    const questions = (generated.questions || []).map((q: any, idx: number) => ({
      ...q,
      id: crypto.randomUUID(),
      order: idx + 1,
      difficulty: settings?.difficulty || 'intermediate',
      recommendedDurationSeconds: 180,
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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';
import { calculateOverallScore, RubricDimensions } from '../_shared/scoring.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      question, 
      answerText, 
      role, 
      company, 
      difficulty,
      remainingMinutes,
      apiKey
    } = await req.json();

    const cleanAnswer = (answerText || '').trim();

    const prompt = `
Evaluate the candidate's submitted answer for the following interview question.

Question Metadata:
- Category: ${question?.category || 'General'}
- Question Text: "${question?.text || ''}"
- Question Intent: "${question?.intent || ''}"
- Expected Positive Signals: ${JSON.stringify(question?.expectedSignals || [])}
- Negative Red Flags: ${JSON.stringify(question?.redFlags || [])}
- Core Evaluation Criteria: ${JSON.stringify(question?.evaluationCriteria || {})}
- Target Role: "${role || 'Target Role'}"
- Target Company: "${company || 'Target Company'}"
- Difficulty Calibrated: "${difficulty || 'intermediate'}"

Candidate Answer:
"${cleanAnswer || 'No response provided.'}"

CRITICAL INSTRUCTIONS:
1. Score each of the 6 dimensions on a strict 1.0 to 10.0 scale based on demonstrated evidence:
   - relevance: How directly and completely the candidate addressed the specific prompt. (Weight: 25%)
   - structure: Logical flow, organized narrative (e.g. STAR framework), prioritization. (Weight: 20%)
   - clarity: Articulation, conciseness, absence of rambling or vague buzzwords. (Weight: 15%)
   - depth: First-principles understanding, edge cases, technical/business mechanics. (Weight: 15%)
   - evidence: Concrete metrics, baseline comparison, quantified outcomes, personal ownership. (Weight: 15%)
   - roleAlignment: Fit for ${role} level expectations and ${company} operating scale. (Weight: 10%)
2. DO NOT calculate the overall score in this JSON. The overall score will be computed deterministically server-side.
3. Identify 2-3 concrete "whatWorked" strengths evidenced in the response.
4. Identify 1-2 concrete "whatHeldYouBack" missed signals or growth opportunities.
5. In "tryThisNextTime", provide structured coaching:
   - framework: (e.g. "STAR Framework with Baseline Metrics", "First-Principles Decomposition")
   - suggestion: (Actionable advice on what to structure or include)
   - promptToImprove: (A self-reflective prompt for the candidate to practice)
   - examplePhrasing: (An illustrative phrasing template demonstrating structure WITHOUT writing their specific answer for them)
6. Check if an adaptive follow-up probe is needed based on missing metrics, vague ownership, or unaddressed edge cases. (Only recommend follow-up if remaining time allows: ${remainingMinutes ?? 15} minutes left).

Return JSON strictly matching this schema:
{
  "dimensions": {
    "relevance": number,
    "structure": number,
    "clarity": number,
    "depth": number,
    "evidence": number,
    "roleAlignment": number
  },
  "whatWorked": string[],
  "whatHeldYouBack": string[],
  "tryThisNextTime": {
    "framework": string,
    "suggestion": string,
    "promptToImprove": string,
    "examplePhrasing": string
  },
  "followUpNeeded": boolean,
  "followUpTriggerReason": string | null,
  "followUpTopic": string | null
}
`;

    const rawEvaluation = await callGeminiStructured<{
      dimensions: RubricDimensions;
      whatWorked: string[];
      whatHeldYouBack: string[];
      tryThisNextTime: {
        framework: string;
        suggestion: string;
        promptToImprove: string;
        examplePhrasing: string;
      };
      followUpNeeded: boolean;
      followUpTriggerReason: string | null;
      followUpTopic: string | null;
    }>(
      prompt,
      'You are a rigorous, calibrated bar raiser and hiring committee member. Evaluate responses objectively against the 6-dimension rubric.',
      { apiKey }
    );

    // Deterministic overall score calculation (LLM does NOT calculate overall score)
    const overallScore = calculateOverallScore(rawEvaluation.dimensions);

    const feedback = {
      questionId: question?.id || 'q_unknown',
      overallScore,
      breakdown: {
        relevance: rawEvaluation.dimensions.relevance,
        structure: rawEvaluation.dimensions.structure,
        clarity: rawEvaluation.dimensions.clarity,
        depth: rawEvaluation.dimensions.depth,
        evidence: rawEvaluation.dimensions.evidence,
        roleAlignment: rawEvaluation.dimensions.roleAlignment,
      },
      whatWorked: rawEvaluation.whatWorked || [],
      whatHeldYouBack: rawEvaluation.whatHeldYouBack || [],
      tryThisNextTime: rawEvaluation.tryThisNextTime,
      followUpNeeded: rawEvaluation.followUpNeeded && (remainingMinutes === undefined || remainingMinutes > 3),
      followUpTriggerReason: rawEvaluation.followUpTriggerReason,
      followUpTopic: rawEvaluation.followUpTopic,
    };

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in evaluate-answer Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

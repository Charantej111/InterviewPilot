import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      parentQuestion, 
      candidateAnswer, 
      weaknessIdentified, 
      triggerReason, 
      role, 
      company, 
      difficulty,
      order,
      apiKey
    } = await req.json();

    const prompt = `
Generate a focused adaptive follow-up interview question based on the candidate's previous response to probe a specific unaddressed area or missing evidence.

Parent Question:
"${parentQuestion?.text || ''}"
Category: ${parentQuestion?.category || 'Domain Execution'}

Candidate Previous Answer:
"${candidateAnswer || ''}"

Evaluation Weakness / Trigger Reason:
"${triggerReason || weaknessIdentified || 'Candidate did not quantify baseline metric or personal trade-off.'}"

Role: "${role || 'Target Role'}"
Company: "${company || 'Target Company'}"
Difficulty Level: "${difficulty || 'intermediate'}"

CRITICAL RULES:
1. STRICT ZERO SAMPLE ANSWER RULE: NEVER generate or include sample answers.
2. The question must directly challenge or probe the specific gap (e.g. missing baseline numbers, unexplored architecture failure modes, vague ownership).
3. The question must feel natural, concise, and conversational.

Return JSON strictly matching this schema:
{
  "text": string,
  "category": "${parentQuestion?.category || 'Adaptive Follow-up'}",
  "intent": string,
  "contextExplanation": string,
  "expectedSignals": string[],
  "redFlags": string[],
  "evaluationCriteria": {
    "coreCompetency": "${parentQuestion?.evaluationCriteria?.coreCompetency || 'Technical & Execution Depth'}",
    "lookFor": string[],
    "redFlags": string[],
    "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
  }
}
`;

    const generated = await callGeminiStructured<any>(
      prompt,
      'You are a premier executive interviewer. Formulate sharp, contextual follow-up probes with strictly zero sample answers.',
      { apiKey }
    );

    const followUpQuestion = {
      id: crypto.randomUUID(),
      order: order || ((parentQuestion?.order || 1) + 1),
      type: 'follow_up' as const,
      is_follow_up: true,
      parentQuestionId: parentQuestion?.id || null,
      category: generated.category || 'Adaptive Follow-up',
      text: generated.text,
      intent: generated.intent,
      contextExplanation: generated.contextExplanation,
      recommendedDurationSeconds: 120,
      expectedSignals: generated.expectedSignals || [],
      redFlags: generated.redFlags || [],
      evaluationCriteria: generated.evaluationCriteria,
    };

    return new Response(JSON.stringify({ followUpQuestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in adaptive-followup Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

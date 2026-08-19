import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';
import { ANSWER_EVALUATOR_POLICY } from '../_shared/aiPolicy.ts';
import { applyDeterministicConstraints, RawEvaluationProposal } from '../_shared/scoring.ts';

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
      candidateProfile,
      apiKey
    } = await req.json();

    const cleanAnswer = (answerText || '').trim();

    const prompt = `
=== TASK: CANDIDATE ANSWER MULTI-PHASE EVALUATION ===

QUESTION CONTEXT:
- Question ID: "${question?.id || 'q_1'}"
- Category / Type: "${question?.questionType || question?.category || 'General'}"
- Question Text: "${question?.text || ''}"
- Intent: "${question?.intent || ''}"
- Expected Characteristics: ${JSON.stringify(question?.expectedAnswerCharacteristics || question?.expectedSignals || [])}
- Target Role & Level: "${role || 'Target Role'}" (${difficulty || 'intermediate'})
- Target Company: "${company || 'Target Company'}"

CANDIDATE SUBMITTED ANSWER:
"${cleanAnswer || 'No response provided.'}"

CANDIDATE KNOWN RESUME CONTEXT:
Summary: "${candidateProfile?.summary || 'Standard profile'}"
Verified Skills: ${JSON.stringify(candidateProfile?.skills || [])}

EVALUATION INSTRUCTIONS:
1. STEP 1: CLASSIFY ANSWER
   - Choose exactly one: 'strong' | 'adequate' | 'weak' | 'irrelevant' | 'not_answered' | 'evasive' | 'unprofessional' | 'unsupported_claim'
2. STEP 2: RELEVANCE GATE
   - Evaluate if the response directly addresses the question ('answered' | 'partially_answered' | 'not_answered').
   - Score relevance 0 - 10. If not_answered or completely off-topic (e.g. talking about sports/cricket when asked about product trade-offs), set status 'not_answered' and score 0.
3. STEP 3: PROFESSIONALISM
   - Evaluate tone ('acceptable' | 'concerning' | 'poor').
4. STEP 4: COMPLETENESS MAP
   - Map observed characteristics from the candidate's response against the question's expectedAnswerCharacteristics.
5. STEP 5: PROPOSE 4-FIELD SCORES FOR 6 DIMENSIONS (1.0 to 10.0 scale)
   - relevance, structure, clarity, depth, evidence, roleAlignment.
   - For each dimension provide: { "score": number, "reason": string, "evidence": string, "missing": string }.
6. STEP 6: VERIFY CLAIMS
   - If candidate makes major unlisted claims, tag support status as 'unverified_by_submitted_resume'.
7. STEP 7: COACHING DIRECTIVES
   - What worked (0 items if irrelevant/not answered; 1-3 items only if evidenced).
   - What held you back.
   - Try this next time with framework, suggestion, and practice prompt.
8. STEP 8: ADAPTIVE PROBE RECOMMENDATION
   - Determine if follow-up probe is needed ('missing_evidence' | 'missing_metric' | 'unclear_decision' | 'missing_tradeoff' | 'shallow_reasoning' | 'unsupported_claim' | 'partial_answer' | 'technical_gap').

Return strict JSON matching this structure:
{
  "answerClassification": "strong" | "adequate" | "weak" | "irrelevant" | "not_answered" | "evasive" | "unprofessional" | "unsupported_claim",
  "relevanceGate": {
    "status": "answered" | "partially_answered" | "not_answered",
    "score": number,
    "reason": string
  },
  "professionalism": {
    "status": "acceptable" | "concerning" | "poor",
    "note": string
  },
  "completenessMap": {
    "observedCharacteristics": string[]
  },
  "dimensionDetails": {
    "relevance": { "score": number, "reason": string, "evidence": string, "missing": string },
    "structure": { "score": number, "reason": string, "evidence": string, "missing": string },
    "clarity": { "score": number, "reason": string, "evidence": string, "missing": string },
    "depth": { "score": number, "reason": string, "evidence": string, "missing": string },
    "evidence": { "score": number, "reason": string, "evidence": string, "missing": string },
    "roleAlignment": { "score": number, "reason": string, "evidence": string, "missing": string }
  },
  "unverifiedClaims": [
    { "claim": string, "resumeSupport": "supported" | "unverified_by_submitted_resume" | "contradicted", "note": string }
  ],
  "whatWorked": string[],
  "whatHeldYouBack": string[],
  "tryThisNextTime": {
    "framework": string,
    "suggestion": string,
    "promptToImprove": string,
    "examplePhrasing": string
  },
  "shouldFollowUp": boolean,
  "followUpReasonCode": string | null
}
`;

    const rawProposal = await callGeminiStructured<RawEvaluationProposal>(
      prompt,
      ANSWER_EVALUATOR_POLICY,
      { apiKey }
    );

    // Apply Server-side Deterministic Rule and Dimension Ceiling Engine
    const finalEvaluation = applyDeterministicConstraints(
      rawProposal,
      question,
      cleanAnswer
    );

    const feedback = {
      questionId: question?.id || 'q_1',
      overallScore: finalEvaluation.overallScore,
      scoreInterval: finalEvaluation.scoreInterval,
      answerClassification: finalEvaluation.answerClassification,
      relevanceGate: finalEvaluation.relevanceGate,
      professionalism: finalEvaluation.professionalism,
      completenessMap: finalEvaluation.completenessMap,
      breakdown: finalEvaluation.breakdown,
      dimensionDetails: finalEvaluation.dimensionDetails,
      unverifiedClaims: finalEvaluation.unverifiedClaims,
      whatWorked: finalEvaluation.whatWorked,
      whatHeldYouBack: finalEvaluation.whatHeldYouBack,
      tryThisNextTime: finalEvaluation.tryThisNextTime,
      deterministicConstraintsApplied: finalEvaluation.deterministicConstraintsApplied,
      followUpNeeded: finalEvaluation.shouldFollowUp && (remainingMinutes === undefined || remainingMinutes > 3),
      followUpTriggerReason: finalEvaluation.followUpReasonCode,
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

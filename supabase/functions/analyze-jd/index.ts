import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, company, rawText, apiKey } = await req.json();
    const cleanTitle = (title || 'Role').trim();
    const cleanCompany = (company || 'Company').trim();
    const cleanText = (rawText || '').trim();

    const prompt = `
You are a senior hiring committee architect. Deconstruct the following job description into a structured evidence model.

Role: ${cleanTitle}
Company: ${cleanCompany}

Job Description:
${cleanText}

CRITICAL RULES:
1. For EVERY requirement, include the EXACT phrase or sentence from the JD as "sourceText".
2. Classify each requirement's strength:
   - "explicit"  = directly stated as mandatory ("must have", "required", "experience in X")
   - "preferred" = stated as optional ("nice to have", "preferred", "bonus")
   - "inferred"  = implied by context, not directly stated
3. Map each requirement to a competencySignal (e.g. "analytics", "product_sense", "execution", "stakeholder_management", "technical_depth", "domain_knowledge").
4. criticalCompetencies should be ordered by importance (most critical first).

Return ONLY valid JSON matching this exact schema:
{
  "role": "${cleanTitle}",
  "company": "${cleanCompany}",
  "seniority": "junior" | "mid" | "senior" | "lead" | "principal" | "unknown",
  "requiredSkills": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "explicit" | "preferred" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "preferredSkills": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "preferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "responsibilities": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "explicit" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "criticalCompetencies": string[],
  "behavioralSignals": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "explicit" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "technicalRequirements": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "explicit" | "preferred" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "domainKnowledge": [
    {
      "requirement": string,
      "sourceText": string,
      "strength": "explicit" | "preferred" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "hiringSignals": string[]
}
`;

    const jdEvidenceModel = await callGeminiStructured(
      prompt,
      'You are a senior hiring committee architect. Every requirement must include sourceText from the JD.',
      { apiKey }
    );

    // Validate minimum structure
    if (!jdEvidenceModel?.role || !jdEvidenceModel?.criticalCompetencies) {
      throw new Error('JD extraction returned incomplete evidence model.');
    }

    // Also derive backward-compat jobProfile for legacy components
    const jobProfile = {
      role: jdEvidenceModel.role,
      company: jdEvidenceModel.company || cleanCompany,
      responsibilities: (jdEvidenceModel.responsibilities || []).map((r: any) => r.requirement),
      requiredSkills: (jdEvidenceModel.requiredSkills || []).map((r: any) => r.requirement),
      preferredSkills: (jdEvidenceModel.preferredSkills || []).map((r: any) => r.requirement),
      experienceRequirements: jdEvidenceModel.seniority || 'Not specified',
      competencies: jdEvidenceModel.criticalCompetencies || [],
      keywords: (jdEvidenceModel.domainKnowledge || []).map((r: any) => r.requirement),
      interviewSignals: jdEvidenceModel.hiringSignals || [],
    };

    return new Response(JSON.stringify({ jdEvidenceModel, jobProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in analyze-jd Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


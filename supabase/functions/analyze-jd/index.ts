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

    if (!cleanText) {
      return new Response(
        JSON.stringify({ error: 'Job description text is required for analysis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `
You are a senior hiring committee architect. Deconstruct the following job description into a structured evidence model.

Role: ${cleanTitle}
Company: ${cleanCompany}

Job Description:
${cleanText}

CRITICAL RULES:
1. For EVERY requirement, include the EXACT phrase or sentence from the JD as "sourceText". Never invent or rewrite source text.
2. Classify each requirement's category: "skill", "responsibility", "competency", "technical", "domain", "behavioral", "experience", "education", "certification", "other".
3. Classify strength:
   - "explicit"  = directly stated as mandatory ("must have", "required", "minimum X years")
   - "preferred" = stated as optional ("nice to have", "preferred", "bonus", "plus")
   - "inferred"  = implied by context or scope
4. Flag "critical": true for non-negotiable core skills and technical depth requirements.
5. Identify seniority: "intern", "junior", "mid", "senior", "lead", "principal", or "unknown".
6. Do NOT invent company facts or search external information. Extract strictly what is written in the job description.

Return ONLY valid JSON matching this exact schema:
{
  "role": "${cleanTitle}",
  "company": "${cleanCompany}",
  "seniority": "intern" | "junior" | "mid" | "senior" | "lead" | "principal" | "unknown",
  "requiredSkills": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "skill",
      "strength": "explicit",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "preferredSkills": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "skill",
      "strength": "preferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": false
    }
  ],
  "responsibilities": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "responsibility",
      "strength": "explicit" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "competencies": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "competency",
      "strength": "explicit" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "technicalRequirements": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "technical",
      "strength": "explicit" | "preferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "domainKnowledge": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "domain",
      "strength": "explicit" | "preferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "behavioralSignals": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "behavioral",
      "strength": "explicit" | "inferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": false
    }
  ],
  "experienceRequirements": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "experience",
      "strength": "explicit",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": boolean
    }
  ],
  "educationRequirements": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "education",
      "strength": "explicit" | "preferred",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": false
    }
  ],
  "certificationRequirements": [
    {
      "requirement": string,
      "sourceText": string,
      "category": "certification",
      "strength": "preferred" | "explicit",
      "competencySignal": string,
      "confidence": "high" | "medium" | "low",
      "critical": false
    }
  ],
  "hiringSignals": string[]
}
`;

    const rawJdExtraction = await callGeminiStructured(
      prompt,
      'You are a senior hiring committee architect. Every requirement must include exact sourceText from the JD.',
      { apiKey }
    );

    if (!rawJdExtraction?.role) {
      throw new Error('JD extraction returned incomplete evidence model.');
    }

    return new Response(JSON.stringify({ jdEvidenceModel: rawJdExtraction }), {
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

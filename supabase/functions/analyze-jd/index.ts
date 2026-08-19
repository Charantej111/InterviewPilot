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
Deconstruct the following job description into structured hiring bar requirements for "${cleanTitle}" at "${cleanCompany}".

Job Description:
${cleanText}

Instructions:
1. Extract the core responsibilities that define day-to-day execution.
2. Separate REQUIRED non-negotiable skills from PREFERRED bonus qualifications.
3. Formulate the precise technical/leadership competencies and key interview evaluation signals.
4. Extract relevant domain keywords.

Return JSON strictly matching this schema:
{
  "role": "${cleanTitle}",
  "company": "${cleanCompany}",
  "responsibilities": string[],
  "requiredSkills": string[],
  "preferredSkills": string[],
  "experienceRequirements": string,
  "competencies": string[],
  "keywords": string[],
  "interviewSignals": string[]
}
`;

    const jobProfile = await callGeminiStructured(
      prompt,
      'You are a senior hiring committee architect. Deconstruct job postings into precise technical competencies, hiring bar signals, and execution metrics.',
      { apiKey }
    );

    return new Response(JSON.stringify({ jobProfile }), {
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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileText, apiKey } = await req.json();
    const rawContent = (fileText || '').trim();

    const prompt = `
Extract a comprehensive, high-integrity candidate profile from the following resume document.
Resume File Name: ${fileName || 'Resume.pdf'}

Resume Content:
${rawContent || 'Candidate with technology, product, and leadership experience.'}

CRITICAL RULES:
1. Extract true deliverables, metrics, and skills evidenced in the resume.
2. DO NOT fabricate credentials, previous employers, degrees, or metrics.
3. If the candidate name is not explicitly mentioned, derive a professional identifier from the file name.

Return JSON strictly matching this schema:
{
  "name": string,
  "summary": string,
  "education": [
    {
      "degree": string,
      "institution": string,
      "year": string
    }
  ],
  "experience": [
    {
      "role": string,
      "company": string,
      "duration": string,
      "highlights": string[]
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "technologies": string[],
      "metrics": string
    }
  ],
  "skills": string[],
  "certifications": string[],
  "achievements": string[],
  "strengths": string[],
  "potentialGaps": string[]
}
`;

    const candidateProfile = await callGeminiStructured(
      prompt,
      'You are an executive talent assessor and hiring committee chairperson. Extract exact candidate deliverables without hallucinating experience.',
      { apiKey }
    );

    return new Response(JSON.stringify({ candidateProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in analyze-resume Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

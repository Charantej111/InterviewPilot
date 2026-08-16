import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileText } = await req.json();

    const prompt = `
Extract a comprehensive, structured candidate profile from the following resume information.
Resume File: ${fileName || 'Resume.pdf'}
Resume Content:
${fileText || 'Candidate with technology and product experience.'}

Return JSON strictly matching this schema:
{
  "name": string,
  "summary": string,
  "education": [{"degree": string, "institution": string, "year": string}],
  "experience": [{"role": string, "company": string, "duration": string, "highlights": string[]}],
  "projects": [{"name": string, "description": string, "technologies": string[], "metrics": string}],
  "skills": string[],
  "strengths": string[],
  "potentialGaps": string[]
}
`;

    const candidateProfile = await callGeminiStructured(
      prompt,
      'You are a high-bar executive talent evaluator. Extract exact resume deliverables and skills without fabricating credentials.'
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

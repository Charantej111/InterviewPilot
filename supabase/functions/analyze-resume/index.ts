import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileText, fileBase64, apiKey } = await req.json();
    const rawContent = (fileText || '').trim();

    const prompt = `
First, validate whether the provided document is a valid candidate resume (CV, work history, professional bio).
If it is NOT a resume (e.g. it is a train ticket, booking confirmation, invoice, receipt, generic article, or random document), set "isValidResume": false and explain in "invalidReason".

If it IS a valid resume:
Set "isValidResume": true, "invalidReason": null, and extract the candidate profile.

CRITICAL EXTRACTION RULES:
1. Extract true deliverables, exact project names, metrics, tools, and skills evidenced directly in the resume.
2. DO NOT fabricate credentials, previous employers, degrees, or metrics.
3. If the candidate name is not explicitly mentioned, derive a professional identifier from the file name.
4. Extract distinct projects with their full descriptions, technologies used, and any quantified metrics.
5. Extract explicit work experience highlights, roles, and dates.

Return JSON strictly matching this schema:
{
  "isValidResume": boolean,
  "invalidReason": string | null,
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

    const config: any = { apiKey };
    if (fileBase64) {
      const lowerName = (fileName || '').toLowerCase();
      let mimeType = 'application/pdf';
      if (lowerName.endsWith('.doc')) mimeType = 'application/msword';
      else if (lowerName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      config.inlineData = {
        mimeType,
        data: fileBase64,
      };
    }

    const candidateProfile = await callGeminiStructured(
      prompt,
      'You are an executive talent assessor and hiring committee chairperson. Extract exact candidate deliverables without hallucinating experience.',
      config
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

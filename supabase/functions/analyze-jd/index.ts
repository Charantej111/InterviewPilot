import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, company, rawText } = await req.json();

    const prompt = `
Deconstruct the following job description into structured hiring bar requirements for ${title} at ${company}.
Job Description:
${rawText}

Return JSON strictly matching this schema:
{
  "role": "${title}",
  "company": "${company}",
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
      'You are a senior hiring committee architect. Deconstruct job postings into precise technical competencies and interview signals.'
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

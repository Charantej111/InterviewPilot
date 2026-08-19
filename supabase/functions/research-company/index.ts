import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSearchProvider } from '../_shared/search.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, role, apiKey } = await req.json();
    const cleanCompany = (companyName || '').trim();
    const cleanRole = (role || '').trim();
    const researchedAt = new Date().toISOString();

    // 1. Authoritative web search via SearchProvider (happens in preparation phase)
    const searchProvider = getSearchProvider();
    const searchQuery = `${cleanCompany} company business model products engineering culture "${cleanRole}"`;
    const searchResult = await searchProvider.search(searchQuery, {
      maxResults: 6,
      targetDomain: cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
    });

    // 2. Synthesize search sources with Gemini
    const prompt = `
Analyze the following search results for "${cleanCompany}" relevant to the "${cleanRole}" role.

Search Sources Content:
${searchResult.rawText}

Source URLs available:
${JSON.stringify(searchResult.sources, null, 2)}

Instructions:
1. Extract company overview, main products, and business model strictly based ON SEARCH RESULTS.
2. Formulate "verifiedFacts" citing exact source URLs from the available sources.
3. Formulate "strategicInferences" connecting verified facts to interview expectations for "${cleanRole}".
4. If internal rubrics, live question banks, or proprietary details are not found in sources, list them under "unavailableInformation". DO NOT FABRICATE INFORMATION.

Return JSON strictly matching this schema:
{
  "companyName": "${cleanCompany}",
  "role": "${cleanRole}",
  "overview": string,
  "products": string[],
  "businessModel": string,
  "verifiedFacts": [{"fact": string, "sourceUrl": string, "retrievalTimestamp": "${researchedAt}"}],
  "strategicInferences": [{"inference": string, "rationale": string}],
  "unavailableInformation": string[],
  "status": "completed",
  "researchedAt": "${researchedAt}"
}
`;

    const generated = await callGeminiStructured<any>(
      prompt,
      'You are a corporate intelligence analyst. Prioritize verified official facts and never fabricate proprietary internal information.',
      { apiKey }
    );

    const companyResearch = {
      ...generated,
      sources: searchResult.sources,
    };

    return new Response(JSON.stringify({ companyResearch }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in research-company Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

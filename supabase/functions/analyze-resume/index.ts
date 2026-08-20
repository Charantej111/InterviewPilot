import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGeminiStructured } from '../_shared/gemini.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, normalizedText, apiKey } = await req.json();

    if (!normalizedText || normalizedText.trim().length < 100) {
      return new Response(JSON.stringify({
        error: 'UNREADABLE_DOCUMENT',
        message: 'Insufficient text could be extracted from this document.',
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Step 1: Classify the document ────────────────────────────────────────
    const classificationPrompt = `
You are a document classifier. Examine the text below and determine:
1. documentType: Is it a "resume", "cv", "portfolio", "academic_document" (marks sheet, grade card, transcript), "certificate", or "unknown"?
2. documentQuality: Is it "good" (has name + experience/projects + skills), "partial" (some sections missing), "poor" (minimal content), or "unreadable" (<150 chars)?

Return ONLY valid JSON:
{
  "documentType": string,
  "documentQuality": string,
  "sectionsDetected": string[],
  "rejectionReason": string | null
}

DOCUMENT TEXT:
${normalizedText.slice(0, 2000)}
`;

    const classificationResult = await callGeminiStructured(
      classificationPrompt,
      'You are a strict document classifier.',
      { apiKey }
    );

    const docType = classificationResult.documentType || 'unknown';
    const docQuality = classificationResult.documentQuality || 'poor';

    if (!['resume', 'cv', 'portfolio', 'unknown'].includes(docType) && !normalizedText.toLowerCase().includes('experience') && !normalizedText.toLowerCase().includes('skills')) {
      return new Response(JSON.stringify({
        error: 'INVALID_DOCUMENT_TYPE',
        documentType: docType,
        documentQuality: docQuality,
        message: classificationResult.rejectionReason || `This appears to be a ${docType}, not a resume.`,
        canProceed: false,
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (docQuality === 'unreadable') {
      return new Response(JSON.stringify({
        error: 'UNREADABLE_DOCUMENT',
        documentType: docType,
        documentQuality: docQuality,
        message: 'The document quality is too low to extract reliable information.',
        canProceed: false,
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Step 2: Extract CandidateEvidenceModel ────────────────────────────────
    const extractionPrompt = `
You are a precise resume evidence extractor. Your job is to extract structured evidence from the resume text below.

CRITICAL RULES:
1. For EVERY extracted item, include the EXACT phrase or sentence from the resume as "sourceText".
2. Do NOT invent, infer, or embellish anything that isn't directly stated.
3. If a field is not found, use null — never guess.
4. Confidence levels:
   - "high"     = exact phrase found, unambiguous meaning
   - "medium"   = source found but interpretation required
   - "low"      = weak or ambiguous source
   - "inferred" = AI inference — no direct statement

Return ONLY valid JSON matching this exact schema:
{
  "identity": {
    "name": { "value": string, "sourceText": string, "sourceLocation": { "section": string }, "confidence": string },
    "email": { "value": string, "sourceText": string, "sourceLocation": { "section": string }, "confidence": string } | null,
    "role": { "value": string, "sourceText": string, "sourceLocation": { "section": string }, "confidence": string } | null
  },
  "education": [
    {
      "degree": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": string },
      "institution": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": string },
      "year": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": string }
    }
  ],
  "workExperience": [
    {
      "company": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": string },
      "role": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": string },
      "startDate": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": string },
      "endDate": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": string },
      "bullets": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": string }
      ]
    }
  ],
  "projects": [
    {
      "name": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": string },
      "problem": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": string } | null,
      "contribution": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": string } | null,
      "technologies": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": string }
      ],
      "outcomes": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": string }
      ]
    }
  ],
  "skills": {
    "technical": [ { "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": string } ],
    "product":   [ { "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": string } ],
    "domain":    [ { "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": string } ]
  },
  "certifications": [
    { "value": string, "sourceText": string, "sourceLocation": { "section": "CERTIFICATIONS" }, "confidence": string }
  ],
  "unclear": [
    { "text": string, "reason": string }
  ]
}

RESUME TEXT:
${normalizedText}
`;

    const evidenceModel = await callGeminiStructured(
      extractionPrompt,
      'You are a precise resume evidence extractor. Every claim must be backed by exact source text.',
      { apiKey }
    );

    if (!evidenceModel?.identity?.name?.value) {
      if (!evidenceModel.identity) (evidenceModel as any).identity = {};
      (evidenceModel as any).identity.name = {
        value: fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').replace(/\bresume\b/gi, '').trim() : 'Candidate',
        sourceText: normalizedText.slice(0, 60),
        sourceLocation: { section: 'HEADER' },
        confidence: 'medium',
      };
    }

    return new Response(JSON.stringify({
      candidateEvidenceModel: evidenceModel,
      documentClassification: {
        documentType: docType,
        documentQuality: docQuality,
        sectionsDetected: classificationResult.sectionsDetected || [],
        extractedTextLength: normalizedText.length,
        canProceed: true,
      },
    }), {
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


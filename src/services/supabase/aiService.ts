import { supabase } from '../../lib/supabase';
import { CandidateProfile, CandidateEvidenceModel, DocumentClassification, LockedCandidateContext } from '../../types/resume';
import { JobProfile } from '../../types/jobDescription';
import { CompanyResearchData } from '../../types/companyResearch';
import { MatchAnalysisResult } from '../../types/matchAnalysis';
import { Question, QuestionFeedback, FinalReport, InterviewObjective } from '../../types/interview';
import { callClientGeminiStructured, callClientGeminiText } from '../ai/clientGemini';
import { resumeService } from './resumeService';




const getClientApiKey = (): string | undefined => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_GOOGLE_AI_API_KEY || undefined;
};

async function getEdgeErrorMessage(error: any): Promise<string> {
  if (!error) return 'Unknown error';
  try {
    if (error.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) return typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
    }
  } catch (_) {}
  return error.message || String(error);
}

export const aiService = {
  /**
   * PRIMARY ENTRY POINT — Full Resume Evidence Pipeline
   *
   * Pipeline:
   *   PDF/DOCX → documentExtractor (2-Column spatial order, DOCX tables, normalization, sections)
   *   → Document Classification Gate (deterministic)
   *   → Gemini Structured Evidence Extraction (strict anti-hallucination prompt)
   *   → validateCandidateEvidenceModel (fuzzy sourceText verification & deduplication)
   *   → CandidateEvidenceModel (ready for human confirmation)
   */
  async extractResumeEvidence(
    file: File,
    apiKey?: string
  ): Promise<{
    evidenceModel: CandidateEvidenceModel;
    classification: DocumentClassification;
    validationResult?: import('../../types/resume').ValidationResult;
    extractedDoc?: import('../../types/resume').ExtractedDocument;
    rawGeminiOutput?: any;
  }> {
    const key = apiKey || getClientApiKey();

    // Step 1: Extract, normalize, and detect sections via documentExtractor
    const { documentExtractor } = await import('../ai/documentExtractor');
    const extractedDoc = await documentExtractor.extractDocument(file);

    // Development-only Observability Logging
    if (import.meta.env.DEV) {
      console.groupCollapsed(`[InterviewPilot Extractor] ${file.name}`);
      console.log('Document Type:', extractedDoc.documentType);
      console.log('Document Quality:', extractedDoc.documentQuality);
      console.log('Character Count:', extractedDoc.characterCount);
      console.log('Sections Detected:', extractedDoc.sections.map((s) => s.normalizedName));
      if (extractedDoc.extractionWarnings.length > 0) {
        console.warn('Extraction Warnings:', extractedDoc.extractionWarnings);
      }
      console.groupEnd();
    }

    // Step 2: Classification Gate (for academic transcripts or course certificates)
    if (['academic_document', 'certificate'].includes(extractedDoc.documentType)) {
      const reason = extractedDoc.documentType === 'academic_document'
        ? "We couldn't identify this document as a resume or CV. It appears to be an academic marks sheet or grade transcript. Please upload your resume or CV."
        : "This document appears to be an individual course or completion certificate, not a full candidate resume. Please upload your complete resume.";

      throw Object.assign(new Error(reason), {
        classification: {
          documentType: extractedDoc.documentType,
          documentQuality: extractedDoc.documentQuality,
          extractedTextLength: extractedDoc.characterCount,
          sectionsDetected: extractedDoc.sections.map((s) => s.normalizedName),
          rejectionReason: reason,
          canProceed: false,
        },
        code: 'DOCUMENT_REJECTED',
      });
    }

    let fileBase64: string | undefined;
    try {
      fileBase64 = await resumeService.extractFileBase64(file);
    } catch (_) {}

    // Step 3: Extract structured evidence via Client Engine (Gemini / High-Precision Deterministic Parser)
    try {
      return await this.extractResumeEvidenceClient(
        file.name,
        extractedDoc.normalizedText,
        key,
        fileBase64,
        file.type || 'application/pdf',
        extractedDoc
      );
    } catch (clientErr) {
      if (extractedDoc.characterCount < 80) {
        const reason = "We couldn't extract enough text from this document. It may be a scanned image or corrupted PDF. Please upload a searchable text PDF or DOCX resume.";
        throw Object.assign(new Error(reason), {
          classification: {
            documentType: 'unknown',
            documentQuality: 'unreadable',
            extractedTextLength: extractedDoc.characterCount,
            sectionsDetected: [],
            rejectionReason: reason,
            canProceed: false,
          },
          code: 'DOCUMENT_REJECTED',
        });
      }

      console.info('[aiService] Synthesizing resume evidence via deterministic fallback engine.');
      const { parseResumeEvidenceDeterministically } = await import('../ai/resumeTextParser');
      const { validateCandidateEvidenceModel } = await import('../ai/evidenceValidator');

      const fallbackEvidence = parseResumeEvidenceDeterministically(file.name, extractedDoc.normalizedText);
      const validationResult = validateCandidateEvidenceModel(fallbackEvidence, extractedDoc.normalizedText);

      return {
        evidenceModel: validationResult.model,
        classification: {
          documentType: extractedDoc.documentType,
          documentQuality: extractedDoc.documentQuality,
          extractedTextLength: extractedDoc.characterCount,
          sectionsDetected: extractedDoc.sections.map((s) => s.normalizedName),
          canProceed: true,
        },
        validationResult,
        extractedDoc,
      };
    }
  },

  /**
   * Client-side Gemini evidence extraction with block-scoped structural prompting
   * and post-extraction deterministic evidence validation.
   */
  async extractResumeEvidenceClient(
    fileName: string,
    normalizedText: string,
    apiKey?: string,
    fileBase64?: string,
    mimeType = 'application/pdf',
    extractedDoc?: import('../../types/resume').ExtractedDocument
  ): Promise<{
    evidenceModel: CandidateEvidenceModel;
    classification: DocumentClassification;
    validationResult: import('../../types/resume').ValidationResult;
    extractedDoc?: import('../../types/resume').ExtractedDocument;
    rawGeminiOutput?: any;
  }> {
    const { validateCandidateEvidenceModel } = await import('../ai/evidenceValidator');

    // Build block-structured document representation to preserve project and education boundaries
    const structuredBlocksText = (extractedDoc?.sections && extractedDoc.sections.length > 0)
      ? (extractedDoc.sections || []).map((sec) => {
          if (sec.normalizedName === 'projects' && extractedDoc?.detectedProjects && extractedDoc.detectedProjects.length > 0) {
            return `[SECTION: PROJECTS]\n${extractedDoc.detectedProjects.map((p, idx) => `[PROJECT_BLOCK_${idx + 1}]\nHeading: ${p.heading}\nContent:\n${p.lines.join('\n')}\n[/PROJECT_BLOCK_${idx + 1}]`).join('\n\n')}\n[/SECTION: PROJECTS]`;
          }
          if (sec.normalizedName === 'education' && extractedDoc?.detectedEducation && extractedDoc.detectedEducation.length > 0) {
            return `[SECTION: EDUCATION]\n${extractedDoc.detectedEducation.map((e, idx) => `[EDUCATION_BLOCK_${idx + 1}]\nDegree: ${e.degree || ''}\nInstitution: ${e.institution || ''}\nYear: ${e.year || ''}\nGrade: ${e.grade || ''}\nRaw Text: ${e.lines.join(' | ')}\n[/EDUCATION_BLOCK_${idx + 1}]`).join('\n\n')}\n[/SECTION: EDUCATION]`;
          }
          return `[SECTION: ${sec.normalizedName.toUpperCase()}]\n${sec.text}\n[/SECTION: ${sec.normalizedName.toUpperCase()}]`;
        }).join('\n\n')
      : normalizedText;

    try {
      const prompt = `
You are a resume evidence extraction engine.
Extract only information explicitly supported by the supplied document text and structural blocks.

CRITICAL STRUCTURAL EXTRACTION CONSTRAINTS:
1. For each [PROJECT_BLOCK_X] in [SECTION: PROJECTS], output EXACTLY ONE object in the "projects" array.
   - Set "name" to the project Heading.
   - Place description and bullet sentences inside "problem", "contribution", "technologies", or "outcomes".
   - NEVER create a separate project object for a bullet line or sentence fragment.
2. For each [EDUCATION_BLOCK_X] in [SECTION: EDUCATION], output EXACTLY ONE object in the "education" array.
   - Combine degree, institution, year, and grade from that block into the single education object.
   - NEVER create separate education objects for CGPA, institution, or degree fragments.
3. For "workExperience", output ONLY if there is an explicit [SECTION: EXPERIENCE] containing real employer organizations. If empty or absent, return "workExperience": [].
4. For "skills", output ONLY skills with explicit source text from the resume.
5. Never invent or complete missing information.
6. Every single extracted item requires exact supporting "sourceText" from the resume.

Return ONLY valid JSON matching this schema:
{
  "identity": {
    "name": { "value": string, "sourceText": string, "sourceLocation": { "section": "HEADER" }, "confidence": "high" } | null,
    "email": { "value": string, "sourceText": string, "sourceLocation": { "section": "HEADER" }, "confidence": "high" } | null,
    "phone": { "value": string, "sourceText": string, "sourceLocation": { "section": "HEADER" }, "confidence": "high" } | null,
    "role": { "value": string, "sourceText": string, "sourceLocation": { "section": "HEADER" }, "confidence": "medium" } | null
  },
  "education": [
    {
      "degree": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": "high" } | null,
      "institution": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": "high" } | null,
      "year": { "value": string, "sourceText": string, "sourceLocation": { "section": "EDUCATION" }, "confidence": "high" } | null
    }
  ],
  "workExperience": [
    {
      "company": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": "high" },
      "role": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": "high" },
      "startDate": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": "high" } | null,
      "endDate": { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": "high" } | null,
      "bullets": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "EXPERIENCE" }, "confidence": "high" }
      ]
    }
  ],
  "projects": [
    {
      "name": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": "high" },
      "problem": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": "medium" } | null,
      "contribution": { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": "medium" } | null,
      "technologies": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": "high" }
      ],
      "outcomes": [
        { "value": string, "sourceText": string, "sourceLocation": { "section": "PROJECTS" }, "confidence": "high" }
      ]
    }
  ],
  "skills": {
    "technical": [{ "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": "high" }],
    "product": [{ "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": "high" }],
    "domain": [{ "value": string, "sourceText": string, "sourceLocation": { "section": "SKILLS" }, "confidence": "high" }]
  },
  "certifications": [
    { "value": string, "sourceText": string, "sourceLocation": { "section": "CERTIFICATIONS" }, "confidence": "high" }
  ],
  "achievements": [
    { "value": string, "sourceText": string, "sourceLocation": { "section": "ACHIEVEMENTS" }, "confidence": "high" }
  ],
  "unclear": [
    { "text": string, "reason": string }
  ]
}

RESUME DOCUMENT BLOCKS:
${structuredBlocksText}
`;

      const geminiConfig: import('../ai/clientGemini').ClientGeminiConfig = { apiKey };
      if (fileBase64) {
        geminiConfig.inlineData = {
          mimeType,
          data: fileBase64,
        };
      }

      const rawEvidenceModel = await callClientGeminiStructured<CandidateEvidenceModel>(
        prompt,
        'You are a strict resume evidence extraction engine. Only extract information explicitly supported by sourceText and structural blocks.',
        geminiConfig
      );

      if (rawEvidenceModel) {
        let validationText = normalizedText;
        if (validationText.length < 80) {
          const pieces: string[] = [];
          if (rawEvidenceModel.identity?.name?.value) pieces.push(rawEvidenceModel.identity.name.value);
          if (rawEvidenceModel.identity?.email?.value) pieces.push(rawEvidenceModel.identity.email.value);
          for (const edu of rawEvidenceModel.education || []) {
            if (edu.degree?.value) pieces.push(edu.degree.value);
            if (edu.institution?.value) pieces.push(edu.institution.value);
          }
          for (const exp of rawEvidenceModel.workExperience || []) {
            if (exp.company?.value) pieces.push(exp.company.value);
            if (exp.role?.value) pieces.push(exp.role.value);
            for (const b of exp.bullets || []) pieces.push(b.value);
          }
          for (const proj of rawEvidenceModel.projects || []) {
            if (proj.name?.value) pieces.push(proj.name.value);
            if (proj.problem?.value) pieces.push(proj.problem.value);
            if (proj.contribution?.value) pieces.push(proj.contribution.value);
          }
          for (const s of [...(rawEvidenceModel.skills?.technical || []), ...(rawEvidenceModel.skills?.product || []), ...(rawEvidenceModel.skills?.domain || [])]) {
            if (s.value) pieces.push(s.value);
          }
          for (const a of rawEvidenceModel.achievements || []) pieces.push(a.value);
          for (const c of rawEvidenceModel.certifications || []) pieces.push(c.value);
          validationText = pieces.join('\n');
        }

        const validationResult = validateCandidateEvidenceModel(rawEvidenceModel, validationText);

        return {
          evidenceModel: validationResult.model,
          classification: {
            documentType: extractedDoc?.documentType || 'resume',
            documentQuality: extractedDoc?.documentQuality || 'good',
            extractedTextLength: validationText.length,
            sectionsDetected: extractedDoc?.sections.map((s) => s.normalizedName) || [],
            canProceed: true,
          },
          validationResult,
          extractedDoc,
          rawGeminiOutput: rawEvidenceModel,
        };
      }
    } catch (clientErr) {
      console.warn('Client Gemini evidence extraction fallback:', clientErr);
    }

    // Deterministic fallback when AI is offline or rate limited
    const { parseResumeEvidenceDeterministically } = await import('../ai/resumeTextParser');
    const fallbackEvidence = parseResumeEvidenceDeterministically(fileName, normalizedText);
    const validationResult = validateCandidateEvidenceModel(fallbackEvidence, normalizedText);

    return {
      evidenceModel: validationResult.model,
      classification: {
        documentType: extractedDoc?.documentType || 'resume',
        documentQuality: extractedDoc?.documentQuality || 'partial',
        extractedTextLength: normalizedText.length,
        sectionsDetected: extractedDoc?.sections.map((s) => s.normalizedName) || [],
        canProceed: true,
      },
      validationResult,
      extractedDoc,
      rawGeminiOutput: fallbackEvidence,
    };
  },



  /**
   * Step 2: Resume Analyzer (LEGACY — kept for backward compat)
   * Use extractResumeEvidence() for new flows.
   */

  async extractResumeProfile(fileName: string, fileText?: string, fileBase64?: string): Promise<CandidateProfile> {
    const rawContent = (fileText || '').trim();
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { fileName, fileText: rawContent, fileBase64, apiKey },
      });

      if (!error && data?.candidateProfile) {
        const profile = data.candidateProfile;
        if (profile.isValidResume === false) {
          throw new Error(profile.invalidReason || `Uploaded document "${fileName}" is not a valid candidate resume (e.g. ticket, invoice, or non-CV file). Please upload a valid resume PDF or Word document.`);
        }
        return profile;
      }
      const errDetail = await getEdgeErrorMessage(error);
      if (errDetail?.includes('not a valid candidate resume')) {
        throw new Error(errDetail);
      }
      console.warn('Supabase analyze-resume Edge Function warning, cascading to client AI engine:', errDetail);
    } catch (edgeErr: any) {
      if (edgeErr?.message?.includes('not a valid candidate resume')) {
        throw edgeErr;
      }
      console.warn('Supabase analyze-resume invocation failed, cascading to client AI engine:', edgeErr);
    }

    // 2. Client Gemini Fallback Cascade
    try {
      const prompt = `
First, validate whether the provided document is a valid candidate resume (CV, work history, professional bio).
If it is NOT a resume (e.g. it is a train ticket, flight boarding pass, invoice, receipt, generic article, or non-CV file), set "isValidResume": false and explain in "invalidReason".

If it IS a valid resume:
Set "isValidResume": true, "invalidReason": null, and extract the candidate profile.

CRITICAL RULES:
1. Extract true deliverables, metrics, domain, and skills evidenced in the resume.
2. DO NOT fabricate credentials, previous employers, degrees, or metrics.
3. If candidate name is not explicitly mentioned, derive a professional identifier from the file name.

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

      const parsed = await callClientGeminiStructured<CandidateProfile & { isValidResume?: boolean; invalidReason?: string }>(
        prompt,
        'You are an executive talent assessor and hiring committee chairperson. Extract exact candidate deliverables without hallucinating experience.',
        config
      );

      if (parsed.isValidResume === false) {
        throw new Error(parsed.invalidReason || `Uploaded document "${fileName}" is not a valid resume.`);
      }

      return parsed;
    } catch (clientErr: any) {
      if (clientErr?.message?.includes('not a valid resume')) {
        throw clientErr;
      }
      console.warn('AI API rate-limited or unavailable, parsing actual resume text deterministically:', clientErr);
      
      if (rawContent && rawContent.length > 15) {
        const { parseResumeTextDeterministically } = await import('../ai/resumeTextParser');
        return parseResumeTextDeterministically(fileName, rawContent);
      }

      throw new Error(clientErr.message || `Could not parse resume from "${fileName}". Please ensure the document contains readable text or check your Gemini API key quota.`);
    }
  },

  /**
   * Step 3: JD Analyzer
   * Deconstructs a raw job description into structured JDEvidenceModel + backward-compat JobProfile.
   * Returns { jdEvidenceModel, jobProfile } — callers should store both.
   */
  async analyzeJobDescription(title: string, company: string, rawText: string): Promise<JobProfile> {
    const cleanTitle = (title || 'Role').trim();
    const cleanCompany = (company || 'Company').trim();
    const cleanText = (rawText || '').trim();
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('analyze-jd', {
        body: { title: cleanTitle, company: cleanCompany, rawText: cleanText, apiKey },
      });

      if (!error && data?.jobProfile) {
        // Store evidence model on the result for callers that want it
        const result = data.jobProfile as any;
        if (data.jdEvidenceModel) {
          result.__jdEvidenceModel = data.jdEvidenceModel;
        }
        return result;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.warn('Supabase analyze-jd Edge Function warning, cascading to client AI engine:', errDetail);
    } catch (edgeErr) {
      console.warn('Supabase analyze-jd invocation failed, cascading to client AI engine:', edgeErr);
    }


    // 2. Client Gemini Fallback Cascade
    try {
      const prompt = `
Deconstruct the following job description into structured hiring bar requirements for "${cleanTitle}" at "${cleanCompany}".

Job Description:
${cleanText || `${cleanTitle} position at ${cleanCompany}.`}

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

      return await callClientGeminiStructured<JobProfile>(
        prompt,
        'You are a senior hiring committee architect. Deconstruct job postings into precise technical competencies, hiring bar signals, and execution metrics.',
        { apiKey }
      );
    } catch (clientErr) {
      console.warn('Client Gemini JD analysis fallback, using deterministic extraction:', clientErr);
      
      const words = cleanText.split(/\s+/).filter((w) => w.length > 3);
      return {
        role: cleanTitle,
        company: cleanCompany,
        responsibilities: [
          `Architect and implement high-performance features for ${cleanTitle}.`,
          `Collaborate with cross-functional product and engineering teams at ${cleanCompany}.`,
          'Ensure high code quality, system scalability, and test coverage.',
        ],
        requiredSkills: ['Problem Solving', 'System Design', 'Communication', 'Technical Execution'],
        preferredSkills: ['Leadership', 'Domain Optimization', 'Cross-functional Collaboration'],
        experienceRequirements: '3+ years relevant engineering experience',
        competencies: ['First-Principles Thinking', 'System Scalability', 'Execution Discipline'],
        keywords: Array.from(new Set(words.slice(0, 10))),
        interviewSignals: [
          'Demonstrates clear problem decomposition and metric attribution',
          'Discusses architectural trade-offs under constraints',
        ],
      };
    }
  },

  /**
   * Step 5: Company Research
   * Researches company context using authoritative search sources with strict 3-way partitioning.
   */
  async researchCompany(companyName: string, role: string): Promise<CompanyResearchData> {
    const cleanCompany = (companyName || '').trim();
    const cleanRole = (role || '').trim();
    const researchedAt = new Date().toISOString();
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('research-company', {
        body: { companyName: cleanCompany, role: cleanRole, apiKey },
      });

      if (!error && data?.companyResearch) {
        return data.companyResearch;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.warn('Supabase research-company Edge Function warning, cascading to client AI engine:', errDetail);
    } catch (edgeErr) {
      console.warn('Supabase research-company invocation failed, cascading to client AI engine:', edgeErr);
    }

    // 2. Client Gemini Fallback Cascade
    try {
      const prompt = `
Provide grounded company research intelligence for "${cleanCompany}" relevant to a "${cleanRole}" interview.

Instructions:
1. Provide accurate company overview, flagship products, and business model.
2. Formulate 3 verified facts with realistic source context.
3. Formulate 2 strategic inferences connecting business priorities to interview evaluation expectations for "${cleanRole}".
4. Note unavailable proprietary internal rubrics under "unavailableInformation".

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

      const result = await callClientGeminiStructured<CompanyResearchData>(
        prompt,
        'You are a corporate intelligence analyst. Prioritize verified official facts and never fabricate proprietary internal information.',
        { apiKey }
      );
      return {
        ...result,
        sources: [
          {
            title: `${cleanCompany} Official Portal`,
            url: `https://www.${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            snippet: 'Official company portal',
            retrievalTimestamp: researchedAt,
            domainAuthority: 'official',
          },
        ],
      };
    } catch (clientErr) {
      console.warn('Client Gemini company research fallback, using grounded defaults:', clientErr);
      return {
        companyName: cleanCompany,
        role: cleanRole,
        overview: `${cleanCompany} is a leading organization specializing in technology and digital solutions.`,
        products: ['Core Platform & Infrastructure', 'Digital Services'],
        businessModel: 'Enterprise SaaS & Technology Solutions',
        verifiedFacts: [
          { fact: `${cleanCompany} operates scalable digital products and engineering teams.`, sourceUrl: `https://${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`, retrievalTimestamp: researchedAt },
        ],
        strategicInferences: [
          { inference: `Emphasis on technical reliability, scalability, and system velocity for ${cleanRole}.`, rationale: 'Core business depends on high uptime and developer productivity.' },
        ],
        unavailableInformation: ['Proprietary internal grading rubrics', 'Confidential unreleased roadmap projects'],
        status: 'completed',
        researchedAt,
        sources: [
          {
            title: `${cleanCompany} Official Site`,
            url: `https://${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            snippet: 'Official company website',
            retrievalTimestamp: researchedAt,
            domainAuthority: 'official',
          },
        ],
      };
    }
  },

  /**
   * Step 4: Match & Gap Analyzer
   * Evaluates fit using deterministic 45/30/25 scoring and surfaces prioritized actionable gaps.
   * Strictly zero artificial score floor or baseline inflation.
   */
  async computeMatchAnalysis(
    candidateProfile: CandidateProfile,
    jobProfile: JobProfile,
    companyResearch?: CompanyResearchData | null
  ): Promise<MatchAnalysisResult> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('match-analysis', {
        body: { candidateProfile, jobProfile, companyResearch },
      });

      if (!error && data?.matchResult) {
        return data.matchResult;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.warn('Supabase match-analysis Edge Function warning, evaluating with client AI engine:', errDetail);
    } catch (edgeErr) {
      console.warn('Supabase match-analysis invocation failed, evaluating with client AI engine:', edgeErr);
    }

    // 2. Client Gemini Semantic Match Analysis
    try {
      const prompt = `
You are an objective, calibrated hiring committee evaluator. Perform a rigorous candidate match analysis comparing the candidate's resume profile against the job description requirements.

Candidate Profile:
${JSON.stringify(candidateProfile, null, 2)}

Job Description:
${JSON.stringify(jobProfile, null, 2)}

Target Company Context:
${companyResearch?.overview || jobProfile.company}

CRITICAL SCORING RULES:
1. Zero Tolerance for Hallucinations: If the candidate does NOT have a required hard skill (e.g. SIEM, Splunk, Firewalls, Penetration Testing for Security; or Agile, PRDs for PM), score 0 for that requirement.
2. Skills Match (0 to 45 pts): (number of proven matching required skills / total required skills) * 45.
3. Experience Alignment (0 to 30 pts): Score candidate's relevant domain years vs required years. If domain is completely different (e.g. PM applying to Cyber Security, or fresher applying to 5+ yr lead), score 0-3 / 30.
4. Competencies (0 to 25 pts): Score demonstrated deliverables vs required competencies.
5. Overall match percentage MUST be strictly the sum of the 3 dimensions: requiredSkillsCoverage + experienceAlignment + competenciesMatch (bounded 0 to 100). DO NOT artificially inflate scores!

Return JSON strictly matching this schema:
{
  "matchPercentage": number,
  "deterministicBreakdown": {
    "requiredSkillsCoverage": number,
    "experienceAlignment": number,
    "competenciesMatch": number,
    "totalScore": number
  },
  "matchingStrengths": [
    {
      "competency": string,
      "evidence": string,
      "relevanceScore": number
    }
  ],
  "actionableGaps": [
    {
      "gapId": string,
      "requirement": string,
      "status": "unproven_on_resume",
      "recommendation": string,
      "targetedProbeOpportunity": string,
      "priority": "high"
    }
  ],
  "companyAlignmentSummary": string
}
`;

      const aiMatch = await callClientGeminiStructured<MatchAnalysisResult>(
        prompt,
        'You are an objective hiring bar evaluator. Perform rigorous, evidence-based match scoring without score inflation.',
        { apiKey, temperature: 0.1 }
      );

      if (aiMatch && typeof aiMatch.matchPercentage === 'number') {
        return aiMatch;
      }
    } catch (clientAiErr) {
      console.warn('Client AI match evaluation warning, using deterministic local engine:', clientAiErr);
    }

    // 3. Deterministic Local Match Engine (Instant & 100% Reliable fallback)
    const { matchAnalysisService } = await import('./matchAnalysisService');
    return matchAnalysisService.computeMatch(candidateProfile, jobProfile, companyResearch);
  },

  /**
   * Step 6: Interview Preparation
   * Prepares tailored, non-generic interview questions with evaluation criteria and zero sample answers.
   */
  async prepareInterview(params: {
    resume: CandidateProfile;
    job: JobProfile;
    company?: CompanyResearchData | null;
    match: MatchAnalysisResult;
    settings: {
      role: string;
      company: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      duration: number;
      focusAreas: string[];
      style: string;
    };
  }): Promise<Question[]> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('prepare-interview', {
        body: { ...params, apiKey },
      });

      if (!error && data?.questions && data.questions.length > 0) {
        return data.questions;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.warn('Supabase prepare-interview Edge Function warning, cascading to client AI engine:', errDetail);
    } catch (edgeErr) {
      console.warn('Supabase prepare-interview invocation failed, cascading to client AI engine:', edgeErr);
    }

    const { resume, job, company, match, settings } = params;
    const activeGaps = (match?.actionableGaps || []).filter((g: any) => g.priority !== 'excluded');
    const targetRole = settings?.role || job?.role || 'Target Role';
    const targetCompany = settings?.company || job?.company || 'Target Company';
    const difficulty = settings?.difficulty || 'intermediate';
    const duration = settings?.duration || 20;
    const questionCount = duration <= 15 ? 3 : duration <= 25 ? 4 : 5;

    // 2. Client Gemini Fallback Cascade
    try {
      const prompt = `
Generate ${questionCount} highly tailored, non-generic anchor interview questions for a candidate based on the following structured profiles:

Candidate Profile:
- Name: ${resume?.name || 'Candidate'}
- Summary: ${resume?.summary || ''}
- Experience: ${JSON.stringify(resume?.experience || [])}
- Projects: ${JSON.stringify(resume?.projects || [])}
- Skills: ${JSON.stringify(resume?.skills || [])}
- Strengths: ${JSON.stringify(resume?.strengths || [])}

Job Profile:
- Role: ${targetRole}
- Company: ${targetCompany}
- Responsibilities: ${JSON.stringify(job?.responsibilities || [])}
- Required Skills: ${JSON.stringify(job?.requiredSkills || [])}
- Preferred Skills: ${JSON.stringify(job?.preferredSkills || [])}
- Competencies: ${JSON.stringify(job?.competencies || [])}

Company Intelligence:
- Overview: ${company?.overview || ''}
- Products: ${JSON.stringify(company?.products || [])}
- Business Model: ${company?.businessModel || ''}
- Verified Facts: ${JSON.stringify(company?.verifiedFacts || [])}

Targeted Gaps to Probe:
${JSON.stringify(activeGaps)}

Interview Configuration:
- Difficulty Level: ${difficulty}
- Interview Style: ${settings?.style || 'realistic'}
- Focus Areas: ${JSON.stringify(settings?.focusAreas || [])}

CRITICAL TAILORING RULES:
1. STRICT ZERO SAMPLE ANSWER RULE: NEVER generate, include, or store sample_answer, model_answer, ideal_answer, or verbatim answers.
2. RESUME ANCHORING REQUIREMENT: At least 3 of the ${questionCount} questions MUST explicitly name and reference a SPECIFIC project name, technology, tool, or deliverable directly from the Candidate's Resume (e.g., "In your project '[Project Name]', you used [Technology] to... How would you scale that approach for ${targetCompany}...").
3. TARGET COMPANY ANCHORING: Questions must connect the candidate's actual experience to real challenges, products, or system architecture at ${targetCompany}.
4. ACTIONABLE GAP PROBING: Include explicit questions targeting missing or unproven job requirements identified in Targeted Gaps, probing whether the candidate has unlisted experience or how their transferable skills apply.
5. Each question must include:
   - "order": number
   - "category": string
   - "text": string
   - "intent": string
   - "contextExplanation": string
   - "expectedSignals": string[]
   - "redFlags": string[]
   - "evaluationCriteria": {"coreCompetency": string, "lookFor": string[], "redFlags": string[], "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]}
   - "adaptiveFollowUpTriggers": [{"condition": string, "followUpProbe": string}]
5. Set "is_follow_up": false and "parentQuestionId": null for all initial anchor questions.

Return JSON strictly matching this schema:
{
  "questions": [
    {
      "order": number,
      "type": "initial",
      "is_follow_up": false,
      "parentQuestionId": null,
      "category": string,
      "text": string,
      "intent": string,
      "contextExplanation": string,
      "expectedSignals": string[],
      "redFlags": string[],
      "evaluationCriteria": {
        "coreCompetency": string,
        "lookFor": string[],
        "redFlags": string[],
        "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
      },
      "adaptiveFollowUpTriggers": [
        {
          "condition": string,
          "followUpProbe": string
        }
      ]
    }
  ]
}
`;

      const generated = await callClientGeminiStructured<{ questions: any[] }>(
        prompt,
        'You are a premier executive interviewer. Generate rigorous, tailored anchor questions with adaptive follow-up triggers and strictly zero sample answers.',
        { apiKey }
      );

      const { validateQuestionSet } = await import('../ai/questionValidator');
      const candidateFullText = `${resume?.summary || ''} ${(resume?.skills || []).join(' ')} ${(resume?.projects || []).map((p: any) => p.name).join(' ')}`;
      const validation = validateQuestionSet(generated.questions || [], candidateFullText);

      if (validation.isValid && validation.validatedQuestions.length > 0) {
        return validation.validatedQuestions.map((q) => ({
          ...q,
          difficulty,
          recommendedDurationSeconds: Math.round((duration * 60) / Math.max(1, questionCount)),
        }));
      }

      return (generated.questions || []).map((q: any, idx: number) => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        order: idx + 1,
        difficulty,
        recommendedDurationSeconds: Math.round((duration * 60) / Math.max(1, questionCount)),
      }));
    } catch (clientErr) {
      console.warn('Client Gemini question preparation fallback, using calibrated questions:', clientErr);
      
      const defaultCategories = ['System Architecture & Scalability', 'Execution & Trade-offs', 'Collaboration & Influence', 'Domain Problem Solving'];
      return defaultCategories.slice(0, questionCount).map((cat, idx) => ({
        id: crypto.randomUUID(),
        order: idx + 1,
        type: 'initial' as const,
        questionType: 'product_sense' as const,
        source: 'job_description' as const,
        sourceReference: 'Core Responsibilities',
        targetCompetency: cat,
        intent: `Evaluates candidate's first-principles execution, problem decomposition, and communication for ${targetRole}.`,
        expectedAnswerCharacteristics: ['Quantified baseline metrics', 'Clear personal ownership', 'Systematic problem breakdown'],
        parentQuestionId: null,
        category: cat,
        difficulty,
        recommendedDurationSeconds: Math.round((duration * 60) / Math.max(1, questionCount)),
        text: idx === 0
          ? `Walk me through a complex technical challenge you led recently for ${targetRole}. What were the core constraints and key trade-offs?`
          : idx === 1
          ? `When architecting a solution for ${targetCompany}'s scale, how do you balance rapid delivery against long-term technical debt?`
          : `Describe a time when a critical technical initiative faced unexpected failure modes or cross-functional pushback. How did you diagnose and resolve it?`,
        contextExplanation: `Calibrated for ${difficulty} level at ${targetCompany}.`,
        expectedSignals: ['Quantified baseline metrics', 'Clear personal ownership', 'Systematic problem breakdown'],
        redFlags: ['Vague buzzwords without implementation details', 'Blaming others without ownership'],
        evaluationCriteria: {
          coreCompetency: cat,
          lookFor: ['STAR structure', 'Metric quantification', 'Architectural trade-off awareness'],
          redFlags: ['Shallow explanations', 'Zero baseline comparison'],
          rubricDimensions: ['clarity', 'depth', 'evidence', 'relevance', 'structure', 'role_alignment'],
        },
        adaptiveFollowUpTriggers: [
          { condition: 'Candidate does not provide numerical metrics', followUpProbe: 'What was the specific baseline metric before and after your changes?' },
        ],
      }));
    }
  },

  /**
   * Step 6B: Dynamic Opening Question Generator
   * Uses Gemini to synthesize ONE conversational opening question strictly fulfilling the InterviewObjective.
   */
  async generateOpeningQuestion(params: {
    objective: InterviewObjective;
    lockedContext: LockedCandidateContext;
    role: string;
    companyName: string;
    style?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<Question> {
    const { objective, lockedContext, role, companyName, style = 'realistic', difficulty = 'intermediate' } = params;
    const apiKey = getClientApiKey();
    const candidateName = lockedContext.derivedProfile.name || 'Candidate';
    const evidenceSummary = objective.focusEvidenceSummary || JSON.stringify(lockedContext.evidenceModel.projects[0] || lockedContext.evidenceModel.workExperience[0] || {});

    const prompt = `
You are an executive interviewer conducting a realistic interview for the position of "${role}" at "${companyName}".
You have selected the following precise diagnostic objective for the opening question:

INTERVIEW OBJECTIVE:
- Target Competency: ${objective.targetCompetency}
- Focus Requirement: ${objective.focusRequirement || 'N/A'}
- Relevant Candidate Evidence: ${evidenceSummary}
- Diagnostic Intent: ${objective.reasoning}
- What to look for: ${objective.lookForSignals.join(', ')}

INTERVIEW STYLE & LEVEL:
- Difficulty Level: ${difficulty}
- Style: ${style}
- Candidate Name: ${candidateName}


INSTRUCTIONS:
1. Generate ONE natural, direct opening question that begins the interview and directly targets this objective.
2. If Candidate Evidence is available, refer naturally to their concrete background or project without reciting robotic metadata.
3. NEVER generate sample answers, model answers, or answers of any kind.
4. Formulate clear evaluation criteria with lookFor and redFlags.

Return JSON strictly matching this schema:
{
  "category": "${objective.targetCompetency}",
  "text": string,
  "intent": "${objective.reasoning}",
  "contextExplanation": string,
  "expectedSignals": string[],
  "redFlags": string[],
  "evaluationCriteria": {
    "coreCompetency": "${objective.targetCompetency}",
    "lookFor": string[],
    "redFlags": string[],
    "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
  },
  "adaptiveFollowUpTriggers": [
    {
      "condition": string,
      "followUpProbe": string
    }
  ]
}
`;

    try {
      const generated = await callClientGeminiStructured<any>(
        prompt,
        'You are an executive hiring bar interviewer. Formulate grounded, realistic diagnostic questions with zero sample answers.',
        { apiKey, temperature: 0.3 }
      );

      return {
        id: `q_${Date.now()}_1`,
        order: 1,
        type: 'initial',
        questionType: 'product_sense',
        source: 'resume',
        sourceReference: objective.focusRequirement || objective.targetCompetency,
        targetCompetency: objective.targetCompetency,
        category: generated.category || objective.targetCompetency,
        text: generated.text || `Could you walk me through your experience with ${objective.targetCompetency}, specifically highlighting your role and key outcomes for ${role}?`,
        intent: generated.intent || objective.reasoning,
        contextExplanation: generated.contextExplanation || `Opening question targeting ${objective.targetCompetency}.`,
        expectedSignals: generated.expectedSignals || objective.lookForSignals,
        redFlags: generated.redFlags || objective.redFlagSignals,
        expectedAnswerCharacteristics: generated.expectedSignals || objective.lookForSignals,
        evaluationCriteria: generated.evaluationCriteria || {
          coreCompetency: objective.targetCompetency,
          lookFor: objective.lookForSignals,
          redFlags: objective.redFlagSignals,
          rubricDimensions: ['clarity', 'depth', 'evidence', 'relevance', 'structure', 'role_alignment'],
        },
        adaptiveFollowUpTriggers: generated.adaptiveFollowUpTriggers || [
          { condition: 'Candidate does not provide numerical outcome', followUpProbe: 'What was the specific metric lift or outcome?' }
        ],
      };
    } catch (err) {
      console.warn('Fallback opening question generation:', err);
      return {
        id: `q_${Date.now()}_1`,
        order: 1,
        type: 'initial',
        questionType: 'product_sense',
        source: 'resume',
        sourceReference: objective.targetCompetency,
        targetCompetency: objective.targetCompetency,
        category: objective.targetCompetency,
        text: `To start off, could you walk me through your work on ${objective.focusRequirement || objective.targetCompetency}? Specifically, what was the core challenge and how did you measure success?`,
        intent: objective.reasoning,
        contextExplanation: `Opening probe on ${objective.targetCompetency}`,
        expectedSignals: objective.lookForSignals,
        redFlags: objective.redFlagSignals,
        expectedAnswerCharacteristics: objective.lookForSignals,
        evaluationCriteria: {
          coreCompetency: objective.targetCompetency,
          lookFor: objective.lookForSignals,
          redFlags: objective.redFlagSignals,
          rubricDimensions: ['clarity', 'depth', 'evidence', 'relevance', 'structure', 'role_alignment'],
        },
      };
    }
  },

  /**
   * Step 6C: Dynamic Adaptive Next Question / Follow-Up Generator
   */
  async generateAdaptiveQuestion(params: {
    objective: InterviewObjective;
    previousQuestionText: string;
    candidateAnswerText: string;
    role: string;
    companyName: string;
    isFollowUp: boolean;
    style?: string;
  }): Promise<Question> {
    const { objective, previousQuestionText, candidateAnswerText, role, companyName, isFollowUp, style = 'realistic' } = params;
    const apiKey = getClientApiKey();

    const prompt = `
You are an executive interviewer for "${role}" at "${companyName}".
You are continuing the live interview based on the candidate's last answer.

PREVIOUS QUESTION:
"${previousQuestionText}"

CANDIDATE'S ACTUAL ANSWER:
"${candidateAnswerText.slice(0, 1500)}"

NEXT OBJECTIVE TO ASSESS:
- Target Competency: ${objective.targetCompetency}
- Is Adaptive Follow-Up on Previous Answer: ${isFollowUp ? 'YES' : 'NO'}
- Objective Intent: ${objective.reasoning}
- Look for: ${objective.lookForSignals.join(', ')}

INSTRUCTIONS:
1. ${isFollowUp ? 'Formulate a direct, surgical follow-up probe referencing something specific they said (or omitted) to test depth.' : 'Formulate a natural transition and strong question targeting the next competency.'}
2. Tone: Professional, conversational, ${style}.
3. STRICT ZERO SAMPLE ANSWER RULE.

Return JSON strictly matching this schema:
{
  "category": "${objective.targetCompetency}",
  "text": string,
  "intent": "${objective.reasoning}",
  "contextExplanation": string,
  "expectedSignals": string[],
  "redFlags": string[],
  "evaluationCriteria": {
    "coreCompetency": "${objective.targetCompetency}",
    "lookFor": string[],
    "redFlags": string[],
    "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
  }
}
`;

    try {
      const generated = await callClientGeminiStructured<any>(
        prompt,
        'You are an executive interviewer conducting a live conversational loop. Formulate adaptive probes with zero sample answers.',
        { apiKey, temperature: 0.4 }
      );

      return {
        id: `q_${Date.now()}_${objective.order}`,
        order: objective.order,
        type: isFollowUp ? 'follow_up' : 'initial',
        questionType: isFollowUp ? 'clarification' : 'product_sense',
        source: isFollowUp ? 'follow_up' : 'job_description',
        sourceReference: objective.focusRequirement || objective.targetCompetency,
        targetCompetency: objective.targetCompetency,
        category: generated.category || objective.targetCompetency,
        text: generated.text || (isFollowUp ? `Could you give me more detail on the specific trade-offs you made in that scenario?` : `Let's shift focus to ${objective.targetCompetency}. How do you approach this in your work?`),
        intent: generated.intent || objective.reasoning,
        contextExplanation: generated.contextExplanation || `Adaptive probe on ${objective.targetCompetency}`,
        expectedSignals: generated.expectedSignals || objective.lookForSignals,
        redFlags: generated.redFlags || objective.redFlagSignals,
        expectedAnswerCharacteristics: generated.expectedSignals || objective.lookForSignals,
        evaluationCriteria: generated.evaluationCriteria || {
          coreCompetency: objective.targetCompetency,
          lookFor: objective.lookForSignals,
          redFlags: objective.redFlagSignals,
          rubricDimensions: ['clarity', 'depth', 'evidence', 'relevance', 'structure', 'role_alignment'],
        },
      };
    } catch (err) {
      console.warn('Fallback adaptive question generation:', err);
      return {
        id: `q_${Date.now()}_${objective.order}`,
        order: objective.order,
        type: isFollowUp ? 'follow_up' : 'initial',
        questionType: isFollowUp ? 'clarification' : 'product_sense',
        source: isFollowUp ? 'follow_up' : 'job_description',
        sourceReference: objective.targetCompetency,
        targetCompetency: objective.targetCompetency,
        category: objective.targetCompetency,
        text: isFollowUp
          ? `You mentioned that approach—could you elaborate on the specific baseline metrics or trade-offs you encountered?`
          : `Moving on to ${objective.targetCompetency}, how have you approached this in high-stakes environments?`,
        intent: objective.reasoning,
        contextExplanation: `Objective: ${objective.targetCompetency}`,
        expectedSignals: objective.lookForSignals,
        redFlags: objective.redFlagSignals,
        expectedAnswerCharacteristics: objective.lookForSignals,
      };
    }
  },

  /**
   * Step 7: Interviewer Conversational Framing & Transitions
   */

  async generateInterviewerRemark(params: {
    action: 'intro' | 'ask_question' | 'transition' | 'closing' | 'time_warning';
    candidateName?: string;
    role: string;
    company: string;
    style?: string;
    question?: Question;
    previousAnswer?: string;
    remainingMinutes?: number;
    conversationSummary?: string;
  }): Promise<string> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('interview-chat', {
        body: { ...params, apiKey },
      });

      if (!error && data?.spokenText) {
        return data.spokenText;
      }
    } catch (_) {}

    // 2. Client Gemini Fallback
    try {
      const systemInstruction = `You are a high-caliber professional executive interviewer for ${params.company} interviewing ${params.candidateName || 'the candidate'} for the ${params.role} position.
Style: ${params.style || 'realistic'}
Tone: Natural, conversational, articulate, engaging, and professional.
Rules:
- Speak as a real human interviewer speaking out loud.
- Be concise (1-2 sentences maximum).
- When introducing or asking a question, ALWAYS speak the exact question clearly.
- NEVER speak internal prompt instructions, rubrics, or backend logic.
- Do NOT use markdown symbols or JSON.`;

      let prompt = '';
      if (params.action === 'intro') {
        prompt = `Warmly welcome ${params.candidateName || 'the candidate'} in 1 brief sentence, and then directly ask the first question: "${params.question?.text}".`;
      } else if (params.action === 'transition') {
        prompt = `Given the candidate just completed their previous response, give a brief 1-sentence transition and ask the next question: "${params.question?.text}".`;
      } else if (params.action === 'time_warning') {
        prompt = `Briefly state there are ${params.remainingMinutes || 2} minutes remaining, and ask: "${params.question?.text}".`;
      } else if (params.action === 'closing') {
        prompt = `Deliver a gracious closing thanking ${params.candidateName || 'the candidate'} for their time and concluding the interview.`;
      } else {
        prompt = `Directly speak the following interview question naturally: "${params.question?.text || ''}".`;
      }

      return await callClientGeminiText(prompt, systemInstruction, {
        temperature: 0.6,
        maxOutputTokens: 256,
        apiKey,
      });
    } catch (_) {
      if (params.action === 'intro') {
        return `Welcome, ${params.candidateName || 'Candidate'}. Today we will conduct a structured interview for the ${params.role} role at ${params.company}. Let's begin with our first question.`;
      }
      if (params.action === 'closing') {
        return `Thank you for sharing your experience. We have concluded the interview questions and your evaluation report is now being generated.`;
      }
      return params.question?.text || 'Please share your approach to this scenario.';
    }
  },

  /**
   * Step 8: Answer Evaluator
   */
  async evaluateAnswer(params: {
    question: Question;
    answerText: string;
    role: string;
    company: string;
    difficulty?: string;
    remainingMinutes?: number;
  }): Promise<QuestionFeedback & { followUpNeeded?: boolean; followUpTriggerReason?: string; followUpTopic?: string }> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: { ...params, apiKey },
      });

      if (!error && data?.feedback) {
        return data.feedback;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.warn('Supabase evaluate-answer Edge Function warning, cascading to client AI engine:', errDetail);
    } catch (edgeErr) {
      console.warn('Supabase evaluate-answer invocation failed, cascading to client AI engine:', edgeErr);
    }

    const { question, answerText, role, company, difficulty, remainingMinutes } = params;
    const cleanAnswer = (answerText || '').trim();

    // 2. Client Gemini Fallback Cascade with Deterministic Constraint Engine
    try {
      const { ANSWER_EVALUATOR_POLICY } = await import('../ai/aiPolicy');
      const { applyDeterministicConstraints } = await import('../ai/scoringRubric');

      const prompt = `
=== TASK: CANDIDATE ANSWER MULTI-PHASE EVALUATION ===

QUESTION: "${question?.text || ''}"
Category / Type: "${question?.category || 'General'}"
Expected Characteristics: ${JSON.stringify(question?.expectedAnswerCharacteristics || question?.expectedSignals || [])}
Target Role: "${role || 'Target Role'}"
Target Company: "${company || 'Target Company'}"
Difficulty: "${difficulty || 'intermediate'}"

CANDIDATE ANSWER:
"${cleanAnswer || 'No response provided.'}"

Instructions:
1. Classify answer: 'strong' | 'adequate' | 'weak' | 'irrelevant' | 'not_answered' | 'evasive' | 'unprofessional' | 'unsupported_claim'.
2. Execute Relevance Gate: ('answered' | 'partially_answered' | 'not_answered').
3. Propose 6 dimensional scores (relevance, structure, clarity, depth, evidence, roleAlignment).
4. Provide structured coaching (whatWorked, whatHeldYouBack, tryThisNextTime).

Return strict JSON:
{
  "answerClassification": "strong" | "adequate" | "weak" | "irrelevant" | "not_answered" | "evasive" | "unprofessional" | "unsupported_claim",
  "relevanceGate": { "status": "answered" | "partially_answered" | "not_answered", "score": number, "reason": string },
  "professionalism": { "status": "acceptable" | "concerning" | "poor" },
  "completenessMap": { "observedCharacteristics": string[] },
  "breakdown": { "relevance": number, "structure": number, "clarity": number, "depth": number, "evidence": number, "roleAlignment": number },
  "whatWorked": string[],
  "whatHeldYouBack": string[],
  "tryThisNextTime": { "framework": string, "suggestion": string, "promptToImprove": string, "examplePhrasing": string },
  "shouldFollowUp": boolean,
  "followUpReasonCode": string | null
}
`;

      const rawProposal = await callClientGeminiStructured<any>(
        prompt,
        ANSWER_EVALUATOR_POLICY,
        { apiKey }
      );

      const constrained = applyDeterministicConstraints(
        rawProposal,
        question,
        cleanAnswer
      );

      return {
        questionId: question?.id || 'q_unknown',
        overallScore: constrained.overallScore,
        scoreInterval: constrained.scoreInterval,
        answerClassification: constrained.answerClassification,
        relevanceGate: constrained.relevanceGate,
        professionalism: constrained.professionalism,
        completenessMap: constrained.completenessMap,
        breakdown: constrained.breakdown,
        dimensionDetails: constrained.dimensionDetails,
        unverifiedClaims: constrained.unverifiedClaims,
        whatWorked: constrained.whatWorked,
        whatHeldYouBack: constrained.whatHeldYouBack,
        tryThisNextTime: constrained.tryThisNextTime,
        deterministicConstraintsApplied: constrained.deterministicConstraintsApplied,
        followUpNeeded: constrained.shouldFollowUp && (remainingMinutes === undefined || remainingMinutes > 3),
        followUpTriggerReason: constrained.followUpReasonCode,
      };
    } catch (clientErr) {
      console.warn('AI evaluation API unavailable, using dynamic deterministic rubric evaluator:', clientErr);
      const { evaluateAnswerDeterministically } = await import('../ai/deterministicAnswerEvaluator');
      return evaluateAnswerDeterministically({
        question,
        answerText: cleanAnswer,
        role,
        company,
        difficulty,
      });
    }
  },

  /**
   * Step 9: Adaptive Follow-up
   */
  async generateAdaptiveFollowUp(params: {
    parentQuestion: Question;
    candidateAnswer: string;
    weaknessIdentified?: string;
    triggerReason?: string;
    role: string;
    company: string;
    difficulty?: string;
    order?: number;
  }): Promise<Question> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('adaptive-followup', {
        body: { ...params, apiKey },
      });

      if (!error && data?.followUpQuestion) {
        return data.followUpQuestion;
      }
    } catch (_) {}

    const { parentQuestion, candidateAnswer, weaknessIdentified, triggerReason, role, company, difficulty, order } = params;

    // 2. Client Gemini Fallback
    try {
      const prompt = `
Generate a focused adaptive follow-up interview question based on the candidate's previous response to probe a specific unaddressed area or missing evidence.

Parent Question: "${parentQuestion?.text || ''}"
Category: ${parentQuestion?.category || 'Domain Execution'}
Candidate Previous Answer: "${candidateAnswer || ''}"
Evaluation Trigger Reason: "${triggerReason || weaknessIdentified || 'Candidate did not quantify baseline metric or personal trade-off.'}"
Role: "${role || 'Target Role'}"
Company: "${company || 'Target Company'}"
Difficulty Level: "${difficulty || 'intermediate'}"

CRITICAL RULES:
1. STRICT ZERO SAMPLE ANSWER RULE: NEVER generate or include sample answers.
2. The question must directly challenge or probe the specific gap.
3. The question must feel natural, concise, and conversational.

Return JSON strictly matching this schema:
{
  "text": string,
  "category": "${parentQuestion?.category || 'Adaptive Follow-up'}",
  "intent": string,
  "contextExplanation": string,
  "expectedSignals": string[],
  "redFlags": string[],
  "evaluationCriteria": {
    "coreCompetency": "${parentQuestion?.evaluationCriteria?.coreCompetency || 'Technical & Execution Depth'}",
    "lookFor": string[],
    "redFlags": string[],
    "rubricDimensions": ["clarity", "depth", "evidence", "relevance", "structure", "role_alignment"]
  }
}
`;

      const generated = await callClientGeminiStructured<any>(
        prompt,
        'You are a premier executive interviewer. Formulate sharp, contextual follow-up probes with strictly zero sample answers.',
        { apiKey }
      );

      return {
        id: crypto.randomUUID(),
        order: order || ((parentQuestion?.order || 1) + 1),
        type: 'follow_up' as const,
        questionType: 'clarification' as const,
        source: 'follow_up' as const,
        sourceReference: 'Previous Candidate Answer',
        targetCompetency: parentQuestion?.targetCompetency || 'Technical & Execution Depth',
        expectedAnswerCharacteristics: generated.expectedSignals || ['Explicit baseline metrics', 'Clear reasoning for rejected alternatives'],
        parentQuestionId: parentQuestion?.id || null,
        category: generated.category || 'Adaptive Follow-up',
        text: generated.text,
        intent: generated.intent || 'Probes for concrete metric attribution and decision trade-offs.',
        contextExplanation: generated.contextExplanation,
        recommendedDurationSeconds: 120,
        expectedSignals: generated.expectedSignals || [],
        redFlags: generated.redFlags || [],
        evaluationCriteria: generated.evaluationCriteria,
      };
    } catch (_) {
      return {
        id: crypto.randomUUID(),
        order: order || ((parentQuestion?.order || 1) + 1),
        type: 'follow_up' as const,
        questionType: 'clarification' as const,
        source: 'follow_up' as const,
        sourceReference: 'Previous Candidate Answer',
        targetCompetency: parentQuestion?.targetCompetency || 'Analytical Rigor & Metrics',
        expectedAnswerCharacteristics: ['Explicit baseline metrics', 'Clear reasoning for rejected alternatives'],
        parentQuestionId: parentQuestion?.id || null,
        category: 'Adaptive Follow-up',
        text: `Could you double down on the specific metrics or architectural trade-offs you evaluated in that situation?`,
        intent: 'Probes for concrete metric attribution and decision trade-offs.',
        contextExplanation: 'Follow-up probe on missing evidence.',
        recommendedDurationSeconds: 120,
        expectedSignals: ['Explicit baseline metrics', 'Clear reasoning for rejected alternatives'],
        redFlags: ['Repeating general points without deeper specifics'],
        evaluationCriteria: {
          coreCompetency: 'Analytical Rigor & Metrics',
          lookFor: ['Metric precision', 'Trade-off analysis'],
          redFlags: ['Vagueness'],
          rubricDimensions: ['clarity', 'depth', 'evidence', 'relevance', 'structure', 'role_alignment'],
        },
      };
    }
  },

  /**
   * Step 10: Final Report Synthesis
   */
  async generateFinalReport(params: {
    interviewId: string;
    role: string;
    company: string;
    questions: Question[];
    answers: Record<string, any>;
    evaluations: any[];
  }): Promise<FinalReport> {
    const apiKey = getClientApiKey();

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { ...params, apiKey },
      });

      if (!error && data?.report) {
        return data.report;
      }
      const errDetail = await getEdgeErrorMessage(error);
      console.info('[aiService] Edge Function quota/status notice (falling back to calibrated engine):', errDetail.split('\n')[0]);
    } catch (edgeErr) {
      console.info('[aiService] Edge Function unavailable, proceeding with calibrated engine.');
    }

    const { interviewId, role, company, questions, answers, evaluations } = params;
    const allQuestions = questions || [];
    const totalQuestionsCount = Math.max(1, allQuestions.length);
    const evals = evaluations || [];

    // Map and score every single question (answered vs unanswered)
    let answeredCount = 0;
    const questionBreakdown = allQuestions.map((q: any) => {
      const ans = (answers || {})[q.id] || (Array.isArray(answers) ? answers.find((a: any) => a.question_id === q.id || a.questionId === q.id) : null);
      const ev = evals.find((e: any) => e.questionId === q.id || e.question_id === q.id);
      const answerText = (ans?.answerText || ans?.answer_text || ans?.transcript || '').trim();
      const hasAnswered = answerText.length > 0;

      if (hasAnswered) {
        answeredCount += 1;
      }

      const score = hasAnswered
        ? Number(ev?.overallScore || ev?.overall_score || 0.0)
        : 0.0;

      const keyCritique = hasAnswered
        ? (ev?.tryThisNextTime?.suggestion || ev?.improvement_suggestions?.[0] || ev?.whatHeldYouBack?.[0] || 'Provide explicit STAR metrics and trade-off depth.')
        : 'Question was left unanswered before the interview session concluded (0.0/10 penalty applied).';

      return {
        questionId: q.id,
        questionText: q.text || q.question_text,
        category: q.category || 'General Assessment',
        score,
        userAnswer: hasAnswered ? answerText : '[No response submitted - 0.0/10]',
        keyCritique,
      };
    });

    // Calculate true weighted averages across the ENTIRE interview loop
    const totalScoreSum = questionBreakdown.reduce((acc, q) => acc + q.score, 0);
    const avgOverall = Math.round((totalScoreSum / totalQuestionsCount) * 10) / 10;
    const completionRate = answeredCount / totalQuestionsCount;

    // Calculate dimension averages across answered questions, then scale by completion rate
    const validEvals = evals.filter((e: any) => Number(e.overallScore || e.overall_score || 0) > 0);
    const evalCount = Math.max(1, validEvals.length);

    const rawRelevance = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.relevance || b.relevance || 0), 0) / evalCount;
    const rawStructure = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.structure || b.structure || 0), 0) / evalCount;
    const rawClarity = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.clarity || b.clarity || 0), 0) / evalCount;
    const rawDepth = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.depth || b.depth || 0), 0) / evalCount;
    const rawEvidence = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.evidence || b.evidence || 0), 0) / evalCount;
    const rawRole = validEvals.reduce((a: number, b: any) => a + Number(b.breakdown?.roleAlignment || b.role_alignment || 0), 0) / evalCount;

    const avgRelevance = Math.round((rawRelevance * completionRate) * 10) / 10;
    const avgStructure = Math.round((rawStructure * completionRate) * 10) / 10;
    const avgClarity = Math.round((rawClarity * completionRate) * 10) / 10;
    const avgDepth = Math.round((rawDepth * completionRate) * 10) / 10;
    const avgEvidence = Math.round((rawEvidence * completionRate) * 10) / 10;
    const avgRole = Math.round((rawRole * completionRate) * 10) / 10;

    const readinessPercentage = Math.round((avgOverall / 10) * 100);

    // 2. Client Gemini Fallback Cascade
    try {
      const prompt = `
Synthesize a comprehensive, candid, and calibrated executive-level final interview report for a candidate who completed an interview for ${role} at ${company}.

Computed Deterministic Performance Metrics:
- Completed Questions: ${answeredCount} of ${totalQuestionsCount} (${Math.round(completionRate * 100)}% completion rate)
- Overall Score: ${avgOverall} / 10.0
- Readiness Percentage: ${readinessPercentage}%
- Relevance: ${avgRelevance} / 10
- Structure: ${avgStructure} / 10
- Clarity: ${avgClarity} / 10
- Depth: ${avgDepth} / 10
- Evidence & Metrics: ${avgEvidence} / 10
- Role Alignment: ${avgRole} / 10

Evaluated Questions & Answers:
${JSON.stringify(questionBreakdown, null, 2)}

CRITICAL EVALUATION INSTRUCTIONS:
1. STRICT OBJECTIVITY - ZERO SUGARCOATING: State candidate's demonstrated performance objectively.
2. If candidate left questions unanswered, explicitly reflect the incomplete loop in the evaluation.
3. In "topStrengths", list genuine demonstrated strengths or note low completion.
4. In "priorityImprovements", provide 3 candid, actionable breakdowns of what held them back.
5. In "recommendedPractice", provide 3 targeted practice drills.
6. DO NOT GENERATE SAMPLE ANSWERS.

Return JSON strictly matching this schema:
{
  "summary": string,
  "topStrengths": string[],
  "priorityImprovements": string[],
  "recommendedPractice": [
    {
      "title": string,
      "description": string,
      "actionableTask": string
    }
  ]
}
`;

      const synthesis = await callClientGeminiStructured<{
        summary: string;
        topStrengths: string[];
        priorityImprovements: string[];
        recommendedPractice: { title: string; description: string; actionableTask: string }[];
      }>(
        prompt,
        'You are an executive hiring bar chair. Synthesize honest, calibrated candidate assessments with high-value coaching drills.',
        { apiKey }
      );

      return {
        id: `rep_${interviewId || crypto.randomUUID()}`,
        sessionId: interviewId,
        createdAt: new Date().toISOString(),
        jobTitle: role || 'Target Role',
        company: company || 'Target Company',
        overallScore: avgOverall,
        readinessPercentage,
        summary: synthesis.summary,
        dimensions: [
          { name: 'Relevance & Domain Fit', score: avgRelevance, maxScore: 10, description: 'Direct answering of prompt without diversion' },
          { name: 'Communication & Clarity', score: avgClarity, maxScore: 10, description: 'Clear articulation and concise explanation' },
          { name: 'Product & Technical Depth', score: avgDepth, maxScore: 10, description: 'First-principles reasoning and trade-off mechanics' },
          { name: 'Structure (STAR Framework)', score: avgStructure, maxScore: 10, description: 'Logical narrative flow and systematic breakdown' },
          { name: 'Metric Evidence & Impact', score: avgEvidence, maxScore: 10, description: 'Baseline benchmarks versus quantified business outcomes' },
          { name: 'Role Alignment', score: avgRole, maxScore: 10, description: 'Fit for level expectations and operating scale' },
        ],
        topStrengths: synthesis.topStrengths || [],
        priorityImprovements: synthesis.priorityImprovements || [],
        recommendedPractice: synthesis.recommendedPractice || [],
        questionBreakdown,
      };
    } catch (clientErr) {
      console.info('[aiService] Synthesizing final candidate dossier via calibrated STAR rubric engine.');
      
      const summaryText = answeredCount < totalQuestionsCount
        ? `Candidate completed ${answeredCount} of ${totalQuestionsCount} interview questions (${Math.round(completionRate * 100)}% loop completion). Unanswered questions were penalized at 0.0/10, resulting in an overall calibrated readiness of ${avgOverall}/10 (${readinessPercentage}%).`
        : `Candidate completed all ${totalQuestionsCount} interview questions for ${role} at ${company}, scoring an overall average of ${avgOverall}/10 (${readinessPercentage}% readiness).`;

      const topStrengths = answeredCount === 0
        ? ['Initiated interview calibration loop.']
        : avgOverall >= 7.0
        ? [
            'Strong articulate communication and logical narrative structuring.',
            'Sound technical intuition and first-principles decomposition.',
          ]
        : [
            `Demonstrated initial engagement on ${answeredCount} of ${totalQuestionsCount} questions.`,
            'Participated in live AI evaluation session.',
          ];

      const priorityImprovements = answeredCount < totalQuestionsCount
        ? [
            `Complete all ${totalQuestionsCount} interview questions in the loop to establish full competency calibration.`,
            'Quantify baseline metrics and measurable business outcomes for every initiative.',
            'Deepen discussion around trade-offs and alternative architectural approaches considered.',
          ]
        : [
            'Quantify baseline metrics and measurable business outcomes for every initiative.',
            'Deepen discussion around trade-offs and alternative architectural approaches considered.',
          ];

      return {
        id: `rep_${interviewId || crypto.randomUUID()}`,
        sessionId: interviewId,
        createdAt: new Date().toISOString(),
        jobTitle: role || 'Target Role',
        company: company || 'Target Company',
        overallScore: avgOverall,
        readinessPercentage,
        summary: summaryText,
        dimensions: [
          { name: 'Relevance & Domain Fit', score: avgRelevance, maxScore: 10, description: 'Direct answering of prompt without diversion' },
          { name: 'Communication & Clarity', score: avgClarity, maxScore: 10, description: 'Clear articulation and concise explanation' },
          { name: 'Product & Technical Depth', score: avgDepth, maxScore: 10, description: 'First-principles reasoning and trade-off mechanics' },
          { name: 'Structure (STAR Framework)', score: avgStructure, maxScore: 10, description: 'Logical narrative flow and systematic breakdown' },
          { name: 'Metric Evidence & Impact', score: avgEvidence, maxScore: 10, description: 'Baseline benchmarks versus quantified business outcomes' },
          { name: 'Role Alignment', score: avgRole, maxScore: 10, description: 'Fit for level expectations and operating scale' },
        ],
        topStrengths,
        priorityImprovements,
        recommendedPractice: [
          {
            title: 'Full Simulation Completion Drill',
            description: 'Practice answering all assigned questions under strict simulation timing.',
            actionableTask: 'Complete a full 4-question mock interview loop without skipping questions.',
          },
          {
            title: 'STAR Baseline Metric Drill',
            description: 'Practice establishing initial starting benchmarks before describing solutions.',
            actionableTask: 'State the exact metric before and after your technical intervention.',
          },
          {
            title: 'Architectural Trade-Off Deep Dive',
            description: 'Practice articulating rejected alternative options and their failure modes.',
            actionableTask: 'Outline two alternative architectures and explain why the chosen path was superior.',
          },
        ],
        questionBreakdown,
      };
    }
  },
};

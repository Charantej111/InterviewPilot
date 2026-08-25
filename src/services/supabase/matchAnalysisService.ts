import { CandidateProfile, LockedCandidateContext } from '../../types/resume';
import { JobProfile, JDEvidenceModel } from '../../types/jobDescription';
import { CompanyResearchData } from '../../types/companyResearch';
import { MatchAnalysisResult } from '../../types/matchAnalysis';
import { computeMatchAssessment, buildLegacyMatchResult } from '../ai/matchEngine';
import { validateJDEvidenceModel } from '../ai/jdValidator';

/**
 * Unified Match Analysis Service
 * Delegates directly to the single production match engine (matchEngine.ts).
 * Zero duplicate 45/30/25 heuristics or arbitrary scoring multipliers.
 */
export const matchAnalysisService = {
  computeMatch(
    candidate: CandidateProfile | LockedCandidateContext,
    job?: JobProfile | JDEvidenceModel | null,
    company?: CompanyResearchData | null
  ): MatchAnalysisResult | null {
    if (!candidate || !job) {
      return null;
    }

    // If candidate is already a LockedCandidateContext, use it
    let lockedContext: LockedCandidateContext;
    if ('evidenceModel' in candidate && candidate.evidenceModel) {
      lockedContext = candidate as LockedCandidateContext;
    } else {
      // Build candidate evidence model from CandidateProfile
      const profile = candidate as CandidateProfile;
      lockedContext = {
        sessionId: 'ses_profile_adapter',
        lockedAt: new Date().toISOString(),
        evidenceModel: {
          identity: {
            name: profile.name ? { value: profile.name, sourceText: profile.name, confidence: 'high', sourceLocation: { section: 'HEADER' } } : undefined,
            role: profile.targetRole ? { value: profile.targetRole, sourceText: profile.targetRole, confidence: 'high', sourceLocation: { section: 'HEADER' } } : undefined,
          },
          education: (profile.education || []).map((e) => ({
            degree: { value: e.degree, sourceText: `${e.degree} from ${e.institution}`, confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
            institution: { value: e.institution, sourceText: e.institution, confidence: 'high', sourceLocation: { section: 'EDUCATION' } },
            year: e.year ? { value: e.year, sourceText: e.year, confidence: 'high', sourceLocation: { section: 'EDUCATION' } } : undefined,
          })),
          workExperience: (profile.experience || []).map((exp) => ({
            company: { value: exp.company, sourceText: exp.company, confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
            role: { value: `${exp.role} (${exp.duration || ''})`, sourceText: `${exp.role} at ${exp.company} (${exp.duration || ''})`, confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } },
            startDate: exp.duration ? { value: exp.duration, sourceText: exp.duration, confidence: 'high', sourceLocation: { section: 'EXPERIENCE' } } : undefined,
            bullets: [
              ...(exp.highlights || []).map((h) => ({ value: h, sourceText: h, confidence: 'high' as const, sourceLocation: { section: 'EXPERIENCE' } })),
              { value: `${exp.role} ${exp.company} ${exp.duration || ''}`, sourceText: `${exp.role} at ${exp.company} duration ${exp.duration || ''}`, confidence: 'high' as const, sourceLocation: { section: 'EXPERIENCE' } },
            ],
          })),
          projects: (profile.projects || []).map((p) => ({
            name: { value: p.name, sourceText: p.name, confidence: 'high', sourceLocation: { section: 'PROJECTS' } },
            problem: p.description ? { value: p.description, sourceText: p.description, confidence: 'high', sourceLocation: { section: 'PROJECTS' } } : undefined,
            technologies: (p.technologies || []).map((t) => ({ value: t, sourceText: t, confidence: 'high' as const, sourceLocation: { section: 'PROJECTS' } })),
            outcomes: p.metrics ? [{ value: p.metrics, sourceText: p.metrics, confidence: 'high' as const, sourceLocation: { section: 'PROJECTS' } }] : [],
          })),
          skills: {
            technical: (profile.skills || []).map((s) => ({ value: s, sourceText: s, confidence: 'high' as const, sourceLocation: { section: 'SKILLS' } })),
            product: (profile.skills || []).filter((s) => /product|roadmap|scrum|agile|ux|user/i.test(s)).map((s) => ({ value: s, sourceText: s, confidence: 'high' as const, sourceLocation: { section: 'SKILLS' } })),
            domain: [
              ...(profile.strengths || []).map((s) => ({ value: s, sourceText: s, confidence: 'high' as const, sourceLocation: { section: 'SKILLS' } })),
              ...(profile.summary ? [{ value: profile.summary, sourceText: profile.summary, confidence: 'high' as const, sourceLocation: { section: 'SUMMARY' as const } }] : []),
            ],
          },
          certifications: (profile.certifications || []).map((c) => ({ value: c, sourceText: c, confidence: 'high' as const, sourceLocation: { section: 'CERTIFICATIONS' } })),
          achievements: (profile.achievements || []).map((a) => ({ value: a, sourceText: a, confidence: 'high' as const, sourceLocation: { section: 'ACHIEVEMENTS' } })),
          unclear: [],
        },
        derivedProfile: profile,
      };
    }

    // If job is already a JDEvidenceModel, use it
    let jdModel: JDEvidenceModel;
    if ('requiredSkills' in job && job.requiredSkills.length > 0 && typeof job.requiredSkills[0] === 'object') {
      jdModel = job as JDEvidenceModel;
    } else {
      const p = job as JobProfile;
      const rawText = [
        `Role: ${p.role}`,
        `Company: ${p.company || company?.companyName || ''}`,
        `Experience: ${p.experienceRequirements || ''}`,
        `Required Skills: ${(p.requiredSkills || []).join(', ')}`,
        `Responsibilities: ${(p.responsibilities || []).join('. ')}`,
        `Competencies: ${(p.competencies || []).join(', ')}`,
        `Domain: ${(p.keywords || []).join(', ')}`,
      ].join('\n');

      const validated = validateJDEvidenceModel(
        {
          role: p.role,
          company: p.company || company?.companyName,
          requiredSkills: (p.requiredSkills || []).map((s, i) => ({
            id: `req_skill_${i + 1}`,
            requirement: s,
            sourceText: s,
            category: 'skill',
            strength: 'explicit',
            critical: true,
            confidence: 'high',
          })),
          preferredSkills: (p.preferredSkills || []).map((s, i) => ({
            id: `pref_skill_${i + 1}`,
            requirement: s,
            sourceText: s,
            category: 'skill',
            strength: 'preferred',
            critical: false,
            confidence: 'high',
          })),
          responsibilities: (p.responsibilities || []).map((r, i) => ({
            id: `req_resp_${i + 1}`,
            requirement: r,
            sourceText: r,
            category: 'responsibility',
            strength: 'explicit',
            critical: false,
            confidence: 'high',
          })),
          competencies: (p.competencies || []).map((c, i) => ({
            id: `req_comp_${i + 1}`,
            requirement: c,
            sourceText: c,
            category: 'competency',
            strength: 'explicit',
            critical: false,
            confidence: 'high',
          })),
        },
        rawText,
        p.role,
        p.company
      );
      jdModel = validated.jdModel;
    }

    const assessment = computeMatchAssessment(lockedContext, jdModel);
    if (!assessment) {
      return null;
    }

    return buildLegacyMatchResult(assessment);
  },
};

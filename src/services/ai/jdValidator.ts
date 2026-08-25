/**
 * JD Validator & Normalizer — Deterministic Integrity Gate for Job Descriptions
 *
 * Enforces:
 * 1. sourceText presence and verification against raw JD text.
 * 2. Stable requirement ID assignment.
 * 3. Categorization & Strength normalization.
 * 4. Seniority classification.
 * 5. Deterministic content hashing for version tracking.
 * 6. Backward-compatible JobProfile derivation.
 */

import type {
  JDEvidenceModel,
  JDRequirement,
  RequirementCategory,
  RequirementStrength,
  JobProfile,
} from '../../types/jobDescription';

/**
 * Computes a deterministic content hash from JD text and metadata.
 */
export function computeJDHash(rawText: string, role?: string | null, company?: string | null): string {
  const payload = `${(role || '').trim().toLowerCase()}|${(company || '').trim().toLowerCase()}|${(rawText || '').trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `jdh_${(hash >>> 0).toString(16)}`;
}

/**
 * Detects seniority level from role title and raw JD text.
 */
export function detectSeniority(role: string, rawText: string): JDEvidenceModel['seniority'] {
  const combined = `${role} ${rawText}`.toLowerCase();
  
  if (/\b(intern|internship|co-op|apprentice|trainee)\b/i.test(combined)) return 'intern';
  if (/\b(principal|distinguished|fellow|director|vp|head of)\b/i.test(combined)) return 'principal';
  if (/\b(lead|staff|architect|manager|tech lead)\b/i.test(combined)) return 'lead';
  if (/\b(senior|sr\b|sr\.|iv|iii)\b/i.test(combined)) return 'senior';
  if (/\b(junior|jr\b|jr\.|associate|entry level|graduate|fresher|level 1|l1|l2)\b/i.test(combined)) return 'junior';
  if (/\b(mid|mid-level|intermediate|level 2|level 3|l3)\b/i.test(combined)) return 'mid';
  
  // Default to mid if unspecified but realistic
  return 'unknown';
}

/**
 * Finds the most relevant matching source sentence from raw text for a requirement.
 */
function findSupportingSourceText(requirementText: string, rawJDText: string, proposedSourceText?: string): string {
  const rawLower = rawJDText.toLowerCase();

  // If proposed sourceText actually exists in raw text, use it
  if (proposedSourceText && proposedSourceText.trim().length > 5) {
    const cleanProposed = proposedSourceText.trim();
    if (rawLower.includes(cleanProposed.toLowerCase())) {
      return cleanProposed;
    }
  }

  // Split raw text into sentences and line blocks
  const sentences = rawJDText
    .split(/(?:\r?\n|[.!?]+(?:\s+|$))/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const reqWords = requirementText
    .toLowerCase()
    .split(/[\s/,-]+/)
    .filter((w) => w.length > 3);

  if (reqWords.length === 0) {
    return sentences[0] || requirementText;
  }

  let bestSentence = '';
  let bestScore = 0;

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    let score = 0;
    for (const w of reqWords) {
      if (sLower.includes(w)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }

  return bestSentence || sentences[0] || requirementText;
}

/**
 * Normalizes an individual raw requirement item into a valid JDRequirement.
 */
function normalizeRequirement(
  rawItem: any,
  defaultCategory: RequirementCategory,
  defaultStrength: RequirementStrength,
  rawJDText: string,
  index: number
): JDRequirement | null {
  if (!rawItem) return null;

  const requirement = typeof rawItem === 'string'
    ? rawItem.trim()
    : (rawItem.requirement || rawItem.name || rawItem.title || '').trim();

  if (!requirement || requirement.length < 2) return null;

  const rawSource = typeof rawItem === 'object' ? rawItem.sourceText : undefined;
  const sourceText = findSupportingSourceText(requirement, rawJDText, rawSource);

  // Determine category
  const validCategories: RequirementCategory[] = [
    'skill', 'responsibility', 'competency', 'technical',
    'domain', 'behavioral', 'experience', 'education', 'certification', 'other'
  ];
  let category: RequirementCategory = defaultCategory;
  if (rawItem.category && validCategories.includes(rawItem.category)) {
    category = rawItem.category;
  }

  // Determine strength
  let strength: RequirementStrength = defaultStrength;
  if (rawItem.strength === 'explicit' || rawItem.strength === 'preferred' || rawItem.strength === 'inferred') {
    strength = rawItem.strength;
  } else if (/must|require|essential|minimum|mandatory|at least|strong/i.test(requirement) || /must|require/i.test(sourceText)) {
    strength = 'explicit';
  } else if (/nice to have|preferred|bonus|plus|ideal|advantage/i.test(requirement) || /preferred|bonus/i.test(sourceText)) {
    strength = 'preferred';
  }

  // Determine confidence
  const confidence: 'high' | 'medium' | 'low' =
    rawItem.confidence === 'high' || rawItem.confidence === 'medium' || rawItem.confidence === 'low'
      ? rawItem.confidence
      : sourceText.length > 10 ? 'high' : 'medium';

  // Determine critical flag (explicit technical/skill or mandatory requirement)
  const isCritical =
    rawItem.critical === true ||
    (strength === 'explicit' && (category === 'skill' || category === 'technical' || category === 'experience' || index < 2));

  const competencySignal = rawItem.competencySignal ||
    (category === 'technical' ? 'Technical Depth' :
     category === 'skill' ? 'Core Technical Execution' :
     category === 'responsibility' ? 'Role Ownership' :
     category === 'domain' ? 'Domain Expertise' :
     category === 'behavioral' ? 'Behavioral & Culture' :
     category === 'experience' ? 'Seniority & Scale' :
     'Problem Solving');

  return {
    id: rawItem.id || `req_${category}_${index + 1}`,
    requirement,
    sourceText,
    category,
    strength,
    competencySignal,
    confidence,
    critical: isCritical,
  };
}

/**
 * Validates and normalizes raw extraction output into a standard JDEvidenceModel.
 */
export function validateJDEvidenceModel(
  rawOutput: any,
  rawJDText: string,
  targetRole = 'Target Role',
  company = 'Target Company'
): { jdModel: JDEvidenceModel; warnings: string[] } {
  const warnings: string[] = [];
  const cleanJD = (rawJDText || '').trim();

  if (!cleanJD) {
    warnings.push('Job description text is empty.');
    return {
      jdModel: {
        role: targetRole,
        company,
        seniority: 'unknown',
        requiredSkills: [],
        preferredSkills: [],
        responsibilities: [],
        competencies: [],
        technicalRequirements: [],
        domainKnowledge: [],
        behavioralSignals: [],
        experienceRequirements: [],
        educationRequirements: [],
        certificationRequirements: [],
        hiringSignals: [],
        extractionWarnings: warnings,
      },
      warnings,
    };
  }

  const role = (rawOutput?.role || targetRole || 'Target Role').trim();
  const targetCompany = (rawOutput?.company || company || 'Target Company').trim();
  const seniority = rawOutput?.seniority && ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'unknown'].includes(rawOutput.seniority)
    ? rawOutput.seniority
    : detectSeniority(role, cleanJD);

  const normalizeList = (items: any[], category: RequirementCategory, defaultStrength: RequirementStrength): JDRequirement[] => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item, idx) => normalizeRequirement(item, category, defaultStrength, cleanJD, idx))
      .filter((r): r is JDRequirement => r !== null);
  };

  const requiredSkills = normalizeList(rawOutput?.requiredSkills, 'skill', 'explicit');
  const preferredSkills = normalizeList(rawOutput?.preferredSkills, 'skill', 'preferred');
  const responsibilities = normalizeList(rawOutput?.responsibilities, 'responsibility', 'explicit');
  const competencies = normalizeList(rawOutput?.competencies || rawOutput?.criticalCompetencies, 'competency', 'explicit');
  const technicalRequirements = normalizeList(rawOutput?.technicalRequirements, 'technical', 'explicit');
  const domainKnowledge = normalizeList(rawOutput?.domainKnowledge, 'domain', 'explicit');
  const behavioralSignals = normalizeList(rawOutput?.behavioralSignals, 'behavioral', 'inferred');
  const experienceRequirements = normalizeList(rawOutput?.experienceRequirements, 'experience', 'explicit');
  const educationRequirements = normalizeList(rawOutput?.educationRequirements, 'education', 'explicit');
  const certificationRequirements = normalizeList(rawOutput?.certificationRequirements, 'certification', 'preferred');

  const totalRequirements =
    requiredSkills.length +
    preferredSkills.length +
    responsibilities.length +
    competencies.length +
    technicalRequirements.length +
    domainKnowledge.length +
    behavioralSignals.length +
    experienceRequirements.length;

  if (totalRequirements === 0) {
    warnings.push('No structured requirements could be extracted from the supplied JD text.');
  }

  const hiringSignals: string[] = Array.isArray(rawOutput?.hiringSignals)
    ? rawOutput.hiringSignals.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  const jdModel: JDEvidenceModel = {
    role,
    company: targetCompany,
    seniority,
    requiredSkills,
    preferredSkills,
    responsibilities,
    competencies,
    technicalRequirements,
    domainKnowledge,
    behavioralSignals,
    experienceRequirements,
    educationRequirements,
    certificationRequirements,
    hiringSignals,
    extractionWarnings: warnings,
  };

  return { jdModel, warnings };
}

/**
 * Derives a backward-compatible JobProfile from a JDEvidenceModel.
 */
export function deriveJobProfileFromJDEvidence(jdModel: JDEvidenceModel): JobProfile {
  return {
    role: jdModel.role || 'Target Role',
    company: jdModel.company || 'Target Company',
    responsibilities: jdModel.responsibilities.map((r) => r.requirement),
    requiredSkills: [
      ...jdModel.requiredSkills.map((r) => r.requirement),
      ...jdModel.technicalRequirements.map((r) => r.requirement),
    ],
    preferredSkills: jdModel.preferredSkills.map((r) => r.requirement),
    experienceRequirements: jdModel.experienceRequirements.length > 0
      ? jdModel.experienceRequirements.map((r) => r.requirement).join(', ')
      : `${jdModel.seniority !== 'unknown' ? jdModel.seniority.toUpperCase() : 'Relevant'} experience`,
    competencies: jdModel.competencies.map((r) => r.requirement),
    keywords: [
      ...jdModel.domainKnowledge.map((r) => r.requirement),
      ...jdModel.requiredSkills.map((r) => r.requirement),
    ],
    interviewSignals: jdModel.hiringSignals,
  };
}

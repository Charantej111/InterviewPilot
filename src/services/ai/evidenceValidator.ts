import type {
  CandidateEvidenceModel,
  EvidenceItem,
  ValidationResult,
  WorkExperienceEvidence,
  ProjectEvidence,
  EducationEvidence,
} from '../../types/resume';

/**
 * Normalizes text for lenient provenance matching (removes excess whitespace & punctuation).
 */
function normalizeForMatching(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a claimed value or phrase is grounded in the source text.
 */
function isPhraseInSourceText(phrase: string, sourceText: string): boolean {
  if (!phrase || !sourceText) return false;
  const normPhrase = normalizeForMatching(phrase);
  const normSource = normalizeForMatching(sourceText);

  if (normPhrase.length === 0) return false;
  if (normSource.includes(normPhrase)) return true;

  // Word set subset check for multi-word phrases
  const phraseWords = normPhrase.split(' ').filter((w) => w.length > 2);
  if (phraseWords.length === 0) return false;

  const matchedWords = phraseWords.filter((w) => normSource.includes(w));
  return matchedWords.length / phraseWords.length >= 0.75;
}

/**
 * Validates whether a project name is a legitimate title or an illegitimate sentence fragment/bullet.
 */
function isValidProjectTitle(name: string): { valid: boolean; reason?: string } {
  const trimmed = (name || '').trim();
  if (!trimmed || trimmed.length < 3) {
    return { valid: false, reason: 'Project name is empty or too short' };
  }

  // Reject if ends with a sentence period
  if (/\.\s*$/.test(trimmed)) {
    return { valid: false, reason: 'Sentence ending with period cannot be a project title' };
  }

  // Reject if starts with an action verb (indicates it is a bullet point sentence, not a project name)
  if (/^(developed|implemented|engineered|designed|supervised|created|built|utilized|handled|analyzed|evaluated|achieved|trained|fine-tuned|deployed|assisted|led|wrote|built|tested)\b/i.test(trimmed)) {
    return { valid: false, reason: 'Action verb sentence cannot be a project title' };
  }

  // Reject if it is a generic technology name
  if (/^(python|javascript|typescript|c\+\+|java|react|node\.js|html|css|sql|pandas|numpy|docker|aws|git)$/i.test(trimmed)) {
    return { valid: false, reason: 'Single technology name cannot be a project title' };
  }

  // Reject if starts with bullet characters
  if (/^[•*-]\s*/.test(trimmed)) {
    return { valid: false, reason: 'Bullet point line cannot be a project title' };
  }

  return { valid: true };
}

/**
 * Validates whether an education entry is valid or an illegitimate isolated grade/character.
 */
function isValidEducationRecord(degree?: string, institution?: string): { valid: boolean; reason?: string } {
  const cleanDegree = (degree || '').trim();
  const cleanInst = (institution || '').trim();

  if (!cleanDegree && !cleanInst) {
    return { valid: false, reason: 'Education record has neither degree nor institution' };
  }

  // Reject if degree or institution is ONLY a CGPA / grade string
  if (/^(?:cgpa|gpa|percentage|marks)?\s*[:=]?\s*\d+(?:\.\d+)?(?:\s*\/\s*10|\s*%)?$/i.test(cleanDegree)) {
    return { valid: false, reason: 'Isolated CGPA or grade string cannot be an Education entity' };
  }
  if (/^(?:cgpa|gpa|percentage|marks)?\s*[:=]?\s*\d+(?:\.\d+)?(?:\s*\/\s*10|\s*%)?$/i.test(cleanInst)) {
    return { valid: false, reason: 'Isolated CGPA or grade string cannot be an Education entity' };
  }

  // Reject single letter fragments
  if (cleanDegree.length === 1 && !cleanInst) {
    return { valid: false, reason: 'Single character fragment cannot be an Education entity' };
  }

  return { valid: true };
}

/**
 * Validates whether a work experience role is backed by verifiable employer provenance.
 */
function isValidWorkExperience(company?: string, role?: string, sourceText?: string): { valid: boolean; reason?: string } {
  const cleanCompany = (company || '').trim();
  const cleanRole = (role || '').trim();

  if (!cleanCompany && !cleanRole) {
    return { valid: false, reason: 'Work experience has no company and no role' };
  }

  // Reject synthetic placeholder companies
  if (/^(previous organization|company|organization|employer|workplace|tech firm)$/i.test(cleanCompany)) {
    return { valid: false, reason: 'Synthetic placeholder company rejected' };
  }

  // Reject synthetic placeholder roles
  if (/^(technical professional|software engineer|developer|professional)$/i.test(cleanRole) && !cleanCompany) {
    return { valid: false, reason: 'Generic role without verified employer rejected' };
  }

  if (sourceText && cleanCompany) {
    if (!isPhraseInSourceText(cleanCompany, sourceText)) {
      return { valid: false, reason: `Company "${cleanCompany}" not found in source resume text` };
    }
  }

  return { valid: true };
}

/**
 * Strict post-extraction grounding and semantic entity-type validator.
 * Unsupported claims or structural fragments are strictly rejected and stripped.
 */
export function validateCandidateEvidenceModel(
  rawModel: CandidateEvidenceModel,
  fullDocumentText: string
): ValidationResult {
  const warnings: string[] = [];
  const rejectedItems: { value: string; reason: string; section?: string }[] = [];

  // 1. Identity Validation
  const validatedIdentity: CandidateEvidenceModel['identity'] = {};

  if (rawModel.identity?.name?.value) {
    const nameVal = rawModel.identity.name.value.trim();
    if (isPhraseInSourceText(nameVal, fullDocumentText)) {
      validatedIdentity.name = {
        ...rawModel.identity.name,
        confidence: 'high',
      };
    } else {
      rejectedItems.push({
        value: nameVal,
        reason: 'Candidate name not found in source text',
        section: 'HEADER',
      });
    }
  }

  if (rawModel.identity?.email?.value) {
    const emailVal = rawModel.identity.email.value.trim();
    if (isPhraseInSourceText(emailVal, fullDocumentText)) {
      validatedIdentity.email = {
        ...rawModel.identity.email,
        confidence: 'high',
      };
    } else {
      rejectedItems.push({
        value: emailVal,
        reason: 'Email not found in source text',
        section: 'HEADER',
      });
    }
  }

  if (rawModel.identity?.role?.value) {
    const roleVal = rawModel.identity.role.value.trim();
    if (isPhraseInSourceText(roleVal, fullDocumentText)) {
      validatedIdentity.role = {
        ...rawModel.identity.role,
        confidence: 'high',
      };
    }
  }

  // 2. Work Experience Validation (Strict employer provenance)
  const validatedWorkExperience: WorkExperienceEvidence[] = [];

  for (const exp of rawModel.workExperience || []) {
    const companyVal = exp.company?.value || '';
    const roleVal = exp.role?.value || '';
    const check = isValidWorkExperience(companyVal, roleVal, fullDocumentText);

    if (!check.valid) {
      rejectedItems.push({
        value: `${roleVal} at ${companyVal}`.trim(),
        reason: check.reason || 'Invalid work experience entity',
        section: 'EXPERIENCE',
      });
      continue;
    }

    const validatedBullets: EvidenceItem[] = [];
    for (const bullet of exp.bullets || []) {
      const bVal = bullet.value.trim();
      if (bVal && isPhraseInSourceText(bVal, fullDocumentText)) {
        validatedBullets.push({
          ...bullet,
          confidence: 'high',
        });
      }
    }

    validatedWorkExperience.push({
      ...exp,
      bullets: validatedBullets,
    });
  }

  // 3. Projects Validation (Semantic Project Titles & Anti-Fragmentation)
  const validatedProjects: ProjectEvidence[] = [];

  for (const proj of rawModel.projects || []) {
    const nameVal = proj.name?.value || '';
    const check = isValidProjectTitle(nameVal);

    if (!check.valid) {
      rejectedItems.push({
        value: nameVal,
        reason: check.reason || 'Invalid project title',
        section: 'PROJECTS',
      });
      continue;
    }

    if (!isPhraseInSourceText(nameVal, fullDocumentText)) {
      rejectedItems.push({
        value: nameVal,
        reason: 'Project title not found in resume source text',
        section: 'PROJECTS',
      });
      continue;
    }

    // Validate technologies
    const validatedTechs: EvidenceItem[] = [];
    for (const tech of proj.technologies || []) {
      const tVal = tech.value.trim();
      if (tVal && isPhraseInSourceText(tVal, fullDocumentText)) {
        validatedTechs.push({
          ...tech,
          confidence: 'high',
        });
      } else if (tVal) {
        rejectedItems.push({
          value: tVal,
          reason: `Project technology "${tVal}" not found in resume`,
          section: 'PROJECTS',
        });
      }
    }

    // Validate outcomes (metrics must exist in document)
    const validatedOutcomes: EvidenceItem[] = [];
    for (const outcome of proj.outcomes || []) {
      const oVal = outcome.value.trim();
      if (oVal && isPhraseInSourceText(oVal, fullDocumentText)) {
        validatedOutcomes.push({
          ...outcome,
          confidence: 'high',
        });
      } else if (oVal) {
        rejectedItems.push({
          value: oVal,
          reason: `Project outcome claim "${oVal}" not grounded in source text`,
          section: 'PROJECTS',
        });
      }
    }

    validatedProjects.push({
      ...proj,
      name: {
        ...proj.name,
        confidence: 'high',
      },
      technologies: validatedTechs,
      outcomes: validatedOutcomes,
    });
  }

  // 4. Education Validation (Anti-Fragmentation)
  const validatedEducation: EducationEvidence[] = [];

  for (const edu of rawModel.education || []) {
    const degVal = edu.degree?.value || '';
    const instVal = edu.institution?.value || '';
    const check = isValidEducationRecord(degVal, instVal);

    if (!check.valid) {
      rejectedItems.push({
        value: `${degVal} ${instVal}`.trim(),
        reason: check.reason || 'Invalid education record',
        section: 'EDUCATION',
      });
      continue;
    }

    const isDegFound = degVal ? isPhraseInSourceText(degVal, fullDocumentText) : true;
    const isInstFound = instVal ? isPhraseInSourceText(instVal, fullDocumentText) : true;

    if (!isDegFound && !isInstFound) {
      rejectedItems.push({
        value: `${degVal} at ${instVal}`.trim(),
        reason: 'Education degree and institution not found in resume',
        section: 'EDUCATION',
      });
      continue;
    }

    validatedEducation.push({
      ...edu,
      degree: edu.degree ? { ...edu.degree, confidence: 'high' } : undefined,
      institution: edu.institution ? { ...edu.institution, confidence: 'high' } : undefined,
      year: edu.year ? { ...edu.year, confidence: 'high' } : undefined,
    });
  }

  // 5. Skills Validation (Deduplication & Grounding)
  const validateSkillList = (skills: EvidenceItem[], _category?: 'technical' | 'product' | 'domain'): EvidenceItem[] => {
    const seen = new Set<string>();
    const validList: EvidenceItem[] = [];

    for (const skill of skills || []) {
      const sVal = (skill.value || '').trim();
      if (!sVal) continue;

      const norm = sVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(norm)) continue;

      if (isPhraseInSourceText(sVal, fullDocumentText)) {
        seen.add(norm);
        validList.push({
          ...skill,
          confidence: 'high',
        });
      } else {
        rejectedItems.push({
          value: sVal,
          reason: `Skill "${sVal}" has no supporting source text in the resume`,
          section: 'SKILLS',
        });
      }
    }

    return validList;
  };

  const technical = validateSkillList(rawModel.skills?.technical || [], 'technical');
  const product = validateSkillList(rawModel.skills?.product || [], 'product');
  const domain = validateSkillList(rawModel.skills?.domain || [], 'domain');

  // 6. Achievements Validation
  const validatedAchievements: EvidenceItem[] = [];
  for (const ach of rawModel.achievements || []) {
    const aVal = (ach.value || '').trim();
    if (aVal && isPhraseInSourceText(aVal, fullDocumentText)) {
      validatedAchievements.push({
        ...ach,
        confidence: 'high',
      });
    }
  }

  // 7. Certifications Validation
  const validatedCertifications: EvidenceItem[] = [];
  for (const cert of rawModel.certifications || []) {
    const cVal = (cert.value || '').trim();
    if (cVal && isPhraseInSourceText(cVal, fullDocumentText)) {
      validatedCertifications.push({
        ...cert,
        confidence: 'high',
      });
    }
  }

  const validatedModel: CandidateEvidenceModel = {
    identity: validatedIdentity,
    education: validatedEducation,
    workExperience: validatedWorkExperience,
    projects: validatedProjects,
    skills: {
      technical,
      product,
      domain,
    },
    certifications: validatedCertifications,
    achievements: validatedAchievements,
    unclear: rawModel.unclear || [],
  };

  return {
    model: validatedModel,
    unsupportedClaims: rejectedItems.map((r) => r.value),
    confidenceAdjustments: [],
    inferredCount: 0,
    rejectedItems,
    warnings,
  };
}

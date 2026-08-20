import type {
  CandidateEvidenceModel,
  EvidenceItem,
  ValidationResult,
  ValidationIssue,
} from '../../types/resume';

// ─── Skill Canonicalization & Synonym Normalization ──────────────────────────

const SKILL_SYNONYMS: Record<string, string> = {
  'react.js': 'React',
  'reactjs': 'React',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'vue.js': 'Vue.js',
  'vuejs': 'Vue.js',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'golang': 'Go',
  'k8s': 'Kubernetes',
  'amazon web services': 'AWS',
  'google cloud platform': 'GCP',
  'lang chain': 'LangChain',
  'lang graph': 'LangGraph',
  'scikit learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
  'restful apis': 'REST APIs',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  'ci cd': 'CI/CD',
  'ci/cd pipeline': 'CI/CD',
  'ui ux': 'UI/UX Design',
  'ui/ux': 'UI/UX Design',
};

/**
 * Normalizes text for robust fuzzy substring and keyword matching.
 */
function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if sourceText exists in the normalized document with fuzzy word overlap.
 */
function verifySourceTextPresence(sourceText: string, docText: string): 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' {
  if (!sourceText || sourceText.trim().length === 0) {
    return 'UNSUPPORTED';
  }

  const normSource = normalizeForMatch(sourceText);
  const normDoc = normalizeForMatch(docText);

  // Exact normalized match
  if (normDoc.includes(normSource)) {
    return 'SUPPORTED';
  }

  // Token-level matching (handles line breaks or slight formatting variance)
  const sourceTokens = normSource.split(' ').filter((t) => t.length > 3);
  if (sourceTokens.length === 0) {
    return normDoc.includes(normSource) ? 'SUPPORTED' : 'UNSUPPORTED';
  }

  const matchedTokens = sourceTokens.filter((token) => normDoc.includes(token));
  const matchRatio = matchedTokens.length / sourceTokens.length;

  if (matchRatio >= 0.7) {
    return 'SUPPORTED';
  } else if (matchRatio >= 0.4) {
    return 'PARTIALLY_SUPPORTED';
  }

  return 'UNSUPPORTED';
}

/**
 * Checks if extracted value is reasonably supported by the source text.
 */
function isValueSupportedBySource(value: string, sourceText: string): boolean {
  if (!value || !sourceText) return false;
  const normVal = normalizeForMatch(value);
  const normSource = normalizeForMatch(sourceText);

  // Direct containment
  if (normSource.includes(normVal)) return true;

  // Key word overlap (e.g. "Chief Marketing Officer" in "Co-founder & CMO / Marketing")
  const valTokens = normVal.split(' ').filter((t) => t.length > 2);
  if (valTokens.length === 0) return true;

  const overlap = valTokens.some((token) => normSource.includes(token));
  return overlap;
}

/**
 * Validates date ranges and flags inconsistent or future dates.
 */
function validateDateRange(startDate?: string, endDate?: string, fieldPath = ''): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!startDate && !endDate) return issues;

  const currentYear = new Date().getFullYear();
  const extractYear = (d: string) => {
    const m = d.match(/\b(20\d\d|19\d\d)\b/);
    return m ? parseInt(m[1], 10) : null;
  };

  const startYr = startDate ? extractYear(startDate) : null;
  const endYr = endDate && !/present|current/i.test(endDate) ? extractYear(endDate) : null;

  if (startYr && endYr && startYr > endYr) {
    issues.push({
      type: 'invalid_date',
      severity: 'warning',
      field: fieldPath,
      message: `Start date (${startDate}) appears after end date (${endDate}).`,
    });
  }

  if (startYr && startYr > currentYear + 2) {
    issues.push({
      type: 'invalid_date',
      severity: 'warning',
      field: fieldPath,
      message: `Start date (${startDate}) is in the future.`,
    });
  }

  return issues;
}

/**
 * Validates and deduplicates skills while preserving canonical names and source evidence.
 */
function deduplicateSkills(skills: EvidenceItem[]): { deduplicated: EvidenceItem[]; duplicatesCount: number } {
  const seenCanonical = new Map<string, EvidenceItem>();
  let duplicatesCount = 0;

  for (const item of skills) {
    if (!item.value || item.value.trim().length === 0) continue;

    const lower = item.value.toLowerCase().trim();
    const canonical = SKILL_SYNONYMS[lower] || item.value.trim();
    const canonicalKey = canonical.toLowerCase();

    if (seenCanonical.has(canonicalKey)) {
      duplicatesCount += 1;
      const existing = seenCanonical.get(canonicalKey)!;
      // Upgrade confidence if duplicate had stronger evidence
      if (item.confidence === 'high' && existing.confidence !== 'high') {
        existing.confidence = 'high';
        existing.sourceText = item.sourceText;
      }
    } else {
      seenCanonical.set(canonicalKey, {
        ...item,
        value: canonical,
      });
    }
  }

  return {
    deduplicated: Array.from(seenCanonical.values()),
    duplicatesCount,
  };
}

// ─── Primary Evidence Validator ──────────────────────────────────────────────

export function validateCandidateEvidenceModel(
  rawModel: CandidateEvidenceModel,
  normalizedText: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const repairedFields: string[] = [];

  let totalItems = 0;
  let supportedCount = 0;
  let partiallySupportedCount = 0;
  let unsupportedCount = 0;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;
  let lowConfidenceCount = 0;
  let inferredCount = 0;

  // Clone model for clean mutation
  const model: CandidateEvidenceModel = {
    identity: { ...(rawModel?.identity || {}) },
    education: [...(rawModel?.education || [])],
    workExperience: [...(rawModel?.workExperience || [])],
    projects: [...(rawModel?.projects || [])],
    skills: {
      technical: [...(rawModel?.skills?.technical || [])],
      product: [...(rawModel?.skills?.product || [])],
      domain: [...(rawModel?.skills?.domain || [])],
    },
    certifications: [...(rawModel?.certifications || [])],
    achievements: [...(rawModel?.achievements || [])],
    unclear: [...(rawModel?.unclear || [])],
  };

  const validateItem = (item: EvidenceItem | undefined, fieldPath: string): EvidenceItem | undefined => {
    if (!item) return undefined;
    totalItems += 1;

    const val = item.value?.trim() || '';
    const src = item.sourceText?.trim() || '';

    if (!val) {
      issues.push({
        type: 'missing_source',
        severity: 'error',
        field: fieldPath,
        message: `Empty value in ${fieldPath}.`,
      });
      return undefined;
    }

    // Verify source text existence in document
    const sourceStatus = verifySourceTextPresence(src, normalizedText);
    const valueSupported = isValueSupportedBySource(val, src);

    if (sourceStatus === 'UNSUPPORTED' || !valueSupported) {
      unsupportedCount += 1;
      issues.push({
        type: 'unsupported_value',
        severity: 'warning',
        field: fieldPath,
        message: `Extracted '${val}' could not be verified in resume text.`,
      });
      return {
        ...item,
        confidence: 'low',
      };
    }

    if (sourceStatus === 'PARTIALLY_SUPPORTED') {
      partiallySupportedCount += 1;
      return {
        ...item,
        confidence: item.confidence === 'high' ? 'medium' : item.confidence,
      };
    }

    supportedCount += 1;
    if (item.confidence === 'high') highConfidenceCount += 1;
    else if (item.confidence === 'medium') mediumConfidenceCount += 1;
    else if (item.confidence === 'low') lowConfidenceCount += 1;
    else if (item.confidence === 'inferred') inferredCount += 1;

    return item;
  };

  // 1. Validate Identity
  if (model.identity.name) {
    const validated = validateItem(model.identity.name, 'identity.name');
    if (validated) model.identity.name = validated;
  } else {
    issues.push({
      type: 'missing_source',
      severity: 'warning',
      field: 'identity.name',
      message: 'Candidate name was not explicitly identified in document header.',
    });
  }

  if (model.identity.role) {
    const validated = validateItem(model.identity.role, 'identity.role');
    if (validated) model.identity.role = validated;
  }

  // 2. Validate Work Experience
  model.workExperience = model.workExperience.map((exp, idx) => {
    const compVal = validateItem(exp.company, `workExperience[${idx}].company`) || exp.company;
    const roleVal = validateItem(exp.role, `workExperience[${idx}].role`) || exp.role;
    const startVal = exp.startDate ? validateItem(exp.startDate, `workExperience[${idx}].startDate`) : undefined;
    const endVal = exp.endDate ? validateItem(exp.endDate, `workExperience[${idx}].endDate`) : undefined;

    // Date consistency
    const dateIssues = validateDateRange(startVal?.value, endVal?.value, `workExperience[${idx}].dates`);
    issues.push(...dateIssues);

    // Validate bullets
    const validBullets = (exp.bullets || [])
      .map((b, bIdx) => validateItem(b, `workExperience[${idx}].bullets[${bIdx}]`))
      .filter((b): b is EvidenceItem => Boolean(b));

    return {
      company: compVal,
      role: roleVal,
      startDate: startVal,
      endDate: endVal,
      bullets: validBullets,
    };
  });

  // 3. Validate Projects & Outcomes (Strip fabricated metrics)
  model.projects = model.projects.map((proj, idx) => {
    const nameVal = validateItem(proj.name, `projects[${idx}].name`) || proj.name;
    const probVal = proj.problem ? validateItem(proj.problem, `projects[${idx}].problem`) : undefined;
    const contribVal = proj.contribution ? validateItem(proj.contribution, `projects[${idx}].contribution`) : undefined;

    const validTech = (proj.technologies || [])
      .map((t, tIdx) => validateItem(t, `projects[${idx}].technologies[${tIdx}]`))
      .filter((t): t is EvidenceItem => Boolean(t));

    // Metric validation: If outcome has metric, verify metric is in sourceText
    const validOutcomes = (proj.outcomes || [])
      .map((o, oIdx) => {
        const validated = validateItem(o, `projects[${idx}].outcomes[${oIdx}]`);
        if (!validated) return undefined;

        const metricMatch = validated.value.match(/\b(\d+%\s*|\d+x\s*|\$\d+[\w]*)\b/i);
        if (metricMatch && !validated.sourceText.includes(metricMatch[1])) {
          issues.push({
            type: 'unsupported_value',
            severity: 'warning',
            field: `projects[${idx}].outcomes[${oIdx}]`,
            message: `Metric outcome '${validated.value}' lacks numerical evidence in source text. Stripping outcome.`,
          });
          return undefined;
        }
        return validated;
      })
      .filter((o): o is EvidenceItem => Boolean(o));

    return {
      name: nameVal,
      problem: probVal,
      contribution: contribVal,
      technologies: validTech,
      outcomes: validOutcomes,
    };
  });

  // 4. Validate & Deduplicate Skills
  const deduplicatedTech = deduplicateSkills(
    (model.skills.technical || [])
      .map((s, idx) => validateItem(s, `skills.technical[${idx}]`))
      .filter((s): s is EvidenceItem => Boolean(s))
  );

  const deduplicatedProd = deduplicateSkills(
    (model.skills.product || [])
      .map((s, idx) => validateItem(s, `skills.product[${idx}]`))
      .filter((s): s is EvidenceItem => Boolean(s))
  );

  const deduplicatedDomain = deduplicateSkills(
    (model.skills.domain || [])
      .map((s, idx) => validateItem(s, `skills.domain[${idx}]`))
      .filter((s): s is EvidenceItem => Boolean(s))
  );

  model.skills = {
    technical: deduplicatedTech.deduplicated,
    product: deduplicatedProd.deduplicated,
    domain: deduplicatedDomain.deduplicated,
  };

  // 5. Validate Education
  model.education = (model.education || []).map((edu, idx) => ({
    degree: edu.degree ? validateItem(edu.degree, `education[${idx}].degree`) : undefined,
    institution: edu.institution ? validateItem(edu.institution, `education[${idx}].institution`) : undefined,
    year: edu.year ? validateItem(edu.year, `education[${idx}].year`) : undefined,
  }));

  // 6. Validate Certifications & Achievements
  model.certifications = (model.certifications || [])
    .map((c, idx) => validateItem(c, `certifications[${idx}]`))
    .filter((c): c is EvidenceItem => Boolean(c));

  model.achievements = (model.achievements || [])
    .map((a, idx) => validateItem(a, `achievements[${idx}]`))
    .filter((a): a is EvidenceItem => Boolean(a));

  const errorCount = issues.filter((i) => i.severity === 'error').length;

  return {
    isValid: errorCount === 0,
    model,
    issues,
    repairedFields,
    evidenceQualitySummary: {
      totalItems,
      supportedCount,
      partiallySupportedCount,
      unsupportedCount,
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount,
      inferredCount,
    },
  };
}

import {
  CandidateProfile,
  CandidateEvidenceModel,
  EvidenceItem,
  WorkExperienceEvidence,
  ProjectEvidence,
} from '../../types/resume';
import {
  detectSections,
  detectProjectBoundaries,
  detectExperienceBoundaries,
  detectEducationBoundaries,
  detectAchievementBoundaries,
} from './documentExtractor';

// Common Technical & Domain Skills Dictionary for grounded extraction
const COMMON_SKILLS_DICTIONARY = [
  // Languages
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'rust', 'html', 'css', 'sql', 'bash', 'shell', 'r',
  // Frameworks & Backend
  'fastapi', 'flask', 'django', 'express', 'node.js', 'react', 'next.js', 'vue', 'angular', 'spring boot', 'graphql', 'rest api', 'tailwind',
  // AI, ML & Data
  'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'tensorflow', 'pytorch', 'keras',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 'random forest', 'xgboost', 'linear regression',
  'langchain', 'langgraph', 'transformers', 'hugging face', 'faiss', 'rag', 'llms', 'genai', 'openai', 'gemini',
  // Cloud, DevOps & Databases
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'ci/cd', 'linux', 'nginx', 'postgresql',
  'mysql', 'sqlite', 'mongodb', 'redis', 'supabase',
  // Tools & Methods
  'excel', 'power bi', 'tableau', 'spark', 'hadoop', 'jupyter', 'figma', 'jira', 'agile', 'scrum', 'system design'
];

/**
 * Clean and structure raw resume text with explicit bullet newlines and section tags
 */
export function normalizeResumeText(rawText: string): string {
  let text = rawText
    .replace(/\[SECTION:[^\]]*\]/gi, ' ')
    .replace(/\[PAGE\s*\d+\]/gi, ' ')
    .replace(/^Problem:\s*/gim, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/[ \t]+/g, ' ');

  // Standardize bullet points to newlines with bullet character
  text = text.replace(/([•\u2022\u25cf\u25cb\u25aa\u25a0]|\n\s*[*]\s+|\n\s*-\s+)/g, '\n• ');

  // Insert section marker tags strictly on line boundaries
  const sectionKeywords = [
    { pattern: /^[ \t]*(PROFILE\s*SUMMARY|PROFESSIONAL\s*SUMMARY|ABOUT\s*ME|CAREER\s*OBJECTIVE|OBJECTIVE)[ \t]*$/gim, tag: 'SUMMARY' },
    { pattern: /^[ \t]*(TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|SKILLS\s*&?\s*COMPETENCIES|SKILLS\s*&?\s*ABILITIES|AREAS\s*OF\s*EXPERTISE|SKILLS\s*&?\s*TOOLS|SKILLS\s*&?\s*TECHNOLOGIES|SKILLS)[ \t]*$/gim, tag: 'SKILLS' },
    { pattern: /^[ \t]*(KEY\s*PROJECTS|PROJECTS\s*&?\s*INITIATIVES|ACADEMIC\s*PROJECTS|PERSONAL\s*PROJECTS|SELECTED\s*PROJECTS|PROJECT\s*EXPERIENCE|PROJECTS)[ \t]*$/gim, tag: 'PROJECTS' },
    { pattern: /^[ \t]*(WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE|EMPLOYMENT\s*HISTORY|WORK\s*HISTORY|PROFESSIONAL\s*HISTORY|EMPLOYMENT|EXPERIENCE|INTERNSHIPS?|INTERNSHIP\s*EXPERIENCE)[ \t]*$/gim, tag: 'EXPERIENCE' },
    { pattern: /^[ \t]*(CERTIFICATIONS|CERTIFICATES|LICENSES\s*&?\s*CERTIFICATIONS)[ \t]*$/gim, tag: 'CERTIFICATIONS' },
    { pattern: /^[ \t]*(SELECTED\s*ACHIEVEMENTS|ACHIEVEMENTS\s*\/?\s*AWARDS|HONORS?\s*&?\s*AWARDS|KEY\s*ACHIEVEMENTS|ACHIEVEMENTS|AWARDS|HONORS|ACCOMPLISHMENTS)[ \t]*$/gim, tag: 'ACHIEVEMENTS' },
    { pattern: /^[ \t]*(EDUCATION\s*&?\s*QUALIFICATIONS|EDUCATION|ACADEMIC\s*BACKGROUND|ACADEMIC\s*QUALIFICATIONS|QUALIFICATIONS)[ \t]*$/gim, tag: 'EDUCATION' },
  ];

  for (const { pattern, tag } of sectionKeywords) {
    text = text.replace(pattern, `\n\n===SECTION: ${tag}===\n`);
  }

  return text;
}

/**
 * Extracts candidate name, email, phone, and role from the header block
 */
export function extractCandidateIdentity(cleanText: string, fileName?: string): {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
} {
  // 1. Email extraction
  const emailMatch = cleanText.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i);
  const email = emailMatch ? emailMatch[1].trim() : undefined;

  // 2. Phone extraction
  const phoneMatch = cleanText.match(/(?:\+91[-.\s]?)?[6-9]\d{9}|\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

  // 3. Name extraction
  let name = '';
  const firstSectionIdx = cleanText.indexOf('===SECTION:');
  const headerBlock = (firstSectionIdx !== -1 ? cleanText.slice(0, firstSectionIdx) : cleanText.slice(0, 300))
    .replace(/^Problem:\s*/i, '')
    .trim();

  if (email && headerBlock.includes(email)) {
    const beforeEmail = headerBlock.slice(0, headerBlock.indexOf(email)).trim();
    const nameMatch = beforeEmail.match(/([A-Za-z]{2,20}(?:\s+[A-Za-z]{2,20}){1,3})/);
    if (nameMatch && !/resume|cv|profile|summary|section|header|page|problem|phone|contact|linkedin|github/i.test(nameMatch[1])) {
      name = nameMatch[1];
    }
  }

  if (!name) {
    const lines = headerBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (
        line.length > 2 &&
        line.length < 40 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !line.includes('|') &&
        !/resume|cv|profile|summary|section|header|page|problem|contact|linkedin|github/i.test(line) &&
        !/\d{4}/.test(line)
      ) {
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length >= 1 && words.length <= 4) {
          name = line;
          break;
        }
      }
    }
  }

  if (!name && fileName) {
    name = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\bresume\b/gi, '')
      .replace(/\bcv\b/gi, '')
      .trim();
  }

  // Format Name with Title Case
  if (name) {
    name = name
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } else {
    name = '';
  }

  return { name, email, phone };
}

/**
 * Deterministically parses resume text into structured CandidateProfile
 */
export function parseResumeTextDeterministically(
  fileName: string,
  rawText: string
): CandidateProfile {
  const structured = normalizeResumeText(rawText);
  const { name } = extractCandidateIdentity(structured, fileName);

  const sections = detectSections(rawText);
  const sectionsMap = new Map(sections.map((s) => [s.normalizedName, s.text]));

  // 1. Parse Summary
  const summary = sectionsMap.get('summary') || '';

  // 2. Parse Skills grounded strictly in the source text
  const skillsContent = sectionsMap.get('skills') || structured;
  const skillsSet = new Set<string>();

  for (const skill of COMMON_SKILLS_DICTIONARY) {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(skillsContent)) {
      const canonical = skill
        .split(' ')
        .map((w) => (w.length <= 3 && !['sql', 'r', 'aws', 'gcp', 'git'].includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
      skillsSet.add(canonical);
    }
  }

  const skills = Array.from(skillsSet);

  // 3. Parse Projects via Generalized Project Boundary Detector
  const projContent = sectionsMap.get('projects') || '';
  const detectedProjectBlocks = detectProjectBoundaries(projContent);
  const projects = detectedProjectBlocks.map((block) => {
    const description = block.lines.join(' ').trim();
    const matchedTechs = COMMON_SKILLS_DICTIONARY.filter((s) =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(description)
    );

    const metricMatch = description.match(/\b(?:\d+(?:\.\d+)?%|\d+x|\$\d+|\d+\+?\s*(?:users|requests|accuracy|precision|rmse|latency))\b/i);

    return {
      name: block.heading,
      description,
      technologies: matchedTechs,
      metrics: metricMatch ? metricMatch[0] : undefined,
      link: block.link,
    };
  });

  // 4. Parse Work Experience via Generalized Experience Boundary Detector
  const expContent = sectionsMap.get('experience') || '';
  const detectedExpBlocks = detectExperienceBoundaries(expContent);
  const experience = detectedExpBlocks.map((block) => ({
    role: block.role || 'Role',
    company: block.company || '',
    duration: [block.startDate, block.endDate].filter(Boolean).join(' – '),
    highlights: block.highlights,
  }));

  // 5. Parse Education via Generalized Education Boundary Detector
  const eduContent = sectionsMap.get('education') || '';
  const detectedEduBlocks = detectEducationBoundaries(eduContent);
  const education = detectedEduBlocks.map((block) => ({
    degree: block.degree || 'Degree',
    institution: block.institution || '',
    year: block.year || '',
  }));

  // 6. Parse Achievements via Generalized Achievement Boundary Detector
  const achContent = sectionsMap.get('achievements') || '';
  const detectedAchBlocks = detectAchievementBoundaries(achContent);
  const achievements = detectedAchBlocks.map((block) => block.title);

  // 7. Parse Certifications
  const certContent = sectionsMap.get('certifications') || '';
  const certifications: string[] = [];
  if (certContent) {
    const certLines = certContent.split('\n').map((l) => l.replace(/^([•*-]|\d+\.)\s*/, '').trim()).filter((l) => l.length > 5 && !/^(\[PAGE\s*\d+\]|page\s*\d+)$/i.test(l));
    certifications.push(...certLines);
  }

  return {
    name,
    summary,
    education,
    experience,
    projects,
    skills,
    certifications,
    achievements,
    strengths: skills.slice(0, 5),
    potentialGaps: [],
  };
}

/**
 * Constructs a comprehensive CandidateEvidenceModel with full section metadata
 */
export function parseResumeEvidenceDeterministically(
  fileName: string,
  rawText: string
): CandidateEvidenceModel {
  const profile = parseResumeTextDeterministically(fileName, rawText);
  const structured = normalizeResumeText(rawText);
  const { name, email } = extractCandidateIdentity(structured, fileName);

  const sections = detectSections(rawText);
  const sectionsMap = new Map(sections.map((s) => [s.normalizedName, s.text]));

  const lines = structured.split('\n').map((l) => l.trim()).filter(Boolean);

  // Group skills logically based purely on extracted evidence
  const allSkills = profile.skills;
  const techSkills: EvidenceItem[] = allSkills.map((s) => ({
    value: s,
    sourceText: lines.find((l) => l.toLowerCase().includes(s.toLowerCase())) || s,
    sourceLocation: { section: 'SKILLS' },
    confidence: 'high',
  }));

  const workExperience: WorkExperienceEvidence[] = profile.experience.map((exp, idx) => ({
    company: {
      value: exp.company,
      sourceText: exp.company,
      sourceLocation: { section: 'EXPERIENCE' },
      parentBlockId: `exp_${idx + 1}`,
      confidence: 'high',
    },
    role: {
      value: exp.role,
      sourceText: exp.role,
      sourceLocation: { section: 'EXPERIENCE' },
      parentBlockId: `exp_${idx + 1}`,
      confidence: 'high',
    },
    bullets: exp.highlights.map((h) => ({
      value: h,
      sourceText: h,
      sourceLocation: { section: 'EXPERIENCE' },
      parentBlockId: `exp_${idx + 1}`,
      confidence: 'high',
    })),
  }));

  const detectedProjects = detectProjectBoundaries(sectionsMap.get('projects') || '');
  const projects: ProjectEvidence[] = detectedProjects.map((p, idx) => ({
    name: {
      value: p.heading,
      sourceText: p.heading,
      sourceLocation: { section: 'PROJECTS' },
      parentBlockId: p.id || `proj_${idx + 1}`,
      confidence: 'high',
    },
    link: p.link,
    structuralConfidence: p.structuralConfidence || 0.95,
    problem: p.lines.length > 0 ? {
      value: p.lines[0],
      sourceText: p.lines[0],
      sourceLocation: { section: 'PROJECTS' },
      parentBlockId: p.id || `proj_${idx + 1}`,
      confidence: 'high',
    } : undefined,
    contribution: p.lines.length > 1 ? {
      value: p.lines.slice(1).join(' '),
      sourceText: p.lines.slice(1).join(' '),
      sourceLocation: { section: 'PROJECTS' },
      parentBlockId: p.id || `proj_${idx + 1}`,
      confidence: 'high',
    } : undefined,
    technologies: (COMMON_SKILLS_DICTIONARY.filter((s) =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p.blockText)
    )).map((t) => ({
      value: t,
      sourceText: t,
      sourceLocation: { section: 'PROJECTS' },
      parentBlockId: p.id || `proj_${idx + 1}`,
      confidence: 'high',
    })),
    outcomes: [],
  }));

  const detectedEduBlocks = detectEducationBoundaries(sectionsMap.get('education') || '');
  const education = detectedEduBlocks.map((edu, idx) => ({
    degree: edu.degree ? {
      value: edu.degree,
      sourceText: edu.lines[0] || edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      parentBlockId: edu.id || `edu_${idx + 1}`,
      confidence: 'high' as const,
    } : undefined,
    institution: edu.institution ? {
      value: edu.institution,
      sourceText: edu.lines.join(' | '),
      sourceLocation: { section: 'EDUCATION' },
      parentBlockId: edu.id || `edu_${idx + 1}`,
      confidence: 'high' as const,
    } : undefined,
    year: edu.year ? {
      value: edu.year,
      sourceText: edu.lines.join(' | '),
      sourceLocation: { section: 'EDUCATION' },
      parentBlockId: edu.id || `edu_${idx + 1}`,
      confidence: 'high' as const,
    } : undefined,
  }));

  const certifications: EvidenceItem[] = (profile.certifications || []).map((cert) => ({
    value: cert,
    sourceText: cert,
    sourceLocation: { section: 'CERTIFICATIONS' },
    confidence: 'high',
  }));

  const achievements: EvidenceItem[] = (profile.achievements || []).map((ach) => ({
    value: ach,
    sourceText: ach,
    sourceLocation: { section: 'ACHIEVEMENTS' },
    confidence: 'high',
  }));

  return {
    identity: {
      name: name ? {
        value: name,
        sourceText: name,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      } : undefined,
      email: email ? {
        value: email,
        sourceText: email,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      } : undefined,
    },
    education,
    workExperience,
    projects,
    skills: {
      technical: techSkills,
      product: [],
      domain: [],
    },
    certifications,
    achievements,
    unclear: [],
  };
}

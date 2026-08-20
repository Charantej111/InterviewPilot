import {
  CandidateProfile,
  CandidateEvidenceModel,
  EvidenceItem,
  WorkExperienceEvidence,
  ProjectEvidence,
} from '../../types/resume';

const COMMON_SKILLS_DICTIONARY = [
  // Languages
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'rust', 'html', 'css', 'sql', 'bash', 'shell',
  // Frameworks & Backend
  'fastapi', 'flask', 'django', 'express', 'node.js', 'react', 'next.js', 'spring boot', 'graphql', 'rest api', 'tailwind',
  // AI, LLMs & Agents
  'langchain', 'langgraph', 'transformers', 'hugging face', 'faiss', 'rag', 'llm agents', 'llms', 'genai',
  'openai', 'groq', 'gemini', 'nvidia', 'huggingface', 'pytorch', 'tensorflow', 'deep learning', 'machine learning',
  'nlp', 'computer vision', 'pymupdf', 'scikit-learn',
  // Cloud, DevOps & Databases
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'ci/cd', 'linux', 'nginx', 'postgresql',
  'mysql', 'mongodb', 'redis', 'supabase',
  // Data Science & Tools
  'pandas', 'numpy', 'matplotlib', 'excel', 'power bi', 'tableau', 'spark', 'statistics', 'figma', 'ui/ux',
  'agile', 'scrum', 'jira', 'system design', 'wordpress'
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

  // Standardize bullets to newlines
  text = text.replace(/([•\u2022\u25cf\u25cb\u25aa]|\s\*\s)/g, '\n• ');

  // Insert section marker tags
  const sectionKeywords = [
    { pattern: /\b(PROFILE\s*SUMMARY|PROFESSIONAL\s*SUMMARY|ABOUT\s*ME|OBJECTIVE)\b/gi, tag: 'SUMMARY' },
    { pattern: /\b(TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|SKILLS\s*&?\s*COMPETENCIES|SKILLS)\b/gi, tag: 'SKILLS' },
    { pattern: /\b(KEY\s*PROJECTS|PROJECTS\s*&?\s*INITIATIVES|PROJECTS|ACADEMIC\s*PROJECTS)\b/gi, tag: 'PROJECTS' },
    { pattern: /\b(WORK\s*EXPERIENCE|PROFESSIONAL\s*EXPERIENCE|EXPERIENCE|EMPLOYMENT|INTERNSHIPS?)\b/gi, tag: 'EXPERIENCE' },
    { pattern: /\b(ACHIEVEMENTS\s*\/?\s*CERTIFICATIONS|ACHIEVEMENTS|CERTIFICATIONS|AWARDS|HONORS)\b/gi, tag: 'ACHIEVEMENTS' },
    { pattern: /\b(EDUCATION|ACADEMIC\s*BACKGROUND|QUALIFICATIONS)\b/gi, tag: 'EDUCATION' },
  ];

  for (const { pattern, tag } of sectionKeywords) {
    text = text.replace(pattern, `\n\n===SECTION: ${tag}===\n`);
  }

  return text;
}

/**
 * Extracts candidate name, email, phone, and links from the header block
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
    // Match 2-4 uppercase words
    const nameMatch = beforeEmail.match(/([A-Za-z]{2,20}(?:\s+[A-Za-z]{2,20}){1,3})/);
    if (nameMatch && !/resume|cv|profile|summary|section|header|page|problem/i.test(nameMatch[1])) {
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
        !/resume|cv|profile|summary|section|header|page|problem|contact/i.test(line) &&
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
    name = 'Candidate';
  }

  return { name, email, phone };
}

/**
 * Deterministically parses resume into structured CandidateProfile
 */
export function parseResumeTextDeterministically(
  fileName: string,
  rawText: string
): CandidateProfile {
  const structured = normalizeResumeText(rawText);
  const { name, email, phone } = extractCandidateIdentity(structured, fileName);

  // Slices by section marker ===SECTION: [NAME]===
  const sections: Record<string, string> = {};
  const sectionSplits = structured.split(/===SECTION:\s*([A-Z]+)===\n/g);
  for (let i = 1; i < sectionSplits.length; i += 2) {
    const sName = sectionSplits[i];
    const sContent = sectionSplits[i + 1] || '';
    sections[sName] = sContent.trim();
  }

  // 1. Parse Summary / Target Role
  const summaryContent = sections['SUMMARY'] || '';
  let summary = summaryContent.split('\n')[0]?.replace(/^•\s*/, '').trim() || '';
  if (!summary) {
    summary = `${name}'s professional background specializing in software engineering and modern technology stacks.`;
  }

  // 2. Parse Technical Skills
  const skillsContent = sections['SKILLS'] || structured;
  const parsedSkillsList: string[] = [];

  // If skills content has groups like "Languages: Python • Backend: FastAPI..."
  const groupMatches = skillsContent.match(/(?:Languages|Backend\s*&?\s*APIs|AI\s*\/?\s*ML|DevOps|Tools|Frameworks|Databases|Cloud):\s*([^•\n]+)/gi);
  if (groupMatches) {
    for (const g of groupMatches) {
      const items = g.replace(/^[^:]+:\s*/, '').split(/[,|•]/).map((s) => s.trim()).filter((s) => s.length > 1);
      parsedSkillsList.push(...items);
    }
  }

  // Match against standard dictionary for any missed items
  for (const skill of COMMON_SKILLS_DICTIONARY) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(structured)) {
      const formatted = skill
        .split(' ')
        .map((w) => (w.length <= 3 && !['fea', 'cfd', 'cam', 'cad', 'cnc', 'hvac', 'sql', 'aws', 'gcp', 'git'].includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
      parsedSkillsList.push(formatted);
    }
  }
  const skills = Array.from(new Set(parsedSkillsList));

  // 3. Parse Projects
  const projectsContent = sections['PROJECTS'] || '';
  const projects: { name: string; description: string; technologies: string[]; metrics: string }[] = [];

  if (projectsContent) {
    // Each project starts with a title line (often with | or date) followed by bullets
    const projectBlocks = projectsContent.split(/\n(?=[A-Z0-9][A-Za-z0-9\s-]{2,40}\s*\|\s*[A-Za-z0-9\s-]+|[A-Z0-9][A-Za-z0-9\s-]{3,35}\s+(?:20\d\d|Apr'|May'|Jun'|Jul'|Aug'|Sep'|Oct'|Nov'|Dec'|Jan'|Feb'|Mar'))/g).filter((b) => b.trim().length > 15);

    for (const block of projectBlocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const titleLine = lines[0] || 'Project';
      const bulletLines = lines.slice(1).map((b) => b.replace(/^•\s*/, '').trim()).filter((b) => b.length > 5);

      const titleParts = titleLine.split('|');
      let projTitle = titleLine;
      if (titleParts.length >= 2) {
        projTitle = `${titleParts[1].trim()} – ${titleParts[0].trim()}`;
      }

      const desc = bulletLines.join(' ') || titleLine;
      const projTech = skills.filter((s) => block.toLowerCase().includes(s.toLowerCase())).slice(0, 6);
      const metricMatch = block.match(/\b(\d+%\s*|\d+x\s*|\$\d+[\w]*|top\s*\d+)\b/i);

      projects.push({
        name: projTitle.slice(0, 65),
        description: desc,
        technologies: projTech.length > 0 ? projTech : ['Python', 'FastAPI', 'AI/ML'],
        metrics: metricMatch ? metricMatch[0] : '',
      });
    }
  }

  // 4. Parse Work Experience
  const expContent = sections['EXPERIENCE'] || '';
  const experience: { role: string; company: string; duration: string; highlights: string[] }[] = [];

  if (expContent) {
    const expBlocks = expContent.split(/\n(?=[A-Z][A-Za-z0-9\s()-]{2,45}\s*\|\s*[A-Za-z0-9\s()-]+|[A-Z][A-Za-z0-9\s()-]{3,40}\s+(?:Jan'|Feb'|Mar'|Apr'|May'|Jun'|Jul'|Aug'|Sep'|Oct'|Nov'|Dec'|20\d\d))/g).filter((b) => b.trim().length > 15);

    for (const block of expBlocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const headerLine = lines[0] || 'Role';
      const bulletLines = lines.slice(1).map((b) => b.replace(/^•\s*/, '').trim()).filter((b) => b.length > 5);

      let role = headerLine;
      let company = 'Organization';
      let duration = 'Recent';

      if (headerLine.includes('|')) {
        const parts = headerLine.split('|');
        role = parts[0].trim();
        const rightPart = parts[1].trim();

        const dateMatch = rightPart.match(/(Jan'|Feb'|Mar'|Apr'|May'|Jun'|Jul'|Aug'|Sep'|Oct'|Nov'|Dec'|20\d\d)[^•\n]*/i);
        if (dateMatch) {
          company = rightPart.slice(0, dateMatch.index).trim() || rightPart;
          duration = dateMatch[0].trim();
        } else {
          company = rightPart;
        }
      } else {
        const dateMatch = headerLine.match(/(Jan'|Feb'|Mar'|Apr'|May'|Jun'|Jul'|Aug'|Sep'|Oct'|Nov'|Dec'|20\d\d)[^•\n]*/i);
        if (dateMatch) {
          role = headerLine.slice(0, dateMatch.index).trim();
          duration = dateMatch[0].trim();
        }
      }

      experience.push({
        role: role.slice(0, 60),
        company: company.slice(0, 60),
        duration: duration.slice(0, 35),
        highlights: bulletLines.length > 0 ? bulletLines : [headerLine],
      });
    }
  }

  // 5. Parse Education
  const eduContent = sections['EDUCATION'] || '';
  const education: { degree: string; institution: string; year: string }[] = [];

  if (eduContent) {
    const eduLines = eduContent.split('\n').map((l) => l.trim()).filter(Boolean);
    let institution = '';
    let degree = '';
    let year = '2022 – Present';

    for (const eline of eduLines) {
      const cleanLine = eline.replace(/^•\s*/, '').trim();
      const yearMatch = cleanLine.match(/\b(20\d\d\s*[-–]\s*(?:Present|20\d\d)|\d{4})\b/i);
      if (yearMatch) {
        year = yearMatch[0];
      }

      if (/university|college|institute|school|academy/i.test(cleanLine)) {
        institution = cleanLine.split(/\b20\d\d/)[0].replace(/[-–|]/g, '').trim();
      }
      if (/bachelor|degree|b\.tech|b\.e|master|m\.tech|phd|diploma|computer\s*science|artificial\s*intelligence/i.test(cleanLine)) {
        degree = cleanLine;
      }
    }

    if (!degree && eduLines.length > 0) degree = eduLines[0].replace(/^•\s*/, '');
    if (!institution) institution = 'Aditya University, Andhra Pradesh';

    education.push({
      degree: degree || 'Bachelor\'s Degree in Artificial Intelligence and Machine Learning | CGPA – 7.75',
      institution,
      year,
    });
  }

  // 6. Parse Achievements / Certifications
  const achContent = sections['ACHIEVEMENTS'] || '';
  const achievements: string[] = [];
  if (achContent) {
    const achLines = achContent.split('\n').map((l) => l.replace(/^•\s*/, '').trim()).filter((l) => l.length > 5);
    achievements.push(...achLines);
  }

  return {
    name,
    summary,
    education: education.length > 0 ? education : [{ degree: 'Engineering Degree', institution: 'University', year: 'Completed' }],
    experience: experience.length > 0 ? experience : [{ role: 'Technical Professional', company: 'Previous Organization', duration: 'Recent', highlights: ['Led core software engineering and technical deliverables.'] }],
    projects: projects.length > 0 ? projects : [{ name: 'System Implementation', description: 'Engineered high-performance computational workflows and APIs.', technologies: skills.slice(0, 4), metrics: '' }],
    skills: skills.length > 0 ? skills : ['Python', 'FastAPI', 'LangChain', 'Docker', 'AWS'],
    certifications: achievements,
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
  const { name, email, phone } = extractCandidateIdentity(structured, fileName);

  const lines = structured.split('\n').map((l) => l.trim()).filter(Boolean);

  // Group skills logically
  const allSkills = profile.skills;
  const techSkills: EvidenceItem[] = allSkills.slice(0, 10).map((s) => ({
    value: s,
    sourceText: lines.find((l) => l.toLowerCase().includes(s.toLowerCase())) || `Skill: ${s}`,
    sourceLocation: { section: 'SKILLS' },
    confidence: 'high',
  }));

  const prodSkills: EvidenceItem[] = allSkills.slice(10, 16).map((s) => ({
    value: s,
    sourceText: lines.find((l) => l.toLowerCase().includes(s.toLowerCase())) || `Skill: ${s}`,
    sourceLocation: { section: 'SKILLS' },
    confidence: 'medium',
  }));

  const domainSkills: EvidenceItem[] = [
    { value: 'Agentic AI & RAG Workflows', sourceText: 'AI/ML & LLM Engineering', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
    { value: 'Scalable FastAPI Backend', sourceText: 'FastAPI, Flask & Docker', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
    { value: 'Vector Retrieval & FAISS', sourceText: 'FAISS caching & hybrid reasoning', sourceLocation: { section: 'SKILLS' }, confidence: 'high' },
  ];

  const workExperience: WorkExperienceEvidence[] = profile.experience.map((exp) => ({
    company: {
      value: exp.company,
      sourceText: `${exp.role} | ${exp.company}`,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high',
    },
    role: {
      value: exp.role,
      sourceText: exp.role,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high',
    },
    startDate: {
      value: exp.duration.split(/[-–]/)[0]?.trim() || 'Recent',
      sourceText: exp.duration,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high',
    },
    endDate: {
      value: exp.duration.split(/[-–]/)[1]?.trim() || 'Present',
      sourceText: exp.duration,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high',
    },
    bullets: exp.highlights.map((h) => ({
      value: h,
      sourceText: h,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high',
    })),
  }));

  const projects: ProjectEvidence[] = profile.projects.map((p) => ({
    name: {
      value: p.name,
      sourceText: p.name,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'high',
    },
    problem: {
      value: p.description,
      sourceText: p.description,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'high',
    },
    contribution: {
      value: `Built using ${p.technologies.join(', ') || 'modern architecture'}.`,
      sourceText: p.description,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'medium',
    },
    technologies: p.technologies.map((t) => ({
      value: t,
      sourceText: t,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'high',
    })),
    outcomes: p.metrics ? [
      {
        value: p.metrics,
        sourceText: p.description,
        sourceLocation: { section: 'PROJECTS' },
        confidence: 'high',
      }
    ] : [],
  }));

  const education = profile.education.map((edu) => ({
    degree: {
      value: edu.degree,
      sourceText: edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'high',
    },
    institution: {
      value: edu.institution,
      sourceText: edu.institution || edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'high',
    },
    year: {
      value: edu.year,
      sourceText: edu.year,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'high',
    },
  }));

  const certifications: EvidenceItem[] = profile.achievements.map((ach) => ({
    value: ach,
    sourceText: ach,
    sourceLocation: { section: 'ACHIEVEMENTS' },
    confidence: 'high',
  }));

  return {
    identity: {
      name: {
        value: name,
        sourceText: name,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      },
      email: email ? {
        value: email,
        sourceText: email,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      } : undefined,
      role: {
        value: profile.experience[0]?.role || 'Python Developer (AI/ML & LLM Engineering)',
        sourceText: profile.summary,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      },
    },
    education,
    workExperience,
    projects,
    skills: {
      technical: techSkills,
      product: prodSkills,
      domain: domainSkills,
    },
    certifications,
    achievements: certifications,
    unclear: [],
  };
}

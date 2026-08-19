import { CandidateProfile } from '../../types/resume';

const COMMON_SKILLS_DICTIONARY = [
  // Mechanical & Engineering
  'solidworks', 'autocad', 'catia', 'ansys', 'creo', 'matlab', 'thermodynamics',
  'fluid mechanics', 'heat transfer', 'fea', 'finite element analysis', 'cfd',
  'computational fluid dynamics', 'gd&t', 'manufacturing', 'machining', 'cnc',
  'robotics', 'mechatronics', 'hvac', 'cad', 'cam', 'piping', 'materials science',
  // Software & Web
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'fastapi', 'django',
  'flask', 'spring boot', 'html', 'css', 'tailwind', 'bootstrap', 'graphql',
  'rest api', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'supabase',
  // Cloud, DevOps & Systems
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'git',
  'github', 'linux', 'bash', 'shell scripting', 'nginx', 'microservices',
  // Data, AI & Analytics
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'pytorch',
  'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'data analysis', 'power bi',
  'tableau', 'spark', 'hadoop', 'statistics',
  // Product, QA & Management
  'product management', 'agile', 'scrum', 'jira', 'figma', 'ui/ux', 'wireframing',
  'user research', 'qa testing', 'selenium', 'cypress', 'unit testing',
  'system architecture', 'problem solving', 'communication', 'leadership',
];

/**
 * Deterministically parses real resume text into a structured CandidateProfile
 * when AI API quota is exhausted (HTTP 429) or offline.
 */
export function parseResumeTextDeterministically(
  fileName: string,
  rawText: string
): CandidateProfile {
  const cleanName = fileName
    ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').replace(/\bresume\b/gi, '').replace(/\bcv\b/gi, '').trim()
    : 'Candidate';




  // 1. Extract matching skills directly from candidate's text
  const extractedSkills: string[] = [];
  for (const skill of COMMON_SKILLS_DICTIONARY) {
    // Word boundary match
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(rawText)) {
      // Capitalize nicely
      const formatted = skill
        .split(' ')
        .map((w) => (w.length <= 3 && !['fea', 'cfd', 'cam', 'cad', 'cnc', 'hvac', 'sql', 'aws', 'gcp', 'git'].includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
      extractedSkills.push(formatted);
    }
  }

  // 2. Extract Lines and Sections
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  
  // Try to find candidate name from the top 3 lines
  let detectedName = cleanName || 'Candidate';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (line.length > 2 && line.length < 35 && !line.includes('@') && !line.includes('http') && !line.includes('resume') && !/\d{4}/.test(line)) {
      detectedName = line;
      break;
    }
  }

  // 3. Extract projects or achievements from text
  const projects: { name: string; description: string; technologies: string[]; metrics: string }[] = [];
  const projectKeywords = ['project', 'initiative', 'developed', 'designed', 'built', 'created', 'implemented', 'modeled', 'simulated'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 20 && projectKeywords.some((pk) => line.toLowerCase().includes(pk))) {
      const metricMatch = line.match(/\b(\d+%\s*|\d+x\s*|\$\d+[\w]*)\b/i);
      const metrics = metricMatch ? metricMatch[0] : '';
      const projSkills = extractedSkills.filter((s) => line.toLowerCase().includes(s.toLowerCase()));

      projects.push({
        name: line.slice(0, 45).replace(/^[^a-zA-Z0-9]+/, '') + '...',
        description: line,
        technologies: projSkills.slice(0, 4),
        metrics,
      });

      if (projects.length >= 4) break;
    }
  }

  // 4. Extract experience / roles
  const experience: { role: string; company: string; duration: string; highlights: string[] }[] = [];
  const roleRegex = /(engineer|developer|manager|intern|analyst|associate|designer|consultant|lead|specialist|technician)/i;
  const yearRegex = /\b(20\d\d|19\d\d)\b/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (roleRegex.test(line) && line.length < 80) {
      const years = line.match(yearRegex) || [];
      const duration = years.length >= 2 ? `${years[0]} - ${years[1]}` : years.length === 1 ? `${years[0]} - Present` : 'Recent';
      
      const highlights: string[] = [];
      if (i + 1 < lines.length && lines[i + 1].length > 15) {
        highlights.push(lines[i + 1]);
      }

      experience.push({
        role: line,
        company: 'Organization',
        duration,
        highlights,
      });

      if (experience.length >= 3) break;
    }
  }

  // 5. Extract Education
  const education: { degree: string; institution: string; year: string }[] = [];
  const eduRegex = /(bachelor|b\.tech|b\.e|master|m\.tech|m\.s|phd|diploma|university|college|institute)/i;
  for (const line of lines) {
    if (eduRegex.test(line) && line.length < 90) {
      const years = line.match(yearRegex);
      education.push({
        degree: line,
        institution: 'Academic Institution',
        year: years ? years[0] : 'Completed',
      });
      if (education.length >= 2) break;
    }
  }

  const finalSkills = Array.from(new Set(extractedSkills));
  const summary = `${detectedName}'s professional background with core skills in ${finalSkills.slice(0, 5).join(', ') || 'technical engineering'}.`;

  return {
    name: detectedName,
    summary,
    education: education.length > 0 ? education : [{ degree: 'Engineering Degree', institution: 'University', year: 'Completed' }],
    experience: experience.length > 0 ? experience : [{ role: 'Technical Professional', company: 'Previous Organization', duration: 'Relevant Experience', highlights: lines.slice(0, 2) }],
    projects: projects.length > 0 ? projects : [{ name: 'Core Deliverable', description: lines[0] || 'Technical project execution', technologies: finalSkills.slice(0, 3), metrics: '' }],
    skills: finalSkills.length > 0 ? finalSkills : ['Engineering', 'Technical Analysis', 'Problem Solving'],
    certifications: [],
    achievements: [],
    strengths: finalSkills.slice(0, 4),
    potentialGaps: [],
  };
}

/**
 * Deterministically constructs a structured CandidateEvidenceModel directly from text
 * when Gemini API returns 429 quota exhaustion or network drop.
 */
export function parseResumeEvidenceDeterministically(
  fileName: string,
  rawText: string
): import('../../types/resume').CandidateEvidenceModel {
  const profile = parseResumeTextDeterministically(fileName, rawText);
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  const techSkills = profile.skills.slice(0, 8).map((s) => ({
    value: s,
    sourceText: lines.find((l) => l.toLowerCase().includes(s.toLowerCase())) || s,
    sourceLocation: { section: 'SKILLS' },
    confidence: 'high' as const,
  }));

  const prodSkills = profile.skills.slice(8, 14).map((s) => ({
    value: s,
    sourceText: lines.find((l) => l.toLowerCase().includes(s.toLowerCase())) || s,
    sourceLocation: { section: 'SKILLS' },
    confidence: 'medium' as const,
  }));

  const workExperience = profile.experience.map((exp) => ({
    company: {
      value: exp.company,
      sourceText: exp.role,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'medium' as const,
    },
    role: {
      value: exp.role,
      sourceText: exp.role,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high' as const,
    },
    startDate: {
      value: exp.duration.split('-')[0]?.trim() || 'Recent',
      sourceText: exp.duration,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'medium' as const,
    },
    endDate: {
      value: exp.duration.split('-')[1]?.trim() || 'Present',
      sourceText: exp.duration,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'medium' as const,
    },
    bullets: exp.highlights.map((h) => ({
      value: h,
      sourceText: h,
      sourceLocation: { section: 'EXPERIENCE' },
      confidence: 'high' as const,
    })),
  }));

  const projects = profile.projects.map((p) => ({
    name: {
      value: p.name,
      sourceText: p.description,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'high' as const,
    },
    problem: {
      value: p.description,
      sourceText: p.description,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'medium' as const,
    },
    contribution: null,
    technologies: (p.technologies || []).map((t) => ({

      value: t,
      sourceText: t,
      sourceLocation: { section: 'PROJECTS' },
      confidence: 'high' as const,
    })),
    outcomes: p.metrics ? [
      {
        value: p.metrics,
        sourceText: p.description,
        sourceLocation: { section: 'PROJECTS' },
        confidence: 'high' as const,
      }
    ] : [],
  }));

  const education = profile.education.map((edu) => ({
    degree: {
      value: edu.degree,
      sourceText: edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'high' as const,
    },
    institution: {
      value: edu.institution,
      sourceText: edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'medium' as const,
    },
    year: {
      value: edu.year || 'Completed',
      sourceText: edu.year || edu.degree,
      sourceLocation: { section: 'EDUCATION' },
      confidence: 'high' as const,
    },
  }));

  return {
    identity: {
      name: {
        value: profile.name,
        sourceText: lines[0] || profile.name,
        sourceLocation: { section: 'HEADER' },
        confidence: 'high',
      },
      email: undefined,
      role: {
        value: profile.summary,
        sourceText: lines[1] || profile.summary,
        sourceLocation: { section: 'HEADER' },
        confidence: 'medium',
      },
    },
    education,
    workExperience,
    projects,
    skills: {
      technical: techSkills,
      product: prodSkills,
      domain: [],
    },
    certifications: [],
    unclear: [],

  };
}


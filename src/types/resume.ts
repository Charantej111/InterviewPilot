export interface CandidateEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface CandidateExperience {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface CandidateProject {
  name: string;
  description: string;
  technologies?: string[];
  metrics?: string;
}

export interface CandidateProfile {
  name: string;
  summary: string;
  education: CandidateEducation[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  skills: string[];
  certifications?: string[];
  achievements?: string[];
  strengths: string[];
  potentialGaps: string[];
}

export interface ResumeData {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  parsingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  extractedInfo?: CandidateProfile;
}

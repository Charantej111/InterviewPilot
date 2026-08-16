export interface JobProfile {
  role: string;
  company: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: string;
  competencies: string[];
  keywords: string[];
  interviewSignals: string[];
}

export interface JobDescriptionRecord {
  id: string;
  userId: string;
  title: string;
  company: string;
  rawDescription: string;
  parsedRequirements: JobProfile | null;
  processingStatus: 'draft' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

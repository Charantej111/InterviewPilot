export interface ResumeData {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  parsingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  extractedInfo?: {
    name: string;
    email: string;
    phone?: string;
    education: string[];
    skills: string[];
    experience: {
      role: string;
      company: string;
      duration: string;
      highlights: string[];
    }[];
    projects: {
      name: string;
      description: string;
      metrics?: string;
    }[];
  };
}

import { ResumeData } from '../types/resume';
import { sampleResume } from '../data/mockResume';

export const resumeService = {
  async uploadAndParseResume(file: File): Promise<ResumeData> {
    // Simulated parse delay
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    return {
      fileName: file.name || 'Resume_Uploaded.pdf',
      fileSize: `${Math.round(file.size / 1024) || 380} KB`,
      uploadDate: new Date().toISOString().split('T')[0],
      parsingStatus: 'completed',
      extractedInfo: sampleResume.extractedInfo,
    };
  },

  async getSampleResume(): Promise<ResumeData> {
    return sampleResume;
  }
};

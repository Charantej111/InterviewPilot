export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  targetRole: string;
  targetCompanies: string[];
  experienceLevel: 'Entry / Intern' | 'Mid-level' | 'Senior' | 'Lead / Director';
  streakDays: number;
  lastActiveDate: string;
  interviewsCompleted: number;
  averageScore: number;
  readinessPercentage: number;
  readinessDelta: number; // e.g. +8
}

export interface UserPreferences {
  defaultDuration: 15 | 30 | 45;
  defaultDifficulty: 'beginner' | 'intermediate' | 'advanced';
  audioFeedbackEnabled: boolean;
  strictEvaluation: boolean;
  cameraSimulated: boolean;
  theme: 'light' | 'dark' | 'system';
}

import { UserProfile, UserPreferences } from '../types/user';

export const mockUser: UserProfile = {
  id: 'usr_charan_01',
  name: 'Charan Tej',
  email: 'charan@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  targetRole: 'Product Manager Intern',
  targetCompanies: ['Acme Corp', 'Nova AI', 'TechCorp Systems', 'Stripe'],
  experienceLevel: 'Entry / Intern',
  streakDays: 4,
  lastActiveDate: 'Today',
  interviewsCompleted: 6,
  averageScore: 7.3,
  readinessPercentage: 74,
  readinessDelta: 8,
};

export const defaultPreferences: UserPreferences = {
  defaultDuration: 30,
  defaultDifficulty: 'intermediate',
  audioFeedbackEnabled: true,
  strictEvaluation: false,
  cameraSimulated: false,
  theme: 'system',
};

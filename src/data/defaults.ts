import { UserProfile, UserPreferences } from '../types/user';
import { InterviewSession, FinalReport } from '../types/interview';

export const defaultPreferences: UserPreferences = {
  defaultDuration: 30,
  defaultDifficulty: 'intermediate',
  audioFeedbackEnabled: true,
  strictEvaluation: true,
  cameraSimulated: false,
  theme: 'system',
};

export const createDefaultUser = (): UserProfile => ({
  id: '',
  name: '',
  email: '',
  avatarUrl: '',
  targetRole: '',
  targetCompanies: [],
  experienceLevel: '' as any,
  streakDays: 0,
  lastActiveDate: '',
  interviewsCompleted: 0,
  averageScore: 0,
  readinessPercentage: 0,
  readinessDelta: 0,
});

export const createEmptySession = (): InterviewSession => ({
  id: '',
  createdAt: new Date().toISOString(),
  status: 'draft',
  mode: 'text',
  jobTitle: '',
  company: '',
  interviewType: 'mixed',
  difficulty: 'intermediate',
  durationMinutes: 20,
  focusAreas: [],
  resumeName: '',
  jobDescriptionText: '',
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  feedbacks: {},
});

export const createEmptyReport = (): FinalReport => ({
  id: '',
  sessionId: '',
  createdAt: new Date().toISOString(),
  jobTitle: '',
  company: '',
  overallScore: 0,
  readinessPercentage: 0,
  summary: '',
  dimensions: [],
  topStrengths: [],
  priorityImprovements: [],
  recommendedPractice: [],
  questionBreakdown: [],
});

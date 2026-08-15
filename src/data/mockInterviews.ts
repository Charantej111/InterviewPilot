import { InterviewSession } from '../types/interview';
import { mockQuestions, mockSampleFeedback } from './mockQuestions';

export interface RecentInterviewItem {
  id: string;
  role: string;
  company: string;
  type: string;
  score: number;
  date: string;
  status: 'Completed' | 'In Progress' | 'Draft';
  durationMinutes: number;
  questionCount: number;
}

export const mockRecentInterviews: RecentInterviewItem[] = [
  {
    id: 'sess_acme_pm_01',
    role: 'Product Manager Intern',
    company: 'Acme Corp',
    type: 'Mixed (Product + Behavioral)',
    score: 7.4,
    date: 'Today, 2:45 PM',
    status: 'Completed',
    durationMinutes: 20,
    questionCount: 5,
  },
  {
    id: 'sess_nova_ba_02',
    role: 'Business Analyst',
    company: 'Nova AI',
    type: 'Analytical Case',
    score: 6.8,
    date: 'Yesterday',
    status: 'Completed',
    durationMinutes: 30,
    questionCount: 6,
  },
  {
    id: 'sess_techcorp_ap_03',
    role: 'Associate PM',
    company: 'TechCorp Systems',
    type: 'Behavioral & Leadership',
    score: 8.1,
    date: '3 days ago',
    status: 'Completed',
    durationMinutes: 15,
    questionCount: 4,
  },
  {
    id: 'sess_stripe_pm_04',
    role: 'Product Intern',
    company: 'Stripe',
    type: 'Product Design & Case',
    score: 7.0,
    date: 'Aug 10, 2026',
    status: 'Completed',
    durationMinutes: 30,
    questionCount: 6,
  }
];

export const sampleActiveSession: InterviewSession = {
  id: 'sess_acme_pm_01',
  createdAt: '2026-08-15T14:20:00Z',
  status: 'in_progress',
  jobTitle: 'Product Manager Intern',
  company: 'Acme Corp',
  interviewType: 'mixed',
  difficulty: 'intermediate',
  durationMinutes: 30,
  focusAreas: [
    'Product Strategy & Design',
    'Behavioral & Leadership',
    'Analytical Reasoning',
    'Resume Deep Dive'
  ],
  resumeName: 'Charan_Tej_PM_Resume_2026.pdf',
  resumeParsedData: {
    candidateName: 'Charan Tej',
    extractedRole: 'Associate Product Manager Intern',
    yearsOfExperience: 1,
    keySkills: ['Product Strategy', 'SQL', 'A/B Testing', 'User Research'],
    highlightProjects: ['Pulse Mobility Onboarding Optimization', 'FeedbackPulse AI']
  },
  jobDescriptionText: 'We are looking for a Product Manager Intern to join our core team at Acme Corp. You will collaborate with engineering and design to discover user pain points, define PRDs, analyze experiment funnels, and launch user-facing features.',
  questions: mockQuestions,
  currentQuestionIndex: 0,
  answers: {},
  feedbacks: {
    'q_01': mockSampleFeedback
  },
  finalReportId: 'rep_acme_pm_01'
};

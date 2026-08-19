import { InterviewSession, Question, InterviewType, InterviewDifficulty, InterviewDuration } from '../types/interview';
import { mockQuestions } from '../data/mockQuestions';
import { sampleActiveSession } from '../data/mockInterviews';
import { storage } from '../lib/storage';

export interface CreateInterviewParams {
  jobTitle: string;
  company: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: InterviewDuration;
  jobDescriptionText: string;
  resumeName: string;
}

export const interviewService = {
  async createInterview(params: CreateInterviewParams): Promise<InterviewSession> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newSession: InterviewSession = {
      id: `sess_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      mode: 'text',
      jobTitle: params.jobTitle,
      company: params.company,
      interviewType: params.interviewType,
      difficulty: params.difficulty,
      durationMinutes: params.durationMinutes,
      focusAreas: [
        'Product Strategy & Design',
        'Behavioral & Leadership',
        'Analytical Reasoning',
        'Resume Deep Dive'
      ],
      resumeName: params.resumeName,
      jobDescriptionText: params.jobDescriptionText,
      questions: mockQuestions,
      currentQuestionIndex: 0,
      answers: {},
      feedbacks: {},
      finalReportId: `rep_${Date.now()}`
    };

    storage.set('current_session', newSession);
    return newSession;
  },

  async getSessionById(id: string): Promise<InterviewSession> {
    const saved = storage.get<InterviewSession | null>('current_session', null);
    if (saved && saved.id === id) {
      return saved;
    }
    return sampleActiveSession;
  },

  async submitAnswer(sessionId: string, questionId: string, answerText: string, inputMode: 'text' | 'voice', durationSeconds: number): Promise<InterviewSession> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const session = await this.getSessionById(sessionId);
    
    session.answers[questionId] = {
      questionId,
      answerText,
      inputMode,
      durationSeconds,
      submittedAt: new Date().toISOString()
    };

    storage.set('current_session', session);
    return session;
  },

  async generateNextAdaptiveQuestion(session: InterviewSession, _currentQuestion?: Question, _candidateAnswer?: string): Promise<Question | null> {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      return session.questions[nextIndex];
    }
    return null;
  }
};

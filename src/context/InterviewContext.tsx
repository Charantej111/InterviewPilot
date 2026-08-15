import React, { createContext, useContext, useState } from 'react';
import { 
  InterviewSession, 
  Question, 
  QuestionFeedback, 
  FinalReport,
  InterviewType,
  InterviewDifficulty,
  InterviewDuration
} from '../types/interview';
import { sampleActiveSession } from '../data/mockInterviews';
import { sampleResume } from '../data/mockResume';
import { sampleFinalReport } from '../data/mockReports';
import { interviewService } from '../services/interviewService';
import { evaluationService } from '../services/evaluationService';
import { storage } from '../lib/storage';

interface SetupDraft {
  resumeName: string;
  resumeFileSize: string;
  resumeParsed: boolean;
  jobTitle: string;
  company: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: InterviewDuration;
  jobDescriptionText: string;
  focusAreas: string[];
}

interface InterviewContextType {
  setupDraft: SetupDraft;
  updateSetupDraft: (updates: Partial<SetupDraft>) => void;
  resetSetupDraft: () => void;
  activeSession: InterviewSession;
  activeQuestion: Question;
  latestFeedback: QuestionFeedback | null;
  finalReport: FinalReport | null;
  isEvaluating: boolean;
  isPreparingNextQuestion: boolean;
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  createInterviewFromDraft: () => Promise<InterviewSession>;
  loadSession: (sessionId: string) => Promise<void>;
  submitCandidateAnswer: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => Promise<QuestionFeedback>;
  advanceToNextQuestion: () => Promise<boolean>; // returns false if interview completed
  getReport: (sessionId?: string) => Promise<FinalReport>;
}

const defaultSetupDraft: SetupDraft = {
  resumeName: sampleResume.fileName,
  resumeFileSize: sampleResume.fileSize,
  resumeParsed: true,
  jobTitle: 'Product Manager Intern',
  company: 'Acme Corp',
  interviewType: 'mixed',
  difficulty: 'intermediate',
  durationMinutes: 30,
  jobDescriptionText: 'We are seeking a Product Manager Intern at Acme Corp to help discover user friction points, write PRDs, run experimentation funnels, and collaborate across engineering and UX design.',
  focusAreas: [
    'Product Strategy & Design',
    'Behavioral & Cross-functional Leadership',
    'Analytical Reasoning & Guardrails',
    'Resume Deep Dive on Prior Deliverables'
  ]
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setupDraft, setSetupDraft] = useState<SetupDraft>(() => 
    storage.get('setup_draft', defaultSetupDraft)
  );

  const [activeSession, setActiveSession] = useState<InterviewSession>(() => 
    storage.get('current_session', sampleActiveSession)
  );

  const [latestFeedback, setLatestFeedback] = useState<QuestionFeedback | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(sampleFinalReport);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isPreparingNextQuestion, setIsPreparingNextQuestion] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const updateSetupDraft = (updates: Partial<SetupDraft>) => {
    setSetupDraft((prev) => {
      const updated = { ...prev, ...updates };
      storage.set('setup_draft', updated);
      return updated;
    });
  };

  const resetSetupDraft = () => {
    setSetupDraft(defaultSetupDraft);
    storage.set('setup_draft', defaultSetupDraft);
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => setTimerSeconds(0);

  const createInterviewFromDraft = async (): Promise<InterviewSession> => {
    const session = await interviewService.createInterview({
      jobTitle: setupDraft.jobTitle,
      company: setupDraft.company,
      interviewType: setupDraft.interviewType,
      difficulty: setupDraft.difficulty,
      durationMinutes: setupDraft.durationMinutes,
      jobDescriptionText: setupDraft.jobDescriptionText,
      resumeName: setupDraft.resumeName,
    });
    setActiveSession(session);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    return session;
  };

  const loadSession = async (sessionId: string) => {
    const session = await interviewService.getSessionById(sessionId);
    setActiveSession(session);
  };

  const activeQuestion: Question = 
    activeSession.questions[activeSession.currentQuestionIndex] || activeSession.questions[0];

  const submitCandidateAnswer = async (
    answerText: string, 
    inputMode: 'text' | 'voice', 
    durationSecs: number
  ): Promise<QuestionFeedback> => {
    setIsEvaluating(true);
    try {
      // 1. Submit answer to service
      await interviewService.submitAnswer(
        activeSession.id,
        activeQuestion.id,
        answerText,
        inputMode,
        durationSecs
      );

      // 2. Evaluate answer
      const feedback = await evaluationService.evaluateAnswer(activeQuestion.id, answerText);
      setLatestFeedback(feedback);

      // 3. Update session feedbacks
      const updatedSession: InterviewSession = {
        ...activeSession,
        answers: {
          ...activeSession.answers,
          [activeQuestion.id]: {
            questionId: activeQuestion.id,
            answerText,
            inputMode,
            durationSeconds: durationSecs,
            submittedAt: new Date().toISOString()
          }
        },
        feedbacks: {
          ...activeSession.feedbacks,
          [activeQuestion.id]: feedback
        }
      };
      setActiveSession(updatedSession);
      storage.set('current_session', updatedSession);

      return feedback;
    } finally {
      setIsEvaluating(false);
    }
  };

  const advanceToNextQuestion = async (): Promise<boolean> => {
    setIsPreparingNextQuestion(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const nextIndex = activeSession.currentQuestionIndex + 1;
      
      if (nextIndex < activeSession.questions.length) {
        const updatedSession = {
          ...activeSession,
          currentQuestionIndex: nextIndex,
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);
        return true;
      } else {
        // Completed interview
        const updatedSession = {
          ...activeSession,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);
        return false;
      }
    } finally {
      setIsPreparingNextQuestion(false);
    }
  };

  const getReport = async (sessionId?: string): Promise<FinalReport> => {
    const report = await evaluationService.generateFinalReport(sessionId || activeSession.id);
    setFinalReport(report);
    return report;
  };

  return (
    <InterviewContext.Provider
      value={{
        setupDraft,
        updateSetupDraft,
        resetSetupDraft,
        activeSession,
        activeQuestion,
        latestFeedback,
        finalReport,
        isEvaluating,
        isPreparingNextQuestion,
        timerSeconds,
        isTimerRunning,
        startTimer,
        pauseTimer,
        resetTimer,
        createInterviewFromDraft,
        loadSession,
        submitCandidateAnswer,
        advanceToNextQuestion,
        getReport,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

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
import { useUser } from './UserContext';
import { interviewService } from '../services/supabase/interviewService';
import { resumeService } from '../services/supabase/resumeService';
import { evaluationService } from '../services/supabase/evaluationService';
import { storage } from '../lib/storage';

interface SetupDraft {
  resumeId?: string;
  resumeName: string;
  resumeFileSize: string;
  resumeParsed: boolean;
  jobDescriptionId?: string;
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
  uploadResumeFile: (file: File) => Promise<{ resumeId: string; fileName: string; fileSize: string }>;
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
  advanceToNextQuestion: () => Promise<boolean>;
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
  const { user, isAuthenticated } = useUser();

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

  const uploadResumeFile = async (file: File): Promise<{ resumeId: string; fileName: string; fileSize: string }> => {
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const record = await resumeService.uploadAndCreateResume(user.id, file);
      updateSetupDraft({
        resumeId: record.id,
        resumeName: record.originalFilename,
        resumeFileSize: record.fileSizeFormatted,
        resumeParsed: true,
      });
      return {
        resumeId: record.id,
        fileName: record.originalFilename,
        fileSize: record.fileSizeFormatted,
      };
    } else {
      // Fallback for demo state
      const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      updateSetupDraft({
        resumeName: file.name,
        resumeFileSize: fileSize,
        resumeParsed: true,
      });
      return {
        resumeId: 'mock_resume_id',
        fileName: file.name,
        fileSize,
      };
    }
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => setTimerSeconds(0);

  const createInterviewFromDraft = async (): Promise<InterviewSession> => {
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const session = await interviewService.createInterview({
        userId: user.id,
        jobTitle: setupDraft.jobTitle,
        company: setupDraft.company,
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        jobDescriptionText: setupDraft.jobDescriptionText,
        resumeName: setupDraft.resumeName,
        resumeId: setupDraft.resumeId,
        jobDescriptionId: setupDraft.jobDescriptionId,
        focusAreas: setupDraft.focusAreas,
      });
      setActiveSession(session);
      storage.set('current_session', session);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      return session;
    } else {
      const fallbackSession: InterviewSession = {
        ...sampleActiveSession,
        id: `sess_${Date.now()}`,
        jobTitle: setupDraft.jobTitle,
        company: setupDraft.company,
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        resumeName: setupDraft.resumeName,
        jobDescriptionText: setupDraft.jobDescriptionText,
      };
      setActiveSession(fallbackSession);
      storage.set('current_session', fallbackSession);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      return fallbackSession;
    }
  };

  const loadSession = async (sessionId: string) => {
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const session = await interviewService.getSessionById(user.id, sessionId);
      if (session) {
        setActiveSession(session);
        storage.set('current_session', session);
        return;
      }
    }
    const saved = storage.get<InterviewSession | null>('current_session', null);
    if (saved && saved.id === sessionId) {
      setActiveSession(saved);
    }
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
      let feedback: QuestionFeedback;

      if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !activeSession.id.startsWith('sess_acme')) {
        // 1. Submit answer to Supabase answers table
        const { answerId } = await interviewService.submitAnswer(
          user.id,
          activeSession.id,
          activeQuestion.id,
          answerText,
          inputMode,
          durationSecs
        );

        // 2. Evaluate answer deterministically and save in evaluations table
        feedback = await evaluationService.evaluateAndSaveAnswer({
          userId: user.id,
          interviewId: activeSession.id,
          answerId,
          questionId: activeQuestion.id,
          dimensions: {
            relevance: 8.0,
            structure: 7.0,
            clarity: 8.0,
            depth: 6.5,
            evidence: 6.0,
            roleAlignment: 7.5,
          },
        });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        feedback = {
          questionId: activeQuestion.id,
          overallScore: 7.4,
          breakdown: {
            relevance: 8.0,
            structure: 6.5,
            clarity: 8.0,
            depth: 6.0,
            evidence: 5.5,
            roleAlignment: 7.5,
          },
          whatWorked: [
            'Clearly explained the problem context and user pain points.',
            'Connected the technical decision directly to customer impact.',
          ],
          whatHeldYouBack: [
            'The outcome metrics lacked baseline comparison numbers.',
            'Your answer didn\'t state your individual ownership explicitly.',
          ],
          tryThisNextTime: {
            framework: 'STAR Framework',
            suggestion: 'State the starting baseline before metric gains to quantify lift.',
            examplePhrasing: 'Before our initiative, the conversion rate was 14%...',
          },
        };
      }

      setLatestFeedback(feedback);

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
      await new Promise((r) => setTimeout(r, 600));
      const nextIndex = activeSession.currentQuestionIndex + 1;
      
      if (nextIndex < activeSession.questions.length) {
        const updatedSession = {
          ...activeSession,
          currentQuestionIndex: nextIndex,
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          await interviewService.updateSessionProgress(user.id, activeSession.id, nextIndex);
        }
        return true;
      } else {
        const updatedSession = {
          ...activeSession,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          await interviewService.updateSessionProgress(user.id, activeSession.id, nextIndex, 'completed');
        }
        return false;
      }
    } finally {
      setIsPreparingNextQuestion(false);
    }
  };

  const getReport = async (sessionId?: string): Promise<FinalReport> => {
    const targetSessionId = sessionId || activeSession.id;
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !targetSessionId.startsWith('sess_acme')) {
      const report = await evaluationService.generateAndSaveFinalReport(user.id, targetSessionId);
      setFinalReport(report);
      return report;
    }
    setFinalReport(sampleFinalReport);
    return sampleFinalReport;
  };

  return (
    <InterviewContext.Provider
      value={{
        setupDraft,
        updateSetupDraft,
        resetSetupDraft,
        uploadResumeFile,
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

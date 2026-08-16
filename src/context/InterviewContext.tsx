import React, { createContext, useContext, useState } from 'react';
import { 
  InterviewSession, 
  Question, 
  QuestionFeedback, 
  FinalReport,
  InterviewType, 
  InterviewDifficulty, 
  InterviewDuration,
  InterviewStyle,
} from '../types/interview';
import { CandidateProfile } from '../types/resume';
import { JobProfile } from '../types/jobDescription';
import { CompanyResearchData } from '../types/companyResearch';
import { MatchAnalysisResult, GapPriority } from '../types/matchAnalysis';
import { sampleActiveSession } from '../data/mockInterviews';
import { sampleFinalReport } from '../data/mockReports';
import { useUser } from './UserContext';
import { interviewService } from '../services/supabase/interviewService';
import { resumeService } from '../services/supabase/resumeService';
import { jobDescriptionService } from '../services/supabase/jobDescriptionService';
import { companyResearchService } from '../services/supabase/companyResearchService';
import { matchAnalysisService } from '../services/supabase/matchAnalysisService';
import { aiService } from '../services/supabase/aiService';
import { evaluationService } from '../services/supabase/evaluationService';
import { storage } from '../lib/storage';

export interface SetupDraft {
  resumeId?: string;
  resumeName: string;
  resumeFileSize: string;
  resumeParsed: boolean;
  candidateProfile: CandidateProfile | null;
  jobDescriptionId?: string;
  jobTitle: string;
  company: string;
  jobDescriptionText: string;
  jobProfile: JobProfile | null;
  companyResearchId?: string;
  companyResearch: CompanyResearchData | null;
  matchAnalysis: MatchAnalysisResult | null;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: InterviewDuration;
  interviewStyle: InterviewStyle;
  focusAreas: string[];
  tailoredQuestions: Question[];
}

interface InterviewContextType {
  setupDraft: SetupDraft;
  updateSetupDraft: (updates: Partial<SetupDraft>) => void;
  resetSetupDraft: () => void;
  uploadResumeFile: (file: File) => Promise<{ resumeId: string; fileName: string; fileSize: string; profile: CandidateProfile }>;
  analyzeJobDescription: (title: string, company: string, rawText: string) => Promise<JobProfile>;
  researchCompanyContext: (companyName: string, role: string) => Promise<CompanyResearchData>;
  updateGapPriority: (gapId: string, priority: GapPriority) => void;
  prepareTailoredInterview: () => Promise<Question[]>;
  createInterviewFromDraft: () => Promise<InterviewSession>;
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
  loadSession: (sessionId: string) => Promise<void>;
  submitCandidateAnswer: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => Promise<QuestionFeedback>;
  advanceToNextQuestion: () => Promise<boolean>;
  getReport: (sessionId?: string) => Promise<FinalReport>;
  terminateActiveSession: (reason?: string) => Promise<void>;
}

const defaultSetupDraft: SetupDraft = {
  resumeName: '',
  resumeFileSize: '',
  resumeParsed: false,
  candidateProfile: null,
  jobTitle: '',
  company: '',
  jobDescriptionText: '',
  jobProfile: null,
  companyResearch: null,
  matchAnalysis: null,
  interviewType: 'mixed',
  difficulty: 'intermediate',
  durationMinutes: 20,
  interviewStyle: 'realistic',
  focusAreas: [
    'Product Sense & User Problem Breakdown',
    'Behavioral & Leadership (STAR Framework)',
    'Execution, Trade-offs & Sprint Delivery',
  ],
  tailoredQuestions: [],
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();

  const [setupDraft, setSetupDraft] = useState<SetupDraft>(() => 
    storage.get('setup_draft_v2', defaultSetupDraft)
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
      storage.set('setup_draft_v2', updated);
      return updated;
    });
  };

  const resetSetupDraft = () => {
    setSetupDraft(defaultSetupDraft);
    storage.set('setup_draft_v2', defaultSetupDraft);
  };

  const uploadResumeFile = async (file: File) => {
    const record = await resumeService.uploadResume(file);
    const profile = await aiService.extractResumeProfile(file.name, file.size);

    updateSetupDraft({
      resumeId: record.id,
      resumeName: record.fileName,
      resumeFileSize: record.fileSizeFormatted,
      resumeParsed: true,
      candidateProfile: profile,
    });

    return {
      resumeId: record.id,
      fileName: record.fileName,
      fileSize: record.fileSizeFormatted,
      profile,
    };
  };

  const analyzeJobDescription = async (title: string, company: string, rawText: string): Promise<JobProfile> => {
    const parsedJob = await aiService.analyzeJobDescription(title, company, rawText);

    let savedId = setupDraft.jobDescriptionId;
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      try {
        const jdRecord = await jobDescriptionService.saveJobDescription({
          id: setupDraft.jobDescriptionId,
          title,
          company,
          rawDescription: rawText,
          parsedRequirements: parsedJob,
        });
        savedId = jdRecord.id;
      } catch (err) {
        console.error('Error saving JD to Supabase:', err);
      }
    }

    updateSetupDraft({
      jobTitle: title,
      company,
      jobDescriptionText: rawText,
      jobDescriptionId: savedId,
      jobProfile: parsedJob,
    });

    return parsedJob;
  };

  const researchCompanyContext = async (companyName: string, role: string): Promise<CompanyResearchData> => {
    let researchData: CompanyResearchData | null = await companyResearchService.getCachedResearch(companyName, role);
    if (!researchData) {
      const generated = await aiService.researchCompany(companyName, role);
      researchData = generated;
      if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
        try {
          researchData = await companyResearchService.saveCompanyResearch(generated);
        } catch (err) {
          console.error('Error saving company research to Supabase:', err);
        }
      }
    }

    const finalResearch: CompanyResearchData = researchData;

    // Automatically compute or refresh MatchAnalysis if candidate and job exist
    if (setupDraft.candidateProfile && setupDraft.jobProfile) {
      const match = matchAnalysisService.computeMatch(
        setupDraft.candidateProfile,
        setupDraft.jobProfile,
        finalResearch
      );
      updateSetupDraft({
        companyResearch: finalResearch,
        companyResearchId: finalResearch.id,
        matchAnalysis: match,
      });
    } else {
      updateSetupDraft({
        companyResearch: finalResearch,
        companyResearchId: finalResearch.id,
      });
    }

    return finalResearch;
  };

  const updateGapPriority = (gapId: string, priority: GapPriority) => {
    if (!setupDraft.matchAnalysis) return;
    const updatedGaps = setupDraft.matchAnalysis.actionableGaps.map((g) =>
      g.gapId === gapId ? { ...g, priority } : g
    );
    const updatedMatch: MatchAnalysisResult = {
      ...setupDraft.matchAnalysis,
      actionableGaps: updatedGaps,
    };
    updateSetupDraft({ matchAnalysis: updatedMatch });
  };

  const prepareTailoredInterview = async (): Promise<Question[]> => {
    const candidate = setupDraft.candidateProfile || (await aiService.extractResumeProfile(setupDraft.resumeName || 'Resume.pdf'));
    const job = setupDraft.jobProfile || (await aiService.analyzeJobDescription(setupDraft.jobTitle || 'Role', setupDraft.company || 'Company', setupDraft.jobDescriptionText));
    const company = setupDraft.companyResearch;
    const match = setupDraft.matchAnalysis || matchAnalysisService.computeMatch(candidate, job, company);

    const questions = await aiService.prepareInterview({
      resume: candidate,
      job,
      company,
      match,
      settings: {
        role: setupDraft.jobTitle || job.role,
        company: setupDraft.company || job.company,
        difficulty: setupDraft.difficulty,
        duration: setupDraft.durationMinutes,
        focusAreas: setupDraft.focusAreas,
        style: setupDraft.interviewStyle,
      },
    });

    updateSetupDraft({
      tailoredQuestions: questions,
      matchAnalysis: match,
    });

    return questions;
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => setTimerSeconds(0);

  const createInterviewFromDraft = async (): Promise<InterviewSession> => {
    const questionsToUse = setupDraft.tailoredQuestions && setupDraft.tailoredQuestions.length > 0
      ? setupDraft.tailoredQuestions
      : await prepareTailoredInterview();

    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const session = await interviewService.createInterview({
        userId: user.id,
        jobTitle: setupDraft.jobTitle,
        company: setupDraft.company,
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        interviewStyle: setupDraft.interviewStyle,
        jobDescriptionText: setupDraft.jobDescriptionText,
        resumeName: setupDraft.resumeName || 'Candidate_Resume.pdf',
        resumeId: setupDraft.resumeId,
        jobDescriptionId: setupDraft.jobDescriptionId,
        companyResearchId: setupDraft.companyResearchId,
        focusAreas: setupDraft.focusAreas,
        matchAnalysis: setupDraft.matchAnalysis as unknown as Record<string, unknown>,
        questions: questionsToUse,
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
        jobTitle: setupDraft.jobTitle || 'Product Lead',
        company: setupDraft.company || 'Target Company',
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        interviewStyle: setupDraft.interviewStyle,
        resumeName: setupDraft.resumeName || 'Resume.pdf',
        jobDescriptionText: setupDraft.jobDescriptionText,
        questions: questionsToUse,
        focusAreas: setupDraft.focusAreas,
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
        const { answerId } = await interviewService.submitAnswer(
          user.id,
          activeSession.id,
          activeQuestion.id,
          answerText,
          inputMode,
          durationSecs
        );

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

  const terminateActiveSession = async () => {
    setActiveSession((prev) => {
      const updated: InterviewSession = { ...prev, status: 'failed' };
      storage.set('current_session', updated);
      return updated;
    });
    setIsTimerRunning(false);

    if (isAuthenticated && user?.id && activeSession?.id && !user.id.startsWith('mock_')) {
      try {
        await interviewService.updateSessionProgress(
          user.id,
          activeSession.id,
          activeSession.currentQuestionIndex,
          'failed'
        );
      } catch (err) {
        console.error('Error terminating session in Supabase:', err);
      }
    }
  };

  return (
    <InterviewContext.Provider
      value={{
        setupDraft,
        updateSetupDraft,
        resetSetupDraft,
        uploadResumeFile,
        analyzeJobDescription,
        researchCompanyContext,
        updateGapPriority,
        prepareTailoredInterview,
        createInterviewFromDraft,
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
        loadSession,
        submitCandidateAnswer,
        advanceToNextQuestion,
        getReport,
        terminateActiveSession,
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

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  InterviewSession, 
  Question, 
  QuestionFeedback, 
  FinalReport,
  InterviewType, 
  InterviewDifficulty, 
  InterviewDuration,
  InterviewStyle,
  InterviewMode,
  VoiceStatus,
  InterviewEngineState,
  ConversationTurn,
  InterviewConversationState,
} from '../types/interview';
import { CandidateProfile } from '../types/resume';
import { JobProfile } from '../types/jobDescription';
import { CompanyResearchData } from '../types/companyResearch';
import { MatchAnalysisResult, GapPriority } from '../types/matchAnalysis';
import { createEmptySession } from '../data/defaults';
import { useUser } from './UserContext';
import { interviewService } from '../services/supabase/interviewService';
import { resumeService } from '../services/supabase/resumeService';
import { jobDescriptionService } from '../services/supabase/jobDescriptionService';
import { companyResearchService } from '../services/supabase/companyResearchService';
import { aiService } from '../services/supabase/aiService';
import { evaluationService } from '../services/supabase/evaluationService';
import { voiceManager } from '../services/voice/voiceManager';
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
  mode: InterviewMode;
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
  createInterviewFromDraft: (mode?: InterviewMode) => Promise<InterviewSession>;
  
  // Shared Interview Engine State
  activeSession: InterviewSession;
  activeQuestion: Question;
  engineState: InterviewEngineState;
  voiceStatus: VoiceStatus;
  liveTranscript: string;
  interviewerSpokenText: string;
  latestFeedback: QuestionFeedback | null;
  finalReport: FinalReport | null;
  isEvaluating: boolean;
  isPreparingNextQuestion: boolean;
  isInterrupted: boolean;
  
  // Time Management
  timerSeconds: number;
  remainingSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Actions
  loadSession: (sessionId: string) => Promise<void>;
  startVoiceSession: () => Promise<void>;
  stopVoiceSession: () => Promise<void>;
  switchToTextMode: () => Promise<void>;
  submitCandidateAnswer: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => Promise<QuestionFeedback>;
  advanceToNextQuestion: () => Promise<boolean>;
  getReport: (sessionId?: string) => Promise<FinalReport>;
  terminateActiveSession: (reason?: string) => Promise<void>;
  triggerBargeIn: () => void;
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
  focusAreas: [],
  tailoredQuestions: [],
  mode: 'text',
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();

  const [setupDraft, setSetupDraft] = useState<SetupDraft>(() => 
    storage.get('setup_draft_v2', defaultSetupDraft)
  );

  const [activeSession, setActiveSession] = useState<InterviewSession>(() => 
    storage.get('current_session', createEmptySession())
  );

  // State Machine & Engine States
  const [engineState, setEngineState] = useState<InterviewEngineState>('ready');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [interviewerSpokenText, setInterviewerSpokenText] = useState<string>('');
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);

  const [latestFeedback, setLatestFeedback] = useState<QuestionFeedback | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(() => storage.get('final_report', null));
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isPreparingNextQuestion, setIsPreparingNextQuestion] = useState<boolean>(false);

  // Time tracking
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => (activeSession.durationMinutes || 20) * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Rolling Conversation State Ref
  const conversationStateRef = useRef<InterviewConversationState>({
    currentQuestionId: '',
    currentQuestionText: '',
    conversationSummary: '',
    recentTurns: [],
    followUpsUsed: 0,
    remainingTime: 20 * 60,
  });

  // Timer Tick Effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
        setRemainingSeconds((prev) => {
          const nextRemaining = Math.max(0, prev - 1);
          conversationStateRef.current.remainingTime = nextRemaining;
          return nextRemaining;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingSeconds]);

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
    let record: any = { id: `res_${Date.now()}`, fileName: file.name, fileSizeFormatted: `${Math.round(file.size / 1024)} KB` };
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      try {
        record = await resumeService.uploadResume(file);
      } catch (err) {
        console.warn('Storage upload error, continuing with client extraction:', err);
      }
    }

    const fileText = await resumeService.extractTextFromFile(file);
    let fileBase64: string | undefined;
    try {
      fileBase64 = await resumeService.extractFileBase64(file);
    } catch (_) {}

    const profile = await aiService.extractResumeProfile(file.name, fileText, fileBase64);

    updateSetupDraft({
      resumeId: record.id,
      resumeName: record.fileName || file.name,
      resumeFileSize: record.fileSizeFormatted,
      resumeParsed: true,
      candidateProfile: profile,
      matchAnalysis: null, // Invalidate stale cached match analysis
      tailoredQuestions: [], // Invalidate stale cached questions
    });

    return {
      resumeId: record.id,
      fileName: record.fileName || file.name,
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
      matchAnalysis: null, // Invalidate stale cached match analysis
      tailoredQuestions: [],
    });

    return parsedJob;
  };

  const researchCompanyContext = async (
    companyName: string, 
    role: string,
    currentJobProfile?: JobProfile | null,
    currentCandidateProfile?: CandidateProfile | null
  ): Promise<CompanyResearchData> => {
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
    const effectiveCandidate = currentCandidateProfile || setupDraft.candidateProfile;
    const effectiveJob = currentJobProfile || setupDraft.jobProfile;

    // Automatically compute fresh Match Analysis if candidate and job exist
    if (effectiveCandidate && effectiveJob) {
      const match = await aiService.computeMatchAnalysis(
        effectiveCandidate,
        effectiveJob,
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

  const prepareTailoredInterview = async (
    overrideCandidate?: CandidateProfile | null,
    overrideJob?: JobProfile | null,
    overrideCompany?: CompanyResearchData | null
  ): Promise<Question[]> => {
    const candidate = overrideCandidate || setupDraft.candidateProfile || (await aiService.extractResumeProfile(setupDraft.resumeName || 'Resume.pdf'));
    const job = overrideJob || setupDraft.jobProfile || (await aiService.analyzeJobDescription(setupDraft.jobTitle || 'Role', setupDraft.company || 'Company', setupDraft.jobDescriptionText));
    const company = overrideCompany || setupDraft.companyResearch;
    
    // Always compute fresh match analysis for current candidate + job
    const match = await aiService.computeMatchAnalysis(candidate, job, company);

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
      candidateProfile: candidate,
      jobProfile: job,
      companyResearch: company,
      tailoredQuestions: questions,
      matchAnalysis: match,
    });

    return questions;
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setTimerSeconds(0);
    setRemainingSeconds((activeSession.durationMinutes || 20) * 60);
  };

  const createInterviewFromDraft = async (mode: InterviewMode = 'text'): Promise<InterviewSession> => {
    const questionsToUse = setupDraft.tailoredQuestions && setupDraft.tailoredQuestions.length > 0
      ? setupDraft.tailoredQuestions
      : await prepareTailoredInterview();

    const durationSecs = (setupDraft.durationMinutes || 20) * 60;
    setRemainingSeconds(durationSecs);
    setTimerSeconds(0);
    setIsTimerRunning(true);

    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const session = await interviewService.createInterview({
        userId: user.id,
        jobTitle: setupDraft.jobTitle,
        company: setupDraft.company,
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        interviewStyle: setupDraft.interviewStyle,
        mode,
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
      setEngineState('starting');

      if (mode === 'voice') {
        setTimeout(() => startVoiceSession(), 500);
      }

      return session;
    } else {
      const fallbackSession: InterviewSession = {
        ...createEmptySession(),
        id: `sess_${Date.now()}`,
        mode,
        voiceStatus: mode === 'voice' ? 'connecting' : 'idle',
        jobTitle: setupDraft.jobTitle || 'Target Role',
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
      setEngineState('starting');

      if (mode === 'voice') {
        setTimeout(() => startVoiceSession(), 500);
      }

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

  // Update conversation state tracking when question changes
  useEffect(() => {
    if (activeQuestion) {
      conversationStateRef.current.currentQuestionId = activeQuestion.id;
      conversationStateRef.current.currentQuestionText = activeQuestion.text;
    }
  }, [activeQuestion]);

  // Voice Mode: Start Real-Time Conversational Voice Session
  const startVoiceSession = async () => {
    const provider = voiceManager.getVoiceProvider();
    setVoiceStatus('connecting');

    try {
      let config: any = null;
      try {
        if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !activeSession.id.startsWith('sess_')) {
          config = await voiceManager.createVoiceSession(activeSession.id);
        }
      } catch (voiceErr) {
        console.warn('Remote voice session creation returned warning, using client fallback config:', voiceErr);
      }

      if (!config) {
        config = {
          voiceSessionId: `vses_${Date.now()}`,
          interviewId: activeSession.id,
          provider: 'gemini_live' as const,
          candidateName: setupDraft.candidateProfile?.name || 'Candidate',
          targetRole: activeSession.jobTitle,
          company: activeSession.company,
          timeLimitMinutes: activeSession.durationMinutes,
        };
      }

      await provider.connect(config, {
        onStatusChange: (status) => {
          setVoiceStatus(status);
        },
        onTranscript: (text, _isFinal, isCandidate) => {
          if (isCandidate) {
            setLiveTranscript(text);
          }
        },
        onSpeechStart: (speaker) => {
          if (speaker === 'candidate') {
            setIsInterrupted(false);
            setEngineState('listening');
          } else {
            setEngineState('asking');
          }
        },
        onSpeechEnd: async (speaker, finalTranscript) => {
          if (speaker === 'candidate' && finalTranscript && finalTranscript.trim().length > 10) {
            // Candidate finished turn -> Submit verbal response
            await submitCandidateAnswer(finalTranscript.trim(), 'voice', 60);
          }
        },
        onInterruption: () => {
          setIsInterrupted(true);
          setEngineState('listening');
        },
        onError: (err) => {
          console.warn('Voice Provider error event:', err);
          setVoiceStatus('idle');
        },
      });

      setVoiceStatus('connected');
      setActiveSession((prev) => ({ ...prev, mode: 'voice', voiceStatus: 'connected' }));

      // AI speaks the first question aloud
      if (activeQuestion) {
        setEngineState('asking');
        const introRemark = await aiService.generateInterviewerRemark({
          action: activeSession.currentQuestionIndex === 0 ? 'intro' : 'ask_question',
          candidateName: setupDraft.candidateProfile?.name || 'Candidate',
          role: activeSession.jobTitle,
          company: activeSession.company,
          style: activeSession.interviewStyle,
          question: activeQuestion,
        });

        setInterviewerSpokenText(introRemark);
        await provider.speak(introRemark);
        await provider.startListening();
        setEngineState('listening');
      }
    } catch (err: any) {
      console.warn('Voice session fallback handled:', err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceSession = async () => {
    const provider = voiceManager.getVoiceProvider();
    await provider.disconnect();
    setVoiceStatus('idle');
  };

  const switchToTextMode = async () => {
    await stopVoiceSession();
    setActiveSession((prev) => ({ ...prev, mode: 'text', voiceStatus: 'idle' }));
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      await interviewService.updateSessionProgress(
        user.id,
        activeSession.id,
        activeSession.currentQuestionIndex,
        activeSession.status,
        remainingSeconds,
        'text',
        'idle'
      );
    }
  };

  const triggerBargeIn = () => {
    const provider = voiceManager.getVoiceProvider();
    provider.stopAudio();
    setIsInterrupted(true);
  };

  /**
   * Submits a candidate answer, executes real AI evaluation, and manages follow-up decisions.
   */
  const submitCandidateAnswer = async (
    answerText: string, 
    inputMode: 'text' | 'voice', 
    durationSecs: number
  ): Promise<QuestionFeedback> => {
    setIsEvaluating(true);
    setEngineState('processing');

    try {
      let answerId = `ans_${Date.now()}`;
      if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !activeSession.id.startsWith('sess_')) {
        const res = await interviewService.submitAnswer(
          user.id,
          activeSession.id,
          activeQuestion.id,
          answerText,
          inputMode,
          durationSecs,
          inputMode === 'voice' ? answerText : undefined
        );
        answerId = res.answerId;
      }

      // 1. Layer 1 & 2: Real AI Evaluation & Follow-up Trigger Analysis
      let feedbackResult: QuestionFeedback & { followUpNeeded?: boolean; followUpTriggerReason?: string; followUpTopic?: string };

      if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_')) {
        feedbackResult = await evaluationService.evaluateAndSaveAnswer({
          userId: user.id,
          interviewId: activeSession.id,
          answerId,
          question: activeQuestion,
          answerText,
          role: activeSession.jobTitle,
          company: activeSession.company,
          difficulty: activeSession.difficulty,
          remainingMinutes: Math.round(remainingSeconds / 60),
        });
      } else {
        feedbackResult = await aiService.evaluateAnswer({
          question: activeQuestion,
          answerText,
          role: activeSession.jobTitle,
          company: activeSession.company,
          difficulty: activeSession.difficulty,
          remainingMinutes: Math.round(remainingSeconds / 60),
        });
      }

      setLatestFeedback(feedbackResult);

      // Record Turn in Rolling History
      const turn: ConversationTurn = {
        role: 'candidate',
        text: answerText,
        timestamp: new Date().toISOString(),
        questionId: activeQuestion.id,
        isFollowUp: activeQuestion.type === 'follow_up',
      };
      conversationStateRef.current.recentTurns.push(turn);
      conversationStateRef.current.conversationSummary += `\nCandidate on Q (${activeQuestion.category}): ${answerText.slice(0, 140)}...`;

      // 2. Adaptive Follow-up Decision Loop
      const canTriggerFollowUp = 
        feedbackResult.followUpNeeded &&
        activeQuestion.type === 'initial' &&
        conversationStateRef.current.followUpsUsed < 2 &&
        remainingSeconds > 180;

      if (canTriggerFollowUp) {
        setEngineState('follow_up');
        conversationStateRef.current.followUpsUsed += 1;

        try {
          const followUpQ = await aiService.generateAdaptiveFollowUp({
            parentQuestion: activeQuestion,
            candidateAnswer: answerText,
            triggerReason: feedbackResult.followUpTriggerReason || 'Probe missing metric evidence or architecture trade-off.',
            role: activeSession.jobTitle,
            company: activeSession.company,
            difficulty: activeSession.difficulty,
            order: activeSession.currentQuestionIndex + 2,
          });

          // Insert into session & DB questions
          let savedFollowUp = followUpQ;
          if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_')) {
            savedFollowUp = await interviewService.insertAdaptiveQuestion(
              activeSession.id,
              followUpQ,
              activeSession.currentQuestionIndex + 2
            );
          }

          const updatedQuestions = [...activeSession.questions];
          updatedQuestions.splice(activeSession.currentQuestionIndex + 1, 0, savedFollowUp);

          const updatedSession: InterviewSession = {
            ...activeSession,
            questions: updatedQuestions,
            answers: {
              ...activeSession.answers,
              [activeQuestion.id]: {
                questionId: activeQuestion.id,
                answerText,
                inputMode,
                durationSeconds: durationSecs,
                submittedAt: new Date().toISOString(),
                transcript: inputMode === 'voice' ? answerText : undefined,
              },
            },
            feedbacks: {
              ...activeSession.feedbacks,
              [activeQuestion.id]: feedbackResult,
            },
          };

          setActiveSession(updatedSession);
          storage.set('current_session', updatedSession);

          // If in Voice Mode, speak the follow-up prompt aloud
          if (activeSession.mode === 'voice') {
            const provider = voiceManager.getVoiceProvider();
            setEngineState('asking');
            setInterviewerSpokenText(savedFollowUp.text);
            await provider.speak(savedFollowUp.text);
            await provider.startListening();
            setEngineState('listening');
          }

          return feedbackResult;
        } catch (followUpErr) {
          console.warn('Failed to inject adaptive follow-up, continuing normal flow:', followUpErr);
        }
      }

      // Normal session state update without immediate follow-up
      const updatedSession: InterviewSession = {
        ...activeSession,
        answers: {
          ...activeSession.answers,
          [activeQuestion.id]: {
            questionId: activeQuestion.id,
            answerText,
            inputMode,
            durationSeconds: durationSecs,
            submittedAt: new Date().toISOString(),
            transcript: inputMode === 'voice' ? answerText : undefined,
          },
        },
        feedbacks: {
          ...activeSession.feedbacks,
          [activeQuestion.id]: feedbackResult,
        },
      };
      setActiveSession(updatedSession);
      storage.set('current_session', updatedSession);

      return feedbackResult;
    } finally {
      setIsEvaluating(false);
    }
  };

  const advanceToNextQuestion = async (): Promise<boolean> => {
    setIsPreparingNextQuestion(true);
    try {
      const nextIndex = activeSession.currentQuestionIndex + 1;
      
      if (nextIndex < activeSession.questions.length && remainingSeconds > 60) {
        const nextQ = activeSession.questions[nextIndex];
        const updatedSession = {
          ...activeSession,
          currentQuestionIndex: nextIndex,
          currentQuestionId: nextQ?.id || null,
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);
        setLiveTranscript('');

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          await interviewService.updateSessionProgress(user.id, activeSession.id, nextIndex, 'in_progress', remainingSeconds);
        }

        // Voice Mode: Speak the next question aloud
        if (activeSession.mode === 'voice') {
          const provider = voiceManager.getVoiceProvider();
          setEngineState('asking');
          const bridgeRemark = await aiService.generateInterviewerRemark({
            action: 'transition',
            candidateName: setupDraft.candidateProfile?.name || 'Candidate',
            role: activeSession.jobTitle,
            company: activeSession.company,
            style: activeSession.interviewStyle,
            question: nextQ,
            conversationSummary: conversationStateRef.current.conversationSummary,
          });

          setInterviewerSpokenText(bridgeRemark);
          await provider.speak(bridgeRemark);
          await provider.startListening();
          setEngineState('listening');
        }

        return true;
      } else {
        // Complete interview session
        setEngineState('completing');
        const updatedSession = {
          ...activeSession,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          await interviewService.updateSessionProgress(user.id, activeSession.id, nextIndex, 'completed', 0);
        }

        // Voice Mode: Deliver closing spoken remark
        if (activeSession.mode === 'voice') {
          const provider = voiceManager.getVoiceProvider();
          const closing = await aiService.generateInterviewerRemark({
            action: 'closing',
            candidateName: setupDraft.candidateProfile?.name || 'Candidate',
            role: activeSession.jobTitle,
            company: activeSession.company,
          });
          setInterviewerSpokenText(closing);
          await provider.speak(closing);
          await provider.disconnect();
        }

        setEngineState('completed');
        return false;
      }
    } finally {
      setIsPreparingNextQuestion(false);
    }
  };

  const getReport = async (sessionId?: string): Promise<FinalReport> => {
    const targetSessionId = sessionId || activeSession.id;
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !targetSessionId.startsWith('sess_acme')) {
      try {
        const report = await evaluationService.generateAndSaveFinalReport(user.id, targetSessionId);
        setFinalReport(report);
        return report;
      } catch (err) {
        console.warn('generateAndSaveFinalReport encountered issue, falling back to direct report synthesis:', err);
      }
    }

    const report = await aiService.generateFinalReport({
      interviewId: targetSessionId,
      role: activeSession.jobTitle,
      company: activeSession.company,
      questions: activeSession.questions,
      answers: activeSession.answers,
      evaluations: Object.values(activeSession.feedbacks || {}),
    });

    setFinalReport(report);
    return report;
  };

  const terminateActiveSession = async () => {
    setActiveSession((prev) => {
      const updated: InterviewSession = { ...prev, status: 'failed' };
      storage.set('current_session', updated);
      return updated;
    });
    setIsTimerRunning(false);

    if (activeSession.mode === 'voice') {
      await stopVoiceSession();
    }

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
        engineState,
        voiceStatus,
        liveTranscript,
        interviewerSpokenText,
        latestFeedback,
        finalReport,
        isEvaluating,
        isPreparingNextQuestion,
        isInterrupted,
        timerSeconds,
        remainingSeconds,
        isTimerRunning,
        startTimer,
        pauseTimer,
        resetTimer,
        loadSession,
        startVoiceSession,
        stopVoiceSession,
        switchToTextMode,
        submitCandidateAnswer,
        advanceToNextQuestion,
        getReport,
        terminateActiveSession,
        triggerBargeIn,
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

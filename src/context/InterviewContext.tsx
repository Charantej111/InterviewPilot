import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  ActiveInterviewTurn,
} from '../types/interview';
import { CandidateProfile, CandidateEvidenceModel, LockedCandidateContext } from '../types/resume';
import { JobProfile, JDEvidenceModel } from '../types/jobDescription';
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
import { interviewBrain } from '../services/ai/interviewBrain';
import { buildInterviewContract } from '../services/ai/interviewContract';
import { initializeCompetencyMap, updateCompetencyState } from '../services/ai/competencyMap';
import { shouldCompleteInterview } from '../services/ai/interviewLifecycle';
import { storage } from '../lib/storage';


export interface ExtractionDebugSnapshot {
  rawText: string;
  normalizedText: string;
  sections: import('../types/resume').ExtractedSection[];
  lineBlocks: import('../types/resume').LineBlock[];
  detectedSemanticBlocks?: import('../types/resume').ResumeSemanticBlock[];
  detectedProjects: import('../types/resume').ExtractedProjectBlock[];
  detectedExperience?: import('../types/resume').ExtractedExperienceBlock[];
  detectedEducation: import('../types/resume').ExtractedEducationBlock[];
  detectedAchievements?: import('../types/resume').ExtractedAchievementBlock[];
  rawGeminiOutput?: any;
  validatedEvidence: import('../types/resume').CandidateEvidenceModel;
  rejectedEvidence: { value: string; reason: string; section?: string }[];
  derivedProfile: CandidateProfile;
  characterCount: number;
  pageCount?: number;
}

export interface SetupDraft {
  resumeId?: string;
  resumeName: string;
  resumeFileSize: string;
  resumeParsed: boolean;
  resumeConfirmed: boolean;
  jobDescriptionProvided: boolean;
  companyResearchAvailable: boolean;
  matchAvailable: boolean;
  interviewContractAvailable: boolean;
  interviewMode: 'resume_grounded' | 'jd_matched';
  matchState: import('../types/matchAnalysis').MatchStateModel;
  candidateProfile: CandidateProfile | null;
  // Evidence pipeline (new — supercedes candidateProfile as source of truth)
  candidateEvidenceModel: CandidateEvidenceModel | null;
  lockedCandidateContext: LockedCandidateContext | null;
  extractionDebugSnapshot?: ExtractionDebugSnapshot | null;
  jobDescriptionId?: string;
  jobTitle: string;
  company: string;
  jobDescriptionText: string;
  jobProfile: JobProfile | null;
  jdEvidenceModel: JDEvidenceModel | null;
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
  confirmCandidateProfile: (confirmedModel: CandidateEvidenceModel) => Promise<void>;
  analyzeJobDescription: (title: string, company: string, rawText: string) => Promise<JobProfile | null>;
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
  isInterrupted: boolean;
  
  // Time Management
  timerSeconds: number;
  remainingSeconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  setFinalReport: (report: FinalReport | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  startVoiceSession: () => Promise<void>;
  stopVoiceSession: () => Promise<void>;
  switchToTextMode: () => Promise<void>;
  submitCurrentTurn: (answerText: string, inputMode: 'text' | 'voice', durationSecs: number) => Promise<{ status: InterviewSession['status']; feedback?: QuestionFeedback }>;
  completeInterviewSession: (finalAnswer?: {
    questionId: string;
    answerText: string;
    inputMode: 'text' | 'voice';
    durationSeconds: number;
  }) => Promise<{ status: InterviewSession['status']; report?: FinalReport }>;
  getReport: (sessionId?: string) => Promise<FinalReport>;
  terminateActiveSession: (reason?: string) => Promise<void>;
  triggerBargeIn: () => void;
}

const defaultSetupDraft: SetupDraft = {
  resumeName: '',
  resumeFileSize: '',
  resumeParsed: false,
  resumeConfirmed: false,
  jobDescriptionProvided: false,
  companyResearchAvailable: false,
  matchAvailable: false,
  interviewContractAvailable: false,
  interviewMode: 'resume_grounded',
  matchState: {
    status: 'not_ready',
    overallMatchPercent: null,
    requirementMatches: [],
    reason: 'JOB_DESCRIPTION_REQUIRED',
    matchAssessment: null,
  },
  candidateProfile: null,
  candidateEvidenceModel: null,
  lockedCandidateContext: null,
  jobTitle: '',
  company: '',
  jobDescriptionText: '',
  jobProfile: null,
  jdEvidenceModel: null,
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

  const consecutiveScoresRef = useRef<number[]>([]);
  const inFlightSubmissionsRef = useRef<Record<string, Promise<any> | undefined>>({});

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
    const emptySession = createEmptySession();
    setActiveSession(emptySession);
    storage.set('current_session', emptySession);
    setFinalReport(null);
    storage.remove('final_report');
    setRemainingSeconds(20 * 60);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const uploadResumeFile = async (file: File) => {
    const extractionId = `ext_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Immediately isolate and purge all previous candidate and JD extraction data
    updateSetupDraft({
      resumeId: extractionId,
      resumeName: file.name,
      resumeFileSize: `${Math.round(file.size / 1024)} KB`,
      resumeParsed: false,
      resumeConfirmed: false,
      jobDescriptionProvided: false,
      companyResearchAvailable: false,
      matchAvailable: false,
      interviewContractAvailable: false,
      interviewMode: 'resume_grounded',
      matchState: {
        status: 'not_ready',
        overallMatchPercent: null,
        requirementMatches: [],
        reason: 'JOB_DESCRIPTION_REQUIRED',
        matchAssessment: null,
      },
      candidateProfile: null as any,
      candidateEvidenceModel: null as any,
      lockedCandidateContext: null,
      jobDescriptionId: undefined,
      jobTitle: '',
      company: '',
      jobDescriptionText: '',
      jobProfile: null,
      jdEvidenceModel: null,
      companyResearch: null,
      matchAnalysis: null,
      tailoredQuestions: [],
    });

    let record: any = { id: extractionId, fileName: file.name, fileSizeFormatted: `${Math.round(file.size / 1024)} KB` };
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      try {
        record = await resumeService.uploadResume(file);
      } catch (err) {
        console.warn('Storage upload error, continuing with client extraction:', err);
      }
    }

    // Run the evidence pipeline (normalize → section detect → project/education segment → classify gate → Gemini / deterministic validator)
    const extractionRes = await aiService.extractResumeEvidence(file);
    const evidenceModel = extractionRes.evidenceModel;
    const derivedProfile = resumeService.deriveProfileFromEvidence(evidenceModel);

    const debugSnapshot: ExtractionDebugSnapshot = {
      rawText: extractionRes.extractedDoc?.rawText || '',
      normalizedText: extractionRes.extractedDoc?.normalizedText || '',
      sections: extractionRes.extractedDoc?.sections || [],
      lineBlocks: extractionRes.extractedDoc?.lineBlocks || [],
      detectedSemanticBlocks: extractionRes.extractedDoc?.detectedSemanticBlocks || [],
      detectedProjects: extractionRes.extractedDoc?.detectedProjects || [],
      detectedExperience: extractionRes.extractedDoc?.detectedExperience || [],
      detectedEducation: extractionRes.extractedDoc?.detectedEducation || [],
      detectedAchievements: extractionRes.extractedDoc?.detectedAchievements || [],
      rawGeminiOutput: (extractionRes as any).rawGeminiOutput,
      validatedEvidence: evidenceModel,
      rejectedEvidence: extractionRes.validationResult?.rejectedItems || [],
      derivedProfile,
      characterCount: extractionRes.extractedDoc?.characterCount || 0,
      pageCount: extractionRes.extractedDoc?.pageCount || 1,
    };

    updateSetupDraft({
      resumeId: record.id || extractionId,
      resumeName: record.fileName || file.name,
      resumeFileSize: record.fileSizeFormatted || `${Math.round(file.size / 1024)} KB`,
      resumeParsed: true,
      candidateProfile: derivedProfile,
      candidateEvidenceModel: evidenceModel,
      lockedCandidateContext: null,   // not locked until candidate confirms
      extractionDebugSnapshot: debugSnapshot,
      matchAnalysis: null,
      tailoredQuestions: [],
    });

    return {
      resumeId: record.id || extractionId,
      fileName: record.fileName || file.name,
      fileSize: record.fileSizeFormatted,
      profile: derivedProfile,
    };
  };

  /**
   * Called when candidate presses "Confirm Profile & Continue" on ResumeIntelligencePage.
   * Creates an immutable LockedCandidateContext snapshot.
   * AI cannot add claims not present in this snapshot.
   */
  const confirmCandidateProfile = async (confirmedModel: CandidateEvidenceModel): Promise<void> => {
    const derivedProfile = resumeService.deriveProfileFromEvidence(confirmedModel);
    const locked: LockedCandidateContext = {
      sessionId: setupDraft.resumeId || `ses_${Date.now()}`,
      lockedAt: new Date().toISOString(),
      evidenceModel: confirmedModel,
      derivedProfile,
    };

    const hasJD = Boolean(
      setupDraft.jdEvidenceModel &&
      (setupDraft.jdEvidenceModel.requiredSkills?.length ||
        setupDraft.jdEvidenceModel.technicalRequirements?.length ||
        setupDraft.jdEvidenceModel.responsibilities?.length)
    );

    let matchAnalysis: MatchAnalysisResult | null = null;
    let matchState: import('../types/matchAnalysis').MatchStateModel = {
      status: 'not_ready',
      overallMatchPercent: null,
      requirementMatches: [],
      reason: 'JOB_DESCRIPTION_REQUIRED',
      matchAssessment: null,
    };

    if (hasJD && setupDraft.jdEvidenceModel) {
      try {
        const { computeMatchAssessment, buildLegacyMatchResult, computeMatchState } = await import('../services/ai/matchEngine');
        const { computeJDHash } = await import('../services/ai/jdValidator');
        const jdHash = computeJDHash(setupDraft.jobDescriptionText, setupDraft.jobTitle, setupDraft.company);
        const assessment = computeMatchAssessment(locked, setupDraft.jdEvidenceModel, jdHash);
        if (assessment) {
          matchAnalysis = buildLegacyMatchResult(assessment);
          matchState = computeMatchState(locked, setupDraft.jdEvidenceModel, locked.sessionId, jdHash);
        }
      } catch (err) {
        console.warn('Match computation failed on confirmation:', err);
      }
    }

    updateSetupDraft({
      candidateEvidenceModel: confirmedModel,
      candidateProfile: derivedProfile,
      lockedCandidateContext: locked,
      resumeConfirmed: true,
      jobDescriptionProvided: hasJD,
      matchAvailable: Boolean(matchAnalysis),
      interviewMode: hasJD ? 'jd_matched' : 'resume_grounded',
      matchAnalysis,
      matchState,
      tailoredQuestions: [], // Strictly no pre-generated questions in preview
    });
  };

  const analyzeJobDescription = async (title: string, company: string, rawText: string): Promise<JobProfile | null> => {
    const cleanText = (rawText || '').trim();
    if (!cleanText) {
      updateSetupDraft({
        jobTitle: title || '',
        company: company || '',
        jobDescriptionText: '',
        jobDescriptionId: undefined,
        jobProfile: null,
        jdEvidenceModel: null,
        jobDescriptionProvided: false,
        matchAvailable: false,
        interviewMode: 'resume_grounded',
        matchAnalysis: null,
        matchState: {
          status: 'not_ready',
          overallMatchPercent: null,
          requirementMatches: [],
          reason: 'JOB_DESCRIPTION_REQUIRED',
          matchAssessment: null,
        },
        tailoredQuestions: [],
      });
      return null;
    }

    const parsedJob = await aiService.analyzeJobDescription(title, company, cleanText);
    const evidenceModel = (parsedJob as any).__jdEvidenceModel ?? null;
    if ((parsedJob as any).__jdEvidenceModel) delete (parsedJob as any).__jdEvidenceModel;

    let savedId = setupDraft.jobDescriptionId;
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      try {
        const jdRecord = await jobDescriptionService.saveJobDescription({
          id: setupDraft.jobDescriptionId,
          title,
          company,
          rawDescription: cleanText,
          parsedRequirements: parsedJob,
        });
        savedId = jdRecord.id;
      } catch (err) {
        console.error('Error saving JD to Supabase:', err);
      }
    }

    let matchAnalysis: MatchAnalysisResult | null = null;
    let matchState: import('../types/matchAnalysis').MatchStateModel = {
      status: 'not_ready',
      overallMatchPercent: null,
      requirementMatches: [],
      reason: 'JOB_DESCRIPTION_REQUIRED',
      matchAssessment: null,
    };

    if (setupDraft.lockedCandidateContext && evidenceModel) {
      try {
        const { computeMatchAssessment, buildLegacyMatchResult, computeMatchState } = await import('../services/ai/matchEngine');
        const { computeJDHash } = await import('../services/ai/jdValidator');
        const jdHash = computeJDHash(cleanText, title, company);
        const assessment = computeMatchAssessment(setupDraft.lockedCandidateContext, evidenceModel, jdHash);
        if (assessment) {
          matchAnalysis = buildLegacyMatchResult(assessment);
          matchState = computeMatchState(setupDraft.lockedCandidateContext, evidenceModel, setupDraft.lockedCandidateContext.sessionId, jdHash);
        }
      } catch (err) {
        console.warn('Match computation error in analyzeJobDescription:', err);
      }
    }

    updateSetupDraft({
      jobTitle: title,
      company,
      jobDescriptionText: cleanText,
      jobDescriptionId: savedId,
      jobProfile: parsedJob,
      jdEvidenceModel: evidenceModel,
      jobDescriptionProvided: true,
      matchAvailable: Boolean(matchAnalysis),
      interviewMode: 'jd_matched',
      matchAnalysis,
      matchState,
      tailoredQuestions: [],
    });

    return parsedJob;
  };


  const researchCompanyContext = async (
    companyName: string, 
    role: string
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
    updateSetupDraft({
      companyResearch: finalResearch,
      companyResearchId: finalResearch.id,
      companyResearchAvailable: true,
    });

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
    // Before Start Interview, questions MUST be empty!
    // The preview and setup must remain completely opaque.
    updateSetupDraft({
      tailoredQuestions: [],
    });
    return [];
  };


  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setTimerSeconds(0);
    setRemainingSeconds((activeSession.durationMinutes || 20) * 60);
  };

  const createInterviewFromDraft = async (mode: InterviewMode = 'text'): Promise<InterviewSession> => {
    const isJdProvided = Boolean(
      setupDraft.jobDescriptionProvided &&
      setupDraft.jdEvidenceModel &&
      (setupDraft.jdEvidenceModel.requiredSkills?.length ||
        setupDraft.jdEvidenceModel.technicalRequirements?.length ||
        setupDraft.jdEvidenceModel.responsibilities?.length)
    );

    const sessionId = (isAuthenticated && user?.id && !user.id.startsWith('mock_')) ? `sess_${Date.now()}` : `sess_${Date.now()}`;
    const durationSecs = (setupDraft.durationMinutes || 20) * 60;

    // 1. Build Deterministic Contract
    const contract = buildInterviewContract(
      sessionId,
      durationSecs,
      setupDraft.lockedCandidateContext,
      isJdProvided ? setupDraft.jdEvidenceModel : null,
      isJdProvided ? setupDraft.matchAnalysis?.matchAssessment : null
    );

    // 2. Initialize Competency Map
    const initialCompetencyMap = initializeCompetencyMap(
      contract,
      setupDraft.lockedCandidateContext,
      isJdProvided ? setupDraft.jdEvidenceModel : null
    );

    // 3. Select Opening Objective
    const openingObjective = interviewBrain.selectOpeningObjective(
      contract,
      setupDraft.lockedCandidateContext,
      isJdProvided ? setupDraft.jdEvidenceModel : null,
      isJdProvided ? setupDraft.matchAnalysis?.matchAssessment : null
    );

    // 4. Generate Question #1 strictly (Zero Question #2 pre-generated)
    let openingQ: Question;
    if (setupDraft.lockedCandidateContext) {
      openingQ = await aiService.generateOpeningQuestion({
        objective: openingObjective,
        lockedContext: setupDraft.lockedCandidateContext,
        role: setupDraft.jobTitle || 'Target Role',
        companyName: setupDraft.company || 'Target Company',
        style: setupDraft.interviewStyle,
        difficulty: setupDraft.difficulty,
        existingQuestions: [],
        jdEvidenceModel: isJdProvided ? setupDraft.jdEvidenceModel : null,
      });
    } else {
      openingQ = {
        id: crypto.randomUUID(),
        order: 1,
        type: 'initial',
        questionType: 'resume_deep_dive',
        category: 'Project & Technical Execution',
        text: `Welcome! Let's start by walking through one of your core projects. Can you describe its architecture and your individual technical contribution?`,
        intent: 'Assess candidate flagship project architecture and individual contribution',
        source: 'resume',
        sourceReference: 'Core Deliverables',
        targetCompetency: 'Technical Depth',
        expectedAnswerCharacteristics: ['Clear problem statement', 'Architecture description', 'Individual ownership'],
        parentQuestionId: null,
        recommendedDurationSeconds: 180,
      };
    }

    setRemainingSeconds(durationSecs);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    consecutiveScoresRef.current = [];

    const questionsToUse = [openingQ];

    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      const session = await interviewService.createInterview({
        userId: user.id,
        jobTitle: setupDraft.jobTitle || 'Target Role',
        company: setupDraft.company || 'Target Company',
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        interviewStyle: setupDraft.interviewStyle,
        mode,
        jobDescriptionText: isJdProvided ? setupDraft.jobDescriptionText : '',
        resumeName: setupDraft.resumeName || 'Candidate_Resume.pdf',
        resumeId: setupDraft.resumeId,
        jobDescriptionId: setupDraft.jobDescriptionId,
        companyResearchId: setupDraft.companyResearchId,
        focusAreas: setupDraft.focusAreas,
        matchAnalysis: isJdProvided ? (setupDraft.matchAnalysis as unknown as Record<string, unknown>) : null as any,
        questions: questionsToUse,
      });

      const firstQ = (session.questions && session.questions.length > 0) ? session.questions[0] : questionsToUse[0];
      const initialTurn: ActiveInterviewTurn = {
        turnId: `turn_${Date.now()}_0`,
        questionId: firstQ.id,
        sequenceNumber: 1,
        questionText: firstQ.text,
        status: mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
        submissionStarted: false,
        submissionCompleted: false,
        createdAt: new Date().toISOString(),
      };

      const enrichedSession: InterviewSession = {
        ...session,
        currentQuestionId: firstQ.id,
        interviewContract: contract,
        competencyMap: initialCompetencyMap,
        currentObjective: openingObjective,
        sessionStatus: 'active',
        turnState: mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
        activeTurnId: initialTurn.turnId,
        activeTurn: initialTurn,
      };

      setActiveSession(enrichedSession);
      storage.set('current_session', enrichedSession);
      setEngineState('starting');

      if (mode === 'voice') {
        setTimeout(() => startVoiceSession(), 500);
      }

      return enrichedSession;
    } else {
      const firstQ = questionsToUse[0];
      const initialTurn: ActiveInterviewTurn = {
        turnId: `turn_${Date.now()}_0`,
        questionId: firstQ.id,
        sequenceNumber: 1,
        questionText: firstQ.text,
        status: mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
        submissionStarted: false,
        submissionCompleted: false,
        createdAt: new Date().toISOString(),
      };

      const fallbackSession: InterviewSession = {
        ...createEmptySession(),
        id: sessionId,
        jobTitle: setupDraft.jobTitle || 'Target Role',
        company: setupDraft.company || 'Target Company',
        interviewType: setupDraft.interviewType,
        difficulty: setupDraft.difficulty,
        durationMinutes: setupDraft.durationMinutes,
        interviewStyle: setupDraft.interviewStyle,
        mode,
        questions: questionsToUse,
        currentQuestionId: firstQ.id,
        status: 'in_progress',
        sessionStatus: 'active',
        turnState: mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
        interviewContract: contract,
        competencyMap: initialCompetencyMap,
        currentObjective: openingObjective,
        activeTurnId: initialTurn.turnId,
        activeTurn: initialTurn,
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
    let loaded: InterviewSession | null = null;
    if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
      try {
        loaded = await interviewService.getSessionById(user.id, sessionId);
      } catch (err) {
        console.error('Error loading session from Supabase:', err);
      }
    }
    if (!loaded) {
      const saved = storage.get<InterviewSession | null>('current_session', null);
      if (saved && saved.id === sessionId) {
        loaded = saved;
      }
    }

    if (loaded) {
      // Restore or lazily initialize ActiveInterviewTurn
      let activeTurn = loaded.activeTurn;
      const currentQ = loaded.questions?.[loaded.currentQuestionIndex || 0] || loaded.questions?.[0];
      
      if (!activeTurn && currentQ) {
        activeTurn = {
          turnId: loaded.activeTurnId || `turn_${Date.now()}_${loaded.currentQuestionIndex || 0}`,
          questionId: currentQ.id,
          sequenceNumber: (loaded.currentQuestionIndex || 0) + 1,
          questionText: currentQ.text,
          status: loaded.mode === 'voice' ? 'candidate_listening' : 'candidate_listening',
          submissionStarted: false,
          submissionCompleted: false,
          createdAt: new Date().toISOString(),
        };
      }

      const currentTurn = activeTurn;
      if (currentTurn && loaded.questions) {
        const questionExists = loaded.questions.some(q => q.id === currentTurn.questionId);
        if (!questionExists && currentQ) {
          console.warn('[SessionRestoration] Active turn question not found in database questions, recovering safely.');
          activeTurn = {
            ...currentTurn,
            questionId: currentQ.id,
            questionText: currentQ.text,
            sequenceNumber: (loaded.currentQuestionIndex || 0) + 1,
          };
        }
      }

      loaded.activeTurn = activeTurn;
      if (activeTurn) {
        loaded.activeTurnId = activeTurn.turnId;
      }

      setActiveSession(loaded);
      storage.set('current_session', loaded);

      if (loaded.status === 'in_progress') {
        const elapsedSeconds = loaded.createdAt ? (Date.now() - new Date(loaded.createdAt).getTime()) / 1000 : 0;
        const totalDuration = (loaded.durationMinutes || 20) * 60;
        const derivedRemaining = Math.max(0, Math.round(totalDuration - elapsedSeconds));
        const finalRemaining = loaded.remainingTime !== undefined ? Math.min(loaded.remainingTime, derivedRemaining) : derivedRemaining;
        setRemainingSeconds(finalRemaining);
        setIsTimerRunning(finalRemaining > 0);
      } else {
        setRemainingSeconds(0);
        setIsTimerRunning(false);
      }
    }
  };

  const activeQuestion: Question = 
    activeSession.questions?.find(q => q.id === activeSession.activeTurn?.questionId) ||
    activeSession.questions?.[activeSession.currentQuestionIndex] || 
    activeSession.questions?.[0] || {
      id: 'q_init',
      order: 1,
      type: 'initial',
      questionType: 'resume_deep_dive',
      source: 'resume',
      sourceReference: 'Flagship Deliverables',
      targetCompetency: 'Technical Depth',
      intent: 'Walk through flagship project deliverables',
      expectedAnswerCharacteristics: ['Clear problem statement', 'Architecture description', 'Individual ownership'],
      parentQuestionId: null,
      category: 'Technical & Architecture Depth',
      text: "Welcome! Let's start by walking through one of your flagship projects. Can you describe its technical architecture and your specific contributions?",
    };

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
          // Handled authoritatively by silence detection and manual finish answer buttons
          if (speaker === 'candidate') {
            console.log('[VoiceMode] Candidate finished utterance:', finalTranscript || '(voice audio)');
          }
        },
        onAnswerAutoCompleted: async (finalAnswer) => {
          if (finalAnswer && finalAnswer.trim().length >= 5) {
            await submitCurrentTurn(finalAnswer.trim(), 'voice', 60);
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
   * Authoritative answer submission gateway.
   * Handles idempotency, turn locks, database answer/question safety, evaluation, brain updates, and next question generation.
   */
  const submitCurrentTurn = async (
    answerText: string,
    inputMode: 'text' | 'voice',
    durationSecs: number
  ): Promise<{ status: InterviewSession['status']; feedback?: QuestionFeedback }> => {
    // 1. Determine active turn
    let turn = activeSession.activeTurn;
    if (!turn) {
      const currentQ = activeSession.questions?.[activeSession.currentQuestionIndex || 0] || activeSession.questions?.[0];
      if (!currentQ) {
        throw new Error('No active question or turn found.');
      }
      turn = {
        turnId: activeSession.activeTurnId || `turn_${Date.now()}_${activeSession.currentQuestionIndex || 0}`,
        questionId: currentQ.id,
        sequenceNumber: (activeSession.currentQuestionIndex || 0) + 1,
        questionText: currentQ.text,
        status: 'candidate_listening',
        submissionStarted: false,
        submissionCompleted: false,
        createdAt: new Date().toISOString(),
      };
    }

    const turnId = turn.turnId;

    // 2. True Idempotency: Reuse in-flight promise if one exists
    if (inFlightSubmissionsRef.current[turnId]) {
      console.log(`[Idempotency Gate] Reusing in-flight submission for turn ${turnId}`);
      return inFlightSubmissionsRef.current[turnId];
    }

    if (turn.submissionStarted || turn.status === 'evaluating') {
      console.log(`[Idempotency Gate] Turn ${turnId} already submitted or evaluating, returning current state`);
      const currentQ = activeSession.questions?.[activeSession.currentQuestionIndex];
      const feedback = currentQ ? activeSession.feedbacks?.[currentQ.id] : undefined;
      return { status: activeSession.status, feedback };
    }

    // 3. Define and execute submission promise
    const submissionPromise = (async () => {
      // Transition turn and session states to evaluating
      const updatedTurn: ActiveInterviewTurn = {
        ...turn!,
        status: 'evaluating',
        submissionStarted: true,
        answerStartedAt: turn!.answerStartedAt || new Date(Date.now() - durationSecs * 1000).toISOString(),
        answerSubmittedAt: new Date().toISOString(),
      };

      const evaluatingSession = {
        ...activeSession,
        sessionStatus: 'evaluating' as const,
        turnState: 'evaluating' as const,
        activeTurn: updatedTurn,
      };
      setActiveSession(evaluatingSession);
      storage.set('current_session', evaluatingSession);
      setIsEvaluating(true);
      setEngineState('processing');

      try {
        let answerId = `ans_${Date.now()}`;
        
        // Assert and recover valid UUID on questionId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let targetQuestionId = updatedTurn.questionId;

        if (!uuidRegex.test(targetQuestionId)) {
          const matchingQ = activeSession.questions?.find(q => q.id === targetQuestionId) ||
            activeSession.questions?.[activeSession.currentQuestionIndex || 0] ||
            activeSession.questions?.[0];

          if (matchingQ && uuidRegex.test(matchingQ.id)) {
            console.warn(`[InterviewPersistence] Recovered valid question UUID "${matchingQ.id}" for turn "${updatedTurn.turnId}" (was "${targetQuestionId}")`);
            targetQuestionId = matchingQ.id;
            updatedTurn.questionId = matchingQ.id;
          } else if (matchingQ) {
            const newUuid = crypto.randomUUID();
            console.warn(`[InterviewPersistence] Assigned new UUID "${newUuid}" to question "${matchingQ.id}"`);
            matchingQ.id = newUuid;
            targetQuestionId = newUuid;
            updatedTurn.questionId = newUuid;
          } else {
            const newUuid = crypto.randomUUID();
            targetQuestionId = newUuid;
            updatedTurn.questionId = newUuid;
          }
        }

        if (!uuidRegex.test(targetQuestionId)) {
          throw new Error(`PersistenceContractError: Question ID "${targetQuestionId}" is not a valid UUID.`);
        }

        // Persist Answer to Database
        if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !activeSession.id.startsWith('sess_')) {
          const res = await interviewService.submitAnswer(
            user.id,
            activeSession.id,
            targetQuestionId,
            answerText,
            inputMode,
            durationSecs,
            inputMode === 'voice' ? answerText : undefined
          );
          answerId = res.answerId;
        }

        // Run Answer Evaluation
        const currentQ = activeSession.questions?.find(q => q.id === targetQuestionId) || activeSession.questions?.[activeSession.currentQuestionIndex];
        if (!currentQ) {
          throw new Error('Question data not found for evaluation');
        }

        let feedbackResult: QuestionFeedback;
        const useClientAI = import.meta.env.VITE_USE_CLIENT_AI === 'true' || !import.meta.env.VITE_SUPABASE_FUNCTIONS_DEPLOYED;

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !useClientAI) {
          feedbackResult = await evaluationService.evaluateAndSaveAnswer({
            userId: user.id,
            interviewId: activeSession.id,
            answerId,
            question: currentQ,
            answerText,
            role: activeSession.jobTitle,
            company: activeSession.company,
            difficulty: activeSession.difficulty,
            remainingMinutes: Math.round(remainingSeconds / 60),
          });
        } else {
          feedbackResult = await aiService.evaluateAnswer({
            question: currentQ,
            answerText,
            role: activeSession.jobTitle,
            company: activeSession.company,
            difficulty: activeSession.difficulty,
            remainingMinutes: Math.round(remainingSeconds / 60),
          });
        }

        setLatestFeedback(feedbackResult);

        // Update turn history
        const conversationTurn: ConversationTurn = {
          role: 'candidate',
          text: answerText,
          timestamp: new Date().toISOString(),
          questionId: currentQ.id,
          isFollowUp: currentQ.type === 'follow_up',
        };
        conversationStateRef.current.recentTurns.push(conversationTurn);
        conversationStateRef.current.conversationSummary += `\nCandidate on Q (${currentQ.category}): ${answerText.slice(0, 140)}...`;

        const updatedAnswers = {
          ...(activeSession.answers || {}),
          [updatedTurn.questionId]: {
            questionId: updatedTurn.questionId,
            answerText,
            durationSeconds: durationSecs,
            inputMode,
            submittedAt: new Date().toISOString(),
            transcript: inputMode === 'voice' ? answerText : undefined,
          }
        };

        const updatedFeedbacks = {
          ...(activeSession.feedbacks || {}),
          [updatedTurn.questionId]: feedbackResult,
        };

        let updatedCompetencyMap = activeSession.competencyMap || {};
        const isJdProvided = Boolean(
          setupDraft.jobDescriptionProvided &&
          setupDraft.jdEvidenceModel &&
          (setupDraft.jdEvidenceModel.requiredSkills?.length ||
            setupDraft.jdEvidenceModel.technicalRequirements?.length ||
            setupDraft.jdEvidenceModel.responsibilities?.length)
        );

        const contract = activeSession.interviewContract || buildInterviewContract(
          activeSession.id,
          (activeSession.durationMinutes || 20) * 60,
          setupDraft.lockedCandidateContext,
          isJdProvided ? setupDraft.jdEvidenceModel : null,
          isJdProvided ? setupDraft.matchAnalysis?.matchAssessment : null
        );

        const targetCompName = currentQ.targetCompetency || currentQ.category;
        if (targetCompName && updatedCompetencyMap[targetCompName]) {
          const updatedState = updateCompetencyState(
            updatedCompetencyMap[targetCompName],
            feedbackResult,
            activeSession.currentObjective || {} as any,
            answerText
          );
          updatedCompetencyMap = {
            ...updatedCompetencyMap,
            [targetCompName]: updatedState,
          };
        }

        const scores = [...consecutiveScoresRef.current, feedbackResult.overallScore];
        consecutiveScoresRef.current = scores;

        const currentObjective = activeSession.currentObjective;
        const closingTurnCompleted = currentObjective?.questionType === 'closing';

        const completionCheck = shouldCompleteInterview({
          remainingSeconds,
          currentObjective,
          contract,
          competencyMap: updatedCompetencyMap,
          questionsAskedCount: activeSession.questions?.length || 0,
          closingTurnCompleted
        });

        if (completionCheck.shouldComplete) {
          setEngineState('completing');
          const completedTurn: ActiveInterviewTurn = {
            ...updatedTurn,
            status: 'completed',
            submissionCompleted: true,
          };
          const completedSession: InterviewSession = {
            ...activeSession,
            status: 'completed' as const,
            sessionStatus: 'completed' as const,
            turnState: 'completed' as const,
            completedAt: new Date().toISOString(),
            completionReason: completionCheck.reason,
            competencyMap: updatedCompetencyMap,
            answers: updatedAnswers,
            feedbacks: updatedFeedbacks,
            activeTurn: completedTurn,
          };
          setActiveSession(completedSession);
          storage.set('current_session', completedSession);

          if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
            await interviewService.updateSessionProgress(user.id, activeSession.id, activeSession.currentQuestionIndex, 'completed', 0);
          }

          return { status: 'completed' as const, feedback: feedbackResult };
        }

        // Continuing: Generate next question
        setEngineState('follow_up');
        const nextIndex = activeSession.currentQuestionIndex + 1;

        const brainDecision = interviewBrain.selectNextObjective(
          contract,
          updatedCompetencyMap,
          feedbackResult,
          conversationStateRef.current.recentTurns,
          remainingSeconds,
          scores,
          setupDraft.lockedCandidateContext
        );

        const nextObjective = brainDecision.nextObjective;

        // Generate dynamic next question
        let dynamicNextQ = await aiService.generateAdaptiveQuestion({
          objective: nextObjective,
          previousQuestionText: currentQ.text,
          candidateAnswerText: answerText,
          role: activeSession.jobTitle,
          companyName: activeSession.company,
          isFollowUp: nextObjective.isFollowUp,
          style: activeSession.interviewStyle,
          existingQuestions: activeSession.questions || [],
          lockedContext: setupDraft.lockedCandidateContext,
          jdEvidenceModel: isJdProvided ? setupDraft.jdEvidenceModel : null,
        });

        // Question Persistence Contract
        if (isAuthenticated && user?.id && !user.id.startsWith('mock_') && !activeSession.id.startsWith('mock_') && !activeSession.id.startsWith('sess_')) {
          try {
            dynamicNextQ = await interviewService.insertAdaptiveQuestion(
              activeSession.id,
              dynamicNextQ,
              nextIndex + 1
            );
          } catch (dbErr) {
            console.error('Error inserting adaptive question to DB:', dbErr);
            throw new Error(`Failed to persist question: ${dbErr}`);
          }
        }

        // Assert valid UUID on persisted question ID
        if (!uuidRegex.test(dynamicNextQ.id)) {
          const fallbackUuid = crypto.randomUUID();
          console.warn(`[InterviewPersistence] Assigned fallback UUID "${fallbackUuid}" to dynamic question "${dynamicNextQ.id}"`);
          dynamicNextQ = { ...dynamicNextQ, id: fallbackUuid };
        }

        const nextSessionStatus = nextObjective.questionType === 'closing' ? 'closing' as const : 'active' as const;
        const updatedQuestions = [...(activeSession.questions || []), dynamicNextQ];

        // Create the next active turn
        const nextTurnId = `turn_${Date.now()}_${nextIndex}`;
        const nextTurn: ActiveInterviewTurn = {
          turnId: nextTurnId,
          questionId: dynamicNextQ.id,
          sequenceNumber: nextIndex + 1,
          questionText: dynamicNextQ.text,
          status: activeSession.mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
          submissionStarted: false,
          submissionCompleted: false,
          createdAt: new Date().toISOString(),
        };

        const updatedSession: InterviewSession = {
          ...activeSession,
          questions: updatedQuestions,
          currentQuestionIndex: nextIndex,
          currentQuestionId: dynamicNextQ.id,
          currentObjective: nextObjective,
          competencyMap: updatedCompetencyMap,
          interviewContract: contract,
          sessionStatus: nextSessionStatus,
          turnState: activeSession.mode === 'voice' ? 'interviewer_speaking' : 'candidate_listening',
          answers: updatedAnswers,
          feedbacks: updatedFeedbacks,
          activeTurnId: nextTurnId,
          activeTurn: nextTurn,
        };

        setActiveSession(updatedSession);
        storage.set('current_session', updatedSession);
        setLiveTranscript('');

        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          await interviewService.updateSessionProgress(user.id, activeSession.id, nextIndex, 'in_progress', remainingSeconds);
        }

        // Voice mode TTS playback
        if (activeSession.mode === 'voice') {
          const provider = voiceManager.getVoiceProvider();
          provider.stopListening();
          setEngineState('asking');

          const bridgeRemark = await aiService.generateInterviewerRemark({
            action: nextObjective.isFollowUp ? 'ask_question' : 'transition',
            candidateName: setupDraft.candidateProfile?.name || 'Candidate',
            role: activeSession.jobTitle,
            company: activeSession.company,
            style: activeSession.interviewStyle,
            question: dynamicNextQ,
            conversationSummary: conversationStateRef.current.conversationSummary,
          });

          setInterviewerSpokenText(bridgeRemark);
          await provider.speak(bridgeRemark);

          setEngineState('listening');
          const finalListeningTurn = {
            ...nextTurn,
            status: 'candidate_listening' as const,
          };
          const listeningSession = {
            ...updatedSession,
            turnState: 'candidate_listening' as const,
            activeTurn: finalListeningTurn,
          };
          setActiveSession(listeningSession);
          storage.set('current_session', listeningSession);
        }

        return { status: 'in_progress' as const, feedback: feedbackResult };
      } catch (err: any) {
        console.error('Error during submitCurrentTurn execution:', err);
        const failedTurn: ActiveInterviewTurn = {
          ...updatedTurn,
          status: 'failed',
        };
        setActiveSession((prev) => ({ ...prev, activeTurn: failedTurn }));
        setEngineState('ready');
        throw err;
      } finally {
        setIsEvaluating(false);
        delete inFlightSubmissionsRef.current[turnId];
      }
    })();

    inFlightSubmissionsRef.current[turnId] = submissionPromise;
    return submissionPromise;
  };


  const completeInterviewSession = async (finalAnswer?: {
    questionId: string;
    answerText: string;
    inputMode: 'text' | 'voice';
    durationSeconds: number;
  }): Promise<{ status: InterviewSession['status']; report?: FinalReport }> => {
    setIsTimerRunning(false);
    setRemainingSeconds(0);
    setEngineState('completing');

    const targetSessionId = activeSession.id;
    const currentUserId = user?.id || 'mock_user';

    // Optimistically update local session state immediately so UI never renders question again
    const completingSession: InterviewSession = {
      ...activeSession,
      status: 'completing',
      sessionStatus: 'completed' as const,
      turnState: 'completed' as const,
      remainingTime: 0,
      currentQuestionIndex: activeSession.questions?.length || activeSession.currentQuestionIndex,
    };
    setActiveSession(completingSession);
    storage.set('current_session', completingSession);

    if (activeSession.mode === 'voice') {
      try {
        await stopVoiceSession();
      } catch (voiceStopErr) {
        console.warn('Voice stop notice:', voiceStopErr);
      }
    }

    try {
      const result = await interviewService.completeInterview({
        userId: currentUserId,
        interviewId: targetSessionId,
        finalAnswer,
        idempotencyKey: crypto.randomUUID(),
      });

      if (result.report) {
        setFinalReport(result.report);
        const readySession: InterviewSession = {
          ...completingSession,
          status: 'report_ready',
          completedAt: new Date().toISOString(),
        };
        setActiveSession(readySession);
        storage.set('current_session', readySession);
      }

      setEngineState('completed');
      return result;
    } catch (err) {
      console.error('Error completing interview session:', err);
      const failedSession: InterviewSession = {
        ...completingSession,
        status: 'report_failed',
      };
      setActiveSession(failedSession);
      storage.set('current_session', failedSession);
      setEngineState('ready');
      return { status: 'report_failed' };
    }
  };

  const getReport = useCallback(async (sessionId?: string): Promise<FinalReport> => {
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
  }, [isAuthenticated, user?.id, activeSession.id, activeSession.jobTitle, activeSession.company, activeSession.questions, activeSession.answers, activeSession.feedbacks]);

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
        confirmCandidateProfile,
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
        setFinalReport,
        isEvaluating,
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
        submitCurrentTurn,
        completeInterviewSession,
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

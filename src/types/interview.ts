export type InterviewType = 'behavioral' | 'product_case' | 'technical' | 'mixed';
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type InterviewDuration = 10 | 15 | 20 | 30 | 45;
export type InterviewStyle = 'friendly' | 'realistic' | 'challenging';
export type InterviewMode = 'text' | 'voice';

export type VoiceStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'speaking' 
  | 'listening' 
  | 'processing' 
  | 'interrupted'
  | 'reconnecting' 
  | 'disconnected' 
  | 'error';

export type InterviewEngineState = 
  | 'preparing'
  | 'ready'
  | 'starting'
  | 'asking'
  | 'listening'
  | 'processing'
  | 'follow_up'
  | 'completing'
  | 'completed';

export interface ConversationTurn {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
  isFollowUp?: boolean;
  questionId?: string;
}

export interface InterviewConversationState {
  currentQuestionId: string;
  currentQuestionText: string;
  conversationSummary: string;
  recentTurns: ConversationTurn[];
  followUpsUsed: number;
  remainingTime: number;
}

export interface QuestionEvaluationCriteria {
  coreCompetency: string;
  lookFor: string[];
  redFlags: string[];
  rubricDimensions: ('clarity' | 'depth' | 'evidence' | 'relevance' | 'structure' | 'role_alignment')[];
}

export interface AdaptiveFollowUpTrigger {
  condition: string;
  followUpProbe: string;
}

export interface Question {
  id: string;
  order: number;
  type: 'initial' | 'follow_up';
  parentQuestionId?: string | null;
  category: string;
  text: string;
  intent?: string;
  contextExplanation?: string;
  recommendedDurationSeconds?: number;
  expectedSignals?: string[];
  redFlags?: string[];
  evaluationCriteria?: QuestionEvaluationCriteria;
  adaptiveFollowUpTriggers?: AdaptiveFollowUpTrigger[];
  expectedKeyPoints?: string[];
}

export interface CandidateAnswer {
  questionId: string;
  answerText: string;
  durationSeconds: number;
  inputMode: 'text' | 'voice';
  submittedAt: string;
  transcript?: string;
}

export interface CoachingSuggestion {
  framework: string;
  suggestion: string;
  promptToImprove: string;
  examplePhrasing?: string;
}

export interface QuestionFeedback {
  questionId: string;
  overallScore: number; // 0 - 10 calculated deterministically
  breakdown: {
    relevance: number;
    structure: number;
    clarity: number;
    depth: number;
    evidence: number;
    roleAlignment: number;
  };
  whatWorked: string[];
  whatHeldYouBack: string[];
  tryThisNextTime: CoachingSuggestion;
}

export interface InterviewSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'draft' | 'in_progress' | 'evaluating' | 'completed' | 'failed';
  mode: InterviewMode;
  voiceProvider?: string | null;
  voiceSessionId?: string | null;
  voiceStatus?: VoiceStatus;
  remainingTime?: number;
  jobTitle: string;
  company: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: InterviewDuration;
  interviewStyle?: InterviewStyle;
  focusAreas: string[];
  resumeName: string;
  resumeId?: string;
  jobDescriptionId?: string;
  companyResearchId?: string;
  resumeParsedData?: {
    candidateName: string;
    extractedRole: string;
    yearsOfExperience: number;
    keySkills: string[];
    highlightProjects: string[];
  };
  jobDescriptionText: string;
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestionId?: string | null;
  answers: Record<string, CandidateAnswer>;
  feedbacks: Record<string, QuestionFeedback>;
  finalReportId?: string;
}

export interface FinalReport {
  id: string;
  sessionId: string;
  createdAt: string;
  jobTitle: string;
  company: string;
  overallScore: number; // 0 - 10
  readinessPercentage: number;
  summary: string;
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  topStrengths: string[];
  priorityImprovements: string[];
  recommendedPractice: {
    title: string;
    description: string;
    actionableTask: string;
  }[];
  questionBreakdown: {
    questionId: string;
    questionText: string;
    category: string;
    score: number;
    userAnswer: string;
    keyCritique: string;
  }[];
}

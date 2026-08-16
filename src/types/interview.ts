export type InterviewType = 'behavioral' | 'product_case' | 'technical' | 'mixed';
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type InterviewDuration = 10 | 15 | 20 | 30 | 45;
export type InterviewStyle = 'friendly' | 'realistic' | 'challenging';

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
  sampleAnswer?: string;
  expectedKeyPoints?: string[];
}

export interface CandidateAnswer {
  questionId: string;
  answerText: string;
  durationSeconds: number;
  inputMode: 'text' | 'voice';
  submittedAt: string;
}

export interface QuestionFeedback {
  questionId: string;
  overallScore: number; // 0 - 10
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
  tryThisNextTime: {
    framework: string;
    suggestion: string;
    examplePhrasing: string;
  };
}

export interface InterviewSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'draft' | 'in_progress' | 'evaluating' | 'completed' | 'failed';
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

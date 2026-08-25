export type InterviewType = 'behavioral' | 'product_case' | 'technical' | 'mixed';
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'foundational';
export type InterviewDuration = 10 | 15 | 20 | 30 | 45;
export type InterviewStyle = 'friendly' | 'realistic' | 'challenging';
export type InterviewMode = 'text' | 'voice';

export type QuestionType = 
  | 'behavioral' 
  | 'product_sense' 
  | 'execution' 
  | 'analytical' 
  | 'technical' 
  | 'system_design' 
  | 'case' 
  | 'resume_deep_dive' 
  | 'company_specific' 
  | 'clarification'
  | 'closing';

export type QuestionSource = 
  | 'resume' 
  | 'job_description' 
  | 'company_context' 
  | 'gap_analysis' 
  | 'competency' 
  | 'follow_up';

export type AnswerabilityStatus = 
  | 'grounded_answerable' 
  | 'grounded_gap_probe' 
  | 'general_competency' 
  | 'unsupported_question';

export type AnswerClassification = 
  | 'strong' 
  | 'adequate' 
  | 'weak' 
  | 'irrelevant' 
  | 'not_answered' 
  | 'evasive' 
  | 'unprofessional' 
  | 'unsupported_claim'
  | 'partially_answered'
  | 'answered'
  | 'uncertain'
  | 'clarification_request'
  | 'repeat_request'
  | 'refusal';

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
  testedCompetencies?: Record<string, number>;
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

// ─── Phase 3: Interview Contract & Competency Map Types ────────────────────────

export interface InterviewContract {
  sessionId: string;
  mode: 'jd_matched' | 'resume_grounded';
  durationSeconds: number;
  criticalCompetencies: string[];
  optionalCompetencies: string[];
  minQuestions: number;
  maxQuestions: number;
  maxFollowUpsPerTopic: number;
  minimumEvidenceTargets: number;
  timeBudget: {
    opening: number;
    coreAssessment: number;
    gapProbing: number;
    closing: number;
  };
  createdAt: string;
}

export type AssessmentStatus =
  | 'untested'
  | 'partial'
  | 'assessed';

export type AssessmentReliability =
  | 'insufficient'
  | 'provisional'
  | 'reliable';

export interface CompetencyEvidence {
  signal: string;
  strength: 'strong' | 'moderate' | 'weak';
  sourceText: string;
}

export interface CompetencyState {
  status: AssessmentStatus;
  confidence: 'none' | 'low' | 'medium' | 'high';
  evidence: CompetencyEvidence[];
  missingSignals: string[];
  questionsAsked: number;
  followUpsUsed: number;
  assessmentReliability: AssessmentReliability;
  importance: 'critical' | 'optional';
}

export type CompetencyMap = Record<string, CompetencyState>;

export type ObjectiveType = 
  | 'verify_strength' 
  | 'probe_gap' 
  | 'test_critical_competency' 
  | 'explore_domain' 
  | 'clarify_evidence'
  | 'closing';

export interface InterviewObjective {
  id?: string;
  order?: number;
  targetCompetency: string;
  questionType: QuestionType;
  intent: string;
  useResumeGrounding: boolean;
  difficulty: 'foundational' | 'intermediate' | 'advanced' | 'beginner';
  timeAllocationSeconds: number;
  isFollowUp: boolean;
  followUpReason?: string;
  expectedSignals?: string[];
  focusRequirement?: string;
  focusEvidenceSummary?: string;
  lookForSignals?: string[];
  redFlagSignals?: string[];
  reasoning?: string;
}

export interface Question {
  id: string;
  order: number;
  type: 'initial' | 'follow_up';
  questionType: QuestionType;
  source: QuestionSource;
  sourceReference: string;
  targetCompetency: string;
  jdRequirement?: string;
  intent: string;
  expectedAnswerCharacteristics: string[];
  parentQuestionId?: string | null;
  category: string;
  text: string;
  contextExplanation?: string;
  recommendedDurationSeconds?: number;
  expectedSignals?: string[];
  redFlags?: string[];
  evaluationCriteria?: QuestionEvaluationCriteria;
  adaptiveFollowUpTriggers?: AdaptiveFollowUpTrigger[];
  expectedKeyPoints?: string[];
  answerabilityStatus?: AnswerabilityStatus;
  difficulty?: InterviewDifficulty;
}

export interface CandidateAnswer {
  questionId: string;
  answerText: string;
  durationSeconds: number;
  inputMode: 'text' | 'voice';
  submittedAt: string;
  transcript?: string;
  transcriptConfidence?: 'high' | 'medium' | 'low';
}

export interface CoachingSuggestion {
  framework: string;
  suggestion: string;
  promptToImprove: string;
  examplePhrasing?: string;
}

export interface DimensionScoreDetail {
  score: number;
  reason: string;
  evidence: string;
  missing: string;
}

export interface RelevanceGateResult {
  status: 'answered' | 'partially_answered' | 'not_answered';
  score: number; // 0 - 10
  reason: string;
}

export interface ProfessionalismResult {
  status: 'acceptable' | 'concerning' | 'poor';
  note?: string;
}

export interface CompletenessMapResult {
  requiredCharacteristics: string[];
  observedCharacteristics: string[];
  missingCharacteristics: string[];
  coverageRatio: number; // 0.0 to 1.0
}

export interface UnverifiedClaimResult {
  claim: string;
  resumeSupport: 'supported' | 'unverified_by_submitted_resume' | 'contradicted';
  note: string;
}

// ─── Phase 4: Answer Intelligence & Deterministic Scoring Types ─────────────

export type AnswerEvaluationClassification =
  | 'answered'
  | 'partially_answered'
  | 'not_answered'
  | 'irrelevant'
  | 'uncertain'
  | 'clarification_request'
  | 'repeat_request'
  | 'refusal'
  | 'strong'
  | 'adequate'
  | 'weak'
  | 'evasive'
  | 'unprofessional'
  | 'unsupported_claim';

export interface PositiveObservation {
  observation: string;
  evidenceText: string;
}

export interface GapObservation {
  missingSignal: string;
  expectedSignal: string;
}

export type DimensionAssessmentStatus =
  | 'assessed'
  | 'partially_assessed'
  | 'not_assessable'
  | 'insufficient_evidence';

export interface DimensionResult {
  score: number | null;
  assessmentStatus: DimensionAssessmentStatus;
  reason: string;
}

export interface CompetencySignalExtracted {
  competency: string;
  signalStrength: 'strong' | 'moderate' | 'weak' | 'absent';
  evidenceText: string;
}

export interface DeterministicScoreResult {
  score: number;
  scoreInterval: [number, number];
  assessedDimensions: number;
  excludedDimensions: string[];
  scoreConfidence: 'low' | 'medium' | 'high';
}

export interface AnswerEvaluation {
  questionId?: string;
  answerClassification: AnswerEvaluationClassification;
  relevanceGate: {
    status: 'answered' | 'partially_answered' | 'not_answered';
    reason: string;
  };
  positiveObservations: PositiveObservation[];
  gaps: GapObservation[];
  dimensions: {
    relevance: DimensionResult;
    structure: DimensionResult;
    clarity: DimensionResult;
    depth: DimensionResult;
    evidence: DimensionResult;
    roleAlignment: DimensionResult;
  };
  competencySignalsExtracted: CompetencySignalExtracted[];
  expectedSignals: string[];
  demonstratedSignals: string[];
  missingSignals: string[];
  deterministicScore?: DeterministicScoreResult;
}

export interface AnswerTiming {
  turnStartedAt: string;
  answerStartedAt?: string;
  answerSubmittedAt: string;
  evaluationCompletedAt: string;
  nextQuestionGeneratedAt?: string;
}

export interface ConversationIntent {
  action:
    | 'ask_question'
    | 'reask'
    | 'probe'
    | 'acknowledge_repeat_request'
    | 'acknowledge_uncertainty'
    | 'transition'
    | 'close';
  reason?: string;
  questionText?: string;
  tone: 'neutral' | 'encouraging' | 'firm' | 'empathetic';
  repeatOriginalQuestion?: string;
}

export interface QuestionFeedback {
  questionId: string;
  overallScore: number; // 0 - 10 calculated deterministically
  scoreInterval?: [number, number];
  answerClassification: AnswerClassification | AnswerEvaluationClassification;
  relevanceGate: RelevanceGateResult;
  professionalism: ProfessionalismResult;
  completenessMap?: CompletenessMapResult;
  breakdown: {
    relevance: number;
    structure: number;
    clarity: number;
    depth: number;
    evidence: number;
    roleAlignment: number;
  };
  dimensionDetails?: {
    relevance: DimensionScoreDetail;
    structure: DimensionScoreDetail;
    clarity: DimensionScoreDetail;
    depth: DimensionScoreDetail;
    evidence: DimensionScoreDetail;
    roleAlignment: DimensionScoreDetail;
  };
  unverifiedClaims?: UnverifiedClaimResult[];
  whatWorked: string[];
  whatHeldYouBack: string[];
  tryThisNextTime: CoachingSuggestion;
  deterministicConstraintsApplied?: string[];
  shouldFollowUp?: boolean;
  followUpReasonCode?: 'missing_evidence' | 'missing_metric' | 'unclear_decision' | 'missing_tradeoff' | 'shallow_reasoning' | 'unsupported_claim' | 'partial_answer' | 'technical_gap';
  observedSignals?: string[];
  missingSignals?: string[];
  answerEvaluation?: AnswerEvaluation;
  deterministicScore?: DeterministicScoreResult;
}

export interface TurnTimingMetrics {
  turnStartedAt: string;
  answerStartedAt?: string;
  answerSubmittedAt?: string;
  evaluationCompletedAt?: string;
  nextQuestionGeneratedAt?: string;
}

export type InterviewSessionStatus =
  | 'not_started'
  | 'starting'
  | 'active'
  | 'evaluating'
  | 'generating_next'
  | 'closing'
  | 'completed'
  | 'failed'
  | 'paused';

export type InterviewTurnState =
  | 'idle'
  | 'interviewer_speaking'
  | 'candidate_listening'
  | 'candidate_speaking'
  | 'processing_answer'
  | 'evaluating'
  | 'generating_question'
  | 'completed';

export interface ActiveInterviewTurn {
  turnId: string;
  questionId: string; // REAL DATABASE UUID
  sequenceNumber: number;
  questionText: string;
  status:
    | 'question_generating'
    | 'question_ready'
    | 'interviewer_speaking'
    | 'candidate_listening'
    | 'candidate_speaking'
    | 'processing'
    | 'evaluating'
    | 'generating_question'
    | 'completed'
    | 'failed';
  submissionStarted: boolean;
  submissionCompleted: boolean;
  createdAt: string;
  answerStartedAt?: string;
  answerSubmittedAt?: string;
}

export interface InterviewSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: 'draft' | 'preparing' | 'ready' | 'in_progress' | 'completing' | 'evaluating' | 'completed' | 'report_generating' | 'report_ready' | 'report_failed' | 'failed';
  sessionStatus?: InterviewSessionStatus;
  turnState?: InterviewTurnState;
  completionReason?: 'TIME_EXPIRED' | 'BRAIN_CLOSING' | 'CONTRACT_COMPLETED' | 'EXPLICIT_EXIT' | null;
  closingTurnCompleted?: boolean;
  activeTurnId?: string | null;
  activeTurn?: ActiveInterviewTurn | null;
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
  interviewContract?: InterviewContract;
  competencyMap?: CompetencyMap;
  currentObjective?: InterviewObjective;
  turnTimings?: TurnTimingMetrics[];
}

export interface DeliveryObservation {
  speakingPaceWPM?: number;
  paceRating: 'optimal' | 'too_fast' | 'too_slow';
  longPauseCount: number;
  fillerWordCount: number;
  frequentFillerWords: string[];
  clarityRating: 'clear' | 'moderate' | 'muffled';
  deliveryScore: number; // 0 - 10 separate coaching metric
}

export interface QuestionBreakdownItem {
  questionId: string;
  questionText: string;
  category: string;
  score: number;
  userAnswer: string;
  keyCritique: string;
  answerClassification?: AnswerClassification;
}

export interface FinalReport {
  id: string;
  interviewId?: string;
  sessionId: string;
  createdAt: string;
  jobTitle: string;
  company: string;
  overallScore: number; // 0 - 10
  readinessPercentage: number;
  scoreInterval?: [number, number];
  qualificationConfidence?: 'high' | 'medium' | 'low';
  summary: string;
  deliveryObservations?: DeliveryObservation;
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  topStrengths: string[];
  priorityImprovements: string[];
  criticalGaps?: string[];
  recommendedPractice: {
    title: string;
    description: string;
    actionableTask: string;
  }[];
  questionBreakdown: QuestionBreakdownItem[];
}

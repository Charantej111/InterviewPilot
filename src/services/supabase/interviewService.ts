import { supabase } from '../../lib/supabase';
import { 
  InterviewSession, 
  Question, 
  CandidateAnswer, 
  QuestionFeedback, 
  InterviewType, 
  InterviewDifficulty, 
  InterviewDuration,
  InterviewStyle,
} from '../../types/interview';
import { Json } from '../../types/database.types';

export interface CreateInterviewParams {
  userId: string;
  jobTitle: string;
  company: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: InterviewDuration;
  interviewStyle?: InterviewStyle;
  jobDescriptionText: string;
  resumeName: string;
  resumeId?: string;
  jobDescriptionId?: string;
  companyResearchId?: string;
  focusAreas?: string[];
  matchAnalysis?: Record<string, unknown>;
  interviewPlan?: Record<string, unknown>;
  questions: Question[];
}

export interface RecentInterviewSummary {
  id: string;
  role: string;
  company: string;
  score: number;
  date: string;
  status: string;
}

export const interviewService = {
  /**
   * Creates a new interview session and persists the tailored question set to Supabase.
   */
  async createInterview(params: CreateInterviewParams): Promise<InterviewSession> {
    const defaultFocus = params.focusAreas && params.focusAreas.length > 0 ? params.focusAreas : [
      'Product Strategy & Design',
      'Behavioral & Leadership',
      'Analytical Reasoning',
      'Resume Deep Dive'
    ];

    // 1. Insert Interview row
    const { data: interviewRow, error: intError } = await supabase
      .from('interviews')
      .insert({
        user_id: params.userId,
        target_role: params.jobTitle,
        company: params.company,
        interview_type: params.interviewType,
        difficulty: params.difficulty,
        duration_minutes: params.durationMinutes,
        interview_style: params.interviewStyle || 'realistic',
        focus_areas: defaultFocus,
        resume_id: params.resumeId || null,
        job_description_id: params.jobDescriptionId || null,
        company_research_id: params.companyResearchId || null,
        match_analysis: (params.matchAnalysis as unknown as Json) || null,
        interview_plan: (params.interviewPlan as unknown as Json) || null,
        status: 'in_progress',
        current_question_index: 0,
        processing_status: 'completed',
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (intError || !interviewRow) {
      console.error('Error creating interview session in Supabase:', intError);
      throw new Error(`Failed to create interview session: ${intError?.message}`);
    }

    // 2. Insert tailored questions
    const questionInserts = params.questions.map((q, idx) => ({
      interview_id: interviewRow.id,
      sequence_order: idx + 1,
      category: q.category,
      difficulty: params.difficulty,
      question_type: q.type || 'initial',
      question_text: q.text,
      intent: q.intent || null,
      context_explanation: q.contextExplanation || null,
      recommended_duration_seconds: q.recommendedDurationSeconds || 180,
      expected_signals: (q.expectedSignals as unknown as Json) || null,
      red_flags: (q.redFlags as unknown as Json) || null,
      evaluation_criteria: (q.evaluationCriteria as unknown as Json) || null,
      adaptive_follow_up_triggers: (q.adaptiveFollowUpTriggers as unknown as Json) || null,
      is_follow_up: q.type === 'follow_up',
      parent_question_id: q.parentQuestionId || null,
    }));

    const { data: createdQuestions, error: qError } = await supabase
      .from('questions')
      .insert(questionInserts)
      .select();

    if (qError) {
      console.error('Error creating questions for interview:', qError);
      throw new Error(`Failed to create questions: ${qError.message}`);
    }

    const savedQuestions: Question[] = (createdQuestions || []).map((q) => ({
      id: q.id,
      order: q.sequence_order,
      type: (q.question_type as Question['type']) || 'initial',
      parentQuestionId: q.parent_question_id || null,
      category: q.category,
      text: q.question_text,
      intent: q.intent || undefined,
      contextExplanation: q.context_explanation || undefined,
      recommendedDurationSeconds: q.recommended_duration_seconds || 180,
      expectedSignals: (q.expected_signals as unknown as string[]) || undefined,
      redFlags: (q.red_flags as unknown as string[]) || undefined,
      evaluationCriteria: (q.evaluation_criteria as unknown as Question['evaluationCriteria']) || undefined,
      adaptiveFollowUpTriggers: (q.adaptive_follow_up_triggers as unknown as Question['adaptiveFollowUpTriggers']) || undefined,
    }));

    return {
      id: interviewRow.id,
      createdAt: interviewRow.created_at,
      status: 'in_progress',
      jobTitle: interviewRow.target_role,
      company: interviewRow.company,
      interviewType: interviewRow.interview_type as InterviewType,
      difficulty: interviewRow.difficulty as InterviewDifficulty,
      durationMinutes: interviewRow.duration_minutes as InterviewDuration,
      interviewStyle: (interviewRow.interview_style as InterviewStyle) || 'realistic',
      focusAreas: interviewRow.focus_areas || defaultFocus,
      resumeName: params.resumeName,
      resumeId: params.resumeId,
      jobDescriptionId: params.jobDescriptionId,
      companyResearchId: params.companyResearchId,
      jobDescriptionText: params.jobDescriptionText,
      questions: savedQuestions,
      currentQuestionIndex: 0,
      answers: {},
      feedbacks: {},
      finalReportId: `rep_${interviewRow.id}`,
    };
  },

  /**
   * Loads an interview session with all questions, answers, and evaluations.
   */
  async getSessionById(userId: string, sessionId: string): Promise<InterviewSession | null> {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        questions (*),
        answers (*),
        evaluations (*)
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching session by ID:', error);
      return null;
    }

    const sortedQuestions: Question[] = (data.questions || [])
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((q) => ({
        id: q.id,
        order: q.sequence_order,
        type: (q.question_type as Question['type']) || 'initial',
        parentQuestionId: q.parent_question_id || null,
        category: q.category,
        text: q.question_text,
        intent: q.intent || undefined,
        contextExplanation: q.context_explanation || undefined,
        recommendedDurationSeconds: q.recommended_duration_seconds || 180,
        expectedSignals: (q.expected_signals as unknown as string[]) || undefined,
        redFlags: (q.red_flags as unknown as string[]) || undefined,
        evaluationCriteria: (q.evaluation_criteria as unknown as Question['evaluationCriteria']) || undefined,
        adaptiveFollowUpTriggers: (q.adaptive_follow_up_triggers as unknown as Question['adaptiveFollowUpTriggers']) || undefined,
      }));

    const answersMap: Record<string, CandidateAnswer> = {};
    (data.answers || []).forEach((a) => {
      answersMap[a.question_id] = {
        questionId: a.question_id,
        answerText: a.answer_text,
        durationSeconds: a.duration_seconds,
        inputMode: a.submission_type as 'text' | 'voice',
        submittedAt: a.created_at,
      };
    });

    const feedbacksMap: Record<string, QuestionFeedback> = {};
    (data.evaluations || []).forEach((e) => {
      const correspondingAnswer = (data.answers || []).find((a) => a.id === e.answer_id);
      if (correspondingAnswer) {
        feedbacksMap[correspondingAnswer.question_id] = {
          questionId: correspondingAnswer.question_id,
          overallScore: Number(e.overall_score),
          breakdown: {
            relevance: Number(e.relevance),
            structure: Number(e.structure),
            clarity: Number(e.clarity),
            depth: Number(e.depth),
            evidence: Number(e.evidence),
            roleAlignment: Number(e.role_alignment),
          },
          whatWorked: e.strengths || [],
          whatHeldYouBack: e.weaknesses || [],
          tryThisNextTime: (e.try_this_next_time as unknown as QuestionFeedback['tryThisNextTime']) || {
            framework: 'STAR Framework',
            suggestion: e.improvement_suggestions?.[0] || 'Clarify baseline and outcome metrics.',
            examplePhrasing: 'In my role, I identified...',
          },
        };
      }
    });

    return {
      id: data.id,
      createdAt: data.created_at,
      completedAt: data.completed_at || undefined,
      status: (data.status as InterviewSession['status']) || 'in_progress',
      jobTitle: data.target_role,
      company: data.company,
      interviewType: data.interview_type as InterviewType,
      difficulty: data.difficulty as InterviewDifficulty,
      durationMinutes: data.duration_minutes as InterviewDuration,
      interviewStyle: (data.interview_style as InterviewStyle) || 'realistic',
      focusAreas: data.focus_areas || [],
      resumeName: 'Resume.pdf',
      resumeId: data.resume_id || undefined,
      jobDescriptionId: data.job_description_id || undefined,
      companyResearchId: data.company_research_id || undefined,
      jobDescriptionText: '',
      questions: sortedQuestions,
      currentQuestionIndex: data.current_question_index || 0,
      answers: answersMap,
      feedbacks: feedbacksMap,
      finalReportId: data.final_report ? `rep_${data.id}` : undefined,
    };
  },

  /**
   * Submits a candidate answer into Supabase.
   */
  async submitAnswer(
    userId: string,
    interviewId: string,
    questionId: string,
    answerText: string,
    inputMode: 'text' | 'voice',
    durationSeconds: number
  ): Promise<{ answerId: string }> {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        interview_id: interviewId,
        question_id: questionId,
        user_id: userId,
        answer_text: answerText,
        submission_type: inputMode,
        duration_seconds: durationSeconds,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error submitting answer to Supabase:', error);
      throw new Error(`Failed to submit answer: ${error?.message}`);
    }

    return { answerId: data.id };
  },

  /**
   * Updates session progress in Supabase.
   */
  async updateSessionProgress(
    userId: string,
    interviewId: string,
    currentIndex: number,
    status?: InterviewSession['status']
  ): Promise<void> {
    const updates: import('../../types/database.types').Database['public']['Tables']['interviews']['Update'] = {
      current_question_index: currentIndex,
    };
    if (status) updates.status = status;

    const { error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating session progress in Supabase:', error);
    }
  },

  /**
   * Fetches recent interviews for the current user for Dashboard display.
   */
  async getRecentInterviews(userId: string): Promise<RecentInterviewSummary[]> {
    const { data, error } = await supabase
      .from('interviews')
      .select('id, target_role, company, overall_score, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent interviews from Supabase:', error);
      return [];
    }

    const formatDate = (iso: string) => {
      const date = new Date(iso);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    };

    return (data || []).map((row) => ({
      id: row.id,
      role: row.target_role,
      company: row.company,
      score: Number(row.overall_score) || 7.0,
      date: formatDate(row.created_at),
      status: row.status,
    }));
  },

  /**
   * Fetches the current active in-progress interview if one exists.
   */
  async getActiveInterview(userId: string): Promise<InterviewSession | null> {
    const { data, error } = await supabase
      .from('interviews')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.getSessionById(userId, data.id);
  },
};


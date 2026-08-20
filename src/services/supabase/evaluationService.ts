import { supabase } from '../../lib/supabase';
import { QuestionFeedback, FinalReport, Question } from '../../types/interview';
import { calculateOverallScore, RubricDimensions } from '../ai/scoringRubric';
import { aiService } from './aiService';

export interface SaveEvaluationParams {
  userId: string;
  interviewId: string;
  answerId: string;
  question: Question;
  answerText: string;
  role: string;
  company: string;
  difficulty?: string;
  remainingMinutes?: number;
  dimensions?: RubricDimensions;
  whatWorked?: string[];
  whatHeldYouBack?: string[];
  tryThisNextTime?: {
    framework: string;
    suggestion: string;
    promptToImprove: string;
    examplePhrasing?: string;
  };
  followUpNeeded?: boolean;
  followUpQuestion?: string;
}

export const evaluationService = {
  /**
   * Deterministically evaluates and saves an answer score in Supabase.
   */
  async evaluateAndSaveAnswer(params: SaveEvaluationParams): Promise<QuestionFeedback & { followUpNeeded?: boolean; followUpTriggerReason?: string }> {
    let feedback: QuestionFeedback & { followUpNeeded?: boolean; followUpTriggerReason?: string };

    if (params.dimensions && params.whatWorked && params.whatHeldYouBack && params.tryThisNextTime) {
      const overallScore = calculateOverallScore(params.dimensions);
      feedback = {
        questionId: params.question.id,
        overallScore,
        answerClassification: 'adequate',
        relevanceGate: { status: 'answered', score: params.dimensions.relevance, reason: 'Directly addressed prompt.' },
        professionalism: { status: 'acceptable' },
        breakdown: {
          relevance: params.dimensions.relevance,
          structure: params.dimensions.structure,
          clarity: params.dimensions.clarity,
          depth: params.dimensions.depth,
          evidence: params.dimensions.evidence,
          roleAlignment: params.dimensions.roleAlignment,
        },
        whatWorked: params.whatWorked,
        whatHeldYouBack: params.whatHeldYouBack,
        tryThisNextTime: params.tryThisNextTime,
        followUpNeeded: params.followUpNeeded,
      };
    } else {
      // Invoke real AI Answer Evaluator Edge Function
      feedback = await aiService.evaluateAnswer({
        question: params.question,
        answerText: params.answerText,
        role: params.role,
        company: params.company,
        difficulty: params.difficulty,
        remainingMinutes: params.remainingMinutes,
      });
    }

    const { error } = await supabase
      .from('evaluations')
      .insert({
        answer_id: params.answerId,
        interview_id: params.interviewId,
        user_id: params.userId,
        relevance: feedback.breakdown.relevance,
        structure: feedback.breakdown.structure,
        clarity: feedback.breakdown.clarity,
        depth: feedback.breakdown.depth,
        evidence: feedback.breakdown.evidence,
        role_alignment: feedback.breakdown.roleAlignment,
        overall_score: feedback.overallScore,
        strengths: feedback.whatWorked,
        weaknesses: feedback.whatHeldYouBack,
        improvement_suggestions: [feedback.tryThisNextTime.suggestion],
        try_this_next_time: feedback.tryThisNextTime as unknown as import('../../types/database.types').Json,
        follow_up_needed: feedback.followUpNeeded || false,
        follow_up_question: feedback.followUpTriggerReason || null,
        processing_status: 'completed',
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving evaluation to Supabase:', error);
      throw error;
    }

    return feedback;
  },

  /**
   * Generates a final holistic report for an interview session via Edge Function and saves to Supabase.
   */
  async generateAndSaveFinalReport(userId: string, interviewId: string): Promise<FinalReport> {
    // 1. Fetch interview details, questions, answers, and evaluations
    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select(`
        *,
        questions:questions!questions_interview_id_fkey (*),
        answers:answers!answers_interview_id_fkey (*),
        evaluations:evaluations!evaluations_interview_id_fkey (*)
      `)
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (intError || !interview) {
      console.error('Error fetching interview for final report:', intError);
      throw new Error(`Interview not found: ${intError?.message}`);
    }

    // 2. Return existing report immediately if already synthesized (Idempotent cache)
    if (
      interview.final_report &&
      typeof interview.final_report === 'object' &&
      (interview.final_report as any).overallScore !== undefined
    ) {
      return interview.final_report as unknown as FinalReport;
    }

    const rawQuestions: any[] = Array.isArray(interview.questions) ? interview.questions : [];
    const sortedQuestions: Question[] = rawQuestions
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((q: any) => ({
        id: q.id,
        order: q.sequence_order,
        type: (q.question_type as Question['type']) || 'initial',
        questionType: (q.question_type as any) || 'product_sense',
        source: 'job_description' as const,
        sourceReference: 'Core Responsibilities',
        targetCompetency: q.category || 'Problem Solving',
        expectedAnswerCharacteristics: q.expected_signals || ['States clear problem context and initial assumptions', 'Explains decision criteria'],
        parentQuestionId: q.parent_question_id || null,
        category: q.category,
        text: q.question_text,
        intent: q.intent || undefined,
        contextExplanation: q.context_explanation || undefined,
        recommendedDurationSeconds: q.recommended_duration_seconds || 180,
      }));

    // 3. Mark status as report_generating
    await supabase
      .from('interviews')
      .update({ status: 'report_generating' })
      .eq('id', interviewId)
      .eq('user_id', userId);

    // 4. Invoke real generate-report Edge Function / Client Gemini
    const report = await aiService.generateFinalReport({
      interviewId: interview.id,
      role: interview.target_role,
      company: interview.company,
      questions: sortedQuestions,
      answers: interview.answers || [],
      evaluations: interview.evaluations || [],
    });

    // 5. Update interview row in Supabase to report_ready
    await supabase
      .from('interviews')
      .update({
        status: 'report_ready',
        overall_score: report.overallScore,
        readiness_percentage: report.readinessPercentage,
        final_report: report as unknown as import('../../types/database.types').Json,
        completed_at: new Date().toISOString(),
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', interviewId)
      .eq('user_id', userId);

    // 4. Update profile aggregate stats
    const { data: prof } = await supabase
      .from('profiles')
      .select('interviews_completed, average_score')
      .eq('id', userId)
      .maybeSingle();

    if (prof) {
      const currentCompleted = prof.interviews_completed || 0;
      const currentAvg = Number(prof.average_score) || 0;
      const newCompleted = currentCompleted + 1;
      const newAvg = Math.round(((currentAvg * currentCompleted + report.overallScore) / newCompleted) * 10) / 10;

      await supabase
        .from('profiles')
        .update({
          interviews_completed: newCompleted,
          average_score: newAvg,
          readiness_percentage: report.readinessPercentage,
          last_active_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return report;
  },
};

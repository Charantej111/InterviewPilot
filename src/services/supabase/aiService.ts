import { supabase } from '../../lib/supabase';
import { CandidateProfile } from '../../types/resume';
import { JobProfile } from '../../types/jobDescription';
import { CompanyResearchData } from '../../types/companyResearch';
import { MatchAnalysisResult } from '../../types/matchAnalysis';
import { Question, QuestionFeedback, FinalReport } from '../../types/interview';

const getClientApiKey = (): string | undefined => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || undefined;
};

export const aiService = {
  /**
   * Step 2: Resume Analyzer
   * Extracts structured CandidateProfile from an uploaded resume via analyze-resume Edge Function.
   */
  async extractResumeProfile(fileName: string, fileText?: string): Promise<CandidateProfile> {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: { fileName, fileText, apiKey: getClientApiKey() },
    });

    if (error || !data?.candidateProfile) {
      console.error('Error invoking analyze-resume Edge Function:', error);
      throw new Error(`Resume analysis failed: ${error?.message || 'Invalid candidate profile output'}`);
    }

    return data.candidateProfile;
  },

  /**
   * Step 3: JD Analyzer
   * Deconstructs a raw job description into structured JobProfile via analyze-jd Edge Function.
   */
  async analyzeJobDescription(title: string, company: string, rawText: string): Promise<JobProfile> {
    const { data, error } = await supabase.functions.invoke('analyze-jd', {
      body: { title, company, rawText, apiKey: getClientApiKey() },
    });

    if (error || !data?.jobProfile) {
      console.error('Error invoking analyze-jd Edge Function:', error);
      throw new Error(`Job description analysis failed: ${error?.message || 'Invalid job profile output'}`);
    }

    return data.jobProfile;
  },

  /**
   * Step 5: Company Research (Happens before the interview in preparation phase)
   * Researches company context using authoritative search sources with strict 3-way partitioning.
   */
  async researchCompany(companyName: string, role: string): Promise<CompanyResearchData> {
    const cleanCompany = (companyName || '').trim();
    const cleanRole = (role || '').trim();

    const { data, error } = await supabase.functions.invoke('research-company', {
      body: { companyName: cleanCompany, role: cleanRole, apiKey: getClientApiKey() },
    });

    if (error || !data?.companyResearch) {
      console.error('Error invoking research-company Edge Function:', error);
      throw new Error(`Company research failed: ${error?.message || 'Unable to retrieve company intelligence'}`);
    }

    return data.companyResearch;
  },

  /**
   * Step 4: Match & Gap Analyzer
   * Evaluates fit using deterministic 45/30/25 scoring and surfaces prioritized actionable gaps.
   */
  async computeMatchAnalysis(
    candidateProfile: CandidateProfile,
    jobProfile: JobProfile,
    companyResearch?: CompanyResearchData | null
  ): Promise<MatchAnalysisResult> {
    const { data, error } = await supabase.functions.invoke('match-analysis', {
      body: { candidateProfile, jobProfile, companyResearch },
    });

    if (error || !data?.matchResult) {
      console.error('Error invoking match-analysis Edge Function:', error);
      throw new Error(`Match analysis failed: ${error?.message || 'Unable to compute match score'}`);
    }

    return data.matchResult;
  },

  /**
   * Step 6: Interview Preparation
   * Prepares tailored, non-generic interview questions with evaluation criteria and zero sample answers.
   */
  async prepareInterview(params: {
    resume: CandidateProfile;
    job: JobProfile;
    company?: CompanyResearchData | null;
    match: MatchAnalysisResult;
    settings: {
      role: string;
      company: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      duration: number;
      focusAreas: string[];
      style: string;
    };
  }): Promise<Question[]> {
    const { data, error } = await supabase.functions.invoke('prepare-interview', {
      body: { ...params, apiKey: getClientApiKey() },
    });

    if (error || !data?.questions || data.questions.length === 0) {
      console.error('Error invoking prepare-interview Edge Function:', error);
      throw new Error(`Interview preparation failed: ${error?.message || 'No tailored questions generated'}`);
    }

    return data.questions;
  },

  /**
   * Step 7: Interviewer Conversational Framing & Transitions
   * Generates natural spoken interviewer turns: introductions, question delivery, transitions, and pacing alerts.
   */
  async generateInterviewerRemark(params: {
    action: 'intro' | 'ask_question' | 'transition' | 'closing' | 'time_warning';
    candidateName?: string;
    role: string;
    company: string;
    style?: string;
    question?: Question;
    previousAnswer?: string;
    remainingMinutes?: number;
    conversationSummary?: string;
  }): Promise<string> {
    const { data, error } = await supabase.functions.invoke('interview-chat', {
      body: { ...params, apiKey: getClientApiKey() },
    });

    if (error || !data?.spokenText) {
      console.warn('Interviewer conversational turn fallback:', error?.message);
      if (params.action === 'intro') {
        return `Welcome, ${params.candidateName || 'Candidate'}. Today we will conduct a structured interview for the ${params.role} role at ${params.company}. Let's begin with our first question.`;
      }
      if (params.action === 'closing') {
        return `Thank you for sharing your experience. We have concluded the interview questions and your evaluation report is now being generated.`;
      }
      return params.question?.text || 'Please share your approach to this scenario.';
    }

    return data.spokenText;
  },

  /**
   * Step 8: Answer Evaluator
   * Evaluates candidate answer across 6 rubric dimensions and computes deterministic overall score.
   */
  async evaluateAnswer(params: {
    question: Question;
    answerText: string;
    role: string;
    company: string;
    difficulty?: string;
    remainingMinutes?: number;
  }): Promise<QuestionFeedback & { followUpNeeded?: boolean; followUpTriggerReason?: string; followUpTopic?: string }> {
    const { data, error } = await supabase.functions.invoke('evaluate-answer', {
      body: { ...params, apiKey: getClientApiKey() },
    });

    if (error || !data?.feedback) {
      console.error('Error invoking evaluate-answer Edge Function:', error);
      throw new Error(`Answer evaluation failed: ${error?.message || 'Unable to evaluate candidate response'}`);
    }

    return data.feedback;
  },

  /**
   * Step 9: Adaptive Follow-up
   * Probes unaddressed gaps or missing evidence with parent question linking.
   */
  async generateAdaptiveFollowUp(params: {
    parentQuestion: Question;
    candidateAnswer: string;
    weaknessIdentified?: string;
    triggerReason?: string;
    role: string;
    company: string;
    difficulty?: string;
    order?: number;
  }): Promise<Question> {
    const { data, error } = await supabase.functions.invoke('adaptive-followup', {
      body: { ...params, apiKey: getClientApiKey() },
    });

    if (error || !data?.followUpQuestion) {
      console.error('Error invoking adaptive-followup Edge Function:', error);
      throw new Error(`Adaptive follow-up generation failed: ${error?.message || 'Unable to generate follow-up probe'}`);
    }

    return data.followUpQuestion;
  },

  /**
   * Step 10: Final Report Synthesis
   * Holistic multi-question synthesis with deterministic averages, readiness percentage, and practice drills.
   */
  async generateFinalReport(params: {
    interviewId: string;
    role: string;
    company: string;
    questions: Question[];
    answers: Record<string, any>;
    evaluations: any[];
  }): Promise<FinalReport> {
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: { ...params, apiKey: getClientApiKey() },
    });

    if (error || !data?.report) {
      console.error('Error invoking generate-report Edge Function:', error);
      throw new Error(`Final report synthesis failed: ${error?.message || 'Unable to generate final report'}`);
    }

    return data.report;
  },
};

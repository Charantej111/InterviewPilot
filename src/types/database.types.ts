export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          answer_type: string | null
          audio_storage_path: string | null
          created_at: string
          duration_seconds: number
          id: string
          interview_id: string
          question_id: string
          submission_type: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          answer_type?: string | null
          audio_storage_path?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          interview_id: string
          question_id: string
          submission_type?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          answer_type?: string | null
          audio_storage_path?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          interview_id?: string
          question_id?: string
          submission_type?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_research: {
        Row: {
          business_model: string | null
          company_name: string
          created_at: string
          id: string
          overview: string | null
          products: Json | null
          researched_at: string
          role: string
          sources: Json | null
          status: string
          strategic_inferences: Json | null
          unavailable_information: Json | null
          updated_at: string
          user_id: string
          verified_facts: Json | null
        }
        Insert: {
          business_model?: string | null
          company_name: string
          created_at?: string
          id?: string
          overview?: string | null
          products?: Json | null
          researched_at?: string
          role: string
          sources?: Json | null
          status?: string
          strategic_inferences?: Json | null
          unavailable_information?: Json | null
          updated_at?: string
          user_id: string
          verified_facts?: Json | null
        }
        Update: {
          business_model?: string | null
          company_name?: string
          created_at?: string
          id?: string
          overview?: string | null
          products?: Json | null
          researched_at?: string
          role?: string
          sources?: Json | null
          status?: string
          strategic_inferences?: Json | null
          unavailable_information?: Json | null
          updated_at?: string
          user_id?: string
          verified_facts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_research_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          answer_id: string
          clarity: number
          created_at: string
          depth: number
          evidence: number
          follow_up_needed: boolean | null
          follow_up_question: string | null
          id: string
          improvement_suggestions: string[] | null
          interview_id: string
          overall_score: number
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          relevance: number
          role_alignment: number
          strengths: string[] | null
          structure: number
          try_this_next_time: Json | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          answer_id: string
          clarity: number
          created_at?: string
          depth: number
          evidence: number
          follow_up_needed?: boolean | null
          follow_up_question?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          interview_id: string
          overall_score: number
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          relevance: number
          role_alignment: number
          strengths?: string[] | null
          structure: number
          try_this_next_time?: Json | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          answer_id?: string
          clarity?: number
          created_at?: string
          depth?: number
          evidence?: number
          follow_up_needed?: boolean | null
          follow_up_question?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          interview_id?: string
          overall_score?: number
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          relevance?: number
          role_alignment?: number
          strengths?: string[] | null
          structure?: number
          try_this_next_time?: Json | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: true
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          company: string
          company_research_id: string | null
          completed_at: string | null
          created_at: string
          current_question_id: string | null
          current_question_index: number
          difficulty: string
          duration_minutes: number
          final_report: Json | null
          focus_areas: string[] | null
          id: string
          interview_plan: Json | null
          interview_style: string | null
          interview_type: string
          job_description_id: string | null
          match_analysis: Json | null
          mode: string | null
          overall_score: number | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          readiness_percentage: number | null
          remaining_time: number | null
          resume_id: string | null
          status: string
          target_role: string
          transcript_status: string | null
          user_id: string
          voice_provider: string | null
          voice_session_id: string | null
          voice_status: string | null
        }
        Insert: {
          company: string
          company_research_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_question_id?: string | null
          current_question_index?: number
          difficulty: string
          duration_minutes: number
          final_report?: Json | null
          focus_areas?: string[] | null
          id?: string
          interview_plan?: Json | null
          interview_style?: string | null
          interview_type: string
          job_description_id?: string | null
          match_analysis?: Json | null
          mode?: string | null
          overall_score?: number | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          readiness_percentage?: number | null
          remaining_time?: number | null
          resume_id?: string | null
          status?: string
          target_role: string
          transcript_status?: string | null
          user_id: string
          voice_provider?: string | null
          voice_session_id?: string | null
          voice_status?: string | null
        }
        Update: {
          company?: string
          company_research_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_question_id?: string | null
          current_question_index?: number
          difficulty?: string
          duration_minutes?: number
          final_report?: Json | null
          focus_areas?: string[] | null
          id?: string
          interview_plan?: Json | null
          interview_style?: string | null
          interview_type?: string
          job_description_id?: string | null
          match_analysis?: Json | null
          mode?: string | null
          overall_score?: number | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          readiness_percentage?: number | null
          remaining_time?: number | null
          resume_id?: string | null
          status?: string
          target_role?: string
          transcript_status?: string | null
          user_id?: string
          voice_provider?: string | null
          voice_session_id?: string | null
          voice_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_company_research_id_fkey"
            columns: ["company_research_id"]
            isOneToOne: false
            referencedRelation: "company_research"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          company: string
          created_at: string
          id: string
          parsed_requirements: Json | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          raw_description: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          id?: string
          parsed_requirements?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          raw_description: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          id?: string
          parsed_requirements?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          raw_description?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_score: number | null
          created_at: string
          experience_level: string | null
          full_name: string | null
          id: string
          interviews_completed: number | null
          last_active_date: string | null
          preferences: Json | null
          readiness_delta: number | null
          readiness_percentage: number | null
          streak_days: number | null
          target_companies: string[] | null
          target_role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          average_score?: number | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          id: string
          interviews_completed?: number | null
          last_active_date?: string | null
          preferences?: Json | null
          readiness_delta?: number | null
          readiness_percentage?: number | null
          streak_days?: number | null
          target_companies?: string[] | null
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          average_score?: number | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          id?: string
          interviews_completed?: number | null
          last_active_date?: string | null
          preferences?: Json | null
          readiness_delta?: number | null
          readiness_percentage?: number | null
          streak_days?: number | null
          target_companies?: string[] | null
          target_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          adaptive_follow_up_triggers: Json | null
          category: string
          context_explanation: string | null
          created_at: string
          difficulty: string
          evaluation_criteria: Json | null
          expected_signals: Json | null
          id: string
          intent: string | null
          interview_id: string
          is_follow_up: boolean | null
          parent_question_id: string | null
          question_text: string
          question_type: string
          recommended_duration_seconds: number | null
          red_flags: Json | null
          sample_answer: string | null
          sequence_order: number
        }
        Insert: {
          adaptive_follow_up_triggers?: Json | null
          category: string
          context_explanation?: string | null
          created_at?: string
          difficulty: string
          evaluation_criteria?: Json | null
          expected_signals?: Json | null
          id?: string
          intent?: string | null
          interview_id: string
          is_follow_up?: boolean | null
          parent_question_id?: string | null
          question_text: string
          question_type?: string
          recommended_duration_seconds?: number | null
          red_flags?: Json | null
          sample_answer?: string | null
          sequence_order: number
        }
        Update: {
          adaptive_follow_up_triggers?: Json | null
          category?: string
          context_explanation?: string | null
          created_at?: string
          difficulty?: string
          evaluation_criteria?: Json | null
          expected_signals?: Json | null
          id?: string
          intent?: string | null
          interview_id?: string
          is_follow_up?: boolean | null
          parent_question_id?: string | null
          question_text?: string
          question_type?: string
          recommended_duration_seconds?: number | null
          red_flags?: Json | null
          sample_answer?: string | null
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_parent_question_id_fkey"
            columns: ["parent_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          extracted_profile: Json | null
          file_name: string | null
          file_size_bytes: number | null
          file_size_formatted: string | null
          file_type: string | null
          id: string
          original_filename: string
          parsed_data: Json | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_profile?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_size_formatted?: string | null
          file_type?: string | null
          id?: string
          original_filename: string
          parsed_data?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_profile?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_size_formatted?: string | null
          file_type?: string | null
          id?: string
          original_filename?: string
          parsed_data?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

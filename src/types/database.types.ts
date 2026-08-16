export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          answer_text: string
          created_at: string
          duration_seconds: number
          id: string
          interview_id: string
          question_id: string
          submission_type: string
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          duration_seconds?: number
          id?: string
          interview_id: string
          question_id: string
          submission_type?: string
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          interview_id?: string
          question_id?: string
          submission_type?: string
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
          completed_at: string | null
          created_at: string
          current_question_index: number
          difficulty: string
          duration_minutes: number
          final_report: Json | null
          focus_areas: string[] | null
          id: string
          interview_type: string
          job_description_id: string | null
          overall_score: number | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string
          readiness_percentage: number | null
          resume_id: string | null
          status: string
          target_role: string
          user_id: string
        }
        Insert: {
          company: string
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          difficulty: string
          duration_minutes: number
          final_report?: Json | null
          focus_areas?: string[] | null
          id?: string
          interview_type: string
          job_description_id?: string | null
          overall_score?: number | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          readiness_percentage?: number | null
          resume_id?: string | null
          status?: string
          target_role: string
          user_id: string
        }
        Update: {
          company?: string
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          difficulty?: string
          duration_minutes?: number
          final_report?: Json | null
          focus_areas?: string[] | null
          id?: string
          interview_type?: string
          job_description_id?: string | null
          overall_score?: number | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string
          readiness_percentage?: number | null
          resume_id?: string | null
          status?: string
          target_role?: string
          user_id?: string
        }
        Relationships: [
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
          category: string
          context_explanation: string | null
          created_at: string
          difficulty: string
          evaluation_criteria: Json | null
          id: string
          interview_id: string
          is_follow_up: boolean | null
          parent_question_id: string | null
          question_text: string
          question_type: string
          recommended_duration_seconds: number | null
          sample_answer: string | null
          sequence_order: number
        }
        Insert: {
          category: string
          context_explanation?: string | null
          created_at?: string
          difficulty: string
          evaluation_criteria?: Json | null
          id?: string
          interview_id: string
          is_follow_up?: boolean | null
          parent_question_id?: string | null
          question_text: string
          question_type?: string
          recommended_duration_seconds?: number | null
          sample_answer?: string | null
          sequence_order: number
        }
        Update: {
          category?: string
          context_explanation?: string | null
          created_at?: string
          difficulty?: string
          evaluation_criteria?: Json | null
          id?: string
          interview_id?: string
          is_follow_up?: boolean | null
          parent_question_id?: string | null
          question_text?: string
          question_type?: string
          recommended_duration_seconds?: number | null
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
          file_size_bytes: number | null
          file_size_formatted: string | null
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
          file_size_bytes?: number | null
          file_size_formatted?: string | null
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
          file_size_bytes?: number | null
          file_size_formatted?: string | null
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

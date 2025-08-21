// Database type definitions for Supabase
// Based on current migration files - manually maintained for cloud instance

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          linkedin: string | null
          github: string | null
          resume_url: string | null
          country: string | null
          years_experience: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          linkedin?: string | null
          github?: string | null
          resume_url?: string | null
          country?: string | null
          years_experience?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          linkedin?: string | null
          github?: string | null
          resume_url?: string | null
          country?: string | null
          years_experience?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      candidates_linkedin_raw: {
        Row: {
          id: string
          candidate_id: string
          content: any // JSONB - raw LinkedIn profile data
          linkedin_url: string | null
          data_hash: string | null
          extraction_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          content: any // JSONB - raw LinkedIn profile data
          linkedin_url?: string | null
          data_hash?: string | null
          extraction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          content?: any // JSONB - raw LinkedIn profile data
          linkedin_url?: string | null
          data_hash?: string | null
          extraction_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      candidates_resume_raw: {
        Row: {
          id: string
          candidate_id: string
          content: string
          url: string | null
          file_name: string | null
          file_size: number | null
          data_hash: string | null
          extraction_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          content: string
          url?: string | null
          file_name?: string | null
          file_size?: number | null
          data_hash?: string | null
          extraction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          content?: string
          url?: string | null
          file_name?: string | null
          file_size?: number | null
          data_hash?: string | null
          extraction_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      candidates_skills: {
        Row: {
          id: string
          candidate_id: string
          skill: string
          type: string
          source: string
          proficiency_level: string | null
          years_of_experience: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          skill: string
          type: string
          source: string
          proficiency_level?: string | null
          years_of_experience?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          skill?: string
          type?: string
          source?: string
          proficiency_level?: string | null
          years_of_experience?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          company_id: string
          title: string
          initial_notes: string | null
          rate: number | null
          pay_freq: string | null
          duration: string | null
          commitment: string | null
          location_reqs: string | null
          regions: string[] | null
          countries: string[] | null
          timezone: string | null
          job_description: string | null
          linkedin_query: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          title: string
          initial_notes?: string | null
          rate?: number | null
          pay_freq?: string | null
          duration?: string | null
          commitment?: string | null
          location_reqs?: string | null
          regions?: string[] | null
          countries?: string[] | null
          timezone?: string | null
          job_description?: string | null
          linkedin_query?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          title?: string
          initial_notes?: string | null
          rate?: number | null
          pay_freq?: string | null
          duration?: string | null
          commitment?: string | null
          location_reqs?: string | null
          regions?: string[] | null
          countries?: string[] | null
          timezone?: string | null
          job_description?: string | null
          linkedin_query?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_descriptions: {
        Row: {
          id: string
          job_id: string
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          user_id: string
          title: string
          recall_bot_id: string | null
          status: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
          meeting_link: string | null
          full_transcript: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          user_id: string
          title: string
          recall_bot_id?: string | null
          status?: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
          meeting_link?: string | null
          full_transcript?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          user_id?: string
          title?: string
          recall_bot_id?: string | null
          status?: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
          meeting_link?: string | null
          full_transcript?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
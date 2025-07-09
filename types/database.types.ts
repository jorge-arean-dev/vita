export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          avatar_url: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          avatar_url?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          avatar_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      regions: {
        Row: {
          id: string
          name: string
          display_name: string
          is_parent: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_parent?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_parent?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          id: string
          iso_code: string
          display_name: string
          region: string
          region_parent: string | null
          primary_timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          iso_code: string
          display_name: string
          region: string
          region_parent?: string | null
          primary_timezone: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          iso_code?: string
          display_name?: string
          region?: string
          region_parent?: string | null
          primary_timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_countries_region"
            columns: ["region"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_countries_region_parent"
            columns: ["region_parent"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_countries_timezone"
            columns: ["primary_timezone"]
            isOneToOne: false
            referencedRelation: "timezones"
            referencedColumns: ["name"]
          }
        ]
      }
      timezones: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          id: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_durations: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_pay_frequencies: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_commitment_types: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_location_types: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_types: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      proficiency_levels: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_sources: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_types: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          industry_id: string | null
          website: string | null
          linkedin: string | null
          country: string | null
          culture: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          industry_id?: string | null
          website?: string | null
          linkedin?: string | null
          country?: string | null
          culture?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          industry_id?: string | null
          website?: string | null
          linkedin?: string | null
          country?: string | null
          culture?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_companies_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_companies_industry_id"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_companies_country"
            columns: ["country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["iso_code"]
          }
        ]
      }
      candidates: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          linkedin: string | null
          resume_url: string | null
          country: string | null
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
          resume_url?: string | null
          country?: string | null
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
          resume_url?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidates_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_candidates_country"
            columns: ["country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["iso_code"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_jobs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_jobs_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jobs_pay_freq"
            columns: ["pay_freq"]
            isOneToOne: false
            referencedRelation: "job_pay_frequencies"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_jobs_duration"
            columns: ["duration"]
            isOneToOne: false
            referencedRelation: "job_durations"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_jobs_commitment"
            columns: ["commitment"]
            isOneToOne: false
            referencedRelation: "job_commitment_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_jobs_location_reqs"
            columns: ["location_reqs"]
            isOneToOne: false
            referencedRelation: "job_location_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_jobs_timezone"
            columns: ["timezone"]
            isOneToOne: false
            referencedRelation: "timezones"
            referencedColumns: ["name"]
          }
        ]
      }
      job_requirements: {
        Row: {
          id: string
          job_id: string
          requirement: string
          type: string
          is_mandatory: boolean
          proficiency_level: string | null
          weight: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          requirement: string
          type: string
          is_mandatory?: boolean
          proficiency_level?: string | null
          weight?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          requirement?: string
          type?: string
          is_mandatory?: boolean
          proficiency_level?: string | null
          weight?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_requirements_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_requirements_type"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "skill_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_job_requirements_proficiency_level"
            columns: ["proficiency_level"]
            isOneToOne: false
            referencedRelation: "proficiency_levels"
            referencedColumns: ["name"]
          }
        ]
      }
      candidates_skills: {
        Row: {
          id: string
          candidate_id: string
          skill: string
          type: string
          source: string
          proficiency_level: string | null
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
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidates_skills_candidate_id"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_candidates_skills_type"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "skill_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_candidates_skills_source"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "skill_sources"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_candidates_skills_proficiency_level"
            columns: ["proficiency_level"]
            isOneToOne: false
            referencedRelation: "proficiency_levels"
            referencedColumns: ["name"]
          }
        ]
      }
      job_questions: {
        Row: {
          id: string
          job_id: string
          content: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          content: string
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          content?: string
          type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_questions_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_questions_type"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "question_types"
            referencedColumns: ["name"]
          }
        ]
      }
      job_interview_transcript: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_interview_transcript_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_interview_transcript_candidate_id"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
      job_candidate_match_analysis: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          overall_score: number
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          overall_score: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          overall_score?: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_candidate_match_analysis_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_candidate_match_analysis_candidate_id"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
      job_candidate_evaluation: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          job_requirement_id: string
          score: number
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          job_requirement_id: string
          score: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          job_requirement_id?: string
          score?: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_candidate_evaluation_job_id"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_candidate_evaluation_candidate_id"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job_candidate_evaluation_job_requirement_id"
            columns: ["job_requirement_id"]
            isOneToOne: false
            referencedRelation: "job_requirements"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_interview_evaluation: {
        Row: {
          id: string
          job_interview_transcript_id: string
          technical_skills_score: number | null
          problem_solving_score: number | null
          communication_collaboration_score: number | null
          leadership_initiative_score: number | null
          adaptability_learning_agility_score: number | null
          cultural_fit_values_alignment_score: number | null
          feedback: string | null
          suggestions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_interview_transcript_id: string
          technical_skills_score?: number | null
          problem_solving_score?: number | null
          communication_collaboration_score?: number | null
          leadership_initiative_score?: number | null
          adaptability_learning_agility_score?: number | null
          cultural_fit_values_alignment_score?: number | null
          feedback?: string | null
          suggestions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_interview_transcript_id?: string
          technical_skills_score?: number | null
          problem_solving_score?: number | null
          communication_collaboration_score?: number | null
          leadership_initiative_score?: number | null
          adaptability_learning_agility_score?: number | null
          cultural_fit_values_alignment_score?: number | null
          feedback?: string | null
          suggestions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidate_interview_evaluation_transcript_id"
            columns: ["job_interview_transcript_id"]
            isOneToOne: true
            referencedRelation: "job_interview_transcript"
            referencedColumns: ["id"]
          }
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

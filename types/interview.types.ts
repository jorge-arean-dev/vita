// Interview-related type definitions
// These will be replaced when you regenerate database.types.ts from Supabase

export interface InterviewStatus {
  name: string
  display_name: string
  description: string | null
  sort_order: number
}

export interface Interview {
  id: string
  job_id: string
  candidate_id: string
  user_id: string
  title: string
  recall_bot_id: string | null
  status: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
  meeting_link: string | null
  analysis_triggered_at: string | null
  analysis_triggered_by: string | null
  created_at: string
  updated_at: string
  interview_statuses?: InterviewStatus
}

export interface InterviewTranscript {
  id: string
  interview_id: string
  speaker: string
  text: string
  start_time: number | null
  end_time: number | null
  created_at: string
}

export interface InterviewScore {
  id: string
  interview_id: string
  overall_score: number | null
  analysis: {
    overall_score: number
    strengths: string[]
    areas_for_improvement: string[]
    key_moments: Array<{
      timestamp: string
      highlight: string
    }>
    recommendation: string
  } | null
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface InterviewWithDetails extends Interview {
  candidates?: Candidate
  jobs?: {
    id: string
    title: string
    job_description: string | null
  }
  interview_scores?: InterviewScore[]
  interview_transcripts?: InterviewTranscript[]
  transcript_count?: number
}
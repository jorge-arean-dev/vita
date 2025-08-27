import { type ParsedCandidate } from "@/app/actions/match-analysis"

export interface Candidate {
  id: string
  name: string
  email?: string
}

export interface RequirementEvaluation {
  requirement_name: string
  score: number
  status: "fit" | "developing" | "weak" | "missing"
  feedback: string
}

export interface AnalysisResults {
  match_analysis: {
    overall_score: number
    status: "fit" | "developing" | "weak" | "missing"
    overall_feedback: string
    matched_mandatory_requirements: number
    total_mandatory_requirements: number
  }
  requirement_evaluations: RequirementEvaluation[]
  summary: {
    strengths: string[]
    gaps: string[]
  }
  recruiter_recommendations: {
    interview_strategy: string[]
    other_options: string[]
  }
  metadata: {
    analysis_timestamp: string
    job_id: string
    candidate_id: string
    algorithm_version: string
    total_processing_time_ms: number
  }
}

export interface MatchAnalysis {
  id: string
  title: string
  candidateInfo: {
    name: string
    type: "existing" | "new"
    source?: string
  }
  results?: AnalysisResults & {
    analysisMetadata?: {
      strategy: string
      reason: string
      rawDataSources: {
        hasLinkedIn: boolean
        hasResume: boolean
      }
    }
  }
  created_at: string
  isExpanded?: boolean
  isNew?: boolean
  progressMessage?: string
  parsedCandidate?: ParsedCandidate
  tempFilePath?: string
  uploadedFile?: File
  rawProfile?: Record<string, unknown> | string // For enhanced analysis (LinkedIn object or PDF text)
  analysisStrategy?: string // Which analysis strategy was used
  rawDataSources?: {
    hasLinkedIn: boolean
    hasResume: boolean
  }
  needsCleanup?: boolean // Indicates if temp files need cleanup on discard
}

export interface ExistingMatchAnalysis {
  id: string
  job_id: string
  candidate_id: string
  match_analysis: {
    overall_score: number
    status: "fit" | "developing" | "weak" | "missing"
    overall_feedback: string
    matched_mandatory_requirements: number
    total_mandatory_requirements: number
  }
  requirement_evaluations: Array<{
    requirement_name: string
    score: number
    status: "fit" | "developing" | "weak" | "missing"
    feedback: string
  }>
  summary: {
    strengths: string[]
    gaps: string[]
  }
  recruiter_recommendations: {
    interview_strategy: string[]
    other_options: string[]
  }
  created_at: string
  updated_at: string
  candidates: {
    id: string
    first_name: string
    last_name: string
    email: string
    linkedin: string
    country: string
  } | null
}

export interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  status: "fit" | "developing" | "weak" | "missing"
}

export interface CandidateMatchAnalysisProps {
  jobId: string
  existingAnalyses?: ExistingMatchAnalysis[]
}
import type { LinkedInProfile } from "@/types/linkedin.types"
import type { Database } from "@/types/database.types"

type Candidate = Database["public"]["Tables"]["candidates"]["Row"]
type CandidateSkill = Database["public"]["Tables"]["candidates_skills"]["Row"]
type Job = Database["public"]["Tables"]["jobs"]["Row"]
type JobRequirement = {
  id: string
  job_id: string
  requirement: string
  type: string
  is_mandatory: boolean
  proficiency_level: string | null
  weight: number
  created_at: string
  updated_at: string
}
type CandidatesLinkedInRawRow = Database["public"]["Tables"]["candidates_linkedin_raw"]["Row"]
type CandidatesResumeRawRow = Database["public"]["Tables"]["candidates_resume_raw"]["Row"]

/**
 * Enhanced Match Analysis API Helper Functions
 * Routes to appropriate analysis API based on raw data availability
 */

export interface MatchAnalysisRequest {
  candidate: {
    main: {
      first_name: string
      last_name: string
    }
    skills: Array<{
      name: string
      type: string
      yoe: number | null
      proficiency_level: string | null
    }>
    years_of_experience?: number
    raw_linkedin_profile?: LinkedInProfile
    raw_pdf_profile_text?: string
  }
  job: {
    attributes: {
      title: string
    }
    requirements: Array<{
      requirement: string
      type: string
      is_mandatory: boolean
      proficiency_level: string | null
      weight: number
    }>
  }
}

export interface MatchAnalysisResponse {
  match_analysis: {
    overall_score: number
    status: "strong" | "adequate" | "weak" | "missing"
    overall_feedback: string
    matched_mandatory_requirements: number
    total_mandatory_requirements: number
  }
  requirement_evaluations: Array<{
    requirement_name: string
    score: number
    status: "strong" | "adequate" | "weak" | "missing"
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
  metadata: {
    analysis_timestamp: string
    job_id: string
    candidate_id: string
    algorithm_version: string
    total_processing_time_ms: number
  }
}

/**
 * API endpoint URLs
 */
const MATCH_ANALYSIS_ENDPOINTS = {
  ENHANCED_PDF: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-pdf',
  ENHANCED_LINKEDIN: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-linkedin',
  DEPRECATED_FALLBACK: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis'
} as const

/**
 * Call the enhanced PDF match analysis API
 */
export async function callEnhancedPdfAnalysis(
  request: MatchAnalysisRequest
): Promise<MatchAnalysisResponse> {
  if (!request.candidate.raw_pdf_profile_text) {
    throw new Error('Raw PDF text is required for enhanced PDF analysis')
  }

  const response = await fetch(MATCH_ANALYSIS_ENDPOINTS.ENHANCED_PDF, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Enhanced PDF analysis failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Call the enhanced LinkedIn match analysis API
 */
export async function callEnhancedLinkedInAnalysis(
  request: MatchAnalysisRequest
): Promise<MatchAnalysisResponse> {
  if (!request.candidate.raw_linkedin_profile) {
    throw new Error('Raw LinkedIn profile is required for enhanced LinkedIn analysis')
  }

  const response = await fetch(MATCH_ANALYSIS_ENDPOINTS.ENHANCED_LINKEDIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Enhanced LinkedIn analysis failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Call the deprecated (fallback) match analysis API
 */
export async function callDeprecatedAnalysis(
  request: MatchAnalysisRequest
): Promise<MatchAnalysisResponse> {
  const response = await fetch(MATCH_ANALYSIS_ENDPOINTS.DEPRECATED_FALLBACK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Deprecated analysis failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Determine which analysis API to use based on available raw data
 */
export function determineAnalysisStrategy(
  hasLinkedInRaw: boolean,
  hasResumeRaw: boolean,
  preferenceOrder: 'linkedin-first' | 'pdf-first' = 'linkedin-first'
): {
  strategy: 'enhanced-linkedin' | 'enhanced-pdf' | 'deprecated-fallback'
  reason: string
} {
  // If we have both, use preference order
  if (hasLinkedInRaw && hasResumeRaw) {
    if (preferenceOrder === 'linkedin-first') {
      return {
        strategy: 'enhanced-linkedin',
        reason: 'Both raw data sources available, LinkedIn preferred'
      }
    } else {
      return {
        strategy: 'enhanced-pdf',
        reason: 'Both raw data sources available, PDF preferred'
      }
    }
  }

  // If we only have LinkedIn raw data
  if (hasLinkedInRaw && !hasResumeRaw) {
    return {
      strategy: 'enhanced-linkedin',
      reason: 'LinkedIn raw data available, PDF not available'
    }
  }

  // If we only have resume raw data
  if (!hasLinkedInRaw && hasResumeRaw) {
    return {
      strategy: 'enhanced-pdf',
      reason: 'PDF raw data available, LinkedIn not available'
    }
  }

  // No raw data available, use fallback
  return {
    strategy: 'deprecated-fallback',
    reason: 'No raw data available, using structured data only'
  }
}

/**
 * Build match analysis request from database entities
 */
export function buildMatchAnalysisRequest(
  candidate: Candidate,
  candidateSkills: CandidateSkill[],
  job: Job,
  jobRequirements: JobRequirement[],
  rawData?: {
    linkedInProfile?: LinkedInProfile
    resumeText?: string
  }
): MatchAnalysisRequest {
  return {
    candidate: {
      main: {
        first_name: candidate.first_name || '',
        last_name: candidate.last_name || ''
      },
      skills: candidateSkills.map(skill => ({
        name: skill.skill,
        type: skill.type,
        yoe: skill.years_of_experience,
        proficiency_level: skill.proficiency_level
      })),
      years_of_experience: candidate.years_experience || 0,
      raw_linkedin_profile: rawData?.linkedInProfile,
      raw_pdf_profile_text: rawData?.resumeText
    },
    job: {
      attributes: {
        title: job.title
      },
      requirements: jobRequirements.map(req => ({
        requirement: req.requirement,
        type: req.type,
        is_mandatory: req.is_mandatory,
        proficiency_level: req.proficiency_level,
        weight: req.weight
      }))
    }
  }
}

/**
 * Smart match analysis that automatically chooses the best API
 */
export async function runSmartMatchAnalysis(
  candidate: Candidate,
  candidateSkills: CandidateSkill[],
  job: Job,
  jobRequirements: JobRequirement[],
  rawDataSources: {
    hasLinkedIn: boolean
    hasResume: boolean
    linkedInData?: CandidatesLinkedInRawRow
    resumeData?: CandidatesResumeRawRow
  },
  options?: {
    preferenceOrder?: 'linkedin-first' | 'pdf-first'
    fallbackOnError?: boolean
  }
): Promise<{
  result: MatchAnalysisResponse
  strategy: string
  reason: string
}> {
  const { strategy, reason } = determineAnalysisStrategy(
    rawDataSources.hasLinkedIn,
    rawDataSources.hasResume,
    options?.preferenceOrder
  )

  // Prepare raw data
  const rawData = {
    linkedInProfile: rawDataSources.linkedInData?.content as LinkedInProfile | undefined,
    resumeText: rawDataSources.resumeData?.content as string | undefined
  }

  // Build request
  const request = buildMatchAnalysisRequest(
    candidate,
    candidateSkills,
    job,
    jobRequirements,
    rawData
  )

  try {
    let result: MatchAnalysisResponse

    switch (strategy) {
      case 'enhanced-linkedin':
        result = await callEnhancedLinkedInAnalysis(request)
        break
      case 'enhanced-pdf':
        result = await callEnhancedPdfAnalysis(request)
        break
      case 'deprecated-fallback':
        result = await callDeprecatedAnalysis(request)
        break
      default:
        throw new Error(`Unknown analysis strategy: ${strategy}`)
    }

    return { result, strategy, reason }

  } catch (error) {
    console.error(`Match analysis failed with strategy ${strategy}:`, error)

    // If fallback is enabled and we weren't already using deprecated API
    if (options?.fallbackOnError && strategy !== 'deprecated-fallback') {
      console.log('Attempting fallback to deprecated analysis API...')
      
      try {
        const fallbackResult = await callDeprecatedAnalysis(request)
        return {
          result: fallbackResult,
          strategy: 'deprecated-fallback',
          reason: `Fallback after ${strategy} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      } catch (fallbackError) {
        throw new Error(`Both primary (${strategy}) and fallback analysis failed. Primary: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
      }
    }

    throw error
  }
}
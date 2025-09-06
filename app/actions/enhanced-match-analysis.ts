"use server"

import { createClient } from "@/lib/supabase/server"
import { getCandidateRawDataSources } from "@/lib/candidates/raw-data"
import { unstable_noStore as noStore } from "next/cache"
import type { LinkedInProfile } from "@/types/linkedin.types"
import type { Database } from "@/types/database.types"

type Candidate = Database["public"]["Tables"]["candidates"]["Row"]
type CandidateSkill = Database["public"]["Tables"]["candidates_skills"]["Row"]
type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  seniority_level?: string | null
}
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

// API Response Types
export interface MatchAnalysisResponse {
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
  metadata: {
    analysis_timestamp: string
    job_id: string
    candidate_id: string
    algorithm_version: string
    total_processing_time_ms: number
  }
}

export interface EnhancedMatchAnalysisResult {
  success: boolean
  data?: MatchAnalysisResponse & {
    analysisMetadata: {
      strategy: string
      reason: string
      rawDataSources: {
        hasLinkedIn: boolean
        hasResume: boolean
      }
    }
  }
  error?: string
}

/**
 * API endpoints for v2 match analysis functions
 */
const MATCH_ANALYSIS_ENDPOINTS = {
  ENHANCED_PDF: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-pdf-v2',
  ENHANCED_LINKEDIN: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-linkedin-v2',
  FALLBACK: 'https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-fallback-v2'
} as const

/**
 * Determine which analysis strategy to use based on available data
 */
function determineAnalysisStrategy(
  hasLinkedInRaw: boolean,
  hasResumeRaw: boolean,
  preferenceOrder: 'linkedin-first' | 'pdf-first' = 'linkedin-first'
): {
  strategy: 'enhanced-linkedin' | 'enhanced-pdf' | 'fallback'
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
    strategy: 'fallback',
    reason: 'No raw data available, using structured data only'
  }
}

/**
 * Build match analysis request from database entities
 */
function buildMatchAnalysisRequest(
  candidate: Candidate,
  candidateSkills: CandidateSkill[],
  job: Job,
  jobRequirements: JobRequirement[],
  rawData?: {
    linkedInProfile?: LinkedInProfile
    resumeText?: string
  }
): Record<string, unknown> {
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
        title: job.title,
        seniorityLevel: job.seniority_level || null
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
 * Call Supabase Edge Function with proper server-side authentication
 */
async function callMatchAnalysisAPI(
  endpoint: string,
  request: Record<string, unknown>
): Promise<MatchAnalysisResponse> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API call failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Server action to run enhanced match analysis
 */
export async function runEnhancedMatchAnalysis(
  candidateId: string,
  jobId: string,
  options?: {
    preferenceOrder?: 'linkedin-first' | 'pdf-first'
    fallbackOnError?: boolean
  }
): Promise<EnhancedMatchAnalysisResult> {
  noStore() // Prevent caching for user-specific data

  try {
    const supabase = await createClient()

    // Get candidate data with skills
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (candidateError || !candidate) {
      return {
        success: false,
        error: `Failed to fetch candidate: ${candidateError?.message || 'Not found'}`
      }
    }

    // Get candidate skills
    const { data: candidateSkills, error: skillsError } = await supabase
      .from('candidates_skills')
      .select('*')
      .eq('candidate_id', candidateId)

    if (skillsError) {
      return {
        success: false,
        error: `Failed to fetch candidate skills: ${skillsError.message}`
      }
    }

    // Get job data with requirements
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        error: `Failed to fetch job: ${jobError?.message || 'Not found'}`
      }
    }

    // Get job requirements
    const { data: jobRequirements, error: requirementsError } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', jobId)

    if (requirementsError) {
      return {
        success: false,
        error: `Failed to fetch job requirements: ${requirementsError.message}`
      }
    }

    if (!jobRequirements || jobRequirements.length === 0) {
      return {
        success: false,
        error: 'No job requirements found for this position'
      }
    }

    // Check for raw data availability
    const rawDataSources = await getCandidateRawDataSources(candidateId)

    // Determine analysis strategy
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
      candidateSkills || [],
      job,
      jobRequirements,
      rawData
    )

    // Call appropriate API with fallback logic
    let result: MatchAnalysisResponse
    
    try {
      let endpoint: string
      
      switch (strategy) {
        case 'enhanced-linkedin':
          endpoint = MATCH_ANALYSIS_ENDPOINTS.ENHANCED_LINKEDIN
          break
        case 'enhanced-pdf':
          endpoint = MATCH_ANALYSIS_ENDPOINTS.ENHANCED_PDF
          break
        case 'fallback':
        default:
          endpoint = MATCH_ANALYSIS_ENDPOINTS.FALLBACK
          break
      }

      result = await callMatchAnalysisAPI(endpoint, request)

    } catch (error) {
      console.error(`Match analysis failed with strategy ${strategy}:`, error)

      // If fallback is enabled and we weren't already using fallback API
      if (options?.fallbackOnError && strategy !== 'fallback') {
        console.log('Attempting fallback to fallback analysis API...')
        
        try {
          result = await callMatchAnalysisAPI(MATCH_ANALYSIS_ENDPOINTS.FALLBACK, request)
        } catch (fallbackError) {
          return {
            success: false,
            error: `Both primary (${strategy}) and fallback analysis failed. Primary: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
          }
        }
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed with unknown error'
        }
      }
    }

    return {
      success: true,
      data: {
        ...result,
        analysisMetadata: {
          strategy,
          reason,
          rawDataSources: {
            hasLinkedIn: rawDataSources.hasLinkedIn,
            hasResume: rawDataSources.hasResume
          }
        }
      }
    }

  } catch (error) {
    console.error('Enhanced match analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Server action to save a new candidate during match analysis
 * This allows capturing raw data when analyzing candidates that don't exist yet
 */
export async function saveNewCandidateWithRawData(
  candidateData: {
    firstName: string
    lastName: string
    email?: string
    yearsOfExperience?: number
    country?: string
  },
  skills: Array<{
    name: string
    type: string
    yearsOfExperience?: number
    proficiencyLevel?: string
  }>,
  rawData: {
    linkedInProfile?: Record<string, unknown>
    linkedInUrl?: string
    resumeText?: string
    resumeUrl?: string
    tempFilePath?: string
    fileName?: string
    fileSize?: number
  },
  source: "linkedin" | "pdf"
): Promise<{
  success: boolean
  candidateId?: string
  error?: string
}> {
  noStore() // Prevent caching for user-specific data

  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }


    // Create candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        first_name: candidateData.firstName,
        last_name: candidateData.lastName,
        email: candidateData.email || null,
        linkedin: rawData.linkedInUrl || null,
        resume_url: rawData.resumeUrl || null,
        years_experience: candidateData.yearsOfExperience || null,
        country: candidateData.country || null,
        user_id: user.id
      })
      .select('id')
      .single()

    if (candidateError || !candidate) {
      return {
        success: false,
        error: `Failed to create candidate: ${candidateError?.message || 'Unknown error'}`
      }
    }

    const candidateId = candidate.id

    // Move temp PDF file to permanent location and get final URL
    let finalResumeUrl = rawData.resumeUrl // Default to original URL
    if (rawData.tempFilePath) {
      const { moveTempResumeToCandidate } = await import("@/app/actions/candidates")
      try {
        const moveResult = await moveTempResumeToCandidate(rawData.tempFilePath, candidateId)
        if (moveResult.success && moveResult.finalUrl) {
          // Update candidate with final resume URL
          const { updateCandidateResumeUrl } = await import("@/app/actions/candidates")
          await updateCandidateResumeUrl(candidateId, moveResult.finalUrl)
          finalResumeUrl = moveResult.finalUrl // Use the final URL for raw data storage
          console.log('Successfully moved temp PDF to permanent location')
        } else {
          console.error('Failed to move temp PDF file:', moveResult.error)
          // Don't fail the whole operation, but log the issue
        }
      } catch (moveError) {
        console.error('Error moving temp PDF file:', moveError)
        // Don't fail the whole operation
      }
    }

    // Insert skills
    if (skills.length > 0) {
      // Map match analysis source to database source values
      const dbSource = source === "linkedin" ? "linkedin" : "resume"
      
      const skillInserts = skills.map(skill => ({
        candidate_id: candidateId,
        skill: skill.name,
        type: skill.type || 'technical_skill',
        source: dbSource, // Use mapped source based on match analysis method
        years_of_experience: skill.yearsOfExperience || null,
        proficiency_level: skill.proficiencyLevel || null
      }))

      const { error: skillsError } = await supabase
        .from('candidates_skills')
        .insert(skillInserts)

      if (skillsError) {
        // Try to cleanup candidate if skills failed
        await supabase.from('candidates').delete().eq('id', candidateId)
        return {
          success: false,
          error: `Failed to save candidate skills: ${skillsError.message}`
        }
      }
    }

    // Store raw data if provided
    const rawDataPromises = []

    if (rawData.linkedInProfile) {
      const { storeLinkedInRawData } = await import("@/lib/candidates/raw-data")
      rawDataPromises.push(
        storeLinkedInRawData(candidateId, rawData.linkedInProfile, rawData.linkedInUrl)
      )
    }

    if (rawData.resumeText) {
      const { storeResumeRawData } = await import("@/lib/candidates/raw-data")
      rawDataPromises.push(
        storeResumeRawData(candidateId, rawData.resumeText, {
          url: finalResumeUrl, // Use the final permanent URL, not the temp one
          fileName: rawData.fileName,
          fileSize: rawData.fileSize
        })
      )
    }

    // Wait for raw data storage (but don't fail the whole operation if this fails)
    if (rawDataPromises.length > 0) {
      try {
        await Promise.all(rawDataPromises)
      } catch (rawDataError) {
        console.error('Failed to store raw data, but candidate was created:', rawDataError)
        // Continue without failing - the candidate was created successfully
      }
    }

    return {
      success: true,
      candidateId
    }

  } catch (error) {
    console.error('Save new candidate with raw data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
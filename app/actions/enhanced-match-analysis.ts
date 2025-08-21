"use server"

import { createClient } from "@/lib/supabase/server"
import { getCandidateRawDataSources } from "@/lib/candidates/raw-data"
import { runSmartMatchAnalysis } from "@/lib/api/enhanced-match-analysis"
import type { MatchAnalysisResponse } from "@/lib/api/enhanced-match-analysis"
import { unstable_noStore as noStore } from "next/cache"

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

    // Run smart match analysis
    const analysisResult = await runSmartMatchAnalysis(
      candidate,
      candidateSkills || [],
      job,
      jobRequirements,
      rawDataSources,
      {
        preferenceOrder: options?.preferenceOrder || 'linkedin-first',
        fallbackOnError: options?.fallbackOnError ?? true
      }
    )

    return {
      success: true,
      data: {
        ...analysisResult.result,
        analysisMetadata: {
          strategy: analysisResult.strategy,
          reason: analysisResult.reason,
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
/**
 * Fallback Match Analysis API (formerly Enhanced Match Analysis v3)
 * Processes existing candidate data using unified matching engine
 * Used when LinkedIn/PDF data is not available
 * 
 * Updated: 2025-08-27 - Fixed mandatory requirement counting (only 'strong' = met)
 * Updated: 2025-01-05 01:15 - Deployed with enhanced role matching capabilities
 * - Now benefits from improved role-type skill matching
 * - Includes role qualification checks (e.g., CTO qualifies for Tech Lead)
 * - Uses updated skill registry with comprehensive role aliases
 * - Will match roles if they were saved in candidate skills during import
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { 
  analyzeCandidate, 
  processExistingCandidate,
  MatchAnalysisResult,
  Candidate 
} from '../_shared/core-matching-engine.ts'
import { JobRequirement, CandidateSkill } from '../_shared/skill-matcher.ts'
import { generateNarrativeOutputs } from '../_shared/narrative-generator.ts'
import { 
  detectCandidateSeniority, 
  getCandidateYearsOfExperience 
} from '../_shared/seniority-detector.ts'
import { 
  matchSeniority, 
  applySeniorityPenalty,
  adjustCategoryForSeniority,
  generateSeniorityRecommendations
} from '../_shared/seniority-matcher.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// OpenAI configuration for semantic matching
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body - expecting legacy format { candidate, job }
    const { candidate: candidateData, job } = await req.json()

    console.log('[Fallback API] Received candidate data')
    console.log('[Fallback API] Candidate structure:', {
      hasMain: !!candidateData?.main,
      mainName: `${candidateData?.main?.first_name} ${candidateData?.main?.last_name}`,
      skillsCount: candidateData?.skills?.length || 0,
      yearsExp: candidateData?.years_of_experience,
      hasRawLinkedIn: !!candidateData?.raw_linkedin_profile
    })

    // Extract data from legacy format
    const jobRequirements = job?.requirements || []
    const jobInfo = {
      id: 'temp-job-id', // Job ID not provided in this format
      title: job?.attributes?.title || 'Unknown Position',
      company: job?.attributes?.company || 'Unknown Company'
    }

    // Validate required fields
    if (!candidateData || !candidateData.skills) {
      throw new Error('Candidate data with skills is required')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!job || !job.attributes || !job.attributes.title) {
      throw new Error('Job information is required')
    }

    console.log('[Fallback API] Processing existing candidate for job:', jobInfo.title)
    console.log(`[Fallback API] Candidate has ${candidateData.skills.length} skills`)

    // Step 1: Convert candidate data to unified format
    const skills = candidateData.skills || []
    console.log('[Fallback API] Converting skills:', skills.length, 'skills found')
    
    const candidate: Candidate = {
      firstName: candidateData.main?.first_name || 'Unknown',
      lastName: candidateData.main?.last_name || '',
      email: candidateData.main?.email,
      yearsOfExperience: candidateData.years_of_experience || 0,
      skills: skills.map(skill => ({
        name: skill.name,
        yearsOfExperience: skill.yoe,
        proficiency: skill.proficiency_level,
        source: skill.source || 'database'
      }))
    }

    console.log(`[Fallback API] Converted ${candidate.skills.length} skills`)

    // Step 1.5: Detect candidate seniority from existing data
    const titleSkills = candidate.skills
      .filter(skill => skill.name && typeof skill.name === 'string')
      .filter(skill => /(?:lead|manager|director|senior|junior|principal|staff|architect|engineer|developer|analyst|specialist|coordinator|assistant|associate)/i.test(skill.name))
    
    const extractedTitles = titleSkills.map(skill => skill.name).slice(0, 5) // Top 5 relevant titles
    
    const roleSkills = candidate.skills
      .filter(skill => skill.source === 'role' || /(?:lead|manager|director|senior|junior|principal|staff|architect|engineer|developer|analyst|specialist|coordinator|assistant|associate)/i.test(skill.name || ''))
    
    const extractedRoles = roleSkills
      .map(skill => ({
        title: skill.name || '',
        duration: skill.yearsOfExperience ? skill.yearsOfExperience * 12 : undefined
      }))
      .filter(role => role.title)

    console.log('[Fallback API] Seniority Detection Input:', {
      currentTitle: candidateData.main?.job_title || candidateData.main?.current_position || 'Not available',
      totalSkillsCount: candidate.skills.length,
      titleSkillsCount: titleSkills.length,
      roleSkillsCount: roleSkills.length,
      extractedTitles: extractedTitles,
      candidateYearsOfExperience: candidate.yearsOfExperience,
      rawDataAvailable: {
        hasLinkedIn: !!candidateData.raw_linkedin_profile,
        hasResume: !!candidateData.raw_pdf_profile_text
      },
      rolesWithDuration: extractedRoles.map(role => ({
        title: role.title,
        durationMonths: role.duration || 'Unknown'
      }))
    })

    const candidateSeniority = detectCandidateSeniority({
      currentTitle: candidateData.main?.job_title || candidateData.main?.current_position,
      titles: extractedTitles,
      yearsOfExperience: candidate.yearsOfExperience,
      roles: extractedRoles
    })

    console.log('[Fallback API] Seniority Detection Result:', {
      detectedLevel: candidateSeniority.level,
      confidence: candidateSeniority.confidence,
      source: candidateSeniority.source,
      candidateYears: candidateSeniority.yearsOfExperience,
      detectionMethod: candidateSeniority.source,
      fallbackReason: 'Using structured database data only'
    })

    // Step 2: Set up raw data sources
    const rawData = {
      linkedInProfile: candidateData.raw_linkedin_profile,
      linkedInUrl: candidateData.linkedin_url,
      resumeText: candidateData.raw_pdf_profile_text,
      resumeUrl: candidateData.resume_url
    }

    // Step 3: Format job requirements for unified engine
    const formattedRequirements: JobRequirement[] = jobRequirements.map(req => ({
      id: req.requirement,
      skill: req.requirement,
      yearsRequired: req.years_of_experience || null,
      proficiencyRequired: req.proficiency_level,
      importance: req.is_mandatory ? 'mandatory' : 'optional',
      category: req.type || 'technical_skill'
    }))

    // Step 4: Run unified analysis
    const analysisResult = await analyzeCandidate(
      candidate,
      {
        id: jobInfo.id || 'temp-job-id',
        title: jobInfo.title,
        company: jobInfo.company || 'Unknown Company',
        requirements: formattedRequirements
      },
      rawData,
      {
        useSemanticFallback: true,
        analysisVersion: 'fallback-v2.0-unified'
      }
    )

    // Step 4.5: Perform seniority matching
    const requiredSeniorityLevel = job?.attributes?.seniorityLevel || null
    
    console.log('[Fallback API] Seniority Matching Input:', {
      jobTitle: job?.attributes?.title,
      requiredSeniorityLevel: requiredSeniorityLevel,
      candidateDetectedLevel: candidateSeniority.level,
      candidateYears: candidateSeniority.yearsOfExperience,
      matchingEnabled: requiredSeniorityLevel !== null,
      analysisMethod: 'fallback_database_only'
    })

    const seniorityMatchResult = matchSeniority(
      candidateSeniority.level,
      requiredSeniorityLevel,
      candidateSeniority.yearsOfExperience
    )

    console.log('[Fallback API] Seniority Matching Result:', {
      required: seniorityMatchResult.required,
      candidate: seniorityMatchResult.candidate,
      isMatch: seniorityMatchResult.match,
      matchScore: seniorityMatchResult.score,
      isOverqualified: seniorityMatchResult.isOverqualified,
      isUnderqualified: seniorityMatchResult.isUnderqualified,
      feedback: seniorityMatchResult.feedback
    })

    // Apply seniority penalty to overall score if there's a mismatch
    let adjustedScore = analysisResult.overallScore.totalScore
    let adjustedCategory = analysisResult.overallScore.category
    
    console.log('[Fallback API] Score Adjustment Input:', {
      originalScore: analysisResult.overallScore.totalScore,
      originalCategory: analysisResult.overallScore.category,
      seniorityScore: seniorityMatchResult.score,
      requiresPenalty: seniorityMatchResult.required && seniorityMatchResult.score < 0.8,
      penaltyThreshold: 0.8,
      penaltyWeight: 0.3
    })
    
    if (seniorityMatchResult.required && seniorityMatchResult.score < 0.8) {
      adjustedScore = applySeniorityPenalty(
        analysisResult.overallScore.totalScore,
        seniorityMatchResult.score,
        0.3 // 30% weight for seniority
      )
      adjustedCategory = adjustCategoryForSeniority(
        analysisResult.overallScore.category,
        seniorityMatchResult.score
      )
      
      console.log('[Fallback API] Score Adjustment Applied:', {
        originalScore: analysisResult.overallScore.totalScore,
        adjustedScore: adjustedScore,
        scoreDifference: analysisResult.overallScore.totalScore - adjustedScore,
        penaltyPercentage: ((analysisResult.overallScore.totalScore - adjustedScore) / analysisResult.overallScore.totalScore * 100).toFixed(1) + '%',
        originalCategory: analysisResult.overallScore.category,
        adjustedCategory: adjustedCategory,
        categoryChanged: analysisResult.overallScore.category !== adjustedCategory
      })
    } else {
      console.log('[Fallback API] No Score Adjustment:', {
        reason: seniorityMatchResult.required ? 'Seniority score above penalty threshold' : 'No seniority requirement specified',
        finalScore: adjustedScore,
        finalCategory: adjustedCategory
      })
    }

    // Update analysis result with adjusted values
    analysisResult.overallScore.totalScore = adjustedScore
    analysisResult.overallScore.category = adjustedCategory

    // Step 5: Generate narrative outputs using dedicated module
    console.log('[Fallback API] Generating narrative outputs...')
    const narrativeOutputs = await generateNarrativeOutputs(
      analysisResult,
      jobInfo.title,
      {
        focusOnProficiency: true,
        includeInterviewStrategy: true,
        maxStrengths: 5,
        maxGaps: 5,
        maxRecommendations: 4
      }
    )

    // Add seniority-specific recommendations
    const seniorityRecommendations = generateSeniorityRecommendations(seniorityMatchResult)
    if (seniorityRecommendations.length > 0) {
      // Merge with existing recommendations, prioritizing seniority insights
      narrativeOutputs.recruiter_recommendations.interview_strategy = [
        ...seniorityRecommendations,
        ...narrativeOutputs.recruiter_recommendations.interview_strategy
      ].slice(0, 6) // Keep max 6 recommendations
    }

    // Step 6: Format response for backward compatibility
    const response = formatFallbackResponse(
      analysisResult, 
      candidate, 
      candidateData, 
      narrativeOutputs,
      seniorityMatchResult
    )

    console.log('[Fallback API] Analysis complete:', {
      score: analysisResult.overallScore.totalScore,
      category: analysisResult.overallScore.category
    })

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('[Fallback API] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})


/**
 * Format response for backward compatibility with existing frontend
 */
function formatFallbackResponse(
  analysisResult: MatchAnalysisResult,
  candidate: any,
  originalCandidateData: any,
  narrativeOutputs: any,
  seniorityMatchResult?: any
): any {
  // Count mandatory requirements for frontend compatibility
  const mandatoryMatches = analysisResult.detailedMatches.mandatory
  const totalMandatory = mandatoryMatches.length
  const matchedMandatory = mandatoryMatches.filter(match => 
    match.category === 'fit'
  ).length

  const response: any = {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
      linkedInUrl: originalCandidateData.linkedin_url,
      resumeUrl: originalCandidateData.resume_url,
      skills: candidate.skills,
      experience: analysisResult.candidateInfo.yearsOfExperience
    },
    match_analysis: {
      overall_score: analysisResult.overallScore.totalScore,
      status: analysisResult.overallScore.category,
      overall_feedback: narrativeOutputs.overall_feedback,
      matched_mandatory_requirements: matchedMandatory,
      total_mandatory_requirements: totalMandatory
    },
    requirement_evaluations: narrativeOutputs.requirement_evaluations,
    summary: narrativeOutputs.summary,
    recruiter_recommendations: narrativeOutputs.recruiter_recommendations,
    metadata: {
      analysis_timestamp: new Date().toISOString(),
      job_id: 'temp-job-id',
      candidate_id: analysisResult.candidateInfo.id || 'temp-candidate-id',
      algorithm_version: 'fallback-v2.0-unified',
      total_processing_time_ms: analysisResult.metadata?.processingTime || 0,
      data_source: 'existing' // Indicate this used existing database data
    }
  }

  // Add seniority analysis if performed
  if (seniorityMatchResult) {
    response.seniority_analysis = {
      required: seniorityMatchResult.required,
      candidate: seniorityMatchResult.candidate,
      candidateYears: seniorityMatchResult.candidateYears,
      match: seniorityMatchResult.match,
      score: seniorityMatchResult.score,
      feedback: seniorityMatchResult.feedback
    }
  }

  return response
}
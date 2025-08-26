/**
 * Fallback Match Analysis API (formerly Enhanced Match Analysis v3)
 * Processes existing candidate data using unified matching engine
 * Used when LinkedIn/PDF data is not available
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { 
  analyzeCandidate, 
  processExistingCandidate,
  MatchAnalysisResult 
} from './shared/core-matching-engine.ts'
import { JobRequirement, CandidateSkill } from './shared/skill-matcher.ts'

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
    // Parse request body
    const { 
      candidateData,
      candidateSkills,
      jobRequirements,
      jobInfo,
      options = {}
    } = await req.json()

    // Validate required fields
    if (!candidateData) {
      throw new Error('Candidate data is required')
    }
    if (!candidateSkills || !Array.isArray(candidateSkills)) {
      throw new Error('Candidate skills array is required')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!jobInfo) {
      throw new Error('Job information is required')
    }

    console.log('[Fallback API] Processing existing candidate for job:', jobInfo.title)
    console.log(`[Fallback API] Candidate has ${candidateSkills.length} skills`)

    // Step 1: Process existing candidate data into standard format
    const { candidate, rawData } = processExistingCandidate(
      candidateData,
      candidateSkills
    )

    // Step 2: Check for and fetch any stored raw data
    const enrichedRawData = await fetchStoredRawData(
      candidateData.id,
      rawData
    )

    // Step 3: Format job requirements for unified engine
    const formattedRequirements: JobRequirement[] = jobRequirements.map(req => ({
      id: req.id || req.skill,
      skill: req.skill,
      yearsRequired: req.years_of_experience,
      proficiencyRequired: req.proficiency_level,
      importance: req.importance || 'mandatory',
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
      enrichedRawData,
      {
        useSemanticFallback: options.useSemanticFallback ?? true,
        analysisVersion: 'fallback-v2.0-unified'
      }
    )

    // Step 5: Store analysis results if candidate ID is provided
    if (candidateData.id && jobInfo.id) {
      await storeAnalysisResults(
        candidateData.id,
        jobInfo.id,
        analysisResult
      )
    }

    // Step 6: Format response for backward compatibility
    const response = formatFallbackResponse(analysisResult, candidate, candidateData)

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
 * Fetch any stored raw data for the candidate
 */
async function fetchStoredRawData(
  candidateId: string,
  basicRawData: any
): Promise<any> {
  try {
    // Check for stored LinkedIn raw data
    const { data: linkedInData } = await supabase
      .from('candidate_raw_data')
      .select('data')
      .eq('candidate_id', candidateId)
      .eq('source', 'linkedin')
      .single()
    
    // Check for stored resume raw data
    const { data: resumeData } = await supabase
      .from('candidate_raw_data')
      .select('data')
      .eq('candidate_id', candidateId)
      .eq('source', 'resume')
      .single()
    
    return {
      ...basicRawData,
      linkedInProfile: linkedInData?.data,
      resumeText: resumeData?.data?.text
    }
  } catch (error) {
    console.log('[Fallback API] No raw data found for candidate:', candidateId)
    return basicRawData
  }
}

/**
 * Store analysis results for future reference
 */
async function storeAnalysisResults(
  candidateId: string,
  jobId: string,
  analysisResult: MatchAnalysisResult
): Promise<void> {
  try {
    const { error } = await supabase
      .from('match_analyses')
      .upsert({
        candidate_id: candidateId,
        job_id: jobId,
        overall_score: analysisResult.overallScore.totalScore,
        status: analysisResult.overallScore.category,
        mandatory_score: analysisResult.overallScore.mandatory.score,
        optional_bonus: analysisResult.overallScore.optional.bonus,
        confidence: analysisResult.overallScore.confidence,
        analysis_version: analysisResult.metadata.analysisVersion,
        detailed_results: analysisResult,
        analyzed_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('[Fallback API] Failed to store analysis:', error)
    } else {
      console.log('[Fallback API] Analysis results stored successfully')
    }
  } catch (error) {
    console.error('[Fallback API] Error storing analysis:', error)
  }
}

/**
 * Format response for backward compatibility with existing frontend
 */
function formatFallbackResponse(
  analysisResult: MatchAnalysisResult,
  candidate: any,
  originalCandidateData: any
): any {
  return {
    success: true,
    candidate: {
      id: candidate.id,
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
      skills: candidate.skills,
      experience: analysisResult.candidateInfo.yearsOfExperience,
      linkedInUrl: originalCandidateData.linkedin,
      resumeUrl: originalCandidateData.resume_url
    },
    analysis: {
      overallScore: analysisResult.overallScore.totalScore,
      status: analysisResult.overallScore.category,
      mandatoryScore: analysisResult.overallScore.mandatory.score,
      optionalBonus: analysisResult.overallScore.optional.bonus,
      confidence: analysisResult.overallScore.confidence,
      explanation: analysisResult.overallScore.explanation
    },
    matches: {
      mandatory: analysisResult.detailedMatches.mandatory.map(match => ({
        requirement: match.requirement.skill,
        score: match.score,
        status: match.category,
        evidence: match.evidence,
        matchedSkills: match.matchedSkills,
        confidence: match.confidence
      })),
      optional: analysisResult.detailedMatches.optional.map(match => ({
        requirement: match.requirement.skill,
        score: match.score,
        status: match.category,
        evidence: match.evidence,
        matchedSkills: match.matchedSkills,
        confidence: match.confidence
      }))
    },
    metadata: analysisResult.metadata,
    dataSource: 'existing' // Indicate this used existing database data
  }
}
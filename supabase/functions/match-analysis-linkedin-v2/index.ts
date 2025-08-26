/**
 * LinkedIn Match Analysis API
 * Processes LinkedIn profile data using unified matching engine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { 
  analyzeCandidate, 
  processLinkedInData,
  MatchAnalysisResult 
} from '../_shared/core-matching-engine.ts'
import { JobRequirement, CandidateSkill } from '../_shared/skill-matcher.ts'

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body - expecting legacy format { candidate, job }
    const { candidate: parsedCandidate, job } = await req.json()

    console.log('[LinkedIn API] Received parsed candidate data')
    console.log('[LinkedIn API] Parsed candidate structure:', {
      hasMain: !!parsedCandidate?.main,
      mainName: `${parsedCandidate?.main?.first_name} ${parsedCandidate?.main?.last_name}`,
      skillsCount: parsedCandidate?.skills?.length || 0,
      yearsExp: parsedCandidate?.years_of_experience,
      skillsPreview: parsedCandidate?.skills?.slice(0, 3)
    })

    // Extract data from legacy format
    const linkedInProfile = parsedCandidate?.raw_linkedin_profile
    const jobRequirements = job?.requirements || []
    const jobInfo = {
      id: 'temp-job-id', // Job ID not provided in this format
      title: job?.attributes?.title || 'Unknown Position',
      company: job?.attributes?.company || 'Unknown Company'
    }

    // Validate required fields
    if (!parsedCandidate || !parsedCandidate.skills) {
      throw new Error('Parsed candidate data with skills is required')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!job || !job.attributes || !job.attributes.title) {
      throw new Error('Job information is required')
    }

    console.log('[LinkedIn API] Processing match analysis for job:', jobInfo.title)

    // Step 1: Convert parsed candidate to unified format
    const skills = parsedCandidate.skills || []
    console.log('[LinkedIn API] Converting skills:', skills.length, 'skills found')
    
    const candidate: Candidate = {
      firstName: parsedCandidate.main?.first_name || 'Unknown',
      lastName: parsedCandidate.main?.last_name || '',
      email: parsedCandidate.main?.email,
      yearsOfExperience: parsedCandidate.years_of_experience || 0,
      skills: skills.map(skill => ({
        name: skill.name,
        yearsOfExperience: skill.yoe,
        proficiency: skill.proficiency_level,
        source: skill.source || 'parsed'
      }))
    }

    console.log(`[LinkedIn API] Converted ${candidate.skills.length} parsed skills`)

    // Step 2: Format job requirements for unified engine
    const formattedRequirements: JobRequirement[] = jobRequirements.map(req => ({
      id: req.requirement,
      skill: req.requirement,
      yearsRequired: req.years_of_experience || null,
      proficiencyRequired: req.proficiency_level,
      importance: req.is_mandatory ? 'mandatory' : 'optional',
      category: req.type || 'technical_skill'
    }))

    // Step 3: Run unified analysis with parsed candidate
    const rawData = {
      linkedInProfile,
      linkedInUrl: parsedCandidate.linkedin_url
    }
    
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
        analysisVersion: 'linkedin-v2.0-unified'
      }
    )

    // Step 4: Format response for backward compatibility  
    const response = formatLinkedInResponse(analysisResult, candidate, linkedInProfile)

    console.log('[LinkedIn API] Analysis complete:', {
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
    console.error('[LinkedIn API] Error:', error)
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
function formatLinkedInResponse(
  analysisResult: MatchAnalysisResult,
  candidate: any,
  linkedInProfile: any
): any {
  // Count mandatory requirements for frontend compatibility
  const mandatoryMatches = analysisResult.detailedMatches.mandatory
  const totalMandatory = mandatoryMatches.length
  const matchedMandatory = mandatoryMatches.filter(match => 
    match.category === 'strong' || match.category === 'adequate'
  ).length

  return {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
      linkedInUrl: linkedInProfile.url || linkedInProfile.publicUrl,
      skills: candidate.skills,
      experience: analysisResult.candidateInfo.yearsOfExperience
    },
    match_analysis: {
      overall_score: analysisResult.overallScore.totalScore,
      status: analysisResult.overallScore.category,
      overall_feedback: analysisResult.overallScore.explanation,
      matched_mandatory_requirements: matchedMandatory,
      total_mandatory_requirements: totalMandatory
    },
    requirement_evaluations: [
      ...analysisResult.detailedMatches.mandatory.map(match => ({
        requirement_name: match.requirement.skill,
        score: match.score,
        status: match.category,
        feedback: match.evidence
      })),
      ...analysisResult.detailedMatches.optional.map(match => ({
        requirement_name: match.requirement.skill,
        score: match.score,
        status: match.category,
        feedback: match.evidence
      }))
    ],
    summary: {
      strengths: analysisResult.overallScore.strengths || [],
      gaps: analysisResult.overallScore.gaps || []
    },
    recruiter_recommendations: {
      interview_strategy: analysisResult.overallScore.interviewStrategy || [],
      other_options: analysisResult.overallScore.otherOptions || []
    },
    metadata: {
      analysis_timestamp: new Date().toISOString(),
      job_id: 'temp-job-id',
      candidate_id: analysisResult.candidateInfo.id || 'temp-candidate-id',
      algorithm_version: 'linkedin-v2.0-unified',
      total_processing_time_ms: analysisResult.metadata?.processingTime || 0
    }
  }
}
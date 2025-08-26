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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { 
      linkedInProfile,
      linkedInUrl,
      jobRequirements,
      jobInfo,
      options = {}
    } = await req.json()

    // Validate required fields
    if (!linkedInProfile) {
      throw new Error('LinkedIn profile data is required')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!jobInfo) {
      throw new Error('Job information is required')
    }

    console.log('[LinkedIn API] Processing profile for job:', jobInfo.title)

    // Step 1: Process LinkedIn data into standard format
    const { candidate, rawData } = processLinkedInData(linkedInProfile)
    
    // Add LinkedIn URL if provided
    if (linkedInUrl) {
      rawData.linkedInUrl = linkedInUrl
    }

    console.log(`[LinkedIn API] Extracted ${candidate.skills.length} skills from profile`)

    // Step 2: Parse skills with proficiency from LinkedIn data
    const enrichedSkills = await enrichLinkedInSkills(
      candidate.skills,
      linkedInProfile
    )
    candidate.skills = enrichedSkills

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
      rawData,
      {
        useSemanticFallback: options.useSemanticFallback ?? true,
        analysisVersion: 'linkedin-v2.0-unified'
      }
    )

    // Step 5: Format response for backward compatibility
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
 * Enrich LinkedIn skills with additional context
 */
async function enrichLinkedInSkills(
  skills: CandidateSkill[],
  linkedInProfile: any
): Promise<CandidateSkill[]> {
  const enrichedSkills: CandidateSkill[] = []
  
  // Try to extract years of experience from work history
  const workHistory = linkedInProfile.experience || []
  const skillYears = new Map<string, number>()
  
  for (const job of workHistory) {
    if (!job.description) continue
    
    // Calculate job duration
    const startDate = job.startDate ? new Date(job.startDate) : null
    const endDate = job.endDate === 'Present' ? new Date() : 
                   job.endDate ? new Date(job.endDate) : null
    
    if (!startDate || !endDate) continue
    
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    
    // Look for skills mentioned in job description
    for (const skill of skills) {
      const skillName = skill.name.toLowerCase()
      const description = job.description.toLowerCase()
      
      if (description.includes(skillName)) {
        const currentYears = skillYears.get(skillName) || 0
        skillYears.set(skillName, currentYears + years)
      }
    }
  }
  
  // Enrich skills with calculated years
  for (const skill of skills) {
    const years = skillYears.get(skill.name.toLowerCase())
    enrichedSkills.push({
      ...skill,
      yearsOfExperience: years ? Math.round(years * 10) / 10 : null,
      source: 'linkedin'
    })
  }
  
  return enrichedSkills
}

/**
 * Format response for backward compatibility with existing frontend
 */
function formatLinkedInResponse(
  analysisResult: MatchAnalysisResult,
  candidate: any,
  linkedInProfile: any
): any {
  return {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
      linkedInUrl: linkedInProfile.url || linkedInProfile.publicUrl,
      skills: candidate.skills,
      experience: analysisResult.candidateInfo.yearsOfExperience
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
    rawProfile: linkedInProfile // Include for debugging/review
  }
}
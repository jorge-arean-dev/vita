/**
 * PDF Resume Match Analysis API
 * Processes resume text using unified matching engine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { 
  analyzeCandidate, 
  processPDFData,
  MatchAnalysisResult 
} from '../_shared/core-matching-engine.ts'
import { JobRequirement, CandidateSkill } from '../_shared/skill-matcher.ts'
import { mapYOEToProficiency } from '../_shared/proficiency-calculator.ts'

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

// OpenAI configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { 
      resumeText,
      resumeUrl,
      candidateInfo,
      extractedSkills = [],
      jobRequirements,
      jobInfo,
      options = {}
    } = await req.json()

    // Validate required fields
    if (!resumeText) {
      throw new Error('Resume text is required')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!jobInfo) {
      throw new Error('Job information is required')
    }
    if (!candidateInfo) {
      throw new Error('Candidate information is required')
    }

    console.log('[PDF API] Processing resume for job:', jobInfo.title)

    // Step 1: Extract additional skills from resume text if needed
    let allSkills = [...extractedSkills]
    if (extractedSkills.length === 0 || options.reExtractSkills) {
      console.log('[PDF API] Extracting skills from resume text')
      const additionalSkills = await extractSkillsFromResume(resumeText)
      allSkills = mergeSkills(extractedSkills, additionalSkills)
    }

    console.log(`[PDF API] Total skills: ${allSkills.length}`)

    // Step 2: Process PDF data into standard format
    const { candidate, rawData } = processPDFData(
      resumeText,
      allSkills,
      candidateInfo
    )
    
    // Add resume URL if provided
    if (resumeUrl) {
      rawData.resumeUrl = resumeUrl
    }

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
        analysisVersion: 'pdf-v2.0-unified'
      }
    )

    // Step 5: Format response for backward compatibility
    const response = formatPDFResponse(analysisResult, candidate, resumeText)

    console.log('[PDF API] Analysis complete:', {
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
    console.error('[PDF API] Error:', error)
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
 * Extract skills from resume text using LLM
 */
async function extractSkillsFromResume(resumeText: string): Promise<CandidateSkill[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `You are a technical recruiter extracting skills from resumes.
            Extract all technical skills, certifications, and soft skills mentioned.
            For each skill, try to determine years of experience if mentioned.
            
            Return a JSON array with this structure:
            [{
              "name": "skill name",
              "yearsOfExperience": number or null,
              "type": "technical_skill" | "certification" | "soft_skill",
              "context": "brief context where skill was mentioned"
            }]`
          },
          {
            role: 'user',
            content: `Extract skills from this resume:\n\n${resumeText.substring(0, 8000)}`
          }
        ],
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API request failed')
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)
    
    // Convert to CandidateSkill format
    const skills: CandidateSkill[] = (result.skills || []).map((skill: any) => ({
      name: skill.name,
      yearsOfExperience: skill.yearsOfExperience,
      proficiencyLevel: skill.yearsOfExperience 
        ? mapYOEToProficiency(skill.yearsOfExperience)
        : null,
      type: skill.type || 'technical_skill',
      source: 'resume'
    }))

    return skills
  } catch (error) {
    console.error('[PDF API] Skill extraction error:', error)
    return []
  }
}

/**
 * Merge extracted skills avoiding duplicates
 */
function mergeSkills(
  existingSkills: CandidateSkill[],
  newSkills: CandidateSkill[]
): CandidateSkill[] {
  const skillMap = new Map<string, CandidateSkill>()
  
  // Add existing skills
  for (const skill of existingSkills) {
    const key = skill.name.toLowerCase().trim()
    skillMap.set(key, skill)
  }
  
  // Merge new skills (preferring ones with more data)
  for (const skill of newSkills) {
    const key = skill.name.toLowerCase().trim()
    const existing = skillMap.get(key)
    
    if (!existing || (!existing.yearsOfExperience && skill.yearsOfExperience)) {
      skillMap.set(key, skill)
    }
  }
  
  return Array.from(skillMap.values())
}

/**
 * Format response for backward compatibility with existing frontend
 */
function formatPDFResponse(
  analysisResult: MatchAnalysisResult,
  candidate: any,
  resumeText: string
): any {
  return {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
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
    resumeLength: resumeText.length // Include for debugging
  }
}
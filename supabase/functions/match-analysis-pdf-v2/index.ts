/**
 * PDF Resume Match Analysis API
 * Processes resume text using unified matching engine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { 
  analyzeCandidate, 
  processPDFData,
  MatchAnalysisResult,
  Candidate 
} from '../_shared/core-matching-engine.ts'
import { JobRequirement, CandidateSkill } from '../_shared/skill-matcher.ts'
import { mapYOEToProficiency } from '../_shared/proficiency-calculator.ts'
import { generateNarrativeOutputs } from '../_shared/narrative-generator.ts'

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
    // Parse request body - expecting legacy format { candidate, job }
    const { candidate: candidateData, job } = await req.json()

    console.log('[PDF API] Received candidate data')
    console.log('[PDF API] Candidate structure:', {
      hasMain: !!candidateData?.main,
      mainName: `${candidateData?.main?.first_name} ${candidateData?.main?.last_name}`,
      skillsCount: candidateData?.skills?.length || 0,
      yearsExp: candidateData?.years_of_experience,
      hasPdfText: !!candidateData?.raw_pdf_profile_text
    })

    // Extract data from legacy format
    const resumeText = candidateData?.raw_pdf_profile_text
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
    if (!resumeText) {
      throw new Error('PDF resume text is required in raw_pdf_profile_text field')
    }
    if (!jobRequirements || !Array.isArray(jobRequirements)) {
      throw new Error('Job requirements array is required')
    }
    if (!job || !job.attributes || !job.attributes.title) {
      throw new Error('Job information is required')
    }

    console.log('[PDF API] Processing resume for job:', jobInfo.title)

    // Step 1: Convert candidate data to unified format
    const skills = candidateData.skills || []
    console.log('[PDF API] Converting skills:', skills.length, 'skills found')
    
    const candidate: Candidate = {
      firstName: candidateData.main?.first_name || 'Unknown',
      lastName: candidateData.main?.last_name || '',
      email: candidateData.main?.email,
      yearsOfExperience: candidateData.years_of_experience || 0,
      skills: skills.map(skill => ({
        name: skill.name,
        yearsOfExperience: skill.yoe,
        proficiencyLevel: skill.proficiency_level,
        type: skill.type,
        source: skill.source || 'parsed'
      }))
    }

    console.log(`[PDF API] Converted ${candidate.skills.length} parsed skills`)

    // Step 2: Extract additional skills from resume text if available
    if (resumeText) {
      console.log('[PDF API] Extracting additional skills from resume text')
      const additionalSkills = await extractSkillsFromResume(resumeText)
      const mergedSkills = mergeSkills(candidate.skills, additionalSkills)
      candidate.skills = mergedSkills
      console.log(`[PDF API] Total skills after extraction: ${candidate.skills.length}`)
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

    // Step 4: Run unified analysis with PDF data
    const rawData = {
      resumeText,
      resumeUrl: candidateData.resume_url
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
        analysisVersion: 'pdf-v2.0-unified'
      }
    )

    // Step 5: Generate narrative outputs using dedicated module
    console.log('[PDF API] Generating narrative outputs...')
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

    // Step 6: Format response for backward compatibility  
    const response = formatPDFResponse(analysisResult, candidate, resumeText, narrativeOutputs)

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
  resumeText: string,
  narrativeOutputs: any
): any {
  // Count mandatory requirements for frontend compatibility
  // Updated 2025-08-27: Only "strong" (80%+) counts as "met" for expert requirements
  const mandatoryMatches = analysisResult.detailedMatches.mandatory
  const totalMandatory = mandatoryMatches.length
  const matchedMandatory = mandatoryMatches.filter(match => 
    match.category === 'strong'
  ).length

  return {
    success: true,
    candidate: {
      name: analysisResult.candidateInfo.name,
      email: analysisResult.candidateInfo.email,
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
      algorithm_version: 'pdf-v2.0-unified',
      total_processing_time_ms: analysisResult.metadata?.processingTime || 0,
      resume_length: resumeText.length
    }
  }
}
"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  uploadTemporaryResume, 
  moveTempResumeToCandidate, 
  updateCandidateResumeUrl 
} from "./candidates"


// Types for API responses
interface LinkedInProfileData {
  firstName?: string
  lastName?: string
  headline?: string
  summary?: string
  experiences?: Array<Record<string, unknown>>
  skills?: Array<Record<string, unknown>>
  educations?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export interface ParsedCandidate {
  main: {
    first_name: string
    last_name: string
    country: string
    email: string
    phone: string
    linkedin: string
    github: string
  }
  skills: Array<{
    name: string
    type: string
    yoe: number | null
    proficiency_level: string | null
  }>
  years_of_experience: number
}

interface JobData {
  attributes: {
    title: string
    rate: {
      value: string
      freq: string
    }
    commitment: string
    duration: string
    location: {
      category: string
      regions: string[]
      countries: string[]
    }
  }
  requirements: Array<{
    requirement: string
    type: string
    is_mandatory: boolean
    proficiency_level: string
    weight: number
  }>
}

interface MatchAnalysisResponse {
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
    enhanced_analysis?: {
      matched_skills: Array<{
        skill: string
        match_type: 'exact' | 'semantic' | 'inferred'
        similarity: number
        source: string
        context?: string
      }>
      proficiency_assessment: {
        candidate_level: string
        required_level: string
        gap: number
        years_evidence: number
      }
      evidence: string[]
      confidence: number
    }
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
    enhanced_features?: {
      semantic_analysis_enabled: boolean
      qualitative_analysis_enabled: boolean
      openai_calls: {
        embeddings: number
        chat_completions: number
      }
      cost_estimate_usd: number
      confidence_factors: {
        profile_completeness: number
        skill_extraction_quality: number
        semantic_matching_quality: number
      }
    }
  }
  enhanced_insights?: {
    discovered_skills: Array<{
      skill: string
      type: string
      confidence: number
      evidence: string[]
    }>
    semantic_matches: Array<{
      requirement: string
      candidate_skill: string
      similarity: number
      match_type: string
    }>
    qualitative_analysis: {
      leadership_indicators: Array<{
        evidence: string
        level: string
        confidence: number
      }>
      soft_skills_discovered: Array<{
        skill: string
        evidence: string[]
        confidence: number
      }>
      domain_expertise: Array<{
        domain: string
        confidence: number
      }>
    }
  }
}

/**
 * Fetch job data including requirements for match analysis
 */
export async function fetchJobDataForAnalysis(jobId: string): Promise<JobData | null> {
  try {
    const supabase = await createClient()
    
    console.log(`🔍 Fetching job data for analysis. Job ID: ${jobId}`)
    
    // Fetch job details with requirements
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        job_requirements (
          id,
          requirement,
          type,
          is_mandatory,
          proficiency_level,
          weight
        )
      `)
      .eq("id", jobId)
      .single()

    if (jobError) {
      console.error("❌ Database error fetching job:", jobError)
      return null
    }
    
    if (!job) {
      console.error("❌ No job found with ID:", jobId)
      return null
    }
    
    console.log(`✅ Job found: "${job.job_title}" with ${job.job_requirements?.length || 0} requirements`)

    // Format the data according to match-analysis API requirements
    const formattedJob: JobData = {
      attributes: {
        title: job.title,
        rate: {
          value: job.rate?.toString() || "",
          freq: job.pay_freq || ""
        },
        commitment: job.commitment || "full_time",
        duration: job.duration || "permanent",
        location: {
          category: job.location_reqs || "remote",
          regions: job.regions || [],
          countries: job.countries || []
        }
      },
      requirements: job.job_requirements?.map((req: {
        requirement: string
        type: string
        is_mandatory: boolean
        proficiency_level: string | null
        weight: number | null
      }) => ({
        requirement: req.requirement,
        type: req.type,
        is_mandatory: req.is_mandatory,
        proficiency_level: req.proficiency_level,
        weight: Number(req.weight) || 0.5
      })) || [],
    }

    return formattedJob
  } catch {
    return null
  }
}

/**
 * Step 1: Scrape LinkedIn profile using Apify
 */
export async function scrapeLinkedInProfile(linkedinUrl: string): Promise<LinkedInProfileData> {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=apify_api_93zdEJsXGrvPFQdzh2as637W3Za2VE0C3Bi2`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl]
        })
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("LinkedIn scraper authentication failed")
      }
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later.")
      }
      throw new Error("Failed to scrape LinkedIn profile. Please check the URL and try again.")
    }

    const scrapedData = await response.json()
    
    if (!scrapedData || !Array.isArray(scrapedData) || scrapedData.length === 0) {
      throw new Error("No profile data found. The LinkedIn profile may be private or the URL is incorrect.")
    }

    return scrapedData[0]
  } catch (error) {
    throw error
  }
}

/**
 * Parse LinkedIn skills directly from raw profile data
 */
export async function parseLinkedInSkills(rawProfileData: Record<string, unknown>): Promise<ParsedCandidate> {
  try {
    // 📤 Log data being sent to parse-linkedin-skill API
    console.log("📤 Data Sent to parse-linkedin-skill API:")
    console.log(`📏 Payload Size: ${JSON.stringify(rawProfileData).length} characters`)
    console.log(`🔗 API Endpoint: https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill`)
    console.log(`📋 Data Structure Being Sent:`)
    console.log(`   - firstName: ${rawProfileData?.firstName || 'N/A'}`)
    console.log(`   - lastName: ${rawProfileData?.lastName || 'N/A'}`)
    console.log(`   - experiences: ${Array.isArray(rawProfileData?.experiences) ? rawProfileData.experiences.length : 0} items`)
    console.log(`   - skills: ${Array.isArray(rawProfileData?.skills) ? rawProfileData.skills.length : 0} items`)
    console.log(`   - Raw Profile Keys: ${Object.keys(rawProfileData).join(', ')}`)
    
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(rawProfileData)
      }
    )

    if (!response.ok) {
      const parseErrorData = await response.json()
      const errorData = parseErrorData
      
      if (response.status === 400) {
        throw new Error("Profile missing required information (name or experience). Please try a different profile.")
      }
      if (response.status === 500 && errorData.error?.includes("OpenAI")) {
        throw new Error("AI analysis service is temporarily unavailable. Please try again later.")
      }
      throw new Error("Failed to analyze profile with AI. Please try again.")
    }

    const parsedData = await response.json()
    
    // 📥 Log parsed candidate data received from parse-linkedin-skill API
    console.log("📥 Parsed Candidate Data Received from parse-linkedin-skill API:")
    console.log(`✅ API Response Status: ${response.status}`)
    console.log(`👤 Candidate Details:`)
    console.log(`   - Name: ${parsedData.main?.first_name} ${parsedData.main?.last_name}`)
    console.log(`   - Country: ${parsedData.main?.country || 'N/A'}`)
    console.log(`   - Email: ${parsedData.main?.email || 'N/A'}`)
    console.log(`   - LinkedIn: ${parsedData.main?.linkedin || 'N/A'}`)
    console.log(`   - Years of Experience: ${parsedData.years_of_experience || 0}`)
    console.log(`🛠️ Skills Extracted:`)
    console.log(`   - Total Skills: ${parsedData.skills?.length || 0}`)
    if (parsedData.skills?.length > 0) {
      const skillsByType = parsedData.skills.reduce((acc: Record<string, number>, skill: { type: string; name: string; yoe: number | null }) => {
        acc[skill.type] = (acc[skill.type] || 0) + 1
        return acc
      }, {})
      console.log(`   - Skills by Type:`, skillsByType)
      console.log(`   - Top 5 Skills: ${parsedData.skills.slice(0, 5).map((s: { name: string; yoe: number | null }) => `${s.name} (${s.yoe || 0}y)`).join(', ')}`)
    }
    console.log(`📊 Processing Summary:`)
    console.log(`   - Response Size: ${JSON.stringify(parsedData).length} characters`)
    console.log(`   - Data Structure Valid: ${!!(parsedData.main && parsedData.skills)}`)
    
    // Validate the parsed data has required fields
    if (!parsedData.main || (!parsedData.main.first_name && !parsedData.main.last_name)) {
      throw new Error("Could not extract name from LinkedIn profile. Please check the profile URL.")
    }

    return parsedData
  } catch (error) {
    throw error
  }
}

/**
 * Run match analysis between candidate and job
 */
export async function runMatchAnalysis(
  candidate: ParsedCandidate,
  job: JobData
): Promise<MatchAnalysisResponse> {
  try {
    const requestBody = { candidate, job }
    
    // Log the API input
    console.log("🔍 Match Analysis API Input:", JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      
      if (response.status === 400) {
        throw new Error(errorData.error || "Invalid input data for match analysis")
      }
      if (response.status === 429) {
        throw new Error("Analysis service is busy. Please try again in a moment.")
      }
      if (response.status >= 500) {
        throw new Error("Match analysis service error. Please try again later.")
      }
      
      throw new Error(errorData.error || "Failed to analyze candidate match")
    }

    const result = await response.json()
    
    // Log the API output
    console.log("✅ Match Analysis API Output:", JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Save a new candidate to the database
 */
export async function saveCandidate(
  candidateData: ParsedCandidate,
  linkedinUrl?: string,
  source: "linkedin" | "resume" = "linkedin"
): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Saving candidate data
    
    // Handle country - if it's not a valid ISO code, set to null
    let countryCode = candidateData.main.country || null
    if (countryCode && countryCode.trim() === "") {
      countryCode = null
    }
    
    // If country is provided, validate it exists in the countries table
    if (countryCode) {
      const { data: countryExists } = await supabase
        .from("countries")
        .select("iso_code")
        .eq("iso_code", countryCode)
        .single()
      
      if (!countryExists) {
        countryCode = null
      }
    }

    // Insert candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        user_id: user.id,
        first_name: candidateData.main.first_name,
        last_name: candidateData.main.last_name,
        email: candidateData.main.email || "",
        country: countryCode,
        linkedin: linkedinUrl || candidateData.main.linkedin || "",
        github: candidateData.main.github || "",
        years_experience: candidateData.years_of_experience
      })
      .select()
      .single()

    if (candidateError || !candidate) {
      throw new Error("Failed to create candidate")
    }

    // Insert candidate skills
    if (candidateData.skills && candidateData.skills.length > 0) {
      
      const skillsToInsert = candidateData.skills.map(skill => ({
        candidate_id: candidate.id,
        skill: skill.name,
        type: skill.type || "technical_skill",
        source: source,
        proficiency_level: skill.proficiency_level,
        years_of_experience: skill.yoe ? parseFloat(skill.yoe.toString()) : null
      }))


      const { error: skillsError } = await supabase
        .from("candidates_skills")
        .insert(skillsToInsert)

      if (skillsError) {
        // Don't throw here - candidate was created successfully
      } else {
      }
    } else {
    }

    return candidate.id
  } catch (error) {
    throw error
  }
}

/**
 * Save match analysis results to the database
 */
/**
 * Fetch candidates for the current user
 */
export async function fetchCandidatesForUser(): Promise<Array<{ id: string; name: string; email?: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch candidates")
    }

    // Transform to match expected format
    return (candidates || []).map(candidate => ({
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`.trim(),
      email: candidate.email || undefined
    }))
  } catch (error) {
    throw error
  }
}

/**
 * Fetch candidate data formatted for match analysis API
 */
export async function fetchCandidateForAnalysis(candidateId: string): Promise<ParsedCandidate> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Fetch candidate with skills
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(`
        *,
        candidates_skills (
          skill,
          type,
          proficiency_level,
          years_of_experience
        )
      `)
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single()

    if (candidateError || !candidate) {
      throw new Error("Candidate not found or access denied")
    }

    // Transform to ParsedCandidate format
    const parsedCandidate: ParsedCandidate = {
      main: {
        first_name: candidate.first_name || "",
        last_name: candidate.last_name || "",
        country: candidate.country || "",
        email: candidate.email || "",
        phone: "", // Not stored in current schema
        linkedin: candidate.linkedin || "",
        github: candidate.github || ""
      },
      skills: (candidate.candidates_skills || []).map((skill: {
        skill: string
        type: string
        proficiency_level: string | null
        years_of_experience: number | null
      }) => ({
        name: skill.skill,
        type: skill.type || "technical_skill",
        yoe: skill.years_of_experience ? parseFloat(skill.years_of_experience.toString()) : null,
        proficiency_level: skill.proficiency_level || null
      })),
      years_of_experience: candidate.years_experience || 0
    }

    return parsedCandidate
  } catch (error) {
    throw error
  }
}

/**
 * Fetch existing match analyses for a job
 */
export async function getExistingMatchAnalyses(jobId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Query match analyses with candidate data
    const { data: analyses, error } = await supabase
      .from("job_candidate_match_analysis")
      .select(`
        id,
        job_id,
        candidate_id,
        match_analysis,
        requirement_evaluations,
        summary,
        recruiter_recommendations,
        created_at,
        updated_at,
        candidates!candidate_id (
          id,
          first_name,
          last_name,
          email,
          linkedin,
          country
        )
      `)
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch existing match analyses")
    }

    
    // Transform the data to handle Supabase's array response for joined data
    const transformedAnalyses = (analyses || []).map(analysis => ({
      ...analysis,
      // Convert candidates array to single object since it's a one-to-one relationship
      candidates: Array.isArray(analysis.candidates) && analysis.candidates.length > 0 
        ? analysis.candidates[0] 
        : (analysis.candidates && !Array.isArray(analysis.candidates)) 
          ? analysis.candidates 
          : null
    }))
    
    // Filter out any analyses where candidate data failed to load
    const validAnalyses = transformedAnalyses.filter(analysis => analysis.candidates)
    
    if (validAnalyses.length !== transformedAnalyses.length) {
    }

    return validAnalyses
  } catch (error) {
    throw error
  }
}

export async function saveMatchAnalysis(
  jobId: string,
  candidateId: string,
  analysisResults: MatchAnalysisResponse
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Insert match analysis
    const { error } = await supabase
      .from("job_candidate_match_analysis")
      .insert({
        user_id: user.id,
        job_id: jobId,
        candidate_id: candidateId,
        match_analysis: analysisResults.match_analysis,
        requirement_evaluations: analysisResults.requirement_evaluations,
        summary: analysisResults.summary,
        recruiter_recommendations: analysisResults.recruiter_recommendations
      })

    if (error) {
      throw new Error("Failed to save match analysis")
    }
  } catch (error) {
    throw error
  }
}

/**
 * Run enhanced match analysis v2 with semantic matching and qualitative analysis
 */
export async function runEnhancedMatchAnalysis(
  candidate: ParsedCandidate,
  job: JobData,
  rawProfile?: Record<string, unknown>
): Promise<MatchAnalysisResponse> {
  try {
    const requestBody = { 
      candidate: {
        ...candidate,
        raw_profile: rawProfile || null
      }, 
      job 
    }
    
    // Log the enhanced API input
    console.log("🔍 Enhanced Match Analysis v2 API Input:", JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      
      if (response.status === 400) {
        throw new Error(errorData.error || "Invalid input data for enhanced match analysis")
      }
      if (response.status === 429) {
        throw new Error("Enhanced analysis service is busy. Please try again in a moment.")
      }
      if (response.status >= 500) {
        throw new Error("Enhanced match analysis service error. Please try again later.")
      }
      
      throw new Error(errorData.error || "Failed to run enhanced candidate match analysis")
    }

    const result = await response.json()
    
    // Log the enhanced API output with detailed breakdown
    console.log("✅ Enhanced Match Analysis v2 API Output:", JSON.stringify(result, null, 2))
    console.log("\n🎯 ENHANCED ANALYSIS SUMMARY:")
    console.log("=====================================")
    console.log(`📊 Overall Score: ${result.match_analysis?.overall_score}% (${result.match_analysis?.status})`)
    console.log(`✅ Mandatory Requirements Met: ${result.match_analysis?.matched_mandatory_requirements}/${result.match_analysis?.total_mandatory_requirements}`)
    console.log(`🕒 Processing Time: ${result.metadata?.total_processing_time_ms}ms`)
    
    if (result.metadata?.enhanced_features) {
      console.log(`💰 Estimated Cost: $${result.metadata.enhanced_features.cost_estimate_usd?.toFixed(4)}`)
      console.log(`🔧 API Calls: ${result.metadata.enhanced_features.openai_calls?.embeddings} embeddings, ${result.metadata.enhanced_features.openai_calls?.chat_completions} chat`)
    }
    
    if (result.enhanced_insights) {
      console.log(`🧠 Discovered Skills: ${result.enhanced_insights.discovered_skills?.length || 0}`)
      console.log(`🎯 Semantic Matches: ${result.enhanced_insights.semantic_matches?.length || 0}`)
      console.log(`👑 Leadership Indicators: ${Array.isArray(result.enhanced_insights.qualitative_analysis?.leadership_indicators) ? result.enhanced_insights.qualitative_analysis.leadership_indicators.length : 0}`)
    }
    
    return result
  } catch (error) {
    console.error("❌ Enhanced match analysis error:", error)
    throw error
  }
}

/**
 * Complete LinkedIn parsing flow (2 APIs - DIRECT, skips reducer)
 */
export async function parseLinkedInProfile(linkedinUrl: string): Promise<ParsedCandidate> {
  try {
    // Step 1: Scrape LinkedIn profile (raw data)
    const profileData = await scrapeLinkedInProfile(linkedinUrl)
    
    // 📊 Log raw LinkedIn profile details
    console.log("🔍 Raw LinkedIn Profile Analysis:")
    console.log(`📏 Profile Size: ${JSON.stringify(profileData).length} characters`)
    console.log(`👤 Profile Structure:`)
    console.log(`   - Name: ${profileData?.firstName} ${profileData?.lastName}`)
    console.log(`   - Headline: ${profileData?.headline ? 'Yes' : 'No'}`)
    console.log(`   - Experiences: ${Array.isArray(profileData?.experiences) ? profileData.experiences.length : 0} entries`)
    console.log(`   - Skills: ${Array.isArray(profileData?.skills) ? profileData.skills.length : 0} entries`)
    console.log(`   - Education: ${Array.isArray(profileData?.educations) ? profileData.educations.length : 0} entries`)
    console.log(`   - About Section: ${profileData?.about ? 'Yes' : 'No'}`)
    console.log(`   - Languages: ${Array.isArray(profileData?.languages) ? profileData.languages.length : 0} entries`)
    
    // Step 2: Parse skills directly from raw profile (SKIP reducer)
    const parsedCandidate = await parseLinkedInSkills(profileData)
    
    return parsedCandidate
  } catch (error) {
    throw error
  }
}



/**
 * Run simplified enhanced match analysis v3 (embedding-based with same output format)
 */
export async function runSimplifiedEnhancedMatchAnalysis(
  candidate: ParsedCandidate,
  job: JobData,
  rawProfile?: Record<string, unknown>
): Promise<MatchAnalysisResponse> {
  try {
    const requestBody = { 
      candidate: {
        ...candidate,
        raw_profile: rawProfile || null
      }, 
      job 
    }
    
    // Log the enhanced API input
    console.log("🔍 Simplified Enhanced Match Analysis v3 API Input:", JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/match-analysis-3",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      
      if (response.status === 400) {
        throw new Error(errorData.error || "Invalid input data for simplified enhanced match analysis")
      }
      if (response.status === 429) {
        throw new Error("Enhanced analysis service is busy. Please try again in a moment.")
      }
      if (response.status >= 500) {
        throw new Error("Simplified enhanced match analysis service error. Please try again later.")
      }
      
      throw new Error(errorData.error || "Failed to run simplified enhanced candidate match analysis")
    }

    const result = await response.json()
    
    // Log the enhanced API output with detailed breakdown
    console.log("✅ Simplified Enhanced Match Analysis v3 API Output:", JSON.stringify(result, null, 2))
    console.log("\n🎯 SIMPLIFIED ENHANCED ANALYSIS SUMMARY:")
    console.log("==========================================")
    console.log(`📊 Overall Score: ${result.match_analysis?.overall_score}% (${result.match_analysis?.status})`)
    console.log(`✅ Mandatory Requirements Met: ${result.match_analysis?.matched_mandatory_requirements}/${result.match_analysis?.total_mandatory_requirements}`)
    console.log(`🕒 Processing Time: ${result.metadata?.total_processing_time_ms}ms`)
    console.log(`🧠 Algorithm: ${result.metadata?.algorithm_version}`)
    console.log(`📋 Requirements Analyzed: ${result.requirement_evaluations?.length || 0}`)
    
    return result
  } catch (error) {
    console.error("❌ Simplified enhanced match analysis error:", error)
    throw error
  }
}

/**
 * Complete simplified enhanced flow: Parse LinkedIn, run v3 analysis (DIRECT - no reducer)
 */
export async function analyzeLinkedInCandidateSimplifiedEnhanced(
  linkedinUrl: string,
  jobId: string,
  saveResults: boolean = false
): Promise<{
  candidate: ParsedCandidate
  analysis: MatchAnalysisResponse
  candidateId?: string
  rawProfile?: Record<string, unknown>
}> {
  try {
    console.log("🚀 Starting Simplified Enhanced LinkedIn Analysis Flow (v3) - DIRECT")
    console.log(`🔗 LinkedIn URL: ${linkedinUrl}`)
    console.log(`💼 Job ID: ${jobId}`)
    console.log(`💾 Save Results: ${saveResults}`)
    
    // Get job data
    const jobData = await fetchJobDataForAnalysis(jobId)
    if (!jobData) {
      throw new Error("Job not found")
    }

    // Step 1: Scrape LinkedIn profile (raw data)
    console.log("🔍 Step 1: Scraping LinkedIn profile...")
    const rawLinkedInData = await scrapeLinkedInProfile(linkedinUrl)
    
    console.log("📊 Raw LinkedIn Profile Summary for Enhanced Analysis:")
    console.log(`   📏 Profile Size: ${JSON.stringify(rawLinkedInData).length} characters`)
    console.log(`   👤 Name: ${rawLinkedInData?.firstName} ${rawLinkedInData?.lastName}`)
    console.log(`   💼 Experiences: ${Array.isArray(rawLinkedInData?.experiences) ? rawLinkedInData.experiences.length : 0} entries`)
    console.log(`   🎯 Skills Listed: ${Array.isArray(rawLinkedInData?.skills) ? rawLinkedInData.skills.length : 0} entries`)
    
    // Step 2: Parse skills directly from raw profile (SKIP reducer)
    console.log("🧠 Step 2: Parsing LinkedIn skills from raw profile...")
    const candidate = await parseLinkedInSkills(rawLinkedInData)
    
    console.log("📋 Parsed Candidate Summary for Enhanced Analysis:")
    console.log(`   👤 Parsed Name: ${candidate.main?.first_name} ${candidate.main?.last_name}`)
    console.log(`   📊 Skills Parsed: ${candidate.skills?.length || 0} total`)
    console.log(`   💼 Years Experience: ${candidate.years_of_experience || 0}`)
    console.log(`   🔗 Profile Complete: ${!!(candidate.main && candidate.skills && candidate.skills.length > 0)}`)
    
    // Step 3: Run simplified enhanced match analysis v3 with RAW profile data
    console.log("⚡ Step 3: Running simplified enhanced match analysis v3 with raw profile...")
    const analysis = await runSimplifiedEnhancedMatchAnalysis(candidate, jobData, rawLinkedInData)
    
    // Step 4: Save if requested
    if (saveResults) {
      console.log("💾 Step 4: Saving candidate and analysis...")
      const candidateId = await saveCandidate(candidate, linkedinUrl, "linkedin")
      await saveMatchAnalysis(jobId, candidateId, analysis)
      
      console.log("✅ Simplified enhanced LinkedIn analysis completed with save")
      return { candidate, analysis, candidateId, rawProfile: rawLinkedInData }
    }
    
    console.log("✅ Simplified enhanced LinkedIn analysis completed")
    return { candidate, analysis, rawProfile: rawLinkedInData }
  } catch (error) {
    console.error("❌ Simplified enhanced LinkedIn analysis failed:", error)
    throw error
  }
}


/**
 * Complete flow: Parse LinkedIn, analyze match, and optionally save - LEGACY VERSION
 */
export async function analyzeLinkedInCandidate(
  linkedinUrl: string,
  jobId: string,
  saveResults: boolean = false
): Promise<{
  candidate: ParsedCandidate
  analysis: MatchAnalysisResponse
  candidateId?: string
}> {
  try {
    // Get job data
    const jobData = await fetchJobDataForAnalysis(jobId)
    if (!jobData) {
      throw new Error("Job not found")
    }

    // Parse LinkedIn profile
    const candidate = await parseLinkedInProfile(linkedinUrl)
    
    // Run match analysis
    const analysis = await runMatchAnalysis(candidate, jobData)
    
    // Save if requested
    if (saveResults) {
      const candidateId = await saveCandidate(candidate, linkedinUrl, "linkedin")
      await saveMatchAnalysis(jobId, candidateId, analysis)
      
      return { candidate, analysis, candidateId }
    }
    
    return { candidate, analysis }
  } catch (error) {
    throw error
  }
}

/**
 * Parse PDF resume using parse-resume-skill API
 */
export async function parseResumeSkills(pdfUrl: string): Promise<ParsedCandidate> {
  try {
    
    const response = await fetch(
      "https://parse-resume-skill-709637652952.europe-west1.run.app",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pdf_url: pdfUrl }),
        signal: AbortSignal.timeout(35000) // 35 second timeout
      }
    )

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: "Failed to parse error response" }
      }
      
      if (response.status === 400) {
        throw new Error("Invalid PDF format or content. Please try a different resume.")
      }
      if (response.status === 500 && errorData.error?.includes("OpenAI")) {
        throw new Error("AI analysis service is temporarily unavailable. Please try again later.")
      }
      throw new Error(errorData.error || "Failed to parse resume. Please try again.")
    }

    const parsedData = await response.json()
    
    // Validate the parsed data has required fields
    if (!parsedData.main || (!parsedData.main.first_name && !parsedData.main.last_name)) {
      throw new Error("Could not extract name from resume. Please check the file and try again.")
    }

    return parsedData
  } catch (error) {
    throw error
  }
}

/**
 * Complete PDF parsing and analysis flow
 */
export async function analyzePDFCandidate(
  file: File,
  jobId: string,
  saveResults: boolean = false
): Promise<{
  candidate: ParsedCandidate
  analysis: MatchAnalysisResponse
  candidateId?: string
  tempFilePath?: string
}> {
  try {
    // Step 1: Upload PDF to temp_resumes (public bucket)
    const uploadResult = await uploadTemporaryResume(file)
    if (!uploadResult.success || !uploadResult.tempUrl) {
      throw new Error(uploadResult.error || "Failed to upload resume")
    }

    // Step 2: Parse resume using public URL
    const candidate = await parseResumeSkills(uploadResult.tempUrl)
    
    // Step 3: Get job data
    const jobData = await fetchJobDataForAnalysis(jobId)
    if (!jobData) {
      throw new Error("Job not found")
    }

    // Step 4: Run match analysis
    const analysis = await runMatchAnalysis(candidate, jobData)
    
    // Step 5: Save if requested
    if (saveResults) {
      // Create candidate
      const candidateId = await saveCandidate(candidate, undefined, "resume")
      
      // Move resume from temp to final location
      if (uploadResult.tempPath) {
        const moveResult = await moveTempResumeToCandidate(uploadResult.tempPath, candidateId)
        if (moveResult.success && moveResult.finalUrl) {
          // Update candidate with final resume URL
          await updateCandidateResumeUrl(candidateId, moveResult.finalUrl)
        }
      }
      
      // Save match analysis
      await saveMatchAnalysis(jobId, candidateId, analysis)
      
      return { candidate, analysis, candidateId }
    }
    
    return { candidate, analysis, tempFilePath: uploadResult.tempPath }
  } catch (error) {
    throw error
  }
}

/**
 * Save PDF candidate with resume file management
 */
export async function savePDFCandidateWithResume(
  candidateData: ParsedCandidate,
  tempFilePath: string,
  jobId: string,
  analysisResults: MatchAnalysisResponse
): Promise<string> {
  try {
    // Step 1: Create candidate
    const candidateId = await saveCandidate(candidateData, undefined, "resume")
    
    // Step 2: Move resume from temp to final location
    const moveResult = await moveTempResumeToCandidate(tempFilePath, candidateId)
    if (moveResult.success && moveResult.finalUrl) {
      // Step 3: Update candidate with final resume URL
      await updateCandidateResumeUrl(candidateId, moveResult.finalUrl)
    } else {
      // Don't fail the entire operation, but log the error
    }
    
    // Step 4: Save match analysis
    await saveMatchAnalysis(jobId, candidateId, analysisResults)
    
    return candidateId
  } catch (error) {
    throw error
  }
}

/**
 * Delete a match analysis
 */
export async function deleteMatchAnalysis(analysisId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase
      .from("job_candidate_match_analysis")
      .delete()
      .eq("id", analysisId)
      .eq("user_id", user.id) // Security: only delete own analyses

    if (error) {
      return { success: false, error: "Failed to delete match analysis" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
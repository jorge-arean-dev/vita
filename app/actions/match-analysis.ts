"use server"

import { createClient } from "@/lib/supabase/server"

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
  job_description: string
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
 * Fetch job data including requirements for match analysis
 */
export async function fetchJobDataForAnalysis(jobId: string): Promise<JobData | null> {
  try {
    const supabase = await createClient()
    
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
        ),
        job_descriptions (
          description
        )
      `)
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      console.error("Error fetching job:", jobError)
      return null
    }

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
        proficiency_level: req.proficiency_level || "intermediate",
        weight: Number(req.weight) || 0.5
      })) || [],
      job_description: job.job_descriptions?.[0]?.description || job.job_description || ""
    }

    return formattedJob
  } catch (error) {
    console.error("Error in fetchJobDataForAnalysis:", error)
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
    console.error("Error scraping LinkedIn profile:", error)
    throw error
  }
}

/**
 * Step 2: Reduce LinkedIn profile data
 */
export async function reduceLinkedInProfile(profileData: LinkedInProfileData): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/linkedin-profile-reducer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(profileData)
      }
    )

    if (!response.ok) {
      try {
        await response.json()
      } catch {
        const textError = await response.text()
        console.error("Reduce failed - not JSON response:", textError)
        throw new Error(`LinkedIn profile reducer returned ${response.status}: ${textError || "Unknown error"}`)
      }
      
      if (response.status === 400) {
        throw new Error("Invalid profile data format. Please try a different LinkedIn URL.")
      }
      if (response.status === 405) {
        throw new Error("Method not allowed - LinkedIn profile reducer configuration error.")
      }
      if (response.status >= 500) {
        throw new Error("LinkedIn profile reducer service error. Please try again later.")
      }
      throw new Error(`Failed to format profile data (${response.status}). Please try again.`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error reducing LinkedIn profile:", error)
    throw error
  }
}

/**
 * Step 3: Parse LinkedIn skills and extract structured data
 */
export async function parseLinkedInSkills(reducedData: Record<string, unknown>): Promise<ParsedCandidate> {
  try {
    const response = await fetch(
      "https://klhhdgizxytfmolwabfl.supabase.co/functions/v1/parse-linkedin-skill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(reducedData)
      }
    )

    if (!response.ok) {
      const parseErrorData = await response.json()
      console.error("Parse failed:", parseErrorData)
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
    
    // Validate the parsed data has required fields
    if (!parsedData.main || (!parsedData.main.first_name && !parsedData.main.last_name)) {
      throw new Error("Could not extract name from LinkedIn profile. Please check the profile URL.")
    }

    return parsedData
  } catch (error) {
    console.error("Error parsing LinkedIn skills:", error)
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
    // Log the input data for match-analysis API
    const requestBody = { candidate, job }
    console.log("=== MATCH-ANALYSIS API INPUT ===")
    console.log("Full request body:", JSON.stringify(requestBody, null, 2))
    console.log("Candidate summary:", {
      name: `${candidate.main.first_name} ${candidate.main.last_name}`,
      skills_count: candidate.skills.length,
      years_experience: candidate.years_of_experience
    })
    console.log("Job summary:", {
      title: job.attributes.title,
      requirements_count: job.requirements.length,
      location: job.attributes.location.category
    })
    console.log("================================")
    
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

    return await response.json()
  } catch (error) {
    console.error("Error running match analysis:", error)
    throw error
  }
}

/**
 * Save a new candidate to the database
 */
export async function saveCandidate(
  candidateData: ParsedCandidate,
  linkedinUrl?: string
): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Insert candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        user_id: user.id,
        first_name: candidateData.main.first_name,
        last_name: candidateData.main.last_name,
        email: candidateData.main.email || "",
        country: candidateData.main.country || "",
        linkedin: linkedinUrl || candidateData.main.linkedin || "",
        github: candidateData.main.github || "",
        years_experience: candidateData.years_of_experience
      })
      .select()
      .single()

    if (candidateError || !candidate) {
      console.error("Error creating candidate:", candidateError)
      throw new Error("Failed to create candidate")
    }

    // Insert candidate skills
    if (candidateData.skills && candidateData.skills.length > 0) {
      const skillsToInsert = candidateData.skills.map(skill => ({
        candidate_id: candidate.id,
        skill: skill.name,
        type: skill.type || "technical_skill",
        source: "linkedin",
        proficiency_level: skill.proficiency_level,
        years_of_experience: skill.yoe
      }))

      const { error: skillsError } = await supabase
        .from("candidates_skills")
        .insert(skillsToInsert)

      if (skillsError) {
        console.error("Error inserting candidate skills:", skillsError)
        // Don't throw here - candidate was created successfully
      }
    }

    return candidate.id
  } catch (error) {
    console.error("Error saving candidate:", error)
    throw error
  }
}

/**
 * Save match analysis results to the database
 */
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
      console.error("Error saving match analysis:", error)
      throw new Error("Failed to save match analysis")
    }
  } catch (error) {
    console.error("Error in saveMatchAnalysis:", error)
    throw error
  }
}

/**
 * Complete LinkedIn parsing flow (3 APIs in sequence)
 */
export async function parseLinkedInProfile(linkedinUrl: string): Promise<ParsedCandidate> {
  try {
    // Step 1: Scrape LinkedIn profile
    const profileData = await scrapeLinkedInProfile(linkedinUrl)
    
    // Step 2: Reduce profile data
    const reducedData = await reduceLinkedInProfile(profileData)
    
    // Step 3: Parse skills and structure data
    const parsedCandidate = await parseLinkedInSkills(reducedData)
    
    return parsedCandidate
  } catch (error) {
    console.error("Error in LinkedIn parsing flow:", error)
    throw error
  }
}

/**
 * Complete flow: Parse LinkedIn, analyze match, and optionally save
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
      const candidateId = await saveCandidate(candidate, linkedinUrl)
      await saveMatchAnalysis(jobId, candidateId, analysis)
      
      return { candidate, analysis, candidateId }
    }
    
    return { candidate, analysis }
  } catch (error) {
    console.error("Error in analyzeLinkedInCandidate:", error)
    throw error
  }
}
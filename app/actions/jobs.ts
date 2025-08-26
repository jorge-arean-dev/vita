"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface JobData {
  id: string
  title: string
  company_name: string
  created_at: string
  candidate_count: number
  commitment: string | null
  commitment_display: string | null
  duration: string | null
  duration_display: string | null
  location_reqs: string | null
  location_reqs_display: string | null
  rate: number | null
  pay_freq: string | null
  pay_freq_display: string | null
}

export async function getJobs(): Promise<JobData[]> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // First, get all jobs for the user
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      created_at,
      company_id,
      commitment,
      duration,
      location_reqs,
      rate,
      pay_freq
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    
  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }
  
  // Get all company IDs from the jobs
  const companyIds = jobs.map(job => job.company_id).filter(Boolean)
  
  // Get unique values for lookups
  const commitments = [...new Set(jobs.map(job => job.commitment).filter(Boolean))]
  const durations = [...new Set(jobs.map(job => job.duration).filter(Boolean))]
  const locationReqs = [...new Set(jobs.map(job => job.location_reqs).filter(Boolean))]
  
  // If there are company IDs, fetch the company names
  let companyMap: Record<string, string> = {}
  
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds)
    
    if (companies) {
      companyMap = companies.reduce((acc, company) => {
        acc[company.id] = company.name
        return acc
      }, {} as Record<string, string>)
    }
  }
  
  // Fetch display names for lookups
  let commitmentMap: Record<string, string> = {}
  let durationMap: Record<string, string> = {}
  let locationMap: Record<string, string> = {}
  
  if (commitments.length > 0) {
    const { data: commitmentTypes } = await supabase
      .from("job_commitment_types")
      .select("name, display_name")
      .in("name", commitments)
    
    if (commitmentTypes) {
      commitmentMap = commitmentTypes.reduce((acc, item) => {
        acc[item.name] = item.display_name
        return acc
      }, {} as Record<string, string>)
    }
  }
  
  if (durations.length > 0) {
    const { data: durationTypes } = await supabase
      .from("job_durations")
      .select("name, display_name")
      .in("name", durations)
    
    if (durationTypes) {
      durationMap = durationTypes.reduce((acc, item) => {
        acc[item.name] = item.display_name
        return acc
      }, {} as Record<string, string>)
    }
  }
  
  if (locationReqs.length > 0) {
    const { data: locationTypes } = await supabase
      .from("job_location_types")
      .select("name, display_name")
      .in("name", locationReqs)
    
    if (locationTypes) {
      locationMap = locationTypes.reduce((acc, item) => {
        acc[item.name] = item.display_name
        return acc
      }, {} as Record<string, string>)
    }
  }

  // Transform the data to match our interface
  const transformedJobs: JobData[] = jobs.map((job) => {
    // Get company name from the map we created
    const companyName = job.company_id && companyMap[job.company_id] 
      ? companyMap[job.company_id] 
      : "Unknown Company";
      
    return {
      id: job.id,
      title: job.title,
      company_name: companyName,
      created_at: job.created_at,
      candidate_count: 0, // This field will be removed from the UI
      commitment: job.commitment,
      commitment_display: job.commitment ? commitmentMap[job.commitment] || job.commitment : null,
      duration: job.duration,
      duration_display: job.duration ? durationMap[job.duration] || job.duration : null,
      location_reqs: job.location_reqs,
      location_reqs_display: job.location_reqs ? locationMap[job.location_reqs] || job.location_reqs : null,
      rate: job.rate,
      pay_freq: job.pay_freq,
      pay_freq_display: null // Not needed since we're using the mapping in the component
    };
  })

  return transformedJobs
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Delete the job (ensure user can only delete their own jobs)
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error("Failed to delete job")
  }

  // Revalidate the jobs page to reflect the changes
  revalidatePath("/protected/jobs")
}

// Interface for job data needed for LinkedIn query generation
export interface JobForLinkedInQuery {
  id: string
  title: string
  location_reqs: string | null
  regions: string[] | null
  countries: string[] | null
  job_requirements: {
    requirement: string
    type: string
    is_mandatory: boolean
    proficiency_level: string | null
  }[]
}

// Get job data with requirements for LinkedIn query generation
export async function getJobForLinkedInQuery(jobId: string): Promise<JobForLinkedInQuery> {
  console.log('=== getJobForLinkedInQuery START ===')
  console.log('jobId parameter:', jobId)
  
  const supabase = await createClient()
  console.log('Supabase client created')
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  console.log('User:', user?.id || 'not authenticated')
  
  if (!user) {
    throw new Error("User not authenticated")
  }

  
  // First, let's try to fetch just the job data to see if that works
  const { data: jobOnly, error: jobError } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      location_reqs,
      regions,
      countries
    `)
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single()
    
  
  if (jobError) {
    throw new Error(`Failed to fetch job data: ${jobError.message}`)
  }
  
  if (!jobOnly) {
    throw new Error("Job not found or access denied")
  }
  
  // Now fetch requirements separately
  const { data: requirements, error: reqError } = await supabase
    .from("job_requirements")
    .select(`
      requirement,
      type,
      is_mandatory,
      proficiency_level
    `)
    .eq("job_id", jobId)
    
  
  if (reqError) {
    console.error('Error fetching requirements:', reqError)
    // Don't throw error - continue with empty requirements
  }
  
  // Combine the data
  const job = {
    ...jobOnly,
    job_requirements: requirements || []
  }

  return job as JobForLinkedInQuery
}
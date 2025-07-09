"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface JobData {
  id: string
  title: string
  company_name: string
  created_at: string
  candidate_count: number
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
      company_id
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    
  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }
  
  // Get all company IDs from the jobs
  const companyIds = jobs.map(job => job.company_id).filter(Boolean)
  
  // If there are company IDs, fetch the company names
  let companyMap: Record<string, string> = {}
  
  if (companyIds.length > 0) {
    const { data: companies, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds)
    
    if (companyError) {
      // Silently handle company error but continue with available data
    } else if (companies) {
      // Create a map of company ID to company name
      companyMap = companies.reduce((acc, company) => {
        acc[company.id] = company.name
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
      candidate_count: 0 // This field will be removed from the UI
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
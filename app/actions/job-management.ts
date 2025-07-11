"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { jobCreationSchema, jobBasicInfoSchema, type JobCreationFormData, type JobBasicInfoFormData } from "@/lib/validations/job"

/**
 * Server actions for job management operations.
 * 
 * These server actions handle all job-related database operations
 * following Next.js App Router patterns and ensuring proper validation,
 * authentication, and data integrity.
 */

/**
 * Create a new job with initial information
 * Validates input data and creates job record in database
 * 
 * @param formData - Validated job creation data
 * @returns Object with success status and job ID or error message
 */
export async function createJob(formData: JobCreationFormData) {
  try {
    // Validate input data using Zod schema
    const validatedData = jobCreationSchema.parse(formData)
    
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" }
    }

    // TODO: Handle company creation/selection logic
    // For now, we'll assume companyId is valid or "create-new"
    let finalCompanyId = validatedData.companyId
    
    if (validatedData.companyId === "create-new") {
      // TODO: Implement company creation logic
      // This would create a new company record and return its ID
      finalCompanyId = "temp-company-id"
    }

    // Create the job record
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert({
        title: validatedData.title,
        company_id: finalCompanyId,
        initial_notes: validatedData.initialNotes,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single()

    if (jobError) {
      console.error("Database error:", jobError)
      return { success: false, error: "Failed to create job" }
    }

    // Revalidate the jobs list page
    revalidatePath("/protected/jobs")
    
    return { success: true, jobId: jobData.id }
    
  } catch (error) {
    console.error("Job creation error:", error)
    return { success: false, error: "Invalid form data" }
  }
}

/**
 * Update job basic information (Define phase - Initial Data)
 * 
 * @param jobId - Job ID to update
 * @param formData - Validated job basic info data
 * @returns Object with success status or error message
 */
export async function updateJobBasicInfo(jobId: string, formData: JobBasicInfoFormData) {
  try {
    const validatedData = jobBasicInfoSchema.parse(formData)
    
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" }
    }

    // Update the job record (only if user owns the job)
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        title: validatedData.title,
        // TODO: Handle company name updates
        initial_notes: validatedData.initialNotes,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId)
      .eq("user_id", user.id) // Ensure user can only update their own jobs

    if (updateError) {
      console.error("Database error:", updateError)
      return { success: false, error: "Failed to update job" }
    }

    // Revalidate the current job page
    revalidatePath(`/protected/jobs/${jobId}`)
    
    return { success: true }
    
  } catch (error) {
    console.error("Job update error:", error)
    return { success: false, error: "Invalid form data" }
  }
}

/**
 * Fetch job data for editing
 * 
 * @param jobId - Job ID to fetch
 * @returns Job data or null if not found/unauthorized
 */
export async function getJobData(jobId: string) {
  try {
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }

    // Fetch job with company information
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        initial_notes,
        created_at,
        updated_at,
        company_id,
        companies (
          id,
          name
        )
      `)
      .eq("id", jobId)
      .eq("user_id", user.id) // Ensure user can only access their own jobs
      .single()

    if (jobError) {
      console.error("Database error:", jobError)
      return null
    }

    return {
      id: jobData.id,
      title: jobData.title,
      companyId: jobData.company_id,
      companyName: Array.isArray(jobData.companies) 
        ? jobData.companies[0]?.name || null 
        : (jobData.companies as { name: string } | null)?.name || null,
      initialNotes: jobData.initial_notes,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at
    }
    
  } catch (error) {
    console.error("Job fetch error:", error)
    return null
  }
}


/**
 * Generate AI content for various job phases
 * This is a placeholder for future AI integration
 * 
 * @param jobId - Job ID
 * @param contentType - Type of content to generate
 * @param inputData - Input data for generation
 * @returns Generated content or error
 */
export async function generateJobContent(
  jobId: string, 
  contentType: 'role-analysis' | 'job-description' | 'linkedin-query' | 'interview-questions'
) {
  try {
    // TODO: Implement AI content generation
    // This would call external AI APIs or services
    
    // Placeholder response
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    switch (contentType) {
      case 'role-analysis':
        return {
          success: true,
          data: {
            attributes: "Generated attributes based on job requirements...",
            requirements: "Generated requirements based on job description..."
          }
        }
      case 'job-description':
        return {
          success: true,
          data: "Generated job description based on role analysis and selected options..."
        }
      case 'linkedin-query':
        return {
          success: true,
          data: 'title:"Software Engineer" AND skills:"React" AND location:"Remote"'
        }
      case 'interview-questions':
        return {
          success: true,
          data: "1. Tell me about your experience with React...\n2. How do you handle state management?..."
        }
      default:
        return { success: false, error: "Unknown content type" }
    }
    
  } catch (error) {
    console.error("Content generation error:", error)
    return { success: false, error: "Failed to generate content" }
  }
}
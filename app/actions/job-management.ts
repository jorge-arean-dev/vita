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

    // Fetch job with company information and requirements
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        initial_notes,
        created_at,
        updated_at,
        company_id,
        rate,
        pay_freq,
        duration,
        commitment,
        location_reqs,
        regions,
        countries,
        companies (
          id,
          name
        ),
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
      .eq("user_id", user.id) // Ensure user can only access their own jobs
      .single()

    if (jobError) {
      console.error("Database error:", jobError)
      return null
    }

    console.log("Raw job data from database:", jobData)

    const formattedData = {
      id: jobData.id,
      title: jobData.title,
      companyId: jobData.company_id,
      companyName: Array.isArray(jobData.companies) 
        ? jobData.companies[0]?.name || null 
        : (jobData.companies as { name: string } | null)?.name || null,
      initialNotes: jobData.initial_notes,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at,
      // Add attributes for Role Analysis
      attributes: {
        rate: {
          value: jobData.rate || null,
          freq: jobData.pay_freq || "hourly"
        },
        commitment: jobData.commitment || "",
        duration: jobData.duration || "",
        location: {
          category: jobData.location_reqs || "",
          regions: jobData.regions || [],
          countries: jobData.countries || []
        }
      },
      // Add requirements for Role Analysis
      requirements: jobData.job_requirements || []
    }

    console.log("Formatted job data being returned:", formattedData)
    
    return formattedData
    
  } catch (error) {
    console.error("Job fetch error:", error)
    return null
  }
}


/**
 * Update job attributes and requirements (Role Analysis tab)
 * 
 * @param jobId - Job ID to update
 * @param data - Job attributes and requirements data
 * @returns Object with success status or error message
 */
export async function updateJobRoleAnalysis(
  jobId: string, 
  data: {
    attributes: {
      rate: { value: number | null; freq: string }
      commitment: string
      duration: string
      location: { category: string; regions: string[]; countries: string[] }
    }
    requirements: Array<{
      requirement: string
      type: string
      is_mandatory: boolean
      proficiency_level: string | null
      weight: number
    }>
  }
) {
  try {
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" }
    }

    // Start a transaction-like operation
    // First, update job attributes
    // Convert empty strings to null for fields that reference lookup tables
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        rate: data.attributes.rate.value,
        pay_freq: data.attributes.rate.freq || null,
        commitment: data.attributes.commitment || null,
        duration: data.attributes.duration || null,
        location_reqs: data.attributes.location.category || null,
        regions: data.attributes.location.regions,
        countries: data.attributes.location.countries,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId)
      .eq("user_id", user.id)

    if (jobUpdateError) {
      console.error("Job update error:", jobUpdateError)
      return { success: false, error: "Failed to update job attributes" }
    }

    // Delete existing requirements
    const { error: deleteError } = await supabase
      .from("job_requirements")
      .delete()
      .eq("job_id", jobId)

    if (deleteError) {
      console.error("Requirements delete error:", deleteError)
      return { success: false, error: "Failed to update requirements" }
    }

    // Insert new requirements if any
    if (data.requirements.length > 0) {
      const requirementsData = data.requirements.map(req => ({
        job_id: jobId,
        requirement: req.requirement,
        type: req.type,
        is_mandatory: req.is_mandatory,
        proficiency_level: req.proficiency_level,
        weight: req.weight
      }))

      const { error: insertError } = await supabase
        .from("job_requirements")
        .insert(requirementsData)

      if (insertError) {
        console.error("Requirements insert error:", insertError)
        return { success: false, error: "Failed to save requirements" }
      }
    }

    // Revalidate the current job page
    revalidatePath(`/protected/jobs/${jobId}`)
    
    return { success: true }
    
  } catch (error) {
    console.error("Role analysis update error:", error)
    return { success: false, error: "Failed to update role analysis" }
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
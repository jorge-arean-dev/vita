"use server"

import { createClient } from "@/lib/supabase/server"
import { JobForLinkedInQuery } from "@/app/actions/jobs"

// API request interfaces matching the documentation
interface LinkedInQueryApiRequest {
  attributes: {
    title: string
    location: {
      category: string
      regions: string[]
      countries: string[]
    }
  }
  requirements: {
    requirement: string
    type: string
    is_mandatory: boolean
    proficiency_level: string | null
  }[]
}

interface LinkedInQueryApiResponse {
  boolean_queries: {
    complete_query_all: string
    complete_query_skills_only: string
    complete_query_job_titles_only: string
    mandatory_only_query_all: string
    mandatory_only_query_skills_only: string
    mandatory_only_query_job_titles_only: string
  }
  recommendations: {
    type: string
    display_name_type: string
    recommendation: string
  }[]
}

// Transform database data to API format
function transformJobDataForApi(jobData: JobForLinkedInQuery): LinkedInQueryApiRequest {
  return {
    attributes: {
      title: jobData.title,
      location: {
        category: jobData.location_reqs || "",
        regions: jobData.regions || [],
        countries: jobData.countries || []
      }
    },
    requirements: jobData.job_requirements.map(req => ({
      requirement: req.requirement,
      type: req.type,
      is_mandatory: req.is_mandatory,
      proficiency_level: req.proficiency_level
    }))
  }
}

// Call the LinkedIn queries generation API
export async function generateLinkedInQueries(jobData: JobForLinkedInQuery): Promise<LinkedInQueryApiResponse> {
  const supabase = await createClient()
  
  // Transform job data to API format
  const apiRequest = transformJobDataForApi(jobData)
  
  try {
    console.log('Calling LinkedIn queries API with request:', JSON.stringify(apiRequest, null, 2))
    
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-linkedin-queries', {
      body: apiRequest
    })
    
    console.log('API Response - data:', data)
    console.log('API Response - error:', error)
    
    if (error) {
      console.error('Supabase function error details:', {
        message: error.message,
        context: error.context,
        details: error.details
      })
      throw new Error(`API Error: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned from API')
    }
    
    // Validate response structure
    if (!data.boolean_queries || !data.recommendations) {
      throw new Error('Invalid response format from API')
    }
    
    return data as LinkedInQueryApiResponse
    
  } catch (error) {
    console.error('Error calling LinkedIn queries API:', error)
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Method not allowed')) {
        throw new Error('Invalid request method. Please try again.')
      }
      if (error.message.includes('Please provide')) {
        throw new Error('Missing required job information. Please ensure job has title and requirements.')
      }
      if (error.message.includes('OpenAI API error: 429')) {
        throw new Error('AI service is busy. Please try again in a moment.')
      }
      if (error.message.includes('OpenAI API')) {
        throw new Error('AI query generation service is temporarily unavailable. Please try again.')
      }
      if (error.message.includes('parse AI response')) {
        throw new Error('AI response format error. Please try again.')
      }
      if (error.message.includes('Authorization')) {
        throw new Error('Authentication failed. Please refresh and try again.')
      }
      
      // Re-throw the original error if it's already user-friendly
      throw error
    }
    
    throw new Error('Failed to generate LinkedIn queries. Please try again or contact support.')
  }
}

// Save LinkedIn query data to database
export async function saveLinkedInQueries(
  jobId: string, 
  queryData: LinkedInQueryApiResponse
): Promise<void> {
  const supabase = await createClient()
  
  // Get the current user for security
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }
  
  try {
    // Check if a record already exists for this job
    const { data: existing } = await supabase
      .from('job_linkedin_queries')
      .select('id')
      .eq('job_id', jobId)
      .single()
    
    const saveData = {
      job_id: jobId,
      complete_query_all: queryData.boolean_queries.complete_query_all,
      complete_query_skills_only: queryData.boolean_queries.complete_query_skills_only,
      complete_query_job_titles_only: queryData.boolean_queries.complete_query_job_titles_only,
      mandatory_only_query_all: queryData.boolean_queries.mandatory_only_query_all,
      mandatory_only_query_skills_only: queryData.boolean_queries.mandatory_only_query_skills_only,
      mandatory_only_query_job_titles_only: queryData.boolean_queries.mandatory_only_query_job_titles_only,
      recommendations: queryData.recommendations,
      updated_at: new Date().toISOString()
    }
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('job_linkedin_queries')
        .update(saveData)
        .eq('id', existing.id)
        
      if (updateError) {
        throw new Error(`Failed to update LinkedIn queries: ${updateError.message}`)
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('job_linkedin_queries')
        .insert({
          ...saveData,
          created_at: new Date().toISOString()
        })
        
      if (insertError) {
        throw new Error(`Failed to save LinkedIn queries: ${insertError.message}`)
      }
    }
    
  } catch (error) {
    console.error('Error saving LinkedIn queries:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to save LinkedIn queries to database')
  }
}

// Load existing LinkedIn query data from database
export async function loadLinkedInQueries(jobId: string): Promise<LinkedInQueryApiResponse | null> {
  const supabase = await createClient()
  
  // Get the current user for security
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User not authenticated")
  }
  
  try {
    const { data: queryRecord, error } = await supabase
      .from('job_linkedin_queries')
      .select('*')
      .eq('job_id', jobId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to load LinkedIn queries: ${error.message}`)
    }
    
    if (!queryRecord) {
      return null // No saved queries found
    }
    
    // Transform database record back to API response format
    return {
      boolean_queries: {
        complete_query_all: queryRecord.complete_query_all || '',
        complete_query_skills_only: queryRecord.complete_query_skills_only || '',
        complete_query_job_titles_only: queryRecord.complete_query_job_titles_only || '',
        mandatory_only_query_all: queryRecord.mandatory_only_query_all || '',
        mandatory_only_query_skills_only: queryRecord.mandatory_only_query_skills_only || '',
        mandatory_only_query_job_titles_only: queryRecord.mandatory_only_query_job_titles_only || ''
      },
      recommendations: queryRecord.recommendations || []
    }
    
  } catch (error) {
    console.error('Error loading LinkedIn queries:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to load LinkedIn queries from database')
  }
}
"use server"

import { createClient } from "@/lib/supabase/server"

// Types for interview questions
export interface InterviewQuestion {
  id: string
  question: string
  type: string
  order_index: number
}

export interface JobDescription {
  id: string
  title: string
}

export interface GenerateQuestionsRequest {
  title: string
  job_requirements: Array<{
    requirement: string
    type: string
    is_mandatory: boolean
    proficiency_level: string
  }>
  company_culture?: string
  job_description: string
}

// Fetch job descriptions for a job
export async function getJobDescriptions(jobId: string): Promise<JobDescription[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("job_descriptions")
    .select("id, title")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch job descriptions: ${error.message}`)
  }

  return data || []
}

// Fetch existing questions for a job
export async function getExistingQuestions(jobId: string): Promise<InterviewQuestion[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("job_questions")
    .select("id, content, type, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch existing questions: ${error.message}`)
  }

  // Map database columns to interface
  return (data || []).map((item, index) => ({
    id: item.id,
    question: item.content, // Map content to question
    type: item.type,
    order_index: index // Generate order index from array position
  }))
}

// Save generated questions to database
export async function saveInterviewQuestions(
  jobId: string,
  questions: Array<{ question: string; type: string }>
): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Delete existing questions first
  const { error: deleteError } = await supabase
    .from("job_questions")
    .delete()
    .eq("job_id", jobId)

  if (deleteError) {
    throw new Error(`Failed to delete existing questions: ${deleteError.message}`)
  }

  // Insert new questions
  const questionsToInsert = questions.map((q) => ({
    job_id: jobId,
    content: q.question, // Map question to content
    type: q.type
  }))

  const { error: insertError } = await supabase
    .from("job_questions")
    .insert(questionsToInsert)

  if (insertError) {
    throw new Error(`Failed to save questions: ${insertError.message}`)
  }
}

// Update a single question
export async function updateInterviewQuestion(
  questionId: string,
  newQuestion: string
): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("job_questions")
    .update({ 
      content: newQuestion, // Map question to content
      updated_at: new Date().toISOString()
    })
    .eq("id", questionId)

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`)
  }
}

// Fetch job data for API call
export async function getJobDataForQuestions(jobId: string, jobDescriptionId: string): Promise<GenerateQuestionsRequest> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Fetch job with requirements and company info
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      company_id,
      companies!inner(
        name,
        culture
      ),
      job_requirements(
        requirement,
        type,
        is_mandatory,
        proficiency_level
      )
    `)
    .eq("id", jobId)
    .single()

  if (jobError) {
    throw new Error(`Failed to fetch job data: ${jobError.message}`)
  }

  // Fetch specific job description
  const { data: jobDescription, error: descError } = await supabase
    .from("job_descriptions")
    .select("description")
    .eq("id", jobDescriptionId)
    .single()

  if (descError) {
    throw new Error(`Failed to fetch job description: ${descError.message}`)
  }

  // Format for API
  return {
    title: job.title,
    job_requirements: (job.job_requirements || []).map(req => ({
      requirement: req.requirement,
      type: req.type,
      is_mandatory: req.is_mandatory,
      proficiency_level: req.proficiency_level
    })),
    company_culture: (() => {
      if (Array.isArray(job.companies) && job.companies.length > 0) {
        return job.companies[0].culture || ""
      } else if (job.companies && typeof job.companies === 'object' && 'culture' in job.companies) {
        return (job.companies as { culture?: string }).culture || ""
      }
      return ""
    })(),
    job_description: jobDescription.description
  }
}
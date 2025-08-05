'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas based on API requirements
const emailGenerationSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid().optional().nullable(),
  emailType: z.enum(['candidate', 'client']),
  templateId: z.string(),
  customPrompt: z.string().optional(),
})

const emailSaveSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid().optional().nullable(),
  templateId: z.string(), // Temporarily allow any string, we'll validate UUID later
  emailType: z.enum(['candidate', 'client']),
  title: z.string(),
  subject: z.string(),
  body: z.string(),
})

/**
 * Generate email using the email-builder API
 */
export async function generateEmail(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    console.log('Generating email for user:', user.id)

    // Parse and validate form data
    const candidateIdValue = formData.get('candidateId') as string
    const validatedData = emailGenerationSchema.parse({
      jobId: formData.get('jobId') as string,
      candidateId: candidateIdValue && candidateIdValue !== '' ? candidateIdValue : undefined,
      emailType: formData.get('emailType') as 'candidate' | 'client',
      templateId: formData.get('templateId') as string,
      customPrompt: formData.get('customPrompt') as string || undefined,
    })

    console.log('Fetching job with ID:', validatedData.jobId)

    // First, fetch the job to ensure it exists and belongs to the user
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', validatedData.jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError) {
      console.error('Job fetch error:', jobError)
      return { error: `Failed to fetch job: ${jobError.message}` }
    }

    if (!jobData) {
      return { error: 'Job not found' }
    }

    console.log('Job found:', jobData.id, 'Company ID:', jobData.company_id)

    // Fetch company and industry information
    let companyName = 'Unknown Company'
    let industryName = 'Unknown'
    
    if (jobData.company_id) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name, industry_id')
        .eq('id', jobData.company_id)
        .single()
      
      if (companyError) {
        console.error('Company fetch error:', companyError)
      } else if (company) {
        companyName = company.name
        
        // Fetch industry if company has industry_id
        if (company.industry_id) {
          const { data: industry } = await supabase
            .from('industries')
            .select('name')
            .eq('id', company.industry_id)
            .single()
          
          if (industry) {
            industryName = industry.name
          }
        }
      }
    }

    // Fetch job requirements
    const { data: requirements, error: reqError } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', validatedData.jobId)

    if (reqError) {
      return { error: 'Failed to fetch job requirements' }
    }

    // Fetch candidate data if provided
    let candidateData = null
    if (validatedData.candidateId) {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('first_name, last_name, country')
        .eq('id', validatedData.candidateId)
        .eq('user_id', user.id)
        .single()

      if (candidateError) {
        return { error: 'Candidate not found or access denied' }
      }
      candidateData = candidate
    }

    // Fetch user profile for sender information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, company')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    // Get template prompt or use custom prompt
    let prompt = validatedData.customPrompt
    if (!prompt) {
      const { data: template, error: templateError } = await supabase
        .from('email_builder_templates')
        .select('prompt')
        .eq('id', validatedData.templateId)
        .single()

      if (templateError || !template) {
        return { error: 'Email template not found' }
      }
      prompt = template.prompt
    }

    if (!prompt) {
      return { error: 'No prompt provided for email generation' }
    }

    // Transform data for API
    const apiPayload = {
      job_information: {
        initial_notes: jobData.initial_notes || undefined,
        company_name: companyName,
        industry: industryName,
        attributes: {
          title: jobData.title || undefined,
          rate: jobData.rate ? {
            value: Number(jobData.rate),
            freq: jobData.pay_freq || undefined
          } : undefined,
          commitment: jobData.commitment || undefined,
          duration: jobData.duration || undefined,
          location: {
            category: jobData.location_reqs || undefined,
            regions: jobData.regions || [],
            countries: jobData.countries || []
          }
        },
        requirements: requirements?.map(req => ({
          requirement: req.requirement,
          type: req.type,
          is_mandatory: req.is_mandatory,
          proficiency_level: req.proficiency_level,
          weight: Number(req.weight)
        })) || []
      },
      candidate_information: candidateData ? {
        first_name: candidateData.first_name || undefined,
        last_name: candidateData.last_name || undefined,
        country: candidateData.country || undefined
      } : undefined,
      sender_information: {
        first_name: profile.first_name || '',
        last_name: profile.last_name || undefined,
        position: profile.role || undefined,
        company: profile.company || undefined
      },
      email_type: validatedData.emailType,
      prompt: prompt
    }

    console.log('Email generation payload:', JSON.stringify(apiPayload, null, 2))

    // Call the email-builder API
    const { data: emailResult, error: apiError } = await supabase.functions.invoke('email-builder', {
      body: apiPayload
    })

    if (apiError) {
      console.error('Email API error:', apiError)
      console.error('API payload was:', apiPayload)
      return { error: `Failed to generate email: ${apiError.message}` }
    }

    // Check if the API returned an error in the response
    if (emailResult?.error) {
      console.error('Email API returned error:', emailResult.error)
      return { error: emailResult.error }
    }

    if (!emailResult || !emailResult.subject || !emailResult.body) {
      console.error('Invalid email result:', emailResult)
      return { error: 'Invalid response from email generation service' }
    }

    return { 
      success: true, 
      data: {
        subject: emailResult.subject,
        body: emailResult.body
      }
    }
  } catch (error) {
    console.error('Email generation error:', error)
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors)
      return { error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` }
    }
    return { error: `Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Save generated email to the database
 */
export async function saveEmail(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    const rawTemplateId = formData.get('templateId') as string

    // Parse and validate form data
    const validatedData = emailSaveSchema.parse({
      jobId: formData.get('jobId') as string,
      candidateId: formData.get('candidateId') as string || null,
      templateId: rawTemplateId,
      emailType: formData.get('emailType') as 'candidate' | 'client',
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      body: formData.get('body') as string,
    })

    // Check if templateId is a UUID, if not, look up the template by name to get UUID
    let finalTemplateId = validatedData.templateId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(validatedData.templateId)) {
      // Look up template by name to get the UUID
      const { data: template, error: templateError } = await supabase
        .from('email_builder_templates')
        .select('id')
        .eq('name', validatedData.templateId)
        .single()
      
      if (templateError || !template) {
        return { error: `Template not found: ${validatedData.templateId}` }
      }
      
      finalTemplateId = template.id
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', validatedData.jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return { error: 'Job not found or access denied' }
    }

    // Verify candidate belongs to user if provided
    if (validatedData.candidateId) {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('id')
        .eq('id', validatedData.candidateId)
        .eq('user_id', user.id)
        .single()

      if (candidateError || !candidate) {
        return { error: 'Candidate not found or access denied' }
      }
    }

    // Save email to database
    const { data: savedEmail, error: saveError } = await supabase
      .from('job_email_builder')
      .insert({
        user_id: user.id,
        job_id: validatedData.jobId,
        candidate_id: validatedData.candidateId,
        template: finalTemplateId,
        type: validatedData.emailType,
        title: validatedData.title,
        subject: validatedData.subject,
        body: validatedData.body
      })
      .select()
      .single()

    if (saveError) {
      console.error('Email save error:', saveError)
      return { error: 'Failed to save email' }
    }

    revalidatePath('/protected/jobs/[id]/email-builder')
    return { success: true, data: savedEmail }
  } catch (error) {
    console.error('Email save error:', error)
    if (error instanceof z.ZodError) {
      return { error: `Validation error: ${error.errors[0].message}` }
    }
    return { error: 'Failed to save email' }
  }
}

/**
 * Load saved emails for a job
 */
export async function loadSavedEmails(jobId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Fetch saved emails
    const { data: emails, error: emailsError } = await supabase
      .from('job_email_builder')
      .select(`
        *,
        candidates(first_name, last_name),
        email_builder_templates(name, display_name)
      `)
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (emailsError) {
      return { error: 'Failed to load saved emails' }
    }

    return { success: true, data: emails || [] }
  } catch (error) {
    console.error('Load emails error:', error)
    return { error: 'Failed to load saved emails' }
  }
}

/**
 * Fetch candidates for the logged-in user
 */
export async function fetchUserCandidates() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Fetch candidates for this user
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (candidatesError) {
      return { error: 'Failed to load candidates' }
    }

    // Transform candidates to match component expectations
    const transformedCandidates = (candidates || []).map(candidate => {
      // Handle names with null/empty values
      let name = 'Unknown Name'
      if (candidate.first_name && candidate.last_name) {
        name = `${candidate.first_name} ${candidate.last_name}`
      } else if (candidate.first_name) {
        name = candidate.first_name
      } else if (candidate.last_name) {
        name = candidate.last_name
      }

      return {
        id: candidate.id,
        name: name,
        email: candidate.email || undefined
      }
    })

    return { success: true, data: transformedCandidates }
  } catch (error) {
    console.error('Fetch candidates error:', error)
    return { error: 'Failed to fetch candidates' }
  }
}

/**
 * Delete email from database
 */
export async function deleteEmail(emailId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Delete the email (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('job_email_builder')
      .delete()
      .eq('id', emailId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Email delete error:', deleteError)
      return { error: 'Failed to delete email' }
    }

    revalidatePath('/protected/jobs/[id]/email-builder')
    return { success: true }
  } catch (error) {
    console.error('Delete email error:', error)
    return { error: 'Failed to delete email' }
  }
}

/**
 * Fetch email templates from database
 */
export async function fetchEmailTemplates() {
  try {
    const supabase = await createClient()
    
    // Get current user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Fetch email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_builder_templates')
      .select('id, name, display_name, description, type')
      .order('name', { ascending: true })

    if (templatesError) {
      return { error: 'Failed to load email templates' }
    }

    // Group templates by type and sort with custom templates at the end
    const candidateTemplates = (templates || [])
      .filter(t => t.type === 'candidate')
      .sort((a, b) => {
        // Place custom_candidate at the end
        if (a.name === 'custom_candidate') return 1
        if (b.name === 'custom_candidate') return -1
        // Sort others alphabetically by display name
        return a.display_name.localeCompare(b.display_name)
      })
      .map(t => ({
        id: t.id,
        name: t.display_name,
        description: t.description,
        templateName: t.name // Add the actual name field for checking
      }))

    const clientTemplates = (templates || [])
      .filter(t => t.type === 'client')
      .sort((a, b) => {
        // Place custom_client at the end
        if (a.name === 'custom_client') return 1
        if (b.name === 'custom_client') return -1
        // Sort others alphabetically by display name
        return a.display_name.localeCompare(b.display_name)
      })
      .map(t => ({
        id: t.id,
        name: t.display_name,
        description: t.description,
        templateName: t.name // Add the actual name field for checking
      }))

    return { 
      success: true, 
      data: {
        candidateTemplates,
        clientTemplates
      }
    }
  } catch (error) {
    console.error('Fetch templates error:', error)
    return { error: 'Failed to fetch email templates' }
  }
}
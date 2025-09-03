'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const createInterviewSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  meetingLink: z.string().url().refine(
    (url) => url.includes('meet.google.com'),
    'Only Google Meet links are supported in this MVP'
  )
})

const analyzeInterviewSchema = z.object({
  interviewId: z.string().uuid()
})

const simulateInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  performanceLevel: z.enum(['bad', 'mid', 'good'])
})

// Real Recall.ai integration
async function createRecallBot(meetingLink: string, botName: string = 'Vita Notetaker'): Promise<string> {
  try {
    // Import the Recall client
    const { recallClient } = await import('@/lib/api/recall')
    
    // Create bot using real API
    const bot = await recallClient.createBot(meetingLink, botName)
    
    // Bot creation successful
    
    return bot.id
  } catch (error) {
    console.error('[Recall API] Failed to create bot:', error)
    throw error
  }
}

// Create a new interview session
export async function createInterview(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const rawData = {
      jobId: formData.get('jobId') as string,
      candidateId: formData.get('candidateId') as string,
      title: formData.get('title') as string,
      meetingLink: formData.get('meetingLink') as string
    }

    const validatedData = createInterviewSchema.parse(rawData)

    // Check if job exists and belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', validatedData.jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return { error: 'Job not found or unauthorized' }
    }

    // Create Recall.ai bot (real API)
    const recallBotId = await createRecallBot(validatedData.meetingLink)

    // Create interview record
    const { data: interview, error: insertError } = await supabase
      .from('interviews')
      .insert({
        job_id: validatedData.jobId,
        candidate_id: validatedData.candidateId,
        user_id: user.id,
        title: validatedData.title,
        meeting_link: validatedData.meetingLink,
        recall_bot_id: recallBotId,
        status: 'created'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating interview:', insertError)
      return { error: 'Failed to create interview' }
    }

    // Note: Bot status will be updated via webhooks when it joins the meeting
    // No need for manual status updates as the webhook will handle this

    revalidatePath(`/protected/jobs/${validatedData.jobId}/interview-companion`)
    
    return { data: interview }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Unexpected error in createInterview:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Update interview status (internal use)
export async function updateInterviewStatus(
  interviewId: string, 
  status: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('interviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', interviewId)

  if (error) {
    console.error('Error updating interview status:', error)
    return { error: 'Failed to update interview status' }
  }

  return { success: true }
}

// Find interview by Recall bot ID
export async function findInterviewByBotId(botId: string) {
  const supabase = await createClient()
  
  console.log(`[DB] Searching for interview with bot_id: ${botId}`)

  // First, let's see all interviews to debug
  const { data: allInterviews } = await supabase
    .from('interviews')
    .select('id, recall_bot_id, status, title')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('[DB] Recent interviews:', allInterviews?.map(i => ({ 
    id: i.id.substring(0, 8), 
    bot_id: i.recall_bot_id?.substring(0, 8), 
    status: i.status,
    title: i.title 
  })))
  
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('id, job_id, status')
    .eq('recall_bot_id', botId)
    .single()

  if (error) {
    console.error('[DB] Error finding interview by bot ID:', error)
    return { error: 'Interview not found', data: null }
  }

  console.log(`[DB] Found interview: ${interview.id}`)
  return { data: interview, error: null }
}

// Update interview status by bot ID (for webhook processing)
export async function updateInterviewStatusByBotId(
  botId: string, 
  status: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed'
) {
  console.log(`[DB] Updating interview status: bot ${botId} -> ${status}`)
  
  // Check if service role key is available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('[DB] SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
    console.log('[DB] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    return { error: 'Service role key not configured' }
  }
  
  // Use service role for webhook operations (bypasses RLS)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  console.log(`[DB] Using service role client for bot ID: ${botId}`)
  
  const { data, error } = await supabase
    .from('interviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('recall_bot_id', botId)
    .select()

  if (error) {
    console.error('[DB] Update error details:', error)
    console.error('[DB] Bot ID being searched:', botId)
    
    // Let's also try to find the interview to see if it exists
    const { data: searchData, error: searchError } = await supabase
      .from('interviews')
      .select('id, recall_bot_id, status')
      .eq('recall_bot_id', botId)
      
    if (searchError) {
      console.error('[DB] Search error:', searchError)
    } else {
      console.log('[DB] Search results:', searchData)
    }
    
    return { error: 'Failed to update interview status' }
  }

  console.log(`[DB] Updated ${data?.length || 0} interviews`)
  if (data && data.length > 0) {
    console.log(`[DB] Updated interview ${data[0].id} to status: ${data[0].status}`)
  }
  return { success: true, updatedCount: data?.length || 0 }
}

// Process webhook data from Recall.ai (will be called from webhook route)
export async function processTranscriptWebhook(
  interviewId: string,
  transcriptData: Array<{
    speaker: string
    text: string
    start_time: number
    end_time: number
  }>
) {
  const supabase = await createClient()

  // Store transcript segments (keeping for compatibility)
  const { error: transcriptError } = await supabase
    .from('interview_transcripts')
    .insert(
      transcriptData.map(segment => ({
        interview_id: interviewId,
        speaker: segment.speaker,
        text: segment.text,
        start_time: segment.start_time,
        end_time: segment.end_time
      }))
    )

  if (transcriptError) {
    console.error('Error storing transcript segments:', transcriptError)
    return { error: 'Failed to store transcript segments' }
  }

  // Store full transcript in JSONB column
  const fullTranscriptJson = {
    segments: transcriptData.map(segment => ({
      speaker: segment.speaker,
      text: segment.text,
      start_time: segment.start_time,
      end_time: segment.end_time
    })),
    metadata: {
      retrieved_at: new Date().toISOString(),
      total_segments: transcriptData.length
    }
  }

  const { error: fullTranscriptError } = await supabase
    .from('interviews')
    .update({ full_transcript: fullTranscriptJson })
    .eq('id', interviewId)

  if (fullTranscriptError) {
    console.error('Error storing full transcript:', fullTranscriptError)
    return { error: 'Failed to store full transcript' }
  }

  // Update interview status to ready for analysis
  await updateInterviewStatus(interviewId, 'ready_for_analysis')

  console.log(`[Transcript] Stored ${transcriptData.length} segments for interview ${interviewId}`)
  return { success: true }
}

// Process transcript by bot ID (for webhook processing)
export async function processTranscriptByBotId(
  botId: string,
  transcriptData: Array<{
    speaker: string
    text: string
    start_time: number
    end_time: number
  }>
) {
  console.log(`[Transcript] Processing transcript for bot ID: ${botId}`)
  
  // Check if service role key is available  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('[Transcript] SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
    return { error: 'Service role key not configured' }
  }
  
  // Use service role client to find interview
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Find interview by bot ID using service role
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('id, job_id, status')
    .eq('recall_bot_id', botId)
    .single()

  if (error || !interview) {
    console.error('[Transcript] Interview not found for bot ID:', botId, error)
    return { error: 'Interview not found for bot ID' }
  }

  console.log(`[Transcript] Found interview ${interview.id} for bot ${botId}`)

  // Store transcript segments (keeping for compatibility) using service role
  const { error: transcriptError } = await supabase
    .from('interview_transcripts')
    .insert(
      transcriptData.map(segment => ({
        interview_id: interview.id,
        speaker: segment.speaker,
        text: segment.text,
        start_time: segment.start_time,
        end_time: segment.end_time
      }))
    )

  if (transcriptError) {
    console.error('[Transcript] Error storing transcript segments:', transcriptError)
    return { error: 'Failed to store transcript segments' }
  }

  // Store full transcript in JSONB column using service role
  const fullTranscriptJson = {
    segments: transcriptData.map(segment => ({
      speaker: segment.speaker,
      text: segment.text,
      start_time: segment.start_time,
      end_time: segment.end_time
    })),
    metadata: {
      retrieved_at: new Date().toISOString(),
      total_segments: transcriptData.length
    }
  }

  const { error: fullTranscriptError } = await supabase
    .from('interviews')
    .update({ full_transcript: fullTranscriptJson })
    .eq('id', interview.id)

  if (fullTranscriptError) {
    console.error('[Transcript] Error storing full transcript:', fullTranscriptError)
    return { error: 'Failed to store full transcript' }
  }

  // Update interview status to ready for analysis using our service role function
  const statusUpdateResult = await updateInterviewStatusByBotId(botId, 'ready_for_analysis')
  if (!statusUpdateResult.success) {
    console.error('[Transcript] Failed to update interview status after transcript processing')
  }

  console.log(`[Transcript] Stored ${transcriptData.length} segments for interview ${interview.id}`)
  return { success: true }
}

// Mock scoring function
async function generateMockScore(transcript: string, jobContext: { title?: string; job_description?: string }) {
  // Use parameters for future AI integration
  console.log(`[Mock Analysis] Processing transcript (${transcript.length} chars) for job: ${jobContext.title}`);
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Generate mock score between 2.5 and 4.0
  const baseScore = 2.5 + Math.random() * 1.5
  const overall_score = Math.round(baseScore * 10) / 10

  // Generate mock analysis
  const analysis = {
    overall_score,
    strengths: [
      'Clear communication throughout the interview',
      'Demonstrated relevant technical knowledge',
      'Good problem-solving approach'
    ],
    areas_for_improvement: [
      'Could provide more specific examples',
      'Consider asking clarifying questions'
    ],
    key_moments: [
      {
        timestamp: '00:05:23',
        highlight: 'Excellent explanation of previous project experience'
      },
      {
        timestamp: '00:12:45',
        highlight: 'Strong technical problem-solving demonstration'
      }
    ],
    recommendation: overall_score >= 3.5 
      ? 'Strong candidate - recommend proceeding to next round'
      : 'Consider for further evaluation'
  }

  return analysis
}

// Trigger analysis for an interview
export async function analyzeInterview(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const rawData = {
      interviewId: formData.get('interviewId') as string
    }

    const validatedData = analyzeInterviewSchema.parse(rawData)

    // Get interview with job details and existing transcripts
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        jobs (
          id,
          title,
          job_description,
          initial_notes,
          rate,
          commitment
        ),
        interview_transcripts (
          speaker,
          text,
          start_time,
          end_time
        )
      `)
      .eq('id', validatedData.interviewId)
      .eq('user_id', user.id)
      .single()

    if (interviewError || !interview) {
      return { error: 'Interview not found or unauthorized' }
    }

    // Check if interview is ready for analysis
    if (interview.status !== 'ready_for_analysis' && interview.status !== 'completed') {
      return { error: 'Interview is not ready for analysis yet' }
    }

    // Update status to analyzing
    await updateInterviewStatus(validatedData.interviewId, 'analyzing')

    // Combine transcript segments into full text
    const fullTranscript = (interview.interview_transcripts || [])
      .sort((a: { start_time: number }, b: { start_time: number }) => a.start_time - b.start_time)
      .map((t: { speaker: string; text: string }) => `${t.speaker}: ${t.text}`)
      .join('\n')

    // Generate mock analysis
    const analysis = await generateMockScore(fullTranscript, interview.jobs)

    // Check if score already exists
    const { data: existingScore } = await supabase
      .from('interview_scores')
      .select('id')
      .eq('interview_id', validatedData.interviewId)
      .single()

    if (existingScore) {
      // Update existing score
      const { error: updateError } = await supabase
        .from('interview_scores')
        .update({
          overall_score: analysis.overall_score,
          analysis,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScore.id)

      if (updateError) {
        console.error('Error updating score:', updateError)
        return { error: 'Failed to update analysis' }
      }
    } else {
      // Create new score
      const { error: insertError } = await supabase
        .from('interview_scores')
        .insert({
          interview_id: validatedData.interviewId,
          overall_score: analysis.overall_score,
          analysis
        })

      if (insertError) {
        console.error('Error creating score:', insertError)
        return { error: 'Failed to save analysis' }
      }
    }

    // Update interview status to completed
    await updateInterviewStatus(validatedData.interviewId, 'completed')

    revalidatePath(`/protected/jobs/${interview.job_id}/interview-companion`)
    
    return { data: analysis }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Unexpected error in analyzeInterview:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Search candidates for a job
export async function searchCandidates(jobId: string, searchTerm?: string) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized', data: null }
    }

    let query = supabase
      .from('candidates')
      .select('id, first_name, last_name, email')
      .eq('user_id', user.id)
      .order('first_name', { ascending: true })

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      const search = searchTerm.trim().toLowerCase()
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data: candidates, error } = await query.limit(20)

    if (error) {
      console.error('Error searching candidates:', error)
      return { error: 'Failed to search candidates', data: null }
    }

    return { data: candidates, error: null }
  } catch (error) {
    console.error('Unexpected error in searchCandidates:', error)
    return { error: 'An unexpected error occurred', data: null }
  }
}

// Generate interview title based on candidate and existing interviews
export async function generateInterviewTitle(candidateId: string, jobId: string) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized', data: null }
    }

    // Get candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('first_name, last_name')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      return { error: 'Candidate not found', data: null }
    }

    const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown'

    // Count existing interviews for this candidate in this job
    const { count, error: countError } = await supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting interviews:', countError)
      // Return basic title if count fails
      return { data: `Interview - ${candidateName}`, error: null }
    }

    // Generate title with number if there are existing interviews
    const title = count && count > 0 
      ? `Interview - ${candidateName} ${count + 1}`
      : `Interview - ${candidateName}`

    return { data: title, error: null }
  } catch (error) {
    console.error('Unexpected error in generateInterviewTitle:', error)
    return { error: 'An unexpected error occurred', data: null }
  }
}

// Get interviews for a job
export async function getJobInterviews(jobId: string) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized', data: null }
    }

    const { data: interviews, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidates (
          id,
          first_name,
          last_name,
          email
        ),
        interview_statuses!fk_interviews_status (
          display_name,
          description
        ),
        interview_scores (
          overall_score,
          analysis
        ),
        interview_transcripts (
          id
        )
      `)
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching interviews:', error)
      return { error: 'Failed to fetch interviews', data: null }
    }

    // Add transcript count
    const interviewsWithCount = interviews.map(interview => ({
      ...interview,
      transcript_count: interview.interview_transcripts?.length || 0,
      interview_transcripts: undefined // Remove the raw transcript data
    }))

    return { data: interviewsWithCount, error: null }
  } catch (error) {
    console.error('Unexpected error in getJobInterviews:', error)
    return { error: 'An unexpected error occurred', data: null }
  }
}

// Get single interview with full details
export async function getInterviewDetails(interviewId: string) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized', data: null }
    }

    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidates (
          id,
          first_name,
          last_name,
          email
        ),
        interview_statuses!fk_interviews_status (
          display_name,
          description
        ),
        jobs (
          id,
          title,
          job_description
        ),
        interview_scores (
          overall_score,
          analysis,
          created_at,
          updated_at
        ),
        interview_transcripts (
          speaker,
          text,
          start_time,
          end_time
        )
      `)
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching interview details:', error)
      return { error: 'Failed to fetch interview details', data: null }
    }

    return { data: interview, error: null }
  } catch (error) {
    console.error('Unexpected error in getInterviewDetails:', error)
    return { error: 'An unexpected error occurred', data: null }
  }
}

// Simulate receiving webhook data (for testing)
export async function simulateWebhookReceived(interviewId: string) {
  // Generate mock transcript data
  const mockTranscript = [
    { speaker: 'Interviewer', text: 'Hello, thanks for joining. Can you tell me about yourself?', start_time: 0, end_time: 5 },
    { speaker: 'Candidate', text: 'Sure! I have 5 years of experience in software development...', start_time: 5, end_time: 15 },
    { speaker: 'Interviewer', text: 'That sounds great. Can you describe a challenging project?', start_time: 15, end_time: 20 },
    { speaker: 'Candidate', text: 'One of the most challenging projects was building a real-time data pipeline...', start_time: 20, end_time: 35 },
    { speaker: 'Interviewer', text: 'How did you handle the scalability issues?', start_time: 35, end_time: 40 },
    { speaker: 'Candidate', text: 'We implemented a distributed architecture using message queues...', start_time: 40, end_time: 55 },
  ]

  return await processTranscriptWebhook(interviewId, mockTranscript)
}

// Simulate an interview by generating AI-powered transcript
export async function simulateInterview(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const rawData = {
      interviewId: formData.get('interviewId')?.toString(),
      performanceLevel: formData.get('performanceLevel')?.toString()
    }

    const validatedData = simulateInterviewSchema.safeParse(rawData)
    if (!validatedData.success) {
      return { 
        error: 'Invalid input: ' + validatedData.error.errors.map(e => e.message).join(', ')
      }
    }

    const { interviewId, performanceLevel } = validatedData.data

    // Verify interview exists and user has access
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, status, user_id')
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single()

    if (interviewError || !interview) {
      return { error: 'Interview not found or access denied' }
    }

    // Verify interview is in correct status
    if (interview.status !== 'created') {
      return { error: 'Interview simulation only allowed for interviews in "created" status' }
    }

    // Call Supabase Edge Function to generate transcript
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
      'simulate-interview',
      {
        body: {
          interview_id: interviewId,
          performance_level: performanceLevel
        }
      }
    )

    if (functionError) {
      console.error('Edge function error:', functionError)
      return { error: 'Failed to generate interview transcript' }
    }

    if (!functionResponse.success || !functionResponse.transcript) {
      return { error: functionResponse.error || 'Failed to generate transcript' }
    }

    // Process the generated transcript through existing workflow
    const result = await processTranscriptWebhook(interviewId, functionResponse.transcript)
    
    if (result.success) {
      // Revalidate the interviews page
      revalidatePath('/dashboard/jobs/[id]', 'page')
      return { success: true, message: 'Interview simulation completed successfully' }
    } else {
      return { error: result.error || 'Failed to process generated transcript' }
    }

  } catch (error) {
    console.error('Error simulating interview:', error)
    return { error: 'Internal server error' }
  }
}
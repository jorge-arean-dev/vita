import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  interview_id: string
  performance_level: 'bad' | 'mid' | 'good'
}

interface JobDetails {
  title: string
  job_description: string | null
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { interview_id, performance_level }: RequestBody = await req.json()

    if (!interview_id || !performance_level) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: interview_id and performance_level' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch interview and job details
    const { data: interview, error: interviewError } = await supabaseClient
      .from('interviews')
      .select(`
        id,
        status,
        jobs!inner (
          title,
          job_description
        )
      `)
      .eq('id', interview_id)
      .single()

    if (interviewError || !interview) {
      return new Response(
        JSON.stringify({ error: 'Interview not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate interview status
    if (interview.status !== 'created') {
      return new Response(
        JSON.stringify({ error: 'Interview simulation only allowed for interviews in "created" status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jobDetails = interview.jobs as JobDetails
    
    // Generate transcript using OpenAI
    const transcript = await generateTranscript(jobDetails, performance_level)

    // Return the generated transcript
    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript,
        message: 'Interview transcript generated successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in simulate-interview function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateTranscript(
  jobDetails: JobDetails, 
  performanceLevel: 'bad' | 'mid' | 'good'
): Promise<Array<{ speaker: string; text: string; start_time: number; end_time: number }>> {
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Create performance-specific prompts
  const performanceDescriptions = {
    bad: 'The candidate struggles with answers, shows uncertainty, lacks specific examples, and demonstrates poor technical knowledge. Responses are often incomplete or incorrect.',
    mid: 'The candidate provides average responses with some good points but lacks depth in certain areas. Shows moderate confidence and has some relevant experience.',
    good: 'The candidate gives strong, confident answers with specific examples, demonstrates solid technical knowledge, and shows excellent problem-solving skills.'
  }

  const prompt = `Generate a realistic 30-minute technical interview transcript between an interviewer and a candidate for the following job:

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.job_description || 'No specific description provided'}

Performance Level: ${performanceLevel.toUpperCase()}
${performanceDescriptions[performanceLevel]}

Requirements:
- Generate exactly 30 minutes (1800 seconds) of conversation
- Use speaker names: "interviewer" and "candidate" (lowercase)
- Include realistic technical questions relevant to the job
- Make responses appropriate to the performance level
- Include natural conversation flow with follow-up questions
- Provide accurate timestamps in seconds
- Create approximately 20-30 exchanges total

Return ONLY a JSON array with this exact format:
[
  {
    "speaker": "interviewer",
    "text": "Hello, thank you for joining us today. Can you start by telling me about yourself?",
    "start_time": 0,
    "end_time": 8
  },
  {
    "speaker": "candidate", 
    "text": "Thank you for having me. I'm a software developer with...",
    "start_time": 8,
    "end_time": 25
  }
]

Make sure the conversation flows naturally and the final end_time is approximately 1800 seconds (30 minutes).`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at generating realistic interview transcripts. Return only valid JSON without any additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content received from OpenAI')
  }

  try {
    // Parse the JSON response from OpenAI
    const transcript = JSON.parse(content.trim())
    
    // Validate the structure
    if (!Array.isArray(transcript)) {
      throw new Error('Invalid transcript format: not an array')
    }

    // Validate each segment has required fields
    for (const segment of transcript) {
      if (!segment.speaker || !segment.text || typeof segment.start_time !== 'number' || typeof segment.end_time !== 'number') {
        throw new Error('Invalid segment format in transcript')
      }
    }

    return transcript
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', parseError)
    console.error('Raw content:', content)
    throw new Error('Failed to parse OpenAI response as valid JSON')
  }
}
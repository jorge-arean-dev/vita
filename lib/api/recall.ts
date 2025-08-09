// Recall.ai API Integration Module
// Real API implementation

const RECALL_API_KEY = process.env.RECALL_API_KEY || 'mock_recall_api_key'
const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1'
export const DEFAULT_BOT_NAME = 'Vita Notetaker'

export interface RecallBot {
  id: string
  meeting_url: string
  bot_name: string
  status: 'created' | 'joining' | 'in_call' | 'done' | 'error'
  transcription_provider?: string
  created_at: string
  fatal?: boolean
  sub_code?: string
}

export interface RecallTranscript {
  speaker: string
  text: string
  start_time: number
  end_time: number
}

export class RecallClient {
  private apiKey: string

  constructor(apiKey: string = RECALL_API_KEY) {
    this.apiKey = apiKey
  }

  // Create a bot to join a meeting
  async createBot(meetingUrl: string, botName: string = DEFAULT_BOT_NAME): Promise<RecallBot> {
    try {
      const webhookUrl = process.env.RECALL_WEBHOOK_URL || 
        (process.env.NEXT_PUBLIC_VERCEL_URL 
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/recall/webhooks`
          : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recall/webhooks`)

      const requestBody = {
        meeting_url: meetingUrl,
        bot_name: botName,
        recording_config: {
          transcript: {
            provider: {
              meeting_captions: {}
            }
          }
        },
        webhook_config: {
          url: webhookUrl
        }
      }
      
      console.log(`[Recall API] Creating bot: ${botName} | webhook: ${webhookUrl}`)
      
      const response = await fetch(`${RECALL_API_URL}/bot/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error:', response.status, errorData)
        throw new Error(`Failed to create bot: ${response.status} ${response.statusText}`)
      }

      const botData = await response.json()
      console.log(`[Recall API] Bot created: ${botData.id}`)

      return {
        id: botData.id,
        meeting_url: botData.meeting_url,
        bot_name: botData.bot_name || botName,
        status: botData.status_changes?.[botData.status_changes.length - 1]?.code || 'created',
        transcription_provider: botData.transcription_options?.provider,
        created_at: botData.created_at,
        fatal: botData.status_changes?.some((change: { fatal: boolean }) => change.fatal),
        sub_code: botData.status_changes?.[botData.status_changes.length - 1]?.sub_code
      }
    } catch (error) {
      console.error('[Recall API] Bot creation failed:', error.message)
      throw error
    }
  }

  // Get bot status
  async getBotStatus(botId: string): Promise<RecallBot> {
    try {
      const response = await fetch(`${RECALL_API_URL}/bot/${botId}/`, {
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error (getBotStatus):', response.status, errorData)
        throw new Error(`Failed to get bot status: ${response.status} ${response.statusText}`)
      }

      const botData = await response.json()
      
      return {
        id: botData.id,
        meeting_url: botData.meeting_url,
        bot_name: botData.bot_name,
        status: botData.status_changes?.[botData.status_changes.length - 1]?.code || 'unknown',
        transcription_provider: botData.transcription_options?.provider,
        created_at: botData.created_at,
        fatal: botData.status_changes?.some((change: { fatal: boolean }) => change.fatal),
        sub_code: botData.status_changes?.[botData.status_changes.length - 1]?.sub_code
      }
    } catch (error) {
      console.error('Error getting bot status:', error)
      throw error
    }
  }

  // Create transcript job for a completed recording
  async createTranscript(recordingId: string): Promise<{ transcript_id: string }> {
    try {
      console.log(`[Recall API] Creating transcript job for recording: ${recordingId}`)
      
      const response = await fetch(`${RECALL_API_URL}/recording/${recordingId}/create_transcript/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: {
            recallai_async: {
              language_code: 'en'
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error (createTranscript):', response.status, errorData)
        throw new Error(`Failed to create transcript: ${response.status} ${response.statusText}`)
      }

      const transcriptData = await response.json()
      console.log(`[Recall API] Transcript job created: ${transcriptData.id}`)
      
      return { transcript_id: transcriptData.id }
    } catch (error) {
      console.error('Error creating transcript job:', error)
      throw error
    }
  }

  // Get transcript data using transcript ID
  async getTranscriptById(transcriptId: string): Promise<RecallTranscript[]> {
    try {
      console.log(`[Recall API] Fetching transcript: ${transcriptId}`)
      
      const response = await fetch(`${RECALL_API_URL}/transcript/${transcriptId}/`, {
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error (getTranscript):', response.status, errorData)
        throw new Error(`Failed to get transcript: ${response.status} ${response.statusText}`)
      }

      const transcriptData = await response.json()
      
      console.log(`[Recall API] Transcript response keys:`, Object.keys(transcriptData))
      console.log(`[Recall API] Transcript status:`, transcriptData.status)
      console.log(`[Recall API] Full transcript data:`, JSON.stringify(transcriptData, null, 2))
      
      // Extract status code from status object
      const statusCode = transcriptData.status?.code || transcriptData.status
      console.log(`[Recall API] Status code:`, statusCode)
      
      // Check transcript status first
      if (statusCode === 'error' || statusCode === 'failed') {
        console.error(`[Recall API] Transcript failed with status: ${statusCode}`)
        throw new Error(`Transcript generation failed: ${statusCode}`)
      }
      
      if (statusCode !== 'done' && statusCode !== 'completed') {
        console.warn(`[Recall API] Transcript not ready yet, status: ${statusCode}`)
        return []
      }
      
      // Check if transcript has a download URL - try different possible locations
      let downloadUrl = transcriptData.download_url || transcriptData.data?.download_url
      
      if (downloadUrl) {
        console.log(`[Recall API] Fetching transcript content from: ${downloadUrl}`)
        
        // Fetch the actual transcript content
        const contentResponse = await fetch(downloadUrl)
        if (!contentResponse.ok) {
          throw new Error(`Failed to download transcript content: ${contentResponse.status}`)
        }
        
        const transcriptContent = await contentResponse.json()
        console.log(`[Recall API] Downloaded transcript structure:`, {
          isArray: Array.isArray(transcriptContent),
          hasUtterances: !!transcriptContent.utterances,
          hasSegments: !!transcriptContent.segments,
          hasTranscript: !!transcriptContent.transcript,
          keys: Object.keys(transcriptContent),
          length: transcriptContent.length,
          firstItem: transcriptContent[0]
        })
        
        // Handle different possible structures
        let segments = []
        
        // If it's directly an array (most likely case based on logs)
        if (Array.isArray(transcriptContent)) {
          segments = transcriptContent
        } else if (transcriptContent.utterances && Array.isArray(transcriptContent.utterances)) {
          segments = transcriptContent.utterances
        } else if (transcriptContent.segments && Array.isArray(transcriptContent.segments)) {
          segments = transcriptContent.segments
        } else if (transcriptContent.transcript && Array.isArray(transcriptContent.transcript)) {
          segments = transcriptContent.transcript
        }
        
        console.log(`[Recall API] Processing ${segments.length} transcript segments`)
        
        // Transform to our expected format
        return segments.map((segment: {
          speaker?: string
          text?: string
          start?: number
          end?: number
          start_time?: number
          end_time?: number
          participant?: {
            name?: string
            id?: number
          }
          words?: Array<{
            text?: string
            start?: number
            end?: number
          }>
        }) => {
          // Handle Recall.ai format with participant and words
          if (segment.participant && segment.words) {
            const speaker = segment.participant.name || `Participant ${segment.participant.id}` || 'Unknown'
            const text = segment.words.map(word => word.text || '').join(' ')
            const start_time = segment.words.length > 0 ? (segment.words[0].start || 0) : 0
            const end_time = segment.words.length > 0 ? (segment.words[segment.words.length - 1].end || 0) : 0
            
            console.log(`[Recall API] Transformed segment: ${speaker}: "${text}" (${start_time}-${end_time})`)
            
            return {
              speaker,
              text,
              start_time,
              end_time
            }
          }
          
          // Handle standard format
          return {
            speaker: segment.speaker || 'Unknown',
            text: segment.text || '',
            start_time: segment.start_time || segment.start || 0,
            end_time: segment.end_time || segment.end || 0
          }
        })
      }
      
      console.warn('[Recall API] No download URL found in transcript data')
      return []
    } catch (error) {
      console.error('Error getting transcript:', error)
      throw error
    }
  }

  // Legacy method - get transcript for a completed recording (now properly implemented)
  async getTranscriptByRecordingId(recordingId: string): Promise<RecallTranscript[]> {
    try {
      // First create a transcript job
      const { transcript_id } = await this.createTranscript(recordingId)
      
      // Wait a bit for processing (in real implementation, we'd use webhooks)
      console.log(`[Recall API] Waiting for transcript processing...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Then fetch the transcript
      return await this.getTranscriptById(transcript_id)
    } catch (error) {
      console.error('Error getting transcript by recording ID:', error)
      return []
    }
  }

  // Legacy method - keep for backward compatibility but mark as deprecated
  async getTranscript(botId: string): Promise<RecallTranscript[]> {
    console.warn('[Recall API] getTranscript is deprecated, use getTranscriptByRecordingId instead')
    // Try the legacy endpoint first, if it fails, return empty array
    try {
      const response = await fetch(`${RECALL_API_URL}/bot/${botId}/transcript/`, {
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn('[Recall API] Legacy transcript endpoint failed, returning empty transcript')
        return []
      }

      const transcriptData = await response.json()
      
      // Transform Recall.ai transcript format to our format
      return transcriptData.map((segment: { 
        speaker?: string; 
        words?: { text: string }[]; 
        text?: string; 
        start_time?: number; 
        end_time?: number; 
      }) => ({
        speaker: segment.speaker || 'Unknown',
        text: segment.words?.map((word) => word.text).join(' ') || segment.text || '',
        start_time: segment.start_time || 0,
        end_time: segment.end_time || 0,
      }))
    } catch (error) {
      console.warn('[Recall API] Legacy transcript failed, returning empty transcript:', error)
      return []
    }
  }

  // Delete a bot
  async deleteBot(botId: string): Promise<void> {
    try {
      const response = await fetch(`${RECALL_API_URL}/bot/${botId}/`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error (deleteBot):', response.status, errorData)
        throw new Error(`Failed to delete bot: ${response.status} ${response.statusText}`)
      }

      console.log('[Recall API] Bot deleted successfully:', botId)
    } catch (error) {
      console.error('Error deleting bot:', error)
      throw error
    }
  }
}

// Singleton instance
export const recallClient = new RecallClient()
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
      
      console.log('[Recall API] Creating bot with:', {
        url: `${RECALL_API_URL}/bot/`,
        webhook_url: webhookUrl,
        headers: {
          'Authorization': `Token ${this.apiKey.substring(0, 10)}...`,
          'Content-Type': 'application/json',
        },
        body: requestBody
      })
      
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
      console.log('[Recall API] Bot created successfully:', botData.id)

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
      console.error('Error creating Recall bot:', error)
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

  // Get transcript for a completed recording
  async getTranscript(botId: string): Promise<RecallTranscript[]> {
    try {
      const response = await fetch(`${RECALL_API_URL}/bot/${botId}/transcript/`, {
        headers: { 
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Recall API Error (getTranscript):', response.status, errorData)
        throw new Error(`Failed to get transcript: ${response.status} ${response.statusText}`)
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
      console.error('Error getting transcript:', error)
      throw error
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
// Recall.ai API Integration Module
// Using mock implementation for MVP

const RECALL_API_KEY = process.env.RECALL_API_KEY || 'mock_recall_api_key'
const RECALL_API_URL = 'https://api.recall.ai/v2'

export interface RecallBot {
  id: string
  meeting_url: string
  bot_name: string
  status: 'created' | 'joining' | 'in_call' | 'done' | 'error'
  transcription_provider: string
  created_at: string
}

export interface RecallTranscript {
  speaker: string
  text: string
  start_time: number
  end_time: number
}

// Mock implementation - replace with actual API calls in production
export class RecallClient {
  private apiKey: string

  constructor(apiKey: string = RECALL_API_KEY) {
    this.apiKey = apiKey
  }

  // Create a bot to join a meeting
  async createBot(meetingUrl: string, botName: string = 'Vita Interview Bot'): Promise<RecallBot> {
    // In production, this would make an actual API call:
    // const response = await fetch(`${RECALL_API_URL}/bots`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     meeting_url: meetingUrl,
    //     bot_name: botName,
    //     transcription: { provider: 'assemblyai' },
    //     real_time_transcription: { enabled: true },
    //   }),
    // })

    // Mock response
    const mockBot: RecallBot = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meeting_url: meetingUrl,
      bot_name: botName,
      status: 'created',
      transcription_provider: 'assemblyai',
      created_at: new Date().toISOString(),
    }

    // Simulate bot joining after a delay
    setTimeout(() => {
      console.log('[Mock Recall] Bot joining meeting:', meetingUrl)
      mockBot.status = 'joining'
    }, 2000)

    setTimeout(() => {
      console.log('[Mock Recall] Bot in call:', meetingUrl)
      mockBot.status = 'in_call'
    }, 5000)

    return mockBot
  }

  // Get bot status
  async getBotStatus(botId: string): Promise<RecallBot> {
    // In production, make actual API call
    // const response = await fetch(`${RECALL_API_URL}/bots/${botId}`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
    // })

    // Mock response
    return {
      id: botId,
      meeting_url: 'https://meet.google.com/mock-meeting',
      bot_name: 'Vita Interview Bot',
      status: 'in_call',
      transcription_provider: 'assemblyai',
      created_at: new Date().toISOString(),
    }
  }

  // Get transcript for a completed recording
  async getTranscript(botId: string): Promise<RecallTranscript[]> {
    // In production, make actual API call
    // const response = await fetch(`${RECALL_API_URL}/bots/${botId}/transcript`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
    // })

    // Mock transcript data
    const mockTranscript: RecallTranscript[] = [
      {
        speaker: 'Interviewer',
        text: 'Hello, thanks for joining today. Can you start by telling me about yourself?',
        start_time: 0,
        end_time: 5,
      },
      {
        speaker: 'Candidate',
        text: 'Sure! I have 5 years of experience in software development, primarily working with React and Node.js. I\'ve led several projects focused on building scalable web applications.',
        start_time: 5,
        end_time: 15,
      },
      {
        speaker: 'Interviewer',
        text: 'That sounds great. Can you describe a particularly challenging project you\'ve worked on?',
        start_time: 15,
        end_time: 20,
      },
      {
        speaker: 'Candidate',
        text: 'One of the most challenging projects was building a real-time data pipeline that processed millions of events per day. We had to optimize for both throughput and latency.',
        start_time: 20,
        end_time: 35,
      },
      {
        speaker: 'Interviewer',
        text: 'How did you handle the scalability challenges?',
        start_time: 35,
        end_time: 40,
      },
      {
        speaker: 'Candidate',
        text: 'We implemented a distributed architecture using message queues and microservices. We also used caching strategically and implemented proper monitoring to identify bottlenecks.',
        start_time: 40,
        end_time: 55,
      },
      {
        speaker: 'Interviewer',
        text: 'What technologies did you use for the message queuing?',
        start_time: 55,
        end_time: 60,
      },
      {
        speaker: 'Candidate',
        text: 'We used Apache Kafka for the main event streaming and Redis for caching. The microservices were containerized with Docker and orchestrated using Kubernetes.',
        start_time: 60,
        end_time: 75,
      },
      {
        speaker: 'Interviewer',
        text: 'Excellent. Do you have any questions for me about the role or the company?',
        start_time: 75,
        end_time: 80,
      },
      {
        speaker: 'Candidate',
        text: 'Yes, I\'d like to know more about the team structure and what technologies you\'re currently using.',
        start_time: 80,
        end_time: 90,
      },
    ]

    return mockTranscript
  }

  // Delete a bot
  async deleteBot(botId: string): Promise<void> {
    // In production, make actual API call
    // await fetch(`${RECALL_API_URL}/bots/${botId}`, {
    //   method: 'DELETE',
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
    // })

    console.log('[Mock Recall] Bot deleted:', botId)
  }
}

// Singleton instance
export const recallClient = new RecallClient()
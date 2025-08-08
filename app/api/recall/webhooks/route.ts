import { NextRequest, NextResponse } from 'next/server'
import { processTranscriptWebhook } from '@/app/actions/interviews'

// Mock webhook secret (in production, use environment variable)
const WEBHOOK_SECRET = process.env.RECALL_WEBHOOK_SECRET || 'mock_webhook_secret'

// Verify webhook signature (mock implementation)
function verifyWebhookSignature(request: NextRequest): boolean {
  const signature = request.headers.get('x-recall-signature')
  // In production, implement proper signature verification using Svix
  // For now, just check if a signature header exists
  return !!signature || process.env.NODE_ENV === 'development'
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Handle different webhook events
    const { event, data } = body

    console.log('[Webhook] Received event:', event)

    switch (event) {
      case 'bot.joined':
        // Bot successfully joined the meeting
        console.log('[Webhook] Bot joined meeting:', data.bot_id)
        break

      case 'recording.started':
        // Recording has started
        console.log('[Webhook] Recording started:', data.bot_id)
        break

      case 'recording.completed':
        // Recording completed, transcript should be ready
        console.log('[Webhook] Recording completed:', data.bot_id)
        
        // In production, you would:
        // 1. Fetch the transcript from Recall.ai API using bot_id
        // 2. Parse and process the transcript
        // 3. Store it in the database
        
        // For MVP, we'll simulate this with mock data
        if (data.interview_id && data.transcript) {
          await processTranscriptWebhook(data.interview_id, data.transcript)
        }
        break

      case 'bot.error':
        // Handle bot errors
        console.error('[Webhook] Bot error:', data.error)
        break

      default:
        console.log('[Webhook] Unhandled event type:', event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'recall.ai webhook endpoint',
    timestamp: new Date().toISOString()
  })
}
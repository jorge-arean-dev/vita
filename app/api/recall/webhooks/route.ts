import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { 
  processTranscriptByBotId, 
  updateInterviewStatusByBotId
} from '@/app/actions/interviews'

const WEBHOOK_SECRET = process.env.RECALL_WEBHOOK_SECRET

// Verify webhook signature using Svix
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  if (process.env.NODE_ENV === 'development' && !WEBHOOK_SECRET) {
    // In development, allow webhooks without signature verification if no secret is set
    console.warn('[Webhook] Development mode: Skipping signature verification')
    return true
  }

  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] No webhook secret configured')
    return false
  }

  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Webhook] Missing required Svix headers')
      return false
    }

    // Verify the webhook
    wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })

    return true
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    
    // Verify webhook signature
    if (!verifyWebhookSignature(request, body)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const webhookData = JSON.parse(body)
    
    // Handle different webhook events
    const { event, data } = webhookData

    console.log('[Webhook] Received event:', event)

    switch (webhookData.event_type || event) {
      case 'bot.status_change':
        // Bot status changed (created, joining, in_call, done, error)
        console.log('[Webhook] Bot status changed:', data.bot_id, 'to', data.status)
        
        // Update interview status based on bot status
        if (data.bot_id && data.status) {
          let interviewStatus: 'created' | 'in_progress' | 'ready_for_analysis' | 'analyzing' | 'completed' | null = null
          
          // Map Recall bot status to our interview status
          switch (data.status) {
            case 'created':
            case 'joining':
              interviewStatus = 'created'
              break
            case 'in_call':
              interviewStatus = 'in_progress'
              break
            case 'done':
              // Don't change status on 'done' - wait for recording.completed
              console.log('[Webhook] Bot finished, waiting for recording completion')
              break
            case 'error':
              console.error('[Webhook] Bot error:', data.sub_code || data.error)
              // Keep current status on error
              break
            default:
              console.log('[Webhook] Unknown bot status:', data.status)
              break
          }
          
          if (interviewStatus) {
            await updateInterviewStatusByBotId(data.bot_id, interviewStatus)
          }
        }
        break

      case 'recording.status_change':
        // Recording status changed (recording, processing, done)
        console.log('[Webhook] Recording status changed:', data.bot_id, 'to', data.status)
        break

      case 'recording.completed':
        // Recording completed, transcript should be ready
        console.log('[Webhook] Recording completed:', data.bot_id)
        
        // Fetch the transcript from Recall.ai and process it
        if (data.bot_id) {
          try {
            // Import recallClient to fetch transcript
            const { recallClient } = await import('@/lib/api/recall')
            const transcript = await recallClient.getTranscript(data.bot_id)
            
            // Process the transcript using bot ID
            if (transcript && transcript.length > 0) {
              const result = await processTranscriptByBotId(data.bot_id, transcript)
              
              if (result.error) {
                console.error('[Webhook] Failed to process transcript:', result.error)
              } else {
                console.log('[Webhook] Transcript processed successfully for bot:', data.bot_id)
              }
            } else {
              console.warn('[Webhook] No transcript data found for bot:', data.bot_id)
            }
          } catch (error) {
            console.error('[Webhook] Failed to fetch transcript for bot:', data.bot_id, error)
          }
        }
        break

      case 'bot.transcription_message':
        // Real-time transcription message (optional)
        console.log('[Webhook] Real-time transcription:', data.bot_id)
        break

      case 'bot.error':
      case 'bot.status_change.error':
        // Handle bot errors
        console.error('[Webhook] Bot error:', data.bot_id, data.error || data.sub_code)
        break

      default:
        console.log('[Webhook] Unhandled event type:', webhookData.event_type || event, webhookData)
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
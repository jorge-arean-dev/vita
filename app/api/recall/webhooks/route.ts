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

    // Extract correct bot ID and status from actual Recall.ai format
    const botId = data.bot?.id
    const recordingId = data.recording?.id
    const statusCode = data.data?.code
    
    console.log(`[WEBHOOK] ${webhookData.event_type || event} | bot_id: ${botId} | recording_id: ${recordingId} | status: ${statusCode}`)

    switch (webhookData.event_type || event) {
      case 'bot.joining_call':
        // Bot is joining the call
        if (botId) {
          console.log('[Webhook] Bot joining call, updating status to created')
          const result = await updateInterviewStatusByBotId(botId, 'created')
          console.log('[Webhook] Status update result:', result)
        }
        break

      case 'bot.in_call_recording':
        // Bot is actively recording
        if (botId) {
          console.log('[Webhook] Bot started recording, updating status to in_progress')
          const result = await updateInterviewStatusByBotId(botId, 'in_progress')
          console.log('[Webhook] Status update result:', result)
        }
        break

      case 'bot.call_ended':
      case 'bot.done':
        // Bot finished but don't change status - wait for recording.done
        console.log('[Webhook] Bot finished, waiting for recording completion')
        break

      case 'recording.status_change':
        // Recording status changed (recording, processing, done)
        console.log('[Webhook] Recording status changed:', data.bot_id, 'to', data.status)
        break

      case 'recording.done':
        // Recording completed, but transcript job may already exist
        console.log('[Webhook] Recording completed - bot:', botId, 'recording:', recordingId)
        
        // Don't create transcript job here - Recall.ai may auto-create them
        // Just wait for transcript.done or transcript.failed webhooks
        console.log('[Webhook] Waiting for transcript webhooks, not creating duplicate job')
        break

      case 'transcript.done':
        // Transcript generation completed
        const transcriptId = data.transcript?.id
        console.log('[Webhook] Transcript completed - bot:', botId, 'transcript:', transcriptId)
        
        if (transcriptId && botId) {
          try {
            console.log('[Webhook] Fetching completed transcript:', transcriptId)
            const { recallClient } = await import('@/lib/api/recall')
            const transcript = await recallClient.getTranscriptById(transcriptId)
            
            if (transcript && transcript.length > 0) {
              const result = await processTranscriptByBotId(botId, transcript)
              if (result.error) {
                console.error('[Webhook] Failed to process transcript:', result.error)
                await updateInterviewStatusByBotId(botId, 'ready_for_analysis')
              } else {
                console.log('[Webhook] Transcript processed successfully')
                // Status is updated by processTranscriptByBotId
              }
            } else {
              console.log('[Webhook] Empty transcript received, updating status anyway')
              await updateInterviewStatusByBotId(botId, 'ready_for_analysis')
            }
          } catch (error) {
            console.error('[Webhook] Failed to process completed transcript:', error)
            await updateInterviewStatusByBotId(botId, 'ready_for_analysis')
          }
        }
        break

      case 'transcript.failed':
        // Transcript generation failed
        const failedTranscriptId = data.transcript?.id
        console.error('[Webhook] Transcript generation failed - bot:', botId, 'transcript:', failedTranscriptId)
        if (botId) {
          console.log('[Webhook] Updating interview status after transcript failure')
          await updateInterviewStatusByBotId(botId, 'ready_for_analysis')
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
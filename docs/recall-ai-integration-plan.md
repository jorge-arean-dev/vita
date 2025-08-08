# Recall.ai Integration Plan for Interview Companion

## Overview
This document outlines the integration plan for connecting the Vita Interview Companion with Recall.ai to enable real Google Meet recording and transcription functionality.

## Current State
- ✅ Database schema complete (interviews, interview_transcripts, interview_scores)
- ✅ Mock Recall.ai integration implemented
- ✅ UI components built and functional
- ✅ Server actions for interview management
- ✅ Candidate selection and title generation
- 🔄 Mock webhook simulation works for testing

## Integration Research Summary

### Recall.ai Platform Capabilities
- **Supported Platforms**: Google Meet, Zoom, Microsoft Teams, Cisco Webex, Slack Huddles
- **Authentication**: API Key with `Authorization: Token YOUR_API_KEY` header
- **Bot Behavior**: Joins as anonymous user, requires manual admission by participants
- **Recording**: No special permissions needed for Google Meet
- **Webhooks**: Delivered via Svix with signature verification

### Key Limitations
- ❌ Google Meet livestreams not supported
- ❌ Breakout rooms not supported
- ⚠️ Bot must be manually admitted by meeting participants
- ⚠️ Bot appears as "anonymous" until admitted

## Implementation Plan

### Phase 1: Core API Integration
**Goal**: Replace mock implementation with real Recall.ai API calls

#### Tasks:
1. **Update Environment Variables**
   - Obtain real API key from Recall.ai dashboard
   - Update `.env.local` and Vercel environment variables
   ```bash
   RECALL_API_KEY=your_real_api_key_here
   RECALL_WEBHOOK_SECRET=to_be_obtained_in_phase_2
   ```

2. **Modify Recall Client (`/lib/api/recall.ts`)**
   - Replace mock `createBot()` with real API call
   - Implement proper authentication headers
   - Add error handling for API responses
   - Update bot status checking methods
   - Implement transcript retrieval methods

3. **Update Server Actions**
   - Modify `createInterview()` to handle real bot creation responses
   - Add proper error handling for Recall.ai API failures
   - Update status tracking based on real bot lifecycle

4. **Testing Phase 1**
   - Test bot creation with real Google Meet URLs
   - Verify bots appear in Recall.ai dashboard
   - Confirm authentication works correctly
   - Test error scenarios (invalid URLs, API failures)

### Phase 2: Webhook Integration
**Goal**: Enable real-time event handling from Recall.ai

#### Prerequisites:
- Phase 1 complete and tested
- Ngrok setup for development testing

#### Tasks:
1. **Development Webhook Setup**
   ```bash
   # Terminal 1: Start app
   pnpm dev
   
   # Terminal 2: Expose publicly
   npx ngrok http 3000
   ```

2. **Configure Recall.ai Webhook Dashboard**
   - URL: `https://abc123.ngrok.io/api/recall/webhooks`
   - Events to subscribe:
     - `bot.status_change` (bot joins/leaves)
     - `recording.status_change` (recording starts/stops)
     - `recording.completed` (transcript ready) ⭐ **Most Important**
     - `bot.transcription_message` (optional - real-time)
   - Obtain webhook secret from dashboard

3. **Implement Webhook Security (`/app/api/recall/webhooks/route.ts`)**
   - Install Svix package: `npm install svix`
   - Replace mock verification with real signature checking
   - Add proper error handling and logging
   - Handle different webhook event types

4. **Update Database Integration**
   - Modify `processTranscriptWebhook()` to handle real transcript data
   - Map Recall.ai transcript format to our database schema
   - Handle speaker diarization data
   - Update interview status based on webhook events

5. **Testing Phase 2**
   - Test webhook delivery with ngrok
   - Verify signature verification works
   - Test full meeting flow with real transcripts
   - Monitor webhook logs and error handling

### Phase 3: Production Deployment
**Goal**: Deploy to production with full functionality

#### Tasks:
1. **Production Webhook Configuration**
   - Deploy to Vercel with real environment variables
   - Update webhook URL in Recall.ai dashboard: `https://your-app.vercel.app/api/recall/webhooks`
   - Test webhook delivery in production

2. **Enhanced Error Handling**
   - Implement retry logic for failed API calls
   - Add comprehensive logging and monitoring
   - Handle rate limits and API quotas
   - Create fallback mechanisms for webhook failures

3. **User Experience Improvements**
   - Add bot admission instructions for Google Meet users
   - Implement better status tracking and user feedback
   - Add transcript processing progress indicators
   - Handle edge cases (meeting cancellation, bot kicked out)

4. **Testing Phase 3**
   - End-to-end testing with real meetings
   - Multi-user testing scenarios
   - Performance testing with longer meetings
   - Error recovery testing

## Technical Implementation Details

### API Endpoints Required

#### Bot Creation
```typescript
POST /api/bots
Headers: Authorization: Token YOUR_API_KEY
Body: {
  meeting_url: "https://meet.google.com/xxx-xxxx-xxx",
  bot_name: "Vita Interview Bot",
  transcription: { provider: "assemblyai" },
  real_time_transcription: { enabled: true }
}
```

#### Bot Status Check
```typescript
GET /api/bots/{bot_id}
Headers: Authorization: Token YOUR_API_KEY
```

#### Transcript Retrieval
```typescript
GET /api/bots/{bot_id}/transcript
Headers: Authorization: Token YOUR_API_KEY
```

### Webhook Event Flow

1. **Bot Creation** → `bot.status_change` (status: "created")
2. **Bot Joins Meeting** → `bot.status_change` (status: "in_call")
3. **Recording Starts** → `recording.status_change` (status: "recording")
4. **Meeting Ends** → `recording.completed` ⭐ **Triggers transcript processing**

### Database Mapping

```typescript
// Recall.ai transcript format → Our database
{
  speaker: string,      // Maps to interview_transcripts.speaker
  text: string,         // Maps to interview_transcripts.text
  start_time: number,   // Maps to interview_transcripts.start_time
  end_time: number      // Maps to interview_transcripts.end_time
}
```

## Risk Assessment & Mitigation

### High Risk
- **Bot Admission Dependency**: Users must manually admit bot
  - *Mitigation*: Clear UI instructions, bot naming convention
- **Webhook Delivery Failures**: Network issues, server downtime
  - *Mitigation*: Retry mechanisms, fallback status polling

### Medium Risk
- **API Rate Limits**: Recall.ai usage quotas
  - *Mitigation*: Rate limiting, queue management
- **Transcript Processing Delays**: Large meetings, processing time
  - *Mitigation*: Async processing, progress indicators

### Low Risk
- **Google Meet Platform Changes**: Platform updates affecting bots
  - *Mitigation*: Regular testing, Recall.ai platform support

## Success Metrics

### Phase 1 Success Criteria
- ✅ Bot creation API calls successful (200 responses)
- ✅ Bots visible in Recall.ai dashboard
- ✅ Error handling functional for invalid requests

### Phase 2 Success Criteria
- ✅ Webhook events received and processed correctly
- ✅ Transcripts stored in database with proper formatting
- ✅ Interview status updates reflect real bot lifecycle

### Phase 3 Success Criteria
- ✅ End-to-end meeting recording and analysis functional
- ✅ Production deployment stable and performant
- ✅ User experience smooth with proper error handling

## Development Timeline

- **Phase 1**: 1-2 days (API integration, basic testing)
- **Phase 2**: 2-3 days (webhook setup, testing with real meetings)
- **Phase 3**: 1-2 days (production deployment, optimization)

**Total Estimated Time**: 4-7 days

## Next Steps

1. **Immediate**: Obtain Recall.ai API key and begin Phase 1 implementation
2. **After Phase 1**: Set up ngrok and webhook configuration
3. **Testing**: Use real Google Meet meetings for validation
4. **Production**: Deploy with full monitoring and error handling

---

*Last Updated: 2025-08-08*
*Status: Ready for Phase 1 Implementation*
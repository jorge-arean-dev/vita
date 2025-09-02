# Prompt for AI Builder: Implement Interview Companion MVP with Recall.ai Integration (Google Meet)

## Objective
Implement a **minimum viable product (MVP)** for the Interview Companion feature inside Vita, using Recall.ai as the meeting recording & transcription provider.
Documentation available in: "https://docs.recall.ai/docs/"

---

## MVP Scope
- **Platform**: Google Meet only
- **Recording**: Audio/video recorded via Recall.ai bot
- **Transcript**: Store transcript only (no audio/video files), including speaker labels
- **Analysis Trigger**: Manual trigger by the user after transcript is ready
- **Scoring**: MVP scoring (0–4 scale) using job context and transcript content

---

## Step-by-Step Build Plan

### 1. Database & Types
Add new tables and columns in Supabase:

```sql
-- Interviews table
create table interviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  recall_bot_id text,
  status text check (status in ('created', 'in_progress', 'ready_for_analysis', 'analyzing', 'completed')) default 'created',
  meeting_link text,
  analysis_triggered_at timestamptz,
  analysis_triggered_by uuid references users(id),
  created_at timestamptz default now()
);

-- Interview transcripts table
create table interview_transcripts (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade,
  speaker text,
  text text,
  start_time numeric,
  end_time numeric
);

-- Interview scores table
create table interview_scores (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade,
  overall_score numeric,
  analysis jsonb,
  created_at timestamptz default now()
);
```

Regenerate `types/database.types.ts` to include these tables.

---

### 2. API Contracts

#### **POST `/api/interviews`**
- Input: `{ job_id, meeting_link }`
- Create `interviews` row with status `created`
- Call Recall.ai **Create Bot** endpoint for Google Meet, configured with free transcription provider that supports speaker diarization
- Store `recall_bot_id`

#### **POST `/api/recall/webhooks`**
- Receive events from Recall.ai (secure via Svix)
- On `recording.completed`:
  - Fetch transcript via Recall API
  - Parse into `{ speaker, text, start_time, end_time }` rows
  - Store in `interview_transcripts`
  - Update `interviews.status` to `ready_for_analysis`

#### **POST `/api/interviews/:id/analyze`**
- Auth check: user must have access to parent job
- Preconditions: status is `ready_for_analysis` or `completed`
- Steps:
  - Set status to `analyzing`
  - Run scoring logic (using job details + transcript)
  - Store results in `interview_scores` (overwrite if exists)
  - Set status to `completed`

---

### 3. Recall.ai Configuration & Transcription Providers
- Use **Google Meet** integration
- Set transcription provider to **free tier provider** that includes speaker diarization
- Ensure bot is configured with `transcription: true` and `diarization: true`
- Store `recall_bot_id` for later fetching of transcript

#### **Configurable Transcription Providers**
The system supports multiple transcription providers with internal configuration switching. To change providers, modify the `TRANSCRIPTION_CONFIG` object in `lib/api/recall.ts`:

```typescript
const TRANSCRIPTION_CONFIG = {
  // Provider for real-time transcription during recording
  REALTIME_PROVIDER: 'deepgram' as TranscriptionProvider,
  
  // Provider for async transcription after recording
  ASYNC_PROVIDER: 'deepgram_async' as TranscriptionProvider,
  
  // Language configuration
  LANGUAGE: 'en',
  
  // Feature flags
  ENABLE_DIARIZATION: true,
  ENABLE_SMART_FORMAT: true,
  ENABLE_PUNCTUATION: true,
}
```

#### **Available Transcription Providers**

| Provider | Real-time | Async | Quality | Speaker Diarization | Notes |
|----------|-----------|-------|---------|-------------------|-------|
| `meeting_captions` | ✅ | ❌ | Basic | Limited | Free, platform-native captions |
| `recallai_streaming` | ✅ | ❌ | Good | ✅ | Recall.ai's service, $0.15/hour |
| `recallai_async` | ❌ | ✅ | Good | ✅ | Recall.ai's service, $0.15/hour |
| `deepgram` | ✅ | ❌ | Excellent | ✅ | **Recommended for quality** |
| `deepgram_async` | ❌ | ✅ | Excellent | ✅ | **Best quality option** |
| `assembly_ai_v3` | ✅ | ❌ | Excellent | ✅ | High-quality AI transcription |
| `assembly_ai_async_chunked` | ❌ | ✅ | Excellent | ✅ | Premium async processing |
| `aws_transcribe` | ✅ | ❌ | Good | ✅ | AWS service |
| `aws_transcribe_streaming` | ✅ | ❌ | Good | ✅ | AWS streaming |
| `speechmatics` | ✅ | ❌ | Good | ✅ | Enterprise-grade |
| `rev` | ✅ | ❌ | Good | ✅ | Rev.ai service |

#### **Provider Setup Requirements**
1. **Create account** with your chosen provider (Deepgram, AssemblyAI, etc.)
2. **Get API key** from provider dashboard
3. **Configure in Recall.ai dashboard**: Settings → Transcription Providers → Add your provider credentials
4. **Update configuration** in `lib/api/recall.ts`
5. **Restart development server** to apply changes

#### **Recommended Configurations**

**For highest quality (recommended):**
```typescript
REALTIME_PROVIDER: 'deepgram',
ASYNC_PROVIDER: 'deepgram_async',
```

**For testing without external setup:**
```typescript
REALTIME_PROVIDER: 'meeting_captions',
ASYNC_PROVIDER: 'recallai_async',
```

**For enterprise/production:**
```typescript
REALTIME_PROVIDER: 'assembly_ai_v3',
ASYNC_PROVIDER: 'assembly_ai_async_chunked',
```

**For cost optimization (async-only transcription):**
```typescript
REALTIME_PROVIDER: 'meeting_captions',  // Minimal cost during recording
ASYNC_PROVIDER: 'deepgram_async',        // High quality after recording
ENABLE_REALTIME_QUALITY: false,         // Disables expensive real-time processing
```

#### **Real-time vs Async-only Configuration**

**Cost Optimization Mode (Current Default):**
- **Real-time**: Uses basic `meeting_captions` (free platform captions)
- **Async**: Uses high-quality `deepgram_async` for final transcript
- **Cost**: ~50% reduction in transcription costs
- **Quality**: Excellent final transcript, basic live captions

**Toggle Back to Full Quality:**
To enable high-quality real-time transcription, simply change:
```typescript
ENABLE_REALTIME_QUALITY: true,  // Enables Deepgram real-time (increases cost ~2x)
```

**Benefits of Async-only:**
- ✅ **Lower cost**: Pay once for high-quality processing instead of twice
- ✅ **Better quality**: Async transcription is more accurate than real-time
- ✅ **Better diarization**: More processing time for speaker identification
- ✅ **Same end result**: Final analysis uses the high-quality async transcript

**Trade-offs:**
- ❌ **No live captions**: Basic platform captions during meeting (usually sufficient)
- ❌ **Processing delay**: Must wait for async transcription after meeting ends

Example bot creation payload with Deepgram:
```json
{
  "bot_name": "Vita Interview Bot",
  "meeting_url": "https://meet.google.com/xyz-abc-def",
  "recording_config": {
    "transcript": {
      "provider": {
        "deepgram": {
          "language": "en",
          "diarize": true,
          "smart_format": true,
          "punctuate": true
        }
      }
    }
  }
}
```

---

### 4. Server Actions & Integration Layer
- Place Recall.ai integration under `lib/api/recall.ts`
- Webhook handling under `app/api/recall/webhooks/route.ts`
- Scoring logic in `app/actions/interviews.ts` or a dedicated `analysis` action

---

### 5. UI Implementation

#### **New Route**  
`/protected/jobs/[id]/interview-companion`

#### **How this new route will be accessed**  
A new card labeled "Interview Companion" will be added to `/protected/jobs/[id]/`, similar to the other existing tools.

#### **States**
1. **No interview scheduled** → Show “Create Interview” form (meeting link prefilled or input)
2. **Interview in progress** → Show status indicator
3. **Transcript ready** → Badge: “Ready to analyze” + Button: “Analyze now”
4. **Analyzing** → Spinner + message
5. **Completed** → Show score + analysis summary + tab for full transcript with speaker labels

#### **Components**
- Interview creation form (Dialog or inline)
- Transcript list (speaker, text)
- Score card (overall + highlights)
- Primary button for manual analysis trigger

---

### 6. Build Order
1. **DB migrations & Supabase types**
2. **API contracts (stubs)**
3. **Recall.ai integration + webhook**
4. **Scoring action**
5. **UI slice for Interview Companion**

---

### 7. Environment Variables
```env
RECALL_API_KEY=
RECALL_WEBHOOK_SECRET=
```

---

## Deliverables
- DB schema updates & migrations
- API endpoints & server actions
- Recall.ai integration module
- Minimal UI for interview lifecycle
- Manual scoring trigger

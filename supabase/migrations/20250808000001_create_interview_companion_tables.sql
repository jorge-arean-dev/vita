-- Create interviews table
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  recall_bot_id text,
  status text check (status in ('created', 'in_progress', 'ready_for_analysis', 'analyzing', 'completed')) default 'created',
  meeting_link text,
  analysis_triggered_at timestamptz,
  analysis_triggered_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create interview transcripts table
create table if not exists public.interview_transcripts (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references public.interviews(id) on delete cascade not null,
  speaker text not null,
  text text not null,
  start_time numeric,
  end_time numeric,
  created_at timestamptz default now()
);

-- Create interview scores table
create table if not exists public.interview_scores (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references public.interviews(id) on delete cascade not null,
  overall_score numeric check (overall_score >= 0 and overall_score <= 4),
  analysis jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_interviews_job_id on public.interviews(job_id);
create index if not exists idx_interviews_user_id on public.interviews(user_id);
create index if not exists idx_interviews_status on public.interviews(status);
create index if not exists idx_interview_transcripts_interview_id on public.interview_transcripts(interview_id);
create index if not exists idx_interview_scores_interview_id on public.interview_scores(interview_id);

-- Add updated_at trigger for interviews
create trigger update_interviews_updated_at before update on public.interviews
  for each row execute function update_updated_at_column();

-- Add updated_at trigger for interview_scores
create trigger update_interview_scores_updated_at before update on public.interview_scores
  for each row execute function update_updated_at_column();

-- RLS policies for interviews table
alter table public.interviews enable row level security;

create policy "Users can view their own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "Users can create their own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interviews"
  on public.interviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own interviews"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- RLS policies for interview_transcripts table
alter table public.interview_transcripts enable row level security;

create policy "Users can view transcripts of their interviews"
  on public.interview_transcripts for select
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can create transcripts for their interviews"
  on public.interview_transcripts for insert
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can update transcripts of their interviews"
  on public.interview_transcripts for update
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can delete transcripts of their interviews"
  on public.interview_transcripts for delete
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- RLS policies for interview_scores table
alter table public.interview_scores enable row level security;

create policy "Users can view scores of their interviews"
  on public.interview_scores for select
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_scores.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can create scores for their interviews"
  on public.interview_scores for insert
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_scores.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can update scores of their interviews"
  on public.interview_scores for update
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_scores.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can delete scores of their interviews"
  on public.interview_scores for delete
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_scores.interview_id
      and interviews.user_id = auth.uid()
    )
  );
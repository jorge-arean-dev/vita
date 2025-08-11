-- Create interview_statuses lookup table
create table if not exists public.interview_statuses (
  name text primary key,
  display_name text not null,
  description text,
  sort_order integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add updated_at trigger
create trigger update_interview_statuses_updated_at before update on public.interview_statuses
  for each row execute function update_updated_at_column();

-- Insert status values
insert into public.interview_statuses (name, display_name, description, sort_order) values
  ('created', 'Created', 'Interview session has been created but recording has not started yet', 1),
  ('in_progress', 'In Progress', 'Recording is actively in progress', 2),
  ('ready_for_analysis', 'Ready to Analyze', 'Recording completed and transcript is available for analysis', 3),
  ('analyzing', 'Analyzing', 'AI analysis is currently being performed on the transcript', 4),
  ('completed', 'Completed', 'Analysis has been completed and results are available', 5)
on conflict (name) do nothing;

-- Drop the existing check constraint on interviews table
alter table public.interviews 
  drop constraint if exists interviews_status_check;

-- Add foreign key constraint to interviews table
alter table public.interviews
  add constraint fk_interviews_status
  foreign key (status) references public.interview_statuses(name)
  on update cascade;

-- Add RLS policies for interview_statuses table
alter table public.interview_statuses enable row level security;

-- Allow all authenticated users to read statuses (they're just lookup values)
create policy "Anyone can view interview statuses"
  on public.interview_statuses for select
  using (true);

-- Only admins can modify statuses (you can adjust this based on your needs)
create policy "Only admins can insert interview statuses"
  on public.interview_statuses for insert
  with check (false);

create policy "Only admins can update interview statuses"
  on public.interview_statuses for update
  using (false);

create policy "Only admins can delete interview statuses"
  on public.interview_statuses for delete
  using (false);
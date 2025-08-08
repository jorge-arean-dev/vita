-- Add candidate_id and title columns to interviews table

-- First, add the columns as nullable to handle existing data
alter table public.interviews 
  add column if not exists candidate_id uuid,
  add column if not exists title text;

-- Add foreign key constraint for candidate_id
alter table public.interviews
  add constraint fk_interviews_candidate_id
  foreign key (candidate_id) references public.candidates(id)
  on delete restrict;

-- Create index for better query performance
create index if not exists idx_interviews_candidate_id on public.interviews(candidate_id);

-- For existing interviews, we'll set a default title
-- (In production, you might want to handle this differently)
update public.interviews 
set title = 'Interview ' || substring(id::text from 1 for 8)
where title is null;

-- Now make the columns required for future inserts
-- Note: We're not making candidate_id NOT NULL yet to avoid breaking existing records
-- You can add this constraint later after ensuring all existing records have a candidate_id
alter table public.interviews 
  alter column title set not null;

-- Comment for future reference
comment on column public.interviews.candidate_id is 'Reference to the candidate being interviewed';
comment on column public.interviews.title is 'Custom title for the interview session';
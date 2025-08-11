-- Add years_of_experience column to candidates_skills table
-- This allows storing skill-specific experience data from resume parsing and LinkedIn APIs

ALTER TABLE public.candidates_skills 
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.candidates_skills.years_of_experience IS 'Years of experience for this specific skill (nullable - may not always be available from APIs)';
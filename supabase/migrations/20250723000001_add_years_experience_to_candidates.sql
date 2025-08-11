-- Add years_experience column to candidates table
-- This column stores the years of experience for each candidate
-- Supports integers and one decimal place (e.g., 5, 5.5)

ALTER TABLE public.candidates 
ADD COLUMN years_experience NUMERIC(3,1) CHECK (years_experience >= 0 AND years_experience <= 99.9);

-- Add comment to document the column
COMMENT ON COLUMN public.candidates.years_experience IS 'Years of experience for the candidate. Supports up to 99.9 years with one decimal place precision.';
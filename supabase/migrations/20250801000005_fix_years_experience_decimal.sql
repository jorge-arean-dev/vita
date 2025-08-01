-- Fix years_of_experience column to accept decimal values
-- The APIs return decimal years like 1.5, 2.3, etc. but INTEGER only accepts whole numbers

ALTER TABLE public.candidates_skills 
ALTER COLUMN years_of_experience TYPE DECIMAL(4,1);

-- Update comment to reflect the decimal support
COMMENT ON COLUMN public.candidates_skills.years_of_experience IS 'Years of experience for this specific skill in decimal format (e.g. 1.5, 2.3) - nullable as may not always be available from APIs';
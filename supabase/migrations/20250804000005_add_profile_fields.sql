-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS role TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.company IS 'Company where the user works';
COMMENT ON COLUMN public.profiles.role IS 'User current role at the company';
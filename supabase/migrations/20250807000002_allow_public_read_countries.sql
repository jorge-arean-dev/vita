-- Allow public (unauthenticated) users to read countries table
-- This is needed for the waitlist form on the public landing page

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can read countries" ON public.countries;

-- Create a new policy that allows anyone to read countries
CREATE POLICY "Anyone can read countries" 
  ON public.countries 
  FOR SELECT 
  USING (true);

-- Note: This is safe because the countries table contains only 
-- public reference data (country names, ISO codes, etc.)
-- No sensitive information is exposed
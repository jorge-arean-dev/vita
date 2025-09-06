-- Add RLS policies for seniority_levels lookup table
-- Following the same pattern as other lookup tables (read-only for authenticated users)

-- Enable RLS on seniority_levels table
ALTER TABLE public.seniority_levels ENABLE ROW LEVEL SECURITY;

-- Seniority levels policies
CREATE POLICY "Authenticated users can read seniority levels" 
  ON public.seniority_levels 
  FOR SELECT 
  USING (auth.role() = 'authenticated');
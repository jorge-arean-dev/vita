-- Update RLS policies for job_candidate_match_analysis table 
-- to use direct user_id column for better performance

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view match analysis for own jobs and candidates" ON public.job_candidate_match_analysis;
DROP POLICY IF EXISTS "Users can insert match analysis for own jobs and candidates" ON public.job_candidate_match_analysis;
DROP POLICY IF EXISTS "Users can update match analysis for own jobs and candidates" ON public.job_candidate_match_analysis;
DROP POLICY IF EXISTS "Users can delete match analysis for own jobs and candidates" ON public.job_candidate_match_analysis;

-- Create optimized policies using direct user_id column
CREATE POLICY "Users can view own match analysis" 
  ON public.job_candidate_match_analysis 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match analysis" 
  ON public.job_candidate_match_analysis 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own match analysis" 
  ON public.job_candidate_match_analysis 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_candidate_match_analysis.job_id 
      AND jobs.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.candidates 
      WHERE candidates.id = job_candidate_match_analysis.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own match analysis" 
  ON public.job_candidate_match_analysis 
  FOR DELETE 
  USING (auth.uid() = user_id);
-- Enhance job_candidate_match_analysis table for match-analysis API integration
-- This migration extends the existing table to support full API response data

-- Add user_id column for direct user association
ALTER TABLE public.job_candidate_match_analysis 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint for user_id (drop first if exists, then add)
ALTER TABLE public.job_candidate_match_analysis 
DROP CONSTRAINT IF EXISTS fk_job_candidate_match_analysis_user_id;

ALTER TABLE public.job_candidate_match_analysis 
ADD CONSTRAINT fk_job_candidate_match_analysis_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add JSONB columns for storing full API response data
ALTER TABLE public.job_candidate_match_analysis 
ADD COLUMN IF NOT EXISTS match_analysis JSONB,
ADD COLUMN IF NOT EXISTS requirement_evaluations JSONB,
ADD COLUMN IF NOT EXISTS summary JSONB,
ADD COLUMN IF NOT EXISTS recruiter_recommendations JSONB;

-- Update the overall_score constraint to support 0-100 scale (from API)
-- First drop the existing constraint
ALTER TABLE public.job_candidate_match_analysis 
DROP CONSTRAINT IF EXISTS check_overall_score_range;

-- Add new constraint for 0-100 scale
ALTER TABLE public.job_candidate_match_analysis 
ADD CONSTRAINT check_overall_score_range 
  CHECK (overall_score >= 0.00 AND overall_score <= 100.00);

-- Populate user_id for existing records by joining with jobs table
UPDATE public.job_candidate_match_analysis 
SET user_id = jobs.user_id
FROM public.jobs
WHERE public.job_candidate_match_analysis.job_id = jobs.id
  AND public.job_candidate_match_analysis.user_id IS NULL;

-- Make user_id NOT NULL after populating existing records
ALTER TABLE public.job_candidate_match_analysis 
ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_user_id 
  ON public.job_candidate_match_analysis(user_id);

-- Add GIN indexes for JSONB columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_match_analysis_gin 
  ON public.job_candidate_match_analysis USING GIN (match_analysis);

CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_requirement_evaluations_gin 
  ON public.job_candidate_match_analysis USING GIN (requirement_evaluations);

CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_summary_gin 
  ON public.job_candidate_match_analysis USING GIN (summary);

CREATE INDEX IF NOT EXISTS idx_job_candidate_match_analysis_recruiter_recommendations_gin 
  ON public.job_candidate_match_analysis USING GIN (recruiter_recommendations);

-- Add comments to document the new columns
COMMENT ON COLUMN public.job_candidate_match_analysis.user_id IS 'Direct reference to user for performance optimization';
COMMENT ON COLUMN public.job_candidate_match_analysis.match_analysis IS 'JSONB containing overall match analysis from API (overall_score, status, feedback, etc.)';
COMMENT ON COLUMN public.job_candidate_match_analysis.requirement_evaluations IS 'JSONB array containing detailed requirement-by-requirement evaluations from API';
COMMENT ON COLUMN public.job_candidate_match_analysis.summary IS 'JSONB containing candidate strengths and gaps analysis from API';
COMMENT ON COLUMN public.job_candidate_match_analysis.recruiter_recommendations IS 'JSONB containing interview strategy and alternative options from API';
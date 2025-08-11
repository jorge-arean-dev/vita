-- Remove redundant columns from job_candidate_match_analysis table
-- These values are now stored in the match_analysis JSONB column

-- Drop the constraint on overall_score before dropping the column
ALTER TABLE public.job_candidate_match_analysis 
DROP CONSTRAINT IF EXISTS check_overall_score_range;

-- Drop the index on overall_score before dropping the column  
DROP INDEX IF EXISTS idx_job_candidate_match_analysis_overall_score;

-- Remove redundant columns
ALTER TABLE public.job_candidate_match_analysis 
DROP COLUMN IF EXISTS overall_score,
DROP COLUMN IF EXISTS feedback;

-- Add comment to clarify the new structure
COMMENT ON TABLE public.job_candidate_match_analysis IS 'Stores comprehensive match analysis results from the match-analysis API. All analysis data is stored in JSONB columns for flexibility and performance.';
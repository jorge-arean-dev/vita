-- Add seniority_analysis JSONB column to job_candidate_match_analysis table
-- This stores the results of seniority level matching between candidate and job requirements

ALTER TABLE job_candidate_match_analysis 
ADD COLUMN seniority_analysis JSONB;

-- Expected JSON structure:
-- {
--   "required": "senior",
--   "candidate": "mid",
--   "candidateYears": 4,
--   "match": false,
--   "score": 0.6,
--   "feedback": "Candidate is slightly below required seniority level"
-- }
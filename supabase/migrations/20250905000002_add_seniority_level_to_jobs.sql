-- Add seniority level foreign key reference to jobs table
-- This allows jobs to specify required seniority level (optional)

ALTER TABLE jobs 
ADD COLUMN seniority_level_id UUID REFERENCES seniority_levels(id);
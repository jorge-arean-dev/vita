-- Update jobs table to reference seniority_levels.name instead of seniority_levels.id
-- Following the same pattern as job_requirements.type -> skill_types.name

-- Step 1: Add the new seniority_level TEXT column
ALTER TABLE jobs 
ADD COLUMN seniority_level TEXT;

-- Step 2: Migrate existing data from seniority_level_id to seniority_level (name values)
UPDATE jobs 
SET seniority_level = sl.name
FROM seniority_levels sl
WHERE jobs.seniority_level_id = sl.id;

-- Step 3: Add foreign key constraint referencing seniority_levels.name
ALTER TABLE jobs 
ADD CONSTRAINT jobs_seniority_level_fkey 
FOREIGN KEY (seniority_level) REFERENCES seniority_levels(name);

-- Step 4: Remove the old seniority_level_id column
ALTER TABLE jobs 
DROP COLUMN seniority_level_id;